import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook to handle real-time continuous browser Speech Recognition & microphone recording
 * @param {Function} onTranscript - Callback receiving real-time transcribed user speech text
 */
export function useAudioRecorder(onTranscript) {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize Web Speech Recognition engine if supported by browser
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const lastIndex = event.results.length - 1;
        const transcriptText = event.results[lastIndex][0].transcript.trim();
        
        if (transcriptText && onTranscript) {
          onTranscript(transcriptText);
        }
      };

      recognition.onerror = (event) => {
        if (event.error !== 'no-speech') {
          console.warn('Web Speech Recognition error:', event.error);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [onTranscript]);

  // Start microphone stream and instant speech recognition
  const startRecording = useCallback(async () => {
    setPermissionError(null);
    try {
      // 1. Start browser native Web Speech Recognition for instant transcription
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // Already started
        }
      }

      // 2. Start MediaRecorder as audio stream backup
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.start(500);
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access denied:', error);
      setPermissionError('Microphone access is denied or unsupported in this browser.');
    }
  }, []);

  // Stop microphone recording and speech recognition
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
  }, []);

  return {
    isRecording,
    permissionError,
    startRecording,
    stopRecording
  };
}
