"""SENTINEL — the security + integrity + static layer of the nightly.

Three top-priority checks the walk/scout can't do:

  1. RLS BOUNDARY PROBER (the crown jewel). This app's entire security model
     is Supabase row-level security. One missing policy = any logged-in user
     reads everyone's health data. The prober signs in as test account A and,
     across every user-scoped table, tries to READ and WRITE test account B's
     rows. RLS-correct => denied/empty. SAFETY: only +qa test accounts are
     used; foreign rows are COUNTED, never printed; write probes insert a
     clearly-marked row and delete it immediately.

  2. DATA-INTEGRITY INVARIANTS. Impossible states accumulate silently in the
     DB and surface later as UI bugs (the declined-limbo bug was one). For
     each fleet persona, read its own rows and assert the state machine holds.

  3. STATIC SCANS. Silent-write family (unchecked insert/update/upsert/delete)
     and copy-promise family (claims the code may not keep) — swept across the
     WHOLE source tree in one pass, not one area a night.

Standalone: `python3 sentinelkit.py` writes sentinel_report.json and prints.
Wired into regress_all behind the fleet, guarded.
"""
import re, os, json, glob, datetime, traceback
from robot import Robot
from pathkit import signup_or_login, ANON, SB

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SRC = os.path.join(REPO, "src")
FN = os.path.join(REPO, "netlify", "functions")
PW = "RobotTester!2026"

# User-scoped tables and their owner column. profiles keys on id, not user_id.
TABLES = {
    "profiles": "id",
    "lab_results": "user_id",
    "reintroduction_results": "user_id",
    "reintro_daily_logs": "user_id",
    "daily_factors": "user_id",
    "daily_compliance": "user_id",
    "symptom_logs": "user_id",
    "weekly_checkins": "user_id",
    "compliance_audit": "user_id",
    "food_map": "user_id",
    "meal_logs": "user_id",
    "ask_sensify_messages": "user_id",
    "confound_observations": "user_id",
}
# Not user-scoped but sensitive: paid_sessions holds buyer emails, admin-read only.
ADMIN_ONLY = ["paid_sessions"]

# ---------------------------------------------------------------- static scans

WRITE_RE = re.compile(r"\.from\(\s*['\"]([a-z_]+)['\"]\s*\)\s*\.\s*(insert|update|upsert|delete)\b")

def scan_silent_writes():
    """Flag writes whose result is not error-checked. Heuristic: a write is
    'checked' if the same statement destructures { error } / { data } or the
    surrounding 4 lines reference the call's error. A bare `await supabase
    .from(x).insert(...)` with no capture is the classic silent write."""
    hits = []
    for path in glob.glob(SRC + "/**/*.js", recursive=True) + glob.glob(FN + "/*.js"):
        try:
            lines = open(path).read().split("\n")
        except Exception:
            continue
        for i, ln in enumerate(lines):
            m = WRITE_RE.search(ln)
            if not m:
                continue
            table, op = m.group(1), m.group(2)
            window = "\n".join(lines[max(0, i - 1):i + 4])
            # Checked if the result is captured with error, or an explicit retry/throw guard is near.
            checked = bool(re.search(r"(const|let)\s*\{[^}]*\berror\b", window)) \
                or ".select()" in window and "error" in window \
                or "throw" in window and "error" in window \
                or "if (error" in window
            # Bare awaited call with no assignment on this line.
            bare = bool(re.match(r"\s*await\s+supabase", ln)) and "=" not in ln.split("await")[0]
            if bare and not checked:
                rel = path.replace(REPO + "/", "")
                hits.append({"file": rel, "line": i + 1, "table": table, "op": op, "code": ln.strip()[:120]})
    return hits

PROMISE_PATS = [
    (r"within\s+\d+\s*hours?", "time-SLA"),
    (r"\bunlimited\b", "unlimited-claim"),
    (r"we['’]?ll\s+(email|text|send you)", "notification-promise"),
    (r"\bphysician", "physician-claim"),
    (r"\binstant(ly)?\b", "instant-claim"),
    (r"\bSMS\b|\btext you\b", "sms-promise"),
    (r"ships?\s+to\s+your\s+door", "fulfillment-claim"),
]

def scan_copy_promises():
    hits = []
    for path in glob.glob(SRC + "/**/*.js", recursive=True) + glob.glob(FN + "/*.js") + glob.glob(REPO + "/public/*.html"):
        try:
            text = open(path).read()
        except Exception:
            continue
        for i, ln in enumerate(text.split("\n")):
            low = ln.lower()
            for pat, label in PROMISE_PATS:
                if re.search(pat, low):
                    rel = path.replace(REPO + "/", "")
                    hits.append({"file": rel, "line": i + 1, "kind": label, "code": ln.strip()[:140]})
                    break
    return hits

