# First-Timer run #2 — the Doubter — 2026-11-06

Persona: smart, mildly skeptical first-timer. Scores UNDERSTANDING and TRUST, not bugs.
Account: `alexandermayer2002+robotfftimer1@gmail.com` (Fiona Tester), continuing day 2 of its
life: dashboard was waiting on lab results; entered them manually as a skeptic would.
Viewport 430x932, screenshots `FT2_*` in the scratchpad qa folder. No test-* endpoints called.

Method at every screen: state what I think I'm asked to do + the pushback question a skeptic
asks out loud (quoting the copy), act, then score the product's answer:
**ANSWERED ON SCREEN / ANSWERABLE BUT BURIED / NO ANSWER EXISTS.**

---

## Challenge log (in order)

### 1 · Landing — "Eight weeks of clean baseline"
Belief: I'm being sold a $399 program. Pushback: **"Why eight weeks? Says who?"**
Acted: read the whole landing page, then Menu → Science.
Verdict: **ANSWERABLE BUT BURIED, and only half.** The Science page says timelines "follow the
clinical elimination diet method: the same structured approach dietitians have used for
decades," and the 14-day trial is justified precisely ("3 days then removed for 11… isolates
symptom responses"). But the number 8 itself is never defended anywhere — landing, dashboard,
suspect board all state 56 days as fact. A skeptic who knows elimination diets are often
quoted at 2–6 weeks has no counter-argument offered. **MED.**

