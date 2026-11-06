# Marketing Page Teardown — 2026-11-06

Live: https://singular-starship-09b1f1.netlify.app · Source: `/home/claude/sensify/src/pages/Marketing.js`
Judged at 1440x900 and 430x932. Screenshots: `/tmp/claude-0/-home-claude-sensify/1716ba7b-bc83-5816-86e9-8a544fc7cfe5/scratchpad/qa/MKT_*.png`
Known/tracked elsewhere, noted once: "lab test included" with nothing shipping, Stripe test-mode. Not re-litigated below.

## Ranked findings

| # | Severity | What's wrong | Fix |
|---|----------|--------------|-----|
| 1 | SELLS-BLOCKER | No risk reversal on a $399 ask. The only refund language is "write to us and we make it right — see our Terms" in Pricing-tab fine print and the founder note *below* the final CTA. A skeptic on a friend's text will not wire $399 against "see our Terms." | Founder picks concrete terms and states them at every CTA. Copy: **"30-day guarantee: if the program isn't for you in the first 30 days, email me and I'll refund you in full."** (Only if actually honored — do not publish otherwise.) |
| 2 | SELLS-BLOCKER | Zero proof layer. No testimonials, user counts, expert review, named lab partner, or a single citation — and the one genuine trust asset (the founder note) is placed after the last CTA where nobody reaches it. | Don't invent proof. Move the founder note above the final CTA, name the lab partner, link one real citation for elimination–reintroduction (e.g., AND/clinical guideline), and frame smallness honestly: "Built and run by one person — every flagged case is reviewed by me." |
| 3 | SELLS-BLOCKER | The page never names the buyer's symptoms. "Bloating, reflux, brain fog, fatigue" exist only inside 8px mock-screen text. Hero sub is pure mechanism jargon ("Eight weeks of clean baseline, then a 14-day trial of every food, gives the verdicts"). The visitor is shopping for relief, not protocol design. | Rewrite hero sub: **"Bloating, brain fog, reflux, low energy — if you suspect a food is behind it, Sensify finds the one that is. A lab test shortlists the suspects; a structured elimination proves which are real."** |
| 4 | LEAK | Desire peaks at "The outcome" (verdict map) and there is no price, value stack, or primary CTA anywhere near it. The 11-item "what you get for $399" list lives on a separate Pricing tab most visitors never open. | Insert a compact pricing card after The Outcome: $399 · top 5 inclusions · guarantee line · "Start your program" (primary). |
| 5 | LEAK | CTA dead zone: between the hero and the page bottom (~4 mobile screens) the only buttons are ghost nav links ("See the full program →", "Read all FAQs →"). Nothing asks for the sale mid-page. | Primary CTA on the pricing card from #4; keep ghosts as secondary. |
| 6 | LEAK | Program duration (4–6 months) is hidden on the home page — it surfaces as "Months 2–6" on another tab and "140 DAYS OF TESTING" in 6px mono caps. Discovered post-purchase, this *is* the catch. | Own it next to How-it-works: **"It takes months, not days — because a real answer does. ~30 seconds a day is all it asks."** |
| 7 | LEAK | "Clinical standard" invoked 4 times with zero citation, alongside overclaims ("Four steps to certainty," "know for certain what your body does and does not tolerate") that contradict the page's own honest FAQ hedging. Reads as hand-waving to exactly the skeptic it's written for. | One citation link on the Science section; soften to "Four steps to an answer" / "know with real evidence." |
| 8 | LEAK | The Verdicts showcase screen is headed "Sarah's verdicts" with no Example label — unlike the finished-map card, which says EXAMPLE. It reads as a fabricated customer. | Add "EXAMPLE" to the mock's header line (`ShowcaseScreen`, Verdicts tab, ~line 506). |
| 9 | LEAK | Objection unanswered everywhere: "Is it safe/nutritionally OK to cut 8 foods for 8 weeks?" Medical & safety FAQ covers diagnosis only. This is a top-3 real-buyer objection for an elimination diet. | Add FAQ: honest answer on nutritional coverage during elimination + "consult your provider," especially for pregnant/underweight/ED-history users. |
| 10 | LEAK | Hero primary CTA is pale sage (#8BAE8A) with dark text — visually quieter than the nav's forest pill and the gray secondary beside it; the page's biggest button reads disabled. | Make hero "Start your program" forest-500 solid, white text, matching every other primary. |
| 11 | POLISH | Hero micro-copy illegible: price line at 50% alpha and the included-list at 38% alpha / 11.5px on dark green — the only above-the-fold value statement fails WCAG AA. | Raise to ≥75% alpha, 13px. That line is doing the pricing card's job; let it be read. |
| 12 | POLISH | Mobile nav tap targets 27–31px tall (Sign in 27px, Get started 31px) vs 44px minimum; three controls crowd a 54px bar. | 44px min-height on nav controls; move "Sign in" into the Menu panel at <500px. |
| 13 | POLISH | Desktop H1 wraps as "Stop guessing what your body can't / handle." — orphaned "handle." breaks the italic phrase at 1440px. | `can't&nbsp;handle` or tighter max-width so the italic phrase stays together. |
| 14 | POLISH | Redundancy: Problem card 1 ("most people who buy a test never follow a proper protocol") restates the section intro verbatim; "What's included" FAQ answer deflects to "Current pricing is on the Pricing page" while $399 sits in the nav beside it. | Cut card 1's duplicate sentence; say "$399, one payment" inline in the FAQ answer. |
| 15 | POLISH | Mobile dead air: large empty band after "See the full program →" (MKT_mob_s03); section padding + reveal offsets leave ~½ screen of blank paper mid-scroll. | Tighten `.mk-section` mobile padding (44px → ~32px) on the four-steps section. |

## Proposed spine (home page)

1. **Hero** — symptom-first promise, forest CTA, guarantee line under the button, $399 legible.
2. **Problem** — you suspect food; guessing and raw tests both fail (keep, tightened).
3. **Outcome** — the verdict map: what life looks like finished. Sell the destination before the mechanics.
4. **How it works** — 4 steps, with duration stated honestly ("months, not days — 30 sec/day").
5. **Inside the program** — tabbed showcase (keep; label Sarah screen as example).
6. **Why believe it** — science/clinical method with one citation + named lab partner + founder note (moved up: it is the proof section).
7. **Price** — $399 card with value stack, anchor ($150–300 for a test alone), Maintain disclosed, guarantee repeated, primary CTA.
8. **FAQ** — add safety-of-elimination and "what's the catch" (duration + Maintain).
9. **Final CTA** — "Stop guessing. Start knowing." + guarantee, footer.

## Three changes before any invite goes out

1. **Publish a concrete guarantee and put it at every CTA.** Nothing else on this page moves conversion as much as de-risking $399; "see our Terms" actively signals a catch.
2. **Rewrite the hero for the symptomatic buyer** (finding #3's line) and fix the pale CTA — the five-second test currently sells protocol mechanics to someone shopping for relief.
3. **Add the on-home pricing/value card after The Outcome** with the top inclusions, the $150–300 anchor, and a primary CTA — today price and value never meet on the page that sells.
