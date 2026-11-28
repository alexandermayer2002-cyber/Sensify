# Sensify Critic Ledger

The single list of everything the Nightly Critic has flagged. An item leaves OPEN only by a
fresh passing re-test against the live site, never by a commit message. The Critic re-tests
every OPEN item every night (by its probe when it has one, by a text walk when it does not,
and writes a probe after any manual re-test so the next night is scripted).

Format per item: `| id | found | area | sev | finding (exact copy or file:line) | fix | probe | status |`
- sev: HIGH = a tester stalls, loses data, or is told something false; MED = a customer notices; LOW = polish.
- probe: a one-line scripted check (python/playwright/curl) that passes when the item is fixed; `-` if none yet.
- status: OPEN (last re-tested YYYY-MM-DD) | FIXED (YYYY-MM-DD, commit/deploy) | WONTFIX (Alex, date, why).
- Decisions only Alex can make are tagged `[ALEX]` in the fix column; the Critic re-tests them like any other item but never nags on them.

Seeded 2026-11-10 from the 2026-11-06 deep-dive reports (qa/nightly/2026-11-06-*.md). Deploys 17-20 may already
have closed some of these; night one must re-test every item rather than trust the seed.

## OPEN

**Re-test 2026-11-28 (Saturday; no src/netlify/public commits in 36h, bundle main.72136695 unchanged, no deep walk):** doors sealed; regress_all 62/63 (only fleet.reintro.day_logged = X25 date drift); ledger_probes and bundle_probes identical to 11-27 (M12 D01 N07 still open; M01 WONTFIX). **HARNESS DRIFT FOUND:** ledger_grep_probes.py ran greps relative to qa/, so src/ was never searched and X34 X37 N08 X24 X31 showed false PASS on 11-26/27. Re-keyed (chdir to repo root; X73/X13 paths now src/pages/). Real result: X34 X37 N08 X24 X31 X73 all STILL OPEN (strings present in src and live bundle); X13 Dashboard emoji gone but arrow ReintroductionSurvey.js:546 and SlipupSurvey italics (X52) remain. No item closed, none new.

**Re-test 2026-11-27 (Friday; no src/netlify/public commits in 36h, bundle main.72136695 unchanged, no deep walk):** doors sealed; regress_all 62/63 (only fleet.reintro.day_logged = X25 date drift); ledger_probes, bundle_probes, grep probes identical to 11-26 (M12 D01 N07 X16 X33 X51 still open; M01 WONTFIX). No item closed, none new.

**Re-test 2026-11-26 (Thursday; no src/netlify/public commits in 36h, bundle main.72136695 unchanged, no deep walk):** doors sealed; regress_all 62/63 (only fleet.reintro.day_logged = X25 date drift); ledger_probes, bundle_probes, grep probes identical to 11-25 (M12 D01 N07 X16 X33 X51 still open; M01 WONTFIX). No item closed, none new.

**Re-test 2026-11-25 (Wednesday; no src/netlify/public commits in 36h, bundle main.72136695 unchanged, no deep walk):** doors sealed; regress_all 62/63 (only fleet.reintro.day_logged = X25 date drift); ledger_probes, bundle_probes, grep probes identical to 11-24 (M12 D01 N07 X16 X33 X51 still open). No item closed, none new.

**Re-test 2026-11-24 (Tuesday; no src/netlify/public commits in 36h, bundle main.72136695 unchanged, no deep walk):** doors sealed; regress_all 62/63 (only FAIL fleet.reintro.day_logged = X25 sandbox-vs-app date drift, environmental); ledger_probes M03 M06 M07 M08 M09 M09b D17 D03 PASS, M12 D01 FAIL (unchanged), M01 WONTFIX; bundle_probes N05 X04 X17 X18 N06 X20 F06 X15 PASS, N07 FAIL (unchanged); grep probes X34 X37 N08 X24 X31 PASS (already closed or fixed), X16 X33 X51 FAIL (still open 2026-11-24). No item closed, none new. Owed Sunday 11-29: post-intake lab screen, intake step 5, weekly check-in, Maintain, live verdict ruling.

**Re-test 2026-11-23 (Monday; no src/netlify/public commits in 36h, bundle main.72136695 unchanged, no deep walk):** doors sealed; regress_all 61 PASS / 0 FAIL (25-min cap); ledger_probes M03 M06 M07 M08 M09 M09b D17 D03 PASS, M12 D01 FAIL (unchanged), M01 WONTFIX; bundle_probes N03 N05 X04 X17 X18 N06 X20 F06 X15 PASS, N07 FAIL (unchanged). New qa/ledger_grep_probes.py (src greps, valid while src is unchanged) re-tested X16 X33 X34 X37 N08 X24 X51 X31: all STILL OPEN 2026-11-23. No item closed, none new. Owed: live walks of post-intake lab screen, intake step 5, weekly check-in (X01), Maintain (N01), live verdict ruling (P03, X08) next deploy or Sunday 11-29.

