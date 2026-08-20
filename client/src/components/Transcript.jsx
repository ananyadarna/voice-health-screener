import React, { useEffect, useRef } from 'react';
import { User, Bot } from 'lucide-react';

/**
 * Renders scrolling dialogue history transcript with user & AI speech bubbles
 */
export function Transcript({ transcript }) {
  const containerRef = useRef(null);

  // Auto-scroll to bottom on new dialogue turn
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcript]);

  if (!transcript || transcript.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
        <Bot className="w-8 h-8 mb-2 opacity-50 text-teal-400" />
        <p className="text-sm font-medium">No live conversation history yet.</p>
        <p className="text-xs text-slate-600 mt-1">Click "Start Voice Intake" to begin your session.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-4 p-4 max-h-[380px] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/60 shadow-inner"
    >
      {transcript.map((item, index) => {
        const isUser = item.role === 'user';
        return (
          <div
            key={index}
            className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar Icon */}
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                isUser
                  ? 'bg-teal-600/20 text-teal-400 border border-teal-500/30'
                  : 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
              }`}
            >
              {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble Content */}
            <div
              className={`flex flex-col max-w-[80%] ${
                isUser ? 'items-end' : 'items-start'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[11px] font-semibold text-slate-400">
                  {isUser ? 'Patient' : 'AI Intake Assistant'}
                </span>
                {item.time && (
                  <span className="text-[10px] text-slate-600">{item.time}</span>
                )}
              </div>
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isUser
                    ? 'bg-teal-600 text-white rounded-tr-none'
                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                }`}
              >
                {item.text}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
