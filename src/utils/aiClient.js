// Client-side AI helper — routes all AI calls through the Netlify proxy
// so the Anthropic API key never reaches the browser.
import { supabase } from '../supabase'

export const aiCall = async (messages, maxTokens = 300, feature = null) => {
  // Attach the user's auth token so the proxy can verify a logged-in user
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  const response = await fetch('/.netlify/functions/ai-proxy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages, max_tokens: maxTokens, ...(feature ? { feature } : {}) }),
  })
  const data = await response.json()
  if (!response.ok || data.error) throw new Error(data.error || 'AI request failed')
  return data.text
}

// Convenience wrapper for plain text prompts
export const aiPrompt = async (prompt, maxTokens = 300) => {
  return aiCall([{ role: 'user', content: prompt }], maxTokens)
}
