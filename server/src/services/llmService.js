import OpenAI from 'openai';
import { config } from '../config/env.js';

// Empathetic System Prompt enforcing progressive single questions without repeats
export const INTAKE_SYSTEM_PROMPT = `
You are an empathetic medical intake voice assistant conducting a preliminary health screening.

Target Information to Collect Sequentially:
1. Patient's Name
2. Primary Symptom / Chief Complaint
3. Onset and Duration (When did it start?)
4. Severity rating (1 to 10 scale)
5. Secondary or associated symptoms (fever, nausea, dizziness, etc.)

STRICT CONVERSATIONAL RULES:
- Review the entire conversation history carefully before responding.
- NEVER repeat a question that has already been asked or answered in previous turns.
- Ask only ONE question at a time.
- Keep your response very concise (1-2 short sentences maximum).
- Progress sequentially to the next uncollected piece of information.
- Once all 5 pieces of information are collected, thank the patient and state that you are preparing their summary report.
- Speak in supportive, simple language in English or Hindi as used by the patient.
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
 * Smart Intake State Machine (Guarantees progressive unrepeated questions)
 */
function getSmartIntakeTurn(history = []) {
  // Extract user messages
  const userTurns = history.filter(h => h.role === 'user');
  const assistantTurns = history.filter(h => h.role === 'assistant');
  const count = userTurns.length;

  const fullText = userTurns.map(u => u.content).join(' ').toLowerCase();

  // Check what has already been asked or answered
  const hasName = fullText.includes('name') || count >= 1;
  const hasSymptom = fullText.includes('headache') || fullText.includes('pain') || fullText.includes('fever') || count >= 2;
  const hasDuration = fullText.includes('day') || fullText.includes('week') || fullText.includes('hour') || count >= 3;
  const hasSeverity = fullText.match(/\b([1-9]|10)\b/) || count >= 4;

  if (count === 0) {
    return "Hello! I am your AI health intake assistant. May I please have your full name to get started?";
  }

  if (count === 1) {
    const lastName = userTurns[0]?.content.replace(/my name is|i am|this is/gi, '').trim().split(' ')[0] || 'there';
    return `Thank you ${lastName}. What primary symptom or health concern are you experiencing today?`;
  }

  if (count === 2) {
    return "I understand. When did this symptom first start, and how long has it been bothering you?";
  }

  if (count === 3) {
    return "Thank you. On a scale of 1 to 10, how severe would you rate your symptom right now?";
  }

  if (count === 4) {
    return "Got it. Are you experiencing any other associated symptoms like fever, nausea, or dizziness?";
  }

  return "Thank you for providing all those details. I have recorded your intake information and am now preparing your clinical summary report.";
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

    const model = isGroq ? 'groq/compound-mini' : 'gpt-4o-mini';

    const response = await aiClient.chat.completions.create({
      model,
      messages,
      temperature: 0.5,
      max_tokens: 100
    });

    const reply = response.choices[0]?.message?.content?.trim();
    return reply || getSmartIntakeTurn(history);
  } catch (error) {
    console.warn(`[LLM Warning]: ${error.message}. Using state machine turn.`);
    return getSmartIntakeTurn(history);
  }
}
