# Nightly Scout — Weekly Check-in + Insights — 2026-11-05

Area 5 (day 5 mod 10) — second pass; first was 10-25, whose seven findings all
shipped in Deploy 12 and verified again tonight in code AND live (write-first
insert with the button disabled until the row lands, honest failure copy,
protocol-window countdown [T-MINUS 2D correct at day 103], earned-streak copy,
confound week keying, offered-vs-surfaced flag, dead styles gone). Walked
+fable6 at 430px — ideal state: reintroduction day 47, two check-ins on record,
weeks 11–13 skipped, week 14 due LATE — dashboard → History → full late check-in
submit → success hero/insight/streak → History after. Shots WK5_*/WK5B_*.
Re-read WeeklyCheckin.js, CheckinHistory.js, confoundAnalysis.js,
trackRecommendation.js, Dashboard.js weekly wiring, IntakeSurvey baselines.

**Regression context:** see regress_summary.json (2026-11-05 run).

## What's solid

Deploy 12's rework held up under the nastiest state I could give it: a
3-weeks-late check-in in reintro phase. The row landed before the AI spoke,
the countdown clock agreed with the protocol math, the streak card refused to
claim "14 weeks clean" and said "Week 14 logged — this one was a good week"
instead, and the insight correctly read bloating/clarity/energy directions and
correctly attributed the symptom signal to the active gluten cycle rather than
calling it a setback. The one thing it got wrong, it got wrong for a reason
nobody has caught until tonight — and it's the biggest finding in this area's
history.

## Ranked findings

| # | Tag | Sev | Finding | Fix |
|---|-----|-----|---------|-----|
| 1 | CHANGE | HIGH | The digestive scale's axis is inverted across the product, and the AI reads improvements as reactions: intake's main path captures `baseline_digestive` with 10 = "Very uncomfortable" (IntakeSurvey.js:292; SCALE_DIRECTION agrees, `higherWorse`), but the weekly check-in asks the same id with 10 = "Very comfortable" (WeeklyCheckin.js:61), and History/dashboard/success-hero all read it `higherBetter` — verified live: answering 7 ("very comfortable" side) showed a green "7 DIGESTIVE · WAS 4 (+75%)" improvement on the SAME screen as an AI insight saying "Digestive discomfort rose sharply this week to 7/10, up 75%" and attributing the phantom reaction to the gluten being tested (shot WK5B_06); both prior stored insights misread it the same way | Pick ONE axis (comfort, matching the weekly UI), relabel intake :292, flip SCALE_DIRECTION.digestive, and audit stored baselines — note intake's SECOND variant (:319, post-meal path) already uses the comfort axis, so existing `baseline_digestive` data is mixed per-user (which question they saw is recoverable from their intake answers' `general_postmeal`) |
| 2 | CHANGE | MED | The day-grain sleep stat fed to the AI drops every 8+ hour night: WeeklyCheckin.js:123 maps `'8+'` but DailyCheckin writes `'8plus'`, so good-sleep days vanish from the "sleep averaged Xh on symptom days vs clear days" line the prompt presents as "computed from the daily record" — the overlap the AI names can be wrong for exactly the users sleeping well | One token: `'8plus': 8.5` (and share the band maps instead of re-declaring them per file — this is the third private copy) |
| 3 | CHANGE | MED | ⚑ COPY PROMISE: `complete`/`tracking`-phase customers get a perpetual countdown — weeklyDue is only ever set in elimination/reintro (Dashboard.js:905) but History's locked card only checks programNotStarted (CheckinHistory.js:476), so a finished customer sees "Next check-in coming soon · T-MINUS Nd" re-arm every 7 days forever, promising a check-in that never unlocks | Gate the locked card on phase; show a "Your record is complete — N weeks logged" closing state instead |
| 4 | CHANGE | MED | The dashboard voice card presents a stale insight in the present tense: `latest_insight` leads the dashboard indefinitely ("Clarity rose 25% above baseline **this week**") with only a week number — live, a 3-week-old Week-10 insight fronted a week-14 dashboard with no date and no cue it was old | Stamp it with the check-in date, and when `latest_insight_week` < current week swap the header to "FROM WEEK N" with a muted catch-up nudge |
| 5 | CHANGE | MED | Reintro customers are asked "How closely did you follow **the elimination plan** this week?" while their plan IS eating the test food (live, shot WK5B_01: asked mid-gluten-cycle) — a customer on exposure days can't answer honestly: eating gluten is compliance, not a slip | Phase-aware copy: "How closely did you follow your protocol this week? (Exposure days count as on-plan.)" — the phase is already passed in and stamped on the row |
| 6 | CHANGE | LOW | The AI is told the latest check-in is "LAST WEEK'S SCORES" however old it is (loadPreviousCheckin takes the newest row; live case: 3 weeks old) — one hedge away from "compared to last week" claims about a month-old week | Label it with its real week number and gap ("WEEK 10 SCORES, submitted 3 weeks ago") |
| 7 | CHANGE | LOW | The test-mode seeder writes `hydration: '6'` — not a valid band (`'6-8'`, testMode.js:83) — so every seeded day is hydration-invisible to the dashboard strip and confound analysis; QA personas (the fleet included) silently diverge from real-customer data shape | Write `'6-8'`; worth a sweep for other literals that bypass the option lists |

