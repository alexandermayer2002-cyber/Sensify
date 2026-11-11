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
| P01 | 11-06 | intake/reintro | HIGH | No intake screening for diagnosed allergy, anaphylaxis, pregnancy, age, ED history; common track says "Eat {food} today" for tree nuts/eggs/soy; only warning lives in an AI briefing | [ALEX + physician] static non-AI intake gate; static red-flag card on every exposure day | - | OPEN (seed) |
| P02 | 11-06 | verdicts | HIGH | verdictEngine washout rule: any had_symptoms washout day blocks Safe and bumps Limit->Avoid; ~80% base-rate chance at typical noise floor | require washout symptoms to exceed the user's own noise floor (and match type) before escalation | - | OPEN (seed) |
| P03 | 11-06 | verdicts | HIGH | "severe always = Avoid" enforced by AI prompt only, not code | enforce in verdictEngine before AI adjustment | - | OPEN (seed) |
| P04 | 11-06 | copy | MED | verdict + marketing language claims certainty the 3-exposure design cannot produce | [ALEX] soften to earned-confidence language; cite what one cycle can distinguish | - | OPEN (seed) |
| P05 | 11-06 | reintro | MED | EvidenceNeedle shows the running verdict mid-cycle, violating the protocol's own blinding principle | [ALEX] hide needle until verdict day, or show logging completeness only | - | OPEN (seed) |
| P06 | 11-06 | verdicts | MED | what 3 exposures in 1 cycle can statistically distinguish is unstated; moderateCount bug in verdictEngine | fix moderateCount; add a confidence line to the ruling | - | OPEN (seed) |
| P07 | 11-06 | method | MED | 56 days, 3+11, thresholds need a citation or a dataset before a physician signs | [ALEX] source the numbers; show the source in Science | - | OPEN (seed) |
| P08 | 11-06 | code | MED | safety gates flipped on before the review the code comments promised | reconcile comments and gates; document the review | - | OPEN (seed) |
| P09 | 11-06 | verdicts | MED | engine temperament is heavily false-positive, mismatching the product's measured-not-assumed posture | re-tune after P02/P06 | - | OPEN (seed) |
| P10 | 11-06 | insights | MED | "A food never gets blamed for what your sleep did" overstates the confound layer | soften copy or strengthen the layer | - | OPEN (seed) |
| P11 | 11-06 | insights | LOW | confound engines well-gated but say too little; three loose screws | per report detail | - | OPEN (seed) |
| P12 | 11-06 | verdicts | HIGH | a verdict can be issued with zero logged evidence | block the survey when no daily logs exist; require minimum exposure logs | - | OPEN (seed) |

### Marketing — source: 2026-11-06-marketing-teardown.md
| id | found | area | sev | finding | fix | probe | status |
|---|---|---|---|---|---|---|---|
| M01 | 11-06 | marketing | HIGH | no risk reversal on a $399 ask; refund language only in Pricing fine print | [ALEX] concrete guarantee at every CTA, only if honored | - | OPEN (seed) |
| M02 | 11-06 | marketing | HIGH | zero proof layer; founder note sits below the final CTA; no named lab partner | [ALEX] move founder note above CTA; name lab partner; one real citation | - | OPEN (seed) |
| M03 | 11-06 | marketing | HIGH | page never names the buyer's symptoms; hero sells mechanics | rewrite hero sub to name bloating, brain fog, reflux, low energy | grep live main.js for "brain fog" in hero sub | OPEN (seed) |
| M04 | 11-06 | marketing | MED | no price or CTA near "The outcome" where desire peaks | compact pricing card after The Outcome | - | OPEN (seed) |
| M05 | 11-06 | marketing | MED | CTA dead zone of ~4 phone screens mid-page | one primary CTA per ~1.5 screens | - | OPEN (seed) |
| M06 | 11-06 | marketing | MED | program duration (4-6 months) hidden on home | state it in hero or how-it-works | - | OPEN (seed) |
| M07 | 11-06 | marketing | MED | "clinical standard" x4 with zero citation; overclaims ("certainty") | cite or cut | - | OPEN (seed) |
| M08 | 11-06 | marketing | MED | "Sarah's verdicts" showcase has no EXAMPLE label | add EXAMPLE label | text probe: showcase contains "EXAMPLE" | OPEN (seed) |
| M09 | 11-06 | marketing | MED | "is it safe to cut 8 foods for 8 weeks?" unanswered anywhere | FAQ answer + physician line | text probe: FAQ contains a nutrition-safety answer | OPEN (seed) |
| M10 | 11-06 | marketing | LOW | hero primary CTA (pale sage) quieter than nav button | make hero CTA the loudest | - | OPEN (seed) |
| M11 | 11-06 | marketing | LOW | hero micro-copy at 50% / 38% alpha on dark green illegible | raise to >= 70% alpha | - | OPEN (seed) |
| M12 | 11-06 | marketing | LOW | mobile nav tap targets 27-31px | >= 44px | probe: measure button heights at 430px | OPEN (seed) |
| M13 | 11-06 | marketing | LOW | desktop H1 orphans "handle." at 1440px | balance wrap | - | OPEN (seed) |
| M14 | 11-06 | marketing | LOW | redundant copy: problem card 1 restates intro; FAQ duplicates | dedupe | - | OPEN (seed) |
| M15 | 11-06 | marketing | LOW | mobile dead air after "See the full program" | tighten section padding at 430px | - | OPEN (seed) |

