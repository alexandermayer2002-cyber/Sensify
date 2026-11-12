# SCREENS.md: Sensify design inventory (read-only)

Scope: every screen x state a person meets from sign-up to Maintain. Marketing excluded. No styling proposals, no code. Written for designers who must not invent data.
Evidence: robot accounts on the QA site, 1440x900 and 390x844, screenshots in `/tmp/claude-0/-home-claude/512e85e3-e74e-5efe-bd56-1a6472a82975/scratchpad/inventory/` (file prefix = account: A flagged 3 foods, B single food, D early/auth, E probes). Each entry says **Rendered** or **From code, not rendered**.
Rig caveat: the time machine (test-skip) shifts dates in UTC and inflates day counters ("Protocol Day 133", "120 days of your record", "Day 134"). Those counters are rig artifacts, not findings. The labels around them are.

---

## 1. System

### 1.1 The one question per phase
| Phase | The question the person is asking | The product's answer |
|---|---|---|
| Pre-intake / intake | Is this worth my time, is it safe? | What we need and why; nothing else |
| Awaiting lab / under review | Did you get my results? | Yes, here is what happens next |
| Elimination 1-7 | Am I doing it right? | Yes. Do this one job. Log tonight |
| Elimination 8-35 | Is it working, is anyone looking? | Your record is building; here is how sharp your normal is |
| Elimination 36-56 | When does testing start? | Day 57; here is your order |
| Reintro exposure (cycle day 1-3) | Did I eat it, did it hurt? | Log it. Nothing is concluded yet |
| Reintro washout (day 4-14) | What am I waiting for? | Avoid it; log; the verdict arrives on day 14 |
| Verdict day | What did it do? | One survey, then one ruling |
| Between cycles | What is next? | The next suspect |
| Program complete | What did I learn, did it help? | Your map; one outcome question |
| Maintain | What do I do with the map? | Use it (Ask, report a symptom) |

### 1.2 Data that exists vs does NOT exist, by phase
| Phase | Exists | Does NOT exist (never draw, never color, never imply) |
|---|---|---|
| Pre-intake | Name, nothing else | Foods, level, any plan |
| Intake | Self-reported symptoms, 4 baseline scores, per-food frequency, lifestyle | Lab, plan |
| Awaiting / under review | Intake; lab entry (manual, upload, or "no sensitivities") once submitted | Suspect list (until approved), protocol_start_date, streak |
| Elim 1-7 | Daily rows, on-plan flag, sleep/stress/water, off-today note, recall text, the lab-level of each suspect, baseline sharpness (a range, not a score) | Symptom curve (needs a week), weekly insight, any verdict, any "change vs baseline" |
| Elim 8-35 | Above + weekly check-ins (scores 1-10), compliance history, a narrowing baseline | Verdict, "improved", any projected end result. Projected dates are schedule, not outcome |
| Elim 36-56 | Above + near-final baseline | Verdict, tested-food data of any kind |
| Reintro | Per-cycle: exposure logs (ate Y/N, serving, symptom, intensity), washout logs, survey answer, cycle clock | A verdict before day 14 (except severe stop, which is Avoid immediately). A verdict for a food with zero exposure logs ("nothing to rule from") |
| After a ruling | verdict + evidence line + conflicted flag | Certainty beyond the evidence ("you tolerate X forever"); a final map until every suspect is ruled |
| Program complete | 3 or N rulings, outcome score (0-10, asked once) | Any "tested for N days" figure not counted from logged days |
| Maintain | Map, activity log, symptom reports | Drift detection output (promised, not built), re-test scheduling |

Verdict colors (teal Safe, amber Limit, red Avoid) exist only after a ruling. Before a ruling, suspect/on-trial states use the neutral label system only.

### 1.3 Copy voice (condensed)
Present tense, plain words, second person. "the lab finds suspects, the body gives the verdict". Measured, never assumed: a number is printed only if it was counted. No em-dashes, no italics, no emojis, no exclamation marks. One label system (.sn-micro). Copy is frozen: proposals below are placeholders that name the job, to be matched against frozen strings by the owner. Ruling screens keep stillness: one thing, no motion, no side cards. Never "you tolerated X well" as a permanent claim; the verdict is for this trial.

---

## 2. Entries

### Auth / Login (and error, forgot password)
- Person's question right now: Can I get back in?
- Headline (the one thing): Sign in to your program.
- Primary action: "Sign in" -> Home (or the phase-correct screen).
- Hero evidence: Email + password fields. Error: `auth.error.message`.
- Everything else: 1) "Forgot password?" 2) "Continue here" paid-door link.
- Must not appear: Marketing, program claims, any verdict language.
- Today: Rendered (D_03 forgot, D_04). Functional, quiet. Two exits (forgot, paid-door) look the same weight as the main action. Wrong-credential error reads as a generic server string.
- Data gaps: none.

### Auth / Paid but not set up (resume door) and not found
- Person's question right now: I paid. Why am I not in?
- Headline (the one thing): Enter the email you paid with.
- Primary action: "Continue" -> signup page (found) or inline not-found message.
- Hero evidence: `email` input; lookup result (`paid` true/false).
- Everything else: 1) Short reason this door exists ("your payment is saved, now create your login") 2) Support contact.
- Must not appear: Language implying the payment failed; a spinner without an outcome.
- Today: Rendered (D_04 door, D_05 not-found). The door does not say why it exists or what happens next. Not-found gives no support route. CRITIC D03.
- Data gaps: no payment timestamp or plan shown to reassure.

### Auth / Signup after payment
- Person's question right now: Is my payment in, what do I set?
- Headline (the one thing): Payment received. Create your login.
- Primary action: "Create account" -> Onboarding ritual.
- Hero evidence: Banner `payment_received` + name/email/password.
- Everything else: 1) Terms line.
- Must not appear: Program promises beyond what intake/lab will say.
- Today: Rendered (D_06). Works. Email confirmation is on in production, so a person strands at "check your email" with no designed state (not captured; test door bypasses it).
- Data gaps: confirm-email waiting state not reachable by robot. From code: it is a plain message.

### Onboarding / Check-in ritual
- Person's question right now: What am I committing to?
- Headline (the one thing): One check-in each evening, about a minute.
- Primary action: "Go to my dashboard" -> Home pre-intake.
- Hero evidence: Ritual statement (time cost, time of day).
- Everything else: none.
- Must not appear: Outcome promises.
- Today: From code, not rendered (the robot skips past it). Onboarding.js shows the ritual card once.
- Data gaps: none.

### Home / Pre-intake
- Person's question right now: What do I do first?
- Headline (the one thing): Start your intake survey.
- Primary action: "Start intake survey" -> Intake consent.
- Hero evidence: Intake progress (`intake_step` of 5, saved draft yes/no).
- Everything else (max 5): 1) "I took my test" only after intake 2) Time estimate "15-20 minutes".
- Must not appear: Weekly check-in card, Currently avoiding, Symptom trends, Getting started insight, locked tabs explained, any food names.
- Today: Rendered (D_07 d/p). About six cards for a person with one job: intake CTA, "I took my test", "Currently avoiding: No foods yet", "Getting started" insight, "Weekly check-in: Locked", "Symptom trends: Complete your intake survey". Four of them describe things that do not exist. The "I took my test" card offers lab entry before intake is done. Copy says "8 weeks" and "usually within a day" (a promise). Ledger D05.
- Data gaps: none; the screen is empty by design.

