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

**Re-test 2026-11-19 (Thursday; no src/netlify/public commits in 36h, bundle main.dbcfe342 unchanged, no deep walk):** probes M03/M01/D01 FAIL (Alex decisions), M06 M07 M08 M09 M09b M12 D17 D03 PASS. N03 and N05 still live in bundle (1 each). X25 unchanged (same 4 fleet day_logged FAILs, sandbox vs app date). Full regress_all completed this time: 59/63. No item closed, none new. Code-fixed items still await the Sunday 11-22 live walk.

**Re-test 2026-11-18 (Wednesday; no src/netlify/public commits in 36h, bundle main.dbcfe342 unchanged, no deep walk):** probes M03/M01/D01 FAIL (Alex decisions), M06 M07 M08 M09 M09b M12 D17 D03 PASS. N03 and N05 still present in live bundle (grep 1 each). X25 unchanged (4 fleet day_logged FAILs, sandbox vs app date). No item closed, none new. Code-fixed items (X01, X08, X23, X07, X10, X13, X20) still await the Sunday 11-22 live walk.

**Re-test 2026-11-17 (Tuesday; deploys ce4732c, 99e5e26, 74331b6 within 36h; bundle main.dbcfe342):** X03 closed (no literal \u escape in JSX text in src or bundle except new N05). X01, X08, X23, X07, X10, X13, X20, N03 fixes verified in code only (regex at WeeklyCheckin.js:357-361 correct, verdictEngine.js:74 lowercased); still OPEN until a live text walk passes (owed Sunday 11-22). Probes M03/M01/D01 FAIL (Alex decisions), rest PASS.

**Fixed in code and deployed 2026-11-16 (74331b6, bundle main.0f38604a), awaiting the fresh live re-test tonight before closing:** X01, X03, N03 (all fragments in be556f2 added user-facing lines), X08 (no sleep overlap without 1h spread), X23, X07, X10, X13, X20 (foods total only). Not done, need a decision or are bigger: X02, X21, X16, X17, X18, X04, X05, X06, X09, X11, X15, F02, F05, F13.

**Re-test 2026-11-16 (Monday, no deploys in 36h, no deep walk):** every OPEN row re-tested by probe where one exists, otherwise unchanged by git log (no src/netlify/public commits since 11-13). Probes: M03 FAIL, M01 FAIL, D01 FAIL (still open, Alex decisions); M07 probe now PASSES ('clinical standard' x0): candidate to close once the "certainty" overclaim is re-read on the next walk. M06/M08/M09/M09b/M12/D17/D03 PASS. No item closed tonight. No new items. X25 extended: day_logged date FAILs again (elimearly, elimlate, audit; sandbox date vs app date) and one 502 console error on fleet.elimlate (environmental, single occurrence). N02 reconfirmed: regress_all fleet portion still ~15+ min; run cut at 40 PASS / 4 FAIL.

### Protocol (method) — source: 2026-11-06-protocol-critique.md
| id | found | area | sev | finding | fix | probe | status |
|---|---|---|---|---|---|---|---|
|  P01 | 11-06 | intake/reintro | HIGH | No intake screening for diagnosed allergy, anaphylaxis, pregnancy, age, ED history; common track says "Eat {food} today" for tree nuts/eggs/soy; only warning lives in an AI briefing | [ALEX + physician] static non-AI intake gate; static red-flag card on every exposure day | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  P02 | 11-06 | verdicts | HIGH | verdictEngine washout rule: any had_symptoms washout day blocks Safe and bumps Limit->Avoid; ~80% base-rate chance at typical noise floor | require washout symptoms to exceed the user's own noise floor (and match type) before escalation | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  P03 | 11-06 | verdicts | HIGH | "severe always = Avoid" enforced by AI prompt only, not code | enforce in verdictEngine before AI adjustment | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 8c251db, live walk owed; verify next deep walk) |
|  P04 | 11-06 | copy | MED | verdict + marketing language claims certainty the 3-exposure design cannot produce | [ALEX] soften to earned-confidence language; cite what one cycle can distinguish | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  P06 | 11-06 | verdicts | MED | what 3 exposures in 1 cycle can statistically distinguish is unstated; moderateCount bug in verdictEngine | fix moderateCount; add a confidence line to the ruling | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 89d8528, live walk owed; verify next deep walk) |
|  P07 | 11-06 | method | MED | 56 days, 3+11, thresholds need a citation or a dataset before a physician signs | [ALEX] source the numbers; show the source in Science | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  P08 | 11-06 | code | MED | safety gates flipped on before the review the code comments promised | reconcile comments and gates; document the review | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 1a5820d, live walk owed; verify next deep walk) |
|  P09 | 11-06 | verdicts | MED | engine temperament is heavily false-positive, mismatching the product's measured-not-assumed posture | re-tune after P02/P06 | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  P10 | 11-06 | insights | MED | "A food never gets blamed for what your sleep did" overstates the confound layer | soften copy or strengthen the layer | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  P11 | 11-06 | insights | LOW | confound engines well-gated but say too little; three loose screws | per report detail | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |

### Marketing — source: 2026-11-06-marketing-teardown.md
| id | found | area | sev | finding | fix | probe | status |
|---|---|---|---|---|---|---|---|
|  M01 | 11-06 | marketing | HIGH | no risk reversal on a $399 ask; refund language only in Pricing fine print | [ALEX] concrete guarantee at every CTA, only if honored | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: Alex made refund copy silent (9eaaeb8); probe FAILs. Needs Alex decision.) |
|  M02 | 11-06 | marketing | HIGH | zero proof layer; founder note sits below the final CTA; no named lab partner | [ALEX] move founder note above CTA; name lab partner; one real citation | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: founder note rewrite shipped (9fb7045); lab partner still unnamed.) |
|  M03 | 11-06 | marketing | HIGH | page never names the buyer's symptoms; hero sells mechanics | rewrite hero sub to name bloating, brain fog, reflux, low energy | grep live main.js for "brain fog" in hero sub | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: Alex shipped a symptom-vague hero (9fb7045); probe still FAILs. Propose WONTFIX [ALEX].) |
|  M05 | 11-06 | marketing | MED | CTA dead zone of ~4 phone screens mid-page | one primary CTA per ~1.5 screens | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 9fb7045, live walk owed; verify next deep walk) |
|  M07 | 11-06 | marketing | MED | "clinical standard" x4 with zero citation; overclaims ("certainty") | cite or cut | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: home body clean tonight; "clinical standard" still x2 in bundle (price inclusions + feature card).) |
|  M10 | 11-06 | marketing | LOW | hero primary CTA (pale sage) quieter than nav button | make hero CTA the loudest | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 9fb7045, live walk owed; verify next deep walk) |
|  M13 | 11-06 | marketing | LOW | desktop H1 orphans "handle." at 1440px | balance wrap | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 9fb7045, live walk owed; verify next deep walk) |
|  M14 | 11-06 | marketing | LOW | redundant copy: problem card 1 restates intro; FAQ duplicates | dedupe | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 15b4b11, live walk owed; verify next deep walk) |
|  M15 | 11-06 | marketing | LOW | mobile dead air after "See the full program" | tighten section padding at 430px | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 9fb7045, live walk owed; verify next deep walk) |

### First-timer comprehension — source: 2026-11-06-firsttimer-doubter.md
| id | found | area | sev | finding | fix | probe | status |
|---|---|---|---|---|---|---|---|
|  D01 | 11-06 | marketing/science | MED | "why eight weeks?" never defended anywhere | one sentence in Science + hero tooltip | text probe: Science page explains the 56-day choice | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: probe FAIL 11-11: no "why eight weeks" copy in bundle.) |
|  D02 | 11-06 | marketing | MED | "$399 · lab test included" names no lab, panel, or certification | [ALEX] name the lab partner and panel (ties to kit decision) | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  D03 | 11-06 | signup | LOW | "Paid but never finished setting up?" door unexplained | one-line explanation | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: door text present, still unexplained.) |
|  D04 | 11-06 | home | MED | "AI builds your elimination list in seconds" claim vs reality | align copy with actual flow | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 0349664?, live walk owed; verify next deep walk) |
|  D05 | 11-06 | home | MED | "reviewed usually within a day" vs instant test-door approval reads fake | [ALEX] honest review-time copy | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: copy now "Alex M. checks every entry, usually within a day" (0349664); test-door instant approval unchanged.) |
|  D06 | 11-06 | lab | LOW | manual lab entry copy unclear to a skeptic | per report | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  D07 | 11-06 | lab | LOW | "My report shows no sensitivities" path unclear | per report | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: fix shipped 0349664, live walk owed; verify next deep walk) |
|  D08 | 11-06 | lab | LOW | review step | per report | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  D09 | 11-06 | lab | MED | "submit for review" approved instantly reads fake (test door) | per report; D05 | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  D11 | 11-06 | home | LOW | Suspect Board "How this works" | per report | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  D12 | 11-06 | home | LOW | streak legend | per report | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  D13 | 11-06 | home | LOW | Household Card | per report | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  D14 | 11-06 | ask | MED | Ask Sensify's answers to the two hardest skeptic questions | per report | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  D15 | 11-06 | support | MED | "a real person replies, usually within a day" | [ALEX] the 24h SLA decision | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no change found) |
|  D16 | 11-06 | account | MED | "Can I quit and get my data?" has no export/deletion | settings surface: export + delete | - | OPEN (re-tested 2026-11-14: no change seen, but deploy 63c292a + be556f2 shipped 11-13 so this owes the Sunday deep walk; prior 2026-11-13: unchanged; prior 11-11: no export/delete-account surface found in src.; no export/delete-account surface found in src.) |

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
| N01 | 11-11 | maintain | LOW | cancel-maintain-setup.js detaches EVERY saved card on the Stripe customer, including the card used for the $399 purchase; the client copy says only the Maintain reservation is cancelled | detach only the PaymentMethod saved by the Maintain setup (store its id), or say "your saved card is removed" in the cancel confirm | - | OPEN (found 2026-11-11, code read only) |
| N02 | 11-11 | harness | LOW | regress_all.py full run (incl. fleet) exceeds 25 min (11-14: killed at 10 min, only 1 fleet persona ran; sentinel+fault never reached, run separately); tail personas cut off by the timeout so passed/total is partial | split fleet into its own nightly job or parallelise | - | OPEN (found 2026-11-11) |

