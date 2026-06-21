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

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type'
    },
    body: JSON.stringify(payload)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return json(204, {});
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed.' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return json(500, { error: 'OPENROUTER_API_KEY is not set.' });
  }

  try {
    const parsed = JSON.parse(event.body || '{}');
    const ai = modelMap[parsed.ai] ? parsed.ai : 'chat';
    const message = String(parsed.message || '').trim();

    if (!message) {
      return json(400, { error: 'Message is required.' });
    }

    const upstreamResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_REFERER || 'https://your-site.netlify.app',
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
      return json(upstreamResponse.status, { error: errorMessage });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim() || '';
    return json(200, { reply });
  } catch (error) {
    return json(500, { error: error.message || 'Unexpected server error.' });
  }
};