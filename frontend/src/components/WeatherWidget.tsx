import React, { useState } from 'react';
import { WeatherData, WeatherForecastResponse } from '../types';
import { fetchWeather, fetchWeatherForecast } from '../services/api';
import { CloudSun, Search, Wind, Gauge, Droplets, Thermometer, Check, Clock } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

interface WeatherWidgetProps {
  onApplyWeather: (temp: number, humidity: number, location: string) => void;
  currentTemp?: number;
  currentHumidity?: number;
}

const CITY_PRESETS = ['London', 'Berlin', 'New York', 'Tokyo', 'Paris'];

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ onApplyWeather }) => {
  const [city, setCity] = useState<string>('Berlin');
  const [loading, setLoading] = useState<boolean>(false);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<WeatherForecastResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [applied, setApplied] = useState<boolean>(false);

  const handleFetch = async (targetCity?: string) => {
    const query = (targetCity || city).trim();
    if (!query) return;
    setLoading(true);
    setErrorMsg(null);
    setApplied(false);

    try {
      const [w, f] = await Promise.all([
        fetchWeather(query),
        fetchWeatherForecast(query).catch(() => null),
      ]);
      setWeatherData(w);
      setForecastData(f);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to retrieve weather. Check city name or connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (weatherData) {
      onApplyWeather(weatherData.temperature, weatherData.humidity, weatherData.city);
      setApplied(true);
      setTimeout(() => setApplied(false), 2500);
    }
  };

  return (
    <div className="p-4 bg-bg-card border border-line rounded space-y-4 font-sans shadow-sm">
      <div className="flex items-center justify-between border-b border-line pb-2.5">
        <div className="flex items-center gap-2">
          <CloudSun className="w-4 h-4 text-meter-green" />
          <span className="font-mono text-xs font-bold uppercase text-ink-primary">
            OPEN-METEO LIVE WEATHER INTEGRATION
          </span>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-bg-subtle text-ink-muted rounded">
          CACHE & RETRY ACTIVE
        </span>
      </div>

      {/* City Search Bar & Presets */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleFetch())}
              placeholder="Enter city (e.g., Berlin, London, Tokyo)..."
              className="w-full px-3 py-2 pl-8 bg-bg-panel border border-line rounded text-xs font-mono text-ink-primary focus:outline-none focus:border-ink-primary"
            />
            <Search className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="button"
            onClick={() => handleFetch()}
            disabled={loading}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono rounded border border-emerald-400 transition-colors cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
          >
            {loading ? '[ SYNCING... ]' : '[ FETCH ]'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
          <span className="text-ink-muted">PRESETS:</span>
          {CITY_PRESETS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCity(c);
                handleFetch(c);
              }}
              className="px-2 py-0.5 bg-bg-panel hover:bg-bg-subtle border border-line rounded text-ink-secondary hover:text-ink-primary cursor-pointer transition-colors"
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-2 bg-meter-red-bg border border-meter-red text-meter-red text-xs font-mono rounded">
          {errorMsg}
        </div>
      )}

      {/* Weather telemetry display */}
      {weatherData && (
        <div className="space-y-3 pt-1">
          <div className="p-3 bg-bg-panel border border-line rounded space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-ink-primary">
                {weatherData.city}
              </span>
              <span className="text-[10px] font-mono text-ink-muted">
                {weatherData.latitude.toFixed(2)}°N, {weatherData.longitude.toFixed(2)}°E
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-ink-primary">
                <Thermometer className="w-3.5 h-3.5 text-meter-amber" />
                <span>{weatherData.temperature}°C</span>
              </div>
              <div className="flex items-center gap-1.5 text-ink-primary">
                <Droplets className="w-3.5 h-3.5 text-meter-blue" />
                <span>{weatherData.humidity}% RH</span>
              </div>
              <div className="flex items-center gap-1.5 text-ink-secondary">
                <Gauge className="w-3.5 h-3.5 text-ink-muted" />
                <span>{weatherData.surface_pressure ?? 1013} hPa</span>
              </div>
              <div className="flex items-center gap-1.5 text-ink-secondary">
                <Wind className="w-3.5 h-3.5 text-ink-muted" />
                <span>{weatherData.wind_speed ?? 0} km/h</span>
              </div>
            </div>
          </div>

          {/* 24-Hour Temperature Forecast Mini Chart */}
          {forecastData && forecastData.forecast_hours && forecastData.forecast_hours.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-meter-green" />
                  24-HOUR HOURLY TEMPERATURE FORECAST
                </span>
                <span>OPEN-METEO API</span>
              </div>
              <div className="h-28 w-full bg-bg-panel border border-line rounded p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecastData.forecast_hours.slice(0, 24)} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono' }} interval={3} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono' }} unit="°C" domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#171c26',
                        borderColor: '#2d3748',
                        color: '#f8fafc',
                        borderRadius: '3px',
                        fontFamily: 'IBM Plex Mono',
                        fontSize: '11px',
                        boxShadow: '0 8px 16px -1px rgba(0, 0, 0, 0.4)',
                      }}
                      formatter={(val: any) => [`${val}°C`, 'Forecast Temp']}
                    />
                    <Line type="monotone" dataKey="temperature" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Apply to Form button */}
          <button
            type="button"
            onClick={handleApply}
            className={`w-full py-2.5 px-3 text-xs font-mono font-bold rounded border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              applied
                ? 'bg-meter-green-bg border-meter-green text-meter-green'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
            }`}
          >
            {applied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                APPLIED TO PREDICTION FORM
              </>
            ) : (
              `[ APPLY ${weatherData.temperature}°C & ${weatherData.humidity}% RH TO FORM ]`
            )}
          </button>
        </div>
      )}
    </div>
  );
};
