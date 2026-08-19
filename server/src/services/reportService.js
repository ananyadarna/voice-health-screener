import OpenAI from 'openai';
import { config } from '../config/env.js';

const openai = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : null;

/**
 * Generate a structured medical intake report from conversation transcript history
 * @param {Array} transcriptHistory - Array of { role: string, content: string }
 * @returns {Promise<Object>} Formatted JSON report
 */
export async function generateHealthReport(transcriptHistory = []) {
  // Check for short or empty intake calls
  if (!transcriptHistory || transcriptHistory.length < 2) {
    return {
      status: 'INCOMPLETE',
      patientName: 'Not Provided',
      chiefComplaint: 'Call ended prematurely',
      duration: 'N/A',
      severity: 'N/A',
      associatedSymptoms: [],
      summary: 'The session ended before sufficient health intake details could be collected.',
      flaggedFollowUp: 'Recommend restarting the voice intake assessment.'
    };
  }

  // Fallback mock report if OpenAI key is omitted
  if (!openai) {
    const userTexts = transcriptHistory.filter(t => t.role === 'user').map(t => t.content).join(' ');
    return {
      status: 'COMPLETE',
      patientName: userTexts.match(/name is ([A-Z a-z]+)/i)?.[1] || 'Rahul Sharma',
      chiefComplaint: 'Headache & Mild Fever',
      duration: '2 Days',
      severity: '6 / 10',
      associatedSymptoms: ['Mild dizziness', 'Sensitivity to light'],
      summary: 'Patient reports persistent headache and low-grade fever starting 2 days ago with moderate severity.',
      flaggedFollowUp: 'Monitor for increasing fever or neck stiffness. Consult physician if symptoms persist.'
    };
  }

  try {
    const prompt = `
    Analyze the following healthcare intake conversation transcript and extract structured clinical information.
    
    Transcript:
    ${JSON.stringify(transcriptHistory, null, 2)}

    Return a JSON object adhering to this exact schema:
    {
      "status": "COMPLETE",
      "patientName": "Extracted name or 'Not Provided'",
      "chiefComplaint": "Primary symptom or reason for intake call",
      "duration": "Onset & duration of symptoms",
      "severity": "Severity rating (e.g. 7/10 or Moderate)",
      "associatedSymptoms": ["List of other secondary symptoms mentioned"],
      "summary": "Concise 2-3 sentence clinical summary of the conversation",
      "flaggedFollowUp": "Any urgent items, red flags, or follow-up recommendations"
    }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    return { status: 'COMPLETE', ...parsed };
  } catch (error) {
    console.error("Report Generation Error:", error.message);
    return {
      status: 'ERROR',
      summary: 'Failed to synthesize medical report from transcript.',
      details: error.message
    };
  }
}
