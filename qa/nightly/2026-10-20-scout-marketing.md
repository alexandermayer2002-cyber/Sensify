# Nightly Scout — Marketing Page — 2026-10-20

Area 0 (day 20 mod 10). First nightly scout report; no prior nights to build on.
Walked all six marketing tabs on the live site at 430px (headless Chromium, 2x), plus
/privacy.html and /terms.html. Read src/pages/Marketing.js (1,172 lines), public/privacy.html,
netlify/functions/create-checkout.js, and cross-checked claims against Onboarding.js,
IntakeSurvey.js, LabResults.js, Dashboard.js, Signup.js.

**Regression context:** 20/20 checks passed this run (regress_summary.json, stamp 2610200325).
No FAIL lines.

## What's solid

The page earns its $399 look on a phone. No horizontal overflow on any of the six tabs at
430px, the ≤500px hamburger menu works, FAQ accordions and the five-screen product showcase
all function, console is clean, and privacy/terms both return 200. The dark hero, phone
showcase, and verdict chips are the strongest visual assets. The problems below are almost
all *copy integrity*, not design.

## Ranked findings

### 1. CHANGE — The lab-kit story contradicts itself three ways, and no version is backed by code  ⚑ COPY PROMISE FLAG
**Why:** The FAQ page says the kit "ships to your door after you purchase... from our certified
lab partner... nothing to order yourself" (Marketing.js:304, 843–844); the home FAQ and the
pricing checklist instead say "we guide you through ordering your food sensitivity test during
onboarding — we tell you exactly which test to get" (Marketing.js:783, 1080). Those can't both
be true, and as coded *neither* is: no shipping address is collected anywhere (not signup, not
Stripe checkout — create-checkout.js has no shipping_address_collection), Onboarding.js contains
zero test-ordering guidance, and post-purchase the app just says "Upload your lab results" with
an "I took my test" button (Dashboard.js:1838). "Results arrive in about a week" is likewise
unverifiable with no lab integration. This is the single most dangerous promise on the site for
a $399 one-time purchase.
**How:** Pick the true fulfillment story, rewrite all three surfaces to match, and if kits
really ship, add `shipping_address_collection` to the Stripe session; if the user orders their
own, add the promised which-test-to-get guidance screen to onboarding.

### 2. CHANGE — Privacy Policy promises SMS reminders and phone-number collection that don't exist  ⚑ COPY PROMISE FLAG
**Why:** public/privacy.html declares collecting "mobile phone number" and sending "daily SMS
check-in reminders and reintroduction [notices]" — the product has no phone field anywhere and
no SMS/Twilio code in src/ or netlify/functions/. Over-declaring collection is needless legal
surface, and a buyer who expects SMS reminders will miss check-ins waiting for texts that
never come.
**How:** Delete the phone/SMS clauses from privacy.html (or note them as "if/when offered"),
and bump the Last-updated date.

### 3. CHANGE — Hero timeline undersells the program by ~4 months
**Why:** The hero says "Eight structured weeks of real data give the verdicts," but verdicts
come from reintroduction, which the How page itself labels "Months 2–6," and the example card
on the same home page says "WHAT 184 DAYS OF TESTING PRODUCES." A buyer anchored on 8 weeks
will feel misled around week 9, exactly when retention matters.
**How:** Reword to something like "Eight weeks of clean baseline, then a verdict for every
food, one 14-day test at a time."

### 4. ADD — Ask Sensify is missing from the pricing checklist
**Why:** The hero's included-list names Ask Sensify and the showcase gives it a whole screen,
but the 10-item pricing checklist (Marketing.js:1078–1089) — the page a buyer reads with their
card out — never mentions it; only the fine-print note vaguely says "AI guidance."
**How:** Add a checklist line ("Ask Sensify: check any food, menu, or meal against your
results") between the daily-check-ins and verdicts items.

### 5. DELETE — ~200 lines of dead CSS and empty elements in Marketing.js
**Why:** The embedded stylesheet carries whole retired layouts no JSX references: .mk-wordmark
+ mkLetterRise/mkDotStamp, .mk-three/.mk-3*, .outcome-*, .how-steps/.how-step/.how-n/.how-tag,
.dark-strip/.ds-*, .mk-proof*, .fmcard-cat/-chip/-row (the .fmcard.inview chip animation now
animates nothing), the duplicated .mk-tab:hover rule (lines 35–36), the .mk-priceline /
.mk-price-line twin tokens (only the latter is used), and .mk-tag-dot is display:none yet an
empty div is rendered in every subpage hero. Dead weight ships to every visitor and misleads
the next editor.
**How:** Delete the unused rules and the empty mk-tag-dot divs; keep mk-price-line.

### 6. CHANGE — "clinically validated method" overstates what the science page itself claims
**Why:** The How page calls the 3+11 exposure-washout pattern "the clinically validated method"
(Marketing.js:910), while the more careful Science page says "built on the clinical standard" /
"follows the clinical elimination diet method." Elimination-reintroduction is indeed the
clinical standard; Sensify's specific 3-day/11-day split being "clinically validated" is a
stretch a skeptical $399 buyer (or a regulator) can poke at.
**How:** Reuse the Science page's phrasing: "modeled on the clinical elimination-diet standard."

### 7. CHANGE — Founder voice flips between "I built this alone" and "our team reviews every case"
**Why:** The home CTA note says "I built Sensify alone," while the FAQ/Science/How pages say
"our team reviews every case personally" and About speaks as "we." Human review does exist
(admin dashboard + compliance audit), so nothing is false, but the mixed voice reads as padding
right where the founder note is trying to buy trust.
**How:** Pick one voice; "every case is reviewed personally — by me" is arguably the stronger
sell for a solo-built product.

## Still open from prior nights
None — this is the first nightly scout report.
