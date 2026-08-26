import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { ServiceRegistryPage } from './pages/ServiceRegistryPage';
import { DependencyMapPage } from './pages/DependencyMapPage';
import { TopologyPage } from './pages/TopologyPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { HistoryPage } from './pages/HistoryPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSeedSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSeedSuccess={handleSeedSuccess}
      />

      <main key={refreshKey} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <DashboardPage onNavigate={setActiveTab} />}
        {activeTab === 'services' && <ServiceRegistryPage />}
        {activeTab === 'dependencies' && <DependencyMapPage />}
        {activeTab === 'topology' && <TopologyPage />}
        {activeTab === 'simulator' && <SimulatorPage />}
        {activeTab === 'history' && <HistoryPage />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        Service Dependency & Blast Radius Analyzer — Antigravity Production Console
      </footer>
    </div>
  );
}
