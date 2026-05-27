const { createClient } = require('@supabase/supabase-js')
const twilio = require('twilio')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER

const MILESTONE_MESSAGES = {
  7: (name) => `One week in, ${name}. Your body is starting to adjust. Keep going — the signal gets clearer from here.`,
  14: (name) => `Two weeks, ${name}. You're building real data. Your weekly check-in is ready when you are.`,
  21: (name) => `Three weeks of elimination, ${name}. Most people start noticing a difference around now. Trust the process.`,
  30: (name) => `One month in. That's a real commitment, ${name}. You're more than halfway through elimination. The Food Map is getting closer.`,
  56: (name) => `Eight weeks done, ${name}. Elimination phase complete. Reintroduction starts now — open the app to see what unlocks today.`,
}

const sendSMS = async (to, body) => {
  try {
    await twilioClient.messages.create({
      body,
      from: TWILIO_PHONE,
      to: `+1${to}`,
    })
    return true
  } catch (e) {
    console.error(`Failed to send to ${to}:`, e.message)
    return false
  }
}

// This function runs on a schedule — called by Netlify every hour
// It checks which users should receive a text right now based on their preferred time
exports.handler = async () => {
  try {
    const now = new Date()
    const currentHour = now.getUTCHours()
    const today = now.toISOString().split('T')[0]

    // Time zone offset for Eastern Time (UTC-4 in summer, UTC-5 in winter)
    // For now using Eastern — TODO: store user timezone
    const etHour = (currentHour - 4 + 24) % 24

    // Map preferred times to hours
    const TIME_MAP = {
      '6:00 PM': 18,
      '7:00 PM': 19,
      '8:00 PM': 20,
      '9:00 PM': 21,
      '10:00 PM': 22,
    }

    // Find all users whose preferred time matches current ET hour
    const matchingTimes = Object.entries(TIME_MAP)
      .filter(([_, hour]) => hour === etHour)
      .map(([time]) => time)

    if (matchingTimes.length === 0) {
      return { statusCode: 200, body: 'No texts to send this hour' }
    }

    // Get active users who haven't been texted today and prefer this time
    const { data: users } = await supabase
      .from('profiles')
      .select('id, full_name, phone_number, text_time_preference, program_phase, protocol_start_date, sms_opted_in')
      .in('text_time_preference', matchingTimes)
      .eq('sms_opted_in', true)
      .in('program_phase', ['elimination', 'reintroduction'])
      .not('phone_number', 'is', null)
      .not('protocol_start_date', 'is', null)

    if (!users || users.length === 0) {
      return { statusCode: 200, body: 'No users to text' }
    }

    let sent = 0

    for (const user of users) {
      // Check if already texted today
      const { data: existing } = await supabase
        .from('daily_compliance')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()

      if (existing) continue // already texted or logged today

      const name = user.full_name?.split(' ')[0] || 'there'

      // Calculate current day
      const startDate = new Date(user.protocol_start_date)
      const currentDay = Math.floor((now - startDate) / (1000 * 60 * 60 * 24)) + 1

      // Check for milestone message
      let message
      if (MILESTONE_MESSAGES[currentDay]) {
        message = MILESTONE_MESSAGES[currentDay](name)
      } else {
        // Check if weekly check-in is due
        const windowOpenDay = Math.floor(currentDay / 7) * 7
        const inCheckinWindow = currentDay >= 7 && (currentDay - windowOpenDay) <= 1

        if (inCheckinWindow) {
          const weekNum = Math.ceil(currentDay / 7)
          message = `Hey ${name} — your week ${weekNum} check-in is ready. How did this week go? Open the app to complete it.`
        } else {
          // Standard daily compliance text
          message = `Hey ${name} — how did today go on your elimination plan? Reply YES if you stayed on track, or NO if something came up.`
        }
      }

      const success = await sendSMS(user.phone_number, message)
      if (success) sent++
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ sent, total: users.length }),
    }

  } catch (error) {
    console.error('Scheduler error:', error)
    return { statusCode: 500, body: error.message }
  }
}
