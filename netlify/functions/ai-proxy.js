// AI proxy — keeps the Anthropic API key server-side.
// Accepts: { messages, max_tokens } and forwards to Anthropic.
// The key never reaches the browser. Requires a valid Supabase auth token
// so anonymous callers cannot run up the Anthropic bill.

const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  // Require a valid logged-in user
  const authHeader = event.headers.authorization || event.headers.Authorization || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) }
  }
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid session' }) }
    }
  } catch (e) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Auth check failed' }) }
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
        model: 'claude-sonnet-4-6',
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
