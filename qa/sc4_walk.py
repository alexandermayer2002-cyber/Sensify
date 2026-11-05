"""Scout 2026-11-04 — area 4 second pass: daily check-in + slip-up/audit flows.
Fresh drinker/female persona, mid-elimination, full ritual walk at 430px.
REPORT ONLY. Shots SC4_*."""
import os, json, re, subprocess
os.environ["QA_SHOTS"] = "/tmp/claude-0/-home-claude-sensify/1716ba7b-bc83-5816-86e9-8a544fc7cfe5/scratchpad/qa"
from robot import Robot
from pathkit import (signup_or_login, enter_intake, do_symptoms, do_baselines,
                     do_freq, lab_manual, srv_skip, ANON, SB, SITE_FN)
from fleetkit import _flag_and_submit, gate

EMAIL = "alexandermayer2002+qa2611055vfy@gmail.com"
PW = "RobotQA-2611!"
NAME = "Scout Fournight"

def rest(r, method, path, body=None):
    js = """async ([anon, sb, method, path, body]) => {
      const key = Object.keys(localStorage).find(k => k.endsWith('-auth-token'));
      const tok = JSON.parse(localStorage.getItem(key));
      const H = {apikey: anon, Authorization: 'Bearer ' + tok.access_token, 'Content-Type': 'application/json'};
      const uid = tok.user.id;
      const res = await fetch(sb + '/rest/v1/' + path.replace('$UID', uid), {method, headers: {...H, Prefer: 'return=representation'}, body: body ? JSON.stringify(body) : undefined});
      return {status: res.status, body: (await res.text()).slice(0, 800)};
    }"""
    return r.page.evaluate(js, [ANON, SB, method, path, body])

def approve(email):
    out = subprocess.run(["curl","-s","-X","POST", f"{SITE_FN}/test-approve-lab",
        "-H","Content-Type: application/json","-d", json.dumps({"email": email})],
        capture_output=True, text=True).stdout
    print("approve:", out[:160])

def daily_checkin(r, stress="Moderate", skip_drinks=True, notable=False, recall=None):
    if not r.click_btn("Check in now", required=False):
        if not r.cta(r"Check in|check.?in"):
            print("NO CHECKIN ENTRY:", r.text()[:200].replace("\n", " | ")); return False
    r.sleep(2.0); r.wait_ready(12)
    if "Did you stay on your plan" not in r.text():
        print("NO PLAN Q:", r.text()[:300].replace("\n", " | "))
    r.xclick("Did you stay on your plan", "No", required=False)
    r.xclick("hours did you sleep", "Tap to enter", required=False); r.numpad("7"); r.sleep(0.4)
    r.xclick("stress today", stress, required=False)
    r.xclick("cups of water", "Tap to enter", required=False); r.numpad("4"); r.sleep(0.4)
    r.xclick("in your cycle", "Not sure", required=False)
    if not skip_drinks:
        r.xclick("many drinks today", "Tap to enter", required=False); r.numpad("2"); r.sleep(0.4)
    if notable:
        r.click("Something notable", required=False); r.sleep(0.6)
        r.click("Bloating", required=False); r.sleep(0.3)
        r.click("Evening", required=False); r.sleep(0.3)
    if recall:
        try:
            r.page.locator("textarea").first.fill(recall); r.sleep(0.4)
        except Exception as e: r.find("recall textarea: " + str(e)[:60])
    return True

