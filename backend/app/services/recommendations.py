from typing import List, Dict, Any

def generate_energy_recommendations(
    raw_input: Dict[str, Any],
    prediction_kwh: float,
    shap_factors: List[Dict[str, Any]],
    cost_per_kwh: float = 0.16
) -> List[Dict[str, Any]]:
    """
    Generates actionable, prioritized energy-saving recommendations
    derived from input conditions, time-of-use schedules, and SHAP attribution.
    """
    recs = []
    hour = int(raw_input.get("hour", 12))
    temp = float(raw_input.get("temperature", 20.0))
    prev_kwh = float(raw_input.get("previous_consumption", 1.0))
    appliance_usage = str(raw_input.get("appliance_usage", "medium"))
    building_type = str(raw_input.get("building_type", "residential"))
    floor_area = float(raw_input.get("floor_area", 140))

    # 1. Peak Demand Shifting Recommendation (17:00 - 21:00)
    is_peak = 17 <= hour <= 21
    if is_peak:
        peak_potential_pct = 0.22
        kwh_savings = round(prediction_kwh * peak_potential_pct, 2)
        monthly_savings = round(kwh_savings * 30 * cost_per_kwh, 2)
        recs.append({
            "id": "peak_shift",
            "title": "Shift Heavy Appliances Off-Peak",
            "priority": "HIGH",
            "category": "Demand Response",
            "kwh_savings_hourly": kwh_savings,
            "monthly_savings_usd": monthly_savings,
            "difficulty": "Easy",
            "action": f"Current prediction is during peak grid strain ({hour:02d}:00). Delaying dishwasher, laundry, or EV charging until after 22:00 or before 16:00 avoids peak tariff rates and reduces immediate load by ~{kwh_savings} kWh.",
        })
    elif 8 <= hour <= 12 and appliance_usage in ["high", "very_high"]:
        kwh_savings = round(prediction_kwh * 0.15, 2)
        monthly_savings = round(kwh_savings * 30 * cost_per_kwh, 2)
        recs.append({
            "id": "morning_stagger",
            "title": "Stagger Morning Appliance Startups",
            "priority": "MEDIUM",
            "category": "Load Balancing",
            "kwh_savings_hourly": kwh_savings,
            "monthly_savings_usd": monthly_savings,
            "difficulty": "Easy",
            "action": f"Morning coincidence load is elevated. Run heating cycles and high-draw equipment sequentially rather than concurrently to prevent demand spikes.",
        })

    # 2. HVAC & Thermal Setpoint Optimization
    if temp < 10:
        # Heating season
        kwh_savings = round(prediction_kwh * 0.12, 2)
        monthly_savings = round(kwh_savings * 30 * cost_per_kwh, 2)
        recs.append({
            "id": "heating_setpoint",
            "title": "Lower Thermostat Setpoint by 1°C - 2°C",
            "priority": "HIGH" if temp < 5 else "MEDIUM",
            "category": "Thermal Comfort",
            "kwh_savings_hourly": kwh_savings,
            "monthly_savings_usd": monthly_savings,
            "difficulty": "Immediate",
            "action": f"Ambient temperature is cold ({temp}°C). Dialing down heating by 1°C achieves approximately 7-10% reduction in thermal energy consumption while preserving interior comfort.",
        })
    elif temp > 26:
        # Cooling season
        kwh_savings = round(prediction_kwh * 0.14, 2)
        monthly_savings = round(kwh_savings * 30 * cost_per_kwh, 2)
        recs.append({
            "id": "cooling_setpoint",
            "title": "Optimize Air Conditioning Setpoint to 24°C - 25°C",
            "priority": "HIGH",
            "category": "Thermal Comfort",
            "kwh_savings_hourly": kwh_savings,
            "monthly_savings_usd": monthly_savings,
            "difficulty": "Immediate",
            "action": f"High outdoor temperature ({temp}°C) drives significant cooling load. Setting thermostat to 25°C and utilizing ceiling fan air circulation saves ~{kwh_savings} kWh/hr.",
        })

    # 3. Previous Consumption Autoregressive / Phantom Load Mitigation
    if prev_kwh > 1.2:
        kwh_savings = round((prev_kwh - 0.7) * 0.4, 2)
        monthly_savings = round(kwh_savings * 30 * cost_per_kwh, 2)
        recs.append({
            "id": "phantom_load",
            "title": "Mitigate Standby & Phantom Equipment Draw",
            "priority": "HIGH" if prev_kwh > 2.0 else "MEDIUM",
            "category": "Baseload Efficiency",
            "kwh_savings_hourly": kwh_savings,
            "monthly_savings_usd": monthly_savings,
            "difficulty": "Moderate",
            "action": f"Elevated lag-1h consumption ({prev_kwh:.2f} kWh) indicates continuous background loads. Smart power strips and automatic equipment shutdown for entertainment and workstation clusters reduce steady-state draw.",
        })

    # 4. Appliance Intensity Tuning
    if appliance_usage in ["high", "very_high"]:
        kwh_savings = round(prediction_kwh * 0.18, 2)
        monthly_savings = round(kwh_savings * 30 * cost_per_kwh, 2)
        recs.append({
            "id": "appliance_eco",
            "title": "Enable Eco Modes on Washers & Heat Pumps",
            "priority": "MEDIUM",
            "category": "Operational Mode",
            "kwh_savings_hourly": kwh_savings,
            "monthly_savings_usd": monthly_savings,
            "difficulty": "Easy",
            "action": "Switch major appliances to low-temperature eco-cycles. Modern detergent formulations clean effectively at 30°C vs 60°C, cutting laundry thermal load by over 50%.",
        })

    # 5. Building Footprint / Long-term Efficiency
    if floor_area > 200:
        recs.append({
            "id": "zoning_control",
            "title": "Zone-Based Conditioning for Large Footprints",
            "priority": "LOW",
            "category": "Infrastructure",
            "kwh_savings_hourly": round(prediction_kwh * 0.10, 2),
            "monthly_savings_usd": round(prediction_kwh * 0.10 * 30 * cost_per_kwh, 2),
            "difficulty": "Capital Project",
            "action": f"With {floor_area} m² footprint, conditioning unoccupied spaces is wasteful. Implement multi-zone smart thermostatic valves or dampers to condition only occupied zones.",
        })

    return recs[:4]  # Return top 4 most pertinent recommendations