# ------------------------------------------------------------- browser helpers

def _uid(r):
    return r.page.evaluate("""() => { const k = Object.keys(localStorage).find(k=>k.endsWith('-auth-token')); return k ? JSON.parse(localStorage.getItem(k)).user.id : null }""")

def _probe(r, uid_a, uid_b):
    """As the signed-in user (A), probe every table for B's rows + any foreign
    rows. Read-only except the guarded insert/delete write test. Returns a list
    of finding dicts. Foreign data is counted, never returned."""
    js = """async ([anon, sb, tables, adminOnly, uidA, uidB]) => {
      const k = Object.keys(localStorage).find(k=>k.endsWith('-auth-token'));
      const tok = JSON.parse(localStorage.getItem(k));
      const H = {apikey: anon, Authorization: 'Bearer ' + tok.access_token};
      const WH = {...H, 'Content-Type':'application/json', Prefer:'return=representation'};
      const out = [];
      for (const [table, col] of Object.entries(tables)) {
        // READ 1: target B's rows directly.
        try {
          const res = await fetch(`${sb}/rest/v1/${table}?${col}=eq.${uidB}&select=${col}`, {headers: H});
          if (res.ok) { const rows = await res.json(); if (Array.isArray(rows) && rows.length)
            out.push({table, kind:'READ_FOREIGN_DIRECT', severity:'CRITICAL', count: rows.length}); }
        } catch(e) {}
        // READ 2: broad select; any id != A is exposure.
        try {
          const res = await fetch(`${sb}/rest/v1/${table}?select=${col}&limit=2000`, {headers: H});
          if (res.ok) { const rows = await res.json();
            const foreign = (rows||[]).filter(x => x[col] && x[col] !== uidA).length;
            if (foreign > 0) out.push({table, kind:'READ_FOREIGN_BROAD', severity:'CRITICAL', count: foreign}); }
        } catch(e) {}
        // WRITE: insert a marked row into B's namespace; if it lands, RLS write is open.
        try {
          const body = {}; body[col] = uidB;
          if (table === 'meal_logs') { body.raw_text='__sentinel__'; body.foods=[]; }
          else if (table === 'symptom_logs') { body.symptom='__sentinel__'; body.severity='mild'; }
          else if (table === 'ask_sensify_messages') { body.role='user'; body.content='__sentinel__'; }
          else if (table === 'compliance_audit') { body.status='pending_admin_review'; body.hardest_parts=[]; }
          else { continue; } // only low-risk tables get the write probe
          const res = await fetch(`${sb}/rest/v1/${table}`, {method:'POST', headers: WH, body: JSON.stringify(body)});
          if (res.ok) { const rows = await res.json();
            if (Array.isArray(rows) && rows.length) {
              out.push({table, kind:'WRITE_FOREIGN', severity:'CRITICAL', count: rows.length});
              const id = rows[0].id;
              if (id) await fetch(`${sb}/rest/v1/${table}?id=eq.${id}`, {method:'DELETE', headers: H}); // clean up
            }
          }
        } catch(e) {}
      }
      // ADMIN-ONLY tables must not be readable by a normal user at all.
      for (const table of adminOnly) {
        try {
          const res = await fetch(`${sb}/rest/v1/${table}?select=email&limit=50`, {headers: H});
          if (res.ok) { const rows = await res.json(); if (Array.isArray(rows) && rows.length)
            out.push({table, kind:'ADMIN_TABLE_READABLE', severity:'CRITICAL', count: rows.length}); }
        } catch(e) {}
      }
      return out;
    }"""
    return r.page.evaluate(js, [ANON, SB, TABLES, ADMIN_ONLY, uid_a, uid_b])

def _read_own(r, uid):
    """Read the signed-in persona's own rows for the integrity pass."""
    js = """async ([anon, sb, uid]) => {
      const k = Object.keys(localStorage).find(k=>k.endsWith('-auth-token'));
      const tok = JSON.parse(localStorage.getItem(k));
      const H = {apikey: anon, Authorization: 'Bearer ' + tok.access_token};
      const get = async (q) => { try { const r = await fetch(sb+'/rest/v1/'+q, {headers:H}); return r.ok ? await r.json() : []; } catch(e){ return []; } };
      return {
        profile: (await get(`profiles?id=eq.${uid}`))[0] || null,
        lab: (await get(`lab_results?user_id=eq.${uid}&order=submitted_at.desc&limit=1`))[0] || null,
        cycles: await get(`reintroduction_results?user_id=eq.${uid}&select=food,verdict,started_at`),
        foodmap: await get(`food_map?user_id=eq.${uid}&select=food,verdict`),
      };
    }"""
    return r.page.evaluate(js, [ANON, SB, uid])

