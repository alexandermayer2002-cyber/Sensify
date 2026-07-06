// Starts a Stripe SETUP-mode checkout: saves the user's card for Maintain
// without charging it. The subscription is created later, at protocol
// completion, by activate-maintain.js.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
  try {
    const { userId } = JSON.parse(event.body || '{}')
    if (!userId) return { statusCode: 400, body: JSON.stringify({ error: 'userId required' }) }
    const origin = event.headers.origin || event.headers.referer?.replace(/\/$/, '') || 'https://sensifyhealth.com'

    // Setup mode needs an existing customer, or the saved card attaches to nothing.
    const customer = await stripe.customers.create({ metadata: { sensify_user_id: userId } })

    const session = await stripe.checkout.sessions.create({
      mode: 'setup',
      customer: customer.id,
      payment_method_types: ['card'],
      client_reference_id: userId,
      success_url: `${origin}/?maintain_setup=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
    })
    return { statusCode: 200, body: JSON.stringify({ url: session.url }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
