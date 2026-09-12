import React from 'react';
import { FeatureFactor } from '../types';
import { ArrowUpRight, ArrowDownRight, Scale, Info } from 'lucide-react';

interface WaterfallChartProps {
  factors: FeatureFactor[];
  baseValue?: number;
  finalPrediction?: number;
}

export const WaterfallChart: React.FC<WaterfallChartProps> = ({ factors, baseValue = 0.65, finalPrediction }) => {
  if (!factors || factors.length === 0) {
    return null;
  }

  const maxAbs = Math.max(...factors.map((f) => Math.abs(f.shap_value)), 0.1);
  const positiveFactors = factors.filter((f) => f.shap_value >= 0);
  const negativeFactors = factors.filter((f) => f.shap_value < 0);

  const posSum = positiveFactors.reduce((acc, f) => acc + f.shap_value, 0);
  const negSum = negativeFactors.reduce((acc, f) => acc + f.shap_value, 0);

  return (
    <div className="space-y-4 font-sans">
      {/* SHAP Force Balance Summary Bar */}
      <div className="p-3.5 bg-bg-panel border border-line rounded space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="flex items-center gap-1.5 text-ink-primary font-semibold">
            <Scale className="w-3.5 h-3.5 text-meter-green" />
            LUNDBERG TREESHAP DECOMPOSITION
          </span>
          <span className="text-ink-muted text-[11px]">
            BASE E[f(x)]: <strong>{baseValue.toFixed(3)} kWh</strong>
          </span>
        </div>

        {/* Dual Force Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-meter-amber flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              DRIVES LOAD UP: +{posSum.toFixed(3)} kWh
            </span>
            <span className="text-meter-blue flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" />
              PULLS LOAD DOWN: {negSum.toFixed(3)} kWh
            </span>
          </div>

          <div className="w-full bg-bg-subtle h-2.5 rounded-sm overflow-hidden flex">
            <div
              className="bg-meter-amber h-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(15, (posSum / (posSum + Math.abs(negSum) || 1)) * 100))}%` }}
              title={`Positive push: +${posSum.toFixed(3)} kWh`}
            />
            <div
              className="bg-meter-blue h-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(15, (Math.abs(negSum) / (posSum + Math.abs(negSum) || 1)) * 100))}%` }}
              title={`Negative pull: ${negSum.toFixed(3)} kWh`}
            />
          </div>
        </div>

        {finalPrediction && (
          <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-ink-muted border-t border-line-subtle">
            <span>Base ({baseValue.toFixed(2)}) + Net Drivers ({(posSum + negSum >= 0 ? '+' : '') + (posSum + negSum).toFixed(2)})</span>
            <span className="font-bold text-ink-primary">= {finalPrediction.toFixed(2)} kWh</span>
          </div>
        )}
      </div>

      {/* Factor Breakdown Cards */}
      <div className="space-y-2.5">
        {factors.map((factor, idx) => {
          const isPos = factor.impact === 'positive';
          const pct = Math.min(100, Math.round((Math.abs(factor.shap_value) / maxAbs) * 100));

          return (
            <div key={idx} className="p-3 bg-bg-card border border-line rounded space-y-1.5 hover:border-line-dark transition-colors shadow-sm">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  {isPos ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-meter-amber flex-shrink-0" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-meter-blue flex-shrink-0" />
                  )}
                  <span className="font-medium text-ink-primary">{factor.display_name}</span>
                  {factor.percent_impact && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-bg-subtle text-ink-secondary rounded">
                      {factor.percent_impact}% impact
                    </span>
                  )}
                </div>
                <span className={`font-mono font-semibold text-xs ${isPos ? 'text-meter-amber' : 'text-meter-blue'}`}>
                  {isPos ? '+' : ''}
                  {factor.shap_value.toFixed(3)} kWh
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-bg-subtle h-1.5 rounded-sm overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-500 rounded-sm ${
                    isPos ? 'bg-meter-amber' : 'bg-meter-blue'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <p className="text-xs text-ink-secondary leading-relaxed pt-0.5">
                {factor.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
