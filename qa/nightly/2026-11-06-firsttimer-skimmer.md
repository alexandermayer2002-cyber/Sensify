# First-Timer — 2026-11-06 — Persona: the Skimmer

Fresh-eyes comprehension walk, day 0. Account: `alexandermayer2002+robotfftimer1@gmail.com`
("Fiona Tester"), 430x932, live site. No source, no prior reports read before the walk.
Screenshots: scratchpad `qa/FT1_*`. Scoring UNDERSTANDING, not bugs — severity here means:
HIGH = a real tester would stall or do the wrong thing in their protocol; MED = confusion
they'd push through; LOW = momentary wobble.

## Confusion log (in order encountered)

1. **HIGH — "Get started" goes straight to a Stripe payment page.**
   Copy: header button "Get started"; hero "Start your program".
   Believed: tapping it starts signup or a questionnaire. Truth: it navigates directly to
   `checkout.stripe.com` for the $399 charge — no account, no interstitial, no recap of what
   I'm buying. The skimmer did not absorb the "$399 · one payment" line below the hero; the
   first thing the product ever asks of me is my card. Churn moment #1.

2. **HIGH — There is no way in without paying; the sign-in screen loops me back to checkout.**
   Copy: "Don't have an account? Get started."
   Believed: that link creates an account. Truth: it returns to the $399 Stripe page. A curious
   non-payer has literally no path: no trial, no account-first flow, no "browse the app." The
   only other door is "Paid but never finished setting up? Continue here" — which I haven't.
   Day-0 truth: pay blind or leave. (Walk continued via the QA test-email door.)

3. **LOW — Post-payment account screen is good.** "Payment received. Your program is paid for.
   Now let's create the account it lives in" — clear, reassuring, no finding beyond praise.

4. **LOW — "Your daily check-in ritual" interstitial before I've ever seen a dashboard.**
   Copy: "Every evening, take 30 seconds on your dashboard… did you stay on plan."
   Mild wobble: I have no plan yet, and "stay on plan" is my first meeting with the idea that
   there will be one. Copy itself is friendly; it's just early.

5. **MED — Day-0 dashboard leads with jargon the product hasn't defined.**
   Copy: nav tabs "Reintro", "Verdicts", "Ask"; card "Your elimination list will appear here
   once your lab results are uploaded **and approved**"; "Weekly check-in — Opens at the end
   of week 1 — Locked."
   Believed: nothing — these are vocabulary I don't have yet. Never told: what "Reintro" is,
   what a "Verdict" is (landing explained it, but skimmers skim), **who approves my lab
   results and how long that takes**, and when "week 1" starts (today? when results arrive?).

6. **LOW — Mystery "⏱ TM" button on the dashboard.** An unlabeled icon-button between cards.
   No idea what it does; looks like leftover debug UI to a customer. Wobble + slight
   trust ding.

7. **MED — Consent gate is a text wall with an unexplained dead button.**
   Copy: "BEFORE YOU BEGIN — A few things to understand first" + ~8 paragraphs, then
   "Type your full name as your signature" + a required checkbox + an optional one.
   Skimmer behavior: scroll to the bottom, type name, tap "I agree, start my intake" — dead
   until the (easy-to-miss) required statement row is ticked, with no message saying so.
   Jargon used here before anything explained it: "elimination and reintroduction protocol",
   "compliance history."

8. **MED — Step 2: Continue is silently disabled on a long multi-question page.**
   Copy: "STEP 2 OF 5 — Tell us about your symptoms" (6 required questions).
   Believed: I can tap Continue when I've answered "enough." Truth: button dead until every
   question is answered; nothing highlights what I missed. Skimmer taps Continue early,
   nothing happens, scrolls back hunting.

9. **HIGH — Step 3 flips the scale direction mid-page and nothing warns you.**
   Copy: Q1 "rate your bloating — None at all (1) … Severe (10)"; Q2 same; Q3 "rate your
   overall digestive comfort — **Very uncomfortable (1) … Very comfortable (10)**."
   Believed (as a skimmer pattern-tapping ~6): high number = lots of symptoms, same as the
   two questions above. Truth: on Q3 high = feeling GREAT. I rated bloating 6/10 and comfort
   6/10 in the same breath and the product accepted the contradiction without a murmur.
   The screen itself says "This becomes your baseline, and everything you improve gets
   measured against it" — so a skimmed Q3 quietly corrupts the number the whole program
   measures against. A real tester does the wrong thing and never knows.

10. **HIGH — "Your progress saves as you go" is not true across sessions, and consent must be
    re-signed every time.**
    Copy (dashboard): "15–20 minutes, and your progress saves as you go."
    Believed: I can leave mid-survey and resume. Truth: leaving and re-entering the intake
    put me back at STEP 1 OF 5 each time, behind the full "Before you begin" legal gate,
    signature and all, again. Observed on three consecutive re-entries. A real tester who
    gets interrupted at minute 12 loses everything and re-signs a consent form; many won't
    start over.

11. **HIGH — Step 5 sleep field: the decimal key does nothing, absurd values are accepted,
    then the submit button dies with no explanation.**
    Copy: "On a typical night, how many hours do you sleep? — *to the half hour is fine*."
    Believed: the numpad's "." key enters 7.5. Truth: tapping 7 → . → 5 produces **"75
    hours"**, which the field happily displays; no validation message anywhere; then
    "Complete intake →" is greyed out with zero explanation (screenshot FT1_02_step5_probe:
    every question answered, button dead). The product invites half-hours, makes them
    unenterable, accepts the garbage, then silently blocks you for it. A tester with a typo
    stalls at a dead button on the last screen of a 20-minute survey.