### Intake / Consent
- Person's question right now: What am I agreeing to?
- Headline (the one thing): A few things to understand first.
- Primary action: "I agree, start my intake" -> Step 1 (disabled until tick + typed name).
- Hero evidence: The agreement checkbox + typed signature `full_name`.
- Everything else: 1) Six plain-language points (not medical advice, AI informational, data shared with team, self-report, "finding no triggers is a valid result", daily check-ins) 2) Optional research consent, separate.
- Must not appear: Dense paragraph walls; research consent pre-ticked.
- Today: Rendered (D_13). Strong honest content, but it is a long single scroll and the disabled button explains itself only in small text below. No allergy / anaphylaxis gate anywhere at intake (ledger P01): a person with a true food allergy is not asked before reintroduction is ever planned.
- Data gaps: none.

### Intake / In progress (steps 1-5, resume)
- Person's question right now: How long is this and is it saved?
- Headline (the one thing): <Step title> (step <n> of 5).
- Primary action: "Continue" -> next step (last: "Finish").
- Hero evidence: The current step's answers (goals; symptoms+duration; 4 baseline scores 1-10; per-food frequency; sleep/sex/lifestyle) and `step n of 5`.
- Everything else: 1) Back 2) "Progress saves".
- Must not appear: A fifth step label that the person cannot see ahead; any lab or verdict talk.
- Today: Rendered (D_14-D_17; step 5 captured by flow only). Resume after reload works (draft). Frequency step is what later orders the testing queue and that dependency is not told to the person. Baseline scores are what later becomes "your normal" and are asked as bare numbers.
- Data gaps: none. Step 5 not screenshotted.

### Lab entry / Chooser
- Person's question right now: How do I give you my results?
- Headline (the one thing): Add your lab results.
- Primary action: "Upload PDF" or "Manual entry" -> that path.
- Hero evidence: Three path tiles (PDF, photo, manual) with `accepted formats`.
- Everything else: 1) "My report shows no sensitivities" lives inside manual 2) Privacy line.
- Must not appear: Any suspect list; the word "approved".
- Today: From code, not rendered (the robot's intake stalled before this screen on accounts C and D; invalid shots were discarded). LabResults.js: path chooser then form.
- Data gaps: none known.

### Lab entry / Manual entry (empty, filled, review)
- Person's question right now: Did I type this right?
- Headline (the one thing): Check your entry before you submit.
- Primary action: "Looks right, submit for review" -> Home lab under review.
- Hero evidence: List of `{food, level}` rows (High / Moderate / Low).
- Everything else: 1) "Review my entry" step 2) Edit.
- Must not appear: Foods the person did not enter; a count of "suspects" before approval.
- Today: From code, not rendered. The robot did submit this flow on accounts A and B (review/submit worked), but screenshots were not captured. Ledger D06/D07/D08 (lab path), D09 (instant approval reads fake: on the test door approval is immediate).
- Data gaps: none.

### Lab entry / Upload (PDF or photo) and extraction review
- Person's question right now: Did you read my report correctly?
- Headline (the one thing): Here is what we read. Fix anything that is wrong.
- Primary action: "Looks right, submit for review" -> Home lab under review.
- Hero evidence: Extracted `{food, level}` rows + the source file name.
- Everything else: 1) Unreadable-file error 2) Switch to manual.
- Must not appear: Silent auto-submit; confidence numbers we did not compute.
- Today: From code, not rendered. Extraction failure and low-confidence states have no designed copy in the repo beyond a generic error.
- Data gaps: no per-row confidence; no way to see the source next to the rows.

### Lab entry / "No sensitivities"
- Person's question right now: My report is clean. What happens now?
- Headline (the one thing): Your report shows no sensitivities.
- Primary action: "Submit for review" -> Common-track decision.
- Hero evidence: Toggle state `no_sensitivities=true`.
- Everything else: 1) What the common track is in one sentence.
- Must not appear: A zero-food suspect list presented as a result.
- Today: From code, not rendered (toggle lives in manual entry).
- Data gaps: none.

### Home / Awaiting lab
- Person's question right now: Intake done. Now what?
- Headline (the one thing): Add your lab results.
- Primary action: "Upload results" -> Lab entry chooser.
- Hero evidence: Intake-complete flag + (`lab_path` chosen: manual, upload, none).
- Everything else: 1) "I took my test" status if results not yet in 2) Weekly check-in locked, one line.
- Must not appear: Currently avoiding, trends, insights, Ask preview with sample verdicts.
- Today: From code, not rendered (Dashboard.js showLabCard: "Your intake is complete. Upload your lab results to begin."). Same six-card stack as pre-intake plus an "Upload your lab results" card.
- Data gaps: none.

### Home / Lab under review
- Person's question right now: Have you got my results, when do I start?
- Headline (the one thing): Your results are in. We are reviewing them.
- Primary action: none (nothing to do). If anything: "Back to intake summary" is not needed.
- Hero evidence: `lab_results.status='pending_review'`, `submitted_at`.
- Everything else: 1) What review means, one line, no time promise we cannot keep 2) "What you can do now": nothing.
- Must not appear: Suspect list, avoid list, "usually within a day" unless measured, any day counter.
- Today: From code, not rendered (rigged under-review shots on D were invalid because intake was incomplete). Dashboard state is `program_phase='pending_review'`. Approval is operator-driven in production; the test door approves instantly, which hides the real wait (ledger D05/D09).
- Data gaps: no review ETA data exists.

### Common track / Decision (Test 2 or Test 8, per-food frequency)
- Person's question right now: Nothing flagged. What now?
- Headline (the one thing): Choose how you want to test.
- Primary action: "Start my protocol" -> Elimination day 0.
- Hero evidence: `tier` (Test 2 | Test 8) + per-food `frequency`.
- Everything else: 1) "I'd rather just track for now" -> Tracking landing.
- Must not appear: Any lab level colors; implying a verdict exists.
- Today: From code, not rendered (CommonTrackDecision.js; the C account never reached it: intake stalled, shots discarded).
- Data gaps: none.

### Tracking landing (track only)
- Person's question right now: What am I doing without a protocol?
- Headline (the one thing): You are tracking. No protocol yet.
- Primary action: "Start the full protocol" -> Common-track decision.
- Hero evidence: Today's check-in + `tracking_since`.
- Everything else: 1) Locked tabs list.
- Must not appear: Phase labels (Day N of elimination), suspect board.
- Today: From code, not rendered (TrackingLanding.js).
- Data gaps: no baseline sharpness until intake baselines exist.