**Re-test 2026-11-22 (Sunday, weekly full pass; no src deploy since 11-20, bundle main.72136695):** doors sealed; probes M03 M06 M07 M08 M09 M09b D17 D03 N03 N05 X04 X17 X18 N06 X20 F06 X15 PASS; M12 N07 D01 FAIL (unchanged); M01 WONTFIX. Closed tonight: X02 (live, slip-up ask on Home after a No), X04 (live, persistent inline 75-hour error). Code-fixed but awaiting a live walk (stay OPEN): X01 X23(half) N01 D11 F10. Still open live: X05 X06 X07(tab) X09 X10('14 day') X11 X13 X14 X20 X22 X24 F02(now inverted, see X50) N07 N08 P04. Not reached tonight (owed Monday): post-intake lab screen, intake step 5, weekly check-in live, Maintain live, live verdict ruling. New tonight: X30 HIGH, X31-X37, X50-X55, X70-X75.

**Fix deploy 2026-11-20 (f8d50ff, Alex approved in session, main.52b72da9):** P01 screen + red flags, P02, P04/M07 copy, M03 hero, D05/D09/D15 timing copy, N01, X21, X02, N06. M01 WONTFIX by Alex. Live verified tonight: P01 screen, M03, M07 probes. QA harness robot.consent now answers the six screening questions No.

**Re-test 2026-11-21 (Saturday; deploys cbc0afd/d9a7a63/e05e532/8a542c2/2f1c868/505bf56 within 36h; bundle now main.72136695, was 52b72da9):** regress_all 61 PASS / 0 FAIL (cut by 25-min cap, last ~2 checks unrun). Probes: M03 M06 M07 M08 M09 M09b D17 D03 N03 N05 X04 X17 X18 PASS; M01 WONTFIX; D01 FAIL (Alex decision); **M12 FAIL: reopened, real regression of the marketing redesign**. N06 closed. New: N07. Diff-grep of 831 added src lines: no literal \\u in JSX, no silent catches, no new emoji. Full ten-area live walk owed Sunday 11-22 (X01 X08 X23 X07 X10 X13 X20 X04 X17 X18 P03 live re-walks).

**Re-test 2026-11-20 (Friday; deploys 0603700 + 2a558f1 + ff2a85b + 625430c within 36h; bundle now main.879221d5, was dbcfe342):** probes M03/M01/D01 FAIL (Alex decisions); M06 M07 M09 M09b M12 D17 D03 PASS; M08 flipped FAIL = harness drift (copy is now "Example: a finished program", probe was case-sensitive "EXAMPLE"; probe re-keyed case-insensitive, now PASS). regress_all 61 PASS / 1 FAIL (reintro day_logged, X25 date drift); run hit the 25-min cap before the last 1 check. Targeted walk: marketing text (no \\u, NaN, undefined; console clean). Added diff-grep of 394 added src lines: no literal \\u in JSX text, no silent empty catches. No item closed (live re-walk of code-fixed X01 X08 X23 X07 X10 X13 X20 X04 X17 X18 still owed Sunday 11-22). One new: N06.

| N06 | 11-20 | marketing | LOW | Hero mock insight (Marketing.js:400): "Six clean weeks is exactly the signal we need before testing" while the program shows 42 of 56 days and 14 days to reintroduction; reads as reintro after six weeks, contradicting eight | change to "Eight clean weeks" or drop the number | grep live main.js: no "Six clean weeks" | FIXED (2026-11-21, f8d50ff; bundle_probes.py N06 PASS live on main.72136695) |
**Re-test 2026-11-19 (Thursday; no src/netlify/public commits in 36h, bundle main.dbcfe342 unchanged, no deep walk):** probes M03/M01/D01 FAIL (Alex decisions), M06 M07 M08 M09 M09b M12 D17 D03 PASS. N03 and N05 still live in bundle (1 each). X25 unchanged (same 4 fleet day_logged FAILs, sandbox vs app date). Full regress_all completed this time: 59/63. No item closed, none new. Code-fixed items still await the Sunday 11-22 live walk.

**Re-test 2026-11-18 (Wednesday; no src/netlify/public commits in 36h, bundle main.dbcfe342 unchanged, no deep walk):** probes M03/M01/D01 FAIL (Alex decisions), M06 M07 M08 M09 M09b M12 D17 D03 PASS. N03 and N05 still present in live bundle (grep 1 each). X25 unchanged (4 fleet day_logged FAILs, sandbox vs app date). No item closed, none new. Code-fixed items (X01, X08, X23, X07, X10, X13, X20) still await the Sunday 11-22 live walk.