12. **HIGH — "Upload your lab results to begin" — I was never told how I get tested.**
    Copy (post-intake dashboard): "ACTION NEEDED — Upload your lab results. PDF, photo, or
    manual entry." Plus card: "YOUR LAB KIT — Done with your test?"
    Believed: the app would tell me what happens next. Truth: nothing anywhere on day 0 says
    a kit ships to me, when it arrives, what kind of test it is, or what to do while I wait.
    The landing page's "at-home lab test included" is the only clue I ever got, and it's
    gone now. I'm being asked for results I have no way to possess. This is THE day-0 stall.

13. **MED — Upload screen assumes lab vocabulary.**
    Copy: "Enter only the foods that **showed a reaction**. Anything you leave out is
    **treated as clear**."
    "Reaction" and "clear" are lab-report words I've never been given; also "Read my results"
    and "Enter manually instead" render as one run-together line at the bottom. No path on
    this screen for "I don't have results yet."

14. **MED — Reintro and Verdicts tabs do nothing when tapped.**
    Believed: tapping a nav tab opens that section (Ask does — it shows a nice "LOCKED ·
    UNLOCKS WITH YOUR RESULTS" preview, the best locked-state copy in the app). Truth:
    Reintro and Verdicts leave me on the dashboard with no feedback at all — no locked
    screen, no toast. Skimmer conclusion: "the app is broken."

15. **MED — "I took my test" is one tap, no confirmation, no undo, no acknowledgement.**
    Copy: "Done with your test? Tell us so we know your results are on the way. — I took my
    test."
    Believed: tapping it opens something (maybe the upload). Truth: the card silently
    disappears and the system now believes my results are in the mail. No confirm dialog, no
    "great — here's what happens next," no visible way to take it back. A skimmer who taps
    it out of curiosity has lied to their own protocol.

16. **LOW — "Your sky is waiting… At 28 nights they form a constellation, and pattern
    detection unlocks."** Charming, but "28" is a number with no origin, "pattern detection"
    is an unexplained feature, and "OPENS WITH DAY 1" names a Day 1 nobody has scheduled.

## What I believed vs what was true

| Screen | The copy said | I believed | The truth |
|---|---|---|---|
| Landing | "Get started" | Start signup | Straight to $399 Stripe checkout |
| Sign in | "Don't have an account? Get started" | Create free account | Loops back to checkout; no free path |
| Intake step 3 | "…Very comfortable (10)" | High = worse, like Q1/Q2 | Scale flipped; high = better; baseline corrupted |
| Dashboard | "progress saves as you go" | Can resume mid-survey | Restarts at Step 1 + re-sign consent |
| Step 5 | "to the half hour is fine" | "." enters 7.5 | "." dead → "75 hours" accepted → submit silently disabled |
| Dashboard | "Upload your lab results to begin" | App will tell me how to get tested | No kit/shipping/timeline info exists anywhere |
| Nav | "Reintro" / "Verdicts" tabs | They open sections | Tap does nothing, no locked state |
| Lab kit card | "I took my test" | Opens a flow | One-tap irreversible state change, no confirm/undo |

## The 3 biggest "the product never told me X" gaps

1. **How and when I get tested.** Nothing after payment mentions the lab kit shipping, what
   the test measures, the timeline, or what to do while waiting — yet the dashboard's only
   ACTION NEEDED is to upload results I cannot have.
2. **Who "approves" my results and when my program actually starts.** "Uploaded and
   approved," "week 1," "Day 1," "28 nights" — every clock in the app references a start
   moment the product never defines for me.
3. **That the only way in is $399 up front.** No screen between "Get started" and a card
   form; the skimmer learns the price from Stripe.

## Would the Skimmer come back tomorrow?

Grudging yes — once, then a lapse. Having (notionally) paid $399, sunk cost plus the single
clear ACTION NEEDED card would pull me back one more time. But tomorrow looks exactly like
today: I can't upload results I don't have, the daily check-in is locked until a "Day 1"
nobody has scheduled, both middle tabs do nothing, and the app has given me no reason or
date to return ("your kit arrives ~X; we'll email you" does not exist). The Ask preview is
the one thing that made me want the product. Prediction: I open it tomorrow, see the same
screen, and don't open it again until an email makes me — and the product hasn't promised
me any email. The shipping-window silence is where the Skimmer is lost.

## Tally

HIGH 6 (items 1, 2, 9, 10, 11, 12) · MED 6 (5, 7, 8, 13, 14, 15) · LOW 4 (3, 4, 6, 16) — 16 logged items, 15 findings + 1 praise.
Note: six items are marked HIGH above; the two account-wall items (1, 2) may be deliberate
business design — if so treat them as one HIGH "price revealed by Stripe" finding and the
tally is HIGH 5.

*Longitudinal state left behind: intake complete (sleep 7h, stress Moderate, F, no alcohol,
staples Wheat/Milk/Egg/Coffee daily); "I took my test" has been tapped; no lab results
uploaded. Next persona run picks up from lab-pending.*