def _integrity(stage, d):
    """State-machine invariants on one persona's real rows."""
    f = []
    p = d.get("profile") or {}
    phase = p.get("program_phase")
    def bad(inv, detail): f.append({"stage": stage, "invariant": inv, "detail": detail[:160]})
    # A protocol phase must have a start date.
    if phase in ("elimination", "reintroduction") and not p.get("protocol_start_date"):
        bad("phase_without_start", f"phase={phase} but protocol_start_date is null")
    # Declined/tracking must carry the key every tracking surface reads.
    if p.get("protocol_track") == "declined" and p.get("track_decision") != "declined":
        bad("declined_without_decision", f"track=declined but track_decision={p.get('track_decision')}")
    # Every food_map verdict should have a matching cycle (source of truth).
    cyc_foods = {(c.get("food") or "").lower() for c in (d.get("cycles") or []) if c.get("verdict")}
    for fm in (d.get("foodmap") or []):
        if fm.get("verdict") and (fm.get("food") or "").lower() not in cyc_foods:
            bad("foodmap_verdict_no_cycle", f"{fm.get('food')} ruled {fm.get('verdict')} in food_map, no matching verdicted cycle")
    # An approved lab should not sit under a still-pending profile.
    lab = d.get("lab") or {}
    if lab.get("status") == "approved" and phase in ("pending_review", "awaiting_results"):
        bad("approved_lab_pending_profile", f"lab approved but phase={phase}")
    return f

# --------------------------------------------------------------------- runner

def run_sentinel(check):
    results = {"rls": [], "integrity": [], "silent_writes": [], "copy_promises": []}

    # 1. STATIC (no browser) --------------------------------------------------
    try:
        results["silent_writes"] = scan_silent_writes()
        check("sentinel.silent_writes", len(results["silent_writes"]) == 0,
              f"{len(results['silent_writes'])} unchecked writes")
    except Exception:
        check("sentinel.silent_writes_scan", False, traceback.format_exc()[-150:])
    try:
        results["copy_promises"] = scan_copy_promises()
        # Promises are review items, not pass/fail — report count, never fail the suite.
        print(f"sentinel.copy_promises: {len(results['copy_promises'])} strings to review")
    except Exception:
        check("sentinel.copy_promise_scan", False, traceback.format_exc()[-150:])

    # 2. RLS PROBER -----------------------------------------------------------
    stamp = datetime.datetime.now().strftime("%y%m%d%H%M")
    rb = Robot("SENB")
    uid_b = None
    try:
        signup_or_login(rb, f"alexandermayer2002+qa{stamp}secb@gmail.com", "Sentinel B", PW)
        uid_b = _uid(rb)
    except Exception:
        pass
    finally:
        rb.close()

    ra = Robot("SENA")
    try:
        signup_or_login(ra, f"alexandermayer2002+qa{stamp}seca@gmail.com", "Sentinel A", PW)
        uid_a = _uid(ra)
        if uid_a and uid_b and uid_a != uid_b:
            results["rls"] = _probe(ra, uid_a, uid_b)
            check("sentinel.rls_boundary", len(results["rls"]) == 0,
                  "; ".join(f"{x['table']}:{x['kind']}" for x in results["rls"])[:150])
        else:
            check("sentinel.rls_boundary", False, f"could not establish two test ids a={uid_a} b={uid_b}")
    except Exception:
        check("sentinel.rls_boundary", False, traceback.format_exc()[-150:])
    finally:
        ra.close()

    # 3. DATA INTEGRITY over fleet personas -----------------------------------
    try:
        from fleetkit import stage_email, STAGES
        integ = []
        for stage in STAGES:
            r = Robot("SENI")
            try:
                signup_or_login(r, stage_email(stage), "Fleet " + stage, PW)
                if "Start your intake survey" not in r.text():
                    integ += _integrity(stage, _read_own(r, _uid(r)))
            except Exception:
                pass
            finally:
                r.close()
        results["integrity"] = integ
        check("sentinel.data_integrity", len(integ) == 0,
              "; ".join(f"{x['stage']}:{x['invariant']}" for x in integ)[:150])
    except Exception:
        check("sentinel.data_integrity", False, traceback.format_exc()[-150:])

    with open(os.path.join(os.path.dirname(__file__), "sentinel_report.json"), "w") as fh:
        json.dump(results, fh, indent=1)
    return results


if __name__ == "__main__":
    RES = []
    def check(n, ok, d=""):
        RES.append((n, ok, d)); print(("PASS " if ok else "FAIL ") + n + ("" if ok else " | " + str(d)[:140]))
    out = run_sentinel(check)
    print("\n== SENTINEL SUMMARY ==")
    print("RLS findings:        ", len(out["rls"]))
    print("integrity findings:  ", len(out["integrity"]))
    print("silent writes:       ", len(out["silent_writes"]))
    print("copy promises:       ", len(out["copy_promises"]))
