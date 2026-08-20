import React, { useEffect, useRef } from 'react';
import { User, Bot } from 'lucide-react';

/**
 * Human-Designed Light Theme Live Conversation Transcript
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
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-white/60">
        <Bot className="w-8 h-8 mb-2 opacity-60 text-teal-600" />
        <p className="text-sm font-medium text-slate-600">No live conversation history yet.</p>
        <p className="text-xs text-slate-400 mt-1">Click "Start Voice Intake" to begin your preliminary screening.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-4 p-5 max-h-[380px] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm"
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
              className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 shadow-sm ${
                isUser
                  ? 'bg-teal-100 text-teal-700 border border-teal-200'
                  : 'bg-sky-100 text-sky-700 border border-sky-200'
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
                <span className="text-[11px] font-semibold text-slate-500">
                  {isUser ? 'Patient' : 'AI Intake Assistant'}
                </span>
                {item.time && (
                  <span className="text-[10px] text-slate-400">{item.time}</span>
                )}
              </div>
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isUser
                    ? 'bg-teal-700 text-white rounded-tr-none shadow-sm'
                    : 'bg-slate-100 text-slate-800 border border-slate-200/80 rounded-tl-none'
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
