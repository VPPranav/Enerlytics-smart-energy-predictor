import React, { useState, useEffect } from 'react';
import { PredictionInput, PredictionResponse } from '../types';
import { predictEnergy } from '../services/api';
import { Sliders, RotateCcw, ArrowRight, TrendingDown, TrendingUp, DollarSign, Zap } from 'lucide-react';

interface WhatIfSimulatorProps {
  baseInput: PredictionInput;
  basePrediction: PredictionResponse;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ baseInput, basePrediction }) => {
  const [simInput, setSimInput] = useState<PredictionInput>({ ...baseInput });
  const [simResult, setSimResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [costRate, setCostRate] = useState<number>(0.16); // $ / kWh

  useEffect(() => {
    setSimInput({ ...baseInput });
    setSimResult(null);
  }, [baseInput, basePrediction]);

  // Run simulation on input change with slight debounce
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await predictEnergy(simInput);
        if (active) setSimResult(res);
      } catch (err) {
        console.warn('Simulation failed:', err);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [simInput]);

  const baseKwh = basePrediction.prediction_kwh;
  const simKwh = simResult ? simResult.prediction_kwh : baseKwh;
  const deltaKwh = Math.round((simKwh - baseKwh) * 100) / 100;
  const deltaPct = Math.round(((simKwh - baseKwh) / Math.max(baseKwh, 0.01)) * 1000) / 10;
  const monthlyCostDelta = Math.round(Math.abs(deltaKwh) * 24 * 30 * costRate * 10) / 10;
  const isSaving = deltaKwh <= 0;

  // Preset scenarios
  const applyPreset = (type: 'eco' | 'peak' | 'vacation') => {
    if (type === 'eco') {
      setSimInput((prev) => ({
        ...prev,
        temperature: Math.max(16, prev.temperature - 2),
        hour: 22,
        appliance_usage: 'low',
      }));
    } else if (type === 'peak') {
      setSimInput((prev) => ({
        ...prev,
        hour: 18,
        appliance_usage: 'very_high',
      }));
    } else if (type === 'vacation') {
      setSimInput((prev) => ({
        ...prev,
        occupants: 1,
        appliance_usage: 'low',
        previous_consumption: Math.max(0.1, prev.previous_consumption * 0.4),
      }));
    }
  };

  const handleReset = () => {
    setSimInput({ ...baseInput });
  };

  return (
    <div className="p-5 bg-bg-card border border-line rounded space-y-5 shadow-sm font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
        <div>
          <h3 className="font-mono text-xs font-bold uppercase text-ink-primary flex items-center gap-2">
            <Sliders className="w-4 h-4 text-meter-green" />
            WHAT-IF SCENARIO SIMULATOR
          </h3>
          <p className="text-xs text-ink-secondary mt-0.5">
            Test hypothetical operational adjustments and quantify electricity demand and cost variance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-2.5 py-1 bg-bg-panel hover:bg-bg-subtle text-ink-secondary hover:text-ink-primary text-xs font-mono rounded border border-line flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            RESET
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono text-ink-muted uppercase">QUICK PRESETS:</span>
        <button
          type="button"
          onClick={() => applyPreset('eco')}
          className="px-2.5 py-1 bg-meter-green-bg border border-meter-green text-meter-green hover:bg-emerald-100 text-xs font-mono rounded transition-colors cursor-pointer"
        >
          [ ECO-OPTIMIZED ]
        </button>
        <button
          type="button"
          onClick={() => applyPreset('peak')}
          className="px-2.5 py-1 bg-meter-amber-bg border border-meter-amber text-meter-amber hover:bg-amber-100 text-xs font-mono rounded transition-colors cursor-pointer"
        >
          [ PEAK LOAD STRESS ]
        </button>
        <button
          type="button"
          onClick={() => applyPreset('vacation')}
          className="px-2.5 py-1 bg-meter-blue-bg border border-meter-blue text-meter-blue hover:bg-blue-100 text-xs font-mono rounded transition-colors cursor-pointer"
        >
          [ VACATION / LOW OCCUPANCY ]
        </button>
      </div>

      {/* Side-by-Side Comparison Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-bg-panel border border-line rounded">
        <div>
          <div className="text-[10px] font-mono text-ink-muted uppercase">ORIGINAL PREDICTION</div>
          <div className="font-mono text-2xl font-bold text-ink-secondary mt-1">
            {baseKwh.toFixed(2)} <span className="text-xs font-normal">kWh</span>
          </div>
          <div className="text-[10px] font-mono text-ink-muted mt-0.5">CURRENT CONDITIONS</div>
        </div>

        <div>
          <div className="text-[10px] font-mono text-ink-muted uppercase">SIMULATED PREDICTION</div>
          <div className="font-mono text-2xl font-bold text-ink-primary mt-1 flex items-center gap-2">
            {loading ? '...' : simKwh.toFixed(2)}{' '}
            <span className="text-xs font-normal text-ink-secondary">kWh</span>
          </div>
          <div className="text-[10px] font-mono text-ink-muted mt-0.5">UNDER SIMULATED VARIABLES</div>
        </div>

        <div>
          <div className="text-[10px] font-mono text-ink-muted uppercase">ESTIMATED DELTA</div>
          <div
            className={`font-mono text-2xl font-bold mt-1 flex items-center gap-1 ${
              isSaving ? 'text-meter-green' : 'text-meter-amber'
            }`}
          >
            {isSaving ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
            {deltaKwh > 0 ? `+${deltaKwh.toFixed(2)}` : deltaKwh.toFixed(2)} kWh
            <span className="text-xs font-normal">({deltaPct > 0 ? `+${deltaPct}%` : `${deltaPct}%`})</span>
          </div>
          <div className="text-[10px] font-mono text-ink-muted mt-0.5 flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-meter-green" />
            <span>
              {isSaving ? 'Saves ~$' : 'Adds ~$'}{monthlyCostDelta}/mo @ ${costRate}/kWh
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {/* Thermostat / Ambient Temperature */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-ink-secondary uppercase">TEMPERATURE:</span>
            <span className="font-bold text-ink-primary">{simInput.temperature.toFixed(1)} °C</span>
          </div>
          <input
            type="range"
            min="-5"
            max="38"
            step="0.5"
            value={simInput.temperature}
            onChange={(e) =>
              setSimInput({ ...simInput, temperature: parseFloat(e.target.value) })
            }
            className="w-full accent-ink-primary cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-ink-muted">
            <span>-5°C (Freezing)</span>
            <span>18°C (Mild)</span>
            <span>38°C (Heatwave)</span>
          </div>
        </div>

        {/* Hour of Day */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-ink-secondary uppercase">TIME OF DAY:</span>
            <span className="font-bold text-ink-primary">
              {simInput.hour.toString().padStart(2, '0')}:00 {17 <= simInput.hour && simInput.hour <= 21 ? '(PEAK)' : '(OFF-PEAK)'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="23"
            step="1"
            value={simInput.hour}
            onChange={(e) =>
              setSimInput({ ...simInput, hour: parseInt(e.target.value) })
            }
            className="w-full accent-ink-primary cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-ink-muted">
            <span>00:00 (Night)</span>
            <span>12:00 (Midday)</span>
            <span>23:00 (Late)</span>
          </div>
        </div>

        {/* Occupancy Count */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-ink-secondary uppercase">OCCUPANTS:</span>
            <span className="font-bold text-ink-primary">{simInput.occupants} persons</span>
          </div>
          <input
            type="range"
            min="1"
            max="12"
            step="1"
            value={simInput.occupants}
            onChange={(e) =>
              setSimInput({ ...simInput, occupants: parseInt(e.target.value) })
            }
            className="w-full accent-ink-primary cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-ink-muted">
            <span>1 Person</span>
            <span>4 Persons</span>
            <span>12 Persons</span>
          </div>
        </div>

        {/* Appliance Usage Level */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-ink-secondary uppercase">APPLIANCE ACTIVITY:</span>
            <span className="font-bold text-ink-primary uppercase">{simInput.appliance_usage}</span>
          </div>
          <select
            value={simInput.appliance_usage}
            onChange={(e) =>
              setSimInput({ ...simInput, appliance_usage: e.target.value as any })
            }
            className="w-full px-3 py-2 bg-bg-panel border border-line rounded text-xs font-mono text-ink-primary focus:outline-none focus:border-ink-primary cursor-pointer"
          >
            <option value="low">Low (Standby / Eco Routine)</option>
            <option value="medium">Medium (Standard Routine)</option>
            <option value="high">High (Multiple Active Appliances)</option>
            <option value="very_high">Very High (Peak Continuous Draw)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
