// =============================================================================
// LAB FILE UPLOAD — service-role fallback for the private lab-results bucket.
//
// WHY THIS EXISTS (QA 2026-11-02 #1): the bucket has no INSERT policy for
// authenticated users, so every direct client upload 403s and the original
// document never reaches review. Until (and even after) that policy lands,
// this function accepts the file from a VERIFIED signed-in user and writes it
// with the service role. The bucket stays private; the admin dashboard keeps
// reading it through short-lived signed URLs.
//
// Safety: requires a valid Supabase JWT; the stored object name is derived
// server-side from the verified user id (never from the client), so one user
// can never write into another's namespace. 5MB decoded cap; images arrive
// pre-downscaled by the client, PDFs are client-capped at 4.5MB.
// =============================================================================
const { createClient } = require('@supabase/supabase-js')

const MAX_BYTES = 5 * 1024 * 1024

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'POST only' }) }

  const authHeader = event.headers.authorization || event.headers.Authorization || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) return { statusCode: 401, body: JSON.stringify({ error: 'Authentication required' }) }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  let userId
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return { statusCode: 401, body: JSON.stringify({ error: 'Invalid session' }) }
    userId = user.id
  } catch (e) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Auth check failed' }) }
  }

  let payload
  try { payload = JSON.parse(event.body || '{}') } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }
  const { data, contentType, ext } = payload
  if (!data || typeof data !== 'string') return { statusCode: 400, body: JSON.stringify({ error: 'data required' }) }
  const safeExt = /^[a-z0-9]{1,5}$/i.test(ext || '') ? ext.toLowerCase() : 'bin'
  const safeType = /^[\w.+-]+\/[\w.+-]+$/.test(contentType || '') ? contentType : 'application/octet-stream'

  let bytes
  try { bytes = Buffer.from(data, 'base64') } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'bad base64' }) }
  }
  if (!bytes.length || bytes.length > MAX_BYTES) {
    return { statusCode: 413, body: JSON.stringify({ error: 'File too large (5MB max)' }) }
  }

  const fileName = `${userId}-${Date.now()}.${safeExt}`
  const { error: upErr } = await supabase.storage
    .from('lab-results')
    .upload(fileName, bytes, { contentType: safeType, upsert: true })
  if (upErr) return { statusCode: 500, body: JSON.stringify({ error: upErr.message }) }

  return { statusCode: 200, body: JSON.stringify({ ok: true, file_path: fileName }) }
}
