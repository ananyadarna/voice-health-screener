import OpenAI from 'openai';
import { config } from '../config/env.js';

const openai = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : null;

/**
 * Convert text response to base64 encoded audio string
 * @param {string} text - Response text to speak
 * @returns {Promise<string>} Base64 audio string (MP3)
 */
export async function textToSpeech(text) {
  if (!openai || !text) {
    // Return empty string or dummy base64 snippet for testing without key
    return "";
  }

  try {
    const mp3Response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
      response_format: 'mp3'
    });

    const buffer = Buffer.from(await mp3Response.arrayBuffer());
    return buffer.toString('base64');
  } catch (error) {
    console.error("TTS Synthesis Error:", error.message);
    return "";
  }
}
