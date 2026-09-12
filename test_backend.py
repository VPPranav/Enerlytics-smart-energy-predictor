import requests
import json

BASE = "http://127.0.0.1:8000/api"

def test_all():
    print("=== 1. TESTING HEALTH ===")
    h = requests.get(f"{BASE}/health", timeout=5)
    print("Health Status:", h.status_code, h.json())
    assert h.status_code == 200
    assert h.json()["status"] == "online"
    assert h.json()["model_loaded"] is True

    print("\n=== 2. TESTING MODEL METRICS & DIURNAL PROFILE ===")
    m = requests.get(f"{BASE}/model/metrics", timeout=5)
    assert m.status_code == 200
    print("Metrics Status:", m.status_code)
    
    dp = requests.get(f"{BASE}/model/diurnal-profile", timeout=5)
    assert dp.status_code == 200
    dp_data = dp.json()
    print("Diurnal Hourly Steps:", len(dp_data["hourly_data"]))
    assert len(dp_data["hourly_data"]) == 24
    assert dp_data["hourly_data"][0]["hour"] == "00:00"
    assert dp_data["hourly_data"][23]["hour"] == "23:00"
    print("  * Overnight Min:", dp_data["summary"]["overnight_baseline_avg"], "kWh")
    print("  * Morning Peak:", dp_data["summary"]["morning_surge_peak"], "kWh at", dp_data["summary"]["morning_surge_hour"])
    print("  * Evening Peak:", dp_data["summary"]["evening_peak_max"], "kWh at", dp_data["summary"]["evening_peak_hour"])

    print("\n=== 3. TESTING MODEL COMPARISON ENDPOINT ===")
    mc = requests.get(f"{BASE}/model/comparison", timeout=5)
    assert mc.status_code == 200
    mc_data = mc.json()
    print("Compared Models:", [m["model_name"] for m in mc_data["models"]])
    assert len(mc_data["models"]) >= 3
    assert mc_data["selected_model"] == "XGBoost"

    print("\n=== 4. TESTING RESIDENTIAL PREDICTION WITH SHAP & RECOMMENDATIONS ===")
    res_payload = {
        "building_type": "residential",
        "floor_area": 140.0,
        "occupants": 3,
        "temperature": 18.0,
        "humidity": 55.0,
        "hour": 19,
        "day_of_week": 2,
        "month": 4,
        "previous_consumption": 1.10,
        "appliance_usage": "medium"
    }
    p1 = requests.post(f"{BASE}/predict", json=res_payload, timeout=5)
    print("Predict Status:", p1.status_code)
    assert p1.status_code == 200
    d1 = p1.json()
    print(f"  Predicted kWh: {d1['prediction_kwh']}")
    print(f"  Base Value E[f(x)]: {d1.get('base_value')}")
    print(f"  Expected Range: {d1['lower_bound']} - {d1['upper_bound']} kWh")
    print(f"  Reliability: {d1['reliability']}")
    print(f"  SHAP Factors Count: {len(d1['factors'])}")
    for f in d1["factors"][:3]:
        print(f"    * {f['display_name']}: {f['shap_value']:+.4f} kWh ({f['impact']}) - {f.get('percent_impact', 0)}%")
    
    # Recommendations check
    recs = d1.get("recommendations", [])
    print(f"  Generated Energy Recommendations: {len(recs)}")
    for r in recs:
        print(f"    * [{r['priority']}] {r['title']} - Save ~{r['kwh_savings_hourly']} kWh (${r['monthly_savings_usd']}/mo)")

    # Baseline comparison check
    bc = d1.get("baseline_comparison")
    assert bc is not None
    print(f"  Baseline Benchmark: Rating {bc['efficiency_rating']} ({bc['status_label']})")
    assert d1["prediction_kwh"] > 0
    assert d1["reliability"] == "HIGH"

    print("\n=== 5. TESTING OUT-OF-DISTRIBUTION (OOD) INPUT (75°C) ===")
    ood_payload = dict(res_payload)
    ood_payload["temperature"] = 75.0
    p2 = requests.post(f"{BASE}/predict", json=ood_payload, timeout=5)
    print("OOD Predict Status:", p2.status_code)
    d2 = p2.json()
    print(f"  OOD Reliability: {d2['reliability']}")
    print(f"  OOD Warning: {d2['reliability_warning']}")
    assert d2["reliability"] in ["MEDIUM", "LOW"]
    assert d2["reliability_warning"] is not None

    print("\n=== 6. TESTING OPEN-METEO WEATHER CURRENT & HOURLY FORECAST ===")
    w = requests.get(f"{BASE}/weather/current", params={"city": "London"}, timeout=8)
    print("Weather Status:", w.status_code)
    if w.status_code == 200:
        w_data = w.json()
        print(f"  Current: {w_data.get('city')} | Temp: {w_data.get('temperature')}°C | Humidity: {w_data.get('humidity')}% | Source: {w_data.get('source')}")

    f = requests.get(f"{BASE}/weather/forecast", params={"city": "London"}, timeout=8)
    print("Hourly Forecast Status:", f.status_code)
    if f.status_code == 200:
        f_data = f.json()
        print(f"  Forecast Hours Count: {len(f_data.get('forecast_hours', []))}")
        assert len(f_data.get("forecast_hours", [])) == 24

    print("\n=======================================================")
    print(" >>> ALL BACKEND REST API & ML FEATURES PASSED! <<<")
    print("=======================================================")

if __name__ == "__main__":
    test_all()
