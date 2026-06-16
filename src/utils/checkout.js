// Starts Stripe hosted checkout. Redirects the browser to Stripe.
export const startCheckout = async (email) => {
  const res = await fetch('/.netlify/functions/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email || undefined }),
  })
  const data = await res.json()
  if (data.url) {
    window.location.href = data.url
  } else {
    throw new Error(data.error || 'Could not start checkout')
  }
}
