import React from 'react';

interface StatusPillProps {
  label: string;
  status: 'online' | 'warning' | 'error' | 'offline' | 'neutral';
  value?: string;
  dotOnly?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({ label, status, value, dotOnly = false }) => {
  const getColors = () => {
    switch (status) {
      case 'online':
        return {
          dot: 'bg-meter-green',
          border: 'border-line',
          text: 'text-ink-primary',
          valText: 'text-meter-green',
        };
      case 'warning':
        return {
          dot: 'bg-meter-amber',
          border: 'border-line',
          text: 'text-ink-primary',
          valText: 'text-meter-amber',
        };
      case 'error':
        return {
          dot: 'bg-meter-red',
          border: 'border-line',
          text: 'text-ink-primary',
          valText: 'text-meter-red',
        };
      case 'offline':
      default:
        return {
          dot: 'bg-ink-muted',
          border: 'border-line',
          text: 'text-ink-secondary',
          valText: 'text-ink-secondary',
        };
    }
  };

  const colors = getColors();

  if (dotOnly) {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs">
        <span className={`inline-block w-2 h-2 rounded-full ${colors.dot}`} />
        <span className={colors.valText}>{value || label}</span>
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 bg-bg-panel border ${colors.border} rounded text-xs font-mono tracking-tight`}>
      <span className="text-ink-muted uppercase">{label}</span>
      <span className="inline-flex items-center gap-1">
        <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors.dot}`} />
        <span className={`font-medium ${colors.valText}`}>{value || status.toUpperCase()}</span>
      </span>
    </div>
  );
};
