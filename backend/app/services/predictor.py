import numpy as np
import pandas as pd
from typing import Dict, Any

from backend.app.ml.model_loader import ModelContainer
from backend.app.schemas.prediction import (
    PredictionRequest,
    PredictionResponse,
    FeatureFactor,
    EnergyRecommendation,
    BaselineComparison,
)
from backend.app.services.reliability import check_reliability
from backend.app.services.explainability import generate_shap_factors
from backend.app.services.recommendations import generate_energy_recommendations

def calculate_baseline_comparison(input_dict: Dict[str, Any], prediction_kwh: float) -> BaselineComparison:
    b_type = input_dict.get("building_type", "residential")
    area = float(input_dict.get("floor_area", 140))

    if b_type == "commercial":
        base_rate_per_sqm = 1.65 / 200.0
    elif b_type == "residential":
        base_rate_per_sqm = 0.85 / 140.0
    else:
        base_rate_per_sqm = 1.10 / 150.0

    regional_avg = round(base_rate_per_sqm * area, 2)
    benchmark_kwh = round(regional_avg * 0.65, 2)  # High efficiency standard (Energy Star)
    diff = round(prediction_kwh - regional_avg, 2)
    pct = round(((prediction_kwh - regional_avg) / max(regional_avg, 0.1)) * 100, 1)

    ratio = prediction_kwh / max(regional_avg, 0.1)
    if ratio <= 0.75:
        rating = "A+"
        status = "High Efficiency Passivhaus Standard"
    elif ratio <= 0.92:
        rating = "A"
        status = "Exceeds Regional Benchmark"
    elif ratio <= 1.12:
        rating = "B"
        status = "Normal Regional Baseline"
    elif ratio <= 1.35:
        rating = "C"
        status = "Moderately High Intensity"
    else:
        rating = "D"
        status = "Elevated Consumption"

    return BaselineComparison(
        benchmark_kwh=benchmark_kwh,
        regional_avg_kwh=regional_avg,
        difference_kwh=diff,
        percent_vs_avg=pct,
        efficiency_rating=rating,
        status_label=status,
    )

def run_prediction(req: PredictionRequest) -> PredictionResponse:
    container = ModelContainer.get_instance()
    if not container.is_loaded:
        container.load()
        
    model = container.model
    preprocessor = container.preprocessor
    metadata = container.metadata
    
    # Construct single-row DataFrame
    input_dict = req.model_dump()
    raw_df = pd.DataFrame([input_dict])
    
    # Preprocess identically to training
    transformed_df = preprocessor.transform(raw_df)
    
    # Predict real-time
    raw_pred = float(model.predict(transformed_df)[0])
    prediction_kwh = max(0.05, round(raw_pred, 2))
    
    # Prediction Interval (Defensible method based on empirical validation residual quantiles)
    pi_meta = metadata.get("prediction_interval", {})
    margin = float(pi_meta.get("margin_kwh", 0.2909))
    
    # Out-of-Distribution / Reliability Check
    thresholds = metadata.get("reliability_thresholds", {})
    reliability, warning = check_reliability(input_dict, thresholds)
    
    # If reliability is LOW/MEDIUM, expand uncertainty bounds accordingly
    if reliability == "LOW":
        margin *= 1.6
    elif reliability == "MEDIUM":
        margin *= 1.25
        
    lower_bound = max(0.05, round(prediction_kwh - margin, 2))
    upper_bound = round(prediction_kwh + margin, 2)
    
    # TreeSHAP Explanation
    base_val, shap_factors_raw = generate_shap_factors(model, transformed_df, input_dict)
    factors = [FeatureFactor(**f) for f in shap_factors_raw]
    
    # Energy Recommendations
    recs_raw = generate_energy_recommendations(input_dict, prediction_kwh, shap_factors_raw)
    recommendations = [EnergyRecommendation(**r) for r in recs_raw]

    # Baseline Comparison
    baseline_comp = calculate_baseline_comparison(input_dict, prediction_kwh)

    model_version = metadata.get("model_version", "xgboost-v1")
    
    return PredictionResponse(
        prediction_kwh=prediction_kwh,
        lower_bound=lower_bound,
        upper_bound=upper_bound,
        reliability=reliability,
        reliability_warning=warning,
        model_version=model_version,
        base_value=base_val,
        factors=factors,
        recommendations=recommendations,
        baseline_comparison=baseline_comp,
    )