### Home / Day 0 (set, starts tomorrow)
- Person's question right now: I am set up. When does it start, what is off my plate?
- Headline (the one thing): Day 1 begins tomorrow. Here is what leaves your plate.
- Primary action: "See your first-week guide" -> guide sheet (or none today).
- Hero evidence: `avoid_list` (name, lab level) + `protocol_start_date`.
- Everything else (max 5): 1) Start date 2) Household card link 3) Check-in time 4) What to do tonight (nothing).
- Must not appear: Suspect Board with "Trial opens ~<date>" dates, a "Currently avoiding" list that duplicates the board, Weekly check-in locked card, a strip with "Day 56".
- Today: Rendered (A_01_day0_home). "ELIMINATION PHASE: Starts tomorrow" hero is good. Then the Suspect Board prints three projected dates (Trial opens ~Jan 7, Jan 21, Feb 4) and "0 OF 3 RULED", then the same three foods again as "Currently avoiding" colored by lab level, then a Household card, then Weekly "Locked". Two lists of the same foods. Projected dates are not measured. Ledger D11, D13, F10.
- Data gaps: dates are schedule only.

### Home / Elimination day 1 (before log)
- Person's question right now: What do I do today?
- Headline (the one thing): Day 1 of elimination. Log tonight's check-in.
- Primary action: "Tonight's check-in" -> Daily check-in.
- Hero evidence: `day_number`, today's logged flag.
- Everything else (max 5): 1) Day 1 briefing (what changes, how this week may feel, your one job) 2) Streak "starts with your next check-in" 3) Baseline sharpness "1 day logged" 4) Suspect board collapsed.
- Must not appear: "Today logged" before a log; Weekly locked card; Protocol "Day 1" card that repeats the hero.
- Today: Rendered but contaminated: A_01_day1_home_before_log shows "Today logged" and streak 1 (rig backfill). The cycle-day-1 home (A_01_cycle1_d1_home_before_log) shows the correct pre-log streak state ("STREAK STARTS WITH YOUR NEXT CHECK-IN"). The briefing is AI-written, long, and shown as a dismissible card. Strip end label reads "DAY 56 · REINTRODUCTION" (a projected day, as fact). Ledger F02, F04.
- Data gaps: Day-1 briefing depends on an AI call that may be empty.

### Home / Elimination early (days 2-7), after log
- Person's question right now: Did my check-in count, am I on track?
- Headline (the one thing): Day <n> of elimination. Logged.
- Primary action: "See your week" -> History (or none).
- Hero evidence: 14-day strip (`on_plan`, `slipped`, `no_check_in`, `away`), streak `n`.
- Everything else (max 5): 1) Day briefing for milestone days (day 3 craving note, rendered) 2) Baseline sharpness (<n> days logged, range) 3) Weekly check-in opens day 7 4) Suspect board.
- Must not appear: Trial dates, symptom curve before a week of data, any "improving" word.
- Today: Rendered (A_12, A_13). Day-4 milestone message is warm and specific but long. Baseline Sharpness uses Still rough / Settling / Sharp, which is the correct, honest frame; the "±2.4" notation is raw. The Slipped dot uses red, which belongs to Avoid verdicts. Protocol card text ("Your first weekly insight will appear here...") repeats on every day until week 1 ends. Ledger D12, F10, F11.
- Data gaps: one week of data before any curve.

### Daily check-in / Elimination (default)
- Person's question right now: What do you need from me tonight?
- Headline (the one thing): Tonight's check-in.
- Primary action: "Done for today" -> payoff.
- Hero evidence: Today's row: `on_plan`, `sleep_hours`, `stress`, `water_cups`, `off_today`.
- Everything else (max 5): 1) Did you stay on your plan 2) Sleep 3) Stress 4) Water 5) "Anything off today" (optional).
- Must not appear: Intake-like questions; a recall box when nothing is off; any verdict.
- Today: Rendered (A_03/A_04, A_09). Eight to nine inputs with numpad popups for sleep and water. The optional "Anything off" is where the real data lives and sits last. Submit says "Done for today" which is also the label of the confirmation button after. Ledger F07.
- Data gaps: none.

### Daily check-in / Symptom-night recall
- Person's question right now: I felt bad. How do I say what I ate?
- Headline (the one thing): What was it? When did it hit? What did you eat?
- Primary action: "Done for today" -> payoff.
- Hero evidence: `symptom`, `timing`, free-text `recall` parsed into foods.
- Everything else (max 5): 1) "WE READ IT AS" chips, each removable 2) "Memory after a symptom is a lead, never a ruling" 3) Skip is fine.
- Must not appear: Any claim that a food caused the symptom; inferred food added silently.
- Today: Rendered (A_07, A_10). The parser tags "Pasta (Wheat)", "Dairy" twice (duplicate chips). Good honest footer line. Parsed chips look like a result. Recall appears only under "Something mild/notable", not inside the reintro block. Ledger F07.
- Data gaps: parser can mis-read; the unread-food note is easy to miss.

### Daily check-in / Payoff (after submit)
- Person's question right now: Did that register?
- Headline (the one thing): Logged for today.
- Primary action: "Done" -> Home.
- Hero evidence: Streak `n`, today's cell on the strip filled.
- Everything else (max 5): 1) One line about what the log adds (one sentence) 2) Tomorrow's one job.
- Must not appear: Praise tied to outcomes; a projected finish.
- Today: Rendered (A_05, A_11). Equal in form to Home, with the milestone briefing still visible. The payoff is mostly a return to Home; the streak number is the only reward. Ledger F04 (post-log instruction).
- Data gaps: none.

### Weekly check-in / Form
- Person's question right now: Is this week different from baseline?
- Headline (the one thing): How was your week?
- Primary action: "Submit check-in" -> done screen.
- Hero evidence: Four 1-10 scores (bloating, gas/cramping, reflux, digestive comfort), overall (Better / Same / Worse), what changed, compliance, notes.
- Everything else (max 5): 1) What changed (multi-select) 2) Compliance 3) Notes 4) Header chip "Week <n>" 5) Back.
- Must not appear: Any earlier week's scores as an answer key; a verdict.
- Today: Rendered (A_14, A_15). One long scroll. The digestive comfort scale runs the opposite way to the three above and the fix is a warning box ("Heads up, this scale runs the other way"). Submit stays disabled until everything is touched and there is no hint which field is missing. The robot's own filled capture still showed Submit disabled, which is the point.
- Data gaps: none.

### Weekly check-in / Submitted
- Person's question right now: What did that tell you?
- Headline (the one thing): Week <n> is on the record.
- Primary action: "Back to dashboard" -> Home.
- Hero evidence: Week <n> scores vs baseline (`delta` per symptom) once a baseline exists.
- Everything else (max 5): 1) Weekly insight (AI) 2) Next window date.
- Must not appear: "Improved" when the change is inside baseline noise; red/green on change.
- Today: From code, not rendered (capture failed: the submit stayed disabled; A_16 equals the form). WeeklyCheckin.js shows an insight generating state then the insight, with a failure state.
- Data gaps: week-1 delta needs baseline.

