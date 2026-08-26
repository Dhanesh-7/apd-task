import React, { useState, useMemo } from 'react';
import { Network, ZoomIn, ZoomOut, RotateCcw, AlertCircle, Info } from 'lucide-react';
import { CriticalityBadge } from './CriticalityBadge';
import { StatusBadge } from './StatusBadge';

export function TopologyGraph({ services = [], dependencies = [], selectedServiceId, onSelectService }) {
  const [zoom, setZoom] = useState(1);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  // Layout calculations (Rank/Tier layout based on dependency depth)
  const { nodes, edges, layers } = useMemo(() => {
    if (!services.length) return { nodes: [], edges: [], layers: [] };

    // Build adjacency for layout
    const serviceMap = new Map(services.map((s) => [s._id.toString(), s]));
    
    // Map edges
    const edgeList = dependencies
      .map((d) => {
        const srcId = d.sourceService?._id ? d.sourceService._id.toString() : d.sourceService?.toString();
        const tgtId = d.targetService?._id ? d.targetService._id.toString() : d.targetService?.toString();
        return {
          id: d._id ? d._id.toString() : `${srcId}-${tgtId}`,
          srcId,
          tgtId,
          relationType: d.relationType,
          criticality: d.criticality,
        };
      })
      .filter((e) => serviceMap.has(e.srcId) && serviceMap.has(e.tgtId));

    // Calculate node tiers (in-degrees / out-degrees for visual layout)
    const inDegree = new Map(services.map((s) => [s._id.toString(), 0]));
    edgeList.forEach((e) => {
      inDegree.set(e.srcId, (inDegree.get(e.srcId) || 0) + 1);
    });

    // Group services into columns/layers
    // DBs & targets at right (0 incoming dependents), callers at left
    const layer0 = []; // Databases / Target leaf nodes (inDegree === 0)
    const layer1 = []; // APIs / Middle tier
    const layer2 = []; // Frontend / Client callers

    services.forEach((s) => {
      const id = s._id.toString();
      const name = s.name.toLowerCase();
      if (name.includes('db') || name.includes('database') || name.includes('storage')) {
        layer2.push(id);
      } else if (name.includes('portal') || name.includes('ui') || name.includes('frontend') || name.includes('client')) {
        layer0.push(id);
      } else {
        layer1.push(id);
      }
    });

    const tierColumns = [layer0, layer1, layer2].filter((col) => col.length > 0);

    const nodePositions = new Map();
    const colWidth = 320;
    const rowHeight = 120;
    const startX = 60;
    const startY = 60;

    tierColumns.forEach((col, colIdx) => {
      col.forEach((nodeId, rowIdx) => {
        nodePositions.set(nodeId, {
          x: startX + colIdx * colWidth,
          y: startY + rowIdx * rowHeight,
        });
      });
    });

    // Remaining unassigned nodes fallback
    services.forEach((s, idx) => {
      const id = s._id.toString();
      if (!nodePositions.has(id)) {
        nodePositions.set(id, {
          x: startX + (idx % 3) * colWidth,
          y: startY + Math.floor(idx / 3) * rowHeight,
        });
      }
    });

    const formattedNodes = services.map((s) => {
      const id = s._id.toString();
      const pos = nodePositions.get(id);
      return {
        ...s,
        id,
        x: pos.x,
        y: pos.y,
      };
    });

    return { nodes: formattedNodes, edges: edgeList, layers: tierColumns };
  }, [services, dependencies]);

  // Determine highlighted node & edges
  const activeServiceId = selectedServiceId || hoveredNodeId;

  const activeConnectedNodeIds = useMemo(() => {
    if (!activeServiceId) return new Set();
    const connected = new Set([activeServiceId]);
    edges.forEach((e) => {
      if (e.srcId === activeServiceId) connected.add(e.tgtId);
      if (e.tgtId === activeServiceId) connected.add(e.srcId);
    });
    return connected;
  }, [activeServiceId, edges]);

  const canvasWidth = 1100;
  const canvasHeight = Math.max(600, Math.ceil(nodes.length / 3) * 140 + 100);

  return (
    <div className="relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Controls Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Network className="w-4 h-4 text-indigo-400" />
          Interactive Topology Visualizer
          <span className="text-xs text-slate-400 font-normal">
            ({nodes.length} services, {edges.length} connections)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.15, 2))}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.15, 0.5))}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative overflow-auto max-h-[650px] bg-slate-950/70 p-6 flex justify-center">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          className="transition-transform duration-200"
        >
          <svg width={canvasWidth} height={canvasHeight} className="overflow-visible select-none">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="28"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
              </marker>

              <marker
                id="arrowhead-active"
                markerWidth="10"
                markerHeight="7"
                refX="28"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#818cf8" />
              </marker>

              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Render Edges */}
            {edges.map((edge) => {
              const srcNode = nodes.find((n) => n.id === edge.srcId);
              const tgtNode = nodes.find((n) => n.id === edge.tgtId);
              if (!srcNode || !tgtNode) return null;

              const isEdgeActive =
                activeServiceId && (edge.srcId === activeServiceId || edge.tgtId === activeServiceId);

              // Curved path
              const dx = tgtNode.x - srcNode.x;
              const dy = tgtNode.y - srcNode.y;
              const cx1 = srcNode.x + dx * 0.5;
              const cy1 = srcNode.y;
              const cx2 = srcNode.x + dx * 0.5;
              const cy2 = tgtNode.y;

              const pathD = `M ${srcNode.x + 100} ${srcNode.y + 35} C ${cx1 + 100} ${cy1 + 35}, ${cx2} ${cy2 + 35}, ${tgtNode.x} ${tgtNode.y + 35}`;

              return (
                <g key={edge.id}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isEdgeActive ? '#818cf8' : '#334155'}
                    strokeWidth={isEdgeActive ? 2.5 : 1.5}
                    strokeDasharray={edge.relationType === 'publishes_to' ? '5,5' : 'none'}
                    markerEnd={isEdgeActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
                    className="transition-all duration-300"
                  />
                  {/* Relation label on path center */}
                  {isEdgeActive && (
                    <text
                      x={(srcNode.x + tgtNode.x) / 2 + 50}
                      y={(srcNode.y + tgtNode.y) / 2 + 30}
                      fill="#a5b4fc"
                      fontSize="10"
                      fontWeight="600"
                      textAnchor="middle"
                      className="bg-slate-900 px-1 rounded"
                    >
                      {edge.relationType}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Render Nodes */}
            {nodes.map((node) => {
              const isSelected = selectedServiceId === node.id;
              const isConnected = activeConnectedNodeIds.has(node.id);
              const isHovered = hoveredNodeId === node.id;

              let borderColor = 'stroke-slate-700';
              let shadowClass = '';

              if (node.criticality === 'Critical') {
                borderColor = isSelected || isHovered ? 'stroke-purple-400' : 'stroke-purple-500/60';
                shadowClass = 'drop-shadow-[0_0_8px_rgba(168,85,247,0.35)]';
              } else if (node.criticality === 'High') {
                borderColor = isSelected || isHovered ? 'stroke-orange-400' : 'stroke-orange-500/60';
                shadowClass = 'drop-shadow-[0_0_8px_rgba(249,115,22,0.35)]';
              } else if (node.criticality === 'Medium') {
                borderColor = isSelected || isHovered ? 'stroke-blue-400' : 'stroke-blue-500/60';
              }

              const opacity = activeServiceId && !isConnected ? 0.35 : 1;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => onSelectService && onSelectService(node.id)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  className="cursor-pointer transition-opacity duration-200"
                  style={{ opacity }}
                >
                  {/* Node Rect */}
                  <rect
                    width="200"
                    height="70"
                    rx="12"
                    className={`fill-slate-900 ${borderColor} ${shadowClass}`}
                    strokeWidth={isSelected ? '3' : '1.5'}
                  />

                  {/* Header Title */}
                  <text x="14" y="26" fill="#f8fafc" fontSize="13" fontWeight="700">
                    {node.name.length > 20 ? node.name.substring(0, 18) + '...' : node.name}
                  </text>

                  {/* Environment & Team */}
                  <text x="14" y="44" fill="#94a3b8" fontSize="10">
                    {node.team} • {node.environment}
                  </text>

                  {/* Criticality dot indicator */}
                  <circle
                    cx="182"
                    cy="22"
                    r="5"
                    fill={
                      node.criticality === 'Critical'
                        ? '#c084fc'
                        : node.criticality === 'High'
                        ? '#fb923c'
                        : node.criticality === 'Medium'
                        ? '#60a5fa'
                        : '#94a3b8'
                    }
                  />

                  {/* Status dot */}
                  <circle
                    cx="182"
                    cy="48"
                    r="4"
                    fill={
                      node.status === 'Healthy'
                        ? '#34d399'
                        : node.status === 'Degraded'
                        ? '#fbbf24'
                        : node.status === 'Unhealthy'
                        ? '#f87171'
                        : '#38bdf8'
                    }
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Topology Legend Footer */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-900 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="font-medium text-slate-300">Criticality:</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Critical</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-400" /> High</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Medium</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Low</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-4 h-0.5 bg-slate-500 inline-block" /> Dependency arrow points to dependency target
          </span>
        </div>
      </div>
    </div>
  );
}
