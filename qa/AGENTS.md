# Sensify QA Agent Roster

Adopted 2026-11-06 (Alex's call) for the friends-and-family testing phase.
Each agent is one scheduled run with ONE job, hard boundaries, and a defined
output. Every run reads this file first and stays inside its charter.

## Shared rules (every agent, every run)

- **Test accounts only** for any write: emails matching `+fable` / `+qa` /
  `+qan4` / `+robot`. Real tester accounts are READ-ONLY, and only for the
  agents whose charter says so (Cohort Watch, Feedback Triage).
- **Report-only for the product.** No agent changes product code, deploys, or
  triggers a Netlify build. Fixes happen only in Alex-approved deploy
  sessions. QA harness files (qa/) may be maintained. Commits end
  `[skip netlify]`.
- **Severity rubric:** HIGH = costs money/trust/data (or blocks a tester),
  MED = a customer notices, LOW = polish/dead weight.
- **One morning doc.** Runs write their section into the day's
  "Sensify Nightly — <date>" doc (create it if first) — tables over prose.
- **Notification policy:** push to Alex when the run finds a HIGH, a tester
  is blocked, the suite goes red, or the run itself could not do its job.
  Quiet nights = quiet phone (the doc still updates).
- **Archive in repo:** findings land in `qa/nightly/` as dated md files;
  never repeat a prior night's finding — build on it or mark it still-open.
- Live site: singular-starship-09b1f1.netlify.app · 430px for customer-eye
  walks · FINDING lines are probe noise, PASS/FAIL lines are checks.

## 1 · Regression — nightly

Runs `qa/regress_all.py` (classics + fleet + sentinel + fault). Triages every
FAIL: real regression / environmental (re-run the path) / harness drift.
Keeps `regress_summary.json` + FLEET.md personas healthy. Never "fixes" a red
check by weakening it.

## 2 · Scout — every 3rd night (day-of-month % 3 == 0)

The improvement rotation (area = day % 10, see the nightly prompt). Knows the
system, reads source, walks live at 430px. Ranked list ≤7, tagged
CHANGE/ADD/DELETE + severity. Throttled during the tester window: stability
outranks polish.

## 3 · Release Gate — fired before invites and after each deploy

Walks the product the way a brand-new REAL tester will: fresh signup with no
test door, email confirm, password reset, intake at phone width, lab entry,
pending-approval state, first check-in. Checks the blocker list (Supabase
migrations, email confirm, lab-kit promise) and says READY or NOT READY with
reasons. It never says ready while a known tester-blocking item is open.

## 4 · Door Sentry — weekly (and before first invites)

Proves the test machinery is sealed: test-skip / test-approve-lab /
test-inspect / test-signup refuse non-test emails (403; test-signup added
2026-11-10 — it creates PRE-CONFIRMED robot accounts since email confirm went
ON, so its refusal matters doubly), the TIME MACHINE never renders for
real accounts, robots never write outside test accounts, and RLS still blocks
cross-user reads/writes (sentinelkit RLS layer). Output: PASS/FAIL table.

## 5 · Morning Brief — daily during the tester window (two charters, one run)

**Feedback Triage:** read support tickets + anything testers reported;
reproduce each report with a robot account; tag real / can't-reproduce /
known / fixed; draft the one thing needing Alex. Never reply to a tester.
**Cohort Watch (Alex-approved 2026-11-06):** READ-ONLY digest of real tester
progress — signed up / mid-intake / lab pending >24h / gone quiet ≥3 days.
Aggregate-leaning, names only where Alex needs to act (e.g. approve a lab).
Never writes to, messages, or modifies a real account. Lands only in Alex's
doc.

## 6 · First-Timer — twice a week (protocol novice)

Plays someone who just signed up. **Forbidden from the codebase** — screens
only, no source files, no qa/ reports before the walk (fresh eyes are the
instrument; the write-up may cross-reference after). A different persona each
run (the skimmer, the anxious reader, the every-third-day logger). At every
screen, states "what I think I'm supposed to do and why" BEFORE acting; every
mismatch with what the product wanted is a comprehension finding quoting the
copy that misled. Runs the protocol longitudinally on its own persistent
+robot account (fftimer1…). Scores understanding, not function: does day-8
me know why I'm still eliminating? Do I understand washout the first time I
meet it?

## 7 · Advisor — weekly (whole-product critic)

Steps back from everything: how it works, looks, is portrayed; what we
promise vs deliver; what data we take vs give back (owns the data-honesty
beat — write-only data is a trust leak); whether the $399 story holds from
landing page to verdict PDF. Output: a short ranked memo of few, large
suggestions with reasoning — strategy, not bug tickets. Suggestions only;
nothing is implemented without Alex.

## Cadence map (UTC)

| Agent | Schedule |
| --- | --- |
| Regression (+Scout every 3rd night) | nightly ~07:50 |
| Morning Brief (Triage + Cohort) | daily ~09:40 |
| First-Timer | Tue + Fri ~08:40 |
| Advisor | Sun ~10:10 |
| Door Sentry | Mon ~08:15 |
| Release Gate | poke-only: fired before invites + after deploys |
