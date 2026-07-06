// Creates the $12.99/mo Maintain subscription from the saved card.
// Called when a protocol is marked complete. Admin-only: the caller's
// token must belong to a profile with is_admin = true.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
  try {
    const token = (event.headers.authorization || '').replace('Bearer ', '')
    if (!token) return { statusCode: 401, body: JSON.stringify({ error: 'auth required' }) }
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

    const { data: caller } = await supabase.auth.getUser(token)
    if (!caller?.user) return { statusCode: 401, body: JSON.stringify({ error: 'invalid token' }) }
    const { data: callerProfile } = await supabase.from('profiles').select('is_admin').eq('id', caller.user.id).single()
    if (!callerProfile?.is_admin) return { statusCode: 403, body: JSON.stringify({ error: 'admin only' }) }

    const { userId } = JSON.parse(event.body || '{}')
    if (!userId) return { statusCode: 400, body: JSON.stringify({ error: 'userId required' }) }

    const { data: profile } = await supabase.from('profiles')
      .select('maintain_opt_in, maintain_active, stripe_customer_id').eq('id', userId).single()
    if (!profile?.maintain_opt_in || !profile.stripe_customer_id) {
      return { statusCode: 200, body: JSON.stringify({ activated: false, reason: 'not opted in' }) }
    }
    if (profile.maintain_active) {
      return { statusCode: 200, body: JSON.stringify({ activated: false, reason: 'already active' }) }
    }

    const pms = await stripe.paymentMethods.list({ customer: profile.stripe_customer_id, type: 'card', limit: 1 })
    if (!pms.data.length) {
      return { statusCode: 200, body: JSON.stringify({ activated: false, reason: 'no saved card' }) }
    }

    const sub = await stripe.subscriptions.create({
      customer: profile.stripe_customer_id,
      default_payment_method: pms.data[0].id,
      items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Sensify Maintain' },
          unit_amount: 1299,
          recurring: { interval: 'month' },
        },
      }],
    })
    await supabase.from('profiles').update({
      maintain_active: true,
      maintain_subscription_id: sub.id,
    }).eq('id', userId)
    return { statusCode: 200, body: JSON.stringify({ activated: true, subscription: sub.id }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
