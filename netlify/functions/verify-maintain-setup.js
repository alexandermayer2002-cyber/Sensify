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
    // Tag the card THIS setup saved (ledger N01) so cancelling Maintain can detach
    // only it and never any other card on the customer. Best-effort: a tagging
    // failure must not block recording the opt-in.
    try {
      if (session.setup_intent) {
        const si = await stripe.setupIntents.retrieve(typeof session.setup_intent === 'string' ? session.setup_intent : session.setup_intent.id)
        const pmId = typeof si.payment_method === 'string' ? si.payment_method : si.payment_method?.id
        if (pmId) await stripe.paymentMethods.update(pmId, { metadata: { sensify_maintain: '1' } })
      }
    } catch (e) { /* tagging is best-effort */ }
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    // THE WRITE IS CHECKED (QA 2026-11-09 scout #1, approved by Alex): a
    // silent failure here is the exact card-saved-but-never-recorded state
    // the client now surfaces and retries.
    const { error } = await supabase.from('profiles').update({
      maintain_opt_in: true,
      stripe_customer_id: session.customer,
    }).eq('id', session.client_reference_id)
    if (error) return { statusCode: 500, body: JSON.stringify({ ok: false, error: error.message }) }
    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