**Re-test 2026-11-17 (Tuesday; deploys ce4732c, 99e5e26, 74331b6 within 36h; bundle main.dbcfe342):** X03 closed (no literal \u escape in JSX text in src or bundle except new N05). X01, X08, X23, X07, X10, X13, X20, N03 fixes verified in code only (regex at WeeklyCheckin.js:357-361 correct, verdictEngine.js:74 lowercased); still OPEN until a live text walk passes (owed Sunday 11-22). Probes M03/M01/D01 FAIL (Alex decisions), rest PASS.

**Fixed in code and deployed 2026-11-16 (74331b6, bundle main.0f38604a), awaiting the fresh live re-test tonight before closing:** X01, X03, N03 (all fragments in be556f2 added user-facing lines), X08 (no sleep overlap without 1h spread), X23, X07, X10, X13, X20 (foods total only). Not done, need a decision or are bigger: X02, X21, X16, X17, X18, X04, X05, X06, X09, X11, X15, F02, F05, F13.

**Re-test 2026-11-16 (Monday, no deploys in 36h, no deep walk):** every OPEN row re-tested by probe where one exists, otherwise unchanged by git log (no src/netlify/public commits since 11-13). Probes: M03 FAIL, M01 FAIL, D01 FAIL (still open, Alex decisions); M07 probe now PASSES ('clinical standard' x0): candidate to close once the "certainty" overclaim is re-read on the next walk. M06/M08/M09/M09b/M12/D17/D03 PASS. No item closed tonight. No new items. X25 extended: day_logged date FAILs again (elimearly, elimlate, audit; sandbox date vs app date) and one 502 console error on fleet.elimlate (environmental, single occurrence). N02 reconfirmed: regress_all fleet portion still ~15+ min; run cut at 40 PASS / 4 FAIL.

### Protocol (method) — source: 2026-11-06-protocol-critique.md
| id | found | area | sev | finding | fix | probe | status |
|---|---|---|---|---|---|---|---|
|  P01 | 11-06 | intake/reintro | HIGH | No intake screening for diagnosed allergy, anaphylaxis, pregnancy, age, ED history; common track says "Eat {food} today" for tree nuts/eggs/soy; only warning lives in an AI briefing | [ALEX + physician] static non-AI intake gate; static red-flag card on every exposure day | - | OPEN: fix deployed f8d50ff (deployed 2026-11-20, bundle main.52b72da9). Six-question static screen verified live 2026-11-20 (unanswered=disabled, any Yes=blocked with doctor message, all No=proceeds). Exposure-day red-flag card not yet seen live; physician review packet sent. Close after red-flag walk + physician sign-off |
|  P02 | 11-06 | verdicts | HIGH | verdictEngine washout rule: any had_symptoms washout day blocks Safe and bumps Limit->Avoid; ~80% base-rate chance at typical noise floor | require washout symptoms to exceed the user's own noise floor (and match type) before escalation | - | OPEN: fix deployed f8d50ff (deployed 2026-11-20, bundle main.52b72da9) (washoutFlareMinDays=2 or moderate, must match an exposure symptom; node unit check passed). Physician to confirm threshold |
|  P03 | 11-06 | verdicts | HIGH | "severe always = Avoid" enforced by AI prompt only, not code | enforce in verdictEngine before AI adjustment | - | OPEN: verified in code + node unit check 2026-11-20 (severe=Avoid, AI cannot soften). Close on next live reintro walk |
|  P04 | 11-06 | copy | MED | verdict + marketing language claims certainty the 3-exposure design cannot produce | [ALEX] soften to earned-confidence language; cite what one cycle can distinguish | - | OPEN: marketing certainty softened f8d50ff (deployed 2026-11-20, bundle main.52b72da9); verdict-screen language still to review with physician |
|  P06 | 11-06 | verdicts | MED | what 3 exposures in 1 cycle can statistically distinguish is unstated; moderateCount bug in verdictEngine | fix moderateCount; add a confidence line to the ruling | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 89d8528, live walk owed; verify next deep walk) |
|  P07 | 11-06 | method | MED | 56 days, 3+11, thresholds need a citation or a dataset before a physician signs | [ALEX] source the numbers; show the source in Science | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  P08 | 11-06 | code | MED | safety gates flipped on before the review the code comments promised | reconcile comments and gates; document the review | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 1a5820d, live walk owed; verify next deep walk) |
|  P09 | 11-06 | verdicts | MED | engine temperament is heavily false-positive, mismatching the product's measured-not-assumed posture | re-tune after P02/P06 | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  P10 | 11-06 | insights | MED | "A food never gets blamed for what your sleep did" overstates the confound layer | soften copy or strengthen the layer | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  P11 | 11-06 | insights | LOW | confound engines well-gated but say too little; three loose screws | per report detail | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |

