# Nightly Scout — Reintro Tab + Cycle Flow + Verdict Survey — 2026-10-26

Area 6 (day 26 mod 10). Walked the live site at 430px with a fresh test account
(+qa261026sc6): signup → intake → manual lab (Cow Milk High, Wheat Moderate, Crab
Low) → skip to day 57 → day-57 ceremony + picker → start sheet (today/tomorrow/
date-strip + far-pick confirm) → cycle day 1 (briefing, timeline, instruction) →
exposure check-in → own-row REST time-machine to day 14 → verdict survey with the
full disagreement path ("felt worse" → 3 follow-ups → conflicted Avoid) → retest
offer + Tested ledger, screenshotting each state (18 shots, SC6_*). Read all of
ReintroTab.js, ReintroDailyCheckin.js, ReintroductionSurvey.js, verdictEngine.js,
DailyCheckin.js reintro block, Dashboard.js reintro wiring. Built on 10-20…10-25;
nothing repeated.

**Regression context:** see regress_summary.json (stamp 2610260652). The one
console 400 during the scout walk is the known harness login noise (closed 10-25).

## What's solid

The shape of this area is the product's spine and most of it holds. Verified live:
no screen in the whole flow overflows at 430px (13 measurement points, all 430);
the day-57 ceremony → frequency-ordered picker → "Verdict by ~date" projections are
correct (Nov 9 / Nov 23 / Dec 7 for ranks 1–3); the start sheet's today/tomorrow/
date-strip with the far-pick confirm ("That is a while away. Your elimination holds
until then") is honest scheduling done well; the CycleSummary stays factual
mid-cycle exactly as its comment promises; and the disagreement path is the best
piece of epistemics in the product — live tonight, 1 mild logged day + "felt
worse, it was the food" produced a one-step Limit→Avoid with a genuinely excellent
written analysis, the "Ruled on conflicting evidence" card, and a working retest
offer. The findings are the safety off-ramp, the write path, and copy that
contradicts the engine.

## Ranked findings

| # | Tag | Sev | Finding | Fix |
|---|-----|-----|---------|-----|
| 1 | CHANGE | HIGH | ⚑ COPY PROMISE: the severe-reaction off-ramp is unreachable. The real check-in (embedded in DailyCheckin) answers a severe symptom with "You can stop this cycle from the Reintro tab and {food} will be marked Avoid" (DailyCheckin.js:499) — but no stop control exists on any reachable screen: the stop lives only in ReintroDailyCheckin.js + handleStopCycle, a path Dashboard never renders (it always passes onOpenDailyCheckin). Worse, a severe user who rightly stops eating mid-exposure hits the 5-day restart notice, which invites re-exposure and `handleRestartCycle` DELETES every log including the severe record ("Nothing you logged counts against you" — literally) | Wire a real "Stop this cycle" action (severe banner and/or active card) to the existing handleStopCycle logic; make the restart gate check for a logged severe day first and route to Avoid instead of re-exposure |
| 2 | CHANGE | HIGH | Verdict writes are unchecked and run after the slow AI call (ReintroductionSurvey.js:238–261): a failed update still shows the full verdict screen, leaves the cycle verdict-null ("Day 14 · Verdict ready" forever) while food_map may already carry the verdict — 7th sighting of the silent-write family (10-21 #5, 10-22 #5, 10-24 #3, 10-25 #1); profile-clear and food_map upsert equally unchecked, so partial failures strand mixed state | Write the verdict row first with an error check + retry UI; the AI analysis is cosmetic — backfill verdict_reason after; check the other two writes |
| 3 | CHANGE | MED | The live EvidenceNeedle and the verdict engine disagree systematically: the needle maps 2 symptom days or 1 moderate day to mid-Limit (55%), while computeProvisionalVerdict rules those same facts Avoid (avoidSymptomDayCount=2; moderateCount≥2 counts symptom *instances*, so one bad day with 2 moderate symptoms is Avoid). A user can watch the needle hold Limit for two weeks and then be ruled Avoid — "a reading, not a ruling" excuses noise, not a different brain | Position the needle from computeProvisionalVerdict's output (verdict → zone), so reading and ruling share one engine |
| 4 | CHANGE | MED | Avoid's canned verdict copy lies when testimony earned the verdict — verified live tonight: 1 mild day + "felt worse" produced "A clear, repeatable symptom pattern was detected" + a SYMPTOMS CONFIRMED badge directly above an analysis paragraph explaining the logs alone supported Limit. Honest-copy-on-dishonest-arithmetic family (10-24 #5, 10-25 #4) | Choose sub-copy by path: data-ruled vs testimony-adjusted ("Your logs leaned Limit; your account of the two weeks moved it to Avoid") |
| 5 | CHANGE | MED | TierEscalation's "Test the full panel →" silently restarts the whole program: escalate() sets protocol_start_date=tomorrow + program_phase=elimination (ReintroTab.js:109–123), locking reintro for ~56 fresh days — the card promises "test more of the common culprits" and never mentions 8 more weeks of elimination, with no confirm step | Say it on the card and add a confirm ("This restarts elimination: ~8 weeks before the new foods unlock"), or design a shorter re-elimination for escalators |
| 6 | CHANGE | MED | The outcome score — the "one number the whole program was for" — can be silently lost: OutcomeQuestion.save ignores the update result and shows "Recorded. Thank you for the honest number" regardless (ReintroTab.js:232–244); the read-merge-write on shown_milestones can also clobber a concurrent milestone write | Check the error and keep the scale on screen with a retry on failure; merge targeted keys |
| 7 | DELETE | LOW | ReintroDailyCheckin.js (241 lines) is dead code — only rendered when ReintroTab gets no onOpenDailyCheckin, which Dashboard always passes — along with handleDailyComplete/handleStopCycle/showDailyCheckin and the computed-never-read skippedSoFar/totalPlannedDays pair; the dead file is where the only severe off-ramp lives, which is how #1 happened | Delete it after #1 re-homes the stop logic; a half-dead duplicate check-in is a trap for the next editor (10-21 #4 family) |

Minor notes, not ranked: the active-card timeline labels wrap badly at 430px
("EXPOSURE (DAYS 1 TO 3)" breaks onto three lines, screenshot SC6_07); the fixed
14-dot timeline and "Day N of 14" mislabel when skips float the schedule (the
floating-cap design extends the cycle but the display never does); the phase badge
flips to "Washout: avoid this food" the same day the user just logged eating
exposure 3; the survey's `food` prop falls back to a hardcoded 'Eggs' if the
profile pointer is stale (Dashboard.js:1218).

## Still open from prior nights

10-21 #2 (run PAYMENT_GATE_MIGRATION.sql in Supabase) and 10-21 #3 (switch on
"Confirm email") still wait on Alex — five nights open. All seven 10-24 and all
seven 10-25 findings await approval (no deploy since Deploy 11 on 10-23); tonight's
#2 deepens the same silent-write family and #4 the dishonest-copy family, so one
approved batch could close 10-24 #1/#3, 10-25 #1/#2, and tonight's #2 together.
The 10-23 promises-sweep recommendation stands — tonight's #1 is the 7th promise
sighting and the first with a safety edge. CONFOUND thresholds remain flagged
in-code as physician-review items; verdictEngine.js carries the same "NOT a
clinical standard until reviewed" banner and tonight's #3 shows the shadow copy of
those thresholds already drifting.
