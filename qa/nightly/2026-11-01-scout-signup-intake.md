# Nightly Scout — Signup + Intake — 2026-11-01

Area 1 (day 1 mod 10) — third pass, one night after the 10-31 second pass, with **zero
product deploys in between** (HEAD = last night's QA commit). So tonight repeats nothing:
all seven 10-31 items re-confirmed open, and the walk probed only angles the first two
passes never touched — login error states, forgot-password, the step-5 alcohol toggle,
and what happens when the final save fails. Fresh +qa0111si account, four walks at
430px (shots SI01_*/SI01C_*/SI01D_*). Read Login.js, Signup.js, ResetPassword.js,
IntakeSurvey.js, NumPad.js, Onboarding.js, App.js.

**Regression context:** 54/54 (stamp 2611010751), zero FAILs — see regress_summary.json.

## Ranked findings (new tonight)

| # | Tag | Sev | Finding | Fix |
|---|-----|-----|---------|-----|
| 1 | CHANGE | HIGH | Silent-write family, worst member yet: `handleComplete` (IntakeSurvey L316) ignores the profile upsert's error, then **deletes the localStorage draft and routes to the dashboard anyway**. Verified live: completed the full intake offline → "Loading your program…" → back online, the intake card is back and the draft is gone. One network blip at the final tap and ~15 min of answers + the signed consent vanish while the user believes they finished | Check `error` before clearing the draft: on failure keep the draft, show "Couldn't save — retry" (the draft already makes retry free) |
| 2 | CHANGE | MED | Step-5 trap: enter an out-of-range drinks/week (e.g. 50 → warning fires), then switch "Do you drink alcohol" to **No** — the drinks card hides, but `lifestyleComplete` still runs `padInRange` on the lingering value, so **Complete intake stays disabled with the only explanation hidden inside the collapsed card** (shot SI01C_07). Recovery requires re-flipping to Yes and guessing the number is the blocker | Skip the drinks range check when `drinks_alcohol === 'no'` — mirror the write logic, which already nulls it (one-line condition change) |
| 3 | ADD | LOW | No `autocomplete` attributes on any auth field: Login (`email` / `current-password`), Signup + ResetPassword (`new-password`). iOS/Android password managers can't reliably offer strong-password generation at signup or clean autofill at login — the two screens every phone buyer crosses | Add the five attributes; `inputMode` is fine as-is since NumPad is custom |
| 4 | CHANGE | LOW | Login failure shows raw Supabase copy — "Invalid login credentials" (shot SI01_02) — the one terse-tech sentence in an otherwise warm voice, and it doesn't mention the two doors that fix most cases (forgot-password, resume) | "That email and password don't match. Forgot your password? Or if you paid but never set up, tap Continue here." |
| 5 | DELETE | LOW | Dead weight in Login.js: `notice`/`setNotice` (L36) declared and never read or rendered; `handleGoogle` ignores `signInWithOAuth`'s error, so a failed OAuth init is a silent no-op button | Delete the state; surface the OAuth error in the existing error box |

No copy-promise item tonight: the only promise gap found is 10-31 #1 ("Takes about
5 minutes"), still live, already on file.

What's genuinely good (worth saying on a third pass): forgot-password is the cleanest
auth flow in the product — no-enumeration copy ("If an account exists for…"), correct
PASSWORD_RECOVERY routing to a dedicated reset screen; step 4 has zero horizontal
overflow (scrollWidth 430 = viewport); onboarding ritual screen shows reliably; the
consent card remains excellent. The area is structurally clean — tonight's #1 is the
only thing in it that can cost a customer data.

## Still open from prior nights

- 10-21 #2 (run PAYMENT_GATE_MIGRATION.sql) and #3 ("Confirm email" ON in Supabase) —
  **11th night waiting on Alex**; still the only money/trust exposure in this area.
- 10-31 scout set — all 7 re-confirmed open tonight (no deploy): 5-min copy, device-switch
  draft loss (re-verified live: fresh browser → consent from scratch), step-4 wall
  (scrollHeight 10,732px tonight), intake-upsert email omission, sensify/Sensify branding
  split, FREQ_FREQUENT dead strings, write-only research consent.
- 10-29 Maintain/household set (7) and 10-30 marketing set (6; lab-kit fulfillment +
  Stripe wording HIGHs) — no deploy, all open.
- CONFOUND thresholds + verdictEngine.js physician review — still flagged in-code.

---

> **Resolved 2026-11-03 (Deploy 14 + hotfix 3ce288d, approved by Alex):** every
> code-fixable finding in this report shipped in one batch. Highlights: lab-file
> uploads work again via a service-role function (verified live, 200 + stored
> file_path) while Alex's storage policy is pending; the offline intake-complete
> data-loss fixed; household card keeps Limit/Avoid for the cook; Maintain reads
> the verdict union, exempts subscribers from the ask cap, counts meals, and
> renders the household card; silent writes checked; marketing/auth polish; and
> `no-undef` is now a build error so the dangling-variable crash class dies at
> compile time. New classic check p5 uploads a real PDF end-to-end. A copy
> collision I introduced (login error quoted a button label, stalling the suite
> signup) was caught by p5+p1 and hotfixed same session. Post-deploy: 57/57.
> Still Alex's: storage INSERT policy, PAYMENT_GATE_MIGRATION.sql, Confirm email,
> INTAKE_DRAFT_MIGRATION.sql, and the lab-kit fulfillment ruling (10-30 #1).
