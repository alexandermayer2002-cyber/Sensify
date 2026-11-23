# Two directions for Sensify, 2026-11-21

Both directions start from zero. Neither reuses the stone and paper material system. Copy and facts come from the current site and the brief. Price is $449 as given in the brief, but the live Marketing.js still says $399, so that needs reconciling before anything ships. Sarah and her Food Map are labelled as an example in words on every page.

Files: `direction-a.html`, `direction-a-app.html`, `direction-b.html`, `direction-b-app.html`, each with a `-1440.png` and a `-390.png` full-page render at 2x.

## Direction A: Verdict

**The idea.** The ruling is the brand. The page reads like a light, editorial magazine spread where the verdict word is set big enough to be the image, and the fourteen-day strip runs the full width of the screen like a ribbon of evidence beneath it.

**Palette**
| Role | Hex |
| --- | --- |
| Paper (page) | #FFFFFF |
| Ink | #141312 |
| Graphite (secondary text) | #5F5B57 |
| Rule | #E7E4E0 |
| Wash (washout squares) | #EFEEEC |
| Ultramarine (the record, on-plan nights, one full-bleed field) | #2638D8 |
| Safe, Limit, Avoid (only on those words) | #1F9C87, #D98A1C, #CF4B4B |

The page is pure white on purpose: no cream, no sand. Ultramarine is the one brand colour. It means "your record" (on-plan nights) and is used as one full-bleed field behind the app screen. It sits far enough from teal, amber and red that the verdict colours stay unmistakable.

**Typefaces**
- Newsreader (display, light 300 at optical size 72). It was drawn for long-form journalism, and its display cut is sharp, warm and confident at very large sizes. That makes a verdict feel like something pronounced, not an app label. It is a deliberate step away from Fraunces: crisper and less quirky. Italics are never used.
- Hanken Grotesk (text and buttons). A quiet, open grotesk that stays out of Newsreader's way and reads cleanly at 15 to 17px.

**The memorable element.** The hero. A full-width strip of fourteen squares fills in one by one (three ink exposure days with a reaction dot, then eleven washout days), and then "Avoid." rises into place at about 400px tall in verdict red. This is the page's one motion moment, and reduced motion shows the finished state. The same strip comes back as the empty fourteen-night strip in the final call to action ("Your record starts with one night").

**Discipline elsewhere.** No cards and no shadows except the phone. Structure comes from hairline and ink rules, with type that drops straight from display to body. Square-cornered ink buttons. The how-it-works figures are drawn from the product itself: 56 elimination days as eight weeks of seven, one trial as 3 plus 11, and the three rulings.

**What it needs from Alex**
- One photograph of the kit, for the grey block in "Test at home". The layout works without it, but it is the only place the page touches the physical product.
- Nothing else. The wordmark is set in Newsreader 500 and works as is. A drawn wordmark would be a refinement, not a requirement.

## Direction B: Record

**The idea.** Sensify as an instrument. The page is dark, dense and clinical like a lab report. It is completely greyscale, so the only colour anywhere on it is the ruling: Safe, Limit, Avoid.

**Palette**
| Role | Hex |
| --- | --- |
| Ground | #0D1316 |
| Panel | #121A1E |
| Line / line-2 | #25313A / #1B252B |
| Text | #E7ECEE |
| Mute / faint | #8C99A0 / #5A6870 |
| Exposure day (white) | #F1F4F5 |
| On-plan night | #A3B0B6 |
| Washout cell | #1F2B33 |
| Safe, Limit, Avoid (the only colour) | #1F9C87, #D98A1C, #CF4B4B |

The ground is a deep blue-slate with a real hue, not a tinted black, and there is no accent colour at all. That avoids the dark-hero-with-orbs look and the black-plus-acid-green look.

**Typefaces**
- Archivo, one family, using its width axis. Headings are set at width 125 (expanded) and light. That wide, calm instrument-panel voice reads as precise and expensive without going cold. Body and tables use normal width with tabular figures, so numbers line up like a printout. One family with two widths keeps it clinical and coherent. Monospace was avoided because it is the cliché for "data".

**The memorable element.** The hero is the report itself: a full-width example Food Map ledger. Each food is a row: its three exposure days, its eleven washout days with reaction dots, one line of evidence, and the ruling in colour. On load, the cells fill row by row like a scan, and then each ruling appears. That is the one motion moment, and reduced motion shows the finished state. The greyscale-until-ruled rule makes the verdicts glow.

**Discipline elsewhere.** A two-column contrast ("What a lab test gives you": every food Suspect, against "What your record gives you": the same foods ruled). The whole protocol drawn to scale, one bar per day: lab, 56 elimination days, three example trials, map. The app screen is annotated like a technical drawing, with leader lines tied to the parts they describe. The bloating curve uses the real example values for weeks 1 to 6 (7, 6, 6, 5, 4, 4) against a dashed baseline. The price is a spec sheet.

**What it needs from Alex**
- One photograph of the kit, ideally shot dark on dark, for the block beside "One protocol, drawn to scale". It matters more here than in A, because B is otherwise all diagram.
- A wordmark would help more in B than in A. The expanded Archivo setting works for now, but a drawn mark with the same width would make it ownable.

## Notes for whichever direction goes forward

- The verdict colours appear only on the words Safe, Limit and Avoid. When those words appear in running copy, they stay in the text colour.
- Strips follow the shared objects' meaning: three exposure days, then eleven washout days. The cow milk strip now shows symptoms on all three exposure days and on day four, so it matches its evidence line, "Reacted on three of three exposure days". The current sample data in Marketing.js marks day one as clean while its copy says three of three, which is a small contradiction to fix there.
- The wheat, almond, soy and eggs strips in the example maps reuse the oats, coffee and milk patterns. They are example data, labelled as such.
- Screenshots were made with a scratch Playwright script outside this folder. It waits for the motion to finish and grows the viewport to full height so sticky tab bars render at the true bottom.

## Direction C: Lit (2026-11-23, Opus review of A and B)

Why A and B read as budget: flat squares and hairlines with no light or depth, grey "photo goes here" blocks, default colours (white plus web blue; flat near-black), small grey body text and small square buttons, and a phone drawn as a white box.

C merges the strongest idea from each (A's verdict word, B's lab-versus-record comparison and the protocol to scale) and sells real objects instead of placeholders: a rendered phone showing the verdict landing and the Food Map as a printed card, lit on a deep green-black field with grain. Light bone sections between. Newsreader display, Geist text at 18px, 58px pill buttons. Verdict colours only on Safe, Limit, Avoid. No fake kit.

Files: `direction-c.html`, `direction-c-app.html`, with 1440 and 390 renders.
