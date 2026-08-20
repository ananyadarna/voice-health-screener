import { config } from './config/env.js';

async function checkGroqModels() {
  console.log("Checking Groq key:", config.groqApiKey ? "Key Present" : "No Key");
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${config.groqApiKey}`
      }
    });
    const data = await res.json();
    console.log("Groq Models Response Status:", res.status);
    if (data.data) {
      console.log("Available Models:", data.data.map(m => m.id));
    } else {
      console.log("Response Body:", data);
    }
  } catch (err) {
    console.error("Fetch Error:", err.message);
  }
}

checkGroqModels();
