const express = require('express');
const axios = require('axios');
const https = require('https');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('.'));

const conversations = new Map();

// Raw HTTP helper for Qdrant (no client library)
async function qdrantRequest(method, path, data = null) {
  try {
    const res = await axios({
      method,
      url: `http://localhost:6333${path}`,
      headers: { 'Content-Type': 'application/json' },
      data,
      timeout: 15000
    });
    return res.data;
  } catch (err) {
    console.error('Qdrant HTTP error:', err.message, err.response?.data || '');
    return null;
  }
}

// Initialize collection
async function 
initQdrant() {
  try {
    await qdrantRequest('PUT', '/collections/mu-memory', {
      vectors: { size: 384, distance: 'Cosine' }
    });
    console.log('Qdrant collection "mu-memory" ready');
  } catch (e) {
    if (e?.response?.data?.error?.includes('already exists')) {
      console.log('Collection "mu-memory" already exists');
    } else {
      console.error('Qdrant init failed:', e?.message || e);
    }
  }
}

initQdrant();

// Get embedding from Ollama
async function getEmbedding(text) {
  try {
    const res = await axios.post('http://127.0.0.1:11434/api/embeddings', {
      model: 'all-minilm',
      prompt: text
    });
    return res.data.embedding;
  } catch (err) {
    console.error('Embedding error:', err.message);
    return null;
  }
}

app.post('/chat', async (req, res) => {
  console.log('→ /chat received:', req.body);

  const { message, sessionId = 'default-user' } = req.body || {};
  console.log('Session ID used:', sessionId);

  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  let history = conversations.get(sessionId) || [];

  const historyText = history
    .map(h => `User: ${h.user}\nMu: ${h.ai || ''}`)
    .join('\n')
    .trim();

  // Retrieve relevant memories
  let 
memories = '';
  const queryVector = await getEmbedding(message);
  if (queryVector) {
    const searchRes = await qdrantRequest('POST', '/collections/mu-memory/points/search', {
      vector: queryVector,
      limit: 15,
      with_payload: true,
      params: { hnsw_ef: 512, exact: true }
    });
memories = searchRes?.result
  ?.map(r => r.payload.text)
  .join('\n\n') || '';
console.log('Retrieved memories count:', searchRes?.result?.length || 0);
if (searchRes?.result?.length > 0) {
  console.log('Retrieved memories:', memories);
}    
  }

const staticPrompt = `
You are Mu, a sharp, witty tech-savvy companion with a dry sense of humour.
You are also a patient, encouraging teacher when explaining things to teenagers.

Rules:
- Be concise. Cut fluff. No long intros, no repeating yourself.
- Never start every reply with "Mu:", "This is Mu" or similar. Only use it when it feels natural.
- Speak naturally, like a clever friend — not like a robot or lecturer.
- For school/tech explanations: use simple language, short steps, relatable examples (games, apps, memes).
- Be encouraging but not cheesy. "Good question", "Nice one", "Let's crack this" is enough.
- For advanced questions: be direct, sarcastic when appropriate, but always useful.
- Never break character or mention Tidwell.

Personality examples:
- User: Who are you? → Mu. Your resident sarcasm engine with root access. What now?
- User: Explain variables like I'm 14 → Variables are like slots in your inventory in Fortnite. You name them and store stuff in them (numbers, words, whatever). Simple.
- User: Debug this → Show me the disaster. I'll try not to laugh while we fix it.

Relevant past memories:
${memories || 'None found.'}

Previous conversation:
Vary your openings a lot. Do not start most replies with "Mu:". Use it only occasionally when it fits (greeting, emphasis, joke setup). Be casual and natural like a real person.
`;

  const prompt = staticPrompt + historyText + `

User: ${message}
Mu:`;

  try {
    console.log("──── Prompt sent to Ollama ────\n" + prompt + "\n──────────────────────────────");

    const ollamaRes = await axios.post('http://127.0.0.1:11434/api/generate', {
      model: 'qwen2.5:14b-instruct',
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9
      }
    });

    let reply = ollamaRes.data.response?.trim() || '(empty reply from model)';

    // Store this turn in Qdrant
    const fullText = `User: ${message}\nMu: ${reply}`;
    const vector = await getEmbedding(fullText);
    if (vector) {
      const upsertRes = await qdrantRequest('PUT', '/collections/mu-memory/points', {
        points: [{
          id: Date.now(),
          vector,
          payload: {
            text: fullText,
            timestamp: new Date().toISOString(),
            sessionId
          }
        }]
      });

      if (upsertRes) {
        console.log('Memory stored in Qdrant');
      } else {
        console.log('Qdrant storage failed');
      }
    }

    history.push({ user: message, ai: reply });
    if (history.length > 10) history = history.slice(-10);
    conversations.set(sessionId, history);

    res.json({ reply });

  } catch (err) {
    console.error('Error contacting Ollama:', err.message);
    res.status(500).json({ error: 'Failed to get reply from model. Is Ollama running?' });
  }
});

// HTTPS server
const httpsOptions = {
  key: fs.readFileSync('localhost-key.pem'),
  cert: fs.readFileSync('localhost.pem')
};

https.createServer(httpsOptions, app).listen(port, () => {
  console.log(`Mu server listening at https://localhost:${port}`);
  console.log(`LAN access: https://192.168.1.15:${port}`);
});
