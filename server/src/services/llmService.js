import OpenAI from 'openai';
import { config } from '../config/env.js';

// System prompt guiding the AI to act as an empathetic health intake assistant
export const INTAKE_SYSTEM_PROMPT = `
You are an empathetic medical intake voice assistant conducting a preliminary health screening.
Your goal is to collect the following information efficiently and gently:
1. Patient's Name
2. Primary Symptom / Chief Complaint
3. Onset and Duration (When did it start?)
4. Severity rating (1 to 10 scale or qualitative description)
5. Any secondary or associated symptoms

RULES:
- Ask only ONE question at a time.
- Keep responses concise (maximum 1-2 short sentences) since your output will be converted to speech.
- Be supportive, calm, and professional.
- Speak in simple language, avoiding complex clinical jargon.
- You can communicate in English or Hindi depending on the language used by the user.
`;

let aiClient = null;
let isGroq = false;

if (config.groqApiKey && config.groqApiKey.startsWith('gsk_')) {
  aiClient = new OpenAI({
    apiKey: config.groqApiKey,
    baseURL: 'https://api.groq.com/openai/v1'
  });
  isGroq = true;
} else if (config.openaiApiKey && !config.openaiApiKey.includes('your_')) {
  aiClient = new OpenAI({ apiKey: config.openaiApiKey });
  isGroq = false;
}

/**
 * Smart Free Intake Dialogue State Machine (Fallback)
 */
function getSmartIntakeTurn(history = []) {
  const userTurns = history.filter(h => h.role === 'user');
  const count = userTurns.length;

  if (count === 0) {
    return "Hello! I am your AI health intake assistant. May I please have your full name to get started?";
  }

  const lastUserText = userTurns[userTurns.length - 1]?.content || '';

  if (count === 1) {
    const nameMatch = lastUserText.replace(/my name is|i am|this is/gi, '').trim();
    const name = nameMatch ? nameMatch.split(' ')[0] : 'there';
    return `Thank you ${name}. What primary symptom or health concern are you experiencing today?`;
  }

  if (count === 2) {
    return "I understand. When did this symptom first start, and how long has it been bothering you?";
  }

  if (count === 3) {
    return "Thank you for sharing that. On a scale of 1 to 10, how severe would you rate your discomfort right now?";
  }

  if (count === 4) {
    return "Got it. Are you experiencing any other secondary symptoms like fever, nausea, or dizziness?";
  }

  return "Thank you so much for providing all those details. I have recorded your intake information and will now generate your clinical summary report.";
}

/**
 * Generate next conversational turn from dialogue history
 * @param {Array} history - Array of { role: 'user'|'assistant', content: string }
 * @returns {Promise<string>} AI text reply
 */
export async function getAIResponse(history = []) {
  if (!aiClient) {
    return getSmartIntakeTurn(history);
  }

  try {
    const messages = [
      { role: 'system', content: INTAKE_SYSTEM_PROMPT },
      ...history
    ];

    // Standard Groq models: llama-3.1-8b-instant, llama3-70b-8192, llama3-8b-8192
    const model = isGroq ? 'llama-3.1-8b-instant' : 'gpt-4o-mini';

    const response = await aiClient.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 120
    });

    return response.choices[0]?.message?.content?.trim() || getSmartIntakeTurn(history);
  } catch (error) {
    console.warn(`[LLM Error]: ${error.message}. Using intake state machine turn.`);
    return getSmartIntakeTurn(history);
  }
}
