"""Nightly scout 2026-10-26 — Area 6: Reintro tab + cycle flow + verdict survey.
Walks the live site at 430px with a fresh +qa test account. REPORT-ONLY."""
import re, json, datetime, sys
from robot import Robot
from pathkit import (signup_or_login, enter_intake, do_symptoms, do_baselines,
                     do_freq, do_lifestyle, lab_manual, srv_skip, nav_tab, ANON, SB)

EMAIL = "alexandermayer2002+qa261026sc6@gmail.com"
PW = "RobotTester!2026"
TODAY = datetime.date.today()

r = Robot("SC6")
W = []  # width measurements

def width(tag):
    try:
        w = r.page.evaluate("document.documentElement.scrollWidth")
        W.append((tag, w))
        print(f"WIDTH {tag}: {w}")
    except Exception as e:
        print("width err", e)

def rest_write(method, pathq, body):
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
    s = json.dumps(out)[:220]
    print(f"REST {method} {pathq[:60]}: {s}")
    return out

try:
    # ---------- Phase A: fresh account to day 57 ----------
    print("== PHASE A: seed ==")
    signup_or_login(r, EMAIL, "Scout SixReintro", PW)
    enter_intake(r, "Scout SixReintro")
    if "What are you hoping" in r.text():
        r.click("Digestive health"); r.click_btn("Continue"); r.sleep(1.2)
    if "Tell us about" in r.text():
        do_symptoms(r, [("Daily", 0), ("After specific foods", 0), ("A few times a week", 1),
                        ("Occasionally", 1), ("Often irregular or uncomfortable", 0), ("More than 3 years", 0)])
    if "In a typical week" in r.text():
        do_baselines(r, ["6", "5", "5", "5"])
    do_freq(r, [("Cow Milk", "Daily"), ("Wheat", "3–5x/week"), ("Crab", "1–2x/week")])
    do_lifestyle(r, sex="Female")
    r.goto(); r.sleep(2.0); r.wait_ready(20)
    if "Upload your lab results" in r.text():
        lab_manual(r)
        for food, level in [("Cow Milk", "High"), ("Wheat", "Moderate"), ("Crab", "Low")]:
            r.fill_ph("Search foods", food); r.sleep(0.9)
            r.xclick(food, level); r.sleep(0.5)
        r.cta(r"Review my entry"); r.sleep(1.2); r.wait_ready(10)
        r.cta(r"Looks right, submit for review"); r.sleep(3.0); r.wait_ready(20)
    srv_skip(EMAIL, 57)
    r.goto(); r.sleep(2.5); r.wait_ready(25)
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    r.click_btn("Got it", required=False)
    r.shot("A_home_day57"); width("home_day57")

    # ---------- Phase B: reintro tab, picker, start sheet ----------
    print("== PHASE B: picker ==")
    nav_tab(r, "Reintro"); r.sleep(1.5)
    r.snap("reintro_day57", 1400)
    r.shot("B_reintro_ceremony"); width("reintro_picker")
    # start sheet on the recommended food
    try:
        r.page.get_by_role("button", name=re.compile(r"Start cycle")).first.evaluate("el => el.click()")
        r.sleep(1.5)
    except Exception as e:
        print("start click fail", e)
    r.snap("start_sheet", 900)
    r.shot("B_start_sheet"); width("start_sheet")
    # open the date strip
    r.click("Pick a start date", exact=False, required=False); r.sleep(1.0)
    r.shot("B_date_strip"); width("date_strip")
    # far-out pick (day 10) to see the confirm
    try:
        far = (TODAY + datetime.timedelta(days=10))
        r.page.get_by_role("button", name=re.compile(f"^[A-Z]\\s*{far.day}$")).last.evaluate("el => el.click()")
        r.sleep(0.8); r.shot("B_far_confirm")
    except Exception as e:
        print("far pick:", str(e)[:80])
    # start today
    r.click("Start today", exact=False, required=False)
    r.sleep(3.0); r.wait_ready(20)
    r.snap("active_cycle", 1400)
    r.shot("B_active_day1"); width("active_day1")

    # ---------- Phase C: log an exposure day with a moderate symptom ----------
    print("== PHASE C: exposure log ==")
    clicked = r.click("Log today", exact=False, required=False)
    if not clicked:
        r.cta(r"Log today")
    r.sleep(1.5); r.wait_ready(10)
    r.snap("daily_checkin_q1", 700)
    r.click("Yes, I ate it", exact=False, required=False); r.sleep(0.8)
    r.click("A normal serving", exact=False, required=False); r.sleep(0.8)
    r.click("Yes, some", exact=False, required=False); r.sleep(0.8)
    r.shot("C_symptom_picker")
    r.click("Bloating", exact=True, required=False); r.sleep(0.5)
    # set moderate intensity
    try:
        r.page.get_by_role("button", name=re.compile("^moderate$", re.I)).first.click(timeout=3000); r.sleep(0.5)
    except Exception as e:
        print("intensity:", str(e)[:60])
    r.shot("C_intensity_set")
    r.cta(r"Log today"); r.sleep(2.0); r.wait_ready(10)
    # severe warning should NOT appear for moderate
    if "Stop and take care" in r.text():
        r.find("severe warning fired on moderate")
    r.snap("after_exposure_log", 1400)
    r.shot("C_needle_after_log"); width("needle_after_log")

    # ---------- Phase D: time-machine the cycle to verdict day via own-row REST ----------
    print("== PHASE D: verdict day ==")
    start = (TODAY - datetime.timedelta(days=13)).isoformat()
    wstart = (TODAY - datetime.timedelta(days=11)).isoformat()
    # fetch active cycle id
    out = rest_write("GET", "reintroduction_results?user_id=eq.@UID@&verdict=is.null&select=id,food", None)
    rid = out["body"][0]["id"] if out.get("body") else None
    food = out["body"][0]["food"] if out.get("body") else "?"
    print("active cycle:", rid, food)
    # wipe today's log, backdate the cycle, insert a 13-day record:
    # 3 exposure days (1 mild symptom day), 10 washout days clean -> provisional Limit-ish/Safe
    rest_write("DELETE", f"reintro_daily_logs?reintro_id=eq.{rid}", None)
    rest_write("PATCH", f"reintroduction_results?id=eq.{rid}",
               {"started_at": start, "washout_started_at": wstart, "exposure_days_completed": 3})
    rest_write("PATCH", "profiles?id=eq.@UID@", {"reintro_started_at": start, "current_reintro_day": 14})
    logs = []
    for i in range(3):
        d = (TODAY - datetime.timedelta(days=13 - i)).isoformat()
        syms = [{"name": "Bloating", "intensity": "mild"}] if i == 1 else []
        logs.append({"user_id": "@UID@", "reintro_id": rid, "food": food, "log_date": d,
                     "phase": "exposure", "ate_food": True, "exposure_number": i + 1,
                     "had_symptoms": bool(syms), "symptoms": syms, "stopped_early": False})
    for i in range(10):
        d = (TODAY - datetime.timedelta(days=10 - i)).isoformat()
        logs.append({"user_id": "@UID@", "reintro_id": rid, "food": food, "log_date": d,
                     "phase": "washout", "ate_food": None, "exposure_number": None,
                     "had_symptoms": False, "symptoms": [], "stopped_early": False})
    rest_write("POST", "reintro_daily_logs", logs)

    r.goto(); r.sleep(2.5); r.wait_ready(25)
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    r.shot("D_home_verdict_ready"); width("home_verdict_ready")
    r.snap("home_verdict_hero", 1000)
    nav_tab(r, "Reintro"); r.sleep(1.5)
    r.snap("reintro_verdict_day", 1400)
    r.shot("D_reintro_verdict_ready"); width("reintro_verdict_ready")

    # ---------- Phase E: verdict survey, disagreement path ----------
    print("== PHASE E: survey ==")
    r.cta(r"Get my verdict"); r.sleep(2.5); r.wait_ready(15)
    r.snap("survey_top", 1200)
    r.shot("E_survey_summary"); width("survey")
    r.click("Not quite, it felt worse than that", exact=True, required=False); r.sleep(0.8)
    r.shot("E_followup_open"); width("survey_followup")
    r.click("Bloating", exact=True, required=False); r.sleep(0.4)
    r.click("Stomach pain", exact=True, required=False); r.sleep(0.4)
    try:
        r.page.get_by_placeholder("Anything else, in your own words").first.fill("Felt heavy and off most exposure evenings")
    except Exception as e: print("felt text:", str(e)[:50])
    # when strongest: exposure days
    r.click("On the days I ate", exact=False, required=False); r.sleep(0.4)
    # cause: the food (-> conflicted ruling + retest offer)
    r.click("Yes, I think it was the", exact=False, required=False); r.sleep(0.4)
    try:
        r.page.locator("textarea").first.fill("Slept badly the second week, work was stressful.")
    except Exception: pass
    r.shot("E_survey_filled")
    r.cta(r"Get my verdict")
    r.sleep(10.0); r.wait_ready(50)
    for _ in range(20):
        if "Analyzing" not in r.text(): break
        r.sleep(2.0)
    r.snap("verdict_screen", 1600)
    r.shot("E_verdict_screen"); width("verdict_screen")

    # ---------- Phase F: back to tab — retest offer + ledger ----------
    print("== PHASE F: ledger ==")
    r.cta(r"View your verdicts"); r.sleep(2.5); r.wait_ready(15)
    r.snap("after_verdict_landing", 900)
    nav_tab(r, "Reintro"); r.sleep(1.8)
    r.snap("reintro_after_verdict", 1600)
    r.shot("F_reintro_after_verdict"); width("reintro_after_verdict")
    # expand the tested ledger row
    try:
        r.page.get_by_text(food, exact=True).last.click(timeout=4000); r.sleep(1.2)
        r.shot("F_ledger_expanded"); width("ledger_expanded")
        r.snap("ledger", 1000)
    except Exception as e:
        print("ledger:", str(e)[:60])

    print("== CONSOLE ERRORS ==")
    for c in r.console: print("CONSOLE:", c[:200])
    print("== WIDTHS ==")
    for t, w in W: print(f"{t}: {w}px")
    print("== FINDINGS ==")
    for f in r.findings: print(f)
finally:
    r.close()
