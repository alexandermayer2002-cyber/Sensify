// Verifies a completed setup-mode session and records the opt-in
// server-side (service role), keyed to the client_reference_id we set.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
  try {
    const { session_id } = JSON.parse(event.body || '{}')
    if (!session_id) return { statusCode: 400, body: JSON.stringify({ error: 'session_id required' }) }

    const session = await stripe.checkout.sessions.retrieve(session_id)
    if (session.status !== 'complete' || !session.client_reference_id) {
      return { statusCode: 200, body: JSON.stringify({ ok: false }) }
    }
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    await supabase.from('profiles').update({
      maintain_opt_in: true,
      stripe_customer_id: session.customer,
    }).eq('id', session.client_reference_id)
    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
