// ============================================================
// Date helpers — LOCAL date handling.
// ------------------------------------------------------------
// The bug this fixes: toISOString() converts a local time to UTC, so a
// calendar-date decision made in the evening (US timezones) rolls to the
// next day hours early. Every "what day is it for this user" decision must
// use the user's LOCAL date, derived from local components — never UTC.
//
// new Date() in the browser is already in the user's local timezone; we just
// must not throw that away by converting to UTC. localDateString() builds the
// YYYY-MM-DD string from local components so it rolls at the user's local
// midnight, in every timezone.
//
// NOTE: this correctly handles every fixed-timezone user. The only case it
// can't perfectly handle is a user physically traveling across timezones
// mid-day, which would require storing an explicit per-user timezone.
// ============================================================

// Returns YYYY-MM-DD for the given date (or now) in LOCAL time.
export function localDateString(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Local date string for "today".
export function todayLocal() {
  return localDateString(new Date())
}

// Local date string for N days from now (negative = past). Useful for ranges.
export function localDateOffset(days, from = new Date()) {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return localDateString(d)
}

// Whole calendar days between two local dates (b - a), based on local midnight.
// Used for protocol day math so it rolls at local midnight, not UTC.
export function daysBetweenLocal(aDateStr, bDate = new Date()) {
  // aDateStr is YYYY-MM-DD (a stored date); compare at local midnight.
  const [ay, am, ad] = String(aDateStr).split('T')[0].split('-').map(Number)
  const a = new Date(ay, am - 1, ad)
  const b = new Date(bDate.getFullYear(), bDate.getMonth(), bDate.getDate())
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}
