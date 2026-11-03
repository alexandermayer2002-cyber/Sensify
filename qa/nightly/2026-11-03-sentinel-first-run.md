# Sentinel — First Run Report — 2026-11-03

The new **sentinel** layer ran for the first time: an RLS security prober, a
data-integrity sweep, and two whole-tree static scans. These are the three
checks the nightly walk/scout structurally *can't* do. This is what they found.

**Headline:** the security model holds — no customer can reach another
customer's health data (validated, not assumed). No impossible-state data in the
fleet. The static scans surfaced a real subset of findings in places the scout
never walks (admin surface, legal terms), plus a lot of expected noise.

---

## 1. RLS security boundary — PASS (control-validated)

The most important result, because the downside here is catastrophic rather
than annoying: this app is client-side Supabase, so row-level security *is* the
entire security model. A single missing policy would let any logged-in user read
everyone's health records and lab results.

Tested as a real signed-in customer (test account A) against a second customer
(test account B), across every user-scoped table:

| Probe | Tables | Result |
|---|---|---|
| Read B's rows directly (`?user_id=eq.B`) | all 13 | **denied / empty** |
| Broad unfiltered read (any foreign row leaks?) | all 13 | **own rows only** |
| Write into B's namespace (insert, then clean up) | meal_logs, symptom_logs, ask_sensify_messages, compliance_audit | **denied** |
| Read admin-only `paid_sessions` (buyer emails) | paid_sessions | **denied** |

13 user-scoped tables covered: profiles, lab_results, reintroduction_results,
reintro_daily_logs, daily_factors, daily_compliance, symptom_logs,
weekly_checkins, compliance_audit, food_map, meal_logs, ask_sensify_messages,
confound_observations.

**Why this PASS is trustworthy (not a broken probe):** a positive/negative
control confirmed the mechanism works — account A reads its *own* profile
(1 row), is denied B's profile (0 rows), and a broad `symptom_logs` read returns
0 rows. Own-access works, cross-access is blocked. The empty foreign results mean
RLS is enforcing, not that the probe silently errored.

Bottom line: **the one gap whose downside was a data breach is closed**, and now
it's checked every night.

## 2. Data integrity — PASS

Zero impossible states across all five fleet personas. The state machine holds
in the actual database rows:

- no protocol phase without a start date
- no declined track missing its `track_decision`
- every `food_map` verdict backed by a real verdicted cycle
- no approved lab sitting under a still-pending profile

This is the substrate beneath the UI. It's clean today; the check will catch the
day a write path starts producing a contradiction (which is how the
declined-limbo bug began).

## 3. Silent-write scan — 37 flagged, ~5 real

The scan swept the whole tree (src + netlify functions) in one pass. Most flags
are expected noise — the value is the handful in surfaces the scout never walks.

### Real / actionable

| # | Where | Severity | What |
|---|---|---|---|
| S1 | `AdminDashboard.js:415,418` — `respondToAudit` | MED | The admin's response to a customer's compliance-audit confession is unchecked — both the audit `update` and the "Reset clock" profile `update`. If either fails, the admin UI shows success (`setResponded`) but the customer's guidance / clock-reset never happened. This is the admin end of the 10-24 #1 guidance-loop finding. **Admin surface — never in the scout rotation.** |
| S2 | `MaintainHub.js:42` — `cancelOptIn` | MED | Canceling a Maintain reservation is unchecked, then the page reloads. If the write fails, the user sees themselves still opted-in after trying to cancel — billing-adjacent. |
| S3 | `LabResults.js:360` | LOW–MED | The lab row insert is checked, but the follow-on `profiles.program_phase = 'pending_review'` update is not. A partial failure leaves the lab submitted but the profile phase un-advanced (dashboard keeps saying "upload your lab"). |
| S4 | `Signup.js:53` | LOW | The signup-time profile upsert is unchecked; a failure leaves an account with no profile row (recoverable later via the now-checked intake upsert). |
| S5 | `Dashboard.js:965` | LOW | The auto no-improvement audit insert is unchecked; a failure silently skips the safety net (retries next dashboard load). |

### Expected noise (not bugs, but the scan flags them)

- `testMode.js` (×6) — test-only code.
- `WeeklyCheckin.js:458,459,472`, `confound_observations` insert — deliberately
  best-effort backfills *after* a checked primary write (Deploy 12).
- `IntakeSurvey.js:200` — the `intake_draft` write-behind mirror, best-effort by
  design (Deploy 14).
- `DailyCheckin.js` core — the main `daily_factors` upsert *is* checked; the
  flagged lines are secondary reintro-block writes.

**Takeaway:** the scan needs a small allowlist so the noise doesn't re-flag
nightly. The real signal is S1/S2 — both on surfaces (admin, Maintain) the
area-rotation rarely reaches, which is exactly the breadth this layer adds.

## 4. Copy-promise scan — 18 flagged, 2 real

Most hits are internal code comments about the physician-review gate (good —
those are honest internal flags, not user-facing claims).

### Real / user-facing

| # | Where | Severity | What |
|---|---|---|---|
| C1 | `public/terms.html:27` | MED | The legal Terms still say Sensify provides a "physician-reviewed elimination and reintroduction" program. We removed that exact claim from the Stripe line item in Deploy 14 because the engines are explicitly gated "until physician review." The claim is still live in the Terms. **Terms doc — never in the scout rotation.** |
| C2 | `Marketing.js:823` | LOW | "Upload your results, read instantly" — extraction takes ~10s, and uploads were failing entirely until today's fix. "Instantly" overstates it. |

### Resolved / fine (scan correctly re-surfaces for confirmation)

- `MaintainHub.js:47` "Ask Sensify, unlimited" — now backed (Deploy 14 exempts
  subscribers from the ask cap).
- `Login.js:115` "we'll send you a reset link" — backed (Supabase sends it).

---

## What this run proves about the layer

- It found things in **surfaces the scout never walks** — the admin dashboard
  (S1) and the legal Terms (C1) are not in the area rotation, and both carried
  real findings.
- It **validated security that was previously only assumed** — nobody had ever
  actually tried to read another account's data; now it's proven denied and
  checked nightly.
- The silent-write scan will need an **allowlist** before it stops re-flagging
  intentional best-effort writes; that's one triage pass, then it only flags
  new offenders.

## Awaiting Alex (unchanged + two new review items)

- Supabase: `PAYMENT_GATE_MIGRATION.sql`, "Confirm email", storage INSERT
  policy, `INTAKE_DRAFT_MIGRATION.sql`, lab-kit fulfillment ruling.
- New from this run, if you want them fixed: S1 (admin audit-response checks),
  S2 (Maintain opt-out check), C1 (Terms physician-reviewed claim). None are
  HIGH; none shipped tonight — report-only, your call.
