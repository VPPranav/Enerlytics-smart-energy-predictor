from pydantic import BaseModel, Field
from typing import List, Optional

class PredictionRequest(BaseModel):
    building_type: str = Field(..., description="Type of building: residential, commercial, or other")
    floor_area: float = Field(..., gt=0, le=5000, description="Floor area in square meters (m²)")
    occupants: int = Field(..., ge=1, le=100, description="Number of building occupants")
    temperature: float = Field(..., ge=-50.0, le=90.0, description="Ambient temperature in °C")
    humidity: float = Field(..., ge=0.0, le=100.0, description="Relative humidity percentage (%)")
    hour: int = Field(..., ge=0, le=23, description="Hour of the day (0 to 23)")
    day_of_week: int = Field(..., ge=0, le=6, description="Day of week (0=Monday to 6=Sunday)")
    month: int = Field(..., ge=1, le=12, description="Month of year (1 to 12)")
    previous_consumption: float = Field(..., ge=0.0, le=200.0, description="Previous 1-hour consumption in kWh")
    appliance_usage: Optional[str] = Field("medium", description="Appliance intensity: low, medium, high, very_high")

class FeatureFactor(BaseModel):
    feature: str
    display_name: str
    impact: str  # "positive" (increases consumption) or "negative" (decreases consumption)
    shap_value: float
    description: str
    percent_impact: Optional[float] = None

class EnergyRecommendation(BaseModel):
    id: str
    title: str
    priority: str
    category: str
    kwh_savings_hourly: float
    monthly_savings_usd: float
    difficulty: str
    action: str

class BaselineComparison(BaseModel):
    benchmark_kwh: float
    regional_avg_kwh: float
    difference_kwh: float
    percent_vs_avg: float
    efficiency_rating: str  # e.g., "A+", "A", "B", "C", "D"
    status_label: str

class PredictionResponse(BaseModel):
    prediction_kwh: float
    lower_bound: float
    upper_bound: float
    reliability: str  # "HIGH", "MEDIUM", "LOW"
    reliability_warning: Optional[str] = None
    model_version: str
    base_value: Optional[float] = 0.65
    factors: List[FeatureFactor]
    recommendations: Optional[List[EnergyRecommendation]] = None
    baseline_comparison: Optional[BaselineComparison] = None
