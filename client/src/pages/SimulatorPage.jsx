import React, { useState, useEffect } from 'react';
import {
  Zap,
  Play,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api';
import { ImpactGateBadge } from '../components/ImpactGateBadge';
import { CriticalityBadge } from '../components/CriticalityBadge';
import { StatusBadge } from '../components/StatusBadge';

export function SimulatorPage() {
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [scenario, setScenario] = useState('Failure');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [actor, setActor] = useState('ops-engineer');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.getServices().then((data) => {
      setServices(data || []);
      if (data && data.length > 0) {
        setSelectedServiceId(data[0]._id);
      }
    });
  }, []);

  const handleRunSimulation = async (e) => {
    if (e) e.preventDefault();
    if (!selectedServiceId) return;

    try {
      setLoading(true);
      const res = await api.runSimulation({
        serviceId: selectedServiceId,
        scenario,
        durationMinutes: Number(durationMinutes),
        actor,
      });
      setResult(res);
    } catch (err) {
      alert('Simulation error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const targetService = services.find((s) => s._id === selectedServiceId);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400 fill-current" /> What-If Failure & Impact Simulator
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select a target service and simulate failure/degradation to compute downstream blast radius and evaluate the Change Impact Gate.
            </p>
          </div>
        </div>
      </div>

      {/* Simulator Form & Cockpit Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <form onSubmit={handleRunSimulation} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Target Service Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Service *
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-sm text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold"
            >
              {services.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.criticality})
                </option>
              ))}
            </select>
          </div>

          {/* Scenario */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Simulation Scenario *
            </label>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-sm text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 font-semibold"
            >
              <option value="Failure">Failure (Unscheduled Outage)</option>
              <option value="Degraded">Degraded (High Latency / Partial Drop)</option>
              <option value="Planned Change">Planned Change (Restart / Maintenance)</option>
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Duration (Minutes)
            </label>
            <input
              type="number"
              min="5"
              max="1440"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-sm text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Action Button */}
          <div>
            <button
              type="submit"
              disabled={loading || !selectedServiceId}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Calculating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Run Simulation
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Simulation Results Display */}
      {result && (
        <div className="space-y-6">
          {/* Gate Decision & Impact Score Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Decision Gate Card */}
            <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Change Impact Gate Decision
                </span>
                <div className="mt-3 flex items-start gap-4">
                  <ImpactGateBadge decision={result.decision} showDescription={true} />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-400" />
                Target: <strong className="text-white">{result.targetService.name}</strong> ({result.targetService.criticality}) | Scenario: <strong className="text-slate-200">{result.scenario}</strong>
              </div>
            </div>

            {/* Impact Score Gauge Card */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Computed Blast Radius Score
              </span>
              <div className="my-2 flex items-baseline justify-between">
                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400">
                  {result.score}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase">/ 100 Risk</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    result.score >= 70
                      ? 'bg-rose-500'
                      : result.score >= 35
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${result.score}%` }}
                />
              </div>
            </div>
          </div>

          {/* Blast Radius Table & Explanations */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" /> Affected Services in Blast Radius
              </h3>
              <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
                Total Affected: {result.affectedServices.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Affected Service</th>
                    <th className="py-3.5 px-4">Classification</th>
                    <th className="py-3.5 px-4">Depth</th>
                    <th className="py-3.5 px-4">Criticality</th>
                    <th className="py-3.5 px-4">Path Explanation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {result.affectedServices.length > 0 ? (
                    result.affectedServices.map((aff, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                          {aff.affectedService.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                              aff.impactType === 'Direct'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                            }`}
                          >
                            {aff.impactType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-300">
                          Depth {aff.depth}
                        </td>
                        <td className="py-3.5 px-4">
                          <CriticalityBadge criticality={aff.affectedService.criticality} />
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-indigo-300">
                          {aff.explanation}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400 text-sm">
                        No downstream services are affected by this change.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Change Preview & Recommended Pre-checks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Side Effects */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Potential Side Effects
              </h4>
              <ul className="space-y-2">
                {result.sideEffects.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pre-check Action Recommendations */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Recommended Pre-checks & Safeguards
              </h4>
              <ul className="space-y-2">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
