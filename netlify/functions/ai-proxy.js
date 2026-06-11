// AI proxy — keeps the Anthropic API key server-side.
// Accepts: { messages, max_tokens } and forwards to Anthropic.
// The key never reaches the browser.

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let payload
  try {
    payload = JSON.parse(event.body)
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { messages, max_tokens } = payload

  // Basic validation — only allow the shapes our app actually uses
  if (!Array.isArray(messages) || messages.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'messages required' }) }
  }
  const cappedTokens = Math.min(Number(max_tokens) || 300, 1500)

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: cappedTokens,
        messages,
      }),
    })

    const data = await response.json()

    if (data.error) {
      console.error('Anthropic error:', data.error.message)
      return { statusCode: 502, body: JSON.stringify({ error: 'AI request failed' }) }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: data.content?.[0]?.text?.trim() || '' }),
    }
  } catch (e) {
    console.error('Proxy error:', e.message)
    return { statusCode: 500, body: JSON.stringify({ error: 'AI request failed' }) }
  }
}
