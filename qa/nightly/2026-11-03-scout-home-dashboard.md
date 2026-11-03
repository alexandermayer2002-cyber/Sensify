# Nightly Scout — Home Dashboard — 2026-11-03

Area 3 (day 3 mod 10) — second pass; first was 10-23, whose six findings all
verified fixed tonight, in code and live (milestone windows, softened audit copy,
dead-code sweep, away-nights out of the 28 count, day-1 zero-streak dash, the
no-improvement fallbacks). Tonight walked all five fleet life-stages read-only at
430px (day 7, day 14 + slip-up, day 47, reintro day 6 mid-washout, tracking), shots
SC3*/V3*, plus one fault probe (profiles fetch blocked client-side), and re-read
Dashboard.js (2,282 lines), SuspectBoard.js, BaselineSharpness.js, confoundAnalysis.js.

**Regression context:** 63/63 (stamp 2611030751), zero FAIL lines — first run of the
expanded suite (classics 20 + p5 upload + fleet + sentinel + safety-oracle +
fault-injection layers all green).

## The headline

No broken customer moments. This is the strongest area two passes running — every
life-stage renders clean at 430px, zero console errors, streak/dots/away semantics
coherent, suspect-board queue dates recompute correctly from the protocol clock at
every stage. Tonight's items are one failure-state trust gap, one clock
inconsistency, and dead weight.

## Ranked findings

| # | Tag | Sev | Finding | Fix |
|---|-----|-----|---------|-----|
| 1 | CHANGE | MED | A failed `profiles` fetch (expired session, network blip, Supabase hiccup) renders the brand-new-user home — "Welcome to Sensify. Let's get you set up" + Start intake survey — to a mid-protocol customer, with no error copy at all (verified live: blocked `/rest/v1/profiles` → day-7 persona shown the fresh-signup state, shot V3FAULT_01). `loadData` swallows every error and all state cards key off *missing* data, not confirmed-empty data. Tail risk: a confused customer re-entering intake could overwrite mid-protocol baselines | Track a loadError state: on profile fetch error show "Can't reach your program — retry", never the setup CTA |
| 2 | CHANGE | MED | Reintro hero clock counts foods that will never be tested: `reintroSpan = foods.length × 14` (L1451) includes freq-`never` foods and ignores Safe verdicts already earned, while the projection line (L1673-80) and SuspectBoard exclude them — so "Day N of X · map complete" and the betweenCycles micro line can contradict the suspect board's own dates on the same screen | Derive the span from the same queue the board uses (non-never, unverdicted foods) |
| 3 | DELETE | LOW | Dead weight, generation 2: `phaseFull` (L1214) computed and never rendered; the Maintain-tab visibility calc exists twice (`maintainVisible` IIFE L1259 vs inline re-implementation in the nav filter L1274-81); comment "Last-10-days factor logs" on a 120-day fetch (L840-45) | Delete `phaseFull`, fold the nav filter onto `maintainVisible`, fix the comment |
| 4 | CHANGE | LOW | The constellation story has no ending for slow loggers: the card is gated to elim days 1–42, so a customer at day 43 with fewer than 28 stars loses the card — and its "pattern detection unlocks" promise — silently, mid-story (day-47 persona confirmed card absent) | Keep it until 28 stars or give it a closing state instead of vanishing |
| 5 | CHANGE | LOW | The drinks "Protocol" per-week figure divides total drinks by `ceil(loggedRows/7)` (L508-12) — logged *days*, not weeks *elapsed* — so a sparse logger's rate inflates (7 drinks across 7 scattered days in 5 weeks reads ~7/week, truth ~1.4/week) | Divide by weeks spanned since protocol start |
| 6 | CHANGE | LOW | ⚑ (mild) Pending-review bar promises "6 months total" (L1703, with an empty left label) — but program length is food-count-dependent and already known at that point: 3 foods ≈ 3.2 months, 8 ≈ 7.4 | Compute from the submitted food count, or hedge ("about six months for a typical panel") |

## What's solid

The cockpit hero is right at every stage: day-boundary math correct (day 47 on Nov 3
→ "Trial opens ~Nov 13" = day 57 exactly), cycle clock demotes the program day
cleanly, washout pill accurate, "streak starts with tonight's check-in" replaces the
celebrated zero, and the 28-star count now excludes away nights per the legend.
SuspectBoard and BaselineSharpness arrive a beat later than the shell (own fetches)
but render reliably — my first text grab at ~3s missed them; at 8s all present.
Pattern detection is genuinely backed now (CONFOUND_ENABLED true, engines run in the
weekly check-in path).

## Still open from prior nights (carry-forward)

- **Supabase actions (Alex, 13th night for the oldest):** PAYMENT_GATE_MIGRATION.sql,
  "Confirm email" ON, storage INSERT policy on `lab-results` (service-role workaround
  live), INTAKE_DRAFT_MIGRATION.sql.
- **Lab-kit fulfillment ruling** (10-30 #1, HIGH family) — marketing still sells a lab
  kit nothing fulfills; needs Alex's ruling.
- **Sentinel S5** (unchecked no-improvement audit insert, Dashboard L965) — the one
  sentinel item Deploy 15 left; detection also still fires only from client-side
  dashboard loads (10-23 #6 second half).
- **Test-only:** TIME MACHINE panel still overlaps content at 430px (10-23 minor note;
  seen tonight over the household card and Baseline Sharpness chips).
- CONFOUND thresholds + verdictEngine.js physician review — flagged in-code.