### Marketing — source: 2026-11-06-marketing-teardown.md
| id | found | area | sev | finding | fix | probe | status |
|---|---|---|---|---|---|---|---|
|  M01 | 11-06 | marketing | HIGH | no risk reversal on a $399 ask; refund language only in Pricing fine print | [ALEX] concrete guarantee at every CTA, only if honored | - | WONTFIX (Alex, 2026-11-20: no refund will be given; no refund language in src) |
|  M02 | 11-06 | marketing | HIGH | zero proof layer; founder note sits below the final CTA; no named lab partner | [ALEX] move founder note above CTA; name lab partner; one real citation | - | OPEN: founder note already removed (Alex 2026-11-20: keep it out); lab partner still TBD with X16/D02 |
|  M03 | 11-06 | marketing | HIGH | page never names the buyer's symptoms; hero sells mechanics | rewrite hero sub to name bloating, brain fog, reflux, low energy | grep live main.js for "brain fog" in hero sub | FIXED (2026-11-20, f8d50ff (deployed 2026-11-20, bundle main.52b72da9); probe PASS live: hero names bloating, brain fog, reflux, fatigue) |
|  M05 | 11-06 | marketing | MED | CTA dead zone of ~4 phone screens mid-page | one primary CTA per ~1.5 screens | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 9fb7045, live walk owed; verify next deep walk) |
|  M07 | 11-06 | marketing | MED | "clinical standard" x4 with zero citation; overclaims ("certainty") | cite or cut | - | FIXED (2026-11-20, f8d50ff (deployed 2026-11-20, bundle main.52b72da9); "clinical standard" x0 in src; probe PASS) |
|  M10 | 11-06 | marketing | LOW | hero primary CTA (pale sage) quieter than nav button | make hero CTA the loudest | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 9fb7045, live walk owed; verify next deep walk) |
|  M13 | 11-06 | marketing | LOW | desktop H1 orphans "handle." at 1440px | balance wrap | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 9fb7045, live walk owed; verify next deep walk) |
|  M14 | 11-06 | marketing | LOW | redundant copy: problem card 1 restates intro; FAQ duplicates | dedupe | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 15b4b11, live walk owed; verify next deep walk) |
|  M15 | 11-06 | marketing | LOW | mobile dead air after "See the full program" | tighten section padding at 430px | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 9fb7045, live walk owed; verify next deep walk) |

### First-timer comprehension — source: 2026-11-06-firsttimer-doubter.md
| id | found | area | sev | finding | fix | probe | status |
|---|---|---|---|---|---|---|---|
|  D01 | 11-06 | marketing/science | MED | "why eight weeks?" never defended anywhere | one sentence in Science + hero tooltip | text probe: Science page explains the 56-day choice | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: probe FAIL 11-11: no "why eight weeks" copy in bundle.) |
|  D02 | 11-06 | marketing | MED | "$399 · lab test included" names no lab, panel, or certification | [ALEX] name the lab partner and panel (ties to kit decision) | - | OPEN [ALEX] TBD (2026-11-20): with X16 |
|  D03 | 11-06 | signup | LOW | "Paid but never finished setting up?" door unexplained | one-line explanation | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: door text present, still unexplained.) |
|  D04 | 11-06 | home | MED | "AI builds your elimination list in seconds" claim vs reality | align copy with actual flow | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 0349664?, live walk owed; verify next deep walk) |
|  D05 | 11-06 | home | MED | "reviewed usually within a day" vs instant test-door approval reads fake | [ALEX] honest review-time copy | - | OPEN: "within a day" removed from lab review copy f8d50ff (deployed 2026-11-20, bundle main.52b72da9); live walk owed |
|  D06 | 11-06 | lab | LOW | manual lab entry copy unclear to a skeptic | per report | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  D07 | 11-06 | lab | LOW | "My report shows no sensitivities" path unclear | per report | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 0349664, live walk owed; verify next deep walk) |
|  D08 | 11-06 | lab | LOW | review step | per report | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  D09 | 11-06 | lab | MED | "submit for review" approved instantly reads fake (test door) | per report; D05 | - | OPEN: see D05; copy deployed f8d50ff (deployed 2026-11-20, bundle main.52b72da9) |
|  D11 | 11-06 | home | LOW | Suspect Board "How this works" | per report | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  D12 | 11-06 | home | LOW | streak legend | per report | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  D13 | 11-06 | home | LOW | Household Card | per report | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  D14 | 11-06 | ask | MED | Ask Sensify's answers to the two hardest skeptic questions | per report | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  D15 | 11-06 | support | MED | "a real person replies, usually within a day" | [ALEX] the 24h SLA decision | - | OPEN: support reply-time promise removed f8d50ff (deployed 2026-11-20, bundle main.52b72da9); live walk owed |
|  D16 | 11-06 | account | MED | "Can I quit and get my data?" has no export/deletion | settings surface: export + delete | - | OPEN: see X21 |
### Full end-to-end run — source: 2026-11-06-fullrun.md
| id | found | area | sev | finding | fix | probe | status |
|---|---|---|---|---|---|---|---|
|  F02 | 11-06 | daily | MED | post-check-in celebration streak is one higher than the dashboard, every time | single streak source | probe: compare the two numbers | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped e4fabbe, live walk owed; verify next deep walk) |
|  F04 | 11-06 | reintro | MED | after logging exposure day 1 in the evening, Reintro tab still says "eat Cow Milk today" | state-aware instruction once today's exposure is logged | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped e4fabbe, live walk owed; verify next deep walk) |
|  F05 | 11-06 | harness | MED | test-skip shifts logged_at but not log_date | fix the test function | probe: skip then compare both fields | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped e4fabbe, live walk owed; verify next deep walk) |
|  F06 | 11-06 | reintro | LOW | "14 days per cycle" but verdict unlocks on day 15 | align copy or math | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 52abce4, live walk owed; verify next deep walk) |
|  F07 | 11-06 | daily | LOW | recall parser dropped granola bar and corn chips | prompt: list every distinct food | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: recall parser now admits unread foods (52abce4) but still drops foods.) |
|  F08 | 11-06 | daily | LOW | slip receipt "getting your guidance" has no timeout or fallback | 6s fallback line | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 52abce4, live walk owed; verify next deep walk) |
|  F10 | 11-06 | history | LOW | milestones list only "intake complete" after 59 days | record weekly/verdict/unlock milestones | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 52abce4, live walk owed; verify next deep walk) |
|  F11 | 11-06 | maintain | LOW | "nothing is drifting" on 0 symptom logs | thin-data honesty line | probe: zero-log account shows the thin-data line | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 52abce4, live walk owed; verify next deep walk) |
|  F13 | 11-06 | data | LOW | intake numerics stored as strings | cast on write | probe: read back types for a fresh account | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 52abce4, live walk owed; verify next deep walk) |

