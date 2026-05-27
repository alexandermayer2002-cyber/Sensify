const twilio = require('twilio')

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const { to, message } = JSON.parse(event.body)

    if (!to || !message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing to or message' }) }
    }

    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    const result = await client.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to,
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, sid: result.sid }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    }
  }
}
