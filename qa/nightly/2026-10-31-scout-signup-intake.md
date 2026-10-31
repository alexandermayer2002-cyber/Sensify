# Nightly Scout — Signup + Intake — 2026-10-31

Area 1 (day 31 mod 10) — second pass; first was 10-21, before Deploy 10 shipped five of
its seven findings. Walked the live site at 430px with a fresh test account
(+qa3110si, via the resume door), 21 screenshots (SI31_*/SI31B_*), including a
mid-step-4 reload and a fresh-browser re-entry. Read Signup.js, Login.js, Onboarding.js,
IntakeSurvey.js, NumPad.js, App.js, testMode.js, verify-payment.js, resume-paid-signup.js,
PAYMENT_GATE_MIGRATION.sql, ADD_EMAIL_TO_PROFILES.sql.

**Regression context:** see tonight's regress_summary.json / morning doc.

## Deploy 10 held up

| 10-21 finding | Verified tonight |
|---|---|
| #1 freq-pill overflow | FIXED — pills wrap, zero horizontal overflow on any step at 430px |
| #4 Onboarding unreachable | FIXED — check-in-ritual screen shows after signup |
| #5 refresh loses intake | FIXED — reloaded at step 4: step, consent and pill selections all restored |
| #6 consent promises reminder emails | FIXED — now "account and program notifications" |
| #7 dead read + triplicate copy | FIXED |
| #2 server-side payment gate | **STILL WAITING ON ALEX** — migration written, not run; Google-on-Login still creates unpaid accounts until it is (the migration's auth.users trigger does cover OAuth — verified the SQL) |
| #3 Confirm email in Supabase | **STILL WAITING ON ALEX** — resume door still claimable by anyone who knows a buyer's email |

What's solid: signup, resume door, onboarding and all five intake steps are clean at
430px — no overflow anywhere, zero console errors across both walks, required-field
gating works, draft restore works, the consent card is still the best copy in the
product. Nothing new tonight is HIGH; the two Supabase actions above remain the only
money/trust items in this area.

## Ranked findings

| # | Tag | Sev | Finding | Fix |
|---|-----|-----|---------|-----|
| 1 | CHANGE | MED | ⚑ COPY PROMISE: intake entry card says "Takes about 5 minutes" (Dashboard.js L1711) — the walk is 11 symptom questions + 8 baseline scales + 81 food-frequency rows + 5 lifestyle items; a careful human needs 10–15 min, and the gap lands in the buyer's very first session | Say "15–20 minutes, save and come back anytime" (the draft makes that true) — honest beats optimistic |
| 2 | CHANGE | MED | Draft survives refresh but not a device switch: fresh browser context → consent re-required, every answer gone (verified live). localStorage-only by design, but phone→laptop mid-intake, private mode, or a cleared webview silently discards up to 100+ answers incl. the signed consent | Mirror the draft to a profiles JSONB column on step change (write-behind, keep localStorage as fast path), clear on completion |
| 3 | ADD | MED | Step 4 is a 10,700px wall: 81 food cards in one scroll, no category nav, no collapse, no progress-within-step; the "blank = rarely/never" rule is stated once at the top and long forgotten by Dairy | Collapsible category sections with "rated 3/7" counts (or a sticky category chip bar), repeat the blank rule per section |
| 4 | ADD | LOW | Intake's completion upsert omits email, so a profile first created at intake (the Google-OAuth path) keeps profiles.email NULL — quietly defeating the admin disambiguation ADD_EMAIL_TO_PROFILES.sql exists for and the resume-door duplicate check | Add `email: session.user.email` to the handleComplete upsert (one line) |
| 5 | CHANGE | LOW | The sign-in surface (login + forgot + resume screens) brands itself lowercase-serif "sensify" while signup, onboarding, intake and the whole app say "Sensify." — the two screens a buyer sees back-to-back disagree on the product's name | One shared logo component |
| 6 | DELETE | LOW | Dead weight: FREQ_FREQUENT (IntakeSurvey L69) carries 6 legacy option strings no current question can produce (only 'Most afternoons'/'Daily and severe' are live); Signup's s.logoEm unused; App passes a session prop Onboarding ignores | One cleanup sweep |
| 7 | ADD | LOW | Research consent is write-only: the opt-in lands in shown_milestones.research_consent and nothing — admin included — ever reads it, so the team can't see or honor opt-ins without raw SQL | Show a research-consent badge in AdminDashboard's user view |

Honest bottom line: this area went from the roughest surface in the product (10-21) to
one of the cleanest. Nothing new is HIGH; the real exposure is the two Supabase actions
that have now waited 10 nights.

## Still open from prior nights

- 10-21 #2 (run PAYMENT_GATE_MIGRATION.sql) and #3 ("Confirm email" ON) — 10th night
  waiting on Alex; tonight re-verified both doors are still open on the live site's code paths.
- 10-29 scout set (7 findings, Maintain/household) — no deploy yet, all open.
- 10-30 scout set (6 findings, marketing; lab-kit fulfillment + Stripe line-item wording
  are the HIGHs) — awaiting Alex's ruling.
- CONFOUND thresholds + verdictEngine.js physician review — still flagged in-code.
