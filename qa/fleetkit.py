"""FLEET — persistent aged robot personas + invariant sweep.

Depth upgrade approved by Alex 2026-10-23. The classic nightly regression only
ever walks day-0 accounts, so 90% of the product (cycles, verdicts, weeklies,
audits, tracking) never gets exercised at night. The fleet keeps one persona
alive at each protocol life-stage; every night each persona lives one more real
day (does its check-ins, starts cycles, earns verdicts) and then the harness
sweeps every screen of its world for INVARIANTS rather than golden copy:

  I1 no horizontal overflow at 430px
  I2 every screen renders (not blank, no error boundary)
  I3 no dead ends (something tappable everywhere)
  I4 displayed numbers match an independent recomputation from the DB
  I5 zero console errors across the whole lived day

Personas are STATELESS across nights: each stage's account email is derived
from a rotating cohort number (today // window), so no manifest file needs
committing. When a cohort rotates, the old persona is simply abandoned and a
fresh one is seeded at the stage's entry day via the test-only doors. All
accounts carry the +qa tag (test-door pattern); real customers are never touched.
"""
import re, json, datetime, traceback
from robot import Robot
from pathkit import (signup_or_login, enter_intake, do_symptoms, do_baselines,
                     do_freq, do_lifestyle, lab_manual, lab_none,
                     nav_tab, srv_skip, ANON, SB)

PW = "RobotTester!2026"
ANCHOR = datetime.date(2026, 10, 1).toordinal()

STAGES = {
    # window: cohort length in days (persona rotates out after this long)
    # seed_day: protocol day the fresh persona is skipped to (None = no skip)
    "elimearly": {"window": 7,  "seed_day": 2,    "kind": "flagged"},
    "elimlate":  {"window": 14, "seed_day": 42,   "kind": "flagged"},
    "audit":     {"window": 12, "seed_day": 5,    "kind": "flagged"},
    "reintro":   {"window": 28, "seed_day": 57,   "kind": "flagged"},
    "tracking":  {"window": 28, "seed_day": None, "kind": "tracking"},
}

def stage_email(stage):
    c = (datetime.date.today().toordinal() - ANCHOR) // STAGES[stage]["window"]
    return f"alexandermayer2002+qafleet{stage}c{c}@gmail.com"

