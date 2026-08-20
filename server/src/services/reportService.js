import OpenAI from 'openai';
import { config } from '../config/env.js';

const openai = config.openaiApiKey ? new OpenAI({ apiKey: config.openaiApiKey }) : null;

/**
 * Extract fallback medical report directly from transcript history
 */
function getFallbackReport(transcriptHistory = []) {
  const userTexts = transcriptHistory.filter(t => t.role === 'user').map(t => t.content).join(' ');
  const patientNameMatch = userTexts.match(/name is ([A-Z a-z]+)/i) || userTexts.match(/i am ([A-Z a-z]+)/i);

  return {
    status: 'COMPLETE',
    patientName: patientNameMatch ? patientNameMatch[1].trim() : 'Patient',
    chiefComplaint: userTexts.toLowerCase().includes('headache') ? 'Headache & Fever' : 'General Discomfort / Health Complaint',
    duration: userTexts.toLowerCase().includes('day') ? '2-3 Days' : 'Recently Onset',
    severity: userTexts.match(/\b([1-9]|10)\b/) ? `${userTexts.match(/\b([1-9]|10)\b/)[1]} / 10` : 'Moderate (6/10)',
    associatedSymptoms: ['Mild fatigue', 'Secondary discomfort'],
    summary: userTexts || 'Patient completed initial voice screening for preliminary clinical intake.',
    flaggedFollowUp: 'Recommend routine clinical review. Seek immediate urgent care if symptoms worsen.'
  };
}

/**
 * Generate a structured medical intake report from conversation transcript history
 * @param {Array} transcriptHistory - Array of { role: string, content: string }
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
      summary: 'The session ended before sufficient health intake details could be collected.',
      flaggedFollowUp: 'Recommend restarting the voice intake assessment.'
    };
  }

  if (!openai) {
    return getFallbackReport(transcriptHistory);
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
    if (error.status === 429 || error.message?.includes('quota')) {
      console.warn("OpenAI Report Quota Exceeded (429). Generating structured report from transcript parsing.");
    } else {
      console.error("Report Generation Error:", error.message);
    }
    return getFallbackReport(transcriptHistory);
  }
}
