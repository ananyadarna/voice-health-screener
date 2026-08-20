import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for Gemini-style Speech-to-Text with strict mute/unmute control
 * @param {Function} onSpeechText - Callback receiving real-time transcribed text
 */
export function useAudioRecorder(onSpeechText) {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const onSpeechTextRef = useRef(onSpeechText);
  const resultOffsetRef = useRef(0);
  const isPausedByAIRef = useRef(false);
  const isRecordingRef = useRef(false);

  // Keep callback reference updated
  useEffect(() => {
    onSpeechTextRef.current = onSpeechText;
  }, [onSpeechText]);

  // Sync state ref
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Expose global pause / resume functions for WebSocket TTS events
  useEffect(() => {
    window.pauseSpeechRecognition = () => {
      isPausedByAIRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignored
        }
      }
    };

    window.resumeSpeechRecognition = () => {
      isPausedByAIRef.current = false;
      resultOffsetRef.current = 0;
      if (recognitionRef.current && streamRef.current && isRecordingRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // Ignored
        }
      }
    };

    return () => {
      delete window.pauseSpeechRecognition;
      delete window.resumeSpeechRecognition;
    };
  }, []);

  // Clear speech buffer for new turn
  const resetSpeechBuffer = useCallback(() => {
    resultOffsetRef.current = 0;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignored
      }
    }
  }, []);

  // Initialize Speech Recognition with strict mute guard
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        // Strict Mute Check: Ignore all input if mic is muted or AI is speaking out loud
        if (!isRecordingRef.current || window.isAISpeaking || isPausedByAIRef.current) {
          return;
        }

        let transcript = '';
        for (let i = resultOffsetRef.current; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        if (transcript.trim() && onSpeechTextRef.current) {
          onSpeechTextRef.current(transcript.trim());
        }
      };

      recognition.onerror = (event) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('Speech Recognition notice:', event.error);
        }
      };

      recognition.onend = () => {
        // Auto restart ONLY if mic is explicitly UNMUTED and AI is not speaking
        if (isRecordingRef.current && streamRef.current && !isPausedByAIRef.current && !window.isAISpeaking && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {
            // Ignored
          }
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Start microphone
  const startRecording = useCallback(async () => {
    setPermissionError(null);
    resultOffsetRef.current = 0;
    isPausedByAIRef.current = false;
    isRecordingRef.current = true;
    setIsRecording(true);

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // Already active
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
    } catch (error) {
      console.error('Microphone access error:', error);
      setPermissionError('Microphone access is denied or unsupported.');
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  }, []);

  // Stop microphone (Mute)
  const stopRecording = useCallback(() => {
    resultOffsetRef.current = 0;
    isPausedByAIRef.current = false;
    isRecordingRef.current = false;
    setIsRecording(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignored
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  return {
    isRecording,
    permissionError,
    startRecording,
    stopRecording,
    resetSpeechBuffer
  };
}
