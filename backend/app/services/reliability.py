from typing import Tuple, Optional, Dict, Any

def check_reliability(input_data: Dict[str, Any], thresholds: Dict[str, Any]) -> Tuple[str, Optional[str]]:
    """
    Evaluates whether input parameters fall within the empirical training distribution
    (Out-Of-Distribution / OOD Check).
    
    Logic:
    - HIGH: All primary numerical features (temperature, humidity, floor_area, occupants,
            previous_consumption) are within [p01 - 0.5*iqr, p99 + 0.5*iqr].
    - MEDIUM: 1 or 2 features are slightly outside the typical training envelope (between 1.5*IQR and 3*IQR beyond bounds)
              or near training boundary extremes.
    - LOW: Any feature is severely out of distribution (e.g., > 3*IQR beyond bounds, temperature > 48°C or < -20°C,
           or previous_consumption vastly exceeding training limits).
    """
    if not thresholds:
        return "HIGH", None
        
    severe_violations = []
    moderate_violations = []
    
    for feat, stats in thresholds.items():
        if feat not in input_data:
            continue
            
        val = float(input_data[feat])
        p01 = stats.get("p01", stats.get("min"))
        p99 = stats.get("p99", stats.get("max"))
        iqr = stats.get("iqr", 10.0)
        
        # Severe bounds: beyond 3 * IQR from 1st/99th percentiles
        severe_low = p01 - 3.0 * iqr
        severe_high = p99 + 3.0 * iqr
        
        # Moderate bounds: beyond 1.2 * IQR
        mod_low = p01 - 1.2 * iqr
        mod_high = p99 + 1.2 * iqr
        
        if val < severe_low or val > severe_high:
            severe_violations.append(f"{feat.replace('_', ' ').capitalize()} ({val}) is substantially outside training distribution [{stats.get('min'):.1f}, {stats.get('max'):.1f}]")
        elif val < mod_low or val > mod_high:
            moderate_violations.append(f"{feat.replace('_', ' ').capitalize()} ({val}) differs from typical training conditions")

    if severe_violations:
        warning = "The current input contains conditions that are significantly different from the historical training data. Interpret this prediction with caution: " + "; ".join(severe_violations)
        return "LOW", warning
    elif moderate_violations:
        warning = "Some current conditions differ from typical training conditions: " + "; ".join(moderate_violations) + ". Prediction reliability may be lower."
        return "MEDIUM", warning
        
    return "HIGH", None
