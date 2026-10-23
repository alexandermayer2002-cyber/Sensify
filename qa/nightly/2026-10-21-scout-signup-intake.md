# Nightly Scout — Signup + Intake — 2026-10-21

Area 1 (day 21 mod 10). Walked the live site at 430px with a fresh test account
(+qa2610210651sct / +qa<stamp>dbg / vfy), screenshotting every step: Sign in → "Continue
here" resume door → prefilled signup → dashboard → full 5-step intake, plus a
refresh-mid-intake probe. Read src/pages/Signup.js, Login.js, Onboarding.js,
IntakeSurvey.js, src/App.js, src/utils/testMode.js, netlify/functions/verify-payment.js
and resume-paid-signup.js. Built on 2026-10-20-scout-marketing.md; nothing repeated.

**Regression context:** 19/20 (regress_summary.json, stamp 2610210737). One FAIL:
`p4.verdicts_tracking_state` — the tracking-mode Verdicts tab no longer contains the
labeled example wall. FoodMap.js's own comment above the tracking branch (line ~174)
says "The example wall stays (clearly labeled) so the tab still teaches what verdicts
are," but the rendered JSX for `track_decision === 'declined'` shows only the
"Earned by testing." text. Looks like a real deploy-9 regression (or an intentional cut
with a stale comment + harness); left failing for Alex to rule on. A second FAIL earlier
tonight (`p2.protocol_started`) was harness-side: deploy 9's tier cards list the food
names, which broke the freq-pill xpath anchor; the live flow was verified working with
correctly scoped clicks (reached "Starts tomorrow"), and the harness was realigned in
this commit. Re-run after the fix: p2 all green.

## What's solid

