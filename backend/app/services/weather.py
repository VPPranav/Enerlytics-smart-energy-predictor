import requests
import pandas as pd
import requests_cache
from retry_requests import retry
import openmeteo_requests
from typing import Optional, Dict, Any, List

GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

# Setup Open-Meteo API client with cache and retry on error as specified
cache_session = requests_cache.CachedSession('.cache', expire_after=3600)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)
openmeteo = openmeteo_requests.Client(session=retry_session)

def geocode_city(city_name: str) -> Optional[Dict[str, Any]]:
    """Resolves city name to latitude, longitude, and country display name."""
    try:
        geo_resp = requests.get(
            GEOCODING_URL,
            params={"name": city_name, "count": 1, "language": "en", "format": "json"},
            timeout=6
        )
        geo_resp.raise_for_status()
        geo_data = geo_resp.json()
        results = geo_data.get("results")
        if not results:
            return None
        loc = results[0]
        return {
            "name": f"{loc.get('name')}, {loc.get('country_code', '').upper()}",
            "latitude": float(loc["latitude"]),
            "longitude": float(loc["longitude"]),
        }
    except Exception as e:
        print(f"[WeatherService] Geocoding error for '{city_name}': {e}")
        return None

def fetch_weather_by_city(city_name: str) -> Optional[Dict[str, Any]]:
    """
    Fetches real-time weather using Open-Meteo Client with caching and retries.
    """
    try:
        geo = geocode_city(city_name)
        if not geo:
            return None
        
        lat = geo["latitude"]
        lon = geo["longitude"]
        display_name = geo["name"]

        params = {
            "latitude": lat,
            "longitude": lon,
            "current": ["temperature_2m", "relative_humidity_2m", "surface_pressure", "wind_speed_10m"],
        }
        
        responses = openmeteo.weather_api(FORECAST_URL, params=params)
        response = responses[0]
        
        current = response.Current()
        # Variables: temperature_2m (0), relative_humidity_2m (1), surface_pressure (2), wind_speed_10m (3)
        temp = round(float(current.Variables(0).Value()), 1)
        humidity = round(float(current.Variables(1).Value()), 1)
        pressure = round(float(current.Variables(2).Value()), 1)
        wind = round(float(current.Variables(3).Value()), 1)

        return {
            "city": display_name,
            "latitude": round(lat, 4),
            "longitude": round(lon, 4),
            "temperature": temp,
            "humidity": humidity,
            "surface_pressure": pressure,
            "wind_speed": wind,
            "source": "Open-Meteo (Cached & Retried)"
        }
    except Exception as e:
        print(f"[WeatherService] Weather fetch warning: {e}")
        # Fallback to direct HTTP request if client had a schema issue
        return _fallback_http_fetch(city_name)

def _fallback_http_fetch(city_name: str) -> Optional[Dict[str, Any]]:
    try:
        geo = geocode_city(city_name)
        if not geo:
            return None
        weather_resp = requests.get(
            FORECAST_URL,
            params={
                "latitude": geo["latitude"],
                "longitude": geo["longitude"],
                "current": "temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m",
            },
            timeout=5
        )
        weather_resp.raise_for_status()
        current = weather_resp.json().get("current", {})
        return {
            "city": geo["name"],
            "latitude": geo["latitude"],
            "longitude": geo["longitude"],
            "temperature": round(float(current.get("temperature_2m", 20.0)), 1),
            "humidity": round(float(current.get("relative_humidity_2m", 50.0)), 1),
            "surface_pressure": round(float(current.get("surface_pressure", 1013.25)), 1),
            "wind_speed": round(float(current.get("wind_speed_10m", 0.0)), 1),
            "source": "Open-Meteo (Direct Fallback)"
        }
    except Exception as ex:
        print(f"[WeatherService] Fallback error: {ex}")
        return None

def fetch_hourly_weather_forecast(city_name: str) -> Optional[Dict[str, Any]]:
    """
    Fetches 24-hour hourly weather forecast (temperature and humidity)
    using the Open-Meteo client script provided.
    """
    try:
        geo = geocode_city(city_name)
        if not geo:
            return None

        lat = geo["latitude"]
        lon = geo["longitude"]

        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": ["temperature_2m", "relative_humidity_2m"],
            "forecast_days": 2
        }

        responses = openmeteo.weather_api(FORECAST_URL, params=params)
        response = responses[0]

        hourly = response.Hourly()
        hourly_temp = hourly.Variables(0).ValuesAsNumpy()
        hourly_rh = hourly.Variables(1).ValuesAsNumpy()

        start_time = pd.to_datetime(hourly.Time(), unit="s", utc=True)
        end_time = pd.to_datetime(hourly.TimeEnd(), unit="s", utc=True)
        interval_sec = hourly.Interval()

        date_range = pd.date_range(
            start=start_time,
            end=end_time,
            freq=pd.Timedelta(seconds=interval_sec),
            inclusive="left"
        )

        forecast_list: List[Dict[str, Any]] = []
        # Take next 24 hourly steps
        limit = min(24, len(date_range))
        for i in range(limit):
            dt = date_range[i]
            forecast_list.append({
                "time": dt.strftime("%H:00"),
                "full_date": dt.isoformat(),
                "temperature": round(float(hourly_temp[i]), 1),
                "humidity": round(float(hourly_rh[i]), 1),
            })

        return {
            "city": geo["name"],
            "latitude": lat,
            "longitude": lon,
            "forecast_hours": forecast_list,
            "source": "Open-Meteo Hourly Forecast"
        }
    except Exception as e:
        print(f"[WeatherService] Hourly forecast error: {e}")
        return None
