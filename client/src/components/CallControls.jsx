import React, { useState } from 'react';
import { PhoneCall, PhoneOff, Send, Mic } from 'lucide-react';

/**
 * Renders Start/End Call buttons, audio visualizer bars, and text input turn fallback
 */
export function CallControls({ status, onStartCall, onEndCall, onSendText }) {
  const [inputText, setInputText] = useState('');
  const isCallActive = status !== 'IDLE' && status !== 'DISCONNECTED';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendText(inputText);
      setInputText('');
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto my-4">
      {/* Audio Visualizer Animation */}
      {isCallActive && (
        <div className="flex items-center gap-1.5 h-12">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full bg-gradient-to-t from-teal-500 to-emerald-400 transition-all duration-300 ${
                status === 'SPEAKING' || status === 'LISTENING'
                  ? 'animate-pulse-fast'
                  : 'h-3 opacity-40'
              }`}
              style={{
                height: isCallActive ? `${Math.sin(i + 1) * 20 + 28}px` : '12px',
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Main Call Action Buttons */}
      <div className="flex items-center gap-4">
        {!isCallActive ? (
          <button
            onClick={onStartCall}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <PhoneCall className="w-5 h-5" />
            <span>Start Voice Intake</span>
          </button>
        ) : (
          <button
            onClick={onEndCall}
            disabled={status === 'GENERATING_REPORT'}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold shadow-lg shadow-rose-600/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <PhoneOff className="w-5 h-5" />
            <span>End Call & Generate Summary</span>
          </button>
        )}
      </div>

      {/* Text input fallback for typing during active call */}
      {isCallActive && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full max-w-md">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your response (or speak)..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