def _variant(stage):
    """Deterministic per-night answer variation, so nights differ but reruns don't."""
    n = datetime.date.today().toordinal() + sum(map(ord, stage))
    return {
        "sleep": str(5 + n % 4),              # 5..8
        "hyd": str(4 + (n // 2) % 4),         # 4..7
        "stress": ["Low", "Moderate", "High"][n % 3],
        "symptom": (n % 3 == 0),
        "plan_yes": (stage != "audit") or (n % 4 == 0),  # audit: 3 NOs then a YES
    }

# ---------- tiny page helpers ----------

def gate(r):
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)

def home(r):
    try:
        r.page.get_by_text("Home", exact=True).first.click(timeout=3000)
    except Exception:
        for _ in range(2):  # goto can flake on a cold CDN edge; one retry
            try: r.goto(); break
            except Exception: r.sleep(2.0)
    r.sleep(1.6); r.wait_ready(15); gate(r)
    r.click_btn("Got it", required=False)

def rest(r, pathq):
    """REST read as the signed-in persona (own-row RLS). @UID@ -> user id."""
    js = """async ([anon, sb, pathq]) => {
      const key = Object.keys(localStorage).find(k => k.endsWith('-auth-token'));
      if (!key) return {err: 'no auth token'};
      const tok = JSON.parse(localStorage.getItem(key));
      const q = pathq.replaceAll('@UID@', tok.user.id);
      const res = await fetch(sb + '/rest/v1/' + q, {headers: {apikey: anon, Authorization: 'Bearer ' + tok.access_token}});
      return {status: res.status, body: await res.json()};
    }"""
    return r.page.evaluate(js, [ANON, SB, pathq])

def protocol_day(start):
    """Mirror of src/utils/protocolDay.js (local dates, inclusive day 1)."""
    if not start: return 0
    y, m, d = map(int, str(start).split("T")[0].split("-"))
    return max(0, (datetime.date.today() - datetime.date(y, m, d)).days + 1)

# ---------- seeding ----------

def _intake(r, name):
    enter_intake(r, name)
    if "What are you hoping" in r.text():
        r.click("Digestive health"); r.click_btn("Continue"); r.sleep(1.2)
    if "Tell us about" in r.text():
        do_symptoms(r, [("Daily", 0), ("After specific foods", 0), ("A few times a week", 1),
                        ("Occasionally", 1), ("Often irregular or uncomfortable", 0), ("More than 3 years", 0)])
    if "In a typical week" in r.text():
        do_baselines(r, ["6", "5", "5", "5"])
    do_freq(r, [("Cow Milk", "Daily"), ("Wheat", "3–5x/week"), ("Crab", "1–2x/week")])
    do_lifestyle(r, sex="Female")

def _flag_and_submit(r, rig):
    """Manual lab entry through the CURRENT two-step review gate (the shared
    lab_rig helper predates it and its submit regexes no longer match)."""
    for food, level in rig:
        r.fill_ph("Search foods", food); r.sleep(0.9)
        r.xclick(food, level); r.sleep(0.5)
    r.cta(r"Review my entry"); r.sleep(1.2); r.wait_ready(10)
    r.cta(r"Looks right, submit for review"); r.sleep(3.0); r.wait_ready(20)

def seed(r, stage, email):
    """Resumable: a persona stranded mid-seed (e.g. by a crash last night)
    picks up where it stopped instead of wedging forever."""
    print(f"[fleet] seeding {stage} as {email}")
    if "Start your intake survey" in r.text():
        _intake(r, "Fleet " + stage.title())
        r.goto(); r.sleep(2.0); r.wait_ready(20)
    if "Upload your lab results" not in r.text():
        return
    if STAGES[stage]["kind"] == "tracking":
        lab_manual(r)
        lab_none(r)                      # clean report -> common track offer
        r.goto(); r.sleep(2.5); r.wait_ready(25)
        r.click_btn("Got it", required=False)
        r.click_btn("I'd rather just track for now", required=False)
        r.sleep(2.5); r.wait_ready(20)
    else:
        lab_manual(r)
        _flag_and_submit(r, [("Cow Milk", "High"), ("Wheat", "Moderate"), ("Crab", "Low")])
        r.goto(); r.sleep(2.5); r.wait_ready(25)
        day = STAGES[stage]["seed_day"]
        if day:
            srv_skip(email, day)
            r.goto(); r.sleep(2.5); r.wait_ready(25); gate(r)

# ---------- a lived day ----------

def walk_weekly(r):
    r.xclick("Weekly check-in", "Start →", required=False); r.sleep(2.2); r.wait_ready(12)
    if "Submit check-in" not in r.text(): return  # the form didn't actually open
    n = r.page.get_by_role("button", name=re.compile("^5$")).count()
    for i in range(n):
        try: r.page.get_by_role("button", name=re.compile("^5$")).nth(i).click(timeout=2500); r.sleep(0.15)
        except Exception: pass
    r.click("About the same", exact=True, required=False)
    r.click("Nothing unusual, a normal week", exact=True, required=False)
    r.click("Fully", exact=True, required=False)
    if r.cta(r"Submit check-in"):
        r.sleep(3.0); r.wait_ready(15)
        for _ in range(30):
            if "Writing your insight" not in r.text(): break
            r.sleep(2.0)
        r.cta(r"Back to dashboard|Done"); r.sleep(2.0); r.wait_ready(15)

def walk_verdict(r):
    try:
        r.page.get_by_text("verdict is ready", exact=False).first.click(timeout=6000)
        r.sleep(2.0); r.wait_ready(15)
    except Exception:
        return
    if "Does that sound right" not in r.text():
        r.cta(r"Get my verdict"); r.sleep(2.0); r.wait_ready(15)
    r.click("Yes, that's accurate", exact=True, required=False)
    try: r.page.locator("textarea").first.fill("Fleet night: clean cycle, nothing noticed.")
    except Exception: pass
    r.cta(r"Get my verdict")
    r.sleep(12.0); r.wait_ready(50)
    r.cta(r"View your verdicts|Done"); r.sleep(2.0); r.wait_ready(15)

def maybe_start_cycle(r):
    """Reintro persona between cycles: start the next one so cycling never stalls."""
    try:
        r.page.get_by_role("button", name=re.compile(r"Pick your next food")).first.evaluate("el => el.click()")
        r.sleep(2.2); r.wait_ready(12)
    except Exception:
        nav_tab(r, "Reintro"); r.sleep(1.0)
    try:
        r.page.get_by_role("button", name=re.compile(r"Start cycle")).first.evaluate("el => el.click()")
        r.sleep(1.8); r.wait_ready(12)
        r.click("Start today", exact=False, required=False)
        r.sleep(3.0); r.wait_ready(20)
    except Exception:
        pass
    home(r)

def daily_checkin(r, stage, v):
    opened = False
    for txt in ["How's today going", re.compile(r"(Today|Tonight)'s check-in")]:
        try:
            r.page.get_by_text(txt).first.click(timeout=4000)
            r.sleep(1.6); r.wait_ready(10); opened = True; break
        except Exception: pass
    if not opened:
        for pat in [r"or log today", r"or log tonight"]:
            if r.cta(pat): opened = True; break
    if not opened:
        return False
    # Reintro block (embedded in the daily check-in during an active cycle):
    # exposure days ask ate?/portion, washout days ask lingering symptoms.
    try:
        r.page.locator("xpath=//*[contains(normalize-space(text()),'Did you eat')]/following::button[normalize-space(.)='Yes'][1]").first.click(timeout=3000); r.sleep(0.6)
        r.page.locator("xpath=//*[contains(normalize-space(text()),'Roughly how much')]/following::button[contains(normalize-space(.),'ormal serving')][1]").first.click(timeout=3000); r.sleep(0.6)
    except Exception: pass
    try:
        r.page.locator("xpath=//*[contains(normalize-space(text()),'symptoms today?') or contains(normalize-space(text()),'Anything surface today?')]/following::button[normalize-space(.)='No, felt fine'][1]").first.click(timeout=3000); r.sleep(0.5)
    except Exception: pass
    # Plan compliance (the audit persona says No three nights in a row).
    ans = "Yes" if v["plan_yes"] else "No"
    try: r.page.locator(f"xpath=//*[contains(normalize-space(text()),'stay on your plan')]/following::button[normalize-space(.)='{ans}'][1]").first.click(timeout=4000); r.sleep(0.5)
    except Exception: pass
    if r.click("Tap to enter", required=False): r.numpad(v["sleep"])
    r.answer("stress", v["stress"])
    if r.click("Tap to enter", required=False): r.numpad(v["hyd"])
    if v["symptom"]:
        try:
            r.page.locator("xpath=//*[contains(normalize-space(text()),'Any symptoms today?')]/following::button[normalize-space(.)='Yes'][1]").first.click(timeout=3000); r.sleep(0.5)
        except Exception: pass
        for lbl in ["Bloating", "Gas or cramping", "Stomach discomfort"]:
            if r.click(lbl, exact=True, required=False): break
        for inten in ["Mild", "Moderate"]:
            if r.click(inten, exact=True, required=False): break
    else:
        for lbl in ["Felt fine", "No, felt fine"]:
            if r.click(lbl, exact=False, required=False): break
    r.cta(r"Done for today"); r.sleep(2.2); r.wait_ready(10)
    r.cta(r"Done"); r.sleep(1.2)
    return True

def live_day(r, stage, v):
    home(r)
    t = r.text()
    if "Weekly check-in" in t:
        walk_weekly(r); home(r)
    if "verdict is ready" in r.text().lower():
        walk_verdict(r); home(r)
    if stage == "reintro" and "Pick your next food" in r.text():
        maybe_start_cycle(r)
    daily_checkin(r, stage, v)
    home(r)
    t = r.text()
    # The audit persona's NO streak surfaces these; walk them, never skip them.
    if "Tell us what happened" in t:
        r.cta(r"Tell us what happened"); r.sleep(2.0); r.wait_ready(12)
        # The form needs a food (typed) + a reason before Submit enables.
        try:
            r.page.get_by_placeholder("Search foods or type your own").first.fill("Pizza")
            r.sleep(0.5); r.page.keyboard.press("Enter"); r.sleep(0.5)
        except Exception: pass
        r.click("Intentional. I chose to eat it", exact=False, required=False)
        r.cta(r"Submit"); r.sleep(2.5); r.wait_ready(12)
        r.cta(r"Back to dashboard"); r.sleep(1.5)
        home(r)
    if "figure this out together" in r.text().lower():
        r.cta(r"Let's talk"); r.sleep(2.0); r.wait_ready(12)
        r.answer_options(["Cravings", "Social situations", "Hidden ingredients", "Cost",
                          "It's been a hard week", "Yes", "Somewhat"])
        try: r.page.locator("textarea").first.fill("Fleet night: hard week, want to continue.")
        except Exception: pass
        r.cta(r"Submit|Send|Done"); r.sleep(2.5); r.wait_ready(12)
        home(r)

# ---------- invariants ----------

TABS = ["Home", "Reintro", "Verdicts", "Ask", "More"]

def sweep(r, stage, check):
    overflow, blank, dead = [], [], []
    for tb in TABS:
        if tb == "Home": home(r)
        else:
            try: nav_tab(r, tb)
            except Exception: pass
        r.sleep(0.8)
        try:
            w = max(r.page.evaluate("[document.documentElement.scrollWidth, document.body.scrollWidth]"))
        except Exception:
            w = 0
        if w > 434: overflow.append(f"{tb}:{w}px")
        t = r.text()
        if len(t) < 120 or "something went wrong" in t.lower(): blank.append(tb)
        try:
            n = r.page.evaluate("""() => [...document.querySelectorAll('button,[role=button],a,input,select,textarea')]
                .filter(e => e.offsetParent !== null && !e.disabled).length""")
        except Exception:
            n = -1
        if n == 0: dead.append(tb)
    check(f"fleet.{stage}.no_overflow", not overflow, " ".join(overflow))
    check(f"fleet.{stage}.screens_render", not blank, " ".join(blank))
    check(f"fleet.{stage}.no_dead_end", not dead, " ".join(dead))
    home(r)

def check_numbers(r, stage, check):
    prof = rest(r, "profiles?id=eq.@UID@&select=protocol_start_date,program_phase,protocol_track,track_decision")
    row = (prof.get("body") or [{}])[0] if isinstance(prof.get("body"), list) else {}
    start = row.get("protocol_start_date")
    # Seed integrity first: a persona that failed to reach its stage must FAIL
    # loudly, not skip its number checks (the shakedown found exactly this hole).
    if STAGES[stage]["kind"] == "tracking":
        seeded = row.get("track_decision") == "declined"
    else:
        seeded = row.get("program_phase") in ("elimination", "reintroduction") and bool(start)
    check(f"fleet.{stage}.seeded", seeded, json.dumps(row))
    # Yesterday's/today's lived day must leave a daily_factors row (a silently
    # skipped check-in is a harness bug or a product dead end — either way FAIL).
    today = datetime.date.today().isoformat()
    df = rest(r, f"daily_factors?user_id=eq.@UID@&log_date=eq.{today}&select=log_date")
    logged = isinstance(df.get("body"), list) and len(df["body"]) > 0
    check(f"fleet.{stage}.day_logged", logged, f"no daily_factors row for {today}")
    if stage in ("elimearly", "elimlate", "audit") and start:
        expected = protocol_day(start)
        nav_tab(r, "Verdicts"); r.sleep(1.2)
        m = re.search(r"Day (\d+) of 56", r.text())
        ok = bool(m) and int(m.group(1)) == expected
        check(f"fleet.{stage}.day_counter", ok,
              f"shown={m.group(1) if m else 'none'} expected={expected} start={start}")
        home(r)
    if stage == "reintro":
        cyc = rest(r, "reintroduction_results?user_id=eq.@UID@&select=food,verdict")
        rows = cyc.get("body") or []
        ruled_db = len({(c.get("food") or "").lower() for c in rows if c.get("verdict")})
        nav_tab(r, "Verdicts"); r.sleep(1.2)
        t = r.text()
        m = re.search(r"(\d+)\s*/\s*(\d+)\s*\n?\s*RULED", t, re.I) or re.search(r"(\d+)\s*/\s*(\d+)", t)
        ok = bool(m) and int(m.group(1)) == ruled_db
        check(f"fleet.{stage}.verdict_count", ok,
              f"shown={m.group(0).strip() if m else 'none'} db_ruled={ruled_db}")
        home(r)

# ---------- the runner ----------

HARNESS_NOISE = re.compile(r"status of 400|auth/v1/token", re.I)

def run_persona(stage, check):
    email = stage_email(stage)
    r = Robot("FL" + stage[:6].upper())
    try:
        signup_or_login(r, email, "Fleet " + stage.title(), PW)
        r.console[:] = [c for c in r.console if not HARNESS_NOISE.search(c)]
        t = r.text()
        if "Start your intake survey" in t or "Upload your lab results" in t:
            seed(r, stage, email)
        gate(r)
        live_day(r, stage, _variant(stage))
        sweep(r, stage, check)
        check_numbers(r, stage, check)
        noise_free = [c for c in r.console if not HARNESS_NOISE.search(c)]
        check(f"fleet.{stage}.console_clean", len(noise_free) == 0, str(noise_free[:2]))
    except Exception:
        check(f"fleet.{stage}.walk", False, traceback.format_exc()[-150:])
    finally:
        r.close()

def run_fleet(check):
    print(f"\n== FLEET: {len(STAGES)} personas ==")
    for stage in STAGES:
        print(f"-- fleet persona: {stage} ({stage_email(stage)})")
        run_persona(stage, check)
