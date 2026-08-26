import React, { useEffect, useState } from 'react';
import {
  Activity,
  Server,
  GitFork,
  AlertOctagon,
  ShieldCheck,
  Zap,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import { CriticalityBadge } from '../components/CriticalityBadge';
import { ImpactGateBadge } from '../components/ImpactGateBadge';

export function DashboardPage({ onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDashboardSummary();
      setSummary(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 p-6 rounded-xl text-rose-300">
        <h3 className="font-bold flex items-center gap-2 text-lg">
          <AlertOctagon className="w-5 h-5" /> Failed to load Dashboard
        </h3>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-[#1e293b] space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Operations & Blast Radius Dashboard
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time topology health, critical dependency chains, and what-if change analysis.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('simulator')}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition"
          >
            <Zap className="w-4 h-4" /> Run What-If Simulation
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Services</span>
            <Server className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{summary?.totalServices || 0}</span>
            <span className="text-xs text-emerald-400 font-medium">Active Graph Nodes</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Dependencies</span>
            <GitFork className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-white">{summary?.totalDependencies || 0}</span>
            <span className="text-xs text-indigo-400 font-medium">Mapped Edges</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Critical Tier Services</span>
            <AlertOctagon className="w-5 h-5 text-purple-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-purple-300">{summary?.criticalServicesCount || 0}</span>
            <span className="text-xs text-purple-400 font-medium">Tier-0 Core Components</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">High Impact Dependencies</span>
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-300">{summary?.highImpactDependenciesCount || 0}</span>
            <span className="text-xs text-amber-400 font-medium">Critical Paths</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Critical Services Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-purple-400" /> Critical Tier Services
              </h3>
              <button
                onClick={() => onNavigate('services')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                View All Services <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 font-semibold">
                  <tr>
                    <th className="py-3 px-4 rounded-l-lg">Service Name</th>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4">Environment</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 rounded-r-lg text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {summary?.criticalServices?.length > 0 ? (
                    summary.criticalServices.map((service) => (
                      <tr key={service._id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-semibold text-white">{service.name}</td>
                        <td className="py-3 px-4 text-slate-400 text-xs">{service.team}</td>
                        <td className="py-3 px-4 text-xs">{service.environment}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={service.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onNavigate('topology')}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                          >
                            Inspect Graph
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-slate-500">
                        No critical tier services found. Click "Seed Data" to load realistic topology.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Simulations Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" /> Recent Simulations
              </h3>
              <button
                onClick={() => onNavigate('history')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                History <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {summary?.recentSimulations?.length > 0 ? (
                summary.recentSimulations.map((sim) => (
                  <div
                    key={sim._id}
                    className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl flex items-center justify-between hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200 text-sm">{sim.service?.name || 'Unknown'}</span>
                        <span className="px-2 py-0.5 text-[10px] uppercase font-semibold bg-slate-800 text-slate-300 rounded">
                          {sim.scenario}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">{sim.summary}</p>
                    </div>

                    <ImpactGateBadge decision={sim.decision} />
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No simulations executed yet. Run a What-If analysis from the Simulator tab!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
