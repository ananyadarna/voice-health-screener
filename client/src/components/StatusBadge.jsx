import React from 'react';
import { Mic, Activity, Volume2, FileText, CheckCircle2 } from 'lucide-react';

/**
 * Renders status pill indicating current intake session state
 * @param {Object} props - { status: string }
 */
export function StatusBadge({ status }) {
  const getBadgeStyle = () => {
    switch (status) {
      case 'LISTENING':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          icon: <Mic className="w-4 h-4 animate-bounce text-emerald-400" />,
          label: 'Listening to Patient...'
        };
      case 'THINKING':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          icon: <Activity className="w-4 h-4 animate-spin text-amber-400" />,
          label: 'AI Thinking...'
        };
      case 'SPEAKING':
        return {
          bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
          icon: <Volume2 className="w-4 h-4 animate-pulse text-indigo-400" />,
          label: 'AI Speaking...'
        };
      case 'GENERATING_REPORT':
        return {
          bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
          icon: <FileText className="w-4 h-4 animate-pulse text-purple-400" />,
          label: 'Synthesizing Health Report...'
        };
      case 'CONNECTED':
        return {
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          icon: <CheckCircle2 className="w-4 h-4 text-blue-400" />,
          label: 'Connected'
        };
      default:
        return {
          bg: 'bg-slate-800 border-slate-700 text-slate-400',
          icon: <span className="w-2 h-2 rounded-full bg-slate-500" />,
          label: 'Idle / Ready'
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium tracking-wide ${style.bg}`}>
      {style.icon}
      <span>{style.label}</span>
    </div>
  );
}
