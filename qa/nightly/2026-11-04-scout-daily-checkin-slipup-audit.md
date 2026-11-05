# Nightly Scout — Daily Check-in + Slip-up/Audit Flows — 2026-11-04

Area 4 (day 4 mod 10) — second pass; first was 10-24, whose seven findings all
verified fixed tonight in code AND live (guidance card renders, honest slip-up
provenance, write-first on both confessions with retry screens, limit(1) pending
lookup, adjacent-date 3-NOs arithmetic, food required on slip-ups, dead-weight
sweep). Walked a fresh drinker/female persona (+qa2611044scb) at 430px:
intake → manual lab → day 22 → full check-in (plan No, notable symptom,
free-text recall, drinks skipped) → slip-up survey ×2 → two more NO days →
3-NOs card → audit (cravings + life, stress 8) → pending card. Shots SC4*/SC4B*.
Re-read DailyCheckin.js, SlipupSurvey.js, ComplianceAudit.js (all), Dashboard.js
audit/slip wiring, aiInsights.js prompts, AdminDashboard.js respondToAudit.
Live DB probes via the robot's own session (normal RLS) after every write.

**Regression context:** 62/63 (stamp 2611040751). One FAIL —
`sentinel.silent_writes | 6 NEW unchecked writes` — triaged as **harness
drift, not a regression**: Deploy 16 added +39 lines to Dashboard.js, shifting
the six already-reviewed away/audit backstop writes off their line-keyed
allowlist entries (965/1809–1822 → 982/1844–1857). Same six writes, verified
by code text; allowlist re-keyed in sentinelkit.py and re-scan is clean. Zero
product regressions. (The line-number keying will drift again on any Dashboard
edit — content-keyed allowlisting is the durable fix, noted for the harness.)

## What's solid

The front half remains the best flow in the product. Clean at 430px in every
state tonight (check-in, recall tags, slip-up, all audit branches, pending
card). Write-first + retry works: both confessions land before the AI talks.
The slip-up AI now says "goat cheese isn't on your flagged list" instead of
inventing a sensitivity — verified live. 3-NOs card triggered on exactly 3
adjacent NO days; "Three days in a row is hard" is now honest arithmetic.
RLS still blocks users from flipping audit status (PATCH → 200, zero rows).
Tonight's findings are the back half again: what the system does with the
confession after it lands.

## Ranked findings

| # | Tag | Sev | Finding | Fix |
|---|-----|-----|---------|-----|
| 1 | CHANGE | MED | The slip-up card keeps asking after the confession: `showSlipupCard` keys only on `response === 'NO'` (Dashboard.js:1179), so after submitting the survey the dashboard still shows "We logged a slip-up today. Tell us what happened." + the amber card all day (verified live, shot SC4_08) — the customer just told us, and the product looks like it wasn't listening | Gate the card on `!todayEntry.slip_up_reason` and swap in a one-line "Logged — thank you" state |
| 2 | CHANGE | MED | A second slip-up the same day silently destroys the first: the upsert replaces `slip_up_foods`/`slip_up_reason` wholesale (verified live: ["goat cheese"]/intentional → ["Bread"]/hidden) — and #1's still-begging card is what invites the second submit | Merge foods into the existing array and append reasons; or preload the earlier entry into the form |
| 3 | CHANGE | MED | ⚑ COPY PROMISE (6th sighting) — the slip-up flow promises analysis that never happens: card + success screen say the data "makes your weekly insights more accurate" / "gets factored into your weekly insight," but `slip_up_foods`/`slip_up_reason` have **zero readers** (grep: written in SlipupSurvey, read nowhere — not weekly prompts, not confound analysis, not admin); the AI also tells customers an exposure "may push your clarity window back by a few days" when no clock in the system ever moves | Feed slip foods into the weekly-insight prompt (cheap, honest) and strike the clarity-window line from the slip-up prompt |
| 4 | CHANGE | MED | The audit's AI acknowledgment is a dead write Alex never sees: ComplianceAudit.js:181 backfills `ai_acknowledgment` after the insert, but RLS blocks user UPDATE on compliance_audit (probe: 200, zero rows; DB row confirms "") — so AdminDashboard's acknowledgment panel (L1114) is permanently empty. Introduced by Deploy 12's (correct) write-first reorder | Send `ai_acknowledgment` best-effort via a tiny service-role function, or drop the column + admin panel; today it's dead code on both ends |
| 5 | CHANGE | MED | Day-14 milestone nags compliant customers: generateDay14Message sees only weekly check-ins, so with none submitted the AI wrote "Without logged check-ins yet, there's no symptom data… now is a great time to start tracking" directly under a 22-day-streak hero (shot SC4_08) — the model can't know the customer logs daily | Pass daily streak + daily_factors counts into the milestone prompts and forbid "you haven't logged" claims |
| 6 | CHANGE | LOW | A drinker who skips the drinks field is recorded as 0 drinks, not blank (DailyCheckin.js:209, verified live: `drinks: 0`) — a guess stored as data, feeding the dashboard drinks/week figure; the check-in's own copy says "an honest blank beats a guess" | Write null when the field is empty |
| 7 | CHANGE | LOW | The symptom_logs insert is unchecked (DailyCheckin.js:252 — supabase returns errors, doesn't throw) and the reward screen then asserts "first of its kind **on your record**" even when nothing was recorded | Capture the insert error; skip the on-record beat when the write failed |

Minor notes, not ranked: the recall parser mapped "a glass of red wine" to
**Grapes** (live; Alcohol exists in COMMON_FOODS — 10-24 noted wine skipped,
now it's mis-attributed, arguably worse as a lead); `branch_responses` stores
every branch's empty strings plus a duplicated nested/flat `craving_food` —
schema noise for future readers; suspect-board "Trial opens ~Dec 7" wraps the
date awkwardly at 430px; TEST-ONLY: the TIME MACHINE panel overlaps the
slip-up card's CTA at 430px (10-23 note, still true).

## Still open from prior nights (carry-forward)

- **Supabase actions (Alex, 14th night for the oldest):** PAYMENT_GATE_MIGRATION.sql,
  "Confirm email" ON, storage INSERT policy on `lab-results`, INTAKE_DRAFT_MIGRATION.sql.
- **Lab-kit fulfillment ruling** (10-30 #1, HIGH family) — still unbacked.
- **Sentinel S5** (unchecked no_improvement insert, now Dashboard L982) — one of
  tonight's six re-keyed lines; still awaiting an approved fix.
- CONFOUND thresholds + verdictEngine.js physician review — flagged in-code.
- 11-03's six home-dashboard items shipped in Deploy 16 — verified present in
  code tonight (testableFoodCount, hero clock); full live re-verify next area-3 pass.

---

> **Resolved 2026-11-05 (Deploy 17, approved by Alex):** all seven findings
> implemented and deployed in one batch, plus the cycle-data decision — Alex
> chose "wire it in as a confound": weekly-insight period-day context line,
> confound Engine 3 (cycle coincidence, correlation-gated, thresholds flagged
> for MD review), and a verdict-survey period-day cross-reference with honest
> hedging. Live re-walk post-deploy: slip card stops begging and the receipt
> shows (fix #1), drinks stores null (#6), slip-up AI now says the clock
> doesn't move (#3 prompt), audit submit + pending card green with
> ai_acknowledgment null (#4), zero console errors on the audit walk. The
> sentinel silent-write allowlist is now content-keyed (file+table+op+count)
> after drifting twice in one day. Still with Alex: the Supabase actions, the
> lab-kit ruling, Sentinel S5, and the new 11-05 HIGH (digestive axis
> inversion).
