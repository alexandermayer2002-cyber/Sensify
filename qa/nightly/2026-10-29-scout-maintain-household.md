# Nightly Scout — Maintain + household card — 2026-10-29

Area 9 (day 29 mod 10) — first scout of this area. Walked the live site at 430px
after the suite finished, as +fable1 (day ~53 reintroduction, Dairy=Limit,
Gluten=Safe): Maintain tab preview with its live Map Health card, the household
share card (minted a link, read the public card logged-out, turned the link
off after), shots MNT9_*/MNT9B_*. Read src/pages/MaintainHub.js,
src/pages/HouseholdCard.js, src/components/MapHealth.js,
netlify/functions/{household-card,create-maintain-setup,verify-maintain-setup,activate-maintain}.js.
The full (post-completion) Maintain hub is unreachable by any test account —
no door sets program_phase='complete' — so MaintainHubInner findings are from
source, flagged accordingly.

**Regression context:** 50/54. All four FAILs are `fleet.elimlate.*` with ONE
root cause — a real regression, not noise (details + screenshot in tonight's
morning doc; summary below).

## Suite: the elimlate crash (not a scout item — it's tonight's headline)

`ReferenceError: ringCount is not defined` → full error boundary ("Something
went wrong.") on Home. Deploy 11 (ae880b9, 10-23) deleted
`const ringCount = Math.min(awayN, starCount)` while reworking away-night
rings but left one use at Dashboard.js:2239, inside the COMPLETE-constellation
branch — rendered only when `calculatedPhase==='elimination' && currentDay<=42
&& starCount>=28`. Latent six nights because no persona and no day-0 path
renders a complete constellation; tonight elimlate's cohort rotated and seeded
at exactly day 42 → first exercise since the deploy. Verified live as
+qafleetelimlatec2 (shot ELX_01): whole Home dead, daily check-in unreachable
(hence the day_logged/day_counter FAILs). **Any real customer on days 28–42
with 28 logged nights — the most compliant cohort, at the exact "pattern
detection unlocks" reward moment — has a dead dashboard and no check-in since
10-23.** One-line fix for Alex to approve: restore a ringCount definition
(e.g. `Math.min(awayN, 28)`) or drop the ringSet hollow-ring logic from the
complete branch.

## What's solid in tonight's area

The Maintain preview is the best-looking sell in the app and honest about
billing mechanics (setup-mode Stripe, $0 today, card saved not charged,
verify server-side by session id, activation admin-only and idempotent-ish).
Map Health's math is documented, thresholds named, exposure-honest, and its
"How this works" explainer is plain-language good. The public household card
leaks nothing it promises not to (token-only lookup, 404 on anything else,
first name only, no symptoms/scores). No overflow anywhere at 430px; zero
console errors on the whole walk. The findings are one bad filter, one copy
promise, and lifecycle gaps around completion — the state no test account can
reach, which is itself why they've survived.

## Ranked findings

| # | Tag | Sev | Finding | Fix |
|---|-----|-----|---------|-----|
| 1 | CHANGE | HIGH | Household card tells the cook a Limit/Avoid food is fine: `settled` = any verdict (household-card.js L85/L100), so ruled foods leave "Currently off the plate" — verified live: +fable1's own home shows "CURRENTLY AVOIDING · Dairy LIMIT" (shot MNT9_05) while the public card says "Nothing is off the plate right now" (shot MNT9_public_card). Dashboard's list (which claims to mirror this function) keeps Limit/Avoid listed — the two surfaces disagree on the same account, and the cook serves the trigger | Exclude only Safe verdicts; keep Limit/Avoid on the card (optionally labeled "limit"/"avoid" instead of implying elimination) |
| 2 | CHANGE | MED | ⚑ COPY PROMISE: "Ask Sensify, unlimited" is the #1 feature on the $12.99/mo reserve screen (shot MNT9B_01), but ai-proxy.js caps ask at ASK_DAILY_LIMIT=25/day with no maintain exemption — the paid pitch promises what the code forbids | Exempt (or raise) the cap when maintain_active, or say "generous daily allowance" |
| 3 | CHANGE | MED | The paid Maintain hub's Food Map reads only the legacy `food_map` table (MaintainHub.js L153) that ReintroTab's own comment calls best-effort ("verdicted food is complete whether the legacy food_map row landed or not") — a subscriber whose upsert ever failed silently gets "Your verdicts will appear here" on the product they pay for | Read reintroduction_results latest-cycle-per-food, as MapHealth and ReintroTab already do |
| 4 | CHANGE | MED | Drift detection goes permanently thin for the people paying for it: MIN_DATA_POINTS counts daily check-ins + symptom logs, but post-completion there IS no daily check-in and meals don't count — a healthy subscriber logging meals daily reads "Too little recent data… Log a few days" forever, with nothing loggable to fix it | Count meal_logs toward data richness; point the thin copy at meal logging |
| 5 | ADD | MED | At completion the household link becomes unmanageable: HouseholdShareCard renders only during elimination/reintroduction (Dashboard.js L2174), so a maintain user can't copy or turn off a live link — which (with #1) then shows "Nothing is off the plate" against a map full of Avoid verdicts | Render HouseholdShareCard in MaintainHubInner (it already takes session+profile) |
| 6 | CHANGE | MED | Silent-write family, 10th sighting: SymptomReport.save() never checks the insert result (supabase doesn't throw) → "Logged. Thanks for noting it." over lost data — and symptom logs are drift detection's only signal, so a failed write becomes a false "map is holding"; MaintainHubInner.load() likewise swallows read errors into empty arrays | The Deploy-12/13 checked-write pattern: confirm only on success, quiet inline retry |
| 7 | CHANGE | LOW | Every "Reserve Maintain" click mints a brand-new Stripe customer (create-maintain-setup L14) and verify overwrites stripe_customer_id — cancel/re-reserve orphans customers with saved cards at Stripe; "Cancel my reservation" clears the flag but detaches nothing | Reuse an existing stripe_customer_id; detach the payment method on cancel |

Minor notes, not ranked: Map Health prints the identical global rate line under
every food row ("0.0 events a week, was 0.0…" ×N, shot MNT9B_01) — looks
per-food, isn't; MaintainHubInner greets "Your Food Map is up to date"
unconditionally; marketing still says "$399 … Nothing else to buy" while this
tab sells $12.99/mo (optional, so borderline — Alex's call); fmtDate in
MaintainHub assumes `log_date`-style dates for symptom grouping but symptom
rows only have timestamps — groupByDate splits on the UTC date, so late-evening
US logs group under tomorrow's header.

## Still open from prior nights

10-21 #2 (run PAYMENT_GATE_MIGRATION.sql in Supabase) and 10-21 #3 (switch on
"Confirm email") — ninth night waiting on Alex. CONFOUND thresholds and
verdictEngine.js remain flagged in-code as physician-review items. Everything
through 10-28 is closed (Deploy 13 verified 54/54 last night); tonight's
elimlate crash is new (Deploy 11 latent) and is the one thing that should not
wait for the next scout cycle.
