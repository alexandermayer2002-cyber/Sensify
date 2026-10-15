// =============================================================================
// TEST MODE — TESTING ONLY. None of this touches real customers.
// A test account is one whose email carries a +fable / +qa / +robot tag.
// Everything here is gated on that pattern; every normal account sees the
// exact production flow (admin-gated lab approval, no time controls).
// =============================================================================
export function isTestAccount(email) {
  return /\+(fable|qa|robot)/i.test(email || '')
}

const localDateString = (d) => {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}
const shiftDate = (iso, days) => {
  const d = new Date(String(iso).split('T')[0] + 'T12:00:00')
  d.setDate(d.getDate() - days)
  return localDateString(d)
}

// Mirrors AdminDashboard.approveLab for robot accounts only, using the
// admin-suggestion rule: no flags, or at most two Low flags -> common;
// anything stronger -> flagged (standard) track starting tomorrow.
export async function autoApproveTestLab(supabase, userId, foods) {
  const flagged = (foods || []).filter(f => f.level && f.level !== 'No sensitivity')
  const common = flagged.length === 0 || (flagged.length <= 2 && flagged.every(f => f.level === 'Low'))
  // RLS rightly blocks a user approving their own lab row; the TEST-ONLY
  // serverless function (pattern-checked server-side) flips the status.
  try {
    const { data: u } = await supabase.auth.getUser()
    await fetch('/.netlify/functions/test-approve-lab', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: u?.user?.email }) })
  } catch (e) {}
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
  const profileUpdate = common
    ? { program_phase: 'awaiting_decision', protocol_track: 'common', track_decision: 'pending', track_assigned_at: new Date().toISOString(), track_note: 'TEST AUTO-APPROVE' }
    : { program_phase: 'elimination', protocol_start_date: localDateString(tomorrow), protocol_track: 'flagged', track_assigned_at: new Date().toISOString(), track_note: 'TEST AUTO-APPROVE' }
  await supabase.from('profiles').update(profileUpdate).eq('id', userId)
}

// The time machine: shifts the account's whole history back by N days through
// the app's own client permissions (every write is an own-row operation), then
// backfills the lived days with clean, on-plan check-ins so the away gate,
// streaks, and the sky stay honest. Robot accounts only.
export async function testSkipDays(supabase, userId, days) {
  const n = Math.max(1, Math.min(200, Number(days) || 0))

  const { data: prof } = await supabase.from('profiles').select('protocol_start_date').eq('id', userId).maybeSingle()
  if (prof?.protocol_start_date) {
    await supabase.from('profiles').update({ protocol_start_date: shiftDate(prof.protocol_start_date, n) }).eq('id', userId)
  }

  const shiftTable = async (table, col) => {
    const { data: rows } = await supabase.from(table).select(`id, ${col}`).eq('user_id', userId)
    for (const r of (rows || [])) {
      if (r[col] != null) await supabase.from(table).update({ [col]: shiftDate(r[col], n) }).eq('id', r.id)
    }
  }
  await shiftTable('daily_factors', 'log_date')
  await shiftTable('daily_compliance', 'date')
  await shiftTable('reintro_daily_logs', 'log_date')

  const { data: cycles } = await supabase.from('reintroduction_results').select('id, started_at, washout_started_at').eq('user_id', userId)
  for (const c of (cycles || [])) {
    await supabase.from('reintroduction_results').update({
      started_at: shiftDate(c.started_at, n),
      washout_started_at: c.washout_started_at ? shiftDate(c.washout_started_at, n) : null,
    }).eq('id', c.id)
  }

  const { data: evs } = await supabase.from('symptom_logs').select('id, logged_at').eq('user_id', userId)
  for (const e of (evs || [])) {
    const t = new Date(e.logged_at); t.setDate(t.getDate() - n)
    await supabase.from('symptom_logs').update({ logged_at: t.toISOString() }).eq('id', e.id)
  }

  // Backfill the skipped days as clean, on-plan days (yesterday back n days).
  const facts = [], comps = []
  for (let i = 1; i <= n; i++) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const ds = localDateString(d)
    facts.push({ user_id: userId, log_date: ds, sleep: '7-8', stress: 'low', hydration: 'good', followed_protocol: true })
    comps.push({ user_id: userId, date: ds, response: 'YES', logged_at: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 20).toISOString() })
  }
  if (facts.length) await supabase.from('daily_factors').upsert(facts, { onConflict: 'user_id,log_date', ignoreDuplicates: true })
  if (comps.length) await supabase.from('daily_compliance').upsert(comps, { onConflict: 'user_id,date', ignoreDuplicates: true })
}