Signup, login, resume door, consent, and intake steps 1–3 and 5 are clean at 430px: no
overflow, generous touch targets, the required-field gating works, the out-of-range
numpad validation works, and the consent screen is honest and well-written ("Finding no
triggers is a valid result" is the best trust copy in the product). The "Payment
received" hero on the prefilled signup is a genuinely good moment. The problems below
are one real layout failure, two payment-integrity gaps, and dead code.

## Ranked findings

### 1. CHANGE — The food-frequency step (step 4) overflows horizontally at phone width
**Why:** The one step every buyer must finish on a phone is broken there: 81 food rows
each render 6 frequency pills in a `nowrap` flex row (IntakeSurvey.js s.freqBtns), and
at 430px the page's scrollWidth is 593px — measured live tonight; the pill row is 458px
inside a 382px card, so "Rarely / Almost never / Never" sit off-screen and the whole
page wobbles sideways. Combined with "Takes about 5 minutes" (81 rows says otherwise),
this is the roughest moment of the first session.
**How:** Let the pills wrap (`flexWrap: 'wrap'` + stacked layout, food name above
pills), or collapse the six options to a compact segmented control; collapsible
category sections would also shrink the wall.

### 2. ADD — Server-side enforcement that an account actually paid
**Why:** The $399 gate is client-side routing only. "Continue with Google"
(signInWithOAuth) sits on both Login and Signup and creates a working account with no
payment check; App.js routes any session straight to the dashboard, profiles are
created on the fly at intake, and nothing anywhere re-checks `paid_sessions` after
account creation (the Supabase anon key makes direct `signUp` equally open). A visitor
can run the entire paid program for free in one click.
**How:** Gate program access server-side: an RLS policy or edge check that the
profile's email exists in `paid_sessions` (or a `paid` flag set by verify-payment),
with the +fable/+qa/+robot test-door exemption kept; or remove the Google button until
OAuth can carry the paid check.

### 3. CHANGE — Paid-session claim depends on email confirmation that is switched off  ⚑ CODE PROMISE FLAG
**Why:** resume-paid-signup.js's own security note says the claim "is protected by
Supabase email confirmation... make sure 'Confirm email' is ON." It is off: tonight's
robot signup landed signed-in on the dashboard instantly, no confirmation step (the QA
harness has always depended on that). So anyone who learns the email of a buyer who
paid but never finished setup can claim that $399 program — the endpoint even confirms
which emails qualify.
**How:** Turn on Confirm email for non-test accounts, or have resume-paid-signup email
a one-time claim link to the paying address instead of unlocking signup directly.

### 4. DELETE — Onboarding.js is unreachable; the check-in-ritual education never shows
**Why:** Signup.js destructures `onSuccess` but never calls it, and App.js's auth
listener routes `signup → dashboard` on SIGNED_IN, so the `onboarding` page state is
never set. Verified live: Create account lands straight on the dashboard. The whole
"Your daily check-in ritual / why it matters" screen — the one piece of habit education
in the flow — is dead code, along with ~10 unused style objects in the same file
(timeGrid, timeBtn, successWrap, successIcon, disclaimer...).
**How:** Either wire it up (call onSuccess after signup, guard the auth-listener
redirect) — probably the original intent — or delete the file; half-dead is the only
wrong state.

### 5. CHANGE — A mid-intake refresh silently destroys everything, including the signed consent
**Why:** All intake state is in-memory useState; nothing persists until the final
"Complete intake". Verified live: reload at step 2 lands back on the dashboard, and
re-entering starts at "Before you begin" — re-sign, re-answer, re-rate. On a phone
(where Safari/Chrome routinely discard backgrounded tabs) a notification or app switch
can cost a buyer the entire 5-step flow in their first hour.
**How:** Mirror step + answers to localStorage on change and rehydrate on mount;
clear on completion. (~20 lines, no backend.)

### 6. CHANGE — The required agreement promises email check-in reminders nothing sends  ⚑ COPY PROMISE FLAG
**Why:** The consent checkbox has the user agree to "program-related emails...
including check-in reminders," and the agreement card repeats "We may send you email
reminders to help you stay on track." There is no email-sending code anywhere in src/
or netlify/functions (only Supabase auth mail: reset/confirmation). Same pattern as
last night's #2 (privacy policy promising SMS) — the product keeps writing cheques its
code can't cash, now inside a signed agreement.
**How:** Trim the consent to "account and program notifications" until a reminder job
exists, or build the (genuinely valuable) daily-reminder email and make it true.

### 7. DELETE — Dead reads and triplicated copy inside IntakeSurvey.js
**Why:** `isFrequent(a.general_crashes)` (line 242) reads an answer no question ever
writes — the afternoon-energy baseline can never trigger from the wellness track, which
looks unintended; and step 3 tells the user the same thing three times in one screen
("These scores become your starting point / every improvement measured against them"
appears in the hint, the importantNote, and the hero card).
**How:** Drop or wire the general_crashes read (a wellness crashes question existed at
some point, by the look of it), and keep the sentence once — the hero card is the best
version.

## Still open from prior nights

All seven findings from 2026-10-20 (marketing) remain open — no product commits since
deploy 9, only QA. Tonight's #6 is the in-product sibling of marketing #2 (phantom
SMS/email reminders), and the pre-intake dashboard's "YOUR LAB KIT — Done with your
test?" card reinforces marketing #1's unresolved kit-fulfillment story.

---

> **Resolved 2026-10-23 (Deploy 10, approved by Alex):** #1 freq pills now stack
> and wrap (430px verified live), #4 Onboarding wired into signup, #5 intake
> drafts persist in localStorage (refresh verified live), #6 consent email-
> reminder promise trimmed, #7 dead read + triplicate copy removed. #2 partially
> done: Google removed from Signup and PAYMENT_GATE_MIGRATION.sql written —
> **the trigger takes effect only when Alex runs it in Supabase**; #3 likewise
> waits on Alex turning on "Confirm email" in the Supabase dashboard. Correction:
> the "all 7 from 10-20 remain open" line above was stale — those were already
> implemented in a652103 and shipped with Deploy 9.