### New (Critic, 2026-11-14)
| id | found | area | sev | finding | fix | probe | status |
|---|---|---|---|---|---|---|---|
| N03 | 11-14 | home/all | MED | The 11-13 "em-dashes removed" sweep (be556f2) swapped each dash for a period, leaving lowercase mid-sentence fragments live on Home: "Your elimination list. the foods you'll avoid for 8 weeks. appears here once your results are in" (Dashboard.js:2354); "At 28 nights. four clean weeks of check-ins. they form a constellation" (2425); "Setup complete. your results are in review" (1853); "Usually ready within a day. it will meet you here." (1913); "Slip-up logged. thank you" (1951); "Your data is safe. we just couldn't load it" (1345). Also the safety panel: "That didn't save. please try again." (ReintroTab.js:666), WeeklyCheckin.js:480, FoodMap.js:306, LabResults.js:172,626, ReintroTab.js:138. | replace each ". lowercase" with a comma, colon or a full new sentence; grep `[a-z]\. [a-z]{3,}` inside string literals | curl main.js, grep -c "Your elimination list. the foods" (0 when fixed) | OPEN (found 2026-11-14; live bundle main.7f82e092) |
| N04 | 11-14 | harness | LOW | regress_all p1.unlock_hero FAILed once on the first run (page text was only "Sensify."; page not ready after skip57) and PASSed on immediate re-run: flaky wait, not a product regression | wait_ready after gate(r) in run_p1 before reading text | - | OPEN (found 2026-11-14) |

### New (Critic, 2026-11-17)
| id | found | area | sev | finding | fix | probe | status |
|---|---|---|---|---|---|---|---|
| N05 | 11-17 | maintain | MED | After opting into Maintain, the green check circle renders the literal text `\u2713` (MaintainHub.js:106, JSX text does not process escapes; live bundle has children:"\\u2713"). Same bug class as X03 | change to `{'\u2713'}` or the character | curl main.js, fail if `children:"\\\\u` appears | OPEN (2026-11-17) |

