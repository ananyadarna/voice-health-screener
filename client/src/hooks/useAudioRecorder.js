import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for microphone recording and single-fire Web Speech Recognition
 * @param {Function} onTranscript - Callback receiving transcribed speech
 */
export function useAudioRecorder(onTranscript) {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const processedIndicesRef = useRef(new Set());

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal && !processedIndicesRef.current.has(i)) {
            processedIndicesRef.current.add(i);
            const transcriptText = event.results[i][0].transcript.trim();
            if (transcriptText && onTranscript) {
              onTranscript(transcriptText);
            }
          }
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

  // Start microphone and speech recognition
  const startRecording = useCallback(async () => {
    setPermissionError(null);
    processedIndicesRef.current.clear();

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

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(500);

      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access error:', error);
      setPermissionError('Microphone access is denied or unsupported.');
    }
  }, []);

  // Stop microphone and speech recognition
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignored
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setIsRecording(false);
    processedIndicesRef.current.clear();
  }, []);

  return {
    isRecording,
    permissionError,
    startRecording,
    stopRecording
  };
}