Minor notes, not ranked: skipped weeks (11–13 here) remain invisible by design —
the trends chart shows Week 9, 10, 14 as adjacent bars and the History ring
counts "DAY 5 OF 7" through a mostly-skipped stretch (10-25 flagged this as a
deliberate-decision-someday item; still true, and gap-week handling now also
decides what finding 6's label should say); `weekly_checkins` has no unique
(user, week_number) constraint, so a double submit from two tabs can store twins
(the streak walk then under-counts — it breaks on the duplicate); CheckinCard's
fallback numbering for legacy rows (`i + 1` on a newest-first list) numbers the
newest entry Week 1.

## Still open from prior nights (carry-forward)

- **Supabase actions (Alex, 15th night for the oldest):** PAYMENT_GATE_MIGRATION.sql,
  "Confirm email" ON, storage INSERT policy on `lab-results` (HIGH, blocks every
  lab file upload), INTAKE_DRAFT_MIGRATION.sql.
- **Lab-kit fulfillment ruling** (10-30 #1, HIGH family) — still unbacked.
- **11-04's seven findings** (slip-up card begging, second slip-up overwrite,
  slip data read by nothing, dead audit acknowledgment, day-14 milestone nag,
  drinks 0-vs-blank, unchecked symptom insert) — await approval; no deploy
  since Deploy 16.
- **Sentinel S5** (unchecked no_improvement insert) — awaiting approved fix.
- CONFOUND thresholds + verdictEngine.js physician review — flagged in-code;
  tonight's #1 is a point in favor of doing that review soon: the direction
  tables it would audit are exactly where the HIGH lived.

---

> **Resolved 2026-11-05 (Deploy 18, approved by Alex):** all seven findings
> implemented and deployed, plus Sentinel S5 (checked no_improvement insert)
> and the small-items sweep (double-submit guard + WEEKLY_UNIQUE_MIGRATION.sql,
> oldest-first legacy numbering, wine→Alcohol recall mapping, flat non-empty
> branch_responses, non-wrapping suspect-board dates, TIME MACHINE collapsed
> to a pill). #7 went deeper than the seeder literal: the confound engines'
> band maps never parsed the NUMERIC numpad values the live check-in writes,
> so sleep/hydration/drinks were invisible to Engines 1/2 for every current
> customer — the mappers are numeric-aware now and both seeders write
> app-shape values. Live verification (D18_*): intake label reads the comfort
> axis, a 5→9 digestive week renders as an improvement on the tile AND in the
> AI insight on the same screen (gas/reflux 5→9 correctly read as worsening
> beside it), "your protocol" wording live, TM pill collapsed. ALSO PINNED:
> the stray console 400 (open since 10-23) is the intake_draft write-behind
> 400ing on the missing column — INTAKE_DRAFT_MIGRATION.sql was never run, so
> intake's "progress saves as you go" is dead in production until it is.
> Still with Alex: DIGESTIVE_AXIS_MIGRATION.sql (set cutoff to Deploy 18
> time), WEEKLY_UNIQUE_MIGRATION.sql, the four older Supabase actions, the
> lab-kit ruling, and the MD review.