### New (Critic, 2026-11-15 Sunday full pass)
| id | found | area | sev | finding | fix | probe | status |
|---|---|---|---|---|---|---|---|
| X01 | 11-15 | weekly/history | HIGH | Weekly insight renders "Bloating, dropped, from, 6, to, 5, , a, 17%, improvement". WeeklyCheckin.js:357-360: sweep be556f2 turned `[—–-]` into `[, –]`, so every space becomes ", ". Saved insight in History corrupted the same way (CONFIRMED in source tonight) | restore `[—–-]` at 357, 358, 360 (as aiInsights.js:6-11) | submit weekly, assert no `\w, \w, \w` | OPEN (2026-11-15) |
| X02 | 11-15 | daily/slipup | HIGH | After a "No" (3 in a row) Home shows no "Tell us what happened"/audit entry; showSlipupCard/showAuditCard (Dashboard.js:1223,1934) only in legacy branch, HomeElimination has none; SlipupSurvey+ComplianceAudit unreachable, slip_up_reason stays null | add slip-up/audit rows to HomeElimination | log 3 Nos, assert "Tell us what happened" on Home | OPEN (2026-11-15; one agent walk, live) |
| N03 | (extended 11-15) | all | MED | full list of lowercase fragments from sweep: AskSensify 118,266; MaintainHub 55,338; ReintroductionSurvey 210,227,329; ReintroTab 138,156,271,666,841,846,1086,1096,1103,1104; LabResults 172,246,416,435,439,626,627; DailyCheckin 254,638; Dashboard 1345,1533,1853,1913,1951,2019,2190,2354,2425; WeeklyCheckin 480,498,576,674,724; FoodMap 306,338,375; IntakeSurvey 387,659,685,755; CheckinHistory 627 | capitalise or comma | grep `\. [a-z]` in string literals | OPEN (2026-11-15) |
| X04 | 11-15 | daily | MED | out-of-range sleep (75) stays after closing the pad; "Done for today" disabled with no message | persistent inline error | enter 75, tap Stress, assert "Between 0 and 14" | OPEN |
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
| X16 | 11-15 | marketing | HIGH | page promises "Complete your lab test from home ... part of the $399" but no code collects shipping address or orders a kit (grep src/netlify empty); home jumps from intake to "I took my test" | [ALEX] say how/when kit arrives or build address capture (ties D02) | grep -rniE "shipping_address" netlify src | OPEN |
| X17 | 11-15 | lab | MED | submit error rendered at page top (LabResults.js:464), button at bottom (:657): phone user sees nothing; "Review my entry" disabled with no hint (:658) | scrollIntoView / hint line | - | OPEN |
| X18 | 11-15 | marketing | MED | /science /faq /pricing /how-it-works all render the home page (state tabs, no href) | map path to tab | goto /faq shows "Things people ask us" | OPEN |
| X19 | 11-15 | marketing/home | MED | "builds your elimination list in seconds" beside "usually within a day" now in marketing too (D04) | one honest timeline | - | OPEN |
| X20 | 11-15 | home | LOW | "1 foods total"/"0 foods total" (Dashboard.js:2297); "begins tomorrow" x4 on day 1; "day zero" vs Day 1; D11/D12 legend absent on day-27 layout | pluralise, dedupe | - | OPEN |
| X21 | 11-15 | account | HIGH | D16 confirmed: More sheet (Dashboard.js:1391-1399) has no export/delete; no netlify function; privacy.html silent | add export + delete, or state email-us path + SLA | grep export/delete in More + functions | OPEN (links D16) |
| X22 | 11-15 | ask | MED | askSensify.js ~60-120 has no brief for "is 8 weeks enough / can this hurt me" or "quit and get my data"; red flags cover only severe reactions mid-answer (D14) | static FAQ block in prompt | live ask both, fail on invented policy | OPEN |
| X23 | 11-15 | engine | LOW | verdictEngine.js:74 moderate check exact-case vs severe lowercased; moderateDays counts washout days (:73-75) | lowercase both; restrict phase | unit call Moderate x2 | OPEN |
| X24 | 11-15 | admin | LOW | AdminDashboard.js:866,985 say common track "held until physician sign-off" but protocolEngine.js:7-15 COMMON_TRACK_ENABLED = true (P08) | reconcile | grep | OPEN |
| X25 | 11-15 | harness | LOW | regress_all 11-15: fleet.{elimearly,elimlate,audit,reintro}.day_logged FAIL "no daily_factors row for 2026-11-15" (date.today() in sandbox vs app date); single-persona re-run timed out at goto 9s; p5.file_stored FAIL once, PASS on re-run (flake). Unconfirmed: product vs harness | re-key to app-local date; wait longer | rerun persona by day | OPEN (inconclusive) |

## FIXED
| id | evidence (tonight's fresh re-test) |
|---|---|
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
|  M12 | FIXED (2026-11-11, 9fb7045; nav buttons measure 44px at 430) |
|  D10 | FIXED (2026-11-11, 7782255; live bundle: "Low flags sit out the full stretch too...") |
|  D17 | FIXED (2026-11-11, e4fabbe; live bundle gate regex ^alexandermayer2002\+(fable|qa|robot)[^@]*@gmail\.com$; logged-out home lacks TEST MODE) |
|  F09 | FIXED (2026-11-11, 52abce4; live bundle: "worse than baseline" wording) |

Probes live in qa/ledger_probes.py (text, 430x932).

## WONTFIX
(Alex's calls, with date and reason)