### Home / Weekly check-in due and catch-up
- Person's question right now: Is the weekly check-in open, did I miss it?
- Headline (the one thing): Weekly check-in <due now | catch up>.
- Primary action: "Start" -> Weekly form.
- Hero evidence: `week_number`, window open/closed, on-time deadline (48h).
- Everything else (max 5): none.
- Must not appear: Locked card once open; two weekly cards.
- Today: Rendered (A day 24 home: "Catch up, your data still matters", "Due now, takes 2 minutes" at program complete). Reasonable. At program complete the card still says "Due now" next to "Your Food Map is complete".
- Data gaps: none.

### Home / Elimination mid (days 8-35)
- Person's question right now: Is it working?
- Headline (the one thing): Day <n> of elimination. <streak> day streak.
- Primary action: "Tonight's check-in" -> Daily check-in.
- Hero evidence: Symptom curve (weekly scores per symptom) with baseline reference; 14-day strip.
- Everything else (max 5): 1) Baseline sharpness 2) Weekly check-in 3) Suspect board (collapsed) 4) Household card 5) Weekly insight.
- Must not appear: "Improving", projected completion date, trial dates, green/red on change.
- Today: Rendered (A day-24 captures; the "day24" label shows Day 41 due to rig drift). Symptom trends graph colors change vs baseline in red and green. Strip end label "DAY 56 · REINTRODUCTION". The board repeats projected trial dates every day. Hero "Tonight's check-in" competes with a week-late weekly card. Ledger F10, F11, D11.
- Data gaps: curve is thin early (F11).

### Home / Elimination late (days 36-56)
- Person's question right now: When do I start testing and in what order?
- Headline (the one thing): Testing begins on day 57. Your order is set.
- Primary action: "Tonight's check-in" -> Daily check-in.
- Hero evidence: Ordered suspect list (`name`, `frequency`, `lab_level`) and days to day 57.
- Everything else (max 5): 1) Streak 2) Baseline sharpness near final 3) Last weekly.
- Must not appear: "First verdict possible ~<date>", "Projected map completion ~<date>", verdict colors.
- Today: From code, not rendered (the time machine overshot: A_03_day56 shows the day-57 unlock state with "REINTRODUCTION - DAY 49 - TESTING OPEN" and the strip "DAY 42 - MAP COMPLETE" next to "0 OF 3 RULED"). Dashboard.js prints projected first-verdict and map-completion dates here. Ledger D11.
- Data gaps: dates are schedule, flagged as assumption.

### Home / Streak 0 (starts with next check-in)
- Person's question right now: Where is my streak?
- Headline (the one thing): Your streak starts with your next check-in.
- Primary action: "Tonight's check-in" -> Daily check-in.
- Hero evidence: `streak=0`, strip with empty cells.
- Everything else: none.
- Must not appear: "0 day streak", "broken", red.
- Today: Rendered (A_01_cycle1_d1_home_before_log: a dash and "STREAK STARTS WITH YOUR NEXT CHECK-IN").
- Data gaps: none.

### Home / Streak active
- Person's question right now: Am I on track?
- Headline (the one thing): <n> day streak.
- Primary action: "Tonight's check-in" or none if logged.
- Hero evidence: `streak n`, strip.
- Everything else: none.
- Must not appear: "unbroken" claims without a count; praise.
- Today: Rendered (A_13: "7 DAY STREAK, UNBROKEN"; A_21: "15"). "Unbroken" appears from 3 days on, and the strip legend is a modal, not on-screen. Streak (consecutive logged days, floored at protocol start) disagrees with "DAYS LOGGED" in baseline sharpness (e.g. 98 vs a 1-day streak after a gap). Ledger F02, D12.
- Data gaps: none.

### Home / Streak broken
- Person's question right now: I missed days. Is it over?
- Headline (the one thing): Your streak restarts today. Your record stays.
- Primary action: "Tonight's check-in" -> Daily check-in.
- Hero evidence: `streak=0|1`, gap days on strip as "No check-in" (grey).
- Everything else: 1) Away attestation if gap >= 4 days.
- Must not appear: Red, shame words, "failed".
- Today: From code, not rendered (d3 not run; budget). Dashboard.js: gap cells render grey with a dash; "Slipped" cells use red and do NOT break the streak, which contradicts what red usually means.
- Data gaps: none.

### Home / Away gate (soft and hard)
- Person's question right now: I was gone. Does it matter?
- Headline (the one thing): Were you on your plan while you were away?
- Primary action: "Yes, I stayed on my plan" -> logs the away days as attested, streak paused.
- Hero evidence: `gap_days`, `soft (>=4) | hard (>=14)`.
- Everything else (max 5): 1) "No, I slipped" 2) Hard gap: clock restart explanation.
- Must not appear: A restart without explanation; blame.
- Today: From code, not rendered. AWAY_GATE SOFT_MIN 4, HARD_MIN 14. Soft gap: modal. Hard gap: forced restart, no screenshot.
- Data gaps: none.

### Home / Elimination weeks (check-in strip and symptom trends card)
- Person's question right now: What does my last 14 days look like?
- Headline (the one thing): Your last 14 days.
- Primary action: none.
- Hero evidence: 14-day strip.
- Everything else (max 5): 1) Symptom trend 2) Legend link.
- Must not appear: Red/green meaning change.
- Today: Rendered inside Home. Strip marks: check = teal-green, slipped = red, no check-in = grey, away = outline. Red on "Slipped" is a red that is not a verdict.
- Data gaps: none.

### History / Empty (before day 7) and one week in
- Person's question right now: What have I told you so far?
- Headline (the one thing): Your first entry opens on day 7.
- Primary action: none (or "Tonight's check-in").
- Hero evidence: Intake record (`goals`, `baselines`, `foods eaten most`) + schedule list.
- Everything else (max 5): 1) Program milestones 2) Week list as it forms.
- Must not appear: A start date earlier than the real day 1.
- Today: Rendered (A_04 day0; one-week capture lost to the weekly flow). At day 0 History says "Day 1: protocol started <today>" while Home says "Day 1 begins tomorrow". Likely a UTC date parse. Wording "protocol started" is wrong tense.
- Data gaps: none.

### Verdicts (Food Map) / Locked cover
- Person's question right now: Where is my map?
- Headline (the one thing): Your Food Map is earned, not predicted.
- Primary action: none (or "Back to Home").
- Hero evidence: `ruledCount=0`, `total`.
- Everything else (max 5): 1) What a verdict is, one line.
- Must not appear: Any food with a status other than "not tested"; teal.
- Today: Rendered (A day0/day24 verdicts cover). Pre-earning cover. In FoodMap.js, the live "On trial." card uses teal with a teal wash before any ruling, which borrows the Safe color (ledger P05 related).
- Data gaps: none.

