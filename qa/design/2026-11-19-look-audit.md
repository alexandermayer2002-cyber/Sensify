# Sensify look audit, 2026-11-19

Look-only. Live site, Playwright, desktop 1440 and phone 390. Test accounts only (+robote4d, +qamessy, +robote45b, +robotrx1, +robotrw1, +fable1). One household link was created on +robote45b to photograph the public card. Nothing submitted.

Screenshots: `/tmp/claude-0/-home-claude/512e85e3-e74e-5efe-bd56-1a6472a82975/scratchpad/audit/`. Filenames below are relative to that folder. Pattern: `<acct>-d-<Tab>.png` desktop, `<acct>-p-<Tab>.png` phone (e4d, qam, e45, rx1, rw1, fab).

Capture caveats: full-page shots show fixed bars (the "Done for today" band, the phone tab bar) floating mid-page; I ignored those. The marketing page only fills in after scrolling (reveal-on-scroll), so `mkt-desktop.png` and `mkt-phone.png` were re-shot with a scroll pass. Unscrolled, a fast screenshotter, link preview or print would see a hero and then a blank stone page; worth a check that nothing important stays hidden for those.

## 1. Overall read

Sensify today looks like a careful, honest, warm product that stops one step short of a premium one. The pieces are right (Fraunces headlines at real scale, stone page, paper cards, one forest panel, calm copy), and the marketing hero, sign-in card and household card are genuinely good. But the logged-in app is a stack of white rounded rectangles of near-equal weight, with no object you would want to look at: the Food Map is two small cards left-aligned in a wide empty page, the Reintro tab is a half-empty column, History is a wall of 12px insight paragraphs, and the single most valuable moment in the product, the verdict, is drawn as plain coloured type in a plain card. The gap to Hims, Oura and Superpower is not polish, it is the absence of a hero object per screen (a ring, a map, a ruling) and the presence of too many same-weight boxes, plus a handful of screens (weekly check-in, Maintain, locked Verdicts, marketing mock) that were not carried through the system and still carry mono caps, arrows, mixed colour and a different wordmark.

## 2. The 20 improvements, ranked by effect on "worth $399"

**1. Verdict card is not a reveal. [fable1 Verdicts, Home, Reintro; rw/rx when ruled]**
Seen: `fab-d-Verdicts.png`, `fab-p-Verdicts.png`. A ruled food is `Gluten / wheat` in 20px serif, then `Safe.` in teal Fraunces, then one grey line, on a white card the same size as every other card in the product. The ruling is the product. It reads as a list item.
Why: no hierarchy between the food, the ruling and the evidence; the card has no weight, no stillness, no material difference from an unruled suspect card (`Out.` on the same card on Home). Teal and amber type on white is also thin.
Change: make the verdict card the one object that is taller than every other card in the product, with the ruling at the largest Fraunces size on the page, the food name small above it, the evidence as one sentence below, and the 14-day strip (existing Strip object) as the proof underneath. Keep stillness (no entrance theatrics). Use the existing `.sn-stamp-*` for the ruling and nothing else for colour.

**2. The Food Map is not an object you would keep. [Home complete state, Verdicts, Reintro complete]**
Seen: `fab-d-Home.png` ("Your Food Map." with two 273px cards in the left third of a 1140px row, the right two thirds empty), `fab-d-Verdicts.png` (same, plus a small "Download your Food Map" pill).
Why: the thing the customer paid $399 for is drawn at the size of a settings tile and left-aligned in dead space. There is no sense of a completed set, no grouping by ruling, no title, no date.
Change: one single wide paper object (the map) holding all rulings, grouped Safe / Limit / Avoid by the stamp, with the person's name and completion date as a quiet header, the download/share action as the single primary button attached to it. Same object on Home (compact) and Verdicts (full). Delete the separate "Download your Food Map" pill floating above the grid.

