// Verifies a Checkout Session was actually paid before unlocking signup.
// Prevents someone from faking ?paid=true in the URL.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let body = {}
  try { body = JSON.parse(event.body || '{}') } catch (e) {}

  const sessionId = body.session_id
  if (!sessionId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing session_id' }) }
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    // 'paid' = card payment; 'no_payment_required' = a 100%-off promotion
    // code brought the total to $0 (the F&F founding-tester flow, approved
    // by Alex 2026-11-10). Both are completed checkouts.
    const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
    const email = session.customer_email || session.customer_details?.email || null

    // Record the payment durably so it survives a closed tab. If someone
    // pays but never finishes signup, this row is how we (and they) recover.
    if (paid && email) {
      try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
        await supabase.from('paid_sessions').upsert({
          session_id: sessionId,
          email: email.toLowerCase(),
          amount: session.amount_total ?? null, // keep a real $0 for code redemptions
        })
      } catch (e) {
        // Never block the signup flow over bookkeeping — log and continue.
        console.error('paid_sessions record failed:', e.message)
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paid,
        email,
      }),
    }
  } catch (e) {
    console.error('Verify error:', e.message)
    return { statusCode: 500, body: JSON.stringify({ error: 'Could not verify payment' }) }
  }
}