### Verdicts (Food Map) / Partial (1 of 3 ruled)
- Person's question right now: What do I know so far?
- Headline (the one thing): <ruled> of <total> foods ruled.
- Primary action: "Download your Food Map" -> PDF (partial).
- Hero evidence: Verdict card for each ruled food (`food`, `verdict`, `trial_days`, `evidence line`); next = "Next", rest = "Awaiting".
- Everything else (max 5): 1) Trial strip (ate, washout, no symptoms, symptoms) 2) "Tap any trial for its full record" 3) Day counter.
- Must not appear: Teal on "Next"; "Verified" banner; "Every verdict, earned" while anything is unruled.
- Today: Rendered (A_23). Reads well. The intro line says "120 days of your record later" (rig). The Download button invites a PDF for a map that is a third built.
- Data gaps: none.

### Verdicts (Food Map) / Complete (3 of 3)
- Person's question right now: Done. What is my map?
- Headline (the one thing): Every verdict, earned.
- Primary action: "Download your Food Map" -> PDF.
- Hero evidence: All verdict cards, `verdict`, `trial_days`, `stopped_early`.
- Everything else (max 5): 1) Trial strips 2) Outcome (if recorded).
- Must not appear: Crab "Avoid" presented the same as a 14-day Avoid when it was a 1-day stop.
- Today: Rendered (A_05_verdicts_complete). Cards are identical for a 14-day trial and a one-day severe stop: DAY 133 to 134 earns the same "Avoid." weight. The header reads "VERIFIED".
- Data gaps: `stopped_early` is not shown.

### Food Map PDF (partial and complete)
- Person's question right now: Can I take this to my doctor/household?
- Headline (the one thing): <Name>'s Food Map.
- Primary action: n/a (document).
- Hero evidence: Verdict cards (food, verdict, one evidence line), Not yet tested list, provenance micro "EARNED FROM <n> DAYS OF TESTING".
- Everything else (max 5): 1) Echo line from intake 2) Method line 3) Printed date.
- Must not appear: "ruled by a 14 day single-food trial" on a stopped-early food; a day count not equal to the cards.
- Today: Rendered (foodmap_partial_1of3.pdf, foodmap_complete_3of3.pdf). Partial reads "4 DAYS OF TESTING" above "14 day single-food trial". Complete reads "9 DAYS" over three trials and the Crab card says "Stopped early after a severe reaction" while the sentence above says every verdict is a 14 day trial. F03 is only half-fixed: the number is honest, the method sentence is not. Page has no allergy / medical referral line.
- Data gaps: none.

### Reintro tab / Locked during elimination
- Person's question right now: When can I test?
- Headline (the one thing): Reintroduction opens on day 57.
- Primary action: none.
- Hero evidence: `days_remaining` (counted), ordered list.
- Everything else (max 5): 1) Order logic in one line.
- Must not appear: Verdict-by dates; the ring colored like a verdict.
- Today: Rendered (A day0 / day24 reintro, locked). A ring/lock with the remaining days. Subtitle "14 days per cycle, verdict the morning after" is wrong (verdict unlocks on cycle day 14, F06).
- Data gaps: none.

### Reintro tab / Picker (day 57, nothing active)
- Person's question right now: Which food first?
- Headline (the one thing): Pick your next food.
- Primary action: "Start cycle" on the recommended food -> start sheet.
- Hero evidence: Ordered list (`food`, `frequency`, `lab_level`), recommended = first.
- Everything else (max 5): 1) Why this order 2) Start today / start tomorrow 3) One-food-only rule.
- Must not appear: "Verdict by ~<date>".
- Today: Rendered (A_02_day57_tab_reintro_picker). "56 clean days on the record. Testing begins." counts days from the clock, not from logs. Each row prints "Verdict by ~Nov 26" etc. Ledger F06, F10.
- Data gaps: "clean days" is calendar days.

### Reintro tab / Cycle eve (starts tomorrow)
- Person's question right now: What do I do tonight?
- Headline (the one thing): Day 1 begins tomorrow. Eat <food> as you normally would then.
- Primary action: none (tonight's check-in is usual).
- Hero evidence: Cycle `food`, `starts_on`, only-one-food rule.
- Everything else (max 5): 1) Exposure days 1-3 / washout 4-14 strip 2) Briefing loading 3) Cycle so far: none.
- Must not appear: Day counter that starts before tomorrow.
- Today: Rendered (A_08_cycle_eve). Clear. "Getting your personalized briefing..." is an AI wait on screen.
- Data gaps: briefing AI.

### Home / Reintro exposure day 1 (before log)
- Person's question right now: Did I eat <food>? What do I log?
- Headline (the one thing): <Food> cycle, day <n> of 14. Exposure.
- Primary action: "Tonight's check-in" -> Reintro check-in.
- Hero evidence: Cycle clock (`cycle_day`, `phase`, exposure logs n of 3).
- Everything else (max 5): 1) Suspect board with this food "On trial" 2) Streak 3) Weekly.
- Must not appear: A verdict color on "On trial"; "Protocol Day <n>" next to a reintro day.
- Today: Rendered (A_01_cycle1_d1_home_before_log). Hero has the exposure label in a pill; strip ends "DAY 14 - VERDICT". The Protocol card says "Day 107" while the same card says "day 51 of your reintroduction phase" (rig, but two counters should never share a card). Board: "ON TRIAL" in teal.
- Data gaps: none.

### Reintro tab / Exposure day, before and after log
- Person's question right now: What do I eat, what do I watch for?
- Headline (the one thing): Exposure day <n> of 3. Eat <food>.
- Primary action: "Log tonight's check-in" -> Reintro check-in (after log: none).
- Hero evidence: Cycle `exposure_logs n of 3`, today's instruction.
- Everything else (max 5): 1) Briefing: watch for, one tip, stop immediately if 2) Cycle so far (logged days, symptoms noted) 3) "Severe reaction? You can stop this cycle".
- Must not appear: Large red before a ruling; "Stop" as a promoted button on a mild day.
- Today: Rendered (A_03 exposure complete, A_05 after log). After log: "Today's log is in. Nothing more to eat or do until tomorrow" (an em-dash is in the live string). Three briefing blocks, a tip, a stop line and a cycle summary stack together. After exposure 3 the washout instruction replaces the exposure one (good). Ledger F04.
- Data gaps: none.

### Daily check-in / Reintro exposure (ate, serving, symptoms)
- Person's question right now: Did it hurt?
- Headline (the one thing): Did you eat <food> today?
- Primary action: "Done for today" -> payoff.
- Hero evidence: `ate` Y/N, `serving`, `symptom`, `intensity` (mild | moderate | severe), `onset`.
- Everything else (max 5): 1) Symptoms today Y/N 2) Plan, sleep, stress, water 3) Recall box.
- Must not appear: A food name that is not the active food; severe warning styled as a verdict.
- Today: Rendered (A_03_daily_reintro_exposure_form). "Did you eat cow milk today? Yes / Not today" first. The symptom branch and recall are not in the captured clean form. Recall box is absent inside the reintro block (F07). Standard daily questions (plan, sleep, stress, water) are repeated below the reintro block.
- Data gaps: none.

