# Nightly Scout — Weekly Check-in + Insights — 2026-10-25

Area 5 (day 25 mod 10). Walked the live site at 430px with a fresh test account
(+qa261025sc5): signup → intake → manual lab (Beef High, Wheat Moderate) → skip to
day 8 → full week-1 check-in (4 scales, Better, stress+sleep context, Fully, notes)
→ insight generation (6.7s) → confetti + streak card → dashboard insight card →
History tab (locked countdown + progress + expanded card) → skip to day 17 → late
amber state + week-2 badge. Read all of WeeklyCheckin.js, confoundAnalysis.js,
CheckinHistory.js (countdown/progress/card), Dashboard.js weekly wiring, aiClient.js.
Built on 10-20…10-24; nothing repeated.

**Regression context:** see regress_summary.json (stamp 2610250650). **The 3-night
stray console 400 is CLOSED as harness noise:** it is `signup_or_login`'s own failed
first sign-in on fresh accounts (Supabase `/auth/v1/token` → 400 invalid_credentials,
confirmed by response capture). It never appears on a valid login. Not a product bug;
no product console noise observed anywhere tonight.

## What's solid

The front of this area is the strongest AI surface in the product. Verified live:
the insight read every direction correctly (bloating 6→4 and gas 5→3 called as
drops of 33%/40%, digestive 5→6 called as a rise), hedged the stress/sleep context
without causal claims, used the free-text note intelligently, and came back in
6.7s with no em dashes. The success hero's biggest-change payoff, History's
direction-corrected "+23% better than baseline" (hand-checked: correct), the
"Where you started" baseline markers, the late amber "Catch up, your data still
matters" state, and week badges (1 at day 8, 2 at day 17) are all right. The
findings are clustered in the write path and the secondary clocks.

## Ranked findings

| # | Tag | Sev | Finding | Fix |
|---|-----|-----|---------|-----|
| 1 | CHANGE | HIGH | `weekly_checkins` insert runs AFTER the slow AI call, result unchecked, and "Back to dashboard" enables before the row is written — a failed insert still shows "This week is on the record" and the week's data is silently gone (family: 10-21 #5, 10-22 #5, 10-24 #3) | Insert first with an error check + retry UI, then generate the insight (it's cosmetic); keep the button disabled until the insert resolves |
| 2 | CHANGE | MED | ⚑ COPY PROMISE (6th sighting): the insight-failure screen says "Your insight will appear on your dashboard shortly" (WeeklyCheckin.js:568) but nothing ever retries or backfills — `ai_insight` persists as '' and `latest_insight` is untouched, so the promised insight never arrives | Say "Your scores are saved" only (and only once the insert truly succeeded), or regenerate on next dashboard load when `latest_insight_week` < last check-in week |
| 3 | CHANGE | MED | History's countdown runs on the wrong clock: `daysUntilNext` = submitted_at + 7d (CheckinHistory.js:421) while the real unlock is protocol-day windows (7k) — showed "T-MINUS 7D · DAY 0 OF 7" when the next window was 6 days out, and every late check-in pushes the promised date further past the actual unlock | Compute remaining from `protocol_start_date` window math (share the Dashboard's logic) |
| 4 | CHANGE | MED | Streak copy is keyed by week number, not by compliance history: six "Not at all" weeks then one "Fully" at week 7 earns "Seven weeks clean"; week 5 also claims "your AI insights are getting more accurate every check-in" (unbackable). Honest copy on dishonest arithmetic, family of 10-24 #5 | Gate "N weeks clean" on actual consecutive compliant check-ins, else neutral "Week N logged" copy; drop the accuracy claim |
| 5 | CHANGE | MED | Engine 2 confound divergence misaligns weeks: symptom weeks are bucketed by Monday of `submitted_at`, but a check-in describes the PRECEDING 7 days and windows land mid-week — worse-weeks land one bucket late vs the daily-factor weeks they describe, corrupting the only correlation engine that writes user-facing sleep/stress notes | Key each check-in to the Monday of the protocol week it covers, not of the submit date |
| 6 | CHANGE | LOW | `confound_observations.surfaced` is written `true` whenever an observation is OFFERED to the AI, but the prompt says "if it doesn't fit naturally, omit it entirely" — AdminDashboard then reads rows as surfaced that the user may never have seen | Store it as `offered`; only claim surfaced if the fragment text is detectable in the final insight, otherwise don't claim it |
| 7 | DELETE | LOW | 15 dead style entries in WeeklyCheckin.js (successCard/Icon/Title/Sub, insightCard/Tag/Text, statsRow/statCard/statVal/statLabel/statChange, loadingCard/spinner/loadingText — zero usages), leftovers of the pre-hero success screen | Delete them (and the now-orphaned spin keyframe if nothing else uses it) |

Minor notes, not ranked: "averaged across all 1 week" grammar in History's progress
card (clamp to "this first week"); the locked ring celebrates "DAY 0 OF 7" the moment
you submit (10-23 #5 zero family — fixing #3 should rephrase it); missed window weeks
vanish from the record by design (week numbering skips), which the trend/confound
engines inherit as silent gaps — worth a deliberate decision someday, not a bug today.

## Still open from prior nights

10-21 #2 (run PAYMENT_GATE_MIGRATION.sql in Supabase) and 10-21 #3 (switch on
"Confirm email") still wait on Alex — four nights open; both are one-click actions
only he can take. All seven 10-24 findings await approval (no deploy since Deploy 11
on 10-23); tonight's #1/#2 deepen the same silent-write + unkeepable-promise
families, so one approved batch could close 10-24 #1/#3 and tonight's #1/#2 together.
CONFOUND thresholds remain flagged in-code as physician-review items (gate flipped
8/27/26 on Alex's word). The 10-23 promises-sweep recommendation stands.

---

> **Resolved 2026-10-28 (Deploy 12, approved by Alex):** every finding in this
> report was implemented and deployed in one batch — all 28 open items across
> the 10-24/10-25/10-26/10-27 reports, including the severe off-ramp, the
> write-first pattern across every silent write, the PDF provenance lines, and
> the dashboard guidance card. Post-deploy suite: 54/54 (one environmental goto
> flake, retried green). One regression introduced and caught by the suite the
> same hour (ReintroTab crash from a dead-var removal) — hotfixed in 6325a07.
> Still with Alex: PAYMENT_GATE_MIGRATION.sql + Supabase "Confirm email".
