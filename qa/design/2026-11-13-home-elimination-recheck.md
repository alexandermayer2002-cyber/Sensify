# Design re-check: Home / Elimination, pass 2, branch redesign/objects

Reviewer: Design Director. Read-only re-check, 2026-11-13, of qa/design/2026-11-13-home-elimination.md.
Evidence: home_elim_early_desk.png (day 3, logged), home_elim_mid_desk.png (day 35), home_elim_late_desk.png (day 44), plus the code in src/pages/HomeElimination.js, src/components/objects/index.js, Dashboard.js (nav at 1360, compliance load at 850) and HouseholdCard.js (panel variant). Note: the three screenshots were taken at 15:24, 15:25 and 15:33, before the last edits to HomeElimination.js (15:33:35) and objects/index.js (15:54). The late shot still shows "Catch up on last night" (current label: "Catch up on your weekly check-in") and "Your first weekly check-in opens at the end of week one." on day 44 (the code now says "No weekly check-in on the record yet."). Where pixels and code differ, the code is what I graded; a re-shoot of the three states would confirm.

**Verdict: SHIP. Sixteen of the twenty-one previous findings are fixed and five are partly fixed; none is open and the fix introduced no HIGH. One shared object line ("Tonight makes four" after tonight is logged) should be fixed together with the Reintro Home pass.**

## Previous findings

| # | previous finding | status | note |
|---|---|---|---|
| 1 HIGH | Household card old drawing (raw URL, caps label, red link) | FIXED | `variant="panel"` renders the dark forest panel: "Your household card is live." / "A card for whoever cooks for you.", "Copy the link", quiet "Turn the link off", no URL, no caps. Elimination wording is "what is off your plate right now"; "this week's trial" is gone from this screen. |
| 2 HIGH | Early headline contradicts a logged night | FIXED | Logged: "Day three, logged." with "That counts. The record is built one night at a time, and tonight is on it." (early shot). Not logged: "One job tonight: the check-in." |
| 3 HIGH | Suspect board empty on the common track | FIXED | `getProtocolFoods` feeds `getTestingOrder` (HomeElimination.js:99-109). Day 44 shows Cow Milk, Wheat, Crab. Zero suspects partly handled, see new LOW. |
| 4 HIGH | Late stretch does not lead with its hero | FIXED | Late order is headline, the ordered cards, then strip and ledger (late shot). "Testing begins on day 57. Your order is set." kept. |
| 5 MED | Caps phase pill still in the nav | FIXED | Dashboard.js:1360 hides it on Home; the three shots show no pill. |
| 6 MED | Check-in button drawn twice, third action in hero | PARTLY | The panel now holds a link, not a button, so there is one `CheckinButton`. Hero with weekly due still has a second link ("Tonight's check-in first") and the page is still seven blocks in mid (hero, ledger, sharpness, strip, compact, rough night, household). |
| 7 MED | Strip today square ignores a logged night | FIXED | `today-on` (early shot: third square green with the ring; late: last square green with the ring). |
| 8 MED | Strip misdraws nights 11-14 (10-day compliance load) | FIXED | Load is now 14 days (Dashboard.js:850). |
| 9 MED | Strip titles use position, not protocol day | FIXED | `Strip` takes `startDay`; HomeElimination passes `firstStripDay` (:159, objects/index.js:20-26). |
| 10 MED | Streak states `broken` and `away` never used | FIXED | `streakState` derives all four (:79-86). Mid shot (nothing logged) correctly says "Your streak starts with tonight's check-in." |
| 11 MED | Weekly button ignores lateness | FIXED | `btnState` uses `catchup` when `checkinLate` (:133). |
| 12 MED | Ledger false story with missing baselines | FIXED | `weeksLogged` comes from check-ins; separate copy when no baseline was scored (:166-170). |
| 13 MED | Suspect board not collapsed in mid; cards lead to a locked page | PARTLY | Early and mid use the one-line `he-compact` block ("Off the plate, for now / Cow Milk, Wheat. They go on trial one at a time, from day 57, in this order."). Both it and the late cards still call `onOpenReintro`, which opens the locked Reintro page. |
| 14 MED | Empty ledger takes the early slot | FIXED | Early shows the strip beside the hero and no ledger. |
| 15 MED | Baseline sharpness missing | PARTLY | Present in mid ("How well we know your normal.", 7.0 ±1.9, "Still rough"), absent in early and late, where SCREENS also lists it. Component accepted as is. |
| 16 LOW | Ledger baseline label under first dot; "A line appears at 3" repeated | FIXED | Captions off per row; the sentence is said once under the heading. New LOW below. |
| 17 LOW | Ledger direction unreadable | FIXED | "lower is better" / "higher is better" under each name (mid shot), no color. |
| 18 LOW | Early hero repeats the clock | PARTLY | Not logged: "One job tonight: the check-in." (fixed). Logged: "Day three, logged." sits next to "3 of 56, elimination" (early shot), the same day twice. |
| 19 LOW | `words()` digits, dead branch, en dash | PARTLY | Fixed: "Thirteen clean nights to go." (late shot), the dead `daysLeft === 0` branch is gone. Open: the en dash placeholder `s.latest ?? '–'` (HomeElimination.js:177). |
| 20 LOW | Suspect card meta misaligned | FIXED | `min-height: 2.6em` on `.ob-meta`; Out. and the order line align in the late shot. |
| 21 LOW | Day 1 over-claim | FIXED | "Day one. Your suspects are off the plate." |