### New (Critic, 2026-11-11)
| id | found | area | sev | finding | fix | probe | status |
|---|---|---|---|---|---|---|---|
| N01 | 11-11 | maintain | LOW | cancel-maintain-setup.js detaches EVERY saved card on the Stripe customer, including the card used for the $399 purchase; the client copy says only the Maintain reservation is cancelled | detach only the PaymentMethod saved by the Maintain setup (store its id), or say "your saved card is removed" in the cancel confirm | - | OPEN: fix deployed f8d50ff (deployed 2026-11-20, bundle main.52b72da9) (verify tags the Maintain card; cancel detaches only tagged). Note: reservations made before this deploy have untagged cards, so cancel detaches none of them |
### New (Critic, 2026-11-14)
| id | found | area | sev | finding | fix | probe | status |
|---|---|---|---|---|---|---|---|

### New (Critic, 2026-11-17)
| id | found | area | sev | finding | fix | probe | status |
|---|---|---|---|---|---|---|---|

### New (Critic, 2026-11-21)
| id | found | area | sev | finding | fix | probe | status |
|---|---|---|---|---|---|---|---|
| M12 | 11-21 | marketing | MED | REGRESSION of a closed item. After the marketing redesign (62bf5e8/8a542c2, bundle main.72136695) the phone nav buttons measure Menu 36px, Sign in 28px, Get started 34px at 430 wide; tap targets under 44 (Marketing.js:23 `.mk-signin` padding 8px 12px, :25 `.mk-cta` padding 11px 20px, :27 `.mk-menu-btn` padding 9px 14px) | min-height:44px on the three classes | ledger_probes.py M12 | OPEN (2026-11-21, probe FAIL live) |
| N07 | 11-21 | marketing/home | MED | Marketing promises "Thirty seconds a night" / "thirty-second check-in each night" (Marketing.js:337,616,661) but the app's own nightly check-in is labelled "2 minutes" (objects/index.js:234 tonight.time; Dashboard.js:2102 "Due now · takes 2 minutes") and the marketing Home mock itself shows "Start tonight's check-in 2 minutes". A $399 buyer is told two different durations (related X05) | one number everywhere: measure the real check-in and fix whichever copy is wrong | bundle_probes.py N07 | OPEN (2026-11-21, probe FAIL live) |
| N08 | 11-21 | marketing | LOW | "A lab test alone costs $150 to $300" (Marketing.js:604) is an unsourced price claim, same class as M07 | cite or cut | - | OPEN |

