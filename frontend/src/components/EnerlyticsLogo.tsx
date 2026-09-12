import React from 'react';

interface EnerlyticsLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

export const EnerlyticsLogo: React.FC<EnerlyticsLogoProps> = ({
  size = 'md',
  showWordmark = true,
  className = '',
}) => {
  const iconDimensions = size === 'sm' ? 24 : size === 'lg' ? 40 : 32;

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Enerlytics Vector Icon */}
      <div
        className="relative flex items-center justify-center rounded bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-transparent border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)] flex-shrink-0"
        style={{ width: iconDimensions, height: iconDimensions }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1"
        >
          <defs>
            <linearGradient id="enerlyticsGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10b981" />
              <stop offset="0.5" stopColor="#06b6d4" />
              <stop offset="1" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="boltGrad" x1="18" y1="8" x2="30" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#34d399" />
              <stop offset="1" stopColor="#10b981" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Hexagonal Outer Frame */}
          <path
            d="M24 4L42 14.4V33.6L24 44L6 33.6V14.4L24 4Z"
            stroke="url(#enerlyticsGrad)"
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="rgba(16, 185, 129, 0.06)"
          />

          {/* Energy Wave Pulse in Background */}
          <path
            d="M10 24H16L19 18L24 30L28 20L31 26H38"
            stroke="#06b6d4"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.6"
          />

          {/* Core Dynamic Lightning Bolt */}
          <path
            d="M26 8L15 25H25L21 40L34 22H24L28 8H26Z"
            fill="url(#boltGrad)"
            filter="url(#glow)"
          />
        </svg>
      </div>

      {/* Brand Wordmark */}
      {showWordmark && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-mono font-bold tracking-tight text-white leading-none ${
                size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'
              }`}
            >
              ENER<span className="text-emerald-400">LYTICS</span>
            </span>
            <span className="text-[9px] font-mono uppercase px-1 py-0.2 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded">
              v1.0
            </span>
          </div>
          <span
            className={`font-mono text-[9px] uppercase tracking-wider text-slate-400 mt-0.5 ${
              size === 'sm' ? 'hidden' : 'block'
            }`}
          >
            SMART ENERGY CONSUMPTION PREDICTOR
          </span>
        </div>
      )}
    </div>
  );
};
