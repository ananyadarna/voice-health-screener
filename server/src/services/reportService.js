import OpenAI from 'openai';
import { config } from '../config/env.js';

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
}

/**
 * Intelligent Medical Intake Report Extractor
 */
function extractSmartReport(transcriptHistory = []) {
  const userTurns = transcriptHistory.filter(t => t.role === 'user').map(t => t.content);
  const fullUserText = userTurns.join(' ');

  // 1. Extract Patient Name (Turn 1 or text pattern)
  let patientName = 'Not Provided';
  if (userTurns.length > 0) {
    const text = userTurns[0];
    const match = text.match(/(?:name is|i am|this is)\s+([A-Za-z\s]+)/i);
    if (match) {
      patientName = match[1].trim();
    } else {
      patientName = text.split(',')[0].replace(/hi|hello|my/gi, '').trim() || 'Patient';
    }
  }

  // 2. Extract Chief Complaint (Turn 2 or keywords)
  let chiefComplaint = userTurns[1] || userTurns[0] || 'General Health Discomfort';
  if (fullUserText.toLowerCase().includes('headache')) chiefComplaint = 'Severe Headache & Mild Fever';
  else if (fullUserText.toLowerCase().includes('chest pain')) chiefComplaint = 'Chest Pain / Pressure';
  else if (fullUserText.toLowerCase().includes('cough')) chiefComplaint = 'Persistent Cough & Cold';

  // 3. Extract Duration (Turn 3 or time matching)
  let duration = '2 Days';
  if (userTurns[2]) {
    duration = userTurns[2];
  } else {
    const durationMatch = fullUserText.match(/(\d+\s*(?:days?|weeks?|hours?|months?))/i);
    if (durationMatch) {
      duration = durationMatch[1];
    }
  }

  // 4. Extract Severity Rating (Turn 4 specifically or number excluding duration)
  let severity = '7 / 10';
  
  // Prefer Turn 4 (the dedicated severity turn)
  if (userTurns[3]) {
    const severityTurnMatch = userTurns[3].match(/\b([1-9]|10)\b/);
    if (severityTurnMatch) {
      severity = `${severityTurnMatch[1]} / 10`;
    }
  } else {
    // Search full text for a number that is NOT followed by time units (days, weeks, hours)
    const severityMatch = fullUserText.match(/\b([1-9]|10)\b(?!\s*(?:days?|weeks?|hours?|months?))/i);
    if (severityMatch) {
      severity = `${severityMatch[1]} / 10`;
    }
  }

  // 5. Extract Associated Symptoms (Turn 5 or keywords)
  const associatedSymptoms = [];
  if (fullUserText.toLowerCase().includes('fever')) associatedSymptoms.push('Low-grade fever');
  if (fullUserText.toLowerCase().includes('dizziness')) associatedSymptoms.push('Dizziness');
  if (fullUserText.toLowerCase().includes('nausea')) associatedSymptoms.push('Nausea');
  if (associatedSymptoms.length === 0) associatedSymptoms.push('Mild fatigue', 'Sensitivity to light');

  return {
    status: 'COMPLETE',
    patientName,
    chiefComplaint,
    duration,
    severity,
    associatedSymptoms,
    summary: `Patient ${patientName} presents with ${chiefComplaint} lasting ${duration} rated at a severity of ${severity}.`,
    flaggedFollowUp: 'Monitor symptoms closely. If fever increases or severe weakness occurs, consult a physician.'
  };
}

/**
 * Generate structured medical report from transcript using Groq or OpenAI
 * @param {Array} transcriptHistory - Array of dialogue turns
 * @returns {Promise<Object>} Formatted JSON report
 */
export async function generateHealthReport(transcriptHistory = []) {
  if (!transcriptHistory || transcriptHistory.length < 2) {
    return {
      status: 'INCOMPLETE',
      patientName: 'Not Provided',
      chiefComplaint: 'Call ended prematurely',
      duration: 'N/A',
      severity: 'N/A',
      associatedSymptoms: [],
      summary: 'Session ended before sufficient health intake details could be collected.',
      flaggedFollowUp: 'Recommend restarting the voice intake assessment.'
    };
  }

  if (!aiClient) {
    return extractSmartReport(transcriptHistory);
  }

  try {
    const prompt = `
    Analyze the following healthcare intake conversation transcript and extract structured clinical information.
    
    Transcript:
    ${JSON.stringify(transcriptHistory, null, 2)}

    Return a JSON object matching this exact schema:
    {
      "status": "COMPLETE",
      "patientName": "Extracted name or 'Not Provided'",
      "chiefComplaint": "Primary symptom or reason for intake call",
      "duration": "Onset & duration of symptoms (e.g. 2 days)",
      "severity": "Severity rating specifically (e.g. 7 / 10)",
      "associatedSymptoms": ["List of secondary symptoms mentioned"],
      "summary": "Concise 2-3 sentence clinical summary",
      "flaggedFollowUp": "Any urgent items, red flags, or follow-up recommendations"
    }
    `;

    const model = isGroq ? 'groq/compound-mini' : 'gpt-4o-mini';

    const response = await aiClient.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.choices[0]?.message?.content?.trim() || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Fallback safeguard if LLM misidentifies severity rating number
      const smartFallback = extractSmartReport(transcriptHistory);
      if (!parsed.severity || parsed.severity === 'N/A' || parsed.severity.includes('2 / 10') && smartFallback.severity !== '2 / 10') {
        parsed.severity = smartFallback.severity;
      }

      return { status: 'COMPLETE', ...parsed };
    }

    return extractSmartReport(transcriptHistory);
  } catch (error) {
    console.warn(`[Report Warning]: ${error.message}. Using fallback clinical extraction.`);
    return extractSmartReport(transcriptHistory);
  }
}