### New (Critic, 2026-11-15 Sunday full pass)
| id | found | area | sev | finding | fix | probe | status |
|---|---|---|---|---|---|---|---|
| X01 | 11-15 | weekly/history | HIGH | Weekly insight renders "Bloating, dropped, from, 6, to, 5, , a, 17%, improvement". WeeklyCheckin.js:357-360: sweep be556f2 turned `[—–-]` into `[, –]`, so every space becomes ", ". Saved insight in History corrupted the same way (CONFIRMED in source tonight) | restore `[—–-]` at 357, 358, 360 (as aiInsights.js:6-11) | submit weekly, assert no `\w, \w, \w` | OPEN (2026-11-15) |
| N03 | (extended 11-15) | all | MED | full list of lowercase fragments from sweep: AskSensify 118,266; MaintainHub 55,338; ReintroductionSurvey 210,227,329; ReintroTab 138,156,271,666,841,846,1086,1096,1103,1104; LabResults 172,246,416,435,439,626,627; DailyCheckin 254,638; Dashboard 1345,1533,1853,1913,1951,2019,2190,2354,2425; WeeklyCheckin 480,498,576,674,724; FoodMap 306,338,375; IntakeSurvey 387,659,685,755; CheckinHistory 627 | capitalise or comma | grep `\. [a-z]` in string literals | OPEN (2026-11-15) |
| X05 | 11-15 | reintro washout | MED | "Tonight's check asks one thing" / "1 minute" but form asks plan, sleep, stress, water, cycle | align | - | OPEN |
| X06 | 11-15 | reintro | MED | verdict opens on day 14 (washout day 11 of 11, unlogged) while day-13 copy says "the day after washout ends" | align gate/copy (F06) | - | OPEN |
| X07 | 11-15 | reintro | MED | Reintro tab "Fourteen days are on the record" vs Home "Five nights"; ReintroductionSurvey.js:253-254 still writes 'Limit' on empty logs if activeReintroId null or query fails | count logged nights; early return in handleSubmit | - | OPEN |
| X08 | 11-15 | verdict | HIGH | AI analysis claimed "both symptom days coincided with your worst sleep nights" when all nights were 7h (ties): invented; ruling leaks "a one-level adjustment from Avoid to Limit is reasonable" | strict sleep gap before claiming confound; strip engine wording | identical sleep every night, assert "worst sleep" absent | OPEN |
| X09 | 11-15 | history | MED | "+4% better than baseline / this first week" is an invented composite | remove or one named metric | - | OPEN |
| X10 | 11-15 | food map | MED | "83 days of your record later:" dangling colon in app and PDF; 83 is calendar days; "14 day" vs "fourteen-day" | rewrite, count logged days | pdftotext, line ending ":" | OPEN |
| X11 | 11-15 | reintro | LOW | headline after logging exposure day 1: "Exposure day 2 of 3. Eat cow milk." vs body "Today's log is in" (F04 residual) | sync headline | - | OPEN |
| X13 | 11-15 | design | LOW | emoji at Dashboard.js:1415,1524; italic SlipupSurvey.js:171; arrows survive on "Get my verdict →" etc.; lowercase "sensify" on weekly | remove | grep | OPEN |
| X14 | 11-15 | jargon | LOW | undefined: washout, day-zero score, baseline sharpness/"within 2.5", FODMAPs, antibody-based, IgG; "cycle" ambiguous (trial vs menstrual) | gloss at first use | - | OPEN |
| X15 | 11-15 | weekly | LOW | "17% improvement ... clearest signal so far" off a 1-point week-one change; stale-restart reason "five days" vs "fourteen days" | cap claim, align | - | OPEN |
| X16 | 11-15 | marketing | HIGH | page promises "Complete your lab test from home ... part of the $399" but no code collects shipping address or orders a kit (grep src/netlify empty); home jumps from intake to "I took my test" | [ALEX] say how/when kit arrives or build address capture (ties D02) | grep -rniE "shipping_address" netlify src | OPEN [ALEX] TBD (2026-11-20): kit fulfilment undecided |
| X17 | 11-15 | lab | MED | submit error rendered at page top (LabResults.js:464), button at bottom (:657): phone user sees nothing; "Review my entry" disabled with no hint (:658) | scrollIntoView / hint line | - | OPEN (2026-11-19: fix deployed in ff2a85b, bundle probe PASS in qa/bundle_probes.py; behavioural walk owed Sunday 11-22) |
| X19 | 11-15 | marketing/home | MED | "builds your elimination list in seconds" beside "usually within a day" now in marketing too (D04) | one honest timeline | - | OPEN |
| X20 | 11-15 | home | LOW | "1 foods total"/"0 foods total" (Dashboard.js:2297); "begins tomorrow" x4 on day 1; "day zero" vs Day 1; D11/D12 legend absent on day-27 layout | pluralise, dedupe | - | OPEN |
| X21 | 11-15 | account | HIGH | D16 confirmed: More sheet (Dashboard.js:1391-1399) has no export/delete; no netlify function; privacy.html silent | add export + delete, or state email-us path + SLA | grep export/delete in More + functions | OPEN: email-us export/delete path added (More sheet + privacy.html) f8d50ff (deployed 2026-11-20, bundle main.52b72da9); live walk owed |
| X22 | 11-15 | ask | MED | askSensify.js ~60-120 has no brief for "is 8 weeks enough / can this hurt me" or "quit and get my data"; red flags cover only severe reactions mid-answer (D14) | static FAQ block in prompt | live ask both, fail on invented policy | OPEN |
| X23 | 11-15 | engine | LOW | verdictEngine.js:74 moderate check exact-case vs severe lowercased; moderateDays counts washout days (:73-75) | lowercase both; restrict phase | unit call Moderate x2 | OPEN |
| X24 | 11-15 | admin | LOW | AdminDashboard.js:866,985 say common track "held until physician sign-off" but protocolEngine.js:7-15 COMMON_TRACK_ENABLED = true (P08) | reconcile | grep | OPEN |
| X30 | 11-22 | signup/intake | HIGH | Safety screen comes AFTER the $399 payment: IntakeSurvey.js:510-545, any Yes shows "Please speak with your doctor before starting... we can't start it for you here. Email ..." (pregnancy, under 18, diabetes/insulin, eating-disorder history, diagnosed allergy). M01 = no refund; no checkout/marketing copy mentions the screen. Paid customer stranded. | show the six questions before checkout or add exclusion line at the CTA; [ALEX] decide the Yes path (refund or physician-cleared start) | answer Yes, look for refund/next-step copy | OPEN (2026-11-22) |
| X31 | 11-22 | lab/home | MED | After "I took my test" > "Yes, it's done", Home says "enter or upload your results whenever they arrive" but no upload control exists until intake is finished | "Finish your intake survey, then you can add your results here." | - | OPEN (2026-11-22) |
| X32 | 11-22 | home | MED | Day-0 card "Done with your test? Tell us so we know your results are on the way?" / "I took my test" shown before any kit exists (see X16) | fix with X16 [ALEX] | - | OPEN (2026-11-22) |
| X33 | 11-22 | marketing | MED | Promises human review no code implements: Marketing.js:346 "every flagged case is reviewed personally before any plan changes are suggested"; /science "No automated plan decisions that bypass human judgment"; Pricing "Compliance support with human review". No review queue in src/netlify | cut the claims or build the queue | grep -rniE "plan_change|review_queue|needs_review" src netlify (empty = still false) | OPEN (2026-11-22) |
| X34 | 11-22 | signup | MED | Signup.js:79 "No medical history needed" then intake asks six medical-history questions and symptom history | "Just the basics for your account." | - | OPEN (2026-11-22) |
| X35 | 11-22 | marketing | LOW | /science: trials give "reliable conclusions" / "standard clinical approach" with no citation (M07 class; P04 related) | one real reference or soften | - | OPEN (2026-11-22) |
| X36 | 11-22 | marketing | LOW | FAQ says bring to your doctor first if pregnant/breastfeeding, but intake hard-blocks those users | "Sensify is not for ..." | - | OPEN (2026-11-22) |
| X37 | 11-22 | intake | LOW | Food-frequency options "Rarely / Almost never / Never" near-duplicate | merge to "Rarely or never" | - | OPEN (2026-11-22) |
| X50 | 11-22 | daily/home | MED | Streak disagrees on one flow: celebration "One night in a row, tonight included." vs Home "Two nights in a row, tonight included." (F02 inverted; DailyCheckin.js:344-350 vs Home calc) | one shared streak helper | compare strings after day-2 check-in | OPEN (2026-11-22) |
| X51 | 11-22 | data | LOW | profiles.streak and current_day written never maintained (stay 0 at day 2) | drop or write; grep readers | - | OPEN (2026-11-22) |
| X52 | 11-22 | slipup/audit | LOW | SlipupSurvey.js:15,20,40 and ComplianceAudit.js:14,19,49,632 italics + inline #3D5C3C + lowercase "sensify" wordmark vs DESIGN.md (X13 residue) | same treatment as Home | - | OPEN (2026-11-22) |
| X53 | 11-22 | slipup | LOW | Page headed "Slip-up logged / What happened today?" then Submit reads optional | "Tell us about today's slip-up" | - | OPEN (2026-11-22) |
| X54 | 11-22 | home | LOW | More sheet text stays in page after tapping History (stale sheet?) | check goTab closes it | assert .snfy-more-sheet gone | OPEN (2026-11-22) |
| X55 | 11-22 | daily | LOW | "Where are you in your cycle?" unexplained; "cycle" also means reintro cycle (X14) | "(optional, helps separate hormones from foods)" | - | OPEN (2026-11-22) |
| X70 | 11-22 | ask | MED | Ask told a user on exposure day 1 (serving already logged) "The cheddar is actually fine right now since cow milk is your active trial food this week, so dairy is back on the plate." Second dose corrupts one-food record; "this week" wrong in washout | askSensify.js:39-43 ACTIVE TRIAL block: one serving per exposure day, say if logged, never "dairy is back"; pass loggedToday | ask the cheddar question after logging | OPEN (2026-11-22) |
| X71 | 11-22 | design | LOW | Verdict colours off-verdict: CheckinHistory.js:568 amber dot; FoodMap.js:443 Safe teal pulse todayMark; FoodMap.js:172 Avoid red symptom names | forest/ink | - | OPEN (2026-11-22) |
| X72 | 11-22 | verdicts | LOW | 0 ruled: hint "Tap a ruled food for its day-by-day record." + footer "Ruled by your record. Nothing assumed." duplicates header | hide hint, drop footer | - | OPEN (2026-11-22) |
| X73 | 11-22 | reintro | LOW | CommonTrackDecision.js:131,142 native alert() for save errors; setSaving not reset on throw | inline error, try/finally | - | OPEN (2026-11-22) |
| X74 | 11-22 | reintro | LOW | ReintroductionSurvey.js ~352-357 food_map upsert fails after one retry, console.error only; user still sees "added to your Safe list" | re-read before success line | - | OPEN (2026-11-22) |
| X75 | 11-22 | ask | LOW | Ask landing "I know your Food Map... and your lab results" cannot answer "is this protocol right for me" without invented claims (X22) | resolve with X22 static FAQ | - | OPEN (2026-11-22) |

