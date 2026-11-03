# The Sentinel — security + integrity + static layer

Added 2026-11-03. Runs in `regress_all.py` after the fleet (`--no-sentinel`
skips it). Covers the three highest-stakes checks the walk/scout structurally
cannot do.

## 1. RLS boundary prober (the crown jewel)

This app's entire security model is Supabase row-level security — client-side
calls guarded only by policies. One missing policy and any logged-in user reads
everyone's health data. The prober signs in as test account **A** and, across
every user-scoped table, tries to **read** and **write** test account **B**'s
rows, plus tries to read the admin-only `paid_sessions` (buyer emails).

- RLS-correct → every probe denied/empty → `sentinel.rls_boundary` PASS.
- Any foreign row read, any foreign write that lands, or any admin-table read →
  CRITICAL finding.

**Safety:** only `+qa` test accounts are used; foreign rows are **counted,
never printed**; the write probe inserts a clearly-marked row and deletes it.
A positive/negative control (A reads its own row = 1, A reads B's row = 0)
proves the probe is real, so an empty result means RLS holds, not that the
probe broke.

## 2. Data-integrity invariants

Impossible states accumulate silently in the DB and surface later as UI bugs
(the declined-limbo bug was one). For each fleet persona it reads that account's
own rows and asserts the state machine holds: a protocol phase has a start date;
`track_decision` matches a declined track; every `food_map` verdict has a
matching cycle; an approved lab doesn't sit under a pending profile.

## 3. Static scans (whole tree, every night)

- **Silent-write scan** — flags `insert/update/upsert/delete` whose result is
  not error-checked. Heuristic: expect false positives from intentional
  best-effort writes (keep an allowlist in review). Value = it sweeps the
  *whole* source in one pass, including surfaces the scout never walks (admin,
  functions).
- **Copy-promise scan** — flags user-facing strings making claims the code may
  not keep (time-SLAs, "unlimited", notifications, "physician", "instant",
  SMS, "ships to your door"). Review items, never a hard fail.

## Output

`sentinel_report.json` + `sentinel.*` checks in `regress_summary.json`.
RLS and data-integrity are hard pass/fail; silent-writes fails on count (triage
against the allowlist); copy-promises is report-only.

## 4. Safety / medical oracle (added 2026-11-03)

Static assertions on the paths where a regression could harm a person, not just
annoy them: severe reactions route to "seek medical care" + an Avoid stop; the
verdict engine defaults severe to Avoid; Ask Sensify never certifies a label
all-clear; observation mode refuses verdicts. These are structural guarantees
that must never silently disappear. `sentinel.safety` — hard fail.

## Silent-write allowlist

`SILENT_WRITE_ALLOW` holds the reviewed, intentional best-effort writes (test
harness, backfills/mirrors after a checked primary). The scan skips them so it
only ever flags NEW unchecked writes. Revisit when code moves.

---

# Fault injection (faultkit.py)

The layer that finds what reading can't. Induces a real failure in a write
(Playwright route interception → 500) and asserts the UI surfaces it with a
retry and never shows a false success. Runs after the sentinel (`--no-fault`
skips). Drills today: intake-complete (the worst data-loss path) and Ask
Sensify meal log — both proving the Deploy 14/13 write-first fixes hold under
failure. Add a drill per high-stakes write surface over time.
