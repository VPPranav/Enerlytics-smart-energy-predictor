import React from 'react';
import { EnerlyticsLogo } from './EnerlyticsLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-line bg-bg-panel mt-16 py-8 text-xs font-sans text-ink-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-line-subtle">
          <div className="space-y-2">
            <EnerlyticsLogo size="sm" />
            <p className="text-ink-secondary leading-relaxed pt-1">
              Energy consumption prediction instrument built with Python FastAPI, XGBoost, and React.
              Designed for physical energy engineering evaluation and explainable machine learning.
            </p>
            <div className="mt-2 text-[11px] font-mono text-ink-primary flex items-center gap-1.5">
              <span className="text-ink-muted">AUTHORSHIP:</span>
              <span className="px-1.5 py-0.5 bg-bg-subtle border border-line rounded font-medium text-ink-primary">
                Pranav V P
              </span>
            </div>
          </div>

          <div>
            <div className="font-mono text-xs font-bold text-ink-primary uppercase tracking-wider mb-2">
              DATASET &amp; METHODOLOGY
            </div>
            <p className="text-ink-secondary leading-relaxed">
              Trained on the genuine <strong className="text-ink-primary">UCI Appliances Energy Prediction Dataset</strong> (19,735 physical sensor measurements). Validated using time-series chronological non-random splits.
            </p>
          </div>

          <div>
            <div className="font-mono text-xs font-bold text-ink-primary uppercase tracking-wider mb-2">
              ENGINEERING DISCLAIMER
            </div>
            <p className="text-ink-secondary leading-relaxed">
              Predictions are machine learning statistical estimates based on historical measurements. Prediction intervals represent empirical uncertainty. Not intended as an official electrical utility billing mechanism.
            </p>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-ink-muted font-mono text-[11px]">
          <div className="flex flex-wrap items-center gap-2">
            <span>ENERLYTICS &copy; {new Date().getFullYear()} &mdash; ENERGY INSIGHTS THAT MAKE SENSE</span>
            <span className="text-line-dark hidden sm:inline">&bull;</span>
            <span className="text-ink-primary font-medium">Developed by Pranav V P</span>
          </div>
          <div className="flex items-center gap-4">
            <span>STORAGE: BROWSER LOCALSTORAGE</span>
            <span>EXTERNAL DATA: OPEN-METEO API</span>
            <span>VERSION: 1.0.0</span>
            <span>E-MAIL: pranavvp1507@gmail.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
