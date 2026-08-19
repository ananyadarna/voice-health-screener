import express from 'express';
import http from 'http';
import cors from 'cors';
import { config } from './config/env.js';
import { setupCallWebSocket } from './websocket/callHandler.js';

const app = express();

// Enable CORS for client frontend
app.use(cors({
  origin: [config.allowedOrigin, 'http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Voice Health Screener Server', time: new Date() });
});

// Create HTTP server instance
const server = http.createServer(app);

// Attach WebSocket server listener
setupCallWebSocket(server);

// Start server
server.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
  console.log(`WebSocket endpoint ready at ws://localhost:${config.port}`);
});
