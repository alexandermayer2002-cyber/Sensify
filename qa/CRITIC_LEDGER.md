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

### Protocol (method) — source: 2026-11-06-protocol-critique.md
| id | found | area | sev | finding | fix | probe | status |
|---|---|---|---|---|---|---|---|
|  P01 | 11-06 | intake/reintro | HIGH | No intake screening for diagnosed allergy, anaphylaxis, pregnancy, age, ED history; common track says "Eat {food} today" for tree nuts/eggs/soy; only warning lives in an AI briefing | [ALEX + physician] static non-AI intake gate; static red-flag card on every exposure day | - | OPEN (re-tested 2026-11-11: no change found) |
|  P02 | 11-06 | verdicts | HIGH | verdictEngine washout rule: any had_symptoms washout day blocks Safe and bumps Limit->Avoid; ~80% base-rate chance at typical noise floor | require washout symptoms to exceed the user's own noise floor (and match type) before escalation | - | OPEN (re-tested 2026-11-11: no change found) |
|  P03 | 11-06 | verdicts | HIGH | "severe always = Avoid" enforced by AI prompt only, not code | enforce in verdictEngine before AI adjustment | - | OPEN (re-tested 2026-11-11: fix shipped 8c251db, live walk owed; verify next deep walk) |
|  P04 | 11-06 | copy | MED | verdict + marketing language claims certainty the 3-exposure design cannot produce | [ALEX] soften to earned-confidence language; cite what one cycle can distinguish | - | OPEN (re-tested 2026-11-11: no change found) |
|  P05 | 11-06 | reintro | MED | EvidenceNeedle shows the running verdict mid-cycle, violating the protocol's own blinding principle | [ALEX] hide needle until verdict day, or show logging completeness only | - | OPEN (re-tested 2026-11-11: fix shipped 89d8528, live walk owed; verify next deep walk) |
|  P06 | 11-06 | verdicts | MED | what 3 exposures in 1 cycle can statistically distinguish is unstated; moderateCount bug in verdictEngine | fix moderateCount; add a confidence line to the ruling | - | OPEN (re-tested 2026-11-11: fix shipped 89d8528, live walk owed; verify next deep walk) |
|  P07 | 11-06 | method | MED | 56 days, 3+11, thresholds need a citation or a dataset before a physician signs | [ALEX] source the numbers; show the source in Science | - | OPEN (re-tested 2026-11-11: no change found) |
|  P08 | 11-06 | code | MED | safety gates flipped on before the review the code comments promised | reconcile comments and gates; document the review | - | OPEN (re-tested 2026-11-11: fix shipped 1a5820d, live walk owed; verify next deep walk) |
|  P09 | 11-06 | verdicts | MED | engine temperament is heavily false-positive, mismatching the product's measured-not-assumed posture | re-tune after P02/P06 | - | OPEN (re-tested 2026-11-11: no change found) |
|  P10 | 11-06 | insights | MED | "A food never gets blamed for what your sleep did" overstates the confound layer | soften copy or strengthen the layer | - | OPEN (re-tested 2026-11-11: no change found) |
|  P11 | 11-06 | insights | LOW | confound engines well-gated but say too little; three loose screws | per report detail | - | OPEN (re-tested 2026-11-11: no change found) |
|  P12 | 11-06 | verdicts | HIGH | a verdict can be issued with zero logged evidence | block the survey when no daily logs exist; require minimum exposure logs | - | OPEN (re-tested 2026-11-11: fix shipped 89d8528, live walk owed; verify next deep walk) |

