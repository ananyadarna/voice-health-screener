import React from 'react';
import { Mic, Activity, Volume2, FileText, CheckCircle2 } from 'lucide-react';

/**
 * Renders status pill indicating current intake session state in light theme
 */
export function StatusBadge({ status }) {
  const getBadgeStyle = () => {
    switch (status) {
      case 'LISTENING':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm',
          icon: <Mic className="w-4 h-4 animate-bounce text-emerald-600" />,
          label: 'Listening to Patient...'
        };
      case 'THINKING':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm',
          icon: <Activity className="w-4 h-4 animate-spin text-amber-600" />,
          label: 'AI Thinking...'
        };
      case 'SPEAKING':
        return {
          bg: 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm',
          icon: <Volume2 className="w-4 h-4 animate-pulse text-indigo-600" />,
          label: 'AI Speaking...'
        };
      case 'GENERATING_REPORT':
        return {
          bg: 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm',
          icon: <FileText className="w-4 h-4 animate-pulse text-purple-600" />,
          label: 'Synthesizing Health Report...'
        };
      case 'CONNECTED':
        return {
          bg: 'bg-sky-50 border-sky-200 text-sky-700 shadow-sm',
          icon: <CheckCircle2 className="w-4 h-4 text-sky-600" />,
          label: 'Connected'
        };
      default:
        return {
          bg: 'bg-slate-100 border-slate-200 text-slate-600',
          icon: <span className="w-2 h-2 rounded-full bg-slate-400" />,
          label: 'Idle / Ready'
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold tracking-wide ${style.bg}`}>
      {style.icon}
      <span>{style.label}</span>
    </div>
  );
}
