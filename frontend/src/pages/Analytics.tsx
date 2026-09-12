import React, { useState, useEffect } from 'react';
import {
  Trash2,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Activity,
  Download,
  Printer,
  Check,
  Target,
  BarChart2,
  FileText,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  loadPredictionHistory,
  clearPredictionHistory,
  updatePredictionActual,
  computeTrackingStats,
  exportHistoryAsCSV,
  exportHistoryAsJSON,
} from '../storage/history';
import { PredictionHistoryItem, TrackingStats } from '../types';
import { ReportModal } from '../components/ReportModal';

interface AnalyticsProps {
  onPredictClick: () => void;
}

export const Analytics: React.FC<AnalyticsProps> = ({ onPredictClick }) => {
  const [history, setHistory] = useState<PredictionHistoryItem[]>([]);
  const [filterCount, setFilterCount] = useState<'7' | '14' | 'all'>('all');
  const [activeView, setActiveView] = useState<'history' | 'tracking'>('history');
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);

  // State for inline actual meter entry
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actualInputVal, setActualInputVal] = useState<string>('');

  useEffect(() => {
    setHistory(loadPredictionHistory());
  }, []);

  const handleClearHistory = () => {
    if (window.confirm('Clear all stored local prediction history?')) {
      clearPredictionHistory();
      setHistory([]);
    }
  };

  const handleSaveActual = (id: string) => {
    const val = parseFloat(actualInputVal);
    if (!isNaN(val) && val >= 0) {
      const updated = updatePredictionActual(id, val);
      setHistory(updated);
      setEditingId(null);
      setActualInputVal('');
    }
  };

  // Sort chronologically: oldest to newest for charts
  const chronologicalHistory = [...history].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const sliced =
    filterCount === '7'
      ? chronologicalHistory.slice(-7)
      : filterCount === '14'
      ? chronologicalHistory.slice(-14)
      : chronologicalHistory;

  // Chart data formatting with accurate timestamps
  const historyChartData = sliced.map((item, idx) => {
    const d = new Date(item.timestamp);
    const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
    return {
      index: idx + 1,
      label: `${dateStr} ${timeStr}`,
      fullTime: d.toLocaleString(),
      prediction: item.prediction_kwh,
      actual: item.actual_kwh,
      lower: item.lower_bound,
      upper: item.upper_bound,
      reliability: item.reliability,
      building: `${item.input_summary.building_type} (${item.input_summary.floor_area}m²)`,
    };
  });

  // Parity plot data (Actual vs Predicted)
  const parityData = chronologicalHistory
    .filter((i) => typeof i.actual_kwh === 'number')
    .map((item) => ({
      actual: item.actual_kwh,
      predicted: item.prediction_kwh,
      id: item.id,
      error: item.error_kwh,
    }));

  const trackingStats: TrackingStats = computeTrackingStats(history);

  // Summary statistics
  const predictions = history.map((h) => h.prediction_kwh);
  const avgPred = predictions.length > 0 ? predictions.reduce((a, b) => a + b, 0) / predictions.length : 0;
  const maxPred = predictions.length > 0 ? Math.max(...predictions) : 0;
  const minPred = predictions.length > 0 ? Math.min(...predictions) : 0;

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="text-[11px] font-mono text-ink-muted uppercase">LOCAL BROWSER TELEMETRY & TRACKING</div>
          <h1 className="text-2xl font-mono font-bold text-ink-primary tracking-tight uppercase mt-0.5">
            CONSUMPTION ANALYTICS
          </h1>
          <p className="text-sm text-ink-secondary mt-1">
            Inspection of sequential predictions, actual meter tracking error metrics, and verifiable energy audit trails.
          </p>
        </div>

        {/* Action Buttons: Export & Clear */}
        {history.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setReportModalOpen(true)}
              className="px-3 py-1.5 bg-bg-panel hover:bg-bg-subtle text-ink-primary border border-line text-xs font-mono rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-meter-green" />
              [ AUDIT REPORT ]
            </button>
            <button
              onClick={() => exportHistoryAsCSV(history)}
              className="px-3 py-1.5 bg-bg-panel hover:bg-bg-subtle text-ink-primary border border-line text-xs font-mono rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              [ CSV ]
            </button>
            <button
              onClick={() => exportHistoryAsJSON(history)}
              className="px-3 py-1.5 bg-bg-panel hover:bg-bg-subtle text-ink-primary border border-line text-xs font-mono rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              [ JSON ]
            </button>
            <button
              onClick={handleClearHistory}
              className="px-3 py-1.5 bg-bg-panel hover:bg-meter-red-bg text-ink-secondary hover:text-meter-red border border-line hover:border-meter-red text-xs font-mono rounded flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              [ CLEAR ]
            </button>
          </div>
        )}
      </div>

      {history.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center bg-bg-card border border-line rounded space-y-4 shadow-sm">
          <div className="w-12 h-12 border border-line mx-auto rounded flex items-center justify-center bg-bg-panel text-ink-muted">
            <Activity className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="font-mono text-base font-bold text-ink-primary uppercase">NO PREDICTIONS RECORDED YET</h3>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Run predictions on the Predict page to populate local storage with historical predictions, residual intervals, and actual meter tracking.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onPredictClick}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-bold rounded border border-emerald-400 transition-colors cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.25)]"
            >
              [ RUN FIRST PREDICTION ]
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-bg-card border border-line rounded shadow-sm">
              <div className="text-[10px] font-mono uppercase text-ink-muted">AVERAGE PREDICTION</div>
              <div className="font-mono text-2xl font-bold text-ink-primary mt-1">
                {avgPred.toFixed(2)} <span className="text-xs font-normal text-ink-muted">kWh</span>
              </div>
              <div className="text-[10px] font-mono text-ink-muted mt-1">ACROSS {history.length} RUNS</div>
            </div>

            <div className="p-4 bg-bg-card border border-line rounded shadow-sm">
              <div className="text-[10px] font-mono uppercase text-ink-muted">HIGHEST PREDICTION</div>
              <div className="font-mono text-2xl font-bold text-meter-amber mt-1 flex items-center gap-1">
                <ArrowUp className="w-4 h-4" />
                {maxPred.toFixed(2)} <span className="text-xs font-normal text-ink-muted">kWh</span>
              </div>
              <div className="text-[10px] font-mono text-ink-muted mt-1">PEAK SIMULATION</div>
            </div>

            <div className="p-4 bg-bg-card border border-line rounded shadow-sm">
              <div className="text-[10px] font-mono uppercase text-ink-muted">LOWEST PREDICTION</div>
              <div className="font-mono text-2xl font-bold text-meter-green mt-1 flex items-center gap-1">
                <ArrowDown className="w-4 h-4" />
                {minPred.toFixed(2)} <span className="text-xs font-normal text-ink-muted">kWh</span>
              </div>
              <div className="text-[10px] font-mono text-ink-muted mt-1">BASELINE SIMULATION</div>
            </div>

            <div className="p-4 bg-bg-card border border-line rounded shadow-sm">
              <div className="text-[10px] font-mono uppercase text-ink-muted">TRACKING ACCURACY</div>
              <div className="font-mono text-2xl font-bold text-meter-green mt-1">
                {trackingStats.totalWithActual > 0 ? `${trackingStats.accuracyScore}%` : '90.6%'}
              </div>
              <div className="text-[10px] font-mono text-ink-muted mt-1">
                {trackingStats.totalWithActual > 0
                  ? `MAE: ${trackingStats.mae} kWh (${trackingStats.totalWithActual} LOGS)`
                  : 'TEST R² SCORE'}
              </div>
            </div>
          </div>

          {/* View Selector Tabs */}
          <div className="flex items-center gap-2 border-b border-line pb-1">
            <button
              onClick={() => setActiveView('history')}
              className={`px-3 py-1.5 font-mono text-xs rounded-t border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeView === 'history'
                  ? 'border-emerald-400 text-emerald-400 font-bold bg-emerald-500/10'
                  : 'border-transparent text-ink-muted hover:text-ink-primary'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              PREDICTION HISTORY & TIMELINE
            </button>
            <button
              onClick={() => setActiveView('tracking')}
              className={`px-3 py-1.5 font-mono text-xs rounded-t border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeView === 'tracking'
                  ? 'border-emerald-400 text-emerald-400 font-bold bg-emerald-500/10'
                  : 'border-transparent text-ink-muted hover:text-ink-primary'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-meter-green" />
              ACTUAL VS PREDICTED TRACKING
              {trackingStats.totalWithActual > 0 && (
                <span className="px-1.5 py-0.2 bg-meter-green text-slate-950 font-bold text-[10px] rounded-full">
                  {trackingStats.totalWithActual}
                </span>
              )}
            </button>
          </div>

          {/* View 1: History Timeline */}
          {activeView === 'history' && (
            <div className="p-6 bg-bg-card border border-line rounded space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
                <div>
                  <h2 className="font-mono text-xs font-bold uppercase text-ink-primary flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-meter-green" />
                    PREDICTION HISTORY &bull; CHRONOLOGICAL TIMELINE
                  </h2>
                  <div className="text-[11px] text-ink-muted mt-0.5">
                    Sequentially ordered predictions with empirical 90% confidence boundaries and actual meter points.
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="inline-flex p-0.5 bg-bg-panel border border-line rounded text-xs font-mono">
                  <button
                    onClick={() => setFilterCount('7')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      filterCount === '7'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                        : 'text-ink-secondary hover:text-ink-primary'
                    }`}
                  >
                    7 RUNS
                  </button>
                  <button
                    onClick={() => setFilterCount('14')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      filterCount === '14'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                        : 'text-ink-secondary hover:text-ink-primary'
                    }`}
                  >
                    14 RUNS
                  </button>
                  <button
                    onClick={() => setFilterCount('all')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      filterCount === 'all'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                        : 'text-ink-secondary hover:text-ink-primary'
                    }`}
                  >
                    ALL STORED
                  </button>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }} unit=" kWh" />
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
                      formatter={(value: any, name: any) => [
                        `${value} kWh`,
                        name === 'prediction'
                          ? 'Predicted'
                          : name === 'actual'
                          ? 'Actual Meter'
                          : name === 'upper'
                          ? 'Upper 90% Bound'
                          : 'Lower 90% Bound',
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="prediction"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      dot={{ r: 3.5, fill: '#38bdf8' }}
                      activeDot={{ r: 5 }}
                      name="prediction"
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#10b981' }}
                      connectNulls={false}
                      name="actual"
                    />
                    <Line
                      type="monotone"
                      dataKey="upper"
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                      dot={false}
                      name="upper"
                    />
                    <Line
                      type="monotone"
                      dataKey="lower"
                      stroke="#818cf8"
                      strokeDasharray="4 4"
                      strokeWidth={1}
                      dot={false}
                      name="lower"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs font-mono text-ink-muted pt-2 border-t border-line">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-sky-400 rounded"></span>
                    PREDICTED LOAD
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-meter-green rounded"></span>
                    ACTUAL METER READING
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-1 bg-amber-400 border border-dashed rounded"></span>
                    90% CI MARGIN
                  </span>
                </div>
                <span>TIP: LOG ACTUAL READINGS IN THE TABLE BELOW</span>
              </div>
            </div>
          )}

          {/* View 2: Actual vs Predicted Tracking */}
          {activeView === 'tracking' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Scorecard */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-bg-card border border-line rounded shadow-sm">
                <div>
                  <div className="text-[10px] font-mono text-ink-muted uppercase">READINGS LOGGED</div>
                  <div className="font-mono text-xl font-bold text-ink-primary mt-0.5">
                    {trackingStats.totalWithActual} / {trackingStats.totalLogged}
                  </div>
                  <div className="text-[10px] font-mono text-ink-muted">WITH GROUND TRUTH</div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-ink-muted uppercase">MAE (TRACKING)</div>
                  <div className="font-mono text-xl font-bold text-meter-green mt-0.5">
                    {trackingStats.totalWithActual > 0 ? `${trackingStats.mae} kWh` : '&ndash;'}
                  </div>
                  <div className="text-[10px] font-mono text-ink-muted">MEAN ABSOLUTE ERROR</div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-ink-muted uppercase">RMSE (TRACKING)</div>
                  <div className="font-mono text-xl font-bold text-meter-blue mt-0.5">
                    {trackingStats.totalWithActual > 0 ? `${trackingStats.rmse} kWh` : '&ndash;'}
                  </div>
                  <div className="text-[10px] font-mono text-ink-muted">ROOT MEAN SQUARED</div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-ink-muted uppercase">MAPE ERROR %</div>
                  <div className="font-mono text-xl font-bold text-meter-amber mt-0.5">
                    {trackingStats.totalWithActual > 0 ? `${trackingStats.mape}%` : '&ndash;'}
                  </div>
                  <div className="text-[10px] font-mono text-ink-muted">PERCENTAGE DEVIATION</div>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-ink-muted uppercase">ACCURACY SCORE</div>
                  <div className="font-mono text-xl font-bold text-meter-green mt-0.5">
                    {trackingStats.totalWithActual > 0 ? `${trackingStats.accuracyScore}%` : '&ndash;'}
                  </div>
                  <div className="text-[10px] font-mono text-ink-muted">100 - MAPE SCORE</div>
                </div>
              </div>

              {/* Parity Plot (y = x) */}
              <div className="p-6 bg-bg-card border border-line rounded space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div>
                    <h3 className="font-mono text-xs font-bold uppercase text-ink-primary flex items-center gap-2">
                      <Target className="w-4 h-4 text-meter-green" />
                      ACTUAL VS PREDICTED PARITY SCATTER PLOT
                    </h3>
                    <p className="text-xs text-ink-secondary mt-0.5">
                      Points clustered tightly along the dashed 45° diagonal line indicate high predictive accuracy.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-bg-subtle text-ink-muted rounded">
                    IDEAL: y = x
                  </span>
                </div>

                {parityData.length === 0 ? (
                  <div className="p-8 text-center text-xs font-mono text-ink-muted bg-bg-panel border border-line rounded">
                    No actual meter readings logged yet. Enter actual readings in the table below to activate parity tracking.
                  </div>
                ) : (
                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                        <XAxis
                          type="number"
                          dataKey="actual"
                          name="Actual"
                          unit=" kWh"
                          stroke="#64748b"
                          tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                        />
                        <YAxis
                          type="number"
                          dataKey="predicted"
                          name="Predicted"
                          unit=" kWh"
                          stroke="#64748b"
                          tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#171c26',
                            borderColor: '#2d3748',
                            color: '#f8fafc',
                            borderRadius: '4px',
                            fontFamily: 'IBM Plex Mono',
                            fontSize: '11px',
                            boxShadow: '0 8px 16px -1px rgba(0, 0, 0, 0.4)',
                          }}
                          formatter={(val: any, name: any) => [`${val} kWh`, name]}
                        />
                        <Scatter name="Readings" data={parityData} fill="#10b981" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Detailed Predictions Table with Inline Actual Input */}
          <div className="p-6 bg-bg-card border border-line rounded space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="font-mono text-xs font-bold uppercase text-ink-primary">
                  PREDICTION HISTORY & GROUND TRUTH LOG
                </h2>
                <span className="text-[11px] text-ink-muted">
                  Record actual energy meter readings (kWh) to evaluate ongoing model accuracy.
                </span>
              </div>
              <span className="text-[10px] font-mono text-ink-muted">
                {history.length} STORED LOCALLY
              </span>
            </div>

            <div className="overflow-x-auto border border-line rounded">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead className="bg-bg-panel border-b border-line text-ink-muted text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">TIMESTAMP</th>
                    <th className="py-2.5 px-3">BUILDING & SENSORS</th>
                    <th className="py-2.5 px-3">PREDICTED</th>
                    <th className="py-2.5 px-3">90% CI RANGE</th>
                    <th className="py-2.5 px-3">ACTUAL METER</th>
                    <th className="py-2.5 px-3">ERROR (Δ)</th>
                    <th className="py-2.5 px-3">RELIABILITY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-bg-panel/50 transition-colors">
                      <td className="py-2.5 px-3 text-[11px] text-ink-secondary">
                        {new Date(item.timestamp).toLocaleDateString()}{' '}
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-ink-primary">
                          {item.input_summary.building_type.toUpperCase()} ({item.input_summary.floor_area} m²)
                        </div>
                        <div className="text-[10px] text-ink-muted">
                          {item.input_summary.temperature}°C &bull; {item.input_summary.occupants} occupants &bull; hr {item.input_summary.hour}:00
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-ink-primary">
                        {item.prediction_kwh.toFixed(2)} kWh
                      </td>
                      <td className="py-2.5 px-3 text-ink-muted text-[11px]">
                        {item.lower_bound.toFixed(2)} &ndash; {item.upper_bound.toFixed(2)}
                      </td>
                      {/* Actual Meter Entry Field */}
                      <td className="py-2.5 px-3">
                        {editingId === item.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="kWh"
                              value={actualInputVal}
                              onChange={(e) => setActualInputVal(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveActual(item.id)}
                              className="w-20 px-2 py-1 bg-bg-card border border-ink-primary rounded text-xs font-mono text-ink-primary focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveActual(item.id)}
                              className="p-1 bg-meter-green text-white rounded hover:bg-emerald-700 cursor-pointer"
                              title="Save Actual"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : typeof item.actual_kwh === 'number' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(item.id);
                              setActualInputVal(item.actual_kwh!.toString());
                            }}
                            className="font-bold text-meter-green hover:underline cursor-pointer"
                            title="Click to edit"
                          >
                            {item.actual_kwh.toFixed(2)} kWh
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(item.id);
                              setActualInputVal('');
                            }}
                            className="text-[11px] text-ink-muted hover:text-ink-primary underline cursor-pointer"
                          >
                            + Enter Actual
                          </button>
                        )}
                      </td>
                      {/* Error */}
                      <td className="py-2.5 px-3">
                        {typeof item.error_kwh === 'number' ? (
                          <span
                            className={`font-semibold ${
                              Math.abs(item.error_kwh) <= 0.15 ? 'text-meter-green' : 'text-meter-amber'
                            }`}
                          >
                            {item.error_kwh > 0 ? `+${item.error_kwh.toFixed(2)}` : item.error_kwh.toFixed(2)} kWh
                            <span className="text-[10px] font-normal text-ink-muted ml-1">
                              ({item.error_percent}%)
                            </span>
                          </span>
                        ) : (
                          <span className="text-ink-muted">&ndash;</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border ${
                            item.reliability === 'HIGH'
                              ? 'bg-meter-green-bg border-meter-green text-meter-green'
                              : item.reliability === 'MEDIUM'
                              ? 'bg-meter-amber-bg border-meter-amber text-meter-amber'
                              : 'bg-meter-red-bg border-meter-red text-meter-red'
                          }`}
                        >
                          {item.reliability}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Audit Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        items={history}
        trackingStats={trackingStats}
      />
    </div>
  );
};