### Marketing — source: 2026-11-06-marketing-teardown.md
| id | found | area | sev | finding | fix | probe | status |
|---|---|---|---|---|---|---|---|
|  M01 | 11-06 | marketing | HIGH | no risk reversal on a $399 ask; refund language only in Pricing fine print | [ALEX] concrete guarantee at every CTA, only if honored | - | OPEN (re-tested 2026-11-11: Alex made refund copy silent (9eaaeb8); probe FAILs. Needs Alex decision.) |
|  M02 | 11-06 | marketing | HIGH | zero proof layer; founder note sits below the final CTA; no named lab partner | [ALEX] move founder note above CTA; name lab partner; one real citation | - | OPEN (re-tested 2026-11-11: founder note rewrite shipped (9fb7045); lab partner still unnamed.) |
|  M03 | 11-06 | marketing | HIGH | page never names the buyer's symptoms; hero sells mechanics | rewrite hero sub to name bloating, brain fog, reflux, low energy | grep live main.js for "brain fog" in hero sub | OPEN (re-tested 2026-11-11: Alex shipped a symptom-vague hero (9fb7045); probe still FAILs. Propose WONTFIX [ALEX].) |
|  M04 | 11-06 | marketing | MED | no price or CTA near "The outcome" where desire peaks | compact pricing card after The Outcome | - | OPEN (re-tested 2026-11-11: fix shipped 9fb7045, live walk owed; verify next deep walk) |
|  M05 | 11-06 | marketing | MED | CTA dead zone of ~4 phone screens mid-page | one primary CTA per ~1.5 screens | - | OPEN (re-tested 2026-11-11: fix shipped 9fb7045, live walk owed; verify next deep walk) |
|  M07 | 11-06 | marketing | MED | "clinical standard" x4 with zero citation; overclaims ("certainty") | cite or cut | - | OPEN (re-tested 2026-11-11: home body clean tonight; "clinical standard" still x2 in bundle (price inclusions + feature card).) |
|  M10 | 11-06 | marketing | LOW | hero primary CTA (pale sage) quieter than nav button | make hero CTA the loudest | - | OPEN (re-tested 2026-11-11: fix shipped 9fb7045, live walk owed; verify next deep walk) |
|  M11 | 11-06 | marketing | LOW | hero micro-copy at 50% / 38% alpha on dark green illegible | raise to >= 70% alpha | - | OPEN (re-tested 2026-11-11: fix shipped 9fb7045, live walk owed; verify next deep walk) |
|  M13 | 11-06 | marketing | LOW | desktop H1 orphans "handle." at 1440px | balance wrap | - | OPEN (re-tested 2026-11-11: fix shipped 9fb7045, live walk owed; verify next deep walk) |
|  M14 | 11-06 | marketing | LOW | redundant copy: problem card 1 restates intro; FAQ duplicates | dedupe | - | OPEN (re-tested 2026-11-11: fix shipped 15b4b11, live walk owed; verify next deep walk) |
|  M15 | 11-06 | marketing | LOW | mobile dead air after "See the full program" | tighten section padding at 430px | - | OPEN (re-tested 2026-11-11: fix shipped 9fb7045, live walk owed; verify next deep walk) |

### First-timer comprehension — source: 2026-11-06-firsttimer-doubter.md
| id | found | area | sev | finding | fix | probe | status |
|---|---|---|---|---|---|---|---|
|  D01 | 11-06 | marketing/science | MED | "why eight weeks?" never defended anywhere | one sentence in Science + hero tooltip | text probe: Science page explains the 56-day choice | OPEN (re-tested 2026-11-11: probe FAIL 11-11: no "why eight weeks" copy in bundle.) |
|  D02 | 11-06 | marketing | MED | "$399 · lab test included" names no lab, panel, or certification | [ALEX] name the lab partner and panel (ties to kit decision) | - | OPEN (re-tested 2026-11-11: no change found) |
|  D03 | 11-06 | signup | LOW | "Paid but never finished setting up?" door unexplained | one-line explanation | - | OPEN (re-tested 2026-11-11: door text present, still unexplained.) |
|  D04 | 11-06 | home | MED | "AI builds your elimination list in seconds" claim vs reality | align copy with actual flow | - | OPEN (re-tested 2026-11-11: fix shipped 0349664?, live walk owed; verify next deep walk) |
|  D05 | 11-06 | home | MED | "reviewed usually within a day" vs instant test-door approval reads fake | [ALEX] honest review-time copy | - | OPEN (re-tested 2026-11-11: copy now "Alex M. checks every entry, usually within a day" (0349664); test-door instant approval unchanged.) |
|  D06 | 11-06 | lab | LOW | manual lab entry copy unclear to a skeptic | per report | - | OPEN (re-tested 2026-11-11: no change found) |
|  D07 | 11-06 | lab | LOW | "My report shows no sensitivities" path unclear | per report | - | OPEN (re-tested 2026-11-11: fix shipped 0349664, live walk owed; verify next deep walk) |
|  D08 | 11-06 | lab | LOW | review step | per report | - | OPEN (re-tested 2026-11-11: no change found) |
|  D09 | 11-06 | lab | MED | "submit for review" approved instantly reads fake (test door) | per report; D05 | - | OPEN (re-tested 2026-11-11: no change found) |
|  D11 | 11-06 | home | LOW | Suspect Board "How this works" | per report | - | OPEN (re-tested 2026-11-11: no change found) |
|  D12 | 11-06 | home | LOW | streak legend | per report | - | OPEN (re-tested 2026-11-11: no change found) |
|  D13 | 11-06 | home | LOW | Household Card | per report | - | OPEN (re-tested 2026-11-11: no change found) |
|  D14 | 11-06 | ask | MED | Ask Sensify's answers to the two hardest skeptic questions | per report | - | OPEN (re-tested 2026-11-11: no change found) |
|  D15 | 11-06 | support | MED | "a real person replies, usually within a day" | [ALEX] the 24h SLA decision | - | OPEN (re-tested 2026-11-11: no change found) |
|  D16 | 11-06 | account | MED | "Can I quit and get my data?" has no export/deletion | settings surface: export + delete | - | OPEN (re-tested 2026-11-11: no export/delete-account surface found in src.; no export/delete-account surface found in src.) |

