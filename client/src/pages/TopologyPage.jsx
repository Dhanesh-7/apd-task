import React, { useState, useEffect } from 'react';
import { Network, RefreshCw, ArrowUpRight, ArrowDownRight, Server, Shield } from 'lucide-react';
import { api } from '../api';
import { TopologyGraph } from '../components/TopologyGraph';
import { StatusBadge } from '../components/StatusBadge';
import { CriticalityBadge } from '../components/CriticalityBadge';

export function TopologyPage() {
  const [services, setServices] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [topologyDetail, setTopologyDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTopologyData = async () => {
    try {
      setLoading(true);
      const data = await api.getFullTopology();
      setServices(data.services || []);
      setDependencies(data.dependencies || []);

      if (data.services && data.services.length > 0 && !selectedServiceId) {
        setSelectedServiceId(data.services[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopologyData();
  }, []);

  useEffect(() => {
    if (selectedServiceId) {
      api.getServiceTopology(selectedServiceId)
        .then((res) => setTopologyDetail(res))
        .catch((err) => console.error(err));
    }
  }, [selectedServiceId]);

  const selectedService = services.find((s) => s._id === selectedServiceId);

  return (
    <div className="space-y-6">
      {/* Top Banner & Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Network className="w-5 h-5 text-indigo-400" /> Interactive Service Topology Graph
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Explore service nodes, directional dependencies, call relationships, and upstream/downstream impact paths.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-300">Target Focus Service:</label>
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-sm text-white px-3 py-2 rounded-xl focus:outline-none focus:border-indigo-500 font-bold"
          >
            {services.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.criticality})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" /> Rendering graph topology...
        </div>
      ) : (
        <>
          {/* Main Visual Topology Graph */}
          <TopologyGraph
            services={services}
            dependencies={dependencies}
            selectedServiceId={selectedServiceId}
            onSelectService={(id) => setSelectedServiceId(id)}
          />

          {/* Upstream & Downstream Dependencies Detail Cards */}
          {selectedService && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upstream Dependencies (What this service depends on) */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" /> Upstream Dependencies
                  </h3>
                  <span className="text-xs text-slate-400">
                    {selectedService.name} depends on ({topologyDetail?.upstream?.length || 0})
                  </span>
                </div>

                <div className="mt-4 space-y-2.5">
                  {topologyDetail?.upstream?.length > 0 ? (
                    topologyDetail.upstream.map((item) => (
                      <div
                        key={item.dependencyId}
                        onClick={() => item.service?._id && setSelectedServiceId(item.service._id)}
                        className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-lg flex items-center justify-between hover:border-emerald-500/40 cursor-pointer transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200 text-sm">{item.service?.name}</span>
                            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                              {item.relationType}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">{item.service?.team} • {item.service?.environment}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={item.service?.status} />
                          <CriticalityBadge criticality={item.service?.criticality} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-slate-500 text-xs">
                      This service has no upstream dependencies (it is an entry point or isolated service).
                    </div>
                  )}
                </div>
              </div>

              {/* Downstream Dependents (Services that depend on this service) */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ArrowDownRight className="w-4 h-4 text-amber-400" /> Downstream Dependents
                  </h3>
                  <span className="text-xs text-slate-400">
                    Services depending on {selectedService.name} ({topologyDetail?.downstream?.length || 0})
                  </span>
                </div>

                <div className="mt-4 space-y-2.5">
                  {topologyDetail?.downstream?.length > 0 ? (
                    topologyDetail.downstream.map((item) => (
                      <div
                        key={item.dependencyId}
                        onClick={() => item.service?._id && setSelectedServiceId(item.service._id)}
                        className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-lg flex items-center justify-between hover:border-amber-500/40 cursor-pointer transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-200 text-sm">{item.service?.name}</span>
                            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                              {item.relationType}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">{item.service?.team} • {item.service?.environment}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={item.service?.status} />
                          <CriticalityBadge criticality={item.service?.criticality} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-slate-500 text-xs">
                      No downstream services depend on this service (it is a leaf node/DB).
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
