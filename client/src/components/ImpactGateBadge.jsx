import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

const GATE_CONFIG = {
  'LOW IMPACT': {
    bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    icon: CheckCircle2,
    desc: 'Only selected service is affected & criticality is Low/Medium.',
  },
  'REVIEW': {
    bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    icon: AlertTriangle,
    desc: 'Multiple downstream services affected or important dependency involved.',
  },
  'HIGH IMPACT': {
    bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    icon: ShieldAlert,
    desc: 'Critical service is inside blast radius or chain reaches multiple critical services.',
  },
};

export function ImpactGateBadge({ decision, showDescription = false }) {
  const config = GATE_CONFIG[decision] || GATE_CONFIG['REVIEW'];
  const Icon = config.icon;

  return (
    <div className="flex flex-col gap-1">
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold tracking-wide uppercase shadow-sm ${config.bg}`}>
        <Icon className="w-4 h-4 shrink-0" />
        <span>{decision}</span>
      </div>
      {showDescription && (
        <p className="text-xs text-slate-400 font-normal mt-0.5">{config.desc}</p>
      )}
    </div>
  );
}