### Daily check-in / Reintro severe symptom
- Person's question right now: I have a severe reaction. What now?
- Headline (the one thing): Stop eating <food>. If symptoms feel serious, get medical care.
- Primary action: "Stop this cycle" -> confirm.
- Hero evidence: `intensity='severe'` today.
- Everything else (max 5): 1) What stopping does 2) Keep the cycle going.
- Must not appear: Red as a ruling before the ruling; "rule it Avoid" as the headline.
- Today: Rendered (A cycle3_severe_logged tab + stop confirm). "You logged a severe reaction" in a red panel, then a red button "Stop this cycle - rule Crab Avoid" (em-dashes in live copy). The stop confirm is a second red card. The red is applied before any ruling. The safety line ("If symptoms feel serious, please seek medical care") is last sentence in small text. Ledger P03.
- Data gaps: no allergy flag from intake (P01).

### Reintro tab / Washout early (day 4) and late (day 13)
- Person's question right now: What am I waiting for?
- Headline (the one thing): Washout day <n> of 11. Avoid <food>.
- Primary action: "Log washout check" -> washout check-in.
- Hero evidence: `washout_day`, symptom logs since last exposure.
- Everything else (max 5): 1) Cycle so far (exposure result, washout result) 2) "Severe reaction?" quiet door.
- Must not appear: "WATCH FOR... when you consume cow milk" briefing while the food is banned; "so far" claims.
- Today: Rendered (A_10 early, A_13 late). Washout day 10 of 11 is "Day 13 of 14" in the header. The Briefing (WATCH FOR / ONE TIP "Have your normal serving at a consistent time") remains on screen during washout when no serving is allowed. "washout clear so far" is fine mid-cycle.
- Data gaps: none.

### Home / Washout (early and late)
- Person's question right now: Anything to do today?
- Headline (the one thing): <Food> washout, day <n> of 14.
- Primary action: "Log washout check" -> washout check-in.
- Hero evidence: Cycle clock.
- Everything else (max 5): 1) Board 2) Streak.
- Must not appear: Next food's trial date as if committed.
- Today: Rendered (A_09, A_12). Same card set as exposure. Board prints "Trial opens ~<date>" for the other two foods.
- Data gaps: none.

### Reintro tab / Verdict day (survey not taken)
- Person's question right now: Is it time?
- Headline (the one thing): <Food> reintroduction complete.
- Primary action: "Get my verdict" -> Survey.
- Hero evidence: `cycle_day=14`, 14 days of logs.
- Everything else (max 5): none.
- Must not appear: A pre-announced verdict; "morning after" (it is day 14).
- Today: Rendered (A_15_cycle1_verdict_day_tab_reintro). "Day 14 of 14, Cycle complete, DAY 14 - VERDICT READY". The page subtitle still says "verdict the morning after". F06.
- Data gaps: none.

### Home / Verdict day
- Person's question right now: Anything to do?
- Headline (the one thing): Your <food> verdict is ready.
- Primary action: "Get my verdict" -> Survey.
- Hero evidence: Cycle complete flag.
- Everything else: none.
- Must not appear: Weekly card shouting while the verdict waits.
- Today: Rendered (A_14_cycle1_verdict_day_home). Hero button leads to survey. Weekly "Due now" competes.
- Data gaps: none.

### Reintro tab / Stale cycle (restart notice)
- Person's question right now: Why did my cycle stop?
- Headline (the one thing): Let's restart this cycle.
- Primary action: "Restart today" -> day 1 resumes with clean exposure count.
- Hero evidence: `exposure_logs <3 after 5 days`.
- Everything else (max 5): 1) "Restart tomorrow" 2) "Nothing you logged counts against you".
- Must not appear: Blame; a verdict.
- Today: Rendered (B_04). Calm and good. Washout cannot start until 3 exposure logs; five calendar days is the cap, which is not told in advance on the Exposure screen.
- Data gaps: none.

### Survey / Before answering
- Person's question right now: Does your summary of my 14 days match what happened?
- Headline (the one thing): Does that sound right?
- Primary action: "Get my verdict" -> analyzing -> reveal.
- Hero evidence: "WHAT YOU LOGGED" sentence built from counts (exposure days n, symptom days k, washout days m).
- Everything else (max 5): 1) Worth weighing: baseline symptom days per week 2) Three answers (accurate, worse, milder) 3) Anything else going on (optional).
- Must not appear: "During the 1 days after"; "0.2" without its unit definition.
- Today: Rendered (A_16, A_04_cycle2_survey_top). Grammar bug "During the 1 days after, you stayed clear" (washout days logged = 1 on a rig account; the template does not pluralize and counts logged days, not the 11 days of washout). Data is thin here (F11).
- Data gaps: washout logged days can be far fewer than 11.

### Survey / Disputed (worse or milder)
- Person's question right now: It felt different from your summary.
- Headline (the one thing): Tell us what you felt.
- Primary action: "Get my verdict" -> reveal.
- Hero evidence: Dispute `direction` (worse | milder), `symptoms`, `timing`, `on days I ate`, `food is the cause` (yes | unsure | other).
- Everything else (max 5): 1) Free text "in your own words".
- Must not appear: Language implying the answer will override logs.
- Today: Rendered (B_04_survey_dispute_open, B_05). Four extra fields appear under one choice.
- Data gaps: none.

### Verdict reveal / Safe
- Person's question right now: What is the ruling?
- Headline (the one thing): <Food>. Safe.
- Primary action: "View your verdicts" -> Verdicts.
- Hero evidence: `verdict='Safe'`, evidence line ("No reaction"), `analysis`.
- Everything else (max 5): 1) "Entered in your verdicts" 2) The analysis 3) Worth knowing.
- Must not appear: "Day 14 of 14" when the cycle was extended; "tolerated well" as a permanent claim; the retest text meant for conflicted rulings.
- Today: Rendered (A_19 d/p). Stillness holds: one word, one line, a card, an analysis, one button. Issues: "VERDICT ENTERED - DAY 14 OF 14" is hardcoded. "Worth knowing" tells a Safe person about conflicted retests. Analysis says "background noise floor of roughly 0.2 symptom days per week", jargon with a number from the baseline. Ledger P04, P06.
- Data gaps: none.

### Verdict reveal / Limit
- Person's question right now: What is the ruling?
- Headline (the one thing): <Food>. Limit.
- Primary action: "View your verdicts".
- Hero evidence: `verdict='Limit'`, evidence line ("Mild reaction at full servings"), `analysis`.
- Everything else (max 5): 1) Entered in verdicts 2) Analysis 3) Worth knowing.
- Must not appear: Amber on anything before this screen; a "limit" amount we did not measure.
- Today: Rendered (A_07_cycle2_ruling). "Mild or mixed symptoms showed up on your record." One symptom day produces Limit. The analysis (AI) describes it fairly ("a modest signal above that background"), but the headline "Limit" carries no quantity. Ledger P02, P09.
- Data gaps: no serving threshold exists, so "Limit" has no definition of how much.

