const modelMap = {
  vision: 'nvidia/nemotron-3-super-120b-a12b:free',
  chat: 'openai/gpt-oss-120b:free',
  code: 'nvidia/nemotron-3-ultra-550b-a55b:free',
  audio: 'google/gemma-4-26b-a4b-it:free'
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
  if (event.httpMethod === 'OPTIONS') return json(204, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return json(500, { error: 'OPENROUTER_API_KEY is not set.' });

  try {
    const parsed = JSON.parse(event.body || '{}');
    const ai = modelMap[parsed.ai] ? parsed.ai : 'chat';
    const message = String(parsed.message || '').trim();
    if (!message) return json(400, { error: 'Message is required.' });

    // history array frontend se aayega, validate karo
    const history = Array.isArray(parsed.history) ? parsed.history : [];
    const safeHistory = history
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-20); // last 20 messages tak rakho context overflow se bachne ke liye

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
          ...safeHistory,
          { role: 'user', content: message }
        ],
        temperature: 0.7
      })
    });

    const data = await upstreamResponse.json();
    if (!upstreamResponse.ok) {
      return json(upstreamResponse.status, { error: data?.error?.message || 'OpenRouter request failed.' });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim() || '';
    return json(200, { reply });
  } catch (error) {
    return json(500, { error: error.message || 'Unexpected server error.' });
  }
};