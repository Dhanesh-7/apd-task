import React, { useState, useEffect } from 'react';
import { GitFork, Plus, Trash2, ArrowRight, RefreshCw, X } from 'lucide-react';
import { api } from '../api';
import { CriticalityBadge } from '../components/CriticalityBadge';

export function DependencyMapPage() {
  const [dependencies, setDependencies] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    sourceService: '',
    targetService: '',
    relationType: 'depends_on',
    criticality: 'Medium',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [depsData, servData] = await Promise.all([
        api.getDependencies(),
        api.getServices(),
      ]);
      setDependencies(depsData);
      setServices(servData);

      if (servData.length >= 2) {
        setFormData((prev) => ({
          ...prev,
          sourceService: servData[0]._id,
          targetService: servData[1]._id,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.sourceService === formData.targetService) {
      alert('A service cannot depend on itself!');
      return;
    }
    try {
      await api.createDependency(formData);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to map dependency: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to remove this dependency relationship?')) {
      try {
        await api.deleteDependency(id);
        fetchData();
      } catch (err) {
        alert('Failed to remove dependency: ' + err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <GitFork className="w-5 h-5 text-indigo-400" /> Dependency Mapping Manager
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Map relationships between microservices (e.g. Service A calls Service B, API reads from DB).
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          disabled={services.length < 2}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Map New Relationship
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" /> Loading dependency mappings...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Dependent Service (Source)</th>
                  <th className="py-3.5 px-4 text-center">Relationship Type</th>
                  <th className="py-3.5 px-4">Target Dependency</th>
                  <th className="py-3.5 px-4">Path Criticality</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {dependencies.length > 0 ? (
                  dependencies.map((dep) => (
                    <tr key={dep._id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-bold text-white">
                        {dep.sourceService?.name || 'Deleted Service'}
                        <span className="block text-[11px] font-normal text-slate-400">
                          {dep.sourceService?.team} ({dep.sourceService?.environment})
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-slate-950 border border-slate-800 text-indigo-300 rounded-full">
                          {dep.relationType} <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-white">
                        {dep.targetService?.name || 'Deleted Dependency'}
                        <span className="block text-[11px] font-normal text-slate-400">
                          {dep.targetService?.team} ({dep.targetService?.environment})
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <CriticalityBadge criticality={dep.criticality} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDelete(dep._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                          title="Remove Relationship"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-500 text-sm">
                      No dependency relationships mapped yet. Click "Map New Relationship" or "Seed Data".
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Map Service Relationship</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Source Service (Dependent) *
                </label>
                <select
                  required
                  value={formData.sourceService}
                  onChange={(e) => setFormData({ ...formData, sourceService: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.criticality})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">The application/API that initiates requests</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Relation Type *
                </label>
                <select
                  value={formData.relationType}
                  onChange={(e) => setFormData({ ...formData, relationType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  <option value="depends_on">depends_on</option>
                  <option value="calls">calls</option>
                  <option value="publishes_to">publishes_to</option>
                  <option value="reads_from">reads_from</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Service (Dependency) *
                </label>
                <select
                  required
                  value={formData.targetService}
                  onChange={(e) => setFormData({ ...formData, targetService: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.criticality})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">The downstream database, API, or service being called</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Path Criticality
                </label>
                <select
                  value={formData.criticality}
                  onChange={(e) => setFormData({ ...formData, criticality: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-500"
                >
                  Save Dependency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
