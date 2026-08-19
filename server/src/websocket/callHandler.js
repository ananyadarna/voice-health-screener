import { WebSocketServer } from 'ws';
import { getAIResponse } from '../services/llmService.js';
import { textToSpeech } from '../services/ttsService.js';
import { transcribeAudio } from '../services/sttService.js';
import { generateHealthReport } from '../services/reportService.js';

/**
 * Configure WebSocket server listener for voice intake sessions
 * @param {import('http').Server} server - Node HTTP server instance
 */
export function setupCallWebSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    // Session state per client connection
    const session = {
      transcriptHistory: [],
      isProcessing: false,
    };

    console.log('[WebSocket] Client connected');

    ws.on('message', async (message) => {
      try {
        let payload = {};
        
        // Handle both JSON strings and binary audio buffers
        if (typeof message === 'string' || message instanceof Buffer && message.toString().startsWith('{')) {
          try {
            payload = JSON.parse(message.toString());
          } catch {
            payload = { event: 'BINARY_AUDIO', data: message };
          }
        } else {
          payload = { event: 'BINARY_AUDIO', data: message };
        }

        switch (payload.event) {
          case 'START_CALL': {
            session.transcriptHistory = [];
            session.isProcessing = false;
            
            // Send connection confirmation & initial AI greeting turn
            ws.send(JSON.stringify({ event: 'STATUS', status: 'CONNECTED' }));
            
            const greeting = "Hello! I am your AI health assistant. May I please have your full name to start our intake?";
            session.transcriptHistory.push({ role: 'assistant', content: greeting });
            
            ws.send(JSON.stringify({ event: 'AGENT_TEXT', text: greeting }));
            
            const greetingAudio = await textToSpeech(greeting);
            if (greetingAudio) {
              ws.send(JSON.stringify({ event: 'AGENT_AUDIO', audio: greetingAudio }));
            }
            break;
          }

          case 'USER_TRANSCRIPT': {
            if (session.isProcessing) return;
            session.isProcessing = true;

            const userText = payload.text || '';
            if (!userText.trim()) {
              session.isProcessing = false;
              return;
            }

            // Append user response to context history
            session.transcriptHistory.push({ role: 'user', content: userText });
            ws.send(JSON.stringify({ event: 'STATUS', status: 'THINKING' }));

            // 1. Generate LLM AI agent response turn
            const agentReply = await getAIResponse(session.transcriptHistory);
            session.transcriptHistory.push({ role: 'assistant', content: agentReply });

            // 2. Stream textual reply to client
            ws.send(JSON.stringify({ event: 'AGENT_TEXT', text: agentReply }));
            ws.send(JSON.stringify({ event: 'STATUS', status: 'SPEAKING' }));

            // 3. Synthesize speech audio and send base64 chunk
            const audioBase64 = await textToSpeech(agentReply);
            ws.send(JSON.stringify({ event: 'AGENT_AUDIO', audio: audioBase64 }));

            session.isProcessing = false;
            ws.send(JSON.stringify({ event: 'STATUS', status: 'LISTENING' }));
            break;
          }

          case 'AUDIO_CHUNK':
          case 'BINARY_AUDIO': {
            // Process binary audio chunk via Speech-to-Text
            const audioData = payload.data || message;
            const userText = await transcribeAudio(audioData);
            
            if (userText) {
              ws.send(JSON.stringify({ event: 'TRANSCRIPT_UPDATE', role: 'user', text: userText }));
              
              // Trigger AI response turn
              session.transcriptHistory.push({ role: 'user', content: userText });
              const agentReply = await getAIResponse(session.transcriptHistory);
              session.transcriptHistory.push({ role: 'assistant', content: agentReply });

              ws.send(JSON.stringify({ event: 'AGENT_TEXT', text: agentReply }));
              const audioBase64 = await textToSpeech(agentReply);
              ws.send(JSON.stringify({ event: 'AGENT_AUDIO', audio: audioBase64 }));
            }
            break;
          }

          case 'END_CALL': {
            ws.send(JSON.stringify({ event: 'STATUS', status: 'GENERATING_REPORT' }));
            
            // Synthesize structured medical summary report
            const report = await generateHealthReport(session.transcriptHistory);
            ws.send(JSON.stringify({ event: 'FINAL_REPORT', report }));
            ws.send(JSON.stringify({ event: 'STATUS', status: 'DISCONNECTED' }));
            break;
          }

          default:
            console.warn('[WebSocket] Unknown event:', payload.event);
        }
      } catch (err) {
        console.error('[WebSocket] Processing error:', err.message);
        ws.send(JSON.stringify({ 
          event: 'ERROR', 
          message: 'Failed to process voice turn.' 
        }));
      }
    });

    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected');
    });
  });
}
