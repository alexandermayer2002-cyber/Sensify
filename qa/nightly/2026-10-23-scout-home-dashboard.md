# Nightly Scout — Home Dashboard — 2026-10-23

Area 3 (day 23 mod 10). Walked the live site at 430px with a fresh test account
(+qa2610233dsh3): fresh dashboard → intake → manual lab (flagged track auto-start) →
"Starts tomorrow" → day 1 (AI briefing, confetti, first-week guide, suspect board) →
day 8 (weekly due) → day 51 (mid-elimination), screenshotting every state. Read
src/pages/Dashboard.js (all 2,348 lines), components/BaselineSharpness.js,
utils/confoundAnalysis.js, utils/protocolEngine.js, netlify/functions/test-approve-lab.js.
Built on the 10-20/10-21/10-22 reports; nothing repeated.

**Regression context:** 54/54 (regress_summary.json, stamp 2610230701). Zero FAIL lines —
first fully green run of the expanded 54-check suite (four paths + fleet personas +
invariant sweep). Deploy 10's fixes verified holding; nothing environmental tonight.

## What's solid

The home dashboard is the strongest area scouted so far. No state overflows at 430px
(every state measured scrollWidth 430). The day-1 moment is genuinely good: confetti,
a generated briefing that correctly named only the two entered foods and rendered in
its three labeled sections, the first-week guide modal (clear, warm, accurate), and a
suspect board whose projected trial dates ("Trial opens ~Dec 11 / ~Dec 25") recompute
correctly as days pass. Baseline Sharpness's "was ±2.2 on day 3" caption is computed,
not hardcoded. The 10-22 refetch-on-focus fix is live in loadData. The bottom tab bar
correctly hides Maintain pre-day-57. The findings below are mostly lifecycle edges and
dead weight, not broken customer moments.

## Ranked findings

### 1. CHANGE — Day-3/14/28 milestones fire only on the exact day; miss the day, lose the milestone forever
**Why:** checkMilestones gates on `day === 3`, `day === 14`, `day === 28`
(Dashboard.js:1101, 1114, 1127) — a customer who doesn't open the app on precisely
those days (most phone users, most days) permanently loses the "2 week milestone" and
"One month in" moments, the retention beats a $399 program leans on; the day-57 branch
already uses the right pattern (`day >= 57 && day < 113`). Verified live: skipping
day 8 → day 51 produced no day-14 and no day-28 message.
**How:** Use windows like day57 — `day >= 3 && day < 14`, `>= 14 && < 28`,
`>= 28 && < 57` — keeping each milestone's shown-once guard and label.

### 2. CHANGE — Audit-pending card promises "ready within 24 hours" that nothing enforces or delivers  ⚑ COPY PROMISE FLAG
**Why:** "Your personalized guidance will be ready within 24 hours"
(Dashboard.js:1833) is an unenforced solo-founder SLA: guidance lands only when Alex
reviews the compliance audit, no mailer exists (10-20 #2, 10-21 #6, 10-22 #3 family),
and the user learns it arrived only by coming back. The lab-review sibling of this
copy was softened in Deploy 10; this one was missed.
**How:** Match the approved pending-lab pattern: "Usually ready within a day — it
will meet you here" (refetch-on-focus already covers the return visit).

### 3. DELETE — ~120 lines of dead code in Dashboard.js
**Why:** `YourNumbers` (lines 307–382) is a full 75-line bar-chart component never
rendered anywhere; `BADGE` (230) and `highFoods`/`moderateFoods` (1291–92) are
computed and never read; `.snfy-dot.logged` CSS (184–86) styles a class the dot
builder never assigns; the milestone label ternary still carries retired
`day113`/`day169` branches its own comment says no longer exist (1674 vs 1151–55);
cycleLine's second stale branch (1272, "PAUSED · RESTART") is unreachable — its
condition is strictly contained in the "NEEDS A RESTART" branch above it; day-3 uses
a dynamic `import('../utils/aiInsights')` for a function already imported at the top;
and `cycleStaleLite`/`cycleStaleFood` (1237–58) are twin IIFEs computing the same
fact twice. Dead weight ships to every visitor and misleads the next editor.
**How:** Delete YourNumbers, BADGE, highFoods/moderateFoods, the .logged rules, the
retired labels, the unreachable branch, the dynamic import; fold the stale-cycle
twins into one `cycleStale = {food} | null`.

### 4. CHANGE — Constellation lets attested-away nights count toward the 28 that "unlock pattern detection"  ⚑ COPY PROMISE FLAG (mild)
**Why:** starCount adds awayN (Dashboard.js:2252), so a traveler can reach "Your
constellation is complete. Pattern detection is live" on, say, 18 logged + 10
attested nights — while confoundAnalysis needs 4 usable weeks of ≥4 real daily logs
each and would still report "insufficient". The compliance legend itself says away
days "stay out of your analysis", so the card contradicts the legend two cards up.
**How:** Count only logged nights toward 28 (away rings can still hang as decoration
without advancing the counter), or have the complete-state copy hedge when awayN > 0.

### 5. CHANGE — The streak renders twice on one phone screen, and day 1 opens on a celebrated zero
**Why:** In cockpit mode the hero ring shows "0 DAY STREAK" (a full-drawn ring around
a zero, before the first check-in ever happens) and the compliance card repeats the
same number ~two scrolls down; the card's window label also clamps to the odd
"DAYS 1–1" on day one (2017–18). Duplicate instruments on a 430px screen spend trust
and pixels; a zero in a complete ring reads as a bug.
**How:** On day 1 pre-check-in, show "DAY 1" or "STARTS NOW" under the ring instead
of "0 day streak"; keep the number in the hero only and let the compliance card keep
dots + window label (clamped to "DAY 1" when the window starts the protocol).

### 6. CHANGE — The no-improvement safety net only triggers from a client-side dashboard visit
**Why:** The week-4 no-improvement audit is created inside loadData (Dashboard.js:
998–1037): it fires only when the user opens the Home tab, from the browser, and its
missing-data fallbacks (`: 100`) treat an absent baseline as 100% improvement, so the
exact customers it exists for — disengaging or sparse-data users — are the least
likely to ever trip it. It also runs its queries + conditional insert on every single
dashboard load for everyone, forever (guarded only by a 14-day lookback).
**How:** Move the detection to the weekly-check-in submit path (it runs exactly when
new data exists) or a scheduled server function; treat missing baselines as
"insufficient", not improved.

Minor notes, not ranked: one console "400 Bad Request" appeared once during the day-1
load (tonight's only console noise; all suite console checks green — worth pinning
down which loadData query it is); the TEST MODE time-machine panel overlaps the
Baseline Sharpness readout at 430px (test accounts only); the hero ring is always
drawn 100% full regardless of streak, pure decoration that can read as a meter.

## Still open from prior nights

10-21 #2 (server-side payment enforcement) remains half-done — PAYMENT_GATE_MIGRATION.sql
exists but takes effect only when Alex runs it in Supabase — and 10-21 #3 still waits on
"Confirm email" being switched on in the Supabase dashboard. Everything else from 10-20,
10-21 and 10-22 is closed (Deploys 9–10 + the 10-23 ruling). Tonight's #2 is the fourth
sighting of the unenforced-promise family (10-20 #2, 10-21 #6, 10-22 #3): recommend a
single sweep for time/notification promises in copy whenever a mailer finally exists.
