import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook to handle WebSocket connection, audio queue playback, and Web Speech API fallback
 * @param {string} url - WebSocket server URL
 */
export function useWebSocket(url = 'ws://localhost:5000') {
  const [status, setStatus] = useState('IDLE');
  const [transcript, setTranscript] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);

  // Browser Web Speech API text-to-speech fallback
  const speakTextWithBrowser = useCallback((text) => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      setStatus('SPEAKING');
      window.isAISpeaking = true;

      utterance.onend = () => {
        setStatus('LISTENING');
        window.isAISpeaking = false;
      };
      utterance.onerror = () => {
        setStatus('LISTENING');
        window.isAISpeaking = false;
      };
      
      window.speechSynthesis.speak(utterance);
    } else {
      setStatus('LISTENING');
      window.isAISpeaking = false;
    }
  }, []);

  // Play incoming base64 audio payload sequentially
  const playNextAudio = useCallback(() => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      window.isAISpeaking = false;
      return;
    }

    isPlayingRef.current = true;
    window.isAISpeaking = true;
    const item = audioQueueRef.current.shift();
    
    if (!item || !item.audio) {
      if (item && item.text) {
        speakTextWithBrowser(item.text);
      } else {
        setStatus('LISTENING');
        window.isAISpeaking = false;
      }
      isPlayingRef.current = false;
      return;
    }

    try {
      const audio = new Audio(`data:audio/mp3;base64,${item.audio}`);
      setStatus('SPEAKING');
      window.isAISpeaking = true;
      
      audio.onended = () => {
        setStatus('LISTENING');
        window.isAISpeaking = false;
        playNextAudio();
      };
      
      audio.onerror = () => {
        speakTextWithBrowser(item.text);
        playNextAudio();
      };

      audio.play().catch(() => {
        speakTextWithBrowser(item.text);
        playNextAudio();
      });
    } catch {
      speakTextWithBrowser(item.text);
      playNextAudio();
    }
  }, [speakTextWithBrowser]);

  // Enqueue audio item or fallback text
  const queueAudioPayload = useCallback((base64Audio, text) => {
    if (!base64Audio) {
      speakTextWithBrowser(text);
      return;
    }
    audioQueueRef.current.push({ audio: base64Audio, text });
    if (!isPlayingRef.current) {
      playNextAudio();
    }
  }, [playNextAudio, speakTextWithBrowser]);

  // Connect & start intake call
  const startCall = useCallback(() => {
    setError(null);
    setReport(null);
    setTranscript([]);
    window.isAISpeaking = false;

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
            if (payload.status === 'SPEAKING' || payload.status === 'THINKING') {
              window.isAISpeaking = true;
            } else {
              window.isAISpeaking = false;
            }
            break;

          case 'AGENT_TEXT': {
            const agentReplyText = payload.text || '';
            setTranscript((prev) => [
              ...prev,
              { role: 'assistant', text: agentReplyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
            ]);
            speakTextWithBrowser(agentReplyText);
            break;
          }

          case 'AGENT_AUDIO':
            if (payload.audio) {
              queueAudioPayload(payload.audio, '');
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
            window.isAISpeaking = false;
            break;

          case 'ERROR':
            setError(payload.message || 'An error occurred during intake.');
            window.isAISpeaking = false;
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
      window.isAISpeaking = false;
    };

    ws.onclose = () => {
      if (status !== 'GENERATING_REPORT') {
        setStatus('IDLE');
      }
      window.isAISpeaking = false;
    };
  }, [url, status, queueAudioPayload, speakTextWithBrowser]);

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
    window.isAISpeaking = false;
  }, []);

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
