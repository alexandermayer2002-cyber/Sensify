"""Nightly scout 2026-10-27 — Area 7: Verdicts / Food Map tab + PDF download.
Walks the live site at 430px with a fresh +qa test account. REPORT-ONLY."""
import re, json, datetime, os
from robot import Robot
from pathkit import (signup_or_login, enter_intake, do_symptoms, do_baselines,
                     do_freq, do_lifestyle, lab_manual, srv_skip, nav_tab, ANON, SB)

EMAIL = "alexandermayer2002+qa261027fm7@gmail.com"
PW = "RobotTester!2026"
TODAY = datetime.date.today()
SHOTS = os.environ.get("QA_SHOTS")

r = Robot("FM7")
W = []

def width(tag):
    try:
        w = r.page.evaluate("document.documentElement.scrollWidth")
        W.append((tag, w)); print(f"WIDTH {tag}: {w}")
    except Exception as e:
        print("width err", e)

def rest(method, pathq, body):
    js = """async ([anon, sb, method, pathq, body]) => {
      const key = Object.keys(localStorage).find(k => k.endsWith('-auth-token'));
      if (!key) return {err: 'no auth token'};
      const tok = JSON.parse(localStorage.getItem(key));
      const q = pathq.replaceAll('@UID@', tok.user.id);
      const res = await fetch(sb + '/rest/v1/' + q, {method,
        headers: {apikey: anon, Authorization: 'Bearer ' + tok.access_token,
                  'Content-Type': 'application/json', Prefer: 'return=representation'},
        body: body ? JSON.stringify(body).replaceAll('@UID@', tok.user.id) : undefined});
      let b; try { b = await res.json() } catch(e) { b = null }
      return {status: res.status, body: b};
    }"""
    out = r.page.evaluate(js, [ANON, SB, method, pathq, body])
    print(f"REST {method} {pathq[:70]}: {json.dumps(out)[:200]}")
    return out

def seed_logs(rid, food, start_offset, sym_days=(), n_exposure=3, n_washout=10):
    logs = []
    for i in range(n_exposure):
        d = (TODAY - datetime.timedelta(days=start_offset - i)).isoformat()
        syms = [{"name": "Bloating", "intensity": "mild"}] if i in sym_days else []
        logs.append({"user_id": "@UID@", "reintro_id": rid, "food": food, "log_date": d,
                     "phase": "exposure", "ate_food": True, "exposure_number": i + 1,
                     "had_symptoms": bool(syms), "symptoms": syms, "stopped_early": False})
    for i in range(n_washout):
        d = (TODAY - datetime.timedelta(days=start_offset - n_exposure - i)).isoformat()
        logs.append({"user_id": "@UID@", "reintro_id": rid, "food": food, "log_date": d,
                     "phase": "washout", "ate_food": None, "exposure_number": None,
                     "had_symptoms": False, "symptoms": [], "stopped_early": False})
    return rest("POST", "reintro_daily_logs", logs)

