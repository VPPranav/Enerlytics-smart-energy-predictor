from fastapi import APIRouter, Query, HTTPException
from backend.app.services.weather import fetch_weather_by_city, fetch_hourly_weather_forecast

router = APIRouter()

@router.get("/current")
def get_current_weather(city: str = Query(..., min_length=2, max_length=100)):
    result = fetch_weather_by_city(city)
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Unable to resolve weather for '{city}'. Please verify city name or enter temperature and humidity manually."
        )
    return result

@router.get("/forecast")
def get_hourly_forecast(city: str = Query(..., min_length=2, max_length=100)):
    result = fetch_hourly_weather_forecast(city)
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Unable to retrieve hourly forecast for '{city}'."
        )
    return result
