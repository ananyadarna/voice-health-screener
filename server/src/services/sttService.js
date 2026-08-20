import OpenAI from 'openai';
import { config } from '../config/env.js';

let aiClient = null;

if (config.groqApiKey && config.groqApiKey.startsWith('gsk_')) {
  aiClient = new OpenAI({
    apiKey: config.groqApiKey,
    baseURL: 'https://api.groq.com/openai/v1'
  });
} else if (config.openaiApiKey && !config.openaiApiKey.includes('your_')) {
  aiClient = new OpenAI({ apiKey: config.openaiApiKey });
}

/**
 * Transcribe binary audio buffer or base64 stream to text using Groq Whisper or OpenAI
 * @param {Buffer|ArrayBuffer} audioBuffer - Binary audio payload (WebM/WAV)
 * @param {string} mimeType - Audio mime type
 * @returns {Promise<string>} Transcribed text
 */
export async function transcribeAudio(audioBuffer, mimeType = 'audio/webm') {
  if (!aiClient) {
    return "Hi, my name is Ananya Darna and I have a severe headache for 2 days.";
  }

  try {
    const file = new File([audioBuffer], 'input_audio.webm', { type: mimeType });
    const model = config.groqApiKey ? 'whisper-large-v3-turbo' : 'whisper-1';

    const transcription = await aiClient.audio.transcriptions.create({
      file,
      model,
    });

    return transcription.text || '';
  } catch (error) {
    console.error("STT Transcription Error:", error.message);
    return '';
  }
}
