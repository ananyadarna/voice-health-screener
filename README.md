# Voice-Driven Health Intake Screener

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Live_App-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://voice-health-screener-omega.vercel.app/)
[![Video Demo](https://img.shields.io/badge/Video_Demo-Google_Drive-4285F4?style=for-the-badge&logo=googledrive&logoColor=white)](https://drive.google.com/file/d/1U06ZzERlK_mTjeONJXeOr8MLV-mk94Bx/view?usp=sharing)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ananyadarna/voice-health-screener.git)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Groq AI](https://img.shields.io/badge/Groq_AI-Llama_3.1-f97316?style=for-the-badge&logo=openai&logoColor=white)](https://groq.com)

An end-to-end, voice-driven web application enabling patients to conduct an interactive preliminary health screening with an empathetic AI agent over WebSockets, generating a structured clinical summary report for healthcare providers.

---

## Project Links

- **Live Vercel Application Demo**: https://voice-health-screener-omega.vercel.app/
- **Live Video Demo (Google Drive)**: https://drive.google.com/file/d/1U06ZzERlK_mTjeONJXeOr8MLV-mk94Bx/view?usp=sharing
- **Live Backend HTTP Server**: https://voice-health-screener-f0ui.onrender.com
- **Live Backend WebSocket Endpoint**: wss://voice-health-screener-f0ui.onrender.com
- **Source Code Repository**: https://github.com/ananyadarna/voice-health-screener.git

---

## Core Features

- **Interactive Voice Assessment**: Real-time bi-directional voice session streaming audio over WebSockets (STT -> LLM -> TTS).
- **Gemini-Style Voice Input**: Real-time speech preview populating directly into the input bar with push-to-talk microphone controls.
- **Context-Aware Intake**: Sequentially collects Patient Name, Chief Complaint, Onset & Duration, Severity (1-10), and Associated Symptoms.
- **Bilingual Support**: Supports conversational turns in English and Hindi.
- **Structured Clinical Reports**: Synthesizes full conversation history into a structured JSON medical summary upon call completion.
- **Resilient Fallback Handling**: Graceful fallback notices for incomplete or short calls under 30 seconds.

---

## Clinical Intake Assessment Flow

The AI agent sequentially guides the patient through 5 intake screening turns:

1. **Patient Identification**: Collects patient full name.
2. **Chief Complaint**: Identifies primary symptom or health concern.
3. **Onset & Duration**: Determines when symptoms started and how long they have persisted.
4. **Severity Assessment**: Rates discomfort level on a scale from 1 to 10.
5. **Associated Symptoms**: Inquires about secondary symptoms (fever, dizziness, nausea, etc.).

---

## Technical Stack

### Backend (/server)
- **Runtime**: Node.js (v18+) with Express.js
- **Protocol**: WebSockets (ws package) for low-latency bidirectional messaging
- **AI Integration**:
  - **LLM**: Groq Cloud AI (groq/compound-mini / llama-3.1-8b-instant) and OpenAI (gpt-4o-mini)
  - **STT**: Groq Whisper (whisper-large-v3-turbo) and Browser Web Speech API
  - **TTS**: OpenAI Speech API (tts-1) and Web Speech Synthesis API
  - **Report Engine**: Structured JSON schema extraction

### Frontend (/client)
- **Framework**: React 18 powered by Vite
- **Styling**: Tailwind CSS (Light Healthcare Theme) & Lucide React Icons
- **Audio Capture**: Web Audio API, MediaRecorder, and webkitSpeechRecognition

---

## Repository Structure

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
│   │   └── server.js           # Express + WS Entry Point
│   ├── .env.example
│   └── package.json
│
└── README.md                   # Project Documentation
```

---

## Sample Medical Intake Report Output

Upon call completion, the backend LLM synthesizes the dialogue transcript into a structured JSON report format:

```json
{
  "status": "COMPLETE",
  "patientName": "Ananya Darna",
  "chiefComplaint": "Severe Headache & Mild Fever",
  "duration": "2 Days",
  "severity": "7 / 10",
  "associatedSymptoms": [
    "Low-grade fever",
    "Mild dizziness",
    "Sensitivity to light"
  ],
  "summary": "Patient Ananya Darna presents with severe headache and low-grade fever lasting 2 days rated at a severity of 7/10.",
  "flaggedFollowUp": "Monitor symptoms closely. If fever increases or severe weakness occurs, consult a physician."
}
```

---

## Quick Start Guide

### 1. Prerequisites
- Node.js v18+ & npm installed
- Groq API Key (Free) or OpenAI API Key

### 2. Environment Configuration

Create a `.env` file inside the `server/` directory:

```ini
PORT=5000
GROQ_API_KEY=gsk_your_groq_api_key_here
OPENAI_API_KEY=
ALLOWED_ORIGIN=http://localhost:5173
```

### 3. Server Execution

```bash
cd server
npm install
npm run dev
```

Server listens on `http://localhost:5000` with WebSocket endpoint ready at `ws://localhost:5000`.

### 4. Client Execution

```bash
cd client
npm install
npm run dev
```

Access the frontend application at `http://localhost:5173`.

---

## WebSocket API Protocol

### Client to Server
| Event | Payload | Description |
| :--- | :--- | :--- |
| START_CALL | `{ event: "START_CALL" }` | Initiates new intake session |
| USER_TRANSCRIPT | `{ event: "USER_TRANSCRIPT", text: "..." }` | Sends transcribed text turn |
| AUDIO_CHUNK | Binary audio buffer | Raw microphone audio stream |
| END_CALL | `{ event: "END_CALL" }` | Terminates call & triggers report |

### Server to Client
| Event | Payload | Description |
| :--- | :--- | :--- |
| STATUS | `{ event: "STATUS", status: "CONNECTED"|"THINKING"|"SPEAKING" }` | Active turn status |
| AGENT_TEXT | `{ event: "AGENT_TEXT", text: "..." }` | LLM conversational reply |
| AGENT_AUDIO | `{ event: "AGENT_AUDIO", audio: "base64..." }` | Synthesized MP3 audio chunk |
| FINAL_REPORT | `{ event: "FINAL_REPORT", report: { ... } }` | Extracted medical summary |

---

## Deployment Instructions

### Backend (Render Web Service)
1. Create a new Web Service on Render connected to the GitHub repository.
2. Set Root Directory to `server`.
3. Set Build Command to `npm install` and Start Command to `node src/server.js`.
4. Add Environment Variables: `GROQ_API_KEY` and `ALLOWED_ORIGIN=*`.

### Frontend (Vercel)
1. Import the repository into Vercel.
2. Set Root Directory to `client` and Framework Preset to `Vite`.
3. Set Environment Variable: `VITE_WS_URL=wss://voice-health-screener-f0ui.onrender.com`.
4. Deploy the application.