## New findings from the fix

| sev | finding | rule broken | fix |
|---|---|---|---|
| MED | The streak line contradicts a logged night. Early shot: "Three nights in a row. Tonight makes four." directly under "Logged tonight. See you tomorrow." `StreakLine` active copy always appends "Tonight makes ..." (objects/index.js:161), and HomeElimination.js:146 passes no flag for tonight being done. Late shot shows the same ("44 nights in a row. Tonight makes 45." beside "Tonight is logged."). The object is shared with HomeReintro. | SCREENS Streak states; charter 2 (nothing invented) | Give `StreakLine` a `loggedToday` prop: "Three nights in a row." and, when logged, nothing about tonight (or "Tomorrow makes four."). |
| LOW | Zero suspects still print contradictory sentences: compact block "No suspects listed yet. They go on trial one at a time, from day 57, in this order." (:210), late heading "Your order, from day 57." over "Your protocol has no suspects listed yet. Your body rules on each, in turn, from day 57." (:194, :201-202), and the late headline "Your order is set." | Charter 2 (nothing invented) | With zero suspects drop the order sentence and the heading; say one honest line. |
| LOW | The ledger's dotted baseline line is no longer labeled anywhere (mid shot), and the sub-line does not say what the dotted line is. | Charter 4 (legibility) | Add "The dotted line is your day-zero score." to the sub-line. |
| LOW | Early strip at md size wraps to a second row of three squares inside the half-width card (early shot), and the Rough night panel in the early and mid shots shows its paragraph floating mid-card (the late shot and the current CSS keep it tight, so it is likely the older build). | Polish | Use sm in the early card or let it span; re-shoot to confirm the panel. |

Accepted and not graded: Baseline Sharpness mono labels ("BASELINE SHARPNESS", "9 DAYS LOGGED", "VERDICT-READY · ±0.4", the card's white drawing, the term "Weekly Insight"), owed to the History pass; the top nav, owed to the shell pass.

## Make it better

1. **Early ("Am I doing it right?")**: say it once. With "3 of 56, elimination" in the hello line, make the logged headline the job state ("Logged. The strip has tonight.") so the day number appears only in the counter.
2. **Mid ("Is it working?")**: the ledger and the sharpness card both answer it; keep the ledger as the hero and move the sharpness card under the strip, so the page is five blocks (hero, ledger, strip, compact, panels).
3. **Late ("When does testing start, in what order?")**: make the cards non-clickable until day 57 (or send them somewhere that exists) so the hero does not end in a locked page.
4. **Weekly due ("Is it open, did I miss it?")**: show it as the one action when due and drop "Tonight's check-in first" into the strip card caption ("Tonight is still open"), so the hero has one door.
5. **Streak ("Am I on track?")**: after the log, print only the count ("Three nights in a row.") so the line never promises the night that was just recorded.
