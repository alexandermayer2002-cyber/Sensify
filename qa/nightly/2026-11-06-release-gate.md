# Release Gate — 2026-11-06

## VERDICT: **NOT READY** for a real friends-and-family tester today.

Two tester-blocking REDs: (1) mid-intake progress is lost on a session restart —
the intake_draft autosave 400s on every intake screen (migration not applied) and
the walk was sent back to consent + Step 1; (2) the live marketing page and the
day-0 dashboard still promise a physical lab kit ("$399 · lab test included",
"YOUR LAB KIT") that nothing fulfills. Email confirm is also confirmed OFF live —
a known-open blocker-list item. Per charter, the gate cannot say READY while
known tester-blocking items are open.

Walk: fresh account `alexandermayer2002+qa2611066gate@gmail.com`, 430×932,
no test-* endpoints called by QA (the app itself fired its own test door once —
see note A). Shots `GATE_*` in the session scratchpad qa/ folder.

## Blocker table

| # | Check | Status | Evidence (live, today) |
|---|-------|--------|------------------------|
| 1 | Email confirm ON? | **RED (it is OFF)** | Signup → straight into onboarding ritual + dashboard; no "check your email" wall at any point (GATE_07_post_signup). Any address, verified never. |
| 2 | Intake autosave working? | **RED** | `GET /rest/v1/profiles?select=intake_draft` → **400** on every intake mount, `PATCH /rest/v1/profiles?id=eq.<uid>` → **400** after every step (the migration-missing signature, 12+ occurrences). After answering step 1 + all of step 2, closing the browser and signing back in: **consent had to be re-signed and intake restarted at Step 1 of 5 — everything lost** (GATE_03_reopen_intake_position). Same-browser localStorage draft exists in code but did not help a fresh session. INTAKE_DRAFT_MIGRATION.sql still not applied. |
| 3 | Lab file upload working? | **GREEN** (with a logged scar) | Upload PDF path offered (PDF / photo / manual). Direct client upload to `storage/v1/object/lab-results/...` → **400** (storage policy still blocks), but the app silently fell back to `/.netlify/functions/upload-lab-file` → **200**, and `ai-proxy` (200) extracted **3/3 foods with correct levels** (Cow Milk High, Wheat Moderate, Crab Low) from a real PDF; review screen correct; submit saved. Empty-PDF case was properly validation-blocked ("add at least one flagged food, or select 'no sensitivities'"). |
| 4 | Pending-review experience acceptable? | **UNVERIFIED live** | Could not observe it: the app auto-approves labs for test-tagged emails (note A), so this account skipped straight to "Elimination starts tomorrow". Code path for real accounts (Dashboard.js ~L1798) shows "Results under review — Usually reviewed within a day. Check back here — this page updates when it's approved." — acceptable copy (what + how long), but unproven on a live real account. |
| 5 | Lab-kit promise unfulfilled? | **RED** | Live marketing, quoted: "**$399 · lab test included · one payment**"; "**Complete your intake and at-home lab test**"; "**A lab test alone costs $150 to $300 … Sensify includes the lab … One price, nothing else to buy.**" Day-0 dashboard card: "**YOUR LAB KIT — Done with your test? Tell us so we know your results are on the way.**" No shipping collected at checkout, no kit-order flow exists (10-30 #1 still open). A real tester will wait for a kit that never ships. |
| 6 | Payment: product without paying? | **RED (gate unproven, money path not live)** | Reached the **entire product with zero payment** via sign-in screen's "Paid but never finished setting up? Continue here" door (test-tagged email). Signup asked nothing about price or payment; $399 appears only on marketing. Whether a non-test email passes the same door is unverified (PAYMENT_GATE_MIGRATION.sql known-unapplied; creating a real-email account is out of charter). Also: `create-checkout` returns a **Stripe TEST-mode session (`cs_test_…`)** — the "Get started" door cannot take real money today, and a tester's real card would be declined. |

## Walk notes, in order

1. **Marketing (430px)** — loads clean, no console errors, no horizontal overflow. Kit/price promises quoted in row 5 (GATE_01_marketing_home). "Get started" → Stripe checkout; the function returns a valid test-mode checkout URL (the robot's chrome-error on redirect was the sandbox proxy blocking checkout.stripe.com, not the site).
2. **Signup** — Sign in → "Continue here" → email → name/password → account created instantly. **No email-confirmation step of any kind.** Lands on a good onboarding ritual screen, then dashboard (GATE_06–08).
3. **Password reset** — "Forgot password?" on sign-in → fill email → "Check your email. If an account exists for …, we've sent a link to reset your password. It may take a minute to arrive." No errors, proper no-enumeration copy, Back to sign in link. On-screen experience: good (GATE_03_reset_result). Email delivery itself not verifiable from here.
4. **Mid-intake persistence** — consent signed, step 1 (goals) answered, all of step 2 (symptoms) answered, autosave window waited. Closed browser entirely → reopened → signed in → intake entry: **consent screen again, then Step 1 of 5, blank.** Progress did not survive. The intake UI itself still says "your progress saves as you go" on the dashboard card — a promise the 400s break.
5. **Finish intake** — steps 1–5 completed (goals, symptoms, baselines, food frequency, lifestyle) without errors; dashboard flips to "Your intake is complete. Upload your lab results to begin."
6. **Lab upload** — tried file path first (see row 3). First attempt with a content-free PDF: AI returned "0 foods extracted", and submission was correctly blocked until "My report shows no sensitivities" is picked. Second attempt with a realistic IgG PDF: all three foods extracted at the right levels, review shown, submitted.
7. **Post-submit** — on this test-tagged account the app's own test door auto-approved the lab (note A), so the pending-review state never rendered; the account is now "Elimination starts tomorrow" with a correct 3-food suspect board and avoiding list (GATE_01_final_dashboard). One oddity: immediately after submit the walk landed **signed out on the marketing page**; signing back in worked and state was intact. Likely the test-approve path's reload — flagged for a human spot-check on a real-flow account.
8. **Day-0** — no daily check-in offered ("Starts tomorrow" / "OPENS WITH DAY 1" — by design). Household link card present. Nothing else for a day-0 account to do; dashboard copy explains what's next.

### Note A — the app called a test door by itself
QA called no test-* endpoint. During submit, `src/pages/LabResults.js` → `autoApproveTestLab` fired `/.netlify/functions/test-approve-lab` (200) because the email carries `+qa` (`src/utils/testMode.js`, pattern-gated). By design for robots, and real accounts take the admin gate — but it means **no test-tagged walk can ever observe the real pending-review experience**, and it is why row 4 is UNVERIFIED.

## Console / network errors (whole walk)

| Status | URL | When / count |
|--------|-----|--------------|
| 400 | `https://cmcdmfqawvdyncmoxdfz.supabase.co/rest/v1/profiles?select=intake_draft&id=eq.5383cb0b-…` | every intake entry (consent/step mount), 4+ |
| 400 | `https://cmcdmfqawvdyncmoxdfz.supabase.co/rest/v1/profiles?id=eq.5383cb0b-…` (PATCH autosave) | after every intake step, 8+ |
| 400 | `https://cmcdmfqawvdyncmoxdfz.supabase.co/storage/v1/object/lab-results/5383cb0b-…-1793999944053.pdf` | once, on PDF submit (client upload; rescued by upload-lab-file 200) |
| console | `Failed to load resource: … 400 (Bad Request)` | mirrors each of the above (12+ total) |

No other console errors; marketing, auth, intake UI, lab UI and final dashboard were otherwise clean. Functions seen healthy: `create-checkout` 200 (test-mode URL), `ai-proxy` 200, `upload-lab-file` 200.

## What must change before READY

1. Apply **INTAKE_DRAFT_MIGRATION.sql** (kills the 400s, makes "progress saves as you go" true across sessions).
2. Resolve the **lab-kit promise**: ship fulfillment or reword marketing + dashboard card before anyone reads them.
3. Turn **Confirm email ON** (and apply PAYMENT_GATE_MIGRATION.sql / decide the F&F free-access story; Stripe is in test mode — fine only if F&F testers are meant to enter free and told so).

Rows 3 (upload) and the reset flow are in genuinely good shape; intake UX itself ran clean end-to-end.
