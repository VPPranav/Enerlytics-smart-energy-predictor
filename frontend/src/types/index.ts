export type BuildingType = 'residential' | 'commercial' | 'other';
export type ApplianceUsage = 'low' | 'medium' | 'high' | 'very_high';
export type ReliabilityLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface PredictionInput {
  building_type: BuildingType;
  floor_area: number;
  occupants: number;
  temperature: number;
  humidity: number;
  hour: number;
  day_of_week: number;
  month: number;
  previous_consumption: number;
  appliance_usage: ApplianceUsage;
  location_name?: string;
}

export interface FeatureFactor {
  feature: string;
  display_name: string;
  impact: 'positive' | 'negative';
  shap_value: number;
  description: string;
  percent_impact?: number;
}

export interface EnergyRecommendation {
  id: string;
  title: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  kwh_savings_hourly: number;
  monthly_savings_usd: number;
  difficulty: string;
  action: string;
}

export interface BaselineComparison {
  benchmark_kwh: number;
  regional_avg_kwh: number;
  difference_kwh: number;
  percent_vs_avg: number;
  efficiency_rating: string;
  status_label: string;
}

export interface PredictionResponse {
  prediction_kwh: number;
  lower_bound: number;
  upper_bound: number;
  reliability: ReliabilityLevel;
  reliability_warning?: string | null;
  model_version: string;
  base_value?: number;
  factors: FeatureFactor[];
  recommendations?: EnergyRecommendation[];
  baseline_comparison?: BaselineComparison;
}

export interface PredictionHistoryItem {
  id: string;
  timestamp: string;
  prediction_kwh: number;
  lower_bound: number;
  upper_bound: number;
  reliability: ReliabilityLevel;
  model_version: string;
  actual_kwh?: number;
  error_kwh?: number;
  error_percent?: number;
  base_value?: number;
  input_summary: {
    building_type: string;
    floor_area: number;
    occupants: number;
    temperature: number;
    humidity: number;
    hour: number;
    previous_consumption: number;
    location_name?: string;
  };
  factors?: FeatureFactor[];
  recommendations?: EnergyRecommendation[];
  baseline_comparison?: BaselineComparison;
}

export interface TrackingStats {
  totalLogged: number;
  totalWithActual: number;
  mae: number;
  rmse: number;
  mape: number;
  accuracyScore: number;
}

export interface WeatherData {
  city: string;
  latitude: number;
  longitude: number;
  temperature: number;
  humidity: number;
  surface_pressure?: number;
  wind_speed?: number;
  source: string;
}

export interface HourlyForecastItem {
  time: string;
  full_date: string;
  temperature: number;
  humidity: number;
}

export interface WeatherForecastResponse {
  city: string;
  latitude: number;
  longitude: number;
  forecast_hours: HourlyForecastItem[];
  source: string;
}

export interface DiurnalDataPoint {
  hour: string;
  hour_num: number;
  baseline: number;
  mean: number;
  peak: number;
  commercial_mean: number;
  weekend_mean: number;
}

export interface DiurnalProfileResponse {
  dataset: string;
  unit: string;
  hourly_data: DiurnalDataPoint[];
  summary: {
    overnight_baseline_avg: number;
    morning_surge_peak: number;
    morning_surge_hour: string;
    evening_peak_max: number;
    evening_peak_hour: string;
    daily_total_avg_kwh: number;
  };
}

export interface ModelMetricSet {
  mae: number;
  rmse: number;
  r2: number;
}

export interface ModelEvaluationMetrics {
  [model_name: string]: {
    validation: ModelMetricSet;
    test: ModelMetricSet;
  };
}

export interface ModelComparisonItem {
  model_name: string;
  val_mae: number;
  test_mae: number;
  val_rmse: number;
  test_rmse: number;
  val_r2: number;
  test_r2: number;
  latency_ms: number;
  selected: boolean;
  description: string;
}

export interface ModelComparisonResponse {
  selected_model: string;
  models: ModelComparisonItem[];
  features: string[];
  selection_rationale: string;
}

export interface ModelMetadata {
  model_type: string;
  model_version: string;
  trained_at: string;
  dataset: {
    name: string;
    total_records: number;
    train_records: number;
    val_records: number;
    test_records: number;
    start_date: string;
    end_date: string;
  };
  features: string[];
  prediction_interval: {
    method: string;
    margin_kwh: number;
    margin_95_kwh: number;
    residual_std: number;
    residual_mean: number;
  };
  reliability_thresholds: Record<string, {
    min: number;
    max: number;
    p01: number;
    p25: number;
    p75: number;
    p99: number;
    iqr: number;
  }>;
  selected_metrics: {
    validation: ModelMetricSet;
    test: ModelMetricSet;
  };
}
