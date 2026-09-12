import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from ml.data.download_data import download_dataset, CSV_PATH
from ml.training.feature_engineering import EnergyFeatureEngineer, FEATURE_COLUMNS, NUMERIC_FEATURES

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
EVAL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "evaluation")
BACKEND_MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "backend", "app", "models")

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(EVAL_DIR, exist_ok=True)
os.makedirs(BACKEND_MODEL_DIR, exist_ok=True)

def load_and_prepare_data():
    """
    Loads genuine UCI Appliances Energy Prediction dataset, aggregates to hourly intervals,
    and constructs realistic building and temporal attributes.
    """
    download_dataset()
    print(f"Loading raw dataset from {CSV_PATH}...")
    df_raw = pd.read_csv(CSV_PATH)
    
    # Parse timestamp
    df_raw["date"] = pd.to_datetime(df_raw["date"])
    df_raw = df_raw.sort_values("date").reset_index(drop=True)
    
    # Aggregate 10-minute sensor readings to hourly resolution
    # Energy in Wh summed over 1 hour, divided by 1000 to convert to kWh
    df_raw.set_index("date", inplace=True)
    
    hourly_energy = df_raw["Appliances"].resample("1h").sum() / 1000.0
    hourly_lights = df_raw["lights"].resample("1h").sum()
    hourly_temp = df_raw["T_out"].resample("1h").mean()
    hourly_humidity = df_raw["RH_out"].resample("1h").mean()
    hourly_pressure = df_raw["Press_mm_hg"].resample("1h").mean()
    hourly_wind = df_raw["Windspeed"].resample("1h").mean()
    
    df_hourly = pd.DataFrame({
        "consumption_kwh": hourly_energy,
        "lights_wh": hourly_lights,
        "temperature": hourly_temp,
        "humidity": hourly_humidity,
        "pressure": hourly_pressure,
        "wind_speed": hourly_wind,
    }).dropna().reset_index()
    
    # Add temporal features
    df_hourly["hour"] = df_hourly["date"].dt.hour
    df_hourly["day_of_week"] = df_hourly["date"].dt.dayofweek
    df_hourly["month"] = df_hourly["date"].dt.month
    
    # Lagged 1-hour consumption (autoregressive signal, strictly historical, no lookahead)
    df_hourly["previous_consumption"] = df_hourly["consumption_kwh"].shift(1)
    df_hourly = df_hourly.dropna().reset_index(drop=True)
    
    # Generate realistic multi-building records anchored to measured physical loads
    # Candanedo experimental home: baseline floor area ~180 m², 4 occupants, residential
    # We sample realistic building distributions to cover residential (120-250 m²),
    # commercial (200-800 m²), and other (100-300 m²) with corresponding load scaling.
    np.random.seed(42)
    n = len(df_hourly)
    
    building_types = np.random.choice(["residential", "commercial", "other"], size=n, p=[0.70, 0.20, 0.10])
    
    floor_areas = []
    occupants = []
    appliance_usages = []
    scaled_consumptions = []
    scaled_prevs = []
    
    for i in range(n):
        btype = building_types[i]
        if btype == "residential":
            area = float(np.random.normal(150, 35))
            area = np.clip(area, 60, 350)
            occ = int(np.random.choice([1, 2, 3, 4, 5], p=[0.15, 0.30, 0.25, 0.20, 0.10]))
            scale = (area / 180.0) * (0.8 + 0.08 * occ)
        elif btype == "commercial":
            area = float(np.random.normal(350, 80))
            area = np.clip(area, 180, 800)
            occ = int(np.random.choice([4, 8, 12, 16], p=[0.25, 0.35, 0.25, 0.15]))
            # Commercial has higher daytime office intensity
            hour = df_hourly["hour"].iloc[i]
            daytime_mult = 1.35 if (8 <= hour <= 18) else 0.85
            scale = (area / 180.0) * 0.9 * daytime_mult
        else:
            area = float(np.random.normal(160, 40))
            area = np.clip(area, 70, 350)
            occ = int(np.random.choice([2, 3, 4], p=[0.3, 0.4, 0.3]))
            scale = (area / 180.0)
            
        base_kwh = df_hourly["consumption_kwh"].iloc[i]
        prev_kwh = df_hourly["previous_consumption"].iloc[i]
        
        # Categorize appliance usage based on sub-metered intensity
        lights = df_hourly["lights_wh"].iloc[i]
        if lights == 0 and base_kwh < 0.3:
            usage = "low"
        elif lights < 30 and base_kwh < 0.7:
            usage = "medium"
        elif base_kwh < 1.4:
            usage = "high"
        else:
            usage = "very_high"
            
        floor_areas.append(round(float(area), 1))
        occupants.append(occ)
        appliance_usages.append(usage)
        scaled_consumptions.append(round(float(base_kwh * scale), 3))
        scaled_prevs.append(round(float(prev_kwh * scale), 3))
        
    df_prepared = pd.DataFrame({
        "date": df_hourly["date"],
        "building_type": building_types,
        "floor_area": floor_areas,
        "occupants": occupants,
        "temperature": df_hourly["temperature"].round(1),
        "humidity": df_hourly["humidity"].round(1),
        "hour": df_hourly["hour"],
        "day_of_week": df_hourly["day_of_week"],
        "month": df_hourly["month"],
        "previous_consumption": scaled_prevs,
        "appliance_usage": appliance_usages,
        "consumption_kwh": scaled_consumptions,
    })
    
    print(f"Prepared {len(df_prepared)} hourly historical records.")
    return df_prepared

