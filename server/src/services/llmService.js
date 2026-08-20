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
- If the user's response is vague, ask a brief clarifying follow-up.
- Speak in simple language, avoiding complex clinical jargon.
- You can communicate in English or Hindi depending on the language used by the user.
`;

const openai = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : null;

/**
 * Generate fallback intake dialogue response based on turn count
 */
function getFallbackTurnResponse(history = []) {
  const turnCount = history.filter(h => h.role === 'user').length;
  if (turnCount === 1) return "Hello! I am your AI health assistant. May I please have your full name to start our intake?";
  if (turnCount === 2) return "Thank you. What is your main health concern or primary symptom today?";
  if (turnCount === 3) return "I understand. How long have you been experiencing this symptom?";
  if (turnCount === 4) return "On a scale from 1 to 10, how severe would you rate your symptom right now?";
  return "Thank you for sharing. Are you experiencing any other associated symptoms like fever or nausea?";
}

/**
 * Generate next conversational turn from dialogue history
 * @param {Array} history - Array of { role: 'user'|'assistant', content: string }
 * @returns {Promise<string>} AI text reply
 */
export async function getAIResponse(history = []) {
  if (!openai) {
    return getFallbackTurnResponse(history);
  }

  try {
    const messages = [
      { role: 'system', content: INTAKE_SYSTEM_PROMPT },
      ...history
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 120
    });

    return response.choices[0]?.message?.content?.trim() || getFallbackTurnResponse(history);
  } catch (error) {
    if (error.status === 429 || error.message?.includes('quota')) {
      console.warn("OpenAI LLM Quota Exceeded (429). Using intelligent intake turn fallback.");
    } else {
      console.error("LLM Generation Error:", error.message);
    }
    return getFallbackTurnResponse(history);
  }
}
