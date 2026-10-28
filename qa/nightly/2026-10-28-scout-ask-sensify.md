# Nightly Scout — Ask Sensify — 2026-10-28

Area 8 (day 28 mod 10) — first scout of this area. Walked the live site at 430px in
both of the surface's modes, after the suite finished (per the 10-27 note, never
alongside it): a fresh protocol account (+qa2610288ask, Cow Milk High + Wheat
Moderate, skipped to day 20 mid-elimination) through the empty state, a specific-dish
verdict, a restaurant guide, and a meal log; then the fleet tracking persona
(+qafleettrackingc0) through observation mode — empty state, a meal log, and a
verdict probe (10 shots, ASK8_*/ASK8T_*). Read all of src/pages/AskSensify.js,
src/utils/askSensify.js, netlify/functions/ai-proxy.js, src/utils/aiClient.js, plus
the Dashboard lock gate and TrackingLanding's Ask buttons. Built on 10-20…10-27
(r2_ask.py covered maintain-phase happy paths on 10-18; nothing repeated).

**Regression context:** 54/54 (regress_summary.json, tonight). Zero FAIL lines —
Deploy 12 + hotfix holding on every path and persona. The one console 400 during
the scout walk is the known harness login noise (closed 10-25).

## What's solid

The protocol-mode conversations are the best AI output in the product, live tonight:
pasta correctly ruled off the plate mid-elimination with honest swaps ("double-check
the box says gluten-free"), the Italian-restaurant guide led with best bets and
caught the risotto-finished-with-butter trap, the meal log caught cheddar as dairy
with warm, specific copy, and observation mode refused a "can I eat X" verdict
exactly as designed, pitching tracking instead. The Safe/Skip/Ask guide rows and
log-confirmation cards render cleanly, nothing overflows at 430px (430 at every
measurement point), the tab is correctly locked pre-results with the best upsell
screen in the app, and the proxy keeps the key server-side behind real auth. The
findings cluster in one file the Deploy 12 sweep didn't touch — and one mode that
has plainly never been walked.

## Ranked findings

| # | Tag | Sev | Finding | Fix |
|---|-----|-----|---------|-----|
| 1 | CHANGE | HIGH | ⚑ COPY PROMISE: observation-mode meal logging is broken — every "I ate X" from a tracking customer returns "Sorry, I had trouble with that" and logs nothing (verified live: meal_logs 0 rows before and after; reply generated, billed, then discarded). askSensify() returns no `mapContext` in observation mode; send() passes `undefined` into saveMealLog, whose classifyFood dereferences `mapContext.avoid` → TypeError before the insert. TrackingLanding's two headline buttons ("Log a meal with Ask Sensify") both funnel into this | Return `mapContext: {safe:[],limit:[],avoid:[]}` from the observation branch (or skip classification when absent) — one line; then retest the TrackingLanding path |
| 2 | CHANGE | MED | 9th sighting of the silent-write family, in the one file Deploy 12's write-first sweep missed: saveMealLog and saveMessage swallow every failure (`catch(e){}`, `result.error` never read) and the UI prints "Added to today's log" regardless — a failed insert is confident success copy over lost data | Check the insert result; show the log-confirm card only on success, with a quiet inline retry (the Deploy 12 pattern) |
| 3 | CHANGE | MED | An eliminated food's verdict chip says **Avoid** — live tonight, "Can I eat pasta?" mid-elimination rendered the red Avoid chip (shot ASK8_03) while the reply correctly said "off your plate until you run its trial." Everywhere else in the product Avoid means tested-and-confirmed; the prompt's own HOLD label exists for exactly this state, and the model skipped it | Pin it in the prompt (one example: eliminated food → verdict=HOLD, never AVOID) and map unexpected labels on eliminated-list flags to HOLD client-side |
| 4 | CHANGE | MED | Logged trigger foods are stored unflagged mid-elimination: classifyFood checks only the verdict lists, which are empty for all 8 elimination weeks, so tonight's cheddar — which the reply itself flagged as eliminated dairy — landed as `mapStatus: "unknown", flagged: false` (row verified via REST). Weekly-recall leads and MapHealth later read these as clean rows | Classify against notYetTested too (`mapStatus: 'eliminated'`, flagged true) — the context already computes the list |
| 5 | CHANGE | MED | ⚑ COPY PROMISE: the pattern-noticing pitch is structurally unkeepable — TrackingLanding sells "Ask Sensify can help you notice patterns over time" and the observation prompt orders "reflect back what they have told you," but the model only ever sees the last 12 messages of the current session: meal_logs are never read back into any Ask context, and loadHistory feeds the UI, not the prompt. Three weeks of logging still earns "we don't have enough logged yet" | Feed a compact digest of recent meal_logs (and symptom mentions) into the observation context; cheap and makes the pitch true |
| 6 | CHANGE | MED | The photo path missed Deploy 10's image hardening (the lab-upload sibling): HEIC — the iPhone default — passes the `image/*` check and dies at the API; a legal 5MB file breaches the ~6MB function body cap once base64 adds 33%; and `capture="environment"` forces the camera on phones, so a saved screenshot of a menu can't be picked at all. Every failure is the same generic sorry, on the surface whose label-reading is the safety feature | Reuse the lab flow's canvas downscale/re-encode to JPEG, drop `capture`, say why when it fails |
| 7 | CHANGE | LOW | ⚑ COPY PROMISE (mild): the header pulses "READING YOUR VERDICTS · LIVE" for tracking users, who can never have verdicts (shot ASK8T_01), and for day-20 eliminators who have none yet; the footer disclaimer makes the same claim. Small, but it is the first line of the surface and it is false for whole cohorts | Phase-aware status line ("READING YOUR MAP · LIVE" / "TRACKING MODE") — the component already knows observationMode |

Minor notes, not ranked: the tab opens blank for ~3s (five sequential awaits, no
loading state — measured 3.3s on a warm run; Promise.all plus a shimmer would fix
both); loadHistory takes the OLDEST 30 messages (`ascending` + `limit(30)`), so
after a month "View earlier conversation" shows week-one chat forever — order
descending and reverse; the ask rate limit compares against the all-features
counter (a heavy AI day eats the Ask quota and mislabels the error) and `feature`
is client-declared, so the strict limit binds only honest clients; SYSTEM_PROMPT
still opens "The user has completed a food sensitivity program," which the context
block then contradicts for mid-protocol users.

## Still open from prior nights

10-21 #2 (run PAYMENT_GATE_MIGRATION.sql in Supabase) and 10-21 #3 (switch on
"Confirm email") still wait on Alex — seven nights open; both are one-click actions
only he can take. Everything from 10-24 through 10-27 closed this morning in
Deploy 12 + the 6325a07 hotfix (verified 54/54 post-deploy, and again tonight).
Tonight's #2 extends the silent-write family into its 9th sighting and #5/#7 the
copy-promise family into its 9th and 10th — all three in askSensify.js/AskSensify.js,
the one surface the sweep didn't touch. CONFOUND thresholds and verdictEngine.js
remain flagged in-code as physician-review items.

---

> **Resolved 2026-10-28 (Deploy 13, approved by Alex):** all seven findings
> closed, with #1/#4/#5 built out as one design rather than patched —
> observation mode now returns a complete map context (logging works, verified
> live: meal row landed in meal_logs), classification knows 'eliminated', and
> every observation turn carries a 30-day digest of the user's own meal and
> symptom logs, so pattern-reflection is real (verified live: the assistant
> named the just-logged foods back, no invented verdicts). Meal/message saves
> checked with inline retry (#2), AVOID reserved for confirmed verdicts with a
> HOLD remap + gold styling (#3), photo path hardened like the lab flow (#6),
> phase-aware status/disclaimer (#7), plus the load-speed, history-ordering
> and prompt-opener minors. Post-deploy suite: 54/54. Remaining for Alex:
> the two Supabase actions (payment-gate SQL, Confirm email) — eighth night.