### Full end-to-end run — source: 2026-11-06-fullrun.md
| id | found | area | sev | finding | fix | probe | status |
|---|---|---|---|---|---|---|---|
|  F01 | 11-06 | daily | MED | day-1 check-in silently lost on out-of-range sleep ("75 hours") | validate + message, never silent | probe: submit sleep 75 and assert an error message | OPEN (re-tested 2026-11-11: fix shipped DailyCheckin.js:44 range warn (0-14h), live walk owed; verify next deep walk) |
|  F02 | 11-06 | daily | MED | post-check-in celebration streak is one higher than the dashboard, every time | single streak source | probe: compare the two numbers | OPEN (re-tested 2026-11-11: fix shipped e4fabbe, live walk owed; verify next deep walk) |
|  F03 | 11-06 | verdicts/pdf | MED | Food Map PDF says "EARNED FROM 3 DAYS OF TESTING" beside "14 day trial" | daysOfTesting must count cycle length, not exposure days | probe: PDF header text | OPEN (re-tested 2026-11-11: fix shipped e4fabbe, live walk owed; verify next deep walk) |
|  F04 | 11-06 | reintro | MED | after logging exposure day 1 in the evening, Reintro tab still says "eat Cow Milk today" | state-aware instruction once today's exposure is logged | - | OPEN (re-tested 2026-11-11: fix shipped e4fabbe, live walk owed; verify next deep walk) |
|  F05 | 11-06 | harness | MED | test-skip shifts logged_at but not log_date | fix the test function | probe: skip then compare both fields | OPEN (re-tested 2026-11-11: fix shipped e4fabbe, live walk owed; verify next deep walk) |
|  F06 | 11-06 | reintro | LOW | "14 days per cycle" but verdict unlocks on day 15 | align copy or math | - | OPEN (re-tested 2026-11-11: fix shipped 52abce4, live walk owed; verify next deep walk) |
|  F07 | 11-06 | daily | LOW | recall parser dropped granola bar and corn chips | prompt: list every distinct food | - | OPEN (re-tested 2026-11-11: recall parser now admits unread foods (52abce4) but still drops foods.) |
|  F08 | 11-06 | daily | LOW | slip receipt "getting your guidance" has no timeout or fallback | 6s fallback line | - | OPEN (re-tested 2026-11-11: fix shipped 52abce4, live walk owed; verify next deep walk) |
|  F10 | 11-06 | history | LOW | milestones list only "intake complete" after 59 days | record weekly/verdict/unlock milestones | - | OPEN (re-tested 2026-11-11: fix shipped 52abce4, live walk owed; verify next deep walk) |
|  F11 | 11-06 | maintain | LOW | "nothing is drifting" on 0 symptom logs | thin-data honesty line | probe: zero-log account shows the thin-data line | OPEN (re-tested 2026-11-11: fix shipped 52abce4, live walk owed; verify next deep walk) |
|  F12 | 11-06 | reintro | LOW | TESTED chip shows the cycle's start day, unlabeled | label as "started day N" or show verdict day | - | OPEN (re-tested 2026-11-11: fix shipped 52abce4, live walk owed; verify next deep walk) |
|  F13 | 11-06 | data | LOW | intake numerics stored as strings | cast on write | probe: read back types for a fresh account | OPEN (re-tested 2026-11-11: fix shipped 52abce4, live walk owed; verify next deep walk) |

### New (Critic, 2026-11-11)
| id | found | area | sev | finding | fix | probe | status |
|---|---|---|---|---|---|---|---|
| N01 | 11-11 | maintain | LOW | cancel-maintain-setup.js detaches EVERY saved card on the Stripe customer, including the card used for the $399 purchase; the client copy says only the Maintain reservation is cancelled | detach only the PaymentMethod saved by the Maintain setup (store its id), or say "your saved card is removed" in the cancel confirm | - | OPEN (found 2026-11-11, code read only) |
| N02 | 11-11 | harness | LOW | regress_all.py full run (incl. fleet) exceeds 25 min; tail personas cut off by the timeout so passed/total is partial | split fleet into its own nightly job or parallelise | - | OPEN (found 2026-11-11) |

## FIXED
| id | evidence (tonight's fresh re-test) |
|---|---|
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
