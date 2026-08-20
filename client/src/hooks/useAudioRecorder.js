import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for zero-latency, non-duplicating voice speech recognition
 * @param {Function} onTranscript - Callback receiving instant spoken user phrase
 */
export function useAudioRecorder(onTranscript) {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const sentIndicesRef = useRef(new Set());
  const isListeningRef = useRef(false);

  // Configure high-speed instant speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal && !sentIndicesRef.current.has(i)) {
            sentIndicesRef.current.add(i);
            const transcriptText = event.results[i][0].transcript.trim();
            
            if (transcriptText && onTranscript) {
              onTranscript(transcriptText);
            }
          }
        }
      };

      recognition.onerror = (event) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('Speech Recognition notice:', event.error);
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {
            // Ignored
          }
        }
      };

      recognitionRef.current = recognition;
    }
  }, [onTranscript]);

  // Start microphone & instant speech recognition
  const startRecording = useCallback(async () => {
    setPermissionError(null);
    sentIndicesRef.current.clear();
    isListeningRef.current = true;

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // Already started
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
    isListeningRef.current = false;
    sentIndicesRef.current.clear();

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