def train_and_evaluate():
    df = load_and_prepare_data()
    
    # 6. TIME-SERIES VALIDATION (Strictly Chronological Split)
    # 70% Train, 15% Validation, 15% Test
    n = len(df)
    train_end = int(n * 0.70)
    val_end = int(n * 0.85)
    
    df_train = df.iloc[:train_end].copy()
    df_val = df.iloc[train_end:val_end].copy()
    df_test = df.iloc[val_end:].copy()
    
    print(f"Train set: {len(df_train)} records ({df_train['date'].iloc[0]} to {df_train['date'].iloc[-1]})")
    print(f"Validation set: {len(df_val)} records ({df_val['date'].iloc[0]} to {df_val['date'].iloc[-1]})")
    print(f"Test set (unseen): {len(df_test)} records ({df_test['date'].iloc[0]} to {df_test['date'].iloc[-1]})")
    
    # Preprocessor / Feature Engineer
    preprocessor = EnergyFeatureEngineer()
    preprocessor.fit(df_train)
    
    X_train = preprocessor.transform(df_train)
    y_train = df_train["consumption_kwh"].values
    
    X_val = preprocessor.transform(df_val)
    y_val = df_val["consumption_kwh"].values
    
    X_test = preprocessor.transform(df_test)
    y_test = df_test["consumption_kwh"].values
    
    # Models to Compare (Section 7)
    models = {
        "Linear Regression": LinearRegression(),
        "Random Forest": RandomForestRegressor(n_estimators=80, max_depth=12, min_samples_leaf=2, random_state=42, n_jobs=2),
        "XGBoost": XGBRegressor(n_estimators=140, learning_rate=0.06, max_depth=5, subsample=0.85, colsample_bytree=0.85, random_state=42, n_jobs=2),
    }
    
    results = {}
    fitted_models = {}
    
    for name, model in models.items():
        print(f"Training {name}...", flush=True)
        model.fit(X_train, y_train)
        fitted_models[name] = model
        
        # Validation predictions
        y_val_pred = model.predict(X_val)
        val_mae = float(mean_absolute_error(y_val, y_val_pred))
        val_rmse = float(np.sqrt(mean_squared_error(y_val, y_val_pred)))
        val_r2 = float(r2_score(y_val, y_val_pred))
        
        # Test predictions (unseen)
        y_test_pred = model.predict(X_test)
        test_mae = float(mean_absolute_error(y_test, y_test_pred))
        test_rmse = float(np.sqrt(mean_squared_error(y_test, y_test_pred)))
        test_r2 = float(r2_score(y_test, y_test_pred))
        
        results[name] = {
            "validation": {
                "mae": round(val_mae, 4),
                "rmse": round(val_rmse, 4),
                "r2": round(val_r2, 4),
            },
            "test": {
                "mae": round(test_mae, 4),
                "rmse": round(test_rmse, 4),
                "r2": round(test_r2, 4),
            }
        }
        print(f"  {name} -> Val R2: {val_r2:.4f}, Val RMSE: {val_rmse:.4f} | Test R2: {test_r2:.4f}, Test RMSE: {test_rmse:.4f}", flush=True)
        
    # Select best model based on validation RMSE
    best_model_name = min(results.keys(), key=lambda k: results[k]["validation"]["rmse"])
    best_model = fitted_models[best_model_name]
    print(f"\nBest Model Selected: {best_model_name}", flush=True)
    
    # 8. TRUSTWORTHY PREDICTIONS: Compute empirical prediction intervals
    val_residuals = np.abs(y_val - best_model.predict(X_val))
    interval_half_width_90 = float(np.percentile(val_residuals, 90))
    interval_half_width_95 = float(np.percentile(val_residuals, 95))
    val_residual_std = float(np.std(val_residuals))
    val_residual_mean = float(np.mean(val_residuals))
    
    print(f"Empirical 90% prediction interval margin: +/- {interval_half_width_90:.4f} kWh", flush=True)
    
    # 9. RELIABILITY / OOD CHECK: Record training feature distributions
    feature_stats = {}
    check_features = ["floor_area", "occupants", "temperature", "humidity", "previous_consumption"]
    for feat in check_features:
        vals = df_train[feat].values
        q25, q75 = np.percentile(vals, [25, 75])
        iqr = q75 - q25
        feature_stats[feat] = {
            "min": float(np.min(vals)),
            "max": float(np.max(vals)),
            "p01": float(np.percentile(vals, 1)),
            "p25": float(q25),
            "p75": float(q75),
            "p99": float(np.percentile(vals, 99)),
            "iqr": float(iqr),
            "mean": float(np.mean(vals)),
            "std": float(np.std(vals)),
        }
        
    from datetime import timezone
    metadata = {
        "model_type": best_model_name,
        "model_version": "xgboost-v1" if "XGBoost" in best_model_name else f"{best_model_name.lower().replace(' ', '-')}-v1",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset": {
            "name": "UCI Appliances Energy Prediction",
            "total_records": len(df),
            "train_records": len(df_train),
            "val_records": len(df_val),
            "test_records": len(df_test),
            "start_date": str(df_train["date"].iloc[0]),
            "end_date": str(df_test["date"].iloc[-1]),
        },
        "features": FEATURE_COLUMNS,
        "prediction_interval": {
            "method": "Empirical validation residual quantile (90% confidence)",
            "margin_kwh": round(interval_half_width_90, 4),
            "margin_95_kwh": round(interval_half_width_95, 4),
            "residual_std": round(val_residual_std, 4),
            "residual_mean": round(val_residual_mean, 4),
        },
        "reliability_thresholds": feature_stats,
        "selected_metrics": results[best_model_name],
    }
    
    # Save Model Artifacts
    model_path = os.path.join(MODEL_DIR, "energy_model.joblib")
    prep_path = os.path.join(MODEL_DIR, "preprocessing.joblib")
    meta_path = os.path.join(MODEL_DIR, "model_metadata.json")
    metrics_path = os.path.join(EVAL_DIR, "metrics.json")
    
    joblib.dump(best_model, model_path)
    joblib.dump(preprocessor, prep_path)
    
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
        
    with open(metrics_path, "w") as f:
        json.dump(results, f, indent=2)
        
    # Copy to backend app models directory
    joblib.dump(best_model, os.path.join(BACKEND_MODEL_DIR, "energy_model.joblib"))
    joblib.dump(preprocessor, os.path.join(BACKEND_MODEL_DIR, "preprocessing.joblib"))
    with open(os.path.join(BACKEND_MODEL_DIR, "model_metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)
    with open(os.path.join(BACKEND_MODEL_DIR, "metrics.json"), "w") as f:
        json.dump(results, f, indent=2)
        
    print(f"\nArtifacts successfully written:", flush=True)
    print(f"  - Model: {model_path}", flush=True)
    print(f"  - Preprocessor: {prep_path}", flush=True)
    print(f"  - Metadata: {meta_path}", flush=True)
    print(f"  - Metrics: {metrics_path}", flush=True)
    print(f"  - Synced to backend/app/models/", flush=True)
    return results

if __name__ == "__main__":
    train_and_evaluate()
