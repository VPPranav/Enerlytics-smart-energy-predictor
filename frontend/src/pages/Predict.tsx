import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, RotateCcw, Activity, Sparkles, Sliders, Lightbulb, Scale } from 'lucide-react';
import { predictEnergy } from '../services/api';
import { savePredictionToHistory } from '../storage/history';
import { WaterfallChart } from '../components/WaterfallChart';
import { WhatIfSimulator } from '../components/WhatIfSimulator';
import { EnergyRecommendationsCard } from '../components/EnergyRecommendationsCard';
import { WeatherWidget } from '../components/WeatherWidget';
import { PredictionInput, PredictionResponse, BuildingType, ApplianceUsage } from '../types';

interface PredictProps {
  onViewAnalysis: () => void;
}

export const Predict: React.FC<PredictProps> = ({ onViewAnalysis }) => {
  // Form State
  const [formData, setFormData] = useState<PredictionInput>({
    building_type: 'residential',
    floor_area: 140,
    occupants: 3,
    temperature: 18.0,
    humidity: 55,
    hour: new Date().getHours(),
    day_of_week: new Date().getDay() === 0 ? 6 : new Date().getDay() - 1, // 0=Mon, 6=Sun
    month: new Date().getMonth() + 1,
    previous_consumption: 1.15,
    appliance_usage: 'medium',
    location_name: '',
  });

  // Prediction execution state
  const [calculating, setCalculating] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<PredictionResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active view tab for results
  const [resultTab, setResultTab] = useState<'shap' | 'simulator' | 'recommendations'>('shap');

  // Quick hour selector presets
  const handleHourPreset = (hr: number) => {
    setFormData((prev) => ({ ...prev, hour: hr }));
  };

  // Weather apply callback
  const handleApplyWeather = (temp: number, humidity: number, location: string) => {
    setFormData((prev) => ({
      ...prev,
      temperature: temp,
      humidity: humidity,
      location_name: location,
    }));
  };

  // Run Prediction Handler
  const handleRunPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setCalculating(true);

    try {
      const result = await predictEnergy(formData);
      setPredictionResult(result);

      // Save to browser localStorage with full details
      savePredictionToHistory({
        prediction_kwh: result.prediction_kwh,
        lower_bound: result.lower_bound,
        upper_bound: result.upper_bound,
        reliability: result.reliability,
        model_version: result.model_version,
        base_value: result.base_value,
        input_summary: {
          building_type: formData.building_type,
          floor_area: formData.floor_area,
          occupants: formData.occupants,
          temperature: formData.temperature,
          humidity: formData.humidity,
          hour: formData.hour,
          previous_consumption: formData.previous_consumption,
          location_name: formData.location_name,
        },
        factors: result.factors,
        recommendations: result.recommendations,
        baseline_comparison: result.baseline_comparison,
      });
    } catch (err: any) {
      console.error('Prediction failed:', err);
      setErrorMessage(
        err.response?.data?.detail || 'Unable to connect to prediction service. Please ensure backend is running.'
      );
    } finally {
      setCalculating(false);
    }
  };

  const handleResetPrediction = () => {
    setPredictionResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Header */}
      <div className="border-b border-line pb-4">
        <div className="text-[11px] font-mono text-ink-muted uppercase">REAL-TIME INFERENCE ENGINE</div>
        <h1 className="text-2xl font-mono font-bold text-ink-primary tracking-tight uppercase mt-0.5">
          PREDICT CONSUMPTION
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Enter building characteristics and environmental variables to generate an ML regression estimate with exact SHAP explanations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Input Form & Weather Widget */}
        <div className={predictionResult ? 'lg:col-span-6 space-y-5' : 'lg:col-span-12 space-y-5'}>
          {/* Open-Meteo Weather Integration Widget */}
          <WeatherWidget onApplyWeather={handleApplyWeather} />

          <form onSubmit={handleRunPrediction} className="space-y-5">
            {/* 1. BUILDING SPECIFICATION */}
            <div className="p-5 bg-bg-card border border-line rounded space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-line-subtle pb-2">
                <span className="font-mono text-xs font-bold uppercase text-ink-primary">
                  1. BUILDING SPECIFICATION
                </span>
                <span className="text-[10px] font-mono text-ink-muted">STRUCTURE & OCCUPANCY</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-ink-secondary mb-1">
                    BUILDING TYPE
                  </label>
                  <select
                    value={formData.building_type}
                    onChange={(e) =>
                      setFormData({ ...formData, building_type: e.target.value as BuildingType })
                    }
                    className="w-full px-3 py-2 bg-bg-panel border border-line rounded text-xs font-mono text-ink-primary focus:outline-none focus:border-ink-primary cursor-pointer"
                  >
                    <option value="residential">Residential (Home/Apt)</option>
                    <option value="commercial">Commercial (Office/Facility)</option>
                    <option value="other">Other / Mixed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-ink-secondary mb-1">
                    FLOOR AREA (m²)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="20"
                    max="2000"
                    required
                    value={formData.floor_area}
                    onChange={(e) =>
                      setFormData({ ...formData, floor_area: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-bg-panel border border-line rounded text-xs font-mono text-ink-primary focus:outline-none focus:border-ink-primary"
                  />
                  <span className="text-[10px] font-mono text-ink-muted">Range: 20 &ndash; 2,000 m²</span>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-ink-secondary mb-1">
                    OCCUPANTS
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={formData.occupants}
                    onChange={(e) =>
                      setFormData({ ...formData, occupants: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 bg-bg-panel border border-line rounded text-xs font-mono text-ink-primary focus:outline-none focus:border-ink-primary"
                  />
                  <span className="text-[10px] font-mono text-ink-muted">Active persons</span>
                </div>
              </div>
            </div>

            {/* 2. ENVIRONMENTAL CONDITIONS */}
            <div className="p-5 bg-bg-card border border-line rounded space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-line-subtle pb-2">
                <span className="font-mono text-xs font-bold uppercase text-ink-primary">
                  2. ENVIRONMENTAL CONDITIONS
                </span>
                <span className="text-[10px] font-mono text-ink-muted">
                  {formData.location_name ? `ENRICHED: ${formData.location_name}` : 'ATMOSPHERIC SENSORS'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-ink-secondary mb-1">
                    AMBIENT TEMPERATURE (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="-30"
                    max="60"
                    required
                    value={formData.temperature}
                    onChange={(e) =>
                      setFormData({ ...formData, temperature: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-bg-panel border border-line rounded text-xs font-mono text-ink-primary focus:outline-none focus:border-ink-primary"
                  />
                  <span className="text-[10px] font-mono text-ink-muted">Outdoor dry-bulb temp</span>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-ink-secondary mb-1">
                    RELATIVE HUMIDITY (%)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    required
                    value={formData.humidity}
                    onChange={(e) =>
                      setFormData({ ...formData, humidity: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-bg-panel border border-line rounded text-xs font-mono text-ink-primary focus:outline-none focus:border-ink-primary"
                  />
                  <span className="text-[10px] font-mono text-ink-muted">Atmospheric moisture</span>
                </div>
              </div>
            </div>

            {/* 3. TEMPORAL SCHEDULE */}
            <div className="p-5 bg-bg-card border border-line rounded space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-line-subtle pb-2">
                <span className="font-mono text-xs font-bold uppercase text-ink-primary">
                  3. TEMPORAL SCHEDULE
                </span>
                <span className="text-[10px] font-mono text-ink-muted">DIURNAL & CALENDAR</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-mono uppercase text-ink-secondary">
                      HOUR OF DAY: <strong className="text-ink-primary">{formData.hour.toString().padStart(2, '0')}:00</strong>
                    </label>
                    <div className="flex items-center gap-1 text-[10px] font-mono">
                      <button
                        type="button"
                        onClick={() => handleHourPreset(3)}
                        className="px-1.5 py-0.5 bg-bg-panel hover:bg-bg-subtle border border-line rounded cursor-pointer"
                      >
                        03:00 (NIGHT)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHourPreset(11)}
                        className="px-1.5 py-0.5 bg-bg-panel hover:bg-bg-subtle border border-line rounded cursor-pointer"
                      >
                        11:00 (MIDDAY)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleHourPreset(18)}
                        className="px-1.5 py-0.5 bg-bg-panel hover:bg-bg-subtle border border-line rounded cursor-pointer"
                      >
                        18:00 (PEAK)
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="23"
                    step="1"
                    value={formData.hour}
                    onChange={(e) => setFormData({ ...formData, hour: parseInt(e.target.value) })}
                    className="w-full accent-ink-primary cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono uppercase text-ink-secondary mb-1">
                      DAY OF WEEK
                    </label>
                    <select
                      value={formData.day_of_week}
                      onChange={(e) =>
                        setFormData({ ...formData, day_of_week: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-bg-panel border border-line rounded text-xs font-mono text-ink-primary focus:outline-none focus:border-ink-primary cursor-pointer"
                    >
                      <option value={0}>Monday (Weekday)</option>
                      <option value={1}>Tuesday (Weekday)</option>
                      <option value={2}>Wednesday (Weekday)</option>
                      <option value={3}>Thursday (Weekday)</option>
                      <option value={4}>Friday (Weekday)</option>
                      <option value={5}>Saturday (Weekend)</option>
                      <option value={6}>Sunday (Weekend)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-ink-secondary mb-1">
                      MONTH
                    </label>
                    <select
                      value={formData.month}
                      onChange={(e) =>
                        setFormData({ ...formData, month: parseInt(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-bg-panel border border-line rounded text-xs font-mono text-ink-primary focus:outline-none focus:border-ink-primary cursor-pointer"
                    >
                      <option value={1}>January (Winter)</option>
                      <option value={2}>February (Winter)</option>
                      <option value={3}>March (Spring)</option>
                      <option value={4}>April (Spring)</option>
                      <option value={5}>May (Spring)</option>
                      <option value={6}>June (Summer)</option>
                      <option value={7}>July (Summer)</option>
                      <option value={8}>August (Summer)</option>
                      <option value={9}>September (Autumn)</option>
                      <option value={10}>October (Autumn)</option>
                      <option value={11}>November (Winter)</option>
                      <option value={12}>December (Winter)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. ENERGY PERSISTENCE & LOAD */}
            <div className="p-5 bg-bg-card border border-line rounded space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-line-subtle pb-2">
                <span className="font-mono text-xs font-bold uppercase text-ink-primary">
                  4. ENERGY PERSISTENCE & LOAD
                </span>
                <span className="text-[10px] font-mono text-ink-muted">HISTORICAL AUTOREGRESSIVE</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-ink-secondary mb-1">
                    PREVIOUS HOUR CONSUMPTION (kWh)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    max="40"
                    required
                    value={formData.previous_consumption}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        previous_consumption: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-bg-panel border border-line rounded text-xs font-mono text-ink-primary focus:outline-none focus:border-ink-primary"
                  />
                  <span className="text-[10px] font-mono text-ink-muted">
                    Strongest autoregressive predictor (lag-1h load)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-ink-secondary mb-1">
                    APPLIANCE / LIGHTING INTENSITY
                  </label>
                  <select
                    value={formData.appliance_usage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        appliance_usage: e.target.value as ApplianceUsage,
                      })
                    }
                    className="w-full px-3 py-2 bg-bg-panel border border-line rounded text-xs font-mono text-ink-primary focus:outline-none focus:border-ink-primary cursor-pointer"
                  >
                    <option value="low">Low (Standby / Minimal)</option>
                    <option value="medium">Medium (Standard Routine)</option>
                    <option value="high">High (Multiple Appliances On)</option>
                    <option value="very_high">Very High (Peak Continuous Load)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 bg-meter-red-bg border border-meter-red text-meter-red text-xs font-mono rounded flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={calculating}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-sm font-bold rounded border border-emerald-400 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.25)]"
              >
                {calculating ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin text-slate-950" />
                    <span>[ EXECUTING ML REGRESSION... ]</span>
                  </>
                ) : (
                  <>
                    <span>[ RUN ENERGY PREDICTION ]</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right / Result Panel */}
        {predictionResult && (
          <div className="lg:col-span-6 space-y-5 animate-fadeIn">
            <div className="p-6 bg-bg-card border border-line rounded space-y-5 shadow-panel">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-line pb-3">
                <span className="font-mono text-xs font-bold uppercase text-ink-primary">
                  INFERENCE RESULTS
                </span>
                <span className="font-mono text-xs text-ink-muted uppercase">
                  MODEL: {predictionResult.model_version.toUpperCase()}
                </span>
              </div>

              {/* Primary Numerical Display */}
              <div className="p-4 bg-bg-panel border border-line rounded space-y-3">
                <div>
                  <div className="text-[10px] font-mono uppercase text-ink-muted">
                    PREDICTED CONSUMPTION
                  </div>
                  <div className="text-3xl sm:text-4xl font-mono font-bold text-ink-primary tracking-tight mt-1 flex items-baseline gap-2">
                    {predictionResult.prediction_kwh.toFixed(2)}
                    <span className="text-base font-normal text-ink-secondary">kWh</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-line-subtle flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-ink-muted">
                      EXPECTED RANGE (90% CI)
                    </div>
                    <div className="font-mono text-sm font-semibold text-ink-primary mt-0.5">
                      {predictionResult.lower_bound.toFixed(2)} &ndash; {predictionResult.upper_bound.toFixed(2)} kWh
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-mono uppercase text-ink-muted">
                      RELIABILITY
                    </div>
                    <div
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded border inline-block mt-0.5 ${
                        predictionResult.reliability === 'HIGH'
                          ? 'bg-meter-green-bg border-meter-green text-meter-green'
                          : predictionResult.reliability === 'MEDIUM'
                          ? 'bg-meter-amber-bg border-meter-amber text-meter-amber'
                          : 'bg-meter-red-bg border-meter-red text-meter-red'
                      }`}
                    >
                      {predictionResult.reliability}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab Navigation for Extended Features */}
              <div className="flex items-center gap-1 border-b border-line pb-1">
                <button
                  type="button"
                  onClick={() => setResultTab('shap')}
                  className={`px-3 py-1.5 font-mono text-xs rounded-t border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                    resultTab === 'shap'
                      ? 'border-emerald-400 text-emerald-400 font-bold bg-emerald-500/10'
                      : 'border-transparent text-ink-muted hover:text-ink-primary'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  SHAP EXPLANATION
                </button>
                <button
                  type="button"
                  onClick={() => setResultTab('simulator')}
                  className={`px-3 py-1.5 font-mono text-xs rounded-t border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                    resultTab === 'simulator'
                      ? 'border-emerald-400 text-emerald-400 font-bold bg-emerald-500/10'
                      : 'border-transparent text-ink-muted hover:text-ink-primary'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  WHAT-IF SIMULATOR
                </button>
                <button
                  type="button"
                  onClick={() => setResultTab('recommendations')}
                  className={`px-3 py-1.5 font-mono text-xs rounded-t border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                    resultTab === 'recommendations'
                      ? 'border-emerald-400 text-emerald-400 font-bold bg-emerald-500/10'
                      : 'border-transparent text-ink-muted hover:text-ink-primary'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  RECOMMENDATIONS
                </button>
              </div>

              {/* Tab 1: SHAP Explanation */}
              {resultTab === 'shap' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="text-xs text-ink-secondary">
                    Lundberg TreeSHAP attributions quantify each feature's positive or negative push from the base value $E[f(x)]$.
                  </div>
                  <WaterfallChart
                    factors={predictionResult.factors}
                    baseValue={predictionResult.base_value ?? 0.65}
                    finalPrediction={predictionResult.prediction_kwh}
                  />
                </div>
              )}

              {/* Tab 2: What-If Scenario Simulator */}
              {resultTab === 'simulator' && (
                <div className="animate-fadeIn">
                  <WhatIfSimulator
                    baseInput={formData}
                    basePrediction={predictionResult}
                  />
                </div>
              )}

              {/* Tab 3: Energy-Saving Recommendations & Baseline */}
              {resultTab === 'recommendations' && (
                <div className="animate-fadeIn">
                  <EnergyRecommendationsCard
                    recommendations={predictionResult.recommendations}
                    baselineComparison={predictionResult.baseline_comparison}
                    predictionKwh={predictionResult.prediction_kwh}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 border-t border-line flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onViewAnalysis}
                  className="flex-1 py-2 px-3 bg-bg-panel hover:bg-bg-subtle text-ink-primary font-mono text-xs rounded border border-line flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  [ VIEW CONSUMPTION ANALYTICS ]
                </button>
                <button
                  type="button"
                  onClick={handleResetPrediction}
                  className="py-2 px-3 bg-bg-panel hover:bg-bg-subtle text-ink-secondary hover:text-ink-primary font-mono text-xs rounded border border-line flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  [ NEW PREDICTION ]
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
