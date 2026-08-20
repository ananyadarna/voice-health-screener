import React, { useState, useCallback } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { StatusBadge } from './components/StatusBadge';
import { CallControls } from './components/CallControls';
import { Transcript } from './components/Transcript';
import { HealthReport } from './components/HealthReport';
import { Stethoscope, ShieldCheck, HeartPulse } from 'lucide-react';

export default function App() {
  const [speechText, setSpeechText] = useState('');

  // 1. WebSocket Hook
  const {
    status,
    transcript,
    report,
    error: wsError,
    startCall: initWsCall,
    endCall: termWsCall,
    sendUserText
  } = useWebSocket('ws://localhost:5000');

  // 2. Stable Live Speech Callback
  const handleLiveSpeechText = useCallback((text) => {
    setSpeechText(text);
  }, []);

  // 3. Audio Recorder Hook with Buffer Reset
  const {
    isRecording,
    permissionError,
    startRecording,
    stopRecording,
    resetSpeechBuffer
  } = useAudioRecorder(handleLiveSpeechText);

  // Handle Start Call
  const handleStartCall = async () => {
    setSpeechText('');
    initWsCall();
    await startRecording();
  };

  // Handle End Call
  const handleEndCall = () => {
    stopRecording();
    termWsCall();
    setSpeechText('');
  };

  // Toggle Microphone
  const handleToggleMic = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Send turn text & reset speech recognition buffer for new turn
  const handleSendText = (text) => {
    sendUserText(text);
    setSpeechText('');
    resetSpeechBuffer();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Voice Health Screener
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 uppercase font-semibold">
                  AI Live Intake
                </span>
              </h1>
              <p className="text-xs text-slate-400">Sasahyog Technologies Clinical Intake Reference</p>
            </div>
          </div>

          <StatusBadge status={status} />
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 flex flex-col gap-6">
        {/* Error Alerts */}
        {(wsError || permissionError) && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
            {wsError || permissionError}
          </div>
        )}

        {/* Hero Banner */}
        <div className="text-center my-2">
          <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
            Interactive AI Patient Intake Screener
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto mt-1">
            Conduct a preliminary health assessment using Gemini-style live voice input in English or Hindi.
          </p>
        </div>

        {/* Gemini-Style Live Call Control Dashboard */}
        <CallControls
          status={status}
          onStartCall={handleStartCall}
          onEndCall={handleEndCall}
          onSendText={handleSendText}
          speechText={speechText}
          isMicActive={isRecording}
          onToggleMic={handleToggleMic}
        />

        {/* Real-time Dialogue Transcript */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-teal-400" />
              Live Conversation Transcript
            </h3>
            <span className="text-[11px] text-slate-500">{transcript.length} turns recorded</span>
          </div>
          <Transcript transcript={transcript} />
        </div>

        {/* Formatted Medical Report Dashboard */}
        <HealthReport report={report} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-500">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-600" />
          <span>Sasahyog Technologies Assignment • Confidential Medical Intake Screener</span>
        </div>
      </footer>
    </div>
  );
}
