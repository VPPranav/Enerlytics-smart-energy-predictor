import { PredictionHistoryItem } from '../types';

const STORAGE_KEY = 'energy_predictions';
const MAX_HISTORY = 50;

export const loadPredictionHistory = (): PredictionHistoryItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[LocalStorage] Unable to read history:', err);
    return [];
  }
};

export const savePredictionToHistory = (item: Omit<PredictionHistoryItem, 'id' | 'timestamp'>): PredictionHistoryItem => {
  const newItem: PredictionHistoryItem = {
    ...item,
    id: `pred_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const existing = loadPredictionHistory();
    const updated = [newItem, ...existing].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[LocalStorage] Unable to save prediction:', err);
  }

  return newItem;
};

export const updatePredictionActual = (id: string, actualKwh: number): PredictionHistoryItem[] => {
  try {
    const existing = loadPredictionHistory();
    const updated = existing.map((item) => {
      if (item.id === id) {
        const error_kwh = Math.round((item.prediction_kwh - actualKwh) * 1000) / 1000;
        const error_percent = Math.round((Math.abs(error_kwh) / Math.max(actualKwh, 0.05)) * 1000) / 10;
        return {
          ...item,
          actual_kwh: actualKwh,
          error_kwh,
          error_percent,
        };
      }
      return item;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('[LocalStorage] Unable to update actual kWh:', err);
    return loadPredictionHistory();
  }
};

export const clearPredictionHistory = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[LocalStorage] Unable to clear history:', err);
  }
};

export interface TrackingStats {
  totalLogged: number;
  totalWithActual: number;
  mae: number;
  rmse: number;
  mape: number;
  accuracyScore: number;
}

export const computeTrackingStats = (items: PredictionHistoryItem[]): TrackingStats => {
  const withActual = items.filter((i) => typeof i.actual_kwh === 'number');
  if (withActual.length === 0) {
    return {
      totalLogged: items.length,
      totalWithActual: 0,
      mae: 0,
      rmse: 0,
      mape: 0,
      accuracyScore: 0,
    };
  }

  let sumAbsError = 0;
  let sumSqError = 0;
  let sumPctError = 0;

  withActual.forEach((item) => {
    const actual = item.actual_kwh!;
    const pred = item.prediction_kwh;
    const absDiff = Math.abs(pred - actual);
    sumAbsError += absDiff;
    sumSqError += absDiff * absDiff;
    sumPctError += (absDiff / Math.max(actual, 0.05)) * 100;
  });

  const n = withActual.length;
  const mae = Math.round((sumAbsError / n) * 1000) / 1000;
  const rmse = Math.round(Math.sqrt(sumSqError / n) * 1000) / 1000;
  const mape = Math.round((sumPctError / n) * 10) / 10;
  const accuracyScore = Math.max(0, Math.round((100 - mape) * 10) / 10);

  return {
    totalLogged: items.length,
    totalWithActual: n,
    mae,
    rmse,
    mape,
    accuracyScore,
  };
};

export const exportHistoryAsCSV = (items: PredictionHistoryItem[]): void => {
  if (items.length === 0) return;
  const headers = [
    'ID',
    'Timestamp',
    'Building Type',
    'Floor Area (m2)',
    'Occupants',
    'Temp (C)',
    'Humidity (%)',
    'Hour',
    'Prev kWh',
    'Predicted kWh',
    'Lower 90%',
    'Upper 90%',
    'Actual kWh',
    'Error kWh',
    'Error %',
    'Reliability',
  ];

  const rows = items.map((item) => [
    item.id,
    item.timestamp,
    item.input_summary.building_type,
    item.input_summary.floor_area,
    item.input_summary.occupants,
    item.input_summary.temperature,
    item.input_summary.humidity,
    item.input_summary.hour,
    item.input_summary.previous_consumption,
    item.prediction_kwh,
    item.lower_bound,
    item.upper_bound,
    item.actual_kwh ?? '',
    item.error_kwh ?? '',
    item.error_percent ?? '',
    item.reliability,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `enerlytics_prediction_report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportHistoryAsJSON = (items: PredictionHistoryItem[]): void => {
  if (items.length === 0) return;
  const jsonStr = JSON.stringify(items, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `enerlytics_audit_export_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
