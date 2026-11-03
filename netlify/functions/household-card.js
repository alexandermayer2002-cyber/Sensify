// HOUSEHOLD CARD — public, token-only, read-only.
// The person who cooks at home is the biggest unlogged compliance factor.
// This function serves them exactly two things: what the user is currently
// avoiding, and this week's trial food (if a cycle is active). Nothing else.
//
// Security posture:
//   - Lookup is by opaque token ONLY (24 hex chars minted client-side by the
//     signed-in user into their own profiles.shown_milestones.household_token).
//     There is no mint/list/enumerate action here; unknown token -> 404.
//   - The response NEVER includes symptoms, scores, insights, verdicts, email,
//     or last name. First name only (first word of full_name).
const { createClient } = require('@supabase/supabase-js')

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}
const reply = (statusCode, body) => ({ statusCode, headers: CORS, body: JSON.stringify(body) })

// ---------------------------------------------------------------------------
// Minimal mirror of src/utils/protocolEngine.js getProtocolFoods(). Netlify
// functions are CommonJS and cannot import the app's ES modules, so the food
// lists and track rules are duplicated here. If the engine's lists or rules
// change, change these too.
// ---------------------------------------------------------------------------
const COMMON_TIER_1 = ['Dairy', 'Gluten / wheat']
const COMMON_TIER_2 = ['Dairy', 'Gluten / wheat', 'Eggs', 'Soy', 'Tree nuts', 'Corn', 'Onion / garlic', 'Legumes']

function resolveProtocolFoodNames(profile, labResult) {
  const labFoods = (labResult && Array.isArray(labResult.foods)) ? labResult.foods : []
  const track = (profile && profile.protocol_track) || (labFoods.length ? 'flagged' : null)

  if (track === 'declined' || !track) return []

  if (track === 'common') {
    const tier = Number(profile && profile.protocol_tier) === 2 ? 2 : 1
    // Lab-flagged foods JOIN the common-track elimination (same ruling as the
    // engine): a flagged sensitivity left on the plate would contaminate the
    // baseline. On a name collision the lab entry wins.
    const labFlagged = labFoods.filter(f => f && f.level && f.level !== 'No sensitivity')
    const tierNames = (tier === 2 ? COMMON_TIER_2 : COMMON_TIER_1)
      .filter(tn => !labFlagged.some(lf => (lf.name || '').toLowerCase() === tn.toLowerCase()))
    return [...tierNames, ...labFlagged.map(f => f.name)].filter(Boolean)
  }

  // Default / flagged: the lab foods exactly as the engine uses them.
  return labFoods.map(f => f && f.name).filter(Boolean)
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' }
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') return reply(405, { error: 'GET or POST only' })

  let token = ''
  if (event.httpMethod === 'GET') {
    token = ((event.queryStringParameters || {}).token || '').trim()
  } else {
    try { token = (JSON.parse(event.body || '{}').token || '').trim() } catch { return reply(400, { error: 'bad json' }) }
  }
  // Tokens are minted as 24 lowercase hex chars; accept nothing looser.
  if (!/^[0-9a-f]{24}$/i.test(token)) return reply(404, { error: 'not found' })

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  // Token lookup only — PostgREST supports .eq on a JSON text path.
  const { data: prof, error: profErr } = await sb
    .from('profiles')
    .select('id, full_name, program_phase, protocol_track, protocol_tier')
    // Storage is a JSON ARRAY of strings; the token entry is 'household_token:<hex>'.
    .contains('shown_milestones', ['household_token:' + token])
    .limit(1)
    .maybeSingle()
  if (profErr || !prof) return reply(404, { error: 'not found' })

  const [{ data: lab }, { data: cycles }] = await Promise.all([
    sb.from('lab_results').select('foods').eq('user_id', prof.id)
      .order('submitted_at', { ascending: false }).limit(1).maybeSingle(),
    sb.from('reintroduction_results').select('food, washout_started_at, verdict').eq('user_id', prof.id)
      .order('started_at', { ascending: false }),
  ])

  // Only a SAFE verdict takes a food off the cook's card (QA 2026-10-29 #1:
  // counting any verdict as settled told the household "nothing is off the
  // plate" while the user's own app said AVOID dairy). Limit/Avoid verdicts
  // stay listed, labeled with their ruling.
  const latestVerdict = {}
  for (const c of [...(cycles || [])].reverse()) {           // cycles arrive newest-first; reverse so later trials win
    if (c.verdict) latestVerdict[(c.food || '').toLowerCase()] = c.verdict
  }
  const settled = new Set(Object.keys(latestVerdict).filter(k => latestVerdict[k] === 'Safe'))

  // The active cycle (no verdict yet) is this week's trial.
  const active = (cycles || []).find(c => !c.verdict) || null
  const trial = active
    ? { food: active.food, phase: active.washout_started_at ? 'washout' : 'exposure' }
    : null

  // Avoiding = protocol foods minus settled foods, minus the trial food while
  // it is deliberately back on the plate (exposure). During washout it is off
  // again, so it stays on the list.
  const seen = new Set()
  const avoiding = resolveProtocolFoodNames(prof, lab).filter(name => {
    const key = name.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    if (settled.has(key)) return false
    if (trial && trial.phase === 'exposure' && key === (trial.food || '').toLowerCase()) return false
    return true
  }).map(name => {
    const v = latestVerdict[name.toLowerCase()]
    return { name, status: v === 'Avoid' ? 'avoid' : v === 'Limit' ? 'limit' : 'eliminated' }
  })

  return reply(200, {
    first_name: (prof.full_name || '').trim().split(/\s+/)[0] || null,
    avoiding,
    trial,
    phase: prof.program_phase || null,
  })
}