## FIXED
| id | evidence (tonight's fresh re-test) |
|---|---|
|  X18 | FIXED (2026-11-19, ff2a85b; live /faq /science /pricing open their tab, bundle_probes.py PASS) |
|  N05 | FIXED (2026-11-19, ff2a85b + 625430c: MaintainHub.js:106 and Support.js:183; bundle_probes.py N05 PASS live) |
|  N03 | FIXED (2026-11-19, 74331b6 already shipped the fix; the old probe's '.' matched a comma, false positive. bundle_probes.py N03 PASS on main.11b4ad87) |
|  N02 | FIXED (2026-11-19, qa/regress_all.py: new --fleet-only flag so base suite and fleet run in separate windows; owed scheduling split) |
|  N04 | FIXED (2026-11-19, qa/regress_all.py: wait_ready after gate(r) before reading unlock_hero text; owed one clean full run to confirm) |
|  X25 | FIXED (2026-11-19, qa/fleetkit.py: check-in selector re-keyed to the curly apostrophe in "Start tonight’s check-in" after the 11-16 redesign; all four fleet.*.day_logged PASS live. It was harness drift, not a product bug) |
|  X03 | FIXED (2026-11-17, 74331b6; src has no \u escape in JSX text for Home/objects; live bundle shows escapes only inside JS strings; residual N05 in MaintainHub) |
|  P05 | FIXED (2026-11-15, found by fresh live walk; live: no running-verdict needle on Home or Reintro tab mid-cycle) |
|  P12 | FIXED (2026-11-15, found by fresh live walk; live: zero-log cycle blocked on Home ("needs a fresh start"), no survey button (code residual: N-X07 guard)) |
|  M04 | FIXED (2026-11-15, found by fresh live walk; live: price card with CTA follows The Outcome) |
|  M11 | FIXED (2026-11-15, found by fresh live walk; live: hero micro-copy alpha 0.78) |
|  F01 | FIXED (2026-11-15, found by fresh live walk; live: sleep 75 shows "Between 0 and 14 hours." and blocks (residual: X04)) |
|  F03 | FIXED (2026-11-15, found by fresh live walk; live: PDF header reads "FOOD MAP · EARNED BY TESTING", no "3 DAYS") |
|  F12 | FIXED (2026-11-15, found by fresh live walk; live: Tested chip reads "Days 57 to 70") |
|  M06 | FIXED (2026-11-11, 9fb7045; live home text has "months") |
|  M08 | FIXED (2026-11-11, 1a5820d; live home shows EXAMPLE label) |
|  M09 | FIXED (2026-11-11, 9fb7045; live home + /faq carry safety/physician answer) |
|  M12 | FIXED (2026-11-11, 9fb7045; nav buttons measure 44px at 430). REOPENED 2026-11-21, see OPEN New 2026-11-21 |
|  D10 | FIXED (2026-11-11, 7782255; live bundle: "Low flags sit out the full stretch too...") |
|  D17 | FIXED (2026-11-11, e4fabbe; live bundle gate regex ^alexandermayer2002\+(fable|qa|robot)[^@]*@gmail\.com$; logged-out home lacks TEST MODE) |
|  F09 | FIXED (2026-11-11, 52abce4; live bundle: "worse than baseline" wording) |
| X02 | 11-15 | daily/slipup | HIGH | slip-up/audit ask missing on Home after No | - | live walk: Home shows "What happened today? ... Tell us what happened" | FIXED (2026-11-22, f8d50ff, live) |
| X04 | 11-15 | daily | MED | out-of-range sleep silent | - | live: "Between 0 and 14 hours. Tap to fix it." | FIXED (2026-11-22, ff2a85b, live) |

Probes live in qa/ledger_probes.py (text, 430x932).

## WONTFIX
(Alex's calls, with date and reason)
