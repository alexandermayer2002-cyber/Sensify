// Creates a Stripe Checkout Session for the $399 program.
// Secret key stays server-side. Returns the hosted checkout URL.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let body = {}
  try { body = JSON.parse(event.body || '{}') } catch (e) {}

  // The site origin, used to build success/cancel redirect URLs
  const origin = event.headers.origin || event.headers.referer?.replace(/\/$/, '') || 'https://sensifyhealth.com'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Sensify — Complete 6-Month Program',
              description: 'Lab test, physician-reviewed elimination & reintroduction protocol, daily guidance, and your personal Food Map.',
            },
            unit_amount: 39900, // $399.00 in cents
          },
          quantity: 1,
        },
      ],
      // Collect email so we can tie the payment to the account they create next
      customer_email: body.email || undefined,
      success_url: `${origin}/?paid=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?canceled=true`,
      allow_promotion_codes: true,
    })

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    }
  } catch (e) {
    console.error('Stripe session error:', e.message)
    return { statusCode: 500, body: JSON.stringify({ error: 'Could not start checkout' }) }
  }
}