### Verdict reveal / Avoid (14-day or severe stop)
- Person's question right now: What is the ruling?
- Headline (the one thing): <Food>. Avoid.
- Primary action: "View your verdicts".
- Hero evidence: `verdict='Avoid'`, `stopped_early`, evidence line.
- Everything else (max 5): 1) Reason in one line ("Stopped after a severe reaction on day <n>") 2) Analysis 3) Worth knowing.
- Must not appear: "Day 14 of 14" on a day-1 stop; the survey "feelings" language.
- Today: From code, not rendered for the reveal (the stop path rules Avoid directly; A_01 shows the confirm, then the tab). Reveal copy is hardcoded "We recommend avoiding {food}" and "VERDICT ENTERED - DAY 14 OF 14". Severe always means Avoid in code (P03 shipped).
- Data gaps: none.

### Verdict reveal / Conflicted (retest offered)
- Person's question right now: My logs said clean but I felt it. What is the ruling?
- Headline (the one thing): <Food>. Limit. Ruled on conflicting evidence.
- Primary action: "View your verdicts".
- Hero evidence: `verdict`, `conflicted=true`, log summary vs testimony.
- Everything else (max 5): 1) "Ruled with your account" 2) Analysis 3) How to re-run.
- Must not appear: Safe (nothing can cancel the testimony silently); an invented severity.
- Today: Rendered (B_07). "RULED WITH YOUR ACCOUNT" tag, explanation "moved one careful step and no further". Honest. The analysis paragraph is long; Day 14 of 14 hardcoded. Ledger P02/P12.
- Data gaps: none.

### Reintro tab / Between cycles (one ruled, others remain)
- Person's question right now: What is next?
- Headline (the one thing): Choose your next food.
- Primary action: "Start cycle" on the next -> start sheet.
- Hero evidence: `verdicts earned n`, next food.
- Everything else (max 5): 1) Tested list with day ranges and verdict 2) Retest door (conflicted only).
- Must not appear: "PROGRAM COMPLETE" while foods remain.
- Today: Rendered (A day-64 between cycles and B_10). The tab stacks "CYCLE COMPLETE - 1 VERDICT EARNED", "YOUR FOODS - NONE TO TEST", "RETEST AVAILABLE", "TESTED - 1 FOOD", and on single-food accounts "PROGRAM COMPLETE - Generating your program summary..." together. A single-food program is both "ruled on conflict" and "complete". Tested rows say "DAY 63 > 77" as cycle ranges (project days, not cycle days).
- Data gaps: none.

### Home / Between cycles (Reintro, one ruled)
- Person's question right now: What do I do today?
- Headline (the one thing): Choose your next food.
- Primary action: "Pick your next food" -> Reintro tab.
- Hero evidence: Board status (`ruled n of m`).
- Everything else (max 5): 1) Check-in 2) Streak 3) Weekly.
- Must not appear: "MAP COMPLETE" anywhere; verdict-colored dots next to unruled foods.
- Today: Rendered (A_21_between_cycles_home). The board correctly says "1 OF 3 RULED" while the strip ends "DAY 42 - MAP COMPLETE". The hero and board disagree about whether the map is done. Wheat's "Trial opens ~Nov 11" is stale on the day it can start. Ledger F10.
- Data gaps: projected dates drift when cycles end early or late.

### Home / Program complete
- Person's question right now: Am I done?
- Headline (the one thing): Every food is ruled. Your Food Map is complete.
- Primary action: "See your Food Map" -> Verdicts.
- Hero evidence: `ruled=total`, counts Safe / Limit / Avoid.
- Everything else (max 5): 1) Outcome question 2) Maintain preview 3) Household card.
- Must not appear: "Due now" weekly card; "Reintroduction: Day <n>" counters.
- Today: Rendered (A_06_home_program_complete). Hero "Every verdict, earned" with "Your Food Map is complete", board "3 OF 3 RULED", good. But the strip still reads "DAY 42 - MAP COMPLETE" and the Protocol card says "Day 133 / day 77 of your reintroduction phase", "Weekly check-in Due now", "Your first weekly insight will appear here after your first weekly check-in" (ever-present boilerplate).
- Data gaps: none.

### Reintro tab / Program complete (outcome question)
- Person's question right now: Is this the end, did it help?
- Headline (the one thing): Reintroduction complete.
- Primary action: "Record it" -> saves `outcome_score` (0-10).
- Hero evidence: Counts (Safe n, Limit n, Avoid n) + the question "Compared to day 1, how are your symptoms now?"
- Everything else (max 5): 1) Summary paragraph (AI) 2) Tested list.
- Must not appear: "Over the past six months" (invented duration); metaphor ("decode how your body speaks"); verdict colors on counts.
- Today: Rendered (A_02_program_complete_tab_reintro, capture of outcome save failed). The ruling stack sits above the summary: "Choose your next food / NONE TO TEST" is still printed at the top of a finished program. The AI summary contains a duration claim ("six months") that is not computed. The outcome 0-10 row has 11 equal buttons and no preview of what was entered (F-ledger; measured, not assumed).
- Data gaps: duration is not counted.

### Maintain / Locked preview (day 57+, program not complete)
- Person's question right now: What is Maintain and do I need it?
- Headline (the one thing): The map is yours. Keeping it alive is Maintain.
- Primary action: "Reserve Maintain, $0 today" -> Stripe (never clicked).
- Hero evidence: Price (`$12.99/mo`), what is included (4).
- Everything else (max 5): 1) What drift detection looks like (sample) 2) Cancel anytime 3) "Your completed Food Map is yours forever".
- Must not appear: Drift detection and re-testing as shipped features; amber and red sample dots.
- Today: Rendered (A_06_maintain_locked_preview_day57, eyebrow "AFTER MONTH SIX"). Offers "Drift detection" and "Re-testing cycles" that are not built. A sample preview colors amber/red. The person is on day 57 with no verdicts and is already sold a subscription. N01 (cancel detaches cards).
- Data gaps: drift detection output does not exist.

### Maintain / Hub (program complete)
- Person's question right now: What can I do with my map?
- Headline (the one thing): Hi, <name>. Your Food Map is loaded.
- Primary action: "Ask about a food, or log a meal" -> Ask.
- Hero evidence: Map summary (Avoid / Limit / Safe by food).
- Everything else (max 5): 1) Report a symptom 2) History and trends 3) Recent activity 4) Household card.
- Must not appear: A rolling activity list with dates earlier than the program.
- Today: Rendered (A_07_maintain_after_complete). Ask input, Food Map list, Track, Recent activity with dates "Aug 27" that predate the program (rig). "I know your whole map" is true here.
- Data gaps: none.

