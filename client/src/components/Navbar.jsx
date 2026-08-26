import React from 'react';
import {
  LayoutDashboard,
  Server,
  GitFork,
  Network,
  Zap,
  History,
  Database,
} from 'lucide-react';
import { api } from '../api';

export function Navbar({ activeTab, setActiveTab, onSeedSuccess }) {
  const [seeding, setSeeding] = React.useState(false);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const res = await api.seedData();
      alert(`Database successfully seeded! Created ${res.servicesCount} services and ${res.dependenciesCount} relationships.`);
      if (onSeedSuccess) onSeedSuccess();
    } catch (err) {
      alert('Failed to seed database: ' + (err.response?.data?.error || err.message));
    } finally {
      setSeeding(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'services', label: 'Services', icon: Server },
    { id: 'dependencies', label: 'Dependencies', icon: GitFork },
    { id: 'topology', label: 'Topology Graph', icon: Network },
    { id: 'simulator', label: 'Impact Simulator', icon: Zap },
    { id: 'history', label: 'Audit & History', icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                BlastRadius <span className="px-1.5 py-0.5 text-[10px] uppercase font-semibold bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">Analyzer</span>
              </h1>
              <p className="text-xs text-slate-400">Service Dependency & Impact Operations Console</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition disabled:opacity-50"
              title="Populate database with sample 10+ services & 15+ relationships"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              {seeding ? 'Seeding...' : 'Seed Data'}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`p-2 rounded-lg text-xs font-medium flex flex-col items-center gap-1 ${
                  isActive ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