### First-timer comprehension — source: 2026-11-06-firsttimer-doubter.md
| id | found | area | sev | finding | fix | probe | status |
|---|---|---|---|---|---|---|---|
| D01 | 11-06 | marketing/science | MED | "why eight weeks?" never defended anywhere | one sentence in Science + hero tooltip | text probe: Science page explains the 56-day choice | OPEN (seed) |
| D02 | 11-06 | marketing | MED | "$399 · lab test included" names no lab, panel, or certification | [ALEX] name the lab partner and panel (ties to kit decision) | - | OPEN (seed) |
| D03 | 11-06 | signup | LOW | "Paid but never finished setting up?" door unexplained | one-line explanation | - | OPEN (seed) |
| D04 | 11-06 | home | MED | "AI builds your elimination list in seconds" claim vs reality | align copy with actual flow | - | OPEN (seed) |
| D05 | 11-06 | home | MED | "reviewed usually within a day" vs instant test-door approval reads fake | [ALEX] honest review-time copy | - | OPEN (seed) |
| D06 | 11-06 | lab | LOW | manual lab entry copy unclear to a skeptic | per report | - | OPEN (seed) |
| D07 | 11-06 | lab | LOW | "My report shows no sensitivities" path unclear | per report | - | OPEN (seed) |
| D08 | 11-06 | lab | LOW | review step | per report | - | OPEN (seed) |
| D09 | 11-06 | lab | MED | "submit for review" approved instantly reads fake (test door) | per report; D05 | - | OPEN (seed) |
| D10 | 11-06 | home | MED | Egg White at LOW sensitivity banned 56 days with no why | explain why Low flags are eliminated | - | OPEN (seed) |
| D11 | 11-06 | home | LOW | Suspect Board "How this works" | per report | - | OPEN (seed) |
| D12 | 11-06 | home | LOW | streak legend | per report | - | OPEN (seed) |
| D13 | 11-06 | home | LOW | Household Card | per report | - | OPEN (seed) |
| D14 | 11-06 | ask | MED | Ask Sensify's answers to the two hardest skeptic questions | per report | - | OPEN (seed) |
| D15 | 11-06 | support | MED | "a real person replies, usually within a day" | [ALEX] the 24h SLA decision | - | OPEN (seed) |
| D16 | 11-06 | account | MED | "Can I quit and get my data?" has no export/deletion | settings surface: export + delete | - | OPEN (seed) |
| D17 | 11-06 | home | LOW | robot TEST MODE button visible to a real-looking account | verify gating; D0 account must not see it | probe: non-test account page text lacks "TEST MODE" | OPEN (seed) |

### Full end-to-end run — source: 2026-11-06-fullrun.md
| id | found | area | sev | finding | fix | probe | status |
|---|---|---|---|---|---|---|---|
| F01 | 11-06 | daily | MED | day-1 check-in silently lost on out-of-range sleep ("75 hours") | validate + message, never silent | probe: submit sleep 75 and assert an error message | OPEN (seed) |
| F02 | 11-06 | daily | MED | post-check-in celebration streak is one higher than the dashboard, every time | single streak source | probe: compare the two numbers | OPEN (seed) |
| F03 | 11-06 | verdicts/pdf | MED | Food Map PDF says "EARNED FROM 3 DAYS OF TESTING" beside "14 day trial" | daysOfTesting must count cycle length, not exposure days | probe: PDF header text | OPEN (seed) |
| F04 | 11-06 | reintro | MED | after logging exposure day 1 in the evening, Reintro tab still says "eat Cow Milk today" | state-aware instruction once today's exposure is logged | - | OPEN (seed) |
| F05 | 11-06 | harness | MED | test-skip shifts logged_at but not log_date | fix the test function | probe: skip then compare both fields | OPEN (seed) |
| F06 | 11-06 | reintro | LOW | "14 days per cycle" but verdict unlocks on day 15 | align copy or math | - | OPEN (seed) |
| F07 | 11-06 | daily | LOW | recall parser dropped granola bar and corn chips | prompt: list every distinct food | - | OPEN (seed) |
| F08 | 11-06 | daily | LOW | slip receipt "getting your guidance" has no timeout or fallback | 6s fallback line | - | OPEN (seed) |
| F09 | 11-06 | history | LOW | a worsening phrased "down 30%" like an improvement | direction-aware wording | - | OPEN (seed) |
| F10 | 11-06 | history | LOW | milestones list only "intake complete" after 59 days | record weekly/verdict/unlock milestones | - | OPEN (seed) |
| F11 | 11-06 | maintain | LOW | "nothing is drifting" on 0 symptom logs | thin-data honesty line | probe: zero-log account shows the thin-data line | OPEN (seed) |
| F12 | 11-06 | reintro | LOW | TESTED chip shows the cycle's start day, unlabeled | label as "started day N" or show verdict day | - | OPEN (seed) |
| F13 | 11-06 | data | LOW | intake numerics stored as strings | cast on write | probe: read back types for a fresh account | OPEN (seed) |

## FIXED
(none yet; the Critic moves items here with the date and the commit or deploy that fixed them)

## WONTFIX
(Alex's calls, with date and reason)
