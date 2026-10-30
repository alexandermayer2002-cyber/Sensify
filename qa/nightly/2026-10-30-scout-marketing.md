# Nightly Scout — Marketing Page — 2026-10-30

Area 0 (day 30 mod 10) — second pass; first was 10-20, before the redesign.
Walked all six tabs on the live site at 430px (MK30B_* shots, 23 captures), read
src/pages/Marketing.js (1,148 lines, fully rewritten since 10-20), public/privacy.html,
public/terms.html, netlify/functions/create-checkout.js, and cross-checked claims
against LabResults.js and Dashboard.js. Also probed sensifyhealth.com (live, serves
the app — the checkout fallback and OG URLs are good).

**Regression context:** see tonight's regress_summary.json / morning doc.

## The redesign resolved most of 10-20

| 10-20 finding | Status |
|---|---|
| #1 lab-kit story contradicts itself | PARTIAL — contradiction gone, fulfillment still unbacked (tonight's #1) |
| #2 privacy policy promises SMS | FIXED — phone/SMS clauses removed |
| #3 hero undersells timeline ("eight structured weeks") | FIXED — "Eight weeks of clean baseline, then a 14-day trial of every food" |
| #4 Ask Sensify missing from pricing checklist | ADOPTED — line present |
| #5 ~200 lines dead CSS | FIXED by rewrite (one stray `.mk-trust` rule left) |
| #6 "clinically validated method" | FIXED — "modeled on the clinical elimination-diet standard" |
| #7 founder voice flips I/we | FIXED — consistent first person + "reviewed personally, by the founder" |

## What's solid

The redesigned page is the strongest surface in the product: no horizontal overflow
on any tab at 430px, zero console errors, privacy/terms 200, menu nav works, showcase
tabs work, copy is tight and honest about IgG limits ("exposure, not reaction"), and
the medical disclaimers are consistent. The remaining problems are the same species
as 10-20 — promises the code can't keep — just fewer of them.

## Ranked findings

| # | Tag | Sev | Finding | Fix |
|---|-----|-----|---------|-----|
| 1 | CHANGE | HIGH | ⚑ COPY PROMISE (carried from 10-20 #1): "Your lab test is part of the $399… completed from home… no separate lab bill" (How step 2, Pricing, FAQ) still has no fulfillment path — checkout collects no shipping address, no kit-order flow exists, and the app's only kit surface assumes you already have one ("Done with your test? Tell us…"); terms.html §4 even says "before your lab test is ordered", an event no code performs | Either build fulfillment (collect shipping, order kit, show status) or reword to "we tell you exactly which test to order" and add that guidance screen post-purchase |
| 2 | CHANGE | HIGH | ⚑ COPY PROMISE: the Stripe checkout line item (create-checkout.js L27) sells a "physician-reviewed elimination & reintroduction protocol" — the site itself is careful to say founder-reviewed wellness program, and CONFOUND/verdictEngine thresholds are still flagged in-code as *awaiting* physician review; the strongest unbacked claim sits on the payment surface | Change the Stripe product description to the site's own language ("founder-reviewed", "built on the clinical standard") |
| 3 | CHANGE | MED | FAQ "What happens when I finish?" says "Maintain pricing is on the Pricing page" — the Pricing tab never mentions Maintain, and its "One program, one price / nothing else to buy" framing sits oddly against the in-app $12.99/mo upsell (10-29 minor note) | Add a small "After the program: Maintain, optional, $12.99/mo" line to Pricing, or drop the pointer from the FAQ |
| 4 | ADD | MED | A $399 decision page with no refund line: Pricing says "No hidden fees" but the refund story lives only in terms.html §4 (vague "good faith") and the founder's "we will make it right" note on Home — a buyer with their card out sees neither | One line under the price card ("Not for you? Write to us and we make it right — see Terms"), matching what founder note + terms already commit to |
| 5 | CHANGE | LOW | Example-map math: "WHAT 184 DAYS OF TESTING PRODUCES" captions a 6-food finished map — 56 elimination days + 6×14-day cycles = 140; 184 implies ~9 foods | Say 140 days, or show the map as 9 foods with "+3 more" |
| 6 | DELETE | LOW | Last dead CSS: `.mk-hero.dark .mk-trust` override (Marketing.js L76) targets a class no JSX renders | Delete the rule |

Honest bottom line: this area is in good shape after the redesign; the two HIGHs are
both "the words promise what the code doesn't do", and #1 is the one that can cost a
real refund.

## Still open from prior nights

- 10-21 #2 (run PAYMENT_GATE_MIGRATION.sql in Supabase) and 10-21 #3 (switch on
  "Confirm email") — tenth night waiting on Alex.
- 10-29 scout set (7 findings: household card hides Limit/Avoid from the cook, Maintain
  cap vs "unlimited" copy, legacy food_map read, drift-data starvation, household link
  unmanageable at completion, silent writes, Stripe customer churn) — no deploy yet, all open.
- 10-29 headline (elimlate ringCount crash): fix landed 10-30 (cd517eb); tonight's
  suite is the verification.
- CONFOUND thresholds + verdictEngine.js physician review — still flagged in-code.