r = Robot("SC4")
try:
    signup_or_login(r, EMAIL, NAME, PW)
    # ---- intake (female, DRINKER) ----
    enter_intake(r, NAME)
    if "What are you hoping" in r.text():
        r.click("Digestive health"); r.click_btn("Continue"); r.sleep(1.2)
    if "Tell us about" in r.text():
        do_symptoms(r, [("Daily", 0), ("After specific foods", 0), ("A few times a week", 1),
                        ("Occasionally", 1), ("Often irregular or uncomfortable", 0), ("More than 3 years", 0)])
    if "In a typical week" in r.text():
        do_baselines(r, ["6", "5", "5", "5"])
    do_freq(r, [("Cow Milk", "Daily"), ("Wheat", "3–5x/week")])
    if "how many hours do you sleep" in r.text():
        if r.click("Tap to enter", required=False): r.numpad("7")
        if r.click("Tap to enter", required=False): r.numpad("6")
        r.xclick("usual stress level", "Moderate")
        r.xclick("What's your sex", "Female")
        r.xclick("Do you drink alcohol", "Yes")
        r.sleep(0.8)
        # "Yes" reveals a drinks-per-week follow-up with its own entry
        if "drinks per week" in r.text():
            if r.click("Tap to enter", required=False): r.numpad("4")
            r.sleep(0.4)
        r.click_btn("Complete intake", required=False) or print("INTAKE BLOCKED:", r.text()[-300:].replace("\n", " | "))
        r.sleep(2.5); r.wait_ready(20)
    r.goto(); r.sleep(2.0); r.wait_ready(20)
    # ---- lab ----
    if "Upload your lab results" in r.text():
        lab_manual(r)
        _flag_and_submit(r, [("Cow Milk", "High"), ("Wheat", "Moderate")])
        approve(EMAIL)
    srv_skip(EMAIL, 10)  # mid-elimination
    r.goto(); r.sleep(2.5); r.wait_ready(20); gate(r)
    r.shot("dash_day11")
    print("DAY:", [l for l in r.text().split("\n") if "Day" in l][:4])

    # ---- DAY A: full check-in, plan NO, notable + recall, drinks SKIPPED ----
    if daily_checkin(r, stress="High", skip_drinks=True, notable=True,
                     recall="goat cheese omelette and a glass of red wine"):
        r.shot("checkin_filled")
        if r.click("Check what we read from it", required=False):
            r.sleep(7.0); r.shot("recall_tags")
            print("TAGS:", r.text()[-700:].replace("\n", " | ")[:600])
        r.click_btn("Done for today"); r.sleep(7.0); r.wait_ready(15)
        r.shot("checkin_reward")
        print("REWARD:", r.text()[:450].replace("\n", " | "))
        print("DF_ROW:", rest(r, "GET", "daily_factors?user_id=eq.$UID&select=log_date,drinks,cycle_phase,sleep,stress&order=log_date.desc&limit=1"))
        print("SYMLOG:", rest(r, "GET", "symptom_logs?user_id=eq.$UID&select=symptom,severity,note&limit=5"))
        print("MEAL:", rest(r, "GET", "meal_logs?user_id=eq.$UID&select=raw_text,foods&limit=3"))
        r.click_btn("Done", required=False); r.sleep(2.5); r.wait_ready(15)

    # ---- SLIP-UP ----
    r.shot("dash_after_checkin")
    t = r.text()
    print("SLIP_CARD_SHOWN:", "Tell us what happened" in t)
    if "Tell us what happened" in t:
        r.click_btn("Tell us what happened"); r.sleep(1.5); r.wait_ready(10)
        r.fill_ph("Search foods or type your own...", "goat cheese"); r.sleep(0.9)
        r.click('Add "goat cheese"', required=False) or r.click("goat cheese", required=False)
        r.sleep(0.4)
        r.click("Intentional. I chose to eat it", required=False)
        r.shot("slipup_filled")
        r.click_btn("Submit"); r.sleep(8.0)
        r.shot("slipup_ai")
        print("SLIPAI:", r.text()[:700].replace("\n", " | "))
        r.click_btn("Back to dashboard"); r.sleep(2.5); r.wait_ready(15)
        t = r.text()
        print("CARD_AFTER_SUBMIT:", "Tell us what happened" in t, "|", "Slip-up logged today" in t); print("RECEIPT_CARD:", ("thank you" in t) and ("fresh start" in t))
        r.shot("dash_after_slipup")
        print("DC_ROW:", rest(r, "GET", "daily_compliance?user_id=eq.$UID&select=date,response,slip_up_foods,slip_up_reason&order=date.desc&limit=1"))
        if "Tell us what happened" in t:
            r.click_btn("Tell us what happened"); r.sleep(1.5); r.wait_ready(10)
            r.fill_ph("Search foods or type your own...", "Bread"); r.sleep(0.9)
            r.click("Bread", exact=True, required=False); r.sleep(0.4)
            r.click("Hidden ingredient. I thought the food was safe", required=False)
            r.click_btn("Submit"); r.sleep(6.0)
            r.click_btn("Back to dashboard", required=False); r.sleep(2.0); r.wait_ready(15)
            print("DC_ROW2 (after 2nd slip same day):", rest(r, "GET", "daily_compliance?user_id=eq.$UID&select=date,response,slip_up_foods,slip_up_reason&order=date.desc&limit=1"))

    # ---- Two more NO days -> 3-NOs audit ----
    for day in (2, 3):
        srv_skip(EMAIL, 1)
        r.goto(); r.sleep(2.5); r.wait_ready(20); gate(r)
        if daily_checkin(r, stress="Moderate", skip_drinks=False):
            r.click_btn("Done for today"); r.sleep(5.0); r.wait_ready(12)
            r.click_btn("Done", required=False); r.sleep(2.5); r.wait_ready(15)
    r.shot("dash_3nos")
    t = r.text()
    print("AUDIT_CARD_TEXT:", [l for l in t.split("\n") if l.strip()][:30])

    # ---- AUDIT walk ----
    clicked = r.click_btn("Okay, let's figure it out", required=False) or r.cta(r"figure it out|Let's find it|not treat it as failure")
    if not clicked:
        # the card on the dashboard might carry its own CTA label
        clicked = r.cta(r"Start|Tell us|audit")
    if clicked:
        r.sleep(1.5); r.wait_ready(10)
        if "Three days is hard" in r.text() or "figure it out" in r.text():
            r.shot("audit_opening")
            r.click_btn("Okay, let's figure it out", required=False); r.sleep(1.2)
        r.shot("audit_q1")
        r.click("Food cravings", required=False); r.sleep(0.3)
        r.click("Life got in the way", required=False); r.sleep(0.3)
        r.click_btn("Continue"); r.sleep(1.4)
        r.shot("audit_cravings")
        try: r.page.locator("input").first.fill("fresh bread")
        except Exception: pass
        r.sleep(0.4)
        r.click_btn("Continue"); r.sleep(1.4)
        r.shot("audit_life")
        r.click("8", exact=True, required=False); r.sleep(0.8)
        r.shot("audit_stress8")
        r.click_btn("Submit"); r.sleep(12.0)
        r.shot("audit_submitted")
        print("AUDIT_DONE:", r.text()[:600].replace("\n", " | "))
        r.click_btn("Back to dashboard", required=False); r.sleep(2.5); r.wait_ready(15)
        r.shot("dash_pending")
        t = r.text()
        print("PENDING_CARD:", "Guidance being prepared" in t)
        print("AUDITS:", rest(r, "GET", "compliance_audit?user_id=eq.$UID&select=trigger_type,status,hardest_parts,branch_responses&order=triggered_at.desc&limit=3"))
    else:
        print("NO AUDIT ENTRY FOUND")

    print("CONSOLE_ERRORS:", json.dumps(r.console[:12]))
    print("WALK_FINDINGS:", json.dumps(r.findings))
finally:
    r.close()
