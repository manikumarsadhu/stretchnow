/**
 * StretchNow Multi-Provider AI Failover System
 * 
 * Provider Priority Pool:
 * 1. Groq API (llama-3.3-70b-versatile - Ultra fast ~200ms)
 * 2. OpenRouter API (openrouter/auto)
 * 3. Cohere AI API (command-r-08-2024)
 * 4. Gemini API Keys (v1beta generateContent)
 * 5. Cerebras API
 * 
 * If any provider returns HTTP 429 (Quota Limit), 402 (Payment/Credits Exhausted), or 403,
 * it instantly rotates to the next available provider without any user interruption or lag.
 */

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const COHERE_KEY = import.meta.env.VITE_COHERE_API_KEY;
const CEREBRAS_KEY = import.meta.env.VITE_CEREBRAS_API_KEY;

const GEMINI_KEYS = [
  import.meta.env.VITE_GEMINI_API_KEY_1,
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY_3
].filter(Boolean);

let activeGeminiIndex = 0;

/**
 * 1. Groq API Call
 */
async function callGroqAPI(prompt, systemInstruction = '') {
  if (!GROQ_KEY) throw new Error('NO_KEY');
  console.log('⚡ Trying Provider 1: Groq AI...');

  const messages = [];
  if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
  messages.push({ role: 'user', content: prompt });

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 600
    })
  });

  if (res.status === 429 || res.status === 402 || res.status === 403) throw new Error('QUOTA_EXHAUSTED');
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);

  const data = await res.json();
  return data?.choices?.[0]?.message?.content;
}

/**
 * 2. OpenRouter API Call
 */
async function callOpenRouterAPI(prompt, systemInstruction = '') {
  if (!OPENROUTER_KEY) throw new Error('NO_KEY');
  console.log('⚡ Trying Provider 2: OpenRouter AI...');

  const messages = [];
  if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
  messages.push({ role: 'user', content: prompt });

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openrouter/auto',
      messages,
      temperature: 0.7,
      max_tokens: 600
    })
  });

  if (res.status === 429 || res.status === 402 || res.status === 403) throw new Error('QUOTA_EXHAUSTED');
  if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);

  const data = await res.json();
  return data?.choices?.[0]?.message?.content;
}

/**
 * 3. Cohere API Call
 */
async function callCohereAPI(prompt, systemInstruction = '') {
  if (!COHERE_KEY) throw new Error('NO_KEY');
  console.log('⚡ Trying Provider 3: Cohere AI...');

  const fullMessage = systemInstruction ? `${systemInstruction}\n\nUser Question: ${prompt}` : prompt;

  const res = await fetch('https://api.cohere.com/v1/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${COHERE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: fullMessage,
      model: 'command-r-08-2024'
    })
  });

  if (res.status === 429 || res.status === 402 || res.status === 403) throw new Error('QUOTA_EXHAUSTED');
  if (!res.ok) throw new Error(`Cohere HTTP ${res.status}`);

  const data = await res.json();
  return data?.text;
}

/**
 * 4. Gemini API Call
 */
async function callGeminiAPI(prompt, systemInstruction = '') {
  if (GEMINI_KEYS.length === 0) throw new Error('NO_KEY');

  const apiKey = GEMINI_KEYS[activeGeminiIndex];
  console.log(`⚡ Trying Provider 4: Gemini AI (Key #${activeGeminiIndex + 1})...`);

  const fullText = systemInstruction ? `${systemInstruction}\n\nUser Question: ${prompt}` : prompt;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullText }] }]
      })
    }
  );

  if (res.status === 429 || res.status === 402 || res.status === 403) {
    activeGeminiIndex = (activeGeminiIndex + 1) % GEMINI_KEYS.length;
    throw new Error('QUOTA_EXHAUSTED');
  }

  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text;
}

/**
 * 5. Cerebras API Call
 */
async function callCerebrasAPI(prompt, systemInstruction = '') {
  if (!CEREBRAS_KEY) throw new Error('NO_KEY');
  console.log('⚡ Trying Provider 5: Cerebras AI...');

  const messages = [];
  if (systemInstruction) messages.push({ role: 'system', content: systemInstruction });
  messages.push({ role: 'user', content: prompt });

  const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CEREBRAS_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama3.1-8b',
      messages,
      temperature: 0.7,
      max_tokens: 600
    })
  });

  if (res.status === 429 || res.status === 402 || res.status === 403) throw new Error('QUOTA_EXHAUSTED');
  if (!res.ok) throw new Error(`Cerebras HTTP ${res.status}`);

  const data = await res.json();
  return data?.choices?.[0]?.message?.content;
}

/**
 * Main AI Generation Entry Point with Automatic Multi-Provider Failover
 */
export async function generateAIResponse(prompt, systemInstruction = '') {
  const providers = [
    { name: 'Groq', fn: () => callGroqAPI(prompt, systemInstruction) },
    { name: 'OpenRouter', fn: () => callOpenRouterAPI(prompt, systemInstruction) },
    { name: 'Cohere', fn: () => callCohereAPI(prompt, systemInstruction) },
    { name: 'Gemini', fn: () => callGeminiAPI(prompt, systemInstruction) },
    { name: 'Cerebras', fn: () => callCerebrasAPI(prompt, systemInstruction) }
  ];

  for (const provider of providers) {
    try {
      const output = await provider.fn();
      if (output && output.trim()) {
        return output;
      }
    } catch (err) {
      console.warn(`Provider ${provider.name} failed (${err.message}). Moving to next AI provider in pool...`);
    }
  }

  // Smart local fallback if all API quotas fail offline
  return "To reduce desk tension, sit with your feet flat on the floor, uncross your legs, and roll your shoulders backward 5 times while taking deep breaths. Take a 2-minute stretch break every 45 minutes!";
}
