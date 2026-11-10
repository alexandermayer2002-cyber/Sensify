# Sensify — Open items (Alex's canonical numbering, set 2026-11-10)

This is THE numbering. Agents and sessions reference these numbers; do not
renumber. History/details live in the "Sensify Fix List — Nov 8" doc and
qa/nightly/.

## Code — Claude builds on Alex's go

- **7 · Intake screening gate.** Ask about diagnosed allergies, anaphylaxis,
  pregnancy, ED history before anyone is told to eat tree nuts; permanently
  exclude allergy foods; pin a static emergency-care card on exposure days.
  Held for its own careful session, per Alex.
- **8 · Kit/price copy sweep.** Kill "lab test included" and the "YOUR LAB
  KIT" card, add the founding-tester banner. The last blocker before
  re-running the Release Gate.

## Waiting on the world

- **39 · Lab partner + citation** — parked until a partner exists.
- **40 · Physician-gated engine items** (washout rule, 56/11-day numbers,
  thresholds, retest door, confound bands) — blocked on #34; mid-January
  deadline once invites go out.

## Alex only

- **31 ·** Stripe coupon (100% off) + one dry run.
- **32 ·** Delete the 4 old manual accounts, close the June self-test tickets.
- **33 ·** Netlify: remove unused AI/Twilio env vars, turn on failed-deploy
  email alerts.
- **34 ·** Book the physician.
- **35 ·** Five-minute check of the "results under review" wait screen on a
  real account.
- **36 ·** Real SMTP before invites widen.
- **37 ·** Re-paste the updated `PAYMENT_GATE_MIGRATION.sql` (domain pin) —
  2 minutes.
- **38 ·** Optional: `MAINTAIN_PRICE_ID` in Netlify.

## Also tracked, unnumbered (small; surfaced in the Nov 10 doc sweep)

- Drop the consent re-sign when someone resumes intake (verify Friday's
  First-Timer run).
- Verify the consent screen's disabled button says what's missing.
- Optional one-screen recap before Stripe checkout.

Everything else from the Nov 6–10 findings is shipped and verified; see the
fix-list doc ledgers (Deploys 18–24).
