// Verifies a Checkout Session was actually paid before unlocking signup.
// Prevents someone from faking ?paid=true in the URL.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

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
    const paid = session.payment_status === 'paid'
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paid,
        email: session.customer_email || session.customer_details?.email || null,
      }),
    }
  } catch (e) {
    console.error('Verify error:', e.message)
    return { statusCode: 500, body: JSON.stringify({ error: 'Could not verify payment' }) }
  }
}
