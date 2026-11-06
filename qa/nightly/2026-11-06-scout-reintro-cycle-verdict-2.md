# Nightly Scout — Reintro Tab + Cycle Flow + Verdict Survey (2nd pass) — 2026-11-06

Area 6 (day 6 mod 10) — second pass; first was 10-26, whose seven findings all
shipped in Deploy 12. Walked a fresh +qa account (+qa061126sc6b) at 430px with
browser TZ **America/New_York** (first scout walk in a customer timezone — it
paid off): seed → day 57 → start Cow Milk cycle → severe day-2 check-in → severe
banner → stop flow → ledger → second cycle (Wheat) → own-row REST to
verdict-ready with a cleared profile pointer → survey → verdict → REST dump of
food_map/cycles. Shots SC6B_*/SC6C_*. Re-read ReintroTab.js (full),
ReintroductionSurvey.js (full), verdictEngine.js, DailyCheckin.js reintro block,
Dashboard.js reintro wiring, aiInsights verdict prompt.

**Regression context:** 63/63 (classics 23 + fleet 34 + sentinel 4 + fault 2),
zero FAILs, 8th clean night. regress_summary.json stamp 2611060752.

## What's solid (Deploy 12 re-verified live)

The severe off-ramp works end to end: severe intensity in the check-in → warning
card → tab banner ("You logged a severe reaction") → stop → confirm → Avoid
verdict + food_map row + Tested ledger with every log kept. The needle speaks
with the engine's voice ("Day 2: severe bloating logged, moved toward Avoid" at
86%). TierEscalation's confirm step is honest. The verdict write is checked with
a retry path, secondary writes retry once. OutcomeQuestion keeps the scale on
failure. ReintroDailyCheckin.js is deleted. Zero console errors across the whole
walk; every screen 430px. The new findings live in the hand-off seams and the
one write the doctrine missed.

## Ranked findings

| # | Tag | Sev | Finding | Fix |
|---|-----|-----|---------|-----|
| 1 | CHANGE | HIGH | The verdict survey can run under the wrong food — proven live: Wheat cycle verdict-ready + stale profile pointer → "Your eggs results." headline, AI analysis written about eggs, food_map gained **Eggs: Limit** (never tested) while the Wheat row holds the verdict (shots SC6C_09/10; REST dump confirms). Dashboard:1484 `onStartVerdictSurvey={(food) => { setScreen('reintro-survey') }}` discards the food it is handed; Dashboard:1295 falls back `current_reintro_food \|\| 'Eggs'`. The stale pointer is reachable: startReintro's insert+profile writes aren't transactional (ReintroTab:673-695), and the survey's own cleanup clears the pointer | Store the food from the callback (or use activeCycleLite.food, already in state), delete the 'Eggs' literal, and derive the survey's food from the cycle row it writes to |
| 2 | CHANGE | HIGH | The one write the write-first doctrine missed: the daily check-in's reintro save — the reintro_daily_logs upsert AND the exposure-count/washout-start update — sits in `catch { console.error }` (DailyCheckin:214-246) while daily_factors right below it is checked with an alert. A failed log write still shows the success screen: lost exposure evidence silently corrupts the verdict; a failed count update desyncs the day counter and washout start and can strand the cycle in the 5-day restart loop. 10th sighting of the silent-write family | Check both writes like daily_factors (keep the button, show the retry copy); they guard the most consequential data in the product |
| 3 | CHANGE | HIGH | The survey's sleep cross-ref cannot read real sleep data: ReintroductionSurvey:163 declares a private band map (`under6/6-7/7-8/8plus`) but the NumPad check-in writes numeric strings ('7', '7.5') — every rank lookup is undefined, the sort is a no-op, and "worst sleep nights" becomes an arbitrary subset of rows. sleepOverlap can then assert a fabricated overlap (or miss a real one) on the survey screen AND in the AI verdict prompt, which may move the verdict a level. 4th private band-map copy; Deploy 18 made confoundAnalysis numeric-aware but not this one | Import confoundAnalysis's `sleepHours()` and rank by it; sweep the repo for remaining private band maps |
| 4 | CHANGE | MED | Cycle-log dates render one day early for US customers — verified live in America/New_York: Nov 5 + Nov 6 logs show "Nov 4" and "Nov 5" (shot SC6C_03). CycleSummary.dayLabel (ReintroTab:445) is the only date in the area using UTC-parsing `new Date('YYYY-MM-DD')`; TestedLedger, the needle and the timeline all parse local | Use the file's own parseLocal there too |
| 5 | CHANGE | MED | ⚑ COPY PROMISE: the verdict screen's "Worth knowing" promises "After completing your full program, you can choose to retest any food and update its verdict" (ReintroductionSurvey:359) — no such control exists anywhere: only conflicted verdicts earn the retest card, and the picker excludes verdicted foods by design | Add a retest door to the Tested ledger at program-complete, or tell the truth (conflicted rulings re-run; others are final unless support intervenes) |
| 6 | CHANGE | MED | The severe gate is the least shape-tolerant symptom reader on the verdict path: `hasSevereLog` does `(l.symptoms \|\| []).some(...)` (ReintroTab:727) — a legacy string-encoded symptoms row throws and error-boundaries the whole tab; computeProvisionalVerdict (verdictEngine:46) silently ignores string rows, so a logged severe day could be missed and the cycle ruled Safe. TestedLedger, EvidenceNeedle and buildSummary all deliberately parse the string shape | One shared parseSymptoms helper across hasSevereLog + the engine |
| 7 | DELETE | LOW | `showReintroCard` and its "reintroduction complete" hero (Dashboard:1262, 1862-1868) are dead: `current_reintro_day` is written 1 at start, cleared at verdict, incremented by nothing — `>= 14` can never fire; the live path is verdictReadyFood off the cycle row | Delete the card and the day-pointer writes (or make the counter real); half-dead duplicates are how 10-26 #1 happened |