**2b. (tie) The locked Verdicts screen shows a fake wall with live confetti. [qamessy Verdicts, any pre-verdict account]**
Seen: `qam-d-Verdicts.png`: confetti over the headline "This is what you're working toward.", six pastel-tinted verdict tiles (`Safe.`, `Limit.`, `Avoid.`, text 8px mono for food name and a 6px footer "Example. Yours is earned from your own trials.") and a dark "Yours unlocks in" bar with a thin slider. [RULE] Verdict colours (teal, amber, red tints) are used on an unearned example, and `Day 41 of 56 · every clean day counts` uses a middle dot.
Why: confetti before any trial cheapens the actual reveal later; the tiles are the third different verdict-card style (see table); micro text is unreadably small; the slider is the retired thin-bar look.
Change: replace with one calm still image of the finished Food Map object (greyscale or forest, no verdict colour, clearly labelled as an example in one sentence), and one forest panel with the existing day counter. Save confetti, if any, for the earned moment, and the system says even that stays still.

**3. Home hero card is a phone layout stretched, then fights its own neighbour. [qamessy Home, robote45b Home, robote4d Home]**
Seen: `qam-d-Home.png`: left hero card (headline "Testing begins on day 57.", paragraph, a pale pill button "Catch up on your weekly check-in 5 minutes", link "Tonight's check-in first", then a one-line "Your streak starts with tonight's check-in.") next to a right card with the 14 nights. The right card has a large empty top (title sits at 40% height), the strip wraps 12 + 2 squares onto two rows, and the card is the same height as the left only by stretching.
Why: three competing actions in the hero (weekly button, link, plus the "Open tonight's check-in" link again at the bottom of the page), and the strip is broken as an object when it wraps.
Change: one primary action per state (tonight's check-in, as the check-in button object, full size, with the ring or day counter beside it). Move the weekly check-in to a quiet secondary line. Make the strip a single row of 14 at a size that fits the card (use size `md`, not wrapping), vertically top-aligned with the headline. Delete the duplicate tonight link at the page bottom.

**4. Home is a long scroll of equal white boxes. [e4d Home, qam Home, e45 Home]**
Seen: `qam-d-Home.png` (2058px): hero card, strip card, "Your order" cards, a 600px-tall "Your weeks" card holding four rows of one dot each, a "Rough night?" card, the household panel. `e4d-d-Home.png`: hero, "Your weeks" empty-state card, "Baseline sharpness" card, strip card, "Off the plate" card, "Rough night?" card, forest panel: seven boxes.
Why: no rhythm, no dominant object after the hero; the page reads as admin template. Superpower and Oura put one visual (ring, curve, map) at the fold and everything else is a quiet line.
Change: Home = hero with the day counter object, then at most three items: the strip, the suspect order as one horizontal row, the household card. Fold "Rough night?" into the check-in screen where it belongs (the card is explanation copy, not a status). Merge "Off the plate, for now" into the suspect row.

**5. "Your weeks against your starting point" is a giant card of four dots. [qamessy Home, desktop]**
Seen: `qam-d-Home.png`: four rows, each 195px tall, each containing a single 34px dot at the far left of a dashed line that runs to the right edge, with `7 to 6` at the end. About 880px of card for four numbers.
Why: the empty dashed line is a visual promise of data that does not exist yet; the dot is the same size as a row of text; vertical space is wasted. It reads unfinished, not "building".
Change: the existing SymptomCurve object at its dots-state size, all four symptoms as small multiples in one row of four, each 200px wide, number first at display size. Row height under 100px. Empty state stays one sentence, no card (see `e4d-d-Home.png`, where it already is one sentence in a half-empty 400px card).

**6. Weekly check-in screen is from another product. [qamessy weekly, desktop and phone]**
Seen: `qam-week-full.png`, `qam-week-p-full.png`. Wordmark in the header is `sensify` with an italic `fy` (every other screen uses `Sensify.`). Headline "How was your *week?*" is split across two lines with italic green second word. Scale ends labelled "None at all" in green and "Severe" in amber/brown. Orange note "Heads up, this scale runs the other way: 10 is the good end here." in a filled amber bar. Submit button reads `Submit check-in →`. Section dividers read "Your symptoms", "Overall", "Compliance" as centred hairline labels. Number tiles are pale mint, option rows are beige, chips are white pills: three selection styles on one screen. [RULE] italic headline word (outside the one allowed title motif, and the logo italic), [RULE] verdict-adjacent green/amber on scale ends and note, [RULE] arrow on submit.
Why: this is the check-in that gets scored against day zero, the premium ritual, and it looks like a survey tool. The mint number tiles differ from the grey pills in the nightly screen.
Change: rebuild on the nightly check-in object: one question per screen or one card per symptom with a single selection style (existing `.sn-chip` forest on select), wordmark `Sensify.`, no verdict colour on scale ends (plain "None at all" and "Severe" in body grey), the reversed-scale note as a plain sentence in the question's subline, the button as the same check-in button object as the nightly screen.

**7. Nightly check-in is functional but not a ritual. [qamessy nightly, desktop and phone]**
Seen: `qam-night-full.png`, `qam-night-p-full.png`: "Today's check-in." then five stacked white cards (plan, sleep, stress, water, anything off), a faint "Done for today" bar. Grey pills for stress; the sleep and water inputs say "Tap to enter" in placeholder grey; "to the half hour is fine" in small grey serif beside a 20px serif question.
Why: five equal cards means five equal tasks, no progression, no sense of finishing. The serif question with a small serif aside looks like a typo, not a hint. The title is 40px but the cards drop straight to 20px, which is fine, but the page has no centre of gravity.
Change: a single card, 2-minute list inside it as rows with a hairline-free rhythm, a visible "n of 5" as a Strip-style five-dot line at the top (no invented numbers, it counts real fields), hint text in body sans small, "Done for today" becoming a full-width forest button that lights up when complete. End state: the strip square for tonight fills (see wow idea 4).

**8. Reintro (elimination) is a half-empty column with a mashed header. [qamessy and robote4d Reintro]**
Seen: `qam-d-Reintro.png`: headline "Testing opens on day 57." then `16` (28px bold serif) `clean nights to go` and the paragraph "Your suspects will be tried one at a time..." run together on one line with no break ("clean nights to go Your suspects will be tried"). Below: "How a trial works" card with a 14-square strip where the first three are darker grey, then paragraph; "Your order" with two cards; a footnote; 450px of empty stone.
Why: the big number is not big; the header sentence collides with its number; the strip's three grey squares carry meaning (exposure days) with no legend; empty lower half. `e4d-d-Reintro.png` (3 suspects) drops the third card alone on a second row, left-orphaned.
Change: the number as the display-size object at the top (48 in Fraunces, the day counter object), the explanation as a single line below it on its own line, the order as one row of 3 equal cards or a vertical list that never orphans, and the strip legend as words ("three eating days, eleven clean") using the strip's own labelling. Centre the column on desktop or give it a right rail with the strip.

**9. Phone verdict counter collapses into three lines. [fable1 Verdicts, phone]**
Seen: `fab-p-Verdicts.png`: top right reads `2` / `of` / `2` / `ruled` stacked on four lines beside the headline, squeezing the headline paragraph ("Each verdict is ruled by a fourteen-day single-food trial...") into a three-line narrow column.
Why: a visible layout bug on the most important screen, and the counter is the weakest element on it.
Change: counter drops below the headline as one line ("2 of 2 ruled") or leaves entirely (the map shows it). Never beside the headline on phone.

**10. History: dense, small, and the most "admin" screen. [fable1 and qamessy History, desktop]**
Seen: `fab-d-History.png`: 8 horizontal progress bars with grey tick marks, a segmented "This week / Overall average" toggle, "Program milestones" as a hairline list, then "Past entries" cards each with 8 stat chips (`Bloating 4 -33%`) and a 12px green-tinted paragraph of ~60 words. `qam-d-History.png` the same with 4 chips. 
Why: five weeks look identical, text is 12px, the bars are the retired thin-bar style, and the colours mean something different from elsewhere (plum for "worse than baseline", green for better, grey for no change; the chips use red and green percentages; "Some slip-ups compliant" is an orange pill).
Change: lead with the SymptomCurve object per symptom (history is the curve's home), one row per week reduced to the sentence plus a link to expand the chips; insight paragraph at body size with a max line length of about 70 characters; compliance as plain text, no orange pill. See [RULE] item 13 for the colour.

**11. One dark panel per screen is not holding, and the panels differ. [Home, History, Reintro complete, Maintain]**
Seen: `e45-d-Home.png` forest household panel (flat, no glow); `fab-d-Home.png` forest "One last measurement." panel (flat, with a faint 0 to 10 row of dark tiles); `qam-d-History.png` forest "Your weekly check-in is ready." panel with a radial circle; `fab-d-Reintro.png` gradient "Want to go deeper, Fable?" panel with sage button; `fab-d-Maintain.png` forest panel with two circles.
Why: five dark panels, three finishes (flat, circles, gradient glow), four button treatments inside them (cream, sage, cream, forest). The "hero" panel is supposed to be the one thing; here it is everywhere and so is nothing.
Change: one forest instrument per screen, always the same finish (the existing `.sn-hero` glow), always the same inner button (cream pill). The weekly-check-in prompt on History should be a normal paper row, not a forest panel, since the household panel or the day counter is already the screen's forest object.

**12. Buttons: six primary styles. [all]**
Seen: pale pill `Catch up on your weekly check-in 5 minutes` (`qam-d-Home.png`); dark ink pill with the same label and same words as forest `Weekly check-in is open` (`e45-d-Home.png`); black pill `See your Food Map` (`fab-d-Home.png`); black pill `Restart it from the Reintro tab` (`rx1-d-Home.png`); forest pill `Restart today` with a beige secondary above it (`rx1-d-Reintro.png`); cream pill on forest `Copy the link`; sage pill `Test the full panel` (`fab-d-Reintro.png`); forest `Reserve Maintain, $0 today` (`fab-d-Maintain.png`).
Why: the one action the screen wants should always look identical. Ink, forest and pale pill all appear as "the" action. Secondary action order is also inverted: on `rx1-d-Reintro.png` the beige secondary `Restart tomorrow, day 1 is Friday` sits above the forest primary.
Change: two button styles app-wide: primary (forest pill, white label), secondary (cream pill). Primary always last or alone. Same pill height everywhere (the 52px one used on `Restart today`).

**13. Colour carrying meaning where it is not a ruling. [History, weekly check-in, Verdicts example, Reintro, nightly stress]**
[RULE] Seen: History progress uses plum bars and plum text for "worse than baseline" and green for improvement (`qam-d-History.png`, `fab-d-History.png`); red `+20%` in chips; orange "Some slip-ups compliant" pill; weekly check-in scale ends green and amber; Reintro complete row chips `Limit` (amber on cream) and `Safe` (teal on mint) in `fab-d-Reintro.png`; marketing mock phone shows red, orange and green food chips ("Gluten", "Corn", "Dairy", "Eggs", "Soy", "Almond") and a green "-38% avg vs baseline" (`mkt-desktop.png`).
Why: the verdict colours are the earned-colour brand asset. Used for trends, severity, example data they stop meaning something. The Reintro chips are an actual ruling and fine, but they are drawn as small pills while the same ruling on Verdicts is large serif type: one ruling, two forms.
Change: History direction = position and length only (the curve), forest for the person's line, grey for baseline; no good/bad colouring. Reintro complete chips use `.sn-stamp-*`. Marketing mock shows chips in forest/grey only.

**14. Marketing mock phone is out of date with the product, and tiny. [home, logged out]**
Seen: `mkt-desktop.png`, section "A look at what you're getting.": a 310px phone with 8px text. It shows the old design: dark "ELIMINATION PHASE" card with mono caps, pastel red/orange chips, a thin progress line, a "WEEK 6 INSIGHT" mono label. The real app has none of these.
Why: it sells a screen the customer will not see, and at this size nothing is readable. It also contradicts the actual material system, so the promise and the product look different.
Change: replace with large crops (not a tiny phone) of the real Home, Food Map and check-in objects, one at a time, at readable scale. Tabs `Dashboard / History / Reintro / Verdicts / Ask Sensify` become real screenshots or the real components.

**15. Marketing page: right half of every section is empty at 1440. [logged out, desktop]**
Seen: `mkt-desktop.png`: "The problem" card has text and a 640px list left-aligned with 560px of cream card to the right; "Four steps to an answer." is four columns of 12px grey text; FAQ is a 660px column of identical boxes on the left. Section headings use mono caps eyebrows ("THE PROBLEM", "HOW IT WORKS", "INSIDE THE PROGRAM", "THE OUTCOME", "BEFORE YOU START", "THE PRICE") and the three section backgrounds alternate stone and cream blocks with no rhythm.
Why: it reads as stacked sections of a template, with big radius cream slabs. The strongest moments (hero, finished-map card, pricing card) are sandwiched between weaker ones.
Change: centre or two-column every section with a real visual on the empty side (the verdict card, the strip, the day counter, the map). Cut the eyebrows to zero (the system says sentences not labels), keep the headlines. Four steps as one horizontal connected line (strip-like) with large numerals.

**16. Hero and marketing details: mono caps and middle dots. [logged out]**
[RULE] Seen: hero eyebrow `TEST. ELIMINATE. REINTRODUCE. KNOW.` in mono caps; `$399 · lab test included · one payment`; `Get started · $399` in the nav; `See the full program →` and `Read all FAQs →` with arrows; "EXAMPLE · A FINISHED PROGRAM" and "EXAMPLE · WHAT 140 DAYS OF TESTING PRODUCES" mono caps inside the example map tile; food names in 7px mono caps on those tiles. (`mkt-desktop.png`)
Why: DESIGN_DIRECTOR says no caps labels, no arrows, no middle-dot metadata, and the tiles' micro text cannot be read at 100%.
Change: drop the eyebrow or make it a plain-sans sentence; "Get started, $399" or just "Get started"; links without arrows; tile food names at body size.

**17. Maintain screen: three typographic systems in one card. [fable1 Maintain]**
Seen: `fab-d-Maintain.png`: "After month six" small grey; headline "The map is yours." then italic green "Keeping it alive is Maintain."; dark card with `01`...`04` index numerals and white bold titles; price `$12.99 /MO` with `CANCEL ANYTIME` in caps; then below, a white card headed `MAP HEALTH · LAST 30 DAYS` in caps with a 20px serif "Too little recent data to judge drift...". [RULE] italic (second headline line, outside the one title motif), caps label ×2 (`/MO`, `CANCEL ANYTIME`, `MAP HEALTH · LAST 30 DAYS`), middle dot.
Why: it is the upsell and it looks like a pricing-table from a SaaS template; a numbered list on a dark card is the "AI slop" pattern the founder dislikes.
Change: one sentence headline, the four benefits as four plain lines with no numerals, the price as a display number with a single quiet sentence, one button. Map-health card as a separate, quiet object below, no caps.

**18. Ask Sensify: good card, wrong details. [all accounts]**
Seen: `qam-d-AskSensify.png`: "Ask *Sensify*" (italic green second word), `● READING YOUR MAP · LIVE` caps, three suggestion cards each with a title, grey subline and a green quoted example, "Tap one to try it, or just type below.", and a disabled grey send button. [RULE] caps label; the italic is the title motif so allowed but it is the only italic in the app header set and is inconsistent with other page titles.
Why: three equal cards is the generic AI chat empty state; the quoted examples in green read as links; the send button looks broken (grey circle) until typed.
Change: single headline, suggestion chips as the existing `.sn-chip` list in one row, input as the hero. Replace the status caps label with a plain one-line sentence under the title or remove.

**19. Spacing and width are different on every tab. [all]**
Seen: Home content column is 1140px (`qam-d-Home.png`); History 1140px (`qam-d-History.png`); Verdicts 1090px with different inner left edge (headline at x=174, `qam-d-Verdicts.png`); Reintro 640px (`qam-d-Reintro.png`); Ask Sensify 680px (`qam-d-AskSensify.png`); Maintain 416px (`fab-d-Maintain.png`); sign-in card 400px. The page title is 40px Fraunces on Reintro and History, 32px on Verdicts, and the first screen has no title at all (Home goes straight to the hero card).
Why: switching tabs makes the page jump left and right, and the headline baseline moves; it feels like six apps.
Change: two widths only (reading 680, wide 1140), every tab title at the same size and the same top offset, same section gap (about 40px between sections and 16px between cards, today 24 to 36 varies).

**20. Header and nav: Sign out is a ghost; the message icon is unlabeled. [all logged-in]**
Seen: `qam-d-Home.png` top bar: `Sensify.` left, centred tab row, then a white rounded square with a chat-bubble icon and "Sign out" in 11px grey. On phone (`qam-p-Home.png`) the same icon and "Sign out" sit top right, with a bottom bar `Home Reintro Verdicts Ask More`.
Why: a white tile with an outline icon is the only icon in the nav, with no label, next to the smallest text in the header. "Sign out" is more prominent than "Maintain" on some states. The phone bar drops History into "More".
Change: move Sign out into the "More" sheet on phone and under an avatar-less text menu on desktop; give feedback a plain word label or move it to the footer. Keep the five tabs identical on both.

## 3. Consistency table

| Element | Drawn differently where |
| --- | --- |
| Wordmark | `Sensify.` serif (all app and sign-in); `sensify` with italic `fy` (weekly check-in header, `qam-week-full.png`); `Sensify.` with green dot (nav) |
| Primary button | forest pill (`Restart today`, `Submit check-in →`, `Reserve Maintain`); ink/black pill (`See your Food Map`, `Restart it from the Reintro tab`, `Weekly check-in is open` on e45); pale cream pill (`Catch up on your weekly check-in` on qam); sage pill on forest (`Test the full panel`); cream pill on forest (`Copy the link`, `Start the weekly check-in`) |
| Same action, same words, two colours | `Weekly check-in is open` dark (`e45-d-Home.png`) vs `Catch up on your weekly check-in` pale (`qam-d-Home.png`) |
| Verdict / ruling | large serif `Safe.` / `Limit.` in white card (`fab-d-Verdicts.png`); small pill `Limit` / `Safe` row (`fab-d-Reintro.png`); tinted tiles with 8px mono food name (`qam-d-Verdicts.png`); dark tiles with outlined colour (marketing "A finished map") |
| Suspect card | `Out.` ink on white (Home, Reintro); `On trial.` larger than `Out.` on same size card (`rx1-d-Home.png`); sizes differ between Home (273x200) and Reintro (313x150) |
| 14-day strip | wraps 12 + 2 (`qam-d-Home.png`, `qam-p-Home.png` at 8 + 6); one row of 14 with future squares in solid grey (`e4d-d-Home.png`); grey 3 + 11 squares in "How a trial works" (`qam-d-Reintro.png`) |
| Dark panel | flat forest (`e45` household, `fab` measurement); forest with circles (History, Maintain); forest gradient glow (`fab-d-Reintro.png`) |
| Counters | `16 clean nights to go` 28px inline (`qam-d-Reintro.png`); `16 days` right-aligned display in a dark bar (`qam-d-Verdicts.png`); `2 of 2 ruled` (`fab-d-Verdicts.png`); `Day 41 of 56, elimination.` small line in hero (Home); marketing mock shows a big `42` |
| Card headers | 20px serif (Home cards); `Your progress` 22px (History); mono caps (marketing sections, Maintain `MAP HEALTH`); 11px grey sans label (`Your record`, `Baseline sharpness`) |
| Selection control | mint tiles (weekly scale), beige rows (weekly options), white pills with shadow (weekly "what changed"), grey pills (nightly stress), forest chip (History filter `All`), segmented toggle (History `This week / Overall average`), outlined segmented `Yes / No` |
| Empty state | card with heading + sentence (`e4d-d-Home.png` "Your weeks..."); full dashed-line card (`qam-d-Home.png`); just a sentence (Reintro footnote); bordered 6px strip (marketing) |
| Text links | green underlined (`See the whole record`, `Open tonight's check-in`); with arrow (`See the full program →`, `Read all FAQs →`); grey underline (`Turn the link off`) |
| Section spacing | 24px (Home order card to weeks card), 36px (History milestones), 40px (Reintro), varying page widths |
| Page title | 40px on Reintro/History; 32px on Verdicts; absent on Home; italic accent on Ask Sensify and weekly check-in and Maintain |
| Household surface | forest panel on Home with two button states; public card on stone gradient with mint chips (`household-d.png`); phone card is the same, no forest |

## 4. The three screens furthest from the bar

1. **Verdicts (locked and earned), `qam-d-Verdicts.png` and `fab-d-Verdicts.png`.** It should become the Food Map: one tall paper object holding every ruling at display size, with a still, weighty reveal, the person's name and date, and one save/share action; the locked state is the same object greyed with a single day counter.
2. **Weekly check-in, `qam-week-full.png`.** It should become the same ritual as the nightly check-in: one question at a time or one card, one selection style, the real `Sensify.` wordmark, no arrows, no scale colours, ending in the visible record of the week.
3. **Reintro (elimination state), `qam-d-Reintro.png`.** It should become the day counter as a single hero number with the 14-day strip beside it and the order of suspects as one even row, filling the width of the page instead of leaving half of it empty.

(Honourable mentions: Maintain `fab-d-Maintain.png`, History `fab-d-History.png`, and the marketing mock phone.)

## 5. Five "wow" ideas

1. **Verdict reveal as a ruling, not a card. [Verdicts, the day a trial closes]** The first time a verdict is opened it appears as a single full-screen stone page with the food name small, the ruling alone in Fraunces at display scale in its colour, the 14 squares of the trial laid out beneath it as the evidence, and one sentence. No motion, no confetti: stillness is the point. After that it folds into the Food Map as a stamp.
2. **The Food Map as a keepsake. [Verdicts, Home complete state]** One tall, shareable paper object, the size of a postcard on desktop: the person's name, "Ruled by your own record", the date, three groups (Safe, Limit, Avoid) with their foods, and a small strip-like mark for each trial. A single "Save as image" is the primary action, and the household card is its smaller sibling (same type, same stone).
3. **Day counter as a ring that fills with real days. [Home, every elimination and reintro state]** The existing day counter object at ring size next to the headline (stroke 5, forest-300, round caps, one draw on mount), with "Day 41 of 56" at 44px inside it. One hero object per screen, as Oura does, using only numbers we already compute.
4. **The check-in closes like a ritual. [nightly check-in]** Five fields shown as five dots (one per answered field, no score), and when the last is answered the day's square on the 14-day strip fills in place, with one line of body text ("Logged. Tomorrow's square is next."). The sticky button changes from grey to forest only when complete.
5. **A weekly "your week against day zero" curve. [Home and History]** Small multiples for the four symptoms in one row, each with the dotted baseline and the person's own line appearing at three weeks (as the copy already promises), drawn at a size you would screenshot. History becomes the same curves stacked with the weekly insight beneath each week in two sentences.

## Notes for the Director

- Everything above is from live screenshots; nothing was submitted, and no tokens, Stripe or admin were touched.
- The household link created on +robote45b (`/?household=348c6ea291db1faa2f3ba153`) is still live on that robot account.
- Not reached: Maintain on an account other than fable1 (the tab shows only on completion), the elimination Ask tab with a conversation, and phone versions of History, Reintro and Maintain beyond `fab-p-*` and `qam-p-*`.
