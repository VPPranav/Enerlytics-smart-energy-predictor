import React from 'react';
import { EnergyRecommendation, BaselineComparison } from '../types';
import { Lightbulb, Award, CheckCircle, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';

interface EnergyRecommendationsCardProps {
  recommendations?: EnergyRecommendation[];
  baselineComparison?: BaselineComparison;
  predictionKwh: number;
}

export const EnergyRecommendationsCard: React.FC<EnergyRecommendationsCardProps> = ({
  recommendations,
  baselineComparison,
  predictionKwh,
}) => {
  return (
    <div className="space-y-5 font-sans">
      {/* 1. Baseline Comparison & Energy Efficiency Grade */}
      {baselineComparison && (
        <div className="p-4 bg-bg-panel border border-line rounded space-y-3">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="font-mono text-xs font-bold uppercase text-ink-primary flex items-center gap-1.5">
              <Award className="w-4 h-4 text-meter-green" />
              BUILDING EFFICIENCY BENCHMARK
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-ink-muted uppercase">RATING:</span>
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                  baselineComparison.efficiency_rating === 'A+' || baselineComparison.efficiency_rating === 'A'
                    ? 'bg-meter-green-bg border-meter-green text-meter-green'
                    : baselineComparison.efficiency_rating === 'B'
                    ? 'bg-meter-blue-bg border-meter-blue text-meter-blue'
                    : 'bg-meter-amber-bg border-meter-amber text-meter-amber'
                }`}
              >
                GRADE {baselineComparison.efficiency_rating}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div>
              <div className="text-[10px] text-ink-muted uppercase">PREDICTED</div>
              <div className="font-bold text-ink-primary mt-0.5">{predictionKwh.toFixed(2)} kWh</div>
            </div>
            <div>
              <div className="text-[10px] text-ink-muted uppercase">REGIONAL AVG</div>
              <div className="font-bold text-ink-secondary mt-0.5">{baselineComparison.regional_avg_kwh.toFixed(2)} kWh</div>
            </div>
            <div>
              <div className="text-[10px] text-ink-muted uppercase">ENERGY STAR</div>
              <div className="font-bold text-meter-green mt-0.5">{baselineComparison.benchmark_kwh.toFixed(2)} kWh</div>
            </div>
          </div>

          <div className="text-xs text-ink-secondary flex items-center justify-between pt-1 border-t border-line-subtle">
            <span>{baselineComparison.status_label}</span>
            <span
              className={`font-mono font-medium ${
                baselineComparison.difference_kwh <= 0 ? 'text-meter-green' : 'text-meter-amber'
              }`}
            >
              {baselineComparison.difference_kwh <= 0 ? '' : '+'}
              {baselineComparison.difference_kwh.toFixed(2)} kWh vs average ({baselineComparison.percent_vs_avg > 0 ? '+' : ''}{baselineComparison.percent_vs_avg}%)
            </span>
          </div>
        </div>
      )}

      {/* 2. Actionable Energy Saving Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase text-ink-primary flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-meter-amber" />
              TAILORED ENERGY-SAVING ACTIONS
            </span>
            <span className="text-[10px] font-mono text-ink-muted">SHAP & SCHEDULE OPTIMIZED</span>
          </div>

          <div className="space-y-2.5">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-3.5 bg-bg-card border border-line rounded space-y-2 hover:border-line-dark transition-colors shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                          rec.priority === 'HIGH'
                            ? 'bg-meter-red-bg border-meter-red text-meter-red'
                            : rec.priority === 'MEDIUM'
                            ? 'bg-meter-amber-bg border-meter-amber text-meter-amber'
                            : 'bg-meter-blue-bg border-meter-blue text-meter-blue'
                        }`}
                      >
                        {rec.priority} PRIORITY
                      </span>
                      <span className="text-xs font-bold text-ink-primary">{rec.title}</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-mono text-xs font-semibold text-meter-green flex items-center justify-end gap-0.5">
                      <TrendingDown className="w-3.5 h-3.5" />
                      -{rec.kwh_savings_hourly} kWh/hr
                    </span>
                    <span className="text-[10px] font-mono text-ink-muted block mt-0.5">
                      Save ~${rec.monthly_savings_usd}/mo
                    </span>
                  </div>
                </div>

                <p className="text-xs text-ink-secondary leading-relaxed font-sans">
                  {rec.action}
                </p>

                <div className="flex items-center justify-between text-[11px] font-mono text-ink-muted pt-1 border-t border-line-subtle">
                  <span>CATEGORY: {rec.category.toUpperCase()}</span>
                  <span>EFFORT: {rec.difficulty.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