Minor notes, not ranked: the "washout day N of 11" counter starts on exposure
day 3 (10-26 minor, still open — badge flips to "Washout: avoid this food" the
day exposure 3 was eaten); "EXPOSURE (DAYS 1 TO 3)" still wraps to three lines
at 430px (10-26 minor, still open, shot SC6B_09); the survey's noise-floor
denominator spans to *today* instead of cycle start, diluting the baseline rate
it reports; ProgramComplete's auto-complete profile write is fire-and-forget
(low: it retries on every view); the disagreement follow-up questions ("When was
it strongest?", "Do you think X was behind it?") are written for the "felt
worse" direction and read oddly on the "felt milder" path.

## Still open from prior nights (carry-forward)

- **Supabase actions (Alex, 16th night for the oldest):** PAYMENT_GATE_MIGRATION.sql,
  "Confirm email" ON, storage INSERT policy on `lab-results` (HIGH family;
  service-role workaround carries uploads), INTAKE_DRAFT_MIGRATION.sql (intake
  autosave dead + the stray console 400), DIGESTIVE_AXIS_MIGRATION.sql (cutoff =
  Deploy 18 time), WEEKLY_UNIQUE_MIGRATION.sql.
- **Lab-kit fulfillment ruling** (10-30 #1) — still unbacked.
- **Physician review** of CONFOUND + verdictEngine thresholds — three nights
  running, the HIGHs live exactly where that review would look (11-05's
  inverted axis, tonight's #3).
- Tonight's 7 findings await approval; no product deploy since Deploy 18.

---

> **Resolved 2026-11-06 (Deploy 19, approved by Alex):** all seven findings
> implemented and deployed the same day, plus the area's minors (washout
> badge honesty, non-wrapping timeline labels, noise-floor denominator to
> cycle start, direction-aware "felt milder" questions). Live re-reproduction
> of #1's exact poison (Wheat cycle verdict-ready, current_reintro_food
> cleared): the survey now says "Your wheat results.", no eggs anywhere, and
> food_map holds exactly [Wheat: Avoid] — the phantom-verdict path is closed,
> and a survey with no identifiable cycle refuses to rule. A string-shaped
> symptoms row seeded into the washout neither crashed the tab nor hid from
> the engine (shared parseSymptoms). The reintro daily save is checked both
> ways; sentinel allowlist updated (silent-write family is now 0 on the
> verdict path). Note for the MD review: the engine ruled 1 mild exposure day
> + 1 washout flare as Avoid — thresholds unchanged tonight, but that
> severity feels high; it's on the review's list.
> Console 400s during this walk remain the known intake_draft noise
> (INTAKE_DRAFT_MIGRATION.sql still unrun).
