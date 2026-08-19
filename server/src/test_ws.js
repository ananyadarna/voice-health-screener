import WebSocket from 'ws';

// CLI test script to verify WebSocket events end-to-end
const ws = new WebSocket('ws://localhost:5000');

ws.on('open', () => {
  console.log('Test Client: Connected to WebSocket server');
  console.log('Sending START_CALL...');
  ws.send(JSON.stringify({ event: 'START_CALL' }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  console.log(`[Event Received]: ${msg.event}`, msg.text || msg.status || '');

  if (msg.event === 'AGENT_TEXT' && msg.text.includes('full name')) {
    console.log('Simulating user turn: Sending patient name...');
    setTimeout(() => {
      ws.send(JSON.stringify({ 
        event: 'USER_TRANSCRIPT', 
        text: 'My name is Ananya Darna, and I have severe headaches.' 
      }));
    }, 1000);
  } else if (msg.event === 'AGENT_TEXT' && msg.text.includes('concern')) {
    console.log('Simulating end of call...');
    setTimeout(() => {
      ws.send(JSON.stringify({ event: 'END_CALL' }));
    }, 1000);
  } else if (msg.event === 'FINAL_REPORT') {
    console.log('\n--- STRUCTURED REPORT GENERATED ---');
    console.dir(msg.report, { depth: null });
    console.log('Test Completed Successfully!');
    ws.close();
    process.exit(0);
  }
});

ws.on('error', (err) => {
  console.error('Test Client Error:', err.message);
});
