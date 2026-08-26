import React from 'react';

const CRITICALITY_CONFIG = {
  Low: { bg: 'bg-slate-500/10', text: 'text-slate-300', border: 'border-slate-500/30' },
  Medium: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  High: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  Critical: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
};

export function CriticalityBadge({ criticality }) {
  const config = CRITICALITY_CONFIG[criticality] || CRITICALITY_CONFIG.Medium;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded border ${config.bg} ${config.text} ${config.border}`}
    >
      {criticality}
    </span>
  );
}
