import OpenAI from 'openai';
import { config } from '../config/env.js';

const openai = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : null;

/**
 * Transcribe binary audio buffer or base64 stream to text
 * @param {Buffer|ArrayBuffer} audioBuffer - Binary audio payload (WebM/WAV)
 * @param {string} mimeType - Audio mime type
 * @returns {Promise<string>} Transcribed text
 */
export async function transcribeAudio(audioBuffer, mimeType = 'audio/webm') {
  if (!openai) {
    // Return sample fallback string for local keyless testing
    return "Hi, my name is John Doe and I have had a severe headache for 2 days.";
  }

  try {
    const file = new File([audioBuffer], 'input_audio.webm', { type: mimeType });
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
    });

    return transcription.text || '';
  } catch (error) {
    console.error("STT Transcription Error:", error.message);
    return '';
  }
}
