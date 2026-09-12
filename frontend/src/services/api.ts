import axios from 'axios';
import {
  PredictionInput,
  PredictionResponse,
  WeatherData,
  WeatherForecastResponse,
  DiurnalProfileResponse,
  ModelEvaluationMetrics,
  ModelComparisonResponse,
  ModelMetadata,
} from '../types';

const API_BASE =
  window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000/api'
    : 'https://enerlytics-smart-energy-predictor-backend.onrender.com/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const checkHealth = async (): Promise<{ status: string; model_loaded: boolean; model_version: string }> => {
  const resp = await apiClient.get('/health');
  return resp.data;
};

export const predictEnergy = async (input: PredictionInput): Promise<PredictionResponse> => {
  const payload = {
    building_type: input.building_type,
    floor_area: Number(input.floor_area),
    occupants: Number(input.occupants),
    temperature: Number(input.temperature),
    humidity: Number(input.humidity),
    hour: Number(input.hour),
    day_of_week: Number(input.day_of_week),
    month: Number(input.month),
    previous_consumption: Number(input.previous_consumption),
    appliance_usage: input.appliance_usage,
  };

  const resp = await apiClient.post<PredictionResponse>('/predict', payload);
  return resp.data;
};

export const getModelMetrics = async (): Promise<{ metrics: ModelEvaluationMetrics; metadata: ModelMetadata }> => {
  const resp = await apiClient.get<{ metrics: ModelEvaluationMetrics; metadata: ModelMetadata }>('/model/metrics');
  return resp.data;
};

export const getDiurnalProfile = async (): Promise<DiurnalProfileResponse> => {
  const resp = await apiClient.get<DiurnalProfileResponse>('/model/diurnal-profile');
  return resp.data;
};

export const getModelComparison = async (): Promise<ModelComparisonResponse> => {
  const resp = await apiClient.get<ModelComparisonResponse>('/model/comparison');
  return resp.data;
};

export const fetchWeather = async (city: string): Promise<WeatherData> => {
  // Try backend proxy first
  try {
    const resp = await apiClient.get<WeatherData>('/weather/current', { params: { city } });
    return resp.data;
  } catch (err) {
    console.warn('[WeatherAPI] Backend weather proxy failed, falling back to direct Open-Meteo:', err);
    // Direct client-side Open-Meteo fallback
    const geoResp = await axios.get(`https://geocoding-api.open-meteo.com/v1/search`, {
      params: { name: city, count: 1, language: 'en', format: 'json' },
      timeout: 6000,
    });
    const results = geoResp.data?.results;
    if (!results || results.length === 0) {
      throw new Error(`Location '${city}' not found.`);
    }

    const loc = results[0];
    const lat = loc.latitude;
    const lon = loc.longitude;
    const cityName = `${loc.name}, ${loc.country_code?.toUpperCase() || ''}`;

    const forecastResp = await axios.get(`https://api.open-meteo.com/v1/forecast`, {
      params: {
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m',
      },
      timeout: 6000,
    });

    const current = forecastResp.data?.current || {};
    return {
      city: cityName,
      latitude: lat,
      longitude: lon,
      temperature: Math.round((current.temperature_2m ?? 20.0) * 10) / 10,
      humidity: Math.round((current.relative_humidity_2m ?? 50.0) * 10) / 10,
      surface_pressure: current.surface_pressure,
      wind_speed: current.wind_speed_10m,
      source: 'Open-Meteo (Direct)',
    };
  }
};

export const fetchWeatherForecast = async (city: string): Promise<WeatherForecastResponse> => {
  const resp = await apiClient.get<WeatherForecastResponse>('/weather/forecast', { params: { city } });
  return resp.data;
};
