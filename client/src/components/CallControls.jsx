import React, { useState, useEffect } from 'react';
import { PhoneCall, PhoneOff, Send, Mic, MicOff } from 'lucide-react';

/**
 * Gemini-Style Voice & Text Input Call Controls
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

  // Populate text input box in real-time as user speaks (Gemini pattern)
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
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto my-4">
      {/* Audio Visualizer Waveform */}
      {isCallActive && (
        <div className="flex items-center gap-1.5 h-10">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full bg-gradient-to-t from-teal-500 to-emerald-400 transition-all duration-300 ${
                status === 'SPEAKING' || isMicActive
                  ? 'animate-pulse-fast'
                  : 'h-3 opacity-30'
              }`}
              style={{
                height: isCallActive ? `${Math.sin(i + 1) * 16 + 24}px` : '10px',
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

      {/* Gemini-Style Voice Input Bar */}
      {isCallActive && (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full max-w-lg relative">
          {/* Push-to-Talk / Mic Toggle Button */}
          <button
            type="button"
            onClick={onToggleMic}
            title={isMicActive ? "Mute Microphone" : "Tap to Speak"}
            className={`p-3 rounded-xl border transition-all ${
              isMicActive
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
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
            className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-500"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white transition-colors shadow-md shadow-teal-600/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      )}
    </div>
  );
}