try:
    # ---------- Phase A: fresh account, Verdicts tab BEFORE lab ----------
    print("== PHASE A: signup + pre-lab verdicts tab ==")
    signup_or_login(r, EMAIL, "Scout SevenMap", PW)
    enter_intake(r, "Scout SevenMap")
    if "What are you hoping" in r.text():
        r.click("Digestive health"); r.click_btn("Continue"); r.sleep(1.2)
    if "Tell us about" in r.text():
        do_symptoms(r, [("Daily", 0), ("After specific foods", 0), ("A few times a week", 1),
                        ("Occasionally", 1), ("Often irregular or uncomfortable", 0), ("More than 3 years", 0)])
    if "In a typical week" in r.text():
        do_baselines(r, ["6", "5", "5", "5"])
    do_freq(r, [("Cow Milk", "Daily"), ("Wheat", "3–5x/week"), ("Egg Yolk", "1–2x/week"), ("Crab", "Never")])
    do_lifestyle(r, sex="Female")
    r.goto(); r.sleep(2.0); r.wait_ready(20)
    nav_tab(r, "Verdicts"); r.sleep(1.5)
    r.shot("prelab_waiting"); width("prelab")
    r.snap("prelab", 900)

    # ---------- Phase B: lab entry (4 foods, Crab rated Never) ----------
    print("== PHASE B: lab ==")
    nav_tab(r, "Home"); r.sleep(1.2)
    if "Upload your lab results" in r.text() or "lab" in r.text().lower():
        lab_manual(r)
        for food, level in [("Cow Milk", "High"), ("Wheat", "Moderate"), ("Egg Yolk", "Moderate"), ("Crab", "Low")]:
            r.fill_ph("Search foods", food); r.sleep(0.9)
            r.xclick(food, level); r.sleep(0.5)
        r.cta(r"Review my entry"); r.sleep(1.2); r.wait_ready(10)
        r.cta(r"Looks right, submit for review"); r.sleep(3.0); r.wait_ready(20)

    # ---------- Phase C: elimination-era cover (example wall + countdown) ----------
    print("== PHASE C: cover ==")
    srv_skip(EMAIL, 20)
    r.goto(); r.sleep(2.5); r.wait_ready(25)
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    r.click_btn("Got it", required=False)
    nav_tab(r, "Verdicts"); r.sleep(1.5)
    r.shot("cover_examplewall"); width("cover")
    r.snap("cover", 1300)

    # ---------- Phase D: day 57, start cycle, backdate, verdict via agree path ----------
    print("== PHASE D: first verdict ==")
    srv_skip(EMAIL, 57)
    r.goto(); r.sleep(2.5); r.wait_ready(25)
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    r.click_btn("Got it", required=False)
    nav_tab(r, "Verdicts"); r.sleep(1.5)
    r.shot("day57_trials_waiting"); width("day57_waiting")
    r.snap("day57_verdicts", 1100)
    nav_tab(r, "Reintro"); r.sleep(1.5)
    try:
        r.page.get_by_role("button", name=re.compile(r"Start cycle")).first.evaluate("el => el.click()")
        r.sleep(1.5)
    except Exception as e:
        print("start click fail", e)
    r.click("Start today", exact=False, required=False)
    r.sleep(3.0); r.wait_ready(20)
    out = rest("GET", "reintroduction_results?user_id=eq.@UID@&verdict=is.null&select=id,food", None)
    rid = out["body"][0]["id"] if out.get("body") else None
    food = out["body"][0]["food"] if out.get("body") else "?"
    print("active cycle:", rid, food)
    start = (TODAY - datetime.timedelta(days=13)).isoformat()
    wstart = (TODAY - datetime.timedelta(days=11)).isoformat()
    rest("DELETE", f"reintro_daily_logs?reintro_id=eq.{rid}", None)
    rest("PATCH", f"reintroduction_results?id=eq.{rid}",
         {"started_at": start, "washout_started_at": wstart, "exposure_days_completed": 3})
    rest("PATCH", "profiles?id=eq.@UID@", {"reintro_started_at": start, "current_reintro_day": 14})
    seed_logs(rid, food, 13, sym_days=(1,))  # 1 mild exposure day, clean washout
    r.goto(); r.sleep(2.5); r.wait_ready(25)
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    r.cta(r"Get my verdict"); r.sleep(2.5); r.wait_ready(15)
    r.click("Yes, that's accurate", exact=True, required=False); r.sleep(0.8)
    r.cta(r"Get my verdict")
    r.sleep(10.0); r.wait_ready(50)
    for _ in range(20):
        if "Analyzing" not in r.text(): break
        r.sleep(2.0)
    r.shot("verdict_screen")
    r.cta(r"View your verdicts"); r.sleep(2.5); r.wait_ready(15)

    # ---------- Phase E: the earned Food Map — 1 ruled + queue ----------
    print("== PHASE E: map with 1 ruled ==")
    nav_tab(r, "Verdicts"); r.sleep(1.8)
    r.shot("map_1ruled"); width("map_1ruled")
    r.snap("map_1ruled", 1400)
    # expand the ruled card's record
    try:
        r.page.get_by_text(food, exact=False).last.click(timeout=4000); r.sleep(1.2)
        r.shot("record_expanded"); width("record_expanded")
        r.snap("record", 1100)
        r.page.get_by_text(food, exact=False).last.click(timeout=4000); r.sleep(0.8)
    except Exception as e:
        print("expand:", str(e)[:60])

    # ---------- Phase F: seed 2 older completed trials of the same food (retest history) ----------
    print("== PHASE F: trial count + log bleed ==")
    for k, off in [(1, 60), (2, 40)]:
        o = rest("POST", "reintroduction_results", {
            "user_id": "@UID@", "food": food, "sensitivity_level": "High",
            "started_at": (TODAY - datetime.timedelta(days=off)).isoformat(),
            "washout_started_at": (TODAY - datetime.timedelta(days=off - 2)).isoformat(),
            "exposure_days_completed": 3, "verdict": "Limit",
            "verdict_reason": f"Seeded prior trial {k} (QA).",
        })
        rid2 = o["body"][0]["id"] if o.get("body") and isinstance(o["body"], list) else None
        if rid2:
            seed_logs(rid2, food, off, sym_days=(0, 1), n_washout=5)
    r.goto(); r.sleep(2.0); r.wait_ready(20)
    nav_tab(r, "Verdicts"); r.sleep(1.8)
    r.shot("map_3trials"); width("map_3trials")
    body = r.text()
    for probe in ["3TH", "3RD", "2ND"]:
        if probe in body: print("TRIAL LABEL SEEN:", probe)
    try:
        r.page.get_by_text(food, exact=False).last.click(timeout=4000); r.sleep(1.2)
        r.shot("record_3trials_expanded")
        r.snap("record3", 1400)
        r.page.get_by_text(food, exact=False).last.click(timeout=4000); r.sleep(0.8)
    except Exception as e:
        print("expand3:", str(e)[:60])

    # ---------- Phase G: a clean-log Avoid (testimony-adjusted shape) + live trial ----------
    print("== PHASE G: clean-log Avoid + on-trial card ==")
    o = rest("POST", "reintroduction_results", {
        "user_id": "@UID@", "food": "Egg Yolk", "sensitivity_level": "Moderate",
        "started_at": (TODAY - datetime.timedelta(days=30)).isoformat(),
        "washout_started_at": (TODAY - datetime.timedelta(days=28)).isoformat(),
        "exposure_days_completed": 3, "verdict": "Avoid",
        "verdict_reason": "Your logs alone leaned Safe; your account of the two weeks moved this to Avoid.",
        "answers": {"accuracy": "worse", "conflicted": True},
    })
    rid3 = o["body"][0]["id"] if o.get("body") and isinstance(o["body"], list) else None
    if rid3:
        seed_logs(rid3, "Egg Yolk", 30, sym_days=(), n_washout=10)  # fully clean logs
    # start a live cycle on Wheat
    nav_tab(r, "Reintro"); r.sleep(1.8)
    try:
        r.page.get_by_role("button", name=re.compile(r"Start cycle|Start next|Start")).first.evaluate("el => el.click()")
        r.sleep(1.5)
        r.click("Start today", exact=False, required=False)
        r.sleep(3.0); r.wait_ready(20)
    except Exception as e:
        print("wheat start:", str(e)[:70])
    nav_tab(r, "Verdicts"); r.sleep(1.8)
    r.shot("map_full_board"); width("map_full_board")
    r.snap("full_board", 1600)

    # ---------- Phase H: the PDF ----------
    print("== PHASE H: pdf ==")
    try:
        with r.page.expect_download(timeout=30000) as dl:
            r.page.get_by_role("button", name=re.compile("Download your Food Map")).first.evaluate("el => el.click()")
        d = dl.value
        pdf_path = f"{SHOTS}/FM7_foodmap.pdf"
        d.save_as(pdf_path)
        print("PDF saved:", pdf_path, "suggested:", d.suggested_filename)
    except Exception as e:
        print("PDF DOWNLOAD FAILED:", str(e)[:200])
        r.shot("pdf_fail_state")
    r.shot("after_pdf_click")

    # offline-ish probe: does a failed PDF say anything? (abort the chunk route)
    try:
        r.page.route("**/*foodMapPdf*", lambda route: route.abort())
        r.page.reload(); r.sleep(2.5); r.wait_ready(20)
        nav_tab(r, "Verdicts"); r.sleep(1.5)
        r.page.get_by_role("button", name=re.compile("Download your Food Map")).first.evaluate("el => el.click()")
        r.sleep(4.0)
        r.shot("pdf_blocked_silence")
        t = r.page.inner_text("body")
        print("after blocked click, busy text present:", "Preparing" in t)
        r.page.unroute("**/*foodMapPdf*")
    except Exception as e:
        print("block probe:", str(e)[:100])

    print("== CONSOLE ERRORS ==")
    for c in r.console: print("CONSOLE:", c[:200])
    print("== WIDTHS ==")
    for t, w in W: print(f"{t}: {w}px")
    print("== FINDINGS ==")
    for f in r.findings: print(f)
finally:
    r.close()
