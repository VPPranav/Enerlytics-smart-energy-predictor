import numpy as np
import pandas as pd
import xgboost as xgb
from typing import List, Dict, Any, Tuple

FEATURE_DISPLAY_NAMES = {
    "floor_area": "Floor Area",
    "occupants": "Occupants",
    "temperature": "Ambient Temperature",
    "humidity": "Relative Humidity",
    "hour": "Hour of Day",
    "day_of_week": "Day of Week",
    "month": "Month of Year",
    "previous_consumption": "Previous Hour Consumption",
    "is_weekend": "Weekend Indicator",
    "is_peak_hour": "Peak Demand Schedule",
    "temp_humidity_index": "Temperature-Humidity Stress Index",
    "area_per_occupant": "Floor Area per Occupant",
    "building_type_commercial": "Commercial Facility Type",
    "building_type_residential": "Residential Home Type",
    "building_type_other": "Specialized Building Type",
    "appliance_usage_high": "High Appliance Activity",
    "appliance_usage_very_high": "Heavy Appliance Intensity",
    "appliance_usage_low": "Low Appliance Activity",
    "appliance_usage_medium": "Normal Baseline Activity",
}

def generate_shap_factors(
    model,
    transformed_df: pd.DataFrame,
    raw_input: Dict[str, Any]
) -> Tuple[float, List[Dict[str, Any]]]:
    """
    Computes exact TreeSHAP values using XGBoost's native Lundberg TreeSHAP implementation
    (pred_contribs=True).
    Returns (base_value, top_factors).
    """
    base_val = 0.65  # Default empirical baseline expectation in kWh
    try:
        booster = model.get_booster() if hasattr(model, "get_booster") else model
        dmat = xgb.DMatrix(transformed_df)
        # Lundberg TreeSHAP exact contributions: array of shape (1, num_features + 1)
        contribs = booster.predict(dmat, pred_contribs=True)[0]
        # The last element is the expected base value / intercept E[f(x)]
        feature_vals = contribs[:-1]
        base_val = round(float(contribs[-1]), 4)
    except Exception as e:
        print(f"[Explainability] Warning in SHAP computation: {e}")
        # Fallback to zeros
        feature_vals = np.zeros(len(transformed_df.columns))

    feature_names = list(transformed_df.columns)
    
    contributions = []
    for f_name, s_val in zip(feature_names, feature_vals):
        contributions.append({
            "feature": f_name,
            "display_name": FEATURE_DISPLAY_NAMES.get(f_name, f_name.replace("_", " ").title()),
            "shap_value": round(float(s_val), 4),
            "abs_val": abs(float(s_val)),
            "impact": "positive" if float(s_val) >= 0 else "negative",
        })
        
    # Sort by absolute SHAP impact magnitude descending
    contributions.sort(key=lambda x: x["abs_val"], reverse=True)
    
    # Calculate sum of all impacts for percentage attribution
    total_abs = sum(c["abs_val"] for c in contributions) or 1.0

    # Select top 6 most impactful features
    top_factors = contributions[:6]
    
    for factor in top_factors:
        f_name = factor["feature"]
        s_val = factor["shap_value"]
        impact_dir = "increases" if s_val >= 0 else "reduces"
        mag_kwh = abs(s_val)
        factor["percent_impact"] = round((factor["abs_val"] / total_abs) * 100, 1)
        
        if f_name == "previous_consumption":
            factor["description"] = f"Recent energy demand of {raw_input.get('previous_consumption', 0):.2f} kWh {impact_dir} predicted load by {mag_kwh:.3f} kWh due to baseline equipment persistence."
        elif f_name == "floor_area":
            factor["description"] = f"Building footprint of {raw_input.get('floor_area', 0)} m² {impact_dir} base heating/cooling and lighting load by {mag_kwh:.3f} kWh."
        elif f_name == "temperature":
            factor["description"] = f"Current ambient temperature ({raw_input.get('temperature', 0)}°C) {impact_dir} energy consumption by {mag_kwh:.3f} kWh through thermal comfort demand."
        elif f_name == "is_peak_hour" or f_name == "hour":
            hr = raw_input.get("hour", 12)
            factor["description"] = f"Time of day ({hr:02d}:00) {impact_dir} demand by {mag_kwh:.3f} kWh matching typical occupancy schedule cycles."
        elif f_name == "occupants":
            factor["description"] = f"Occupant count of {raw_input.get('occupants', 1)} persons {impact_dir} consumption by {mag_kwh:.3f} kWh from domestic activity."
        elif "appliance_usage" in f_name:
            factor["description"] = f"Operational intensity level {impact_dir} load by {mag_kwh:.3f} kWh."
        elif "building_type" in f_name:
            factor["description"] = f"Building classification ({raw_input.get('building_type', 'residential')}) {impact_dir} load by {mag_kwh:.3f} kWh."
        elif f_name == "humidity":
            factor["description"] = f"Relative humidity ({raw_input.get('humidity', 50)}%) {impact_dir} load by {mag_kwh:.3f} kWh via latent thermal exchange."
        else:
            factor["description"] = f"Factor {impact_dir} predicted electricity consumption by {mag_kwh:.3f} kWh."
            
    return base_val, top_factors
