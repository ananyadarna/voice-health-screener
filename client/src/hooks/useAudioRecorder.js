import { useState, useRef, useCallback } from 'react';

/**
 * Custom hook to manage microphone audio recording and chunking
 * @param {Function} onAudioChunk - Callback receiving recorded audio Blob/Buffer chunks
 */
export function useAudioRecorder(onAudioChunk) {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  // Start microphone stream and slice audio into 500ms chunks
  const startRecording = useCallback(async () => {
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && onAudioChunk) {
          onAudioChunk(event.data);
        }
      };

      // Emit audio chunks every 500ms for lower transmission latency
      mediaRecorder.start(500);
      setIsRecording(true);
    } catch (error) {
      console.error('Microphone access denied or unsupported:', error);
      setPermissionError('Microphone access is denied or unsupported in this browser.');
    }
  }, [onAudioChunk]);

  // Stop recording and close microphone tracks
  const stopRecording = useCallback(() => {
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
