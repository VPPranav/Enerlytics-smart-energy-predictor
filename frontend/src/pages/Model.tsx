import React, { useEffect, useState } from 'react';
import { getModelMetrics, getModelComparison } from '../services/api';
import { ModelEvaluationMetrics, ModelMetadata, ModelComparisonItem } from '../types';
import { Cpu, CheckCircle2, ShieldCheck, Database, Sliders, BarChart3, Zap, Scale, Clock, Layers } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

export const Model: React.FC = () => {
  const [data, setData] = useState<{ metrics: ModelEvaluationMetrics; metadata: ModelMetadata } | null>(null);
  const [comparisonModels, setComparisonModels] = useState<ModelComparisonItem[]>([]);
  const [activeChartMetric, setActiveChartMetric] = useState<'r2' | 'mae' | 'rmse'>('r2');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [resMetrics, resComp] = await Promise.all([
          getModelMetrics(),
          getModelComparison().catch(() => null),
        ]);
        setData(resMetrics);
        if (resComp && resComp.models) {
          setComparisonModels(resComp.models);
        }
      } catch (err) {
        console.warn('Failed to load metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const metrics = data?.metrics;
  const meta = data?.metadata;

  const pipelineSteps = [
    { label: 'DATA', desc: 'UCI Measured Dataset (19,735 obs)' },
    { label: 'CLEANING', desc: 'Hourly Aggregation & Missing Val' },
    { label: 'ENGINEERING', desc: 'Thermal & Autoregressive Features' },
    { label: 'VALIDATION', desc: 'Chronological 70/15/15 Split' },
    { label: 'COMPARISON', desc: 'Linear vs RF vs XGBoost' },
    { label: 'BEST MODEL', desc: 'XGBoost Serialized to joblib' },
    { label: 'INFERENCE', desc: 'FastAPI In-Memory Predict' },
    { label: 'EXPLAINABLE', desc: 'Exact Lundberg TreeSHAP' },
  ];

  // Chart data for model comparison
  const chartData = (comparisonModels.length > 0
    ? comparisonModels
    : [
        { model_name: 'Linear Regression', val_r2: 0.7679, test_r2: 0.7947, val_mae: 0.1777, test_mae: 0.178, val_rmse: 0.3149, test_rmse: 0.3317, latency_ms: 0.2 },
        { model_name: 'Random Forest', val_r2: 0.8551, test_r2: 0.9194, val_mae: 0.1296, test_mae: 0.1171, val_rmse: 0.2488, test_rmse: 0.2079, latency_ms: 14.5 },
        { model_name: 'XGBoost', val_r2: 0.8769, test_r2: 0.9061, val_mae: 0.1228, test_mae: 0.1196, val_rmse: 0.2293, test_rmse: 0.2244, latency_ms: 1.2 },
      ]
  ).map((m) => ({
    name: m.model_name,
    'Validation Split': activeChartMetric === 'r2' ? m.val_r2 : activeChartMetric === 'mae' ? m.val_mae : m.val_rmse,
    'Unseen Test Split': activeChartMetric === 'r2' ? m.test_r2 : activeChartMetric === 'mae' ? m.test_mae : m.test_rmse,
  }));

  return (
    <div className="space-y-8 animate-fadeIn font-sans">
      {/* Page Header */}
      <div className="border-b border-line pb-4">
        <div className="text-[11px] font-mono text-ink-muted uppercase">MACHINE LEARNING METHODOLOGY & BENCHMARKS</div>
        <h1 className="text-2xl font-mono font-bold text-ink-primary tracking-tight uppercase mt-0.5">
          MODEL COMPARISON & ARCHITECTURE
        </h1>
        <p className="text-sm text-ink-secondary mt-1">
          Full comparative analysis across Linear Regression, Random Forest, and XGBoost, with time-series validation benchmarks and explainable AI specifications.
        </p>
      </div>

      {/* Model Performance Comparison Section */}
      <section className="p-6 bg-bg-card border border-line rounded space-y-5 shadow-sm">
        <div className="border-b border-line pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-meter-green" />
              <h2 className="font-mono text-sm font-bold uppercase text-ink-primary">
                MODEL PERFORMANCE MATRIX
              </h2>
            </div>
            <div className="text-xs text-ink-secondary mt-0.5">
              Evaluated on chronological 70% train (2,302 hrs), 15% validation (493 hrs), and strictly unseen 15% future test split (494 hrs).
            </div>
          </div>

          <div className="inline-flex p-1 bg-bg-panel border border-line rounded text-xs font-mono">
            <button
              onClick={() => setActiveChartMetric('r2')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeChartMetric === 'r2'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              R² SCORE
            </button>
            <button
              onClick={() => setActiveChartMetric('mae')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeChartMetric === 'mae'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              MAE (kWh)
            </button>
            <button
              onClick={() => setActiveChartMetric('rmse')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                activeChartMetric === 'rmse'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              RMSE (kWh)
            </button>
          </div>
        </div>

        {/* Visual Metric Bar Chart */}
        <div className="h-64 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                unit={activeChartMetric === 'r2' ? '' : ' kWh'}
                domain={activeChartMetric === 'r2' ? [0.6, 1.0] : [0, 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#171c26',
                  borderColor: '#2d3748',
                  color: '#f8fafc',
                  borderRadius: '4px',
                  fontFamily: 'IBM Plex Mono',
                  fontSize: '12px',
                  boxShadow: '0 8px 16px -1px rgba(0, 0, 0, 0.4)',
                }}
              />
              <Legend wrapperStyle={{ fontFamily: 'IBM Plex Mono', fontSize: '11px' }} />
              <Bar dataKey="Validation Split" fill="#38bdf8" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Unseen Test Split" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Performance Table */}
        <div className="overflow-x-auto border border-line rounded">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead className="bg-bg-panel border-b border-line text-ink-muted text-[11px]">
              <tr>
                <th className="py-2.5 px-3">ALGORITHM</th>
                <th className="py-2.5 px-3">VAL MAE</th>
                <th className="py-2.5 px-3">VAL RMSE</th>
                <th className="py-2.5 px-3">VAL R²</th>
                <th className="py-2.5 px-3">TEST MAE</th>
                <th className="py-2.5 px-3">TEST RMSE</th>
                <th className="py-2.5 px-3">TEST R²</th>
                <th className="py-2.5 px-3">LATENCY</th>
                <th className="py-2.5 px-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              <tr className="hover:bg-bg-panel/50">
                <td className="py-3 px-3 font-semibold text-ink-secondary">Linear Regression</td>
                <td className="py-3 px-3">0.1777</td>
                <td className="py-3 px-3">0.3149</td>
                <td className="py-3 px-3">0.7679</td>
                <td className="py-3 px-3">0.1780</td>
                <td className="py-3 px-3">0.3317</td>
                <td className="py-3 px-3">0.7947</td>
                <td className="py-3 px-3 text-meter-green">~0.2 ms</td>
                <td className="py-3 px-3">
                  <span className="text-[10px] text-ink-muted">BASELINE</span>
                </td>
              </tr>
              <tr className="hover:bg-bg-panel/50">
                <td className="py-3 px-3 font-semibold text-ink-secondary">Random Forest (150 trees)</td>
                <td className="py-3 px-3">0.1296</td>
                <td className="py-3 px-3">0.2488</td>
                <td className="py-3 px-3">0.8551</td>
                <td className="py-3 px-3">0.1171</td>
                <td className="py-3 px-3">0.2079</td>
                <td className="py-3 px-3">0.9194</td>
                <td className="py-3 px-3 text-meter-amber">~14.5 ms</td>
                <td className="py-3 px-3">
                  <span className="text-[10px] text-ink-muted">CANDIDATE</span>
                </td>
              </tr>
              <tr className="bg-bg-panel/80 font-bold text-ink-primary">
                <td className="py-3 px-3 flex items-center gap-2 text-ink-primary">
                  <span className="w-2 h-2 rounded-full bg-meter-green"></span>
                  XGBoost (Production Model)
                </td>
                <td className="py-3 px-3">0.1228</td>
                <td className="py-3 px-3">0.2293</td>
                <td className="py-3 px-3">0.8769</td>
                <td className="py-3 px-3">0.1196</td>
                <td className="py-3 px-3">0.2244</td>
                <td className="py-3 px-3 text-meter-green">0.9061</td>
                <td className="py-3 px-3 text-meter-green">~1.2 ms</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 bg-meter-green-bg text-meter-green border border-meter-green rounded text-[10px] font-bold">
                    SELECTED (PROD)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Selection Rationale */}
        <div className="p-4 bg-bg-panel border border-line rounded space-y-2 text-xs text-ink-secondary leading-relaxed">
          <div className="font-mono text-xs font-bold text-ink-primary uppercase flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-meter-green" />
            WHY XGBOOST WAS SELECTED FOR PRODUCTION
          </div>
          <p>
            While Random Forest demonstrated slightly lower test RMSE, <strong>XGBoost was chosen for production deployment</strong> because it offers the optimal balance between high chronological generalization (Test R²: 0.9061, Val R²: 0.8769), 10x faster inference latency (~1.2ms vs ~14.5ms), a compact 377 KB binary artifact, and native mathematical Lundberg TreeSHAP support enabling millisecond-speed explainability on every prediction without sampling approximations.
          </p>
        </div>
      </section>

      {/* Pipeline Diagram */}
      <section className="p-6 bg-bg-card border border-line rounded space-y-4 shadow-sm">
        <div className="border-b border-line pb-2 flex items-center justify-between">
          <h2 className="font-mono text-xs font-bold uppercase text-ink-primary flex items-center gap-2">
            <Cpu className="w-4 h-4 text-meter-green" />
            END-TO-END ML PIPELINE ARCHITECTURE
          </h2>
          <span className="text-[10px] font-mono text-ink-muted">REPRODUCIBLE VIA ML/TRAINING/TRAIN.PY</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2">
          {pipelineSteps.map((step, idx) => (
            <div key={idx} className="p-3 bg-bg-panel border border-line rounded flex flex-col justify-between text-center relative shadow-xs">
              <div>
                <div className="text-[10px] font-mono text-ink-muted mb-1">0{idx + 1}</div>
                <div className="font-mono text-xs font-bold text-ink-primary uppercase tracking-tight">
                  {step.label}
                </div>
              </div>
              <div className="text-[10px] text-ink-secondary mt-2 leading-tight">
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Deep-Dive Technical Documentation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. DATASET SPECIFICATION */}
        <div className="p-5 bg-bg-card border border-line rounded space-y-3 shadow-sm">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-ink-primary uppercase border-b border-line-subtle pb-2">
            <Database className="w-4 h-4 text-meter-blue" />
            1. DATASET SPECIFICATION
          </div>
          <div className="space-y-2 text-xs text-ink-secondary leading-relaxed">
            <p>
              <strong>Dataset:</strong> Appliances Energy Prediction (Candanedo et al., 2017).
            </p>
            <p>
              <strong>Source:</strong> UCI Machine Learning Repository (University of Mons, Belgium).
            </p>
            <p>
              <strong>Raw Observations:</strong> 19,735 physical 10-minute sensor readings spanning 4.5 months (Jan 11 &ndash; May 27, 2016).
            </p>
            <p>
              <strong>Aggregation:</strong> Resampled to 3,289 hourly records. Electrical energy usage summed over the 1-hour window and converted from Watt-hours (Wh) to kilowatt-hours (kWh).
            </p>
          </div>
        </div>

        {/* 2. TIME-SERIES SPLIT */}
        <div className="p-5 bg-bg-card border border-line rounded space-y-3 shadow-sm">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-ink-primary uppercase border-b border-line-subtle pb-2">
            <Sliders className="w-4 h-4 text-meter-amber" />
            2. TIME-SERIES AWARE VALIDATION
          </div>
          <div className="space-y-2 text-xs text-ink-secondary leading-relaxed">
            <p>
              <strong>Zero Random Shuffling:</strong> Energy time-series exhibit autocorrelation and diurnal seasonality. Shuffling training and test points creates future lookahead leakage.
            </p>
            <p>
              <strong>Strict Chronological Split:</strong>
            </p>
            <ul className="list-disc pl-4 space-y-1 font-mono text-[11px]">
              <li>Train (70%): First 2,302 hours (Jan 11 &ndash; Apr 16, 2016)</li>
              <li>Validation (15%): Next 493 hours (Apr 16 &ndash; May 07, 2016)</li>
              <li>Unseen Test (15%): Final 494 hours (May 07 &ndash; May 27, 2016)</li>
            </ul>
          </div>
        </div>

        {/* 3. PREDICTION INTERVALS */}
        <div className="p-5 bg-bg-card border border-line rounded space-y-3 shadow-sm">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-ink-primary uppercase border-b border-line-subtle pb-2">
            <ShieldCheck className="w-4 h-4 text-meter-green" />
            3. EMPIRICAL UNCERTAINTY INTERVALS
          </div>
          <div className="space-y-2 text-xs text-ink-secondary leading-relaxed">
            <p>
              Unlike arbitrary heuristic bounds, Enerlytics evaluates empirical residual distributions (Actual - Predicted) across chronological validation sets.
            </p>
            <p>
              The baseline 90% confidence uncertainty margin is <strong>± 0.291 kWh</strong>, dynamically scaled by 1.25x &ndash; 1.6x if inputs enter low-density out-of-distribution regions.
            </p>
          </div>
        </div>

        {/* 4. TREE-SHAP */}
        <div className="p-5 bg-bg-card border border-line rounded space-y-3 shadow-sm">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-ink-primary uppercase border-b border-line-subtle pb-2">
            <Scale className="w-4 h-4 text-meter-green" />
            4. EXACT LUNDBERG TREESHAP
          </div>
          <div className="space-y-2 text-xs text-ink-secondary leading-relaxed">
            <p>
              TreeSHAP resolves the cooperative game-theory Shapley formulation for decision trees in polynomial time $O(TLD^2)$, providing mathematically exact local explanations where the sum of feature attributions plus expected value equals the predicted consumption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
