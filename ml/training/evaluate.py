import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from ml.training.feature_engineering import EnergyFeatureEngineer
from ml.data.download_data import CSV_PATH

def run_evaluation():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(base_dir, "models", "energy_model.joblib")
    prep_path = os.path.join(base_dir, "models", "preprocessing.joblib")
    meta_path = os.path.join(base_dir, "models", "model_metadata.json")
    metrics_path = os.path.join(base_dir, "evaluation", "metrics.json")
    
    if not os.path.exists(model_path) or not os.path.exists(metrics_path):
        print("Models not found. Please train first via: python ml/training/train.py")
        return
        
    with open(metrics_path, "r") as f:
        metrics = json.load(f)
        
    with open(meta_path, "r") as f:
        meta = json.load(f)
        
    print("=" * 65)
    print("       ENERLYTICS MODEL EVALUATION REPORT")
    print("=" * 65)
    print(f"Selected Production Model: {meta.get('model_type')} ({meta.get('model_version')})")
    print(f"Dataset: {meta.get('dataset', {}).get('name')}")
    print(f"Total Records: {meta.get('dataset', {}).get('total_records')}")
    print("-" * 65)
    print(f"{'Model':<22} | {'Val MAE':<9} | {'Val RMSE':<9} | {'Val R²':<8} | {'Test R²':<8}")
    print("-" * 65)
    for m_name, vals in metrics.items():
        v = vals.get("validation", {})
        t = vals.get("test", {})
        print(f"{m_name:<22} | {v.get('mae', 0):<9.4f} | {v.get('rmse', 0):<9.4f} | {v.get('r2', 0):<8.4f} | {t.get('r2', 0):<8.4f}")
    print("-" * 65)
    pi = meta.get("prediction_interval", {})
    print(f"90% Prediction Interval Margin: ± {pi.get('margin_kwh')} kWh")
    print(f"Residual Standard Deviation:      {pi.get('residual_std')} kWh")
    print("=" * 65)

if __name__ == "__main__":
    run_evaluation()
