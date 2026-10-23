# The Fleet — aged personas + invariant sweep

Depth layer added 2026-10-23 (approved by Alex). `regress_all.py` now runs it
after the four classic day-0 paths; `--no-fleet` skips it.

## Why

The classic regression only ever creates day-0 accounts, so cycles, verdicts,
weeklies, slip-ups/audits and tracking mode never got nightly exercise — and
accumulated-state bugs (the Dairy-still-in-the-picker class) only appear in
accounts with history.

## How it works

Five personas, one per protocol life-stage, each living one real day per night:

| stage      | window | seeded at         | lives nightly                              |
|------------|--------|-------------------|--------------------------------------------|
| elimearly  | 7d     | elimination day 2 | daily check-in                             |
| elimlate   | 14d    | day 42            | daily + weekly when due                    |
| audit      | 12d    | day 5             | plan=NO 3 nights of 4 → slip-up + audit    |
| reintro    | 28d    | day 57            | cycle logging, verdicts, next-cycle starts |
| tracking   | 28d    | declined → track  | tracking daily                             |

Accounts are stateless across nights: the email is derived from
`today // window` (cohort number), e.g. `+qafleetreintroc0`. When a cohort
rotates, the old account is abandoned and a fresh one auto-seeds at the stage's
entry day via the test doors (`+qa` pattern; real customers untouched).
Abandoned cohorts accumulate in Supabase — prune them occasionally with the
housekeeping tooling if the user list gets noisy.

## Invariants checked per persona (not golden copy)

- `no_overflow` — every tab ≤ 430px wide
- `screens_render` — nothing blank, no error boundary
- `no_dead_end` — something tappable on every screen
- `seeded` — the persona actually reached its stage (a failed seed FAILS, never skips)
- `day_logged` — the lived day left a `daily_factors` row (via REST as the persona)
- `day_counter` / `verdict_count` — displayed numbers recomputed independently from the DB
- `console_clean` — zero console errors across the whole lived day (harness login noise filtered)

Checks land in `regress_summary.json` as `fleet.<stage>.<invariant>` alongside
the classic checks. A `fleet.<stage>.walk` FAIL means the persona's night
crashed; the traceback tail is in the detail.

## Night-to-night behavior

Steady state adds ~6–10 min to the nightly run. A cohort-rotation night adds
one seeding (~3 min). FINDING lines in the log are guarded-probe misses, not
failures — only PASS/FAIL lines are checks.
