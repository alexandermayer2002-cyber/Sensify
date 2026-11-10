// Cancels a Maintain reservation COMPLETELY (QA 2026-11-09 scout #4,
// approved by Alex 2026-11-10): clears the opt-in AND detaches the saved
// card(s) at Stripe, so "cancel" means what it says. The old client-only
// cancel left the card on file with nothing telling the customer.
// Caller cancels only their own reservation: the user id comes from the
// caller's own token, never from the request body.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
  try {
    const token = (event.headers.authorization || '').replace('Bearer ', '')
    if (!token) return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'auth required' }) }
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

    const { data: caller } = await supabase.auth.getUser(token)
    if (!caller?.user) return { statusCode: 401, body: JSON.stringify({ ok: false, error: 'invalid token' }) }
    const uid = caller.user.id

    const { data: profile } = await supabase.from('profiles')
      .select('maintain_opt_in, maintain_active, stripe_customer_id').eq('id', uid).single()
    if (!profile) return { statusCode: 404, body: JSON.stringify({ ok: false, error: 'no profile' }) }
    if (profile.maintain_active) {
      // An active subscription is a different flow (support); this door only
      // unwinds a reservation that never started billing.
      return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'subscription already active' }) }
    }

    // Detach every saved card for this customer. Card detach first, flag
    // second: if the detach fails we refuse to pretend the cancel happened.
    let detached = 0
    if (profile.stripe_customer_id) {
      const pms = await stripe.paymentMethods.list({ customer: profile.stripe_customer_id, type: 'card' })
      for (const pm of pms.data) {
        await stripe.paymentMethods.detach(pm.id)
        detached++
      }
    }

    const { error } = await supabase.from('profiles').update({ maintain_opt_in: false }).eq('id', uid)
    if (error) return { statusCode: 500, body: JSON.stringify({ ok: false, error: error.message, detached }) }

    return { statusCode: 200, body: JSON.stringify({ ok: true, detached }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: err.message }) }
  }
}
