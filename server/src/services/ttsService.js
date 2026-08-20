import OpenAI from 'openai';
import { config } from '../config/env.js';

const openai = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : null;

/**
 * Convert text response to base64 encoded audio string
 * @param {string} text - Response text to speak
 * @returns {Promise<string>} Base64 audio string (MP3) or empty string on quota fallback
 */
export async function textToSpeech(text) {
  if (!openai || !text) {
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
    // Graceful handling for 429 Quota Exceeded or invalid key
    if (error.status === 429 || error.message?.includes('quota')) {
      console.warn("OpenAI API Quota Exceeded (429). Falling back to text & Web Speech API output.");
    } else {
      console.error("TTS Synthesis Error:", error.message);
    }
    return "";
  }
}
