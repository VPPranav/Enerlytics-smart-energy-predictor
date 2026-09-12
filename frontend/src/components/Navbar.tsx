import React, { useEffect, useState } from 'react';
import { checkHealth } from '../services/api';
import { StatusPill } from './StatusPill';
import { Activity, Gauge, BarChart2, Cpu, Menu, X } from 'lucide-react';
import { EnerlyticsLogo } from './EnerlyticsLogo';

interface NavbarProps {
  activeTab: 'dashboard' | 'predict' | 'analytics' | 'model';
  setActiveTab: (tab: 'dashboard' | 'predict' | 'analytics' | 'model') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const [backendOnline, setBackendOnline] = useState<boolean>(true);
  const [modelVersion, setModelVersion] = useState<string>('XGBOOST v1');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const pollHealth = async () => {
      try {
        const data = await checkHealth();
        if (isMounted) {
          setBackendOnline(data.status === 'online');
          if (data.model_version) {
            setModelVersion(data.model_version.toUpperCase().replace('-', ' '));
          }
        }
      } catch {
        if (isMounted) {
          setBackendOnline(false);
        }
      }
    };

    pollHealth();
    const interval = setInterval(pollHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Gauge },
    { id: 'predict', label: 'Predict', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'model', label: 'Model', icon: Cpu },
  ] as const;

  return (
    <header className="border-b border-line bg-bg-panel sticky top-0 z-50">
      {/* Top Telemetry Ribbon */}
      <div className="border-b border-line-subtle px-4 py-1 bg-bg-main text-[11px] font-mono flex flex-wrap items-center justify-between text-ink-muted">
        <div className="flex items-center gap-4">
          <span>INSTRUMENT ID: <strong className="text-ink-primary font-medium">ENR-840-XT</strong></span>
          <span className="hidden sm:inline">DATA SOURCE: <strong className="text-ink-primary font-medium">UCI APPLIANCES DATASET (19,735 MEASUREMENTS)</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <StatusPill
            label="SYSTEM STATUS"
            status={backendOnline ? 'online' : 'error'}
            value={backendOnline ? 'ONLINE' : 'OFFLINE'}
            dotOnly
          />
          <span className="text-line-dark">|</span>
          <StatusPill
            label="MODEL"
            status="online"
            value={modelVersion}
            dotOnly
          />
          <span className="text-line-dark">|</span>
          <StatusPill
            label="WEATHER"
            status="online"
            value="OPEN-METEO"
            dotOnly
          />
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand / Logo */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2 text-left focus:outline-none cursor-pointer group py-1"
        >
          <EnerlyticsLogo size="md" />
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono tracking-wide rounded border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                    : 'bg-transparent text-ink-secondary border-transparent hover:border-line hover:text-ink-primary'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label.toUpperCase()}
              </button>
            );
          })}
        </nav>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 border border-line rounded text-ink-secondary hover:text-ink-primary cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-line bg-bg-panel px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-mono rounded text-left border cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-semibold'
                    : 'bg-bg-card text-ink-secondary border-line'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label.toUpperCase()}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
