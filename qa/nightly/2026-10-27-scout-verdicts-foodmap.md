# Nightly Scout — Verdicts / Food Map Tab + PDF Download — 2026-10-27

Area 7 (day 27 mod 10) — first scout of this area. Walked the live site at 430px
with a fresh test account (+qa261027fm7): signup → intake (Crab rated **Never**,
lab-flagged Low, to probe the never-exclusion) → manual lab (Cow Milk High, Wheat
Moderate, Egg Yolk Moderate, Crab Low) → Verdicts tab in all four eras: pre-lab
("A document, waiting."), elimination cover (example wall + countdown, day 20),
day-57 ghost queue, and the earned board (1 ruled → 3 trials of one food → 2 ruled
+ 1 live) → expanded day-records → the real PDF download (captured + text-extracted)
→ a blocked-chunk retry probe (12 shots, FM7_*). Read all of FoodMap.js,
foodMapPdf.js, and the picker/universe seams in ReintroTab.js + protocolEngine.js.
Built on 10-20…10-26; nothing repeated.

**Regression context:** 47/48 (regress_summary.json, stamp 2610270651). One FAIL:
`fleet.elimearly.walk` — a 9s goto timeout before the persona's day began, which
also truncated that persona's 6 invariant checks (hence 48, not 54). Re-ran the
elimearly persona alone right after: 7/7 green, so environmental noise, not a
regression — likely load contention, since the scout walk was (for the first
time) driving a second headless browser concurrently with the fleet. Note for
future nights: run the scout walk after the suite, not alongside it. The one
console 400 during the scout walk is the known harness login noise (closed 10-25).

## What's solid

This tab is the product's trophy case and it mostly earns the name. Verified live:
all four lifecycle states render honestly and nothing overflows at 430px (7
measurement points, all 430); the never-frequency exclusion is consistent across
the picker, the universe, and the count (Crab flagged-but-never correctly absent
everywhere, with the picker's honest "has nothing to teach a trial" note); the
trial strips are the best data-graphic in the product (phase by shape, outcome by
color, symptom marks oversized for colorblind legibility, absence rendered as
specks); the expanded record is honest provenance; and the PDF is a real vector
one-pager in brand fonts, lazy-loaded so the bundle doesn't pay for it. The
findings cluster in the PDF's evidence sentences and the retest seam.

## Ranked findings

| # | Tag | Sev | Finding | Fix |
|---|-----|-----|---------|-----|
| 1 | CHANGE | HIGH | ⚑ COPY PROMISE: the PDF's evidence line contradicts its own verdict for testimony-adjusted rulings — verified live: a clean-log Avoid (the disagreement path 10-26 verified live) prints "EGG YOLK / **Avoid.** / No reaction across 14 days" under a footer swearing "earned from this person's own logged data. Nothing was assumed." This is the one artifact a customer hands a doctor; evidenceLine() reads only the logs and ignores verdict/answers (foodMapPdf.js:37–55) | Branch the line when `answers.accuracy !== 'accurate'` or the ruling was testimony-adjusted: "Logs alone leaned Safe; ruled Avoid with their account of the two weeks" (verdict_reason already holds the honest sentence) |
| 2 | CHANGE | HIGH | Retest history bleeds across trials: logsFor() matches by food name only (FoodMap.js:68), so a retested food's expanded record merges every trial into one list (verified live: 28 rows from 3 trials under one card) and the PDF's evidence line mixes trials — printed "Reacted on 5 of 9 exposure days" for a Limit verdict whose own analysis says 1 of 3; "9 exposure days" also contradicts the PDF's "a 14 day single-food trial" claim | Filter logs by `reintro_id` (the column exists — the strip already has to dodge this bug by keying on the cycle's own 14 dates) |
| 3 | CHANGE | MED | "COW MILK **3TH TRIAL**" — the ordinal is `trials === 2 ? '2ND' : trials + 'TH'` (FoodMap.js:161), so every third retest badge is misspelled on the trophy-case tab (verified live, screenshot FM7_08) | A 3-line ordinal helper (3RD, and 21ST-class correctness for free) |
| 4 | CHANGE | MED | Both failure paths on this tab are silent (8th sighting of the silent-failure family): the data load's `catch (e) {}` renders a confident "0 / 3 RULED · EARNED" board when the fetch fails — a customer's earned verdicts shown as nothing, no error, no retry — and the PDF's `catch (e) {}` swallows everything (verified live with the chunk blocked: button returns to rest, no message) | An inline "Couldn't load your verdicts — retry" state on load failure; a one-line "Download didn't start — try again" under the button |
| 5 | CHANGE | MED | The PDF's "NOT YET TESTED" list includes the food currently on trial (printed "Wheat" while Wheat was live on day 1), and the header's "EARNED FROM 77 DAYS OF TESTING" counts calendar days since protocol start — 56 of those were elimination, 14 were trials | Split "On trial now" out of untested; count tested days (sum of trial days or `days since day 57`) or say "DAY 77 OF THE PROGRAM" |
| 6 | CHANGE | LOW | The ruled card's day stamp assumes every verdict landed on day 14: `ruledDay = start + 13` (FoodMap.js:153) — a severe stop on day 2 (auto-Avoid) or a floating-cap extension stamps a day the trial never reached; same family as the 14-dot mislabel noted 10-26 | Stamp from `submitted_at`/`updated_at` when present, else start+13 |
| 7 | DELETE | LOW | Dead weight in FoodMap.js: six style keys from the retired row layout (s.row, s.food, s.trialTag, s.verdict, s.verdictWord, s.ghostTag — zero usages) plus a local FREQ_RANK (line 16) that nothing reads (ordering goes through getTestingOrder's own copy) | Delete them before the next editor trusts the wrong one |

Minor notes, not ranked: the day-57 state's ghost cards ("Next.") aren't tappable
and nothing on the tab names the Reintro tab as the place to start — a small
dead-end for the exact moment the user is most ready to act; the Egg Yolk Avoid
card's all-green strip is technically honest for a testimony-adjusted ruling but
reads as a contradiction until the record is expanded (verdict_reason explains it
— #1's PDF fix pattern would suit the card too, someday).

## Still open from prior nights

10-21 #2 (run PAYMENT_GATE_MIGRATION.sql in Supabase) and 10-21 #3 (switch on
"Confirm email") still wait on Alex — six nights open. All 21 findings from
10-24/10-25/10-26 await approval (no deploy since Deploy 11 on 10-23). Tonight's
#4 is the 8th sighting of the silent-failure family and #1 the 8th of the
copy-promise family — and #1 is the first time a contradiction ships on a
document that leaves the product. The 10-26 #1 severe-off-ramp safety finding
remains the most urgent open item overall. One approved batch across the
silent-write family (10-24 #3, 10-25 #1, 10-26 #2, tonight's #4) could close
four nights' findings together.
