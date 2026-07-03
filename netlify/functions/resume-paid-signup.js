// Resume path for people who paid but never finished creating their account.
// POST { email } → { ok: true } only if BOTH are true:
//   1) a verified-paid Stripe session exists for that email, and
//   2) no account/profile already exists with that email
// Then the client re-opens signup locked to that email.
//
// SECURITY NOTE: this endpoint confirms whether an email has an unclaimed
// paid session. The claim itself is protected by Supabase email confirmation
// (the account can't be used until the email owner clicks the confirmation
// link) — make sure "Confirm email" is ON in Supabase Auth settings.

const { createClient } = require('@supabase/supabase-js')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let body = {}
  try { body = JSON.parse(event.body || '{}') } catch (e) {}

  const email = (body.email || '').trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'Valid email required' }) }
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

    // 1) Is there a verified paid session for this email?
    const { data: paidRows, error: pErr } = await supabase
      .from('paid_sessions').select('session_id').eq('email', email).limit(1)
    if (pErr) throw pErr
    if (!paidRows || paidRows.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ ok: false, error: "We couldn't find a payment under that email. If you think this is wrong, contact us and we'll sort it out." }) }
    }

    // 2) Has an account already been created with this email?
    const { data: prof, error: prErr } = await supabase
      .from('profiles').select('id').eq('email', email).limit(1)
    if (prErr) throw prErr
    if (prof && prof.length > 0) {
      return { statusCode: 200, body: JSON.stringify({ ok: false, error: 'An account already exists for this email. Try signing in — or use "Forgot password?" if you need to reset it.' }) }
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) }
  } catch (e) {
    console.error('resume-paid-signup error:', e.message)
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: 'Something went wrong. Please try again.' }) }
  }
}
