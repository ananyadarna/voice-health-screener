import React, { useState, useEffect } from 'react';
import { PhoneCall, PhoneOff, Send, Mic, MicOff } from 'lucide-react';

/**
 * Human-Designed Light Theme Call Controls & Voice Input Bar
 */
export function CallControls({
  status,
  onStartCall,
  onEndCall,
  onSendText,
  speechText,
  isMicActive,
  onToggleMic
}) {
  const [inputText, setInputText] = useState('');
  const isCallActive = status !== 'IDLE' && status !== 'DISCONNECTED';

  // Live real-time speech text population
  useEffect(() => {
    if (speechText) {
      setInputText(speechText);
    }
  }, [speechText]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendText(inputText.trim());
      setInputText('');
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-2xl mx-auto my-2">
      {/* Audio Visualizer Waveform */}
      {isCallActive && (
        <div className="flex items-center gap-1.5 h-10">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full bg-gradient-to-t from-teal-600 to-emerald-500 transition-all duration-300 ${
                status === 'SPEAKING' || isMicActive
                  ? 'animate-pulse-fast'
                  : 'h-2.5 opacity-30'
              }`}
              style={{
                height: isCallActive ? `${Math.sin(i + 1) * 16 + 22}px` : '10px',
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Main Action Triggers */}
      <div className="flex items-center gap-4">
        {!isCallActive ? (
          <button
            onClick={onStartCall}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-600/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Start Voice Intake</span>
          </button>
        ) : (
          <button
            onClick={onEndCall}
            disabled={status === 'GENERATING_REPORT'}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-rose-600/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Call & Generate Summary</span>
          </button>
        )}
      </div>

      {/* Light Theme Gemini-Style Voice Input Bar */}
      {isCallActive && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2.5 w-full max-w-lg">
          {/* Push-to-Talk / Mic Toggle Button */}
          <button
            type="button"
            onClick={onToggleMic}
            title={isMicActive ? "Mute Microphone" : "Tap to Speak"}
            className={`p-3 rounded-2xl border transition-all ${
              isMicActive
                ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm animate-pulse'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'
            }`}
          >
            {isMicActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Live Real-Time Speech Text Input Box */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isMicActive ? "Listening... Speak or type your answer..." : "Type or tap microphone to speak..."}
            className="flex-1 px-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 shadow-sm transition-all"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 rounded-2xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white transition-all shadow-md shadow-teal-600/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      )}
    </div>
  );
}
