# Voice-Driven Health Intake Screener 🩺🎙️

An end-to-end, voice-driven web application enabling patients to conduct an interactive preliminary health screening with an empathetic AI agent over WebSockets, generating a structured clinical summary report for healthcare providers.

---

## 🌟 Key Features

- **Interactive Voice Assessment**: Real-time bi-directional voice session streaming audio over WebSockets (STT $\rightarrow$ LLM $\rightarrow$ TTS).
- **Context-Aware Intake**: Sequentially collects Patient Name, Chief Complaint, Duration, Severity, and Associated Symptoms in single-question turns.
- **Multilingual Support**: Supports seamless conversational turns in English and Hindi.
- **Structured Clinical Reports**: Synthesizes full conversation history into a structured JSON medical summary upon call completion.
- **Resilient Call Handling**: Graceful fallback notices for incomplete or short calls (< 30s).

---

## 🏗️ Tech Stack

### **Backend (`/server`)**
- **Runtime**: Node.js (v18+) with Express.js
- **Protocol**: WebSockets (`ws`) for low-latency bidirectional audio streaming
- **AI Pipelines**:
  - **STT**: OpenAI Whisper (`whisper-1`) / Deepgram Nova-2
  - **LLM**: OpenAI `gpt-4o-mini` with empathetic system prompt
  - **TTS**: OpenAI `tts-1` returning base64 MP3 audio payload
  - **Report Engine**: Structured JSON schema extraction

### **Frontend (`/client`)**
- **Framework**: React 18 powered by Vite
- **Styling**: Tailwind CSS & Lucide Icons
- **Audio Capture**: Web Audio API & `MediaRecorder` with 500ms chunking

---

## 📁 Repository Structure

```text
voice-health-screener/
├── client/                     # React Frontend Dashboard
│   ├── src/
│   │   ├── components/         # CallControls, StatusBadge, Transcript, HealthReport
│   │   ├── hooks/              # useAudioRecorder, useWebSocket
│   │   ├── App.jsx             # Main Application Layout
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Node.js Backend Engine
│   ├── src/
│   │   ├── config/
│   │   │   └── env.js          # Environment Loader
│   │   ├── services/
│   │   │   ├── sttService.js   # Speech-to-Text Integration
│   │   │   ├── llmService.js   # Dialogue & System Prompt
│   │   │   ├── ttsService.js   # Text-to-Speech Integration
│   │   │   └── reportService.js# Medical Report Generator
│   │   ├── websocket/
│   │   │   └── callHandler.js  # WS Session Manager & State Machine
│   │   ├── test_ws.js          # CLI Verification Script
│   │   └── server.js           # Express + WS Entry Point
│   ├── .env.example
│   └── package.json
│
└── README.md                   # Documentation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js v18+ & `npm` installed
- OpenAI API Key (or optional Deepgram / ElevenLabs keys)

### 2. Environment Setup

Configure environment variables in `server/.env`:

```bash
PORT=5000
OPENAI_API_KEY=your_openai_api_key_here
ALLOWED_ORIGIN=http://localhost:5173
```

### 3. Server Installation & Execution

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Start development server
npm run dev
```

Server runs at `http://localhost:5000` with WebSocket listener active at `ws://localhost:5000`.

### 4. Run WebSocket Automated Test

Verify backend pipeline without a browser interface:

```bash
node src/test_ws.js
```

---

## 🔌 WebSocket Event Protocol

### **Client $\rightarrow$ Server**
| Event | Payload | Description |
| :--- | :--- | :--- |
| `START_CALL` | `{ event: "START_CALL" }` | Initiates new voice session |
| `USER_TRANSCRIPT` | `{ event: "USER_TRANSCRIPT", text: "..." }` | Sends transcribed text turn |
| `AUDIO_CHUNK` | Binary WebM / PCM buffer | Raw microphone audio stream |
| `END_CALL` | `{ event: "END_CALL" }` | Terminates call & triggers report |

### **Server $\rightarrow$ Client**
| Event | Payload | Description |
| :--- | :--- | :--- |
| `STATUS` | `{ event: "STATUS", status: "CONNECTED"|"THINKING"|"SPEAKING" }` | Active turn status |
| `AGENT_TEXT` | `{ event: "AGENT_TEXT", text: "..." }` | LLM conversational reply |
| `AGENT_AUDIO` | `{ event: "AGENT_AUDIO", audio: "base64..." }` | Synthesized TTS MP3 audio |
| `FINAL_REPORT` | `{ event: "FINAL_REPORT", report: { ... } }` | Extracted medical summary |

---

## 📄 License & Credits

Developed for the **Sasahyog Technologies Assignment**.
