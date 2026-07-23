// THE one protocol-day calculator. Parses protocol_start_date as a LOCAL date
// (never new Date('YYYY-MM-DD'), which is UTC midnight and lands the previous
// evening in US timezones — the bug that fired day-3 messages on day 2 and
// showed 2% progress before day 1). Day 0 = approved, starts tomorrow.
export function protocolDay(startDateStr) {
  if (!startDateStr) return 0
  const [y, m, d] = startDateStr.split('T')[0].split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const now = new Date()
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.round((todayLocal - start) / (1000 * 60 * 60 * 24)) + 1)
}
