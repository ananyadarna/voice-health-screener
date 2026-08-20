import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for fast-response voice recognition with immediate silence detection
 * @param {Function} onTranscript - Callback receiving user's spoken phrase
 */
export function useAudioRecorder(onTranscript) {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const currentTranscriptRef = useRef('');

  // Configure Web Speech Recognition for instant response
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true; // Enable interim results for instant detection
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += text;
          } else {
            interimText += text;
          }
        }

        const candidateText = (finalText || interimText).trim();
        if (candidateText) {
          currentTranscriptRef.current = candidateText;

          // Clear existing silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // Trigger response after 500ms of user silence (instant turn response!)
          silenceTimerRef.current = setTimeout(() => {
            if (currentTranscriptRef.current && onTranscript) {
              onTranscript(currentTranscriptRef.current);
              currentTranscriptRef.current = '';
            }
          }, 500);
        }
      };

      recognition.onerror = (event) => {
        if (event.error !== 'no-speech') {
          console.warn('Speech Recognition notice:', event.error);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [onTranscript]);

  // Start microphone & instant speech engine
  const startRecording = useCallback(async () => {
    setPermissionError(null);
    currentTranscriptRef.current = '';

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
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

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
    currentTranscriptRef.current = '';
  }, []);

  return {
    isRecording,
    permissionError,
    startRecording,
    stopRecording
  };
}
