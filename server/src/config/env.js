import dotenv from 'dotenv';
dotenv.config();

// Export loaded environment variables with defaults
export const config = {
  port: process.env.PORT || 5000,
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  deepgramApiKey: process.env.DEEPGRAM_API_KEY || '',
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY || '',
  allowedOrigin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
};
