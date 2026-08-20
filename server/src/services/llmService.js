import OpenAI from 'openai';
import { config } from '../config/env.js';

// Empathetic System Prompt for LLM
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

// Initialize OpenAI client if valid key is set
const openai = (config.openaiApiKey && !config.openaiApiKey.includes('your_')) 
  ? new OpenAI({ apiKey: config.openaiApiKey }) 
  : null;

/**
 * Smart Free Intake Dialogue State Machine (Zero-Cost Local AI Engine)
 */
function getSmartIntakeTurn(history = []) {
  const userTurns = history.filter(h => h.role === 'user');
  const count = userTurns.length;

  if (count === 0) {
    return "Hello! I am your AI health intake assistant. May I please have your full name to get started?";
  }

  const lastUserText = userTurns[userTurns.length - 1]?.content?.toLowerCase() || '';

  // Step 1 -> Step 2: Name recorded -> Ask Primary Symptom
  if (count === 1) {
    const nameMatch = userTurns[0].content.replace(/my name is|i am|this is/gi, '').trim();
    const name = nameMatch ? nameMatch.split(' ')[0] : 'there';
    return `Thank you ${name}. What primary symptom or health concern are you experiencing today?`;
  }

  // Step 2 -> Step 3: Symptom recorded -> Ask Onset/Duration
  if (count === 2) {
    return "I understand. When did this symptom first start, and how long has it been bothering you?";
  }

  // Step 3 -> Step 4: Duration recorded -> Ask Severity
  if (count === 3) {
    return "Thank you for sharing that. On a scale of 1 to 10, how severe would you rate your discomfort right now?";
  }

  // Step 4 -> Step 5: Severity recorded -> Ask Secondary Symptoms
  if (count === 4) {
    return "Got it. Are you experiencing any other secondary symptoms like fever, nausea, or dizziness?";
  }

  // Step 5+: Assessment Complete
  return "Thank you so much for providing all those details. I have recorded your intake information and will now generate your clinical summary report.";
}

/**
 * Generate next conversational turn from dialogue history
 * @param {Array} history - Array of { role: 'user'|'assistant', content: string }
 * @returns {Promise<string>} AI text reply
 */
export async function getAIResponse(history = []) {
  if (!openai) {
    return getSmartIntakeTurn(history);
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

    return response.choices[0]?.message?.content?.trim() || getSmartIntakeTurn(history);
  } catch (error) {
    // Catch quota errors (429) or connection issues and seamlessly use free intake engine
    return getSmartIntakeTurn(history);
  }
}
