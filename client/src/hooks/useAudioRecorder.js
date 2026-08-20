import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for Gemini-style live Speech-to-Text populating input bar
 * @param {Function} onSpeechText - Callback receiving real-time transcribed text
 */
export function useAudioRecorder(onSpeechText) {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);

  // Configure continuous Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        if (transcript.trim() && onSpeechText) {
          onSpeechText(transcript.trim());
        }
      };

      recognition.onerror = (event) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('Speech Recognition notice:', event.error);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [onSpeechText]);

  // Start microphone & real-time text population
  const startRecording = useCallback(async () => {
    setPermissionError(null);

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
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access error:', error);
      setPermissionError('Microphone access is denied or unsupported.');
    }
  }, []);

  // Stop microphone
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignored
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setIsRecording(false);
  }, []);

  return {
    isRecording,
    permissionError,
    startRecording,
    stopRecording
  };
}
