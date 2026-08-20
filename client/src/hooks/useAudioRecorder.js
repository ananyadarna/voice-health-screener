import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for turn-based speech recognition with echo cancellation
 * @param {Function} onTranscript - Callback receiving single spoken user phrase
 */
export function useAudioRecorder(onTranscript) {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  
  const recognitionRef = useRef(null);
  const streamRef = useRef(null);
  const isProcessingRef = useRef(false);

  // Initialize single-turn speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Turn-based single phrase recognition
      recognition.interimResults = false; // Send only finalized phrase
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        if (isProcessingRef.current) return;

        const transcriptText = event.results[0][0].transcript.trim();
        if (transcriptText && onTranscript) {
          isProcessingRef.current = true;
          onTranscript(transcriptText);

          // Reset processing lock after brief delay
          setTimeout(() => {
            isProcessingRef.current = false;
          }, 1500);
        }
      };

      recognition.onerror = (event) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn('Speech Recognition notice:', event.error);
        }
      };

      recognition.onend = () => {
        // Automatically restart listening if call session is still active and not processing
        if (isRecording && !isProcessingRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch {
            // Ignored
          }
        }
      };

      recognitionRef.current = recognition;
    }
  }, [onTranscript, isRecording]);

  // Start microphone
  const startRecording = useCallback(async () => {
    setPermissionError(null);
    isProcessingRef.current = false;

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
    isProcessingRef.current = false;

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
