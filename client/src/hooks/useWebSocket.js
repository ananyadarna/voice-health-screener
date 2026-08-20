import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook to handle WebSocket connection, audio queue playback, and message events
 * @param {string} url - WebSocket server URL
 */
export function useWebSocket(url = 'ws://localhost:5000') {
  const [status, setStatus] = useState('IDLE'); // IDLE, CONNECTED, LISTENING, THINKING, SPEAKING, GENERATING_REPORT, DISCONNECTED
  const [transcript, setTranscript] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);

  // Play incoming base64 audio payload sequentially
  const playNextAudio = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const base64Audio = audioQueueRef.current.shift();
    
    if (!base64Audio) {
      playNextAudio();
      return;
    }

    try {
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      setStatus('SPEAKING');
      
      audio.onended = () => {
        setStatus('LISTENING');
        playNextAudio();
      };
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setStatus('LISTENING');
        playNextAudio();
      };

      audio.play().catch((err) => {
        console.warn('Auto-play blocked or audio error:', err);
        setStatus('LISTENING');
        playNextAudio();
      });
    } catch (err) {
      console.error('Audio creation error:', err);
      playNextAudio();
    }
  }, []);

  // Enqueue base64 audio string
  const queueAudioPayload = useCallback((base64Audio) => {
    if (!base64Audio) return;
    audioQueueRef.current.push(base64Audio);
    if (!isPlayingRef.current) {
      playNextAudio();
    }
  }, [playNextAudio]);

  // Connect & start intake call
  const startCall = useCallback(() => {
    setError(null);
    setReport(null);
    setTranscript([]);

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('CONNECTED');
      ws.send(JSON.stringify({ event: 'START_CALL' }));
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        switch (payload.event) {
          case 'STATUS':
            setStatus(payload.status);
            break;

          case 'AGENT_TEXT':
            setTranscript((prev) => [
              ...prev,
              { role: 'assistant', text: payload.text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
            ]);
            break;

          case 'AGENT_AUDIO':
            if (payload.audio) {
              queueAudioPayload(payload.audio);
            }
            break;

          case 'TRANSCRIPT_UPDATE':
            if (payload.text) {
              setTranscript((prev) => [
                ...prev,
                { role: payload.role || 'user', text: payload.text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
              ]);
            }
            break;

          case 'FINAL_REPORT':
            setReport(payload.report);
            setStatus('IDLE');
            break;

          case 'ERROR':
            setError(payload.message || 'An error occurred during intake.');
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket Error:', err);
      setError('Failed to connect to backend voice server.');
      setStatus('IDLE');
    };

    ws.onclose = () => {
      if (status !== 'GENERATING_REPORT') {
        setStatus('IDLE');
      }
    };
  }, [url, status, queueAudioPayload]);

  // Send textual user message turn
  const sendUserText = useCallback((text) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && text.trim()) {
      setTranscript((prev) => [
        ...prev,
        { role: 'user', text: text.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
      wsRef.current.send(JSON.stringify({ event: 'USER_TRANSCRIPT', text: text.trim() }));
    }
  }, []);

  // End active intake call
  const endCall = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setStatus('GENERATING_REPORT');
      wsRef.current.send(JSON.stringify({ event: 'END_CALL' }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    status,
    transcript,
    report,
    error,
    startCall,
    endCall,
    sendUserText
  };
}
