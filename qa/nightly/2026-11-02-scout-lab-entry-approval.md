# Nightly Scout — Lab Entry + Approval — 2026-11-02

Area 2 (day 2 mod 10) — second pass; first was 10-22, whose seven findings all closed
with Deploy 10 / the 10-23 rulings. Tonight probed only angles that pass never touched:
the storage upload back-half, a real-size (108-food, 3-page) panel through live
extraction, the custom-food add path, and stale-file state across method switches.
Fresh +qa...l2b account at 430px (shots L2B_*/L2C_*/L2D_*), with failed-response
bodies captured. Read LabResults.js (current), AdminDashboard.js approveLab,
testMode.js, test-approve-lab.js, aiClient.js, ai-proxy.js, Dashboard lab-state cards.

**Regression context:** see tonight's regress_summary.json / morning doc.

## The headline

**Every lab file upload on the live site is failing.** Supabase storage returns
`403 "new row violates row-level security policy"` (surfaced as a 400) on every
upload to the `lab-results` bucket — verified live with a fresh account and a 5KB
PDF (shot L2C_02). Deploy 10's stop-and-surface guard means every PDF/photo
customer now hits the blocking "uploading the original file didn't go through"
error; the only way through is "Submit without the original file", so no reviewer
ever receives an original document. Pre-Deploy-10 this failed *silently*, so it may
have been broken for a long time — and the regression suite never uploads a file
(manual-entry only), which is why it has never FAILed. The file-less escape hatch
does work end-to-end (verified: submit → auto-approve → "Elimination begins
tomorrow" → correct 5-food avoiding list).

## Ranked findings

| # | Tag | Sev | Finding | Fix |
|---|-----|-----|---------|-----|
| 1 | CHANGE | HIGH | ⚑ Storage RLS blocks **all** lab uploads: every PDF/photo submit errors and loses the original document (file-less fallback only). Also breaks the lab card's promise "PDF, photo, or manual entry. The AI reads your results… in seconds" — upload paths can't complete as described | **Supabase action (Alex):** add an INSERT policy for authenticated users on the `lab-results` bucket (or uid-folder-scoped policy + code writes `${uid}/<ts>.<ext>`); then re-verify live |
| 2 | CHANGE | MED | Real-size panels fail extraction: 108-food / 67-reacted 3-page PDF → generic "Something went wrong reading your file" (shot L2B_05). Extraction is capped at 1,000 output tokens (LabResults L233, proxy caps 1500) — ~67 foods of JSON truncates and JSON.parse throws | Raise cap to the proxy's 1500 and switch to a compact format (`[["Beef","High"],…]`), or extract per page; say *why* it failed instead of the generic line |
| 3 | CHANGE | MED | Stale file state: "Remove" clears `file` but not `uploadedFile`, and switching method clears neither — so a customer who abandons an upload and enters manually is blocked uploading a file they discarded, with copy about "the original file" they never meant to submit (shot L2B_13, verified live) | Clear both states on Remove and on method switch; skip the upload branch entirely when `method === 'manual'` |
| 4 | CHANGE | MED | The custom-add path skips the canonicalizer built for 10-22 #4: typing "Cows Milk" → no-match card → adds duplicate "Cows Milk" beside canonical "Cow Milk" (shots L2B_06–09, verified live) — breaking the exact frequency-ordering/verdict-keying the aliases exist to protect; "yoghurt" (UK spelling) same family | Run `canonFoodName(search)` in the no-match check and in `addCustomFood` — if it resolves to a known food, surface that food instead of offering a duplicate |
| 5 | CHANGE | LOW | The pending-review hero contradicts itself: headline "Awaiting approval." over sub-copy "Complete setup to begin" and a 0% bar (Dashboard L1696–1704) — shown precisely when the customer has completed setup | "Setup complete — your results are in review"; fill the bar to the setup-done mark |
| 6 | CHANGE | LOW | Extraction levels are unvalidated: a level outside High/Moderate/Low counts in the "N foods extracted" banner, renders in **no** section (grouping iterates only the three), and submits invisibly | Coerce unknown levels at parse time (default Moderate + flag) or drop with a notice |
| 7 | DELETE | LOW | Dead weight: `s.ctaDisabled` (L59) is never used; the `file` / `uploadedFile` twin state is pure duplication and the root of #3 | Delete the style; collapse to one state |

## What's solid

Extraction's happy path is genuinely good live: "Cow's Milk"→Cow Milk and
"Almonds"→Almond canonicalized, "No Reaction"/"Not Tested" rows correctly excluded,
single tinted-select control, readback gate intact. The file-less back-half is
clean: auto-approve → day-boundary-correct "Elimination begins tomorrow" → avoiding
list grouped by level. The 10-22 #1 declined-branch fix (`track_decision:
'declined'`) is in the shipped code, and the visibilitychange refetch promised in
the 10-22 #3 fix is wired. The area's remaining problems are all in the upload
back-half and edge vocabulary — nothing wrong with the core manual flow.

## Suite gap (harness note, not a product finding)

The regression suite exercises lab entry only via manual entry, so finding #1 was
invisible to it for 13+ nights. Worth one classic check that uploads a tiny PDF
through to submit (needs #1 fixed first to pass).

## Still open from prior nights

- 10-21 #2 (run PAYMENT_GATE_MIGRATION.sql) and #3 ("Confirm email" ON in Supabase) —
  **12th night waiting on Alex**; tonight adds a third Supabase action (storage policy, #1 above).
- 10-29 Maintain/household set (7), 10-30 marketing set (6; lab-kit fulfillment +
  Stripe wording HIGHs), 10-31 signup/intake set (7), 11-01 set (5; offline
  intake-complete HIGH) — no product deploy since, all open.
- CONFOUND thresholds + verdictEngine.js physician review — still flagged in-code.