### Ask Sensify / Locked preview (before verdicts)
- Person's question right now: What will this be?
- Headline (the one thing): Answers come from your results and your map.
- Primary action: none.
- Hero evidence: None (it is not available).
- Everything else (max 5): 1) One line about when it unlocks.
- Must not appear: A fabricated conversation naming safe foods ("most curries are built on coconut milk, which is clear on your map"), because no map exists.
- Today: Rendered (D_10 locked). The preview shows a Thai dinner answer that assigns verdicts to foods. It is sample copy, labeled PREVIEW, but it displays a verdict-shaped answer. At day 0 the unlocked text also says "I know your Food Map (your verdicts, as they're earned)" and offers "Check if a food is safe". Ledger P01, D14.
- Data gaps: none.

### Ask Sensify / Unlocked (after verdicts) and error
- Person's question right now: Can I eat this?
- Headline (the one thing): Ask about a food, a menu, a label, or a photo.
- Primary action: "Send" -> answer.
- Hero evidence: Answer with source (`verdict`, `lab_level`, `evidence`) for the foods named.
- Everything else (max 5): 1) Ruled vs not yet tested distinction 2) Safety line.
- Must not appear: A verdict for an untested food; "safe" for a Limit.
- Today: Partly rendered (hub input on A_07). Answer and limit/error states from code, not rendered (AskSensify.js). D14.
- Data gaps: no allergy screen (P01).

### Household card / Create link (inside Home or Maintain)
- Person's question right now: How do I tell whoever cooks for me?
- Headline (the one thing): A link for whoever cooks for you.
- Primary action: "Create link" -> shows the link and "Copy".
- Hero evidence: `household_token`, link.
- Everything else (max 5): 1) Turn off link.
- Must not appear: Anything beyond avoid list and current trial.
- Today: Rendered (A_01_home_household_link_created). The card sits below the avoiding list, far from where it matters.
- Data gaps: none. D13.

### Household card / Public viewer (ready, not found, error, loading)
- Person's question right now: What can't I serve this person?
- Headline (the one thing): Cooking for <first name>?
- Primary action: none.
- Hero evidence: Avoid chips (`food`, `level or verdict`) + current trial food.
- Everything else (max 5): 1) "This card updates automatically." 2) "Nothing else about the program is shared."
- Must not appear: Safe foods, symptoms, history, dates, the last name.
- Today: Rendered (E_01 household_card_viewer; E_01/E_02 not found/error). Ready: lists Wheat "SMALL AMOUNTS ONLY" and Crab "AVOID" under "CURRENTLY OFF THE PLATE". Not found: "This card is not available. The link may have been turned off." Error: "Something went wrong loading the card. Please try again in a moment." Loading: from code ("Loading the card..."). Uses the first name, which discloses identity to anyone with the link. A Limit food shows "small amounts only", an amount we never measured.
- Data gaps: no per-food amount exists.

### Home / Load error
- Person's question right now: Is my data gone?
- Headline (the one thing): Can't reach your program.
- Primary action: "Try again" -> reload.
- Hero evidence: error flag.
- Everything else: none.
- Must not appear: Raw error text.
- Today: From code, not rendered (the robot's route-abort probe did not capture). Dashboard.js loadError.
- Data gaps: none.

### Home / Slip-up and compliance audit (cards)
- Person's question right now: I ate something off plan.
- Headline (the one thing): What happened today?
- Primary action: "Done" -> payoff.
- Hero evidence: `foods`, `how it happened`.
- Everything else (max 5): 1) "No judgment, this is just data".
- Must not appear: Italic emphasis (live copy uses it), "Logged. Thanks for telling us."
- Today: From code, not rendered (SlipupSurvey.js, ComplianceAudit.js: three-day "Three days is hard" audit with q1 hardest part, cravings, social, hidden ingredients, stress). Both use italic emphasis in titles and a Fraunces italic accent, against the no-italics rule.
- Data gaps: none.

---

## 3. Cross-screen: objects that must look identical everywhere

| Object | States (fixed list) | Rules |
|---|---|---|
| 14-day strip | On plan, Slipped, No check-in, Away on plan, Today pending, Future (blank) | Same marks on Home, History, Maintain. No red unless it is the Avoid ruling color; "Slipped" needs a non-verdict mark. End label must never claim "MAP COMPLETE" or "DAY 56 - REINTRODUCTION" as fact. |
| Symptom curve | No data (empty), Building (<7 days, dots not a line), Baseline known (line + baseline), Change vs baseline (neutral marks) | Never projected; never red/green for change. |
| Verdict card | Not tested, Next, On trial, Ruled Safe, Ruled Limit, Ruled Avoid, Ruled on conflicting evidence, Stopped early | Color only on the three rulings. "Stopped early" and "conflicted" are tags, not new colors. Same card on Verdicts, PDF, Reintro tested list, Household card (no card there, chip only). |
| Suspect card | Suspect (name, lab level, frequency), Up next, On trial (exposure / washout / verdict day), Ruled | No "Trial opens ~<date>". Lab level is a label, not a color. |
| Streak line | None yet (starts with next check-in), Active n, Broken (restarts today), Away paused | Same words on Home hero, payoff, History. "unbroken" never without the number. |
| Check-in button | Tonight's check-in, Logged today, Log washout check, Catch up (weekly), Weekly due | One label per state; same position; never next to a second primary. |
| Day counter | Elimination day n, Reintro day n, Cycle day n of 14 | Never two counters in one card ("Day 133" and "day 77"). |

## 4. The 15 worst screens/states (ranked)

1. Home / Between cycles and Program complete: strip says "DAY 42 - MAP COMPLETE" while the board says "1 OF 3 RULED"; weekly card says "Due now" under "Your Food Map is complete".
2. Home / Elimination (all days): the Suspect Board prints projected "Trial opens ~<date>" for foods that have no data, duplicating "Currently avoiding" below it.
3. Reintro tab / Program complete: "Choose your next food / NONE TO TEST" above "Reintroduction complete", with an invented "past six months".
4. Reintro tab / Between cycles (and single-food): five stacked banners (cycle complete, none to test, retest, tested, program complete) at once.
5. Daily check-in / Reintro severe: red button and red panel before any ruling, em-dashes, safety line last.
6. Home / Pre-intake: six cards for one job, four describing things that do not exist.
7. Ask Sensify / Locked preview and day 0: sample answer assigns verdicts ("clear on your map") before any exist.
8. Maintain / Locked preview: sells drift detection and re-testing that are not built, on day 57, with sample amber/red.
9. Verdict reveal / all: "VERDICT ENTERED - DAY 14 OF 14" is hardcoded, wrong for a 1-day stop; Safe screen carries conflicted-retest copy.
10. Food Map PDF: "4 DAYS OF TESTING" over "14 day single-food trial"; stopped-early Crab under the same sentence.
11. Home / Elimination mid: Slipped = red dot and red/green symptom change; verdict colors borrowed for non-verdicts.
12. Verdicts / On trial live card: teal wash before any ruling.
13. Weekly check-in / Form: inverted scale fixed by a warning box; Submit disabled with no hint.
14. Survey / Before answering: "During the 1 days after" and washout logged days far below 11.
15. History / Day 0: "protocol started" dated before Day 1 begins.
