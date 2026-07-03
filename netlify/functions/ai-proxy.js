// AI proxy — keeps the Anthropic API key server-side.
// Accepts: { messages, max_tokens, feature } and forwards to Anthropic.
// The key never reaches the browser. Requires a valid Supabase auth token
// so anonymous callers cannot run up the Anthropic bill.
// Ask Sensify calls (feature: 'ask') are rate-limited per user per day.

const { createClient } = require('@supabase/supabase-js')

const ASK_DAILY_LIMIT = 25
const TOTAL_DAILY_LIMIT = 150  // catch-all ceiling across ALL AI features — abuse protection, not a real-user limit

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

  let userId = null
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Invalid session' }) }
    }
    userId = user.id
  } catch (e) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Auth check failed' }) }
  }

  let payload
  try {
    payload = JSON.parse(event.body)
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { messages, max_tokens, feature } = payload

  // Basic validation — only allow the shapes our app actually uses
  if (!Array.isArray(messages) || messages.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'messages required' }) }
  }

  // Rate limiting (protects the AI bill). Every AI call increments the
  // per-user daily counter. Ask Sensify gets a strict conversational limit;
  // everything else shares a generous total ceiling that no real user will
  // hit but a scripted abuser will (program-essential AI stays effectively
  // unblocked for legitimate use).
  try {
    const { data: count, error: rlError } = await supabase.rpc('increment_ai_usage', { p_user_id: userId })
    if (!rlError && typeof count === 'number') {
      if (feature === 'ask' && count > ASK_DAILY_LIMIT) {
        return {
          statusCode: 429,
          body: JSON.stringify({ error: "You've reached today's limit for Ask Sensify. It'll reset tomorrow." }),
        }
      }
      if (count > TOTAL_DAILY_LIMIT) {
        return {
          statusCode: 429,
          body: JSON.stringify({ error: 'Daily usage limit reached. Please try again tomorrow.' }),
        }
      }
    }
  } catch (e) {
    // If the counter fails, fail open (don't block the user) but log it.
    console.error('Rate limit check failed:', e.message)
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
