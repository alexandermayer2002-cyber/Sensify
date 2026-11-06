# Sensify Nightly — 2026-11-06 — Protocol Critique (method, not UI)

Charter: scour the elimination/reintroduction METHOD as a physician reviewer will.
Report-only. Severity: DEFENSIBILITY / HONESTY / SAFETY / TUNING per the brief.

---

## Ranked findings

### 1 · SAFETY — Nothing screens anyone out before the program tells them to eat a food

**Where:** `src/pages/IntakeSurvey.js` (absent), `src/utils/protocolEngine.js:52-61` (COMMON_TIER_2 includes Tree nuts, Eggs, Soy), `src/pages/ReintroTab.js:1163` ("Eat {food} today as you normally would").

The intake asks about symptoms, lifestyle, and food frequency — nowhere does it ask about **diagnosed IgE allergy or anaphylaxis history, pregnancy, breastfeeding, age, or disordered-eating history**. The common track then puts tree nuts, eggs and soy — the classic anaphylaxis foods — in front of a user whose only qualification is "clean panel + symptoms," and the exposure instruction is an unconditional "eat it today." The only anaphylaxis-shaped warning (difficulty breathing, throat tightening, swelling) lives inside an **AI-generated briefing** (`aiInsights.js:273`) that can fail, be skipped, or render unparsed. A broad multi-food elimination is also exactly the intervention contraindicated for restriction-prone users, and nothing in the funnel even gestures at that population.

**Fix:** a hard, static (non-AI) intake gate: diagnosed food allergy / past anaphylaxis → that food is permanently excluded and the user told why; pregnancy, under-18, ED history → do-not-offer or physician-letter path. Plus a static red-flag card (breathing/throat/swelling → emergency care, not the app) pinned to every exposure day. **Physician question:** which conditions are decline-outright vs proceed-with-letter.

### 2 · DEFENSIBILITY — The washout-flare rule makes "Avoid" the default outcome for anyone with background symptoms

**Where:** `src/utils/verdictEngine.js:75-85` (the escalation), comment at `verdictEngine.js:26-27`.

The comment promises escalation for washout symptoms "that match the food." The code checks **nothing**: any `had_symptoms` day in 11 washout days blocks Safe and bumps Limit→Avoid. So: 3 clean exposure days + one mild headache on washout day 9 = **Avoid** (AI can pull back one level, so Limit at best — Safe is unreachable). The product itself computes a clean-baseline noise floor (`ReintroductionSurvey.js:160-167`, surfaced as "~N symptom days a week"); at the typical ~1 day/week the chance of ≥1 symptom day in an 11-day washout is roughly 80% **by base rate alone**. The engine's verdicts are therefore dominated by noise for the very customers the product targets, and the noise floor it measures is handed to the AI as prose instead of being used by the rule that decides. This is the generalization of the known worry (1 mild exposure day + 1 washout flare → Avoid): the washout arm alone does it.

**Fix:** escalate only for washout symptoms within ~72h of the last exposure, at moderate+ intensity, or matching the exposure-day symptom set; compare washout symptom-day rate against the computed noise floor **in code**. **Physician question:** what delayed-reaction window is defensible (the literature cited for food intolerance is hours-to-~72h, not 11 days).

### 3 · SAFETY — "Severe always = Avoid" is enforced by prompt, not by code

**Where:** `src/utils/verdictEngine.js:104-116` (`applyAiAdjustment`), `src/pages/ReintroductionSurvey.js:261-265`, prompt rule at `aiInsights.js:512`.

The rule engine returns Avoid on any severe day, but `applyAiAdjustment` knows nothing about `hasSevere`: if the model returns "Limit," the final verdict becomes Limit — one level off a severe reaction, blocked only by an instruction inside the prompt. The one invariant the whole engine is advertised on ("Avoid, full stop") is the one invariant the clamp doesn't actually hold.

