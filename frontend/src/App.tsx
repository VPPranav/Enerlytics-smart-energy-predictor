import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Dashboard } from './pages/Dashboard';
import { Predict } from './pages/Predict';
import { Analytics } from './pages/Analytics';
import { Model } from './pages/Model';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'predict' | 'analytics' | 'model'>('dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-bg-main text-ink-primary">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            onPredictClick={() => setActiveTab('predict')}
            onModelClick={() => setActiveTab('model')}
          />
        )}

        {activeTab === 'predict' && (
          <Predict
            onViewAnalysis={() => setActiveTab('analytics')}
          />
        )}

        {activeTab === 'analytics' && (
          <Analytics
            onPredictClick={() => setActiveTab('predict')}
          />
        )}

        {activeTab === 'model' && (
          <Model />
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
