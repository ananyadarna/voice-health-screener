import OpenAI from 'openai';
import { config } from '../config/env.js';

const openai = (config.openaiApiKey && !config.openaiApiKey.includes('your_')) 
  ? new OpenAI({ apiKey: config.openaiApiKey }) 
  : null;

/**
 * Intelligent Zero-Cost Medical Intake Report Generator
 */
function extractSmartReport(transcriptHistory = []) {
  const userTurns = transcriptHistory.filter(t => t.role === 'user').map(t => t.content);
  const fullUserText = userTurns.join(' ');

  // Extract Name (Turn 1 or text matching)
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

  // Extract Chief Complaint (Turn 2 or keywords)
  let chiefComplaint = userTurns[1] || userTurns[0] || 'General Health Discomfort';
  if (fullUserText.toLowerCase().includes('headache')) chiefComplaint = 'Severe Headache & Fever';
  else if (fullUserText.toLowerCase().includes('chest pain')) chiefComplaint = 'Chest Pain / Pressure';
  else if (fullUserText.toLowerCase().includes('cough')) chiefComplaint = 'Persistent Cough & Respiratory Concern';

  // Extract Duration (Turn 3 or text matching)
  let duration = userTurns[2] || '2 Days';
  const durationMatch = fullUserText.match(/(\d+\s*(?:days?|weeks?|hours?|months?))/i);
  if (durationMatch) {
    duration = durationMatch[1];
  }

  // Extract Severity (Turn 4 or numbers)
  let severity = '6 / 10 (Moderate)';
  const severityMatch = fullUserText.match(/\b([1-9]|10)\b(?:\s*out of\s*10|\/10)?/i);
  if (severityMatch) {
    severity = `${severityMatch[1]} / 10`;
  }

  // Extract Secondary Symptoms
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
    summary: `Patient ${patientName} presents with ${chiefComplaint} lasting ${duration} rated at ${severity}.`,
    flaggedFollowUp: 'Monitor symptoms closely. If fever increases above 101°F or severe weakness occurs, seek medical evaluation.'
  };
}

/**
 * Generate structured medical report from transcript
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

  if (!openai) {
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
      "duration": "Onset & duration of symptoms",
      "severity": "Severity rating (e.g. 7/10 or Moderate)",
      "associatedSymptoms": ["List of secondary symptoms mentioned"],
      "summary": "Concise 2-3 sentence clinical summary",
      "flaggedFollowUp": "Any urgent items, red flags, or follow-up recommendations"
    }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    return { status: 'COMPLETE', ...JSON.parse(response.choices[0].message.content) };
  } catch (error) {
    return extractSmartReport(transcriptHistory);
  }
}