**Fix:** three lines — if `provisional.signals.hasSevere`, skip the AI adjustment entirely (keep the AI's analysis text if you like).

### 4 · HONESTY — The verdict and marketing language claims certainty the design cannot produce

**Where:** `src/pages/ReintroductionSurvey.js:63,72,81` (VERDICT_CONFIG subs), `:362` ("SYMPTOMS CONFIRMED"), `src/pages/Marketing.js:288/765` ("by the end you know **for certain** what your body does and does not tolerate… Sensify **confirms the truth**"), `:535` ("Nothing is assumed").

- Avoid: "A **clear, repeatable** symptom pattern was detected" — ships on verdicts earned by **one** symptom day (finding 2), one severe day, or two moderate symptom entries in a single day. "Repeatable" requires ≥2 independent symptomatic exposures; the engine doesn't.
- Limit: "Mild or **dose-dependent** symptoms detected" — dose-dependence is never tested; dose is a free-text aside the AI may mention.
- "Know for certain" from a single, unblinded, n-of-1 open trial with no placebo and no repeat is not a hedge problem, it's a category error.

**Fix:** per-provenance sub-copy exists already for the testimony path (`:345-352`) — extend it: Avoid earned on one day says "a reaction on your record was strong enough that we don't ask you to repeat it," not "repeatable pattern." Marketing: "for certain" → "with real evidence from your own body" (a phrase the site already uses honestly elsewhere).

### 5 · DEFENSIBILITY — The EvidenceNeedle violates the protocol's own blinding principle

**Where:** `src/pages/ReintroTab.js:498-587` (needle), vs the principle stated at `:403-405` ("mid-cycle interpretation would bias the user's daily reporting and corrupt the data the verdict depends on").

CycleSummary is kept rigorously factual for exactly the right reason — and then the needle, on the same screen, renders a live Safe/Limit/Avoid verdict every day of the cycle and captions each log "moved toward Avoid." A user who sees the needle in Limit on day 2 knows what tomorrow's symptom entry will do to it. The design is already open-label (unavoidable); this adds a feedback loop on top of the expectancy effect, during the window where the data is being created. The AI "WATCH FOR" briefing (`aiInsights.js:271`) further primes specific symptoms at cycle start, though it is at least framed as observe-and-log.

**Fix:** remove the needle during active cycles (keep the factual CycleSummary), or show it only after the final log is in. **Physician question:** whether symptom-priming in the briefing should be replaced by an open-ended daily prompt.

### 6 · DEFENSIBILITY — What 3 exposures + 1 cycle can statistically distinguish (and the moderateCount bug)

**Where:** `src/utils/verdictEngine.js:69,77`.

Three exposure days, binary symptom flags, one cycle per food can distinguish "reacts dramatically every time" from "never reacts" — nothing in between. The 2-of-3 threshold is a reasonable heuristic for the first, but against a 1-day/week noise floor, 2-of-3 by chance alone is ~5-6% per food — across an 8-food panel, ~1 in 3 users gets a chance Avoid. Separately, `moderateCount` counts symptom **objects**, not days: one bad afternoon logged as "bloating/moderate + gas/moderate" → `moderateCount = 2` → straight to Avoid, bypassing the 2-day consistency requirement entirely.

**Fix:** count moderate **days** (`new Set(...)` by log_date); before writing a non-severe Avoid, offer a confirmatory second cycle — one repeat is the cheapest honest upgrade from anecdote to pattern, and the retest machinery already exists.

### 7 · TUNING — The numbers that need a citation or a dataset before a physician signs

**Where:** `protocolEngine.js:23,103-107`, `ReintroTab.js:845-847`, `verdictEngine.js:14-31`.

| Number | Value | Status |
|---|---|---|
| Elimination length | 56 days | Longer than typical elimination guidance (2-6 wks for FODMAP-style; 6-8 wks is EoE/6-food territory). Defensible only with a stated rationale; costs adherence. |
| Exposure days | 3 | Matches FODMAP-style rechallenge convention. The most defensible number here. |
| Washout | 11 days | No cited basis; longer washout = more noise days feeding finding 2. 3-7 days is the common rechallenge spacing. |
| Away gate | 4 / 14 days | Self-declared "not a clinical standard." Reasonable UX; needs sign-off as policy, not clinical fact. |
| Exposure calendar cap | 5 days | Arbitrary but harmless; restart preserves honesty. |
| avoidSymptomDayCount | 2 of 3 | Principled consistency requirement — keep. |
| Day-57 unlock, 14-day cycle | derived | Fine once the above are. |

Every one is flagged "NOT a clinical standard until reviewed" in comments — good — see finding 8 for the catch.

### 8 · HONESTY — The safety gates were flipped on before the review the comments promise

**Where:** `src/utils/protocolEngine.js:6-12` (COMMON_TRACK_ENABLED: "must not go live to real users until the medical advisor has signed off… Flip to true only after sign-off." — **it is true**), `src/utils/confoundAnalysis.js:30-31,39` ("ENABLED is false until a physician reviews bands…" — **CONFOUND_ENABLED = true**, flipped 8/27 "on Alex's word; thresholds remain MD-review items").

The code's own safety documentation now misstates reality in two places. Whatever the business call was, the comments must tell the truth, and the physician review must know these shipped un-reviewed — they are the two subsystems (broad elimination without lab justification; lifestyle observations to users) with the most clinical surface.

**Fix:** update both comments to state the actual approval history; put both at the top of the physician agenda.

### 9 · DEFENSIBILITY — The engine's temperament is heavily false-positive, and that mismatches the product's posture

**Where:** `verdictEngine.js:75` (Safe requires 14 fully clean days), `ReintroTab.js:787-792` (retest only for `conflicted` verdicts).

Safe demands zero symptom days across all 14; for the symptomatic customers the product sells to, Safe is nearly unreachable and Limit/Avoid accumulate. For a severe-reaction gate, false-positive bias is the right call. For mild/ambiguous evidence it means the program systematically **grows restriction lists** — the opposite of the "saves you from years of cutting things out for nothing" promise (Marketing.js:729), and actively harmful to restriction-prone users (finding 1). Worse, the only self-serve retest path requires the user to have *disputed their own logs*; a noise-driven Avoid with accurate testimony has no retest door except Support.

**Fix:** let a clean washout + noise-floor-consistent single mild day resolve Safe-with-note; offer retest on any non-severe Avoid/Limit earned from ≤1 symptom day. **Physician question:** the intended operating point — what false-positive rate on "Avoid" is acceptable for a wellness product.

### 10 · HONESTY — "A food never gets blamed for what your sleep did" overstates the confound layer

**Where:** `src/pages/Marketing.js:290`, vs `confoundAnalysis.js:28` ("SURFACE-ONLY… never adjusts a verdict") and `ReintroductionSurvey.js:255-258`.

The confound engines by design never touch a verdict; the sleep/cycle cross-refs reach the ruling only as prose context to an AI capped at ±1 level, and the rule engine that sets the provisional verdict ignores sleep entirely. "Spots when a bad week lines up with bad sleep… and brings that context into every verdict" is roughly true; "a food **never** gets blamed for what your sleep did" is a guarantee no part of the system makes.

**Fix:** soften to "…and weighs that context in your verdicts." One sentence.

### 11 · TUNING — Confound engines: well-gated, mostly say-too-little, three loose screws

**Where:** `src/utils/confoundAnalysis.js:43-73,241-262`.

The layer errs correctly toward silence: 4-week minimum, 2 repeats, bad-direction-only, one observation max, correlational-only phrasing with hard rules — this is the most reviewer-ready part of the protocol. Three items for the MD and one for data: (a) Engine 3 gates on `profile?.gender !== 'female'` — a string literal that silently excludes anyone whose field says otherwise while cycling; (b) `cycleMinPeriodDays: 1` makes any week containing a single logged period day a "period week"; (c) Engine 1's alcohol flag fires from stated intake alone (confidence 'stated') — a standing note earned at intake, before any lived data; (d) the divergence thresholds (1.5h sleep, 2 bands) are guesses until run against real logging variance.

### 12 · SAFETY — A verdict can be issued with zero logged evidence

**Where:** `src/pages/ReintroductionSurvey.js:216-217` (`computedVerdict = provisional ? … : 'Limit'`), plus the AI may move that default ±1 on testimony alone.

A cycle with no daily logs still reaches the survey and gets a verdict — defaulting Limit, adjustable to Safe or Avoid by the model from survey answers. Every piece of product language says verdicts are "earned from your own body's evidence" (Marketing.js:1152); this path mints one from an unverifiable recollection. Low frequency, high embarrassment in front of a reviewer.

**Fix:** no logs → no verdict; route to restart-or-abandon, or write it with an explicit `provenance: 'testimony-only'` flag and matching copy.

---

## What is genuinely sound here

Credit where it is due, and there is real credit:

- **The core method is the right one.** Elimination-then-single-food-reintroduction is the clinically accepted way to establish food intolerance; the product is honest that "the protocol is the product, not the test."
- **The IgG framing is better than the entire industry it sits in.** "A hypothesis… measures exposure, not reaction… the real evidence comes from the protocol" (Marketing.js:300,938-939) is the correct mainstream critique, stated on the sales page. The common track for clean panels, and the decline track ("there may be nothing for a full protocol to work on," trackRecommendation.js:127-135), turn down revenue for honesty.
- **One food at a time, everything else held eliminated**, with a deterministic, explainable testing order the user can override.
- **The severe off-ramp is thoughtfully built**: severe day → loud card, stop-to-Avoid, logs preserved; the restart gate explicitly refuses to re-expose after a severe day and never deletes the record (ReintroTab.js:762-779).
- **The AI is caged**: ±1 level, no Safe↔Avoid leap, code-enforced (finding 3's severe gap aside); no dose advice, no diagnosis, no prediction — the prompt rules read like someone thought hard about failure modes.
- **Provenance is first-class**: the Tested ledger shows how every verdict was earned, day by day; conflicted verdicts are labeled and retestable; "ruled with your account" verdicts get different copy than log-earned ones.
- **"Food was never the problem" is treated as a success**, in copy and in the outcome question that accepts 0/10.
- The **noise floor, sleep, and cycle cross-refs** are the right ideas — they just need to live in the rule engine, not only in prose.

## Agenda for the physician reviewer, in order

1. **Exposure safety**: contraindication screening (allergy/anaphylaxis, pregnancy, ED history, minors) and whether tree nuts/eggs/soy belong in an unscreened common track at all (finding 1).
2. **The washout rule**: defensible delayed-reaction window, symptom-matching requirement, and use of the noise floor in code (findings 2, 9).
3. **VERDICT_THRESHOLDS line by line** (verdictEngine.js:14-31) plus the moderate-days fix and a confirmatory-cycle policy for non-severe Avoids (finding 6).
4. **The timing table**: 56 / 3 / 11 / 4 / 14 / 5 — citation, rationale, or deliberate policy, each (finding 7).
5. **Severe-gate enforcement** moved from prompt to code (finding 3) and the no-logs verdict path (finding 12).
6. **Certainty language audit**: "for certain," "repeatable," "dose-dependent," "never gets blamed" (findings 4, 10).
7. **Confound layer sign-off**: bands, directions, Engine 3 gating, the already-flipped master gates and their comment corrections (findings 8, 11).
8. **Mid-cycle feedback**: the EvidenceNeedle and symptom-priming briefing vs reporting bias (finding 5).

*Counts: SAFETY 3 · DEFENSIBILITY 4 · HONESTY 3 · TUNING 2 — 12 findings.*
