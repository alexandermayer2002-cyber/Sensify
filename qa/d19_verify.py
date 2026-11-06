"""Deploy 19 live verification — HIGH #1 reproduction (verdict-ready cycle +
POISONED profile pointer) must now rule the CYCLE's food; plus string-shaped
symptom row tolerance and the honest retest copy. Fresh +qa account."""
import re, json, datetime
import os
os.environ["QA_SHOTS"] = "/tmp/claude-0/-home-claude-sensify/1716ba7b-bc83-5816-86e9-8a544fc7cfe5/scratchpad/qa"
from robot import Robot
from pathkit import (signup_or_login, enter_intake, do_symptoms, do_baselines,
                     do_freq, do_lifestyle, lab_manual, srv_skip, nav_tab, ANON, SB, SITE_FN)
from fleetkit import _flag_and_submit, gate
import subprocess

EMAIL = "alexandermayer2002+qa2611066d19@gmail.com"
PW = "RobotQA-2611!"
TODAY = datetime.date.today()

r = Robot("D19")

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
    print(f"REST {method} {pathq[:55]}: {json.dumps(out)[:180]}")
    return out

try:
    signup_or_login(r, EMAIL, "Verify Nineteen", PW)
    enter_intake(r, "Verify Nineteen")
    if "What are you hoping" in r.text():
        r.click("Digestive health"); r.click_btn("Continue"); r.sleep(1.2)
    if "Tell us about" in r.text():
        do_symptoms(r, [("Daily", 0), ("After specific foods", 0), ("A few times a week", 1),
                        ("Occasionally", 1), ("Often irregular or uncomfortable", 0), ("More than 3 years", 0)])
    if "In a typical week" in r.text():
        do_baselines(r, ["6", "5", "5", "5"])
    do_freq(r, [("Wheat", "Daily"), ("Cow Milk", "3–5x/week")])
    do_lifestyle(r, sex="Female")
    r.goto(); r.sleep(2.0); r.wait_ready(20)
    if "Upload your lab results" in r.text():
        lab_manual(r)
        _flag_and_submit(r, [("Wheat", "High"), ("Cow Milk", "Moderate")])
        out = subprocess.run(["curl","-s","-X","POST", f"{SITE_FN}/test-approve-lab",
            "-H","Content-Type: application/json","-d", json.dumps({"email": EMAIL})],
            capture_output=True, text=True).stdout
        print("approve:", out[:80])
    srv_skip(EMAIL, 57)
    r.goto(); r.sleep(2.5); r.wait_ready(25); gate(r)

    # start the recommended cycle (Wheat, eaten daily -> first in queue)
    nav_tab(r, "Reintro"); r.sleep(1.5)
    try:
        r.page.get_by_role("button", name=re.compile(r"Start cycle")).first.evaluate("el => el.click()")
        r.sleep(1.5)
    except Exception as e: print("start click fail", str(e)[:60])
    r.click("Start today", exact=False, required=False)
    r.sleep(3.0); r.wait_ready(20)

    # time-machine to verdict day via own-row REST, with ONE string-shaped washout row
    start = (TODAY - datetime.timedelta(days=13)).isoformat()
    wstart = (TODAY - datetime.timedelta(days=11)).isoformat()
    out = rest_write("GET", "reintroduction_results?user_id=eq.@UID@&verdict=is.null&select=id,food", None)
    rid = out["body"][0]["id"]; food = out["body"][0]["food"]
    print("ACTIVE CYCLE:", rid, food)
    rest_write("DELETE", f"reintro_daily_logs?reintro_id=eq.{rid}", None)
    rest_write("PATCH", f"reintroduction_results?id=eq.{rid}",
               {"started_at": start, "washout_started_at": wstart, "exposure_days_completed": 3})
    # THE POISON (last night's HIGH): clear the profile pointer entirely
    rest_write("PATCH", "profiles?id=eq.@UID@", {"current_reintro_food": None, "reintro_started_at": start})
    logs = []
    for i in range(3):
        d = (TODAY - datetime.timedelta(days=13 - i)).isoformat()
        syms = [{"name": "Bloating", "intensity": "mild"}] if i == 1 else []
        logs.append({"user_id": "@UID@", "reintro_id": rid, "food": food, "log_date": d,
                     "phase": "exposure", "ate_food": True, "exposure_number": i + 1,
                     "had_symptoms": bool(syms), "symptoms": syms, "stopped_early": False})
    for i in range(10):
        d = (TODAY - datetime.timedelta(days=10 - i)).isoformat()
        # one legacy STRING-shaped symptoms row (i==4): tab+engine must tolerate
        syms = json.dumps(["Headache"]) if i == 4 else []
        logs.append({"user_id": "@UID@", "reintro_id": rid, "food": food, "log_date": d,
                     "phase": "washout", "ate_food": None, "exposure_number": None,
                     "had_symptoms": bool(syms), "symptoms": syms, "stopped_early": False})
    rest_write("POST", "reintro_daily_logs", logs)

    r.goto(); r.sleep(2.5); r.wait_ready(25); gate(r)
    t = r.text()
    print("HERO_VERDICT_BTN:", [l for l in t.split("\n") if "verdict" in l.lower()][:3])
    r.shot("verdict_ready_home")
    nav_tab(r, "Reintro"); r.sleep(1.8); r.wait_ready(12)
    t = r.text()
    print("TAB_OK:", "Something went wrong" not in t and "went wrong" not in t)
    r.shot("reintro_tab_verdictday")
    r.cta(r"Get my verdict"); r.sleep(2.5); r.wait_ready(15)
    t = r.text()
    print("SURVEY_HEADLINE:", [l for l in t.split("\n") if "results" in l.lower()][:2])
    print("WRONG_FOOD_EGGS:", "eggs" in t.lower())
    print("RIGHT_FOOD:", food.lower() in t.lower())
    print("RETEST_COPY:", "retest any food" in t, "|", "Support" in t)
    r.shot("survey_top")
    # agree path -> verdict
    r.click("Yes, that's accurate", exact=True, required=False)
    try: r.page.locator("textarea").first.fill("Deploy 19 verification run.")
    except Exception: pass
    r.cta(r"Get my verdict")
    r.sleep(14.0); r.wait_ready(50)
    t = r.text()
    print("VERDICT_SCREEN:", t[:350].replace("\n", " | "))
    print("FM:", rest_write("GET", "food_map?user_id=eq.@UID@&select=food,status", None))
    print("CYCLES:", rest_write("GET", "reintroduction_results?user_id=eq.@UID@&select=food,verdict", None))
    print("CONSOLE:", json.dumps(r.console[:8]))
finally:
    r.close()
