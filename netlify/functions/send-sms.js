exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' }
  }

  try {
    const { to, message } = JSON.parse(event.body)

    if (!to || !message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing to or message' }) }
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_PHONE_NUMBER

    const body = new URLSearchParams({
      To: to.startsWith('+') ? to : `+1${to}`,
      From: from,
      Body: message,
    })

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return { statusCode: 400, body: JSON.stringify({ error: data.message }) }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, sid: data.sid }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    }
  }
}
