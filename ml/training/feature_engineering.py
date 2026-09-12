import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

NUMERIC_FEATURES = [
    "floor_area",
    "occupants",
    "temperature",
    "humidity",
    "hour",
    "day_of_week",
    "month",
    "previous_consumption",
    "is_weekend",
    "is_peak_hour",
    "temp_humidity_index",
    "area_per_occupant",
]

CATEGORICAL_FEATURES = [
    "building_type",
    "appliance_usage",
]

FEATURE_COLUMNS = NUMERIC_FEATURES + [
    "building_type_commercial",
    "building_type_other",
    "building_type_residential",
    "appliance_usage_high",
    "appliance_usage_low",
    "appliance_usage_medium",
    "appliance_usage_very_high",
]

def calculate_comfort_index(temp: float, humidity: float) -> float:
    """Calculates Simplified Temp-Humidity Index (heat/cooling stress index)."""
    return float(temp - (0.55 - 0.0055 * humidity) * (temp - 14.5))

class EnergyFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Feature engineering transformer that guarantees identical feature derivation
    between training time and real-time API inference.
    """
    def __init__(self):
        self.feature_names_ = None
        self.numeric_means_ = {}
        self.numeric_stds_ = {}

    def fit(self, X: pd.DataFrame, y=None):
        df = self._engineer(X)
        self.feature_names_ = FEATURE_COLUMNS
        for col in NUMERIC_FEATURES:
            self.numeric_means_[col] = float(df[col].mean())
            self.numeric_stds_[col] = float(df[col].std()) if df[col].std() > 0 else 1.0
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        df = self._engineer(X)
        # Ensure all expected columns exist with default 0 if missing
        for col in FEATURE_COLUMNS:
            if col not in df.columns:
                df[col] = 0.0
        return df[FEATURE_COLUMNS].astype(float)

    def _engineer(self, df_in: pd.DataFrame) -> pd.DataFrame:
        df = df_in.copy()
        
        # Temporal derived features
        if "day_of_week" in df.columns:
            df["is_weekend"] = df["day_of_week"].apply(lambda d: 1.0 if int(d) in [5, 6] else 0.0)
        else:
            df["is_weekend"] = 0.0

        if "hour" in df.columns:
            df["is_peak_hour"] = df["hour"].apply(lambda h: 1.0 if int(h) in [7, 8, 17, 18, 19, 20, 21] else 0.0)
        else:
            df["is_peak_hour"] = 0.0

        # Environmental interaction
        temp = df["temperature"].astype(float)
        hum = df["humidity"].astype(float)
        df["temp_humidity_index"] = temp - (0.55 - 0.0055 * hum) * (temp - 14.5)

        # Building ratio
        floor = df["floor_area"].astype(float)
        occ = df["occupants"].astype(float).clip(lower=1.0)
        df["area_per_occupant"] = floor / occ

        # One-hot encode categorical features deterministically
        b_types = ["commercial", "other", "residential"]
        for bt in b_types:
            col_name = f"building_type_{bt}"
            if "building_type" in df.columns:
                df[col_name] = (df["building_type"].astype(str).str.lower() == bt).astype(float)
            else:
                df[col_name] = 1.0 if bt == "residential" else 0.0

        usages = ["high", "low", "medium", "very_high"]
        for u in usages:
            col_name = f"appliance_usage_{u}"
            if "appliance_usage" in df.columns:
                df[col_name] = (df["appliance_usage"].astype(str).str.lower() == u).astype(float)
            else:
                df[col_name] = 1.0 if u == "medium" else 0.0

        return df
