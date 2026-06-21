const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const port = process.env.PORT || 3000;

const modelMap = {
  vision: 'nvidia/nemotron-nano-12b-v2',
  chat: 'qwen/qwen3-next-80b-a3b-instruct',
  code: 'qwen/qwen3-coder-480b-a35b-instruct',
  audio: 'meta-llama/llama-3.3-70b-instruct'
};

const systemPrompts = {
  vision: 'You are Vision AI, a concise visual reasoning assistant. Focus on image-style analysis, visual structure, and scene understanding.',
  chat: 'You are Chat AI, a helpful general assistant. Reply clearly, naturally, and concisely.',
  code: 'You are Code AI, a senior programming assistant. Focus on practical implementation, debugging, and clean code.',
  audio: 'You are Audio AI, a sound and voice assistant. Focus on audio concepts, speech, signal, and sound design.'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
  }[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Request body too large.'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function handleChat(req, res) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    sendJson(res, 500, { error: 'OPENROUTER_API_KEY is not set on the server.' });
    return;
  }

  try {
    const rawBody = await getRequestBody(req);
    const parsed = JSON.parse(rawBody || '{}');
    const ai = modelMap[parsed.ai] ? parsed.ai : 'chat';
    const message = String(parsed.message || '').trim();

    if (!message) {
      sendJson(res, 400, { error: 'Message is required.' });
      return;
    }

    const upstreamResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'MultiAI Orbit'
      },
      body: JSON.stringify({
        model: modelMap[ai],
        messages: [
          { role: 'system', content: systemPrompts[ai] },
          { role: 'user', content: message }
        ],
        temperature: 0.7
      })
    });

    const data = await upstreamResponse.json();

    if (!upstreamResponse.ok) {
      const errorMessage = data?.error?.message || data?.message || 'OpenRouter request failed.';
      sendJson(res, upstreamResponse.status, { error: errorMessage });
      return;
    }

    const reply = data?.choices?.[0]?.message?.content?.trim() || '';
    sendJson(res, 200, { reply });
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Unexpected server error.' });
  }
}

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  if (req.method === 'POST' && urlPath === '/api/chat') {
    handleChat(req, res);
    return;
  }

  const normalizedPath = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = path.join(rootDir, normalizedPath);

  if (!filePath.startsWith(rootDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  serveFile(res, filePath);
});

server.listen(port, () => {
  console.log(`MultiAI server running at http://localhost:${port}`);
});