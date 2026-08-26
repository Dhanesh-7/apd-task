import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Calendar, User, Eye, RefreshCw, X } from 'lucide-react';
import { api } from '../api';
import { ImpactGateBadge } from '../components/ImpactGateBadge';
import { CriticalityBadge } from '../components/CriticalityBadge';

export function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('ALL');
  const [scenarioFilter, setScenarioFilter] = useState('ALL');

  // Detail Drawer State
  const [selectedSimulationId, setSelectedSimulationId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (decisionFilter !== 'ALL') params.decision = decisionFilter;
      if (scenarioFilter !== 'ALL') params.scenario = scenarioFilter;
      if (searchTerm) params.search = searchTerm;

      const data = await api.getSimulationHistory(params);
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [decisionFilter, scenarioFilter]);

  const handleInspect = async (id) => {
    try {
      setSelectedSimulationId(id);
      setDetailLoading(true);
      const res = await api.getSimulationDetails(id);
      setDetailData(res);
    } catch (err) {
      alert('Failed to load simulation details: ' + err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (confirm('Are you sure you want to delete all past simulation history and audit records?')) {
      try {
        await api.clearSimulationHistory();
        fetchHistory();
      } catch (err) {
        alert('Failed to clear history: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" /> Simulation History & Audit Log
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Searchable repository of past what-if simulations, risk scores, decisions, and impact audits.
          </p>
        </div>

        <button
          onClick={handleClearHistory}
          disabled={history.length === 0}
          className="flex items-center gap-2 px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold rounded-xl transition disabled:opacity-40"
          title="Delete all simulation history records"
        >
          Clear History Log
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search service, summary, or actor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchHistory()}
            className="w-full bg-slate-950 border border-slate-800 text-sm text-slate-200 pl-9 pr-4 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>

          <select
            value={scenarioFilter}
            onChange={(e) => setScenarioFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Scenarios</option>
            <option value="Failure">Failure</option>
            <option value="Degraded">Degraded</option>
            <option value="Planned Change">Planned Change</option>
          </select>

          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Decisions</option>
            <option value="LOW IMPACT">LOW IMPACT</option>
            <option value="REVIEW">REVIEW</option>
            <option value="HIGH IMPACT">HIGH IMPACT</option>
          </select>

          <button
            onClick={fetchHistory}
            className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500"
          >
            Search
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" /> Loading simulation history...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Target Service</th>
                  <th className="py-3.5 px-4">Scenario</th>
                  <th className="py-3.5 px-4">Impact Score</th>
                  <th className="py-3.5 px-4">Gate Decision</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.length > 0 ? (
                  history.map((sim) => (
                    <tr key={sim._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-400">
                        {new Date(sim.startedAt).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-white">
                        {sim.service?.name || 'Unknown'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 text-xs font-semibold bg-slate-800 text-slate-300 rounded border border-slate-700">
                          {sim.scenario}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-black text-indigo-300">
                        {sim.score} / 100
                      </td>

                      <td className="py-3.5 px-4">
                        <ImpactGateBadge decision={sim.decision} />
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-400 flex items-center gap-1 mt-2">
                        <User className="w-3.5 h-3.5 text-slate-500" /> {sim.actor}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleInspect(sim._id)}
                          className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 ml-auto"
                        >
                          <Eye className="w-4 h-4" /> View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500 text-sm">
                      No simulation records found. Run a what-if analysis in the Simulator tab.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Simulation Detail Modal */}
      {selectedSimulationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Simulation Audit Breakdown</h3>
              <button
                onClick={() => setSelectedSimulationId(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-8 text-center text-slate-400">Loading audit details...</div>
            ) : detailData ? (
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div>
                    <h4 className="font-bold text-white text-base">
                      {detailData.simulation?.service?.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{detailData.simulation?.summary}</p>
                  </div>
                  <ImpactGateBadge decision={detailData.simulation?.decision} />
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Affected Services ({detailData.impacts?.length || 0})
                  </h5>
                  <div className="space-y-2">
                    {detailData.impacts?.map((imp) => (
                      <div key={imp._id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-200">{imp.affectedService?.name}</span>
                          <p className="text-indigo-300 font-mono mt-0.5">{imp.explanation}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">
                          {imp.impactType} (Depth {imp.depth})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
