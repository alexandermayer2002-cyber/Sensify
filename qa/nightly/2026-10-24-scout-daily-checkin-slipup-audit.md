# Nightly Scout — Daily Check-in + Slip-up/Audit Flows — 2026-10-24

Area 4 (day 24 mod 10). Walked the live site at 430px with a fresh test account
(+qa2610240626sc4): fresh account → intake → manual lab → skip to mid-elimination →
full daily check-in (plan No, notable symptom, recall free-text), slip-up survey
(free-text food), two more NO days → 3-NOs audit card → full ComplianceAudit walk
(cravings + life + other branches) → pending card, screenshotting each state. Read
src/pages/DailyCheckin.js, SlipupSurvey.js, ComplianceAudit.js (all of each),
Dashboard.js audit/away/streak wiring, AdminDashboard.js respondToAudit,
netlify/functions/test-skip.js. Built on the 10-20…10-23 reports; nothing repeated.
Also probed RLS: a user-side PATCH on compliance_audit returns 200 with zero rows
updated — users cannot flip audit status. Good.

**Regression context:** 54/54 (regress_summary.json, stamp 2610240651). Zero FAIL
lines — second consecutive fully green run of the 54-check suite (4 classic paths +
fleet). Nothing environmental tonight; one stray console 400 during the scout walk
did not reproduce on a clean login+load (same intermittent noted 10-23, still
unpinned, still only noise-level).

## What's solid

This area's front half is the best-crafted flow scouted so far. No overflow at
430px in any state. The check-in's recall parser correctly read "pasta with cream
sauce, then a glass of red wine" into Wheat · pasta and Dairy · cream sauce tags
(removable, honestly captioned "a lead, never a ruling"). The "on the record"
memory beat ("Bloating, evening · first of its kind on your record") works and is
genuinely motivating. The audit's branch coaching (cravings/social/stress/cooking/
cost/ideas) is warm, specific, and the stress-8 acknowledgment is excellent trust
copy. Slip-up card correctly yields to the audit card, honest-slip streak semantics
hold, and the away-gate wrote clean attestation audit rows. The findings are the
back half: what happens after the customer confesses.

## Ranked findings

### 1. CHANGE — The audit promises guidance that no surface can ever deliver  ⚑ COPY PROMISE FLAG (5th sighting)
**Why:** The submitted screen says "personalized guidance ready within 24 hours.
You'll see it right here on your dashboard" (ComplianceAudit.js:606), the AI prompt
is *instructed* to promise it (line 90: "End by saying guidance is coming within 24
hours" — live output: "will be with you within 24 hours"), and the fallback repeats
it (line 98). But the dashboard only ever reads compliance_audit for *pending*
status and away attestations — `admin_outcome`/`admin_note` appear nowhere in
Dashboard.js. When Alex responds, the "Guidance being prepared" card silently
disappears and nothing replaces it: the customer's most vulnerable confession ends
in permanent silence, with Deploy 11's softened pending copy ("it will meet you
here") equally unbackable. Verified live + by grep.
**How:** Render the most recent responded 3-NOs/no_improvement audit as a dashboard
card (outcome + Alex's note — the data respondToAudit already writes), and soften
the three 24-hour lines to the approved "usually within a day" pattern.

### 2. CHANGE — Slip-up AI tells customers an unflagged food is "a flagged sensitivity for you"
**Why:** SlipupSurvey passes `labResult.foods.find(name match)?.level || 'flagged'`
(line 108), so any free-text or off-list food reaches the prompt as sensitivity
level "flagged". Verified live: slipping on goat cheese (not on the lab list)
produced "goat cheese is a flagged sensitivity for you, so this exposure is worth
noting." Confidently wrong health claims are the most expensive kind of wrong in a
$399 trust product.
**How:** When the lookup misses, pass "not on their flagged list" — the prompt
already branches correctly for the 'Common' protocol case.

### 3. CHANGE — Audit submission failure is silent, and the insert waits on the AI call
**Why:** handleSubmit (ComplianceAudit.js:138–172) runs the slow AI generation
first, then inserts with no error check — if the insert fails the user still gets
the full success screen and the 24-hour promise while Alex's queue stays empty.
Same silent-failure family as 10-21 #5 / 10-22 #5. The slip-up upsert
(SlipupSurvey.js:92) has the same unchecked-result shape.
**How:** Insert first, check the error and offer retry, then generate the
acknowledgment (it's cosmetic).

### 4. CHANGE — Two pending audits break the pending lookup and invite duplicates
**Why:** Dashboard.js:858 uses `.maybeSingle()` on `status=pending_admin_review`;
the auto no_improvement trigger can coexist with a 3-NOs audit (its dedupe is
per-trigger_type only). Two rows → maybeSingle errors → data null → pendingAudit
false → the pending card vanishes *and* the 3-NOs card re-shows, so the user can
submit audit #3.
**How:** `.order('triggered_at', desc).limit(1)` instead of maybeSingle.

### 5. CHANGE — "Three days in a row" counts consecutive NO rows, not consecutive days
**Why:** The counter (Dashboard.js:850–855) walks daily_compliance rows newest-first
and breaks only on a YES — unlogged gap days have no rows, so 3 NOs spread across
weeks (below the away-gate threshold) still trigger the audit card and its "Three
days in a row is hard" opener. Honest copy on dishonest arithmetic.
**How:** Break the loop when dates aren't adjacent, or reword to "three logged
slip-ups".

### 6. CHANGE — Slip-up survey submits with zero foods, then the AI invents one
**Why:** canSubmit requires only a reason (SlipupSurvey.js:86); with no food
selected the AI is told the food was "a flagged food" and writes guidance about it.
The food list is the whole analytical value of the survey.
**How:** Require ≥1 food (free-text already works), or branch the prompt for the
foodless case.

### 7. DELETE — Dead weight in DailyCheckin.js
**Why:** the `activeReintro !== undefined` guard (line 570) is always true
(useState(null)) — dead condition; `cycleStale` (128–139) and `reintroStale`
(152–162) are twin IIFEs computing the same >5-day restart rule with a one-field
difference; the reward streak fetches 30 days of logs but iterates 60 (lines
321–334), silently capping every long streak at ~31 — a day-45 customer sees "31
day streak" forever.
**How:** Drop the dead guard, fold the twins into one, and align the fetch window
to the loop (or the loop to the window).

Minor notes, not ranked: the recall parser skipped "a glass of red wine" (Alcohol
is a COMMON_FOODS entry — likely the parse prompt's scope, worth one look); one
stray console 400 during the walk (see regression context); the ComplianceAudit
"← Back" from a branch returns to q1 but keeps earlier branch answers in state
(harmless today since submit re-collects, but a trap for future edits).

## Still open from prior nights

10-21 #2 (run PAYMENT_GATE_MIGRATION.sql in Supabase) and 10-21 #3 (switch on
"Confirm email") still wait on Alex — three nights open; both are one-click actions
only he can take. Everything else from 10-20 through 10-23 is closed (Deploys 9–11
+ the 10-23 ruling). Tonight's #1 is the fifth sighting of the unenforced-promise
family (10-20 #2 SMS, 10-21 #6 consent emails, 10-22 #3 lab-review SLA, 10-23 #2
audit card) — and the first where the promise is structurally undeliverable rather
than merely unsent; the 10-23 recommendation of a single promises-sweep stands,
with #1's delivery card as its natural first piece.
