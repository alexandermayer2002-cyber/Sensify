const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

exports.handler = async (event) => {
  try {
    // Parse Twilio webhook body
    const params = new URLSearchParams(event.body)
    const from = params.get('From') // user's phone number
    const body = params.get('Body')?.trim().toUpperCase()

    if (!from || !body) {
      return { statusCode: 400, body: 'Missing from or body' }
    }

    // Normalize phone number — strip non-digits then add +1
    const cleanPhone = from.replace(/\D/g, '')

    // Find user by phone number
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, program_phase, current_reintro_food')
      .eq('phone_number', cleanPhone)
      .single()

    if (error || !profile) {
      console.log('No user found for phone:', cleanPhone)
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/xml' },
        body: `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      }
    }

    const today = new Date().toISOString().split('T')[0]
    let responseMessage = ''

    if (body === 'YES' || body === 'Y') {
      // Log YES compliance
      await supabase.from('daily_compliance').upsert({
        user_id: profile.id,
        date: today,
        response: 'YES',
        logged_at: new Date().toISOString(),
      }, { onConflict: 'user_id,date' })

      // Update streak
      const { data: compData } = await supabase
        .from('daily_compliance')
        .select('response, date')
        .eq('user_id', profile.id)
        .eq('response', 'YES')
        .order('date', { ascending: false })

      let streak = 0
      if (compData) {
        const dates = compData.map(c => c.date).sort().reverse()
        for (let i = 0; i < dates.length; i++) {
          const expected = new Date()
          expected.setDate(expected.getDate() - i)
          const expectedStr = expected.toISOString().split('T')[0]
          if (dates[i] === expectedStr) streak++
          else break
        }
      }

      await supabase.from('profiles').update({ streak }).eq('id', profile.id)

      const name = profile.full_name?.split(' ')[0] || 'there'
      const streakMsg = streak > 1 ? ` ${streak} days in a row.` : ''
      responseMessage = `Logged. Keep it up${streakMsg}`

    } else if (body === 'NO' || body === 'N') {
      // Log NO compliance
      await supabase.from('daily_compliance').upsert({
        user_id: profile.id,
        date: today,
        response: 'NO',
        logged_at: new Date().toISOString(),
      }, { onConflict: 'user_id,date' })

      // Reset streak
      await supabase.from('profiles').update({ streak: 0 }).eq('id', profile.id)

      // Check for 3 consecutive NOs
      const { data: recentComp } = await supabase
        .from('daily_compliance')
        .select('response, date')
        .eq('user_id', profile.id)
        .order('date', { ascending: false })
        .limit(3)

      const threeNOs = recentComp?.length === 3 && recentComp.every(c => c.response === 'NO')

      if (threeNOs) {
        // Check if audit already exists recently
        const { data: existingAudit } = await supabase
          .from('compliance_audit')
          .select('id')
          .eq('user_id', profile.id)
          .gte('triggered_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .maybeSingle()

        if (!existingAudit) {
          await supabase.from('compliance_audit').insert({
            user_id: profile.id,
            triggered_at: new Date().toISOString(),
            trigger_type: 'three_consecutive_nos',
            hardest_parts: [],
            status: 'pending_admin_review',
          })
        }

        responseMessage = `Noted. Open the Sensify app when you get a chance — there's a quick check-in waiting for you.`
      } else {
        responseMessage = `Got it. Open the Sensify app to log what happened — it takes 30 seconds.`
      }

    } else if (body === 'STOP' || body === 'UNSUBSCRIBE') {
      // Twilio handles STOP automatically but we also update our records
      await supabase.from('profiles').update({ sms_opted_in: false }).eq('id', profile.id)
      responseMessage = `You've been unsubscribed from Sensify texts. You can re-enable in the app settings.`

    } else {
      // Unknown reply
      responseMessage = `Reply YES if you stayed on plan today, or NO if something came up.`
    }

    // Return TwiML response
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/xml' },
      body: `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${responseMessage}</Message>
</Response>`,
    }

  } catch (error) {
    console.error('SMS webhook error:', error)
    return { statusCode: 500, body: error.message }
  }
}