### 2 · Landing — "$399 · lab test included"
Pushback: **"Included from whom? Which test? Is the lab certified?"**
Verdict: **PARTIAL.** Menu → Pricing itemizes the $399 well (11 line items, "no separate lab
bill", Maintain $12.99/mo clearly optional — a genuine trust win). But the lab vendor, the
panel, and any certification are named nowhere on the entire site. I'm buying a lab test with
no lab attached. **MED.**

### 3 · Landing FAQ — "How accurate are IgG food sensitivity tests?"
Pushback: I came armed with "IgG tests are pseudoscience."
Verdict: **ANSWERED ON SCREEN — the best moment of the walk.** FAQ: "IgG tests measure immune
reactivity, not confirmed intolerance. We treat your results as a starting hypothesis… the
protocol is the product, not the test." Science page doubles down ("A high reading for eggs
might just mean you eat eggs every day"). This is the one place the product beat me to my own
objection. **PASS.**

### 4 · Sign-in — "Paid but never finished setting up? Continue here"
Pushback: "Why does a payment-recovery door sit on the sign-in screen? What happens if I, a
paid-up user, tap it?" No explanation of what it does. **LOW** wobble; signed in normally.

### 5 · Dashboard — "The AI reads your results and builds your elimination list in seconds"
Pushback: **"What AI? Where does my lab PDF go, and who sees it?"**
Verdict: **ANSWERABLE BUT BURIED.** The Privacy policy (footer of the *marketing* site only)
does answer: labs "stored privately… secure, time-limited links", shared with "authorized
Sensify staff", no selling. But the signed-in app itself has **no privacy link at all** — the
More menu is History / Support / Sign out. At the exact moment I'm asked to hand over health
data, the screen says nothing about its handling. **MED.**

### 6 · Dashboard — "…once your results are in and we've reviewed them (usually within a day)"
Pushback: **"Who is 'we'? What are their qualifications to review my labs?"**
Verdict: **NO ANSWER EXISTS on any screen.** Deep digging finds Terms §1 ("founder-reviewed…
protocol") and Science ("any recommendation to change your protocol is personally reviewed")
— so "we" is one founder, whose name and credentials appear nowhere (the founder note is
signed only `alex@sensifyhealth.com`). For a health product asking for lab results, the
reviewer is faceless. **HIGH.**

### 7 · Lab entry — manual entry copy
Belief: type in only the flagged foods. Pushback: "My report might say 'elevated' or show a
color band, not your words — will I map it wrong?"
Verdict: **ANSWERED ON SCREEN.** "words like 'elevated', 'high', or a colored band… anything
you leave out is treated as clear… Most reports list 3 to 12 foods." This pre-empts the
different-lab vocabulary problem well; the FAQ also confirms outside results are accepted
("Already have recent results? You can use those instead"). **PASS.**
Minor: while entering, the screen shows only "3 foods flagged so far" — no visible running
list of *which* foods at *which* levels until Review. I briefly doubted my Wheat=High had
registered. **LOW.**

### 8 · "My report shows no sensitivities"
Honest copy ("That's a real result"), and it guards against contradiction once foods are
flagged ("clear them first if your report truly shows none"). **PASS.**

### 9 · Review step
"REVIEW BEFORE SUBMITTING — Wheat (High) · Cow Milk (Moderate) · Egg White (Low)" — exactly
what I entered, with an explicit "Go back and edit". **ANSWERED ON SCREEN. PASS.**

### 10 · Submit "for review" → approved in ~4 seconds
Belief (set by the product itself): a human reviews my submission "usually within a day."
Acted: tapped "Looks right, submit for review →". The very next screen: "You're set. Day 1
begins tomorrow", full elimination list live, trial dates scheduled.
Pushback: **"Who reviewed this in four seconds? Either nobody did, or the 'review' is
theater."** The pending/approval state promised on the dashboard never appeared.
Verdict: **NO ANSWER EXISTS — and an on-screen self-contradiction.** **HIGH.**
*(Caveat for Alex: this may be the robot-door auto-approving test accounts. If real accounts
genuinely wait for review, fine — but then this walk couldn't see the pending state at all.
If real submissions also approve instantly, the "we've reviewed them" copy is actively
corrosive. Either way, verify.)*

### 11 · Elimination list — Egg White, "LOW SENSITIVITY", banned 56 days
Pushback: **"My report barely flagged this. Why does a Low get the same total 8-week ban as a
High?"** No screen distinguishes treatment by level; levels only affect trial order.
Verdict: **NO ANSWER EXISTS.** **MED.**

### 12 · Suspect Board — "How this works"
"Each food stays off your plate through elimination, then comes back… 14 day trial: three
exposure days, then a washout… The ~dates are estimates from your protocol clock… Every
verdict is earned from your own check-ins, never assumed." Plus per-food reasoning ("chosen
because it ranks highest in how often you eat it"). **ANSWERED ON SCREEN — excellent.** The
skeptic's "what exactly am I signing up for" is answered with dates and mechanics. **PASS.**

### 13 · Streak legend ("What do these mean?")
"An honest slip is real data, and it never counts against you… A slip we can work with. A
blank we cannot." Clear incentive design, explained before Day 1. **PASS.**

### 14 · Household Card
Copy answers the data question before I ask it: "what is off the plate… nothing else" /
"Anyone with this link sees what is off the plate and this week's trial, nothing else."
Wobble: one tap on "Create link" and the card "is live" — before showing me what the viewer
sees. A doubter wants the preview first, then the switch. **LOW.**

### 15 · Ask Sensify — asked it my two hardest questions
Asked: "Why does elimination take 8 weeks? Who reviewed my lab results and what are their
qualifications?" It declined scope honestly ("I'm just the food assistant") — fine — but then
referred me to "the Sensify support team **or the practitioner who set up your program**."
Pushback: **"What practitioner? No practitioner has ever been mentioned anywhere."** The AI
invented a clinical authority the product does not have — the exact behaviour a skeptic
expects from "an AI insight," confirmed on first contact. **MED** (would be HIGH if it had
answered the protocol question wrongly; the punt itself was honest).

### 16 · Support — "A real person reads every message and replies here, usually within a day"
Pushback: "Which real person?" Unnamed, but the channel exists and is in-app. **LOW.**

### 17 · Can I quit and get my data?
FAQ: "You can stop anytime." Terms §4: refunds "depend on how far you have progressed…
contact us and we will work with you in good faith" — no numbers, no schedule. Privacy: data
access/deletion "by contacting us" — no self-serve export, and no in-app account/data
settings at all. Verdict: **ANSWERABLE BUT BURIED, and soft where a skeptic wants hard
numbers** (refund terms especially, on a $399 one-shot). **MED.**

### 18 · Dashboard — "⏱ TM" button
An unlabeled button on my home screen that explains itself nowhere. (Suspected internal/test
widget leaking into the account — still, fresh eyes see unexplained chrome on a health
dashboard.) **LOW.**

---

## Unanswered challenges, ranked by how badly they land with a skeptical friend-of-the-founder

| # | Challenge (quoted trigger) | Status | Sev | Why it lands badly |
|---|---|---|---|---|
| 1 | "Submit for review" → approved in seconds, after "we've reviewed them (usually within a day)" | NO ANSWER / self-contradiction | HIGH | The product's one human-trust ritual looks like theater the first time it runs. A skeptic generalizes: "what else is staged?" |
| 2 | "Who is 'we' and what are their qualifications to review my health data?" | NO ANSWER in-app (founder-only, unnamed, buried in Terms) | HIGH | $399 + lab results handed to a faceless reviewer. One sentence with a name would fix it; its absence reads as hiding. |
| 3 | Ask Sensify refers me to "the practitioner who set up your program" — none exists | NO ANSWER (hallucinated authority) | MED | First conversation with the AI and it invents a clinician. Confirms the skeptic's prior about "AI insights." |
| 4 | "Why eight weeks?" (and why a Low flag gets the same 56-day ban as a High) | BURIED/PARTIAL (Science page gestures at "clinical standard", never defends the number) | MED | The single biggest ask of the user — 8 weeks of their life — carries the least on-screen justification. |
| 5 | "$399 · lab test included" — included from which lab? | NO ANSWER (vendor/panel/certification unnamed site-wide) | MED | Buying an unnamed lab test feels like buying an unnamed airline ticket. |
| 6 | "What do you do with my health data?" asked *inside* the app | BURIED (good Privacy policy, reachable only from marketing-site footer; app has no privacy/account/data settings) | MED | The answer exists and is decent — it's just absent at the exact moments data is collected. |
| 7 | "Can I quit, what's refunded, can I export my data?" | BURIED + soft ("good faith", "contact us") | MED | A skeptic reads vague refund language on a one-time $399 as "no." |

Trust wins worth keeping (the product argued back well): the IgG-is-a-hypothesis honesty
(FAQ + Science), the Suspect Board explainer with real dates, the review-before-submit
summary, the slip-vs-blank streak ethics, the Household Card's "nothing else" minimalism,
and the itemized Pricing page.

## Stay or walk?

The Doubter stays — on probation. What keeps them in is genuinely unusual for this category:
the product pre-empted their sharpest objection ("IgG tests are pseudoscience") on its own
Science page and keeps promising verdicts "earned, never assumed," with mechanics and dates
shown rather than asserted. What nearly walks them is that the two moments where a *human*
is promised — "we've reviewed them" and "personally reviewed" — have no face, no name, no
qualification, and in this run the "review" completed in four seconds; plus the AI's first
answer invented a practitioner. The single answer that would most win them over: put a named
human on the review step — "Your results were reviewed by Alex M., founder, on Nov 6 —
here's what I checked and why these 3 foods for 8 weeks" — because every other doubt in this
log (the 8 weeks, the Low-flag ban, the data handling) becomes askable-of-a-person the
moment one visibly exists.

---
Screenshots: FT2_01–03 (landing, sign-in, dashboard), FT2b/c/d (lab entry → review →
post-submit), FT2e (legend, support, reintro, verdicts), FT2f (suspect-how, household, ask),
FT2g (ask answer), FT2i–l (FAQ, privacy), FT2p (science, pricing, about).
Console errors: none observed on any screen this run.
