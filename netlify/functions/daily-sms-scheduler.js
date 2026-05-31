const { createClient } = require('@supabase/supabase-js')

const MILESTONE_MESSAGES = {
  7: (name) => `One week in, ${name}. Your body is starting to adjust. Keep going — the signal gets clearer from here.`,
  14: (name) => `Two weeks, ${name}. You're building real data now.`,
  21: (name) => `Three weeks of elimination, ${name}. Most people start noticing a difference around now.`,
  30: (name) => `One month in. That's a real commitment, ${name}. You're more than halfway through elimination.`,
  56: (name) => `Eight weeks done, ${name}. Elimination phase complete. Reintroduction starts now — open the app to see what unlocks today.`,
}

const sendSMS = async (to, body) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_NUMBER
  const phone = to.startsWith('+') ? to : `+1${to}`
  const params = new URLSearchParams({ To: phone, From: from, Body: body })
  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    )
    return response.ok
  } catch (e) {
    console.error(`Failed to send to ${to}:`, e.message)
    return false
  }
}

exports.handler = async () => {
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    const now = new Date()
    const etHour = (now.getUTCHours() - 4 + 24) % 24
    const today = now.toISOString().split('T')[0]

    const TIME_MAP = {
      '6:00 PM': 18, '7:00 PM': 19, '8:00 PM': 20, '9:00 PM': 21, '10:00 PM': 22,
    }

    const matchingTimes = Object.entries(TIME_MAP)
      .filter(([_, hour]) => hour === etHour)
      .map(([time]) => time)

    if (matchingTimes.length === 0) return { statusCode: 200, body: 'No texts this hour' }

    const { data: users } = await supabase
      .from('profiles')
      .select('id, full_name, phone_number, text_time_preference, program_phase, protocol_start_date, sms_opted_in')
      .in('text_time_preference', matchingTimes)
      .eq('sms_opted_in', true)
      .in('program_phase', ['elimination', 'reintroduction'])
      .not('phone_number', 'is', null)
      .not('protocol_start_date', 'is', null)

    if (!users || users.length === 0) return { statusCode: 200, body: 'No users to text' }

    let sent = 0
    for (const user of users) {
      const { data: existing } = await supabase.from('daily_compliance').select('id').eq('user_id', user.id).eq('date', today).maybeSingle()
      if (existing) continue

      const name = user.full_name?.split(' ')[0] || 'there'
      const currentDay = Math.floor((now - new Date(user.protocol_start_date)) / (1000 * 60 * 60 * 24)) + 1

      let message
      if (MILESTONE_MESSAGES[currentDay]) {
        message = MILESTONE_MESSAGES[currentDay](name)
      } else {
        const windowOpenDay = Math.floor(currentDay / 7) * 7
        const inCheckinWindow = currentDay >= 7 && (currentDay - windowOpenDay) <= 1
        if (inCheckinWindow) {
          message = `Hey ${name} — your week ${Math.ceil(currentDay / 7)} check-in is ready. Open the Sensify app to complete it.`
        } else {
          message = `Hey ${name} — how did today go on your elimination plan? Reply YES if you stayed on track, or NO if something came up.`
        }
      }

      const success = await sendSMS(user.phone_number, message)
      if (success) sent++
    }

    return { statusCode: 200, body: JSON.stringify({ sent, total: users.length }) }
  } catch (error) {
    console.error('Scheduler error:', error)
    return { statusCode: 500, body: error.message }
  }
}
