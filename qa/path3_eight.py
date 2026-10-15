"""PATH 3: one Low flag (Crab) -> common 8-food. Robot +fable3 (general-wellness persona 'Maria', female)."""
from robot import Robot
from pathkit import *
import re, json

r = Robot("P3")
EMAIL, NAME, PW = "alexandermayer2002+fable3@gmail.com", "Fable Three", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=1400):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))

def freq_pick(food, lbl):
    r.page.click(f"xpath=//*[normalize-space(text())='{food}']/following::*[normalize-space(text())='{lbl}'][1]", timeout=6000)
    r.sleep(0.35)

try:
    signup_or_login(r, EMAIL, NAME, PW)
    if "Start your intake survey" in r.text():
        enter_intake(r, NAME)
        if "What are you hoping" in r.text():
            S("p3_goals", 1000)
            r.click("General wellness"); r.click_btn("Continue"); r.sleep(1.2)
        if "Tell us about" in r.text():
            S("p3_symptoms_blank", 2000)
            plan = [("Occasionally",0), ("Occasional discomfort",0), ("Regularly",1),
                    ("Okay but not great",0), ("Occasionally",2),
                    ("Variable. Good and bad days",0), ("6–12 months",0)]
            # persona voice in the optional textareas
            try: r.fill_ph("Tell us in your own words...", "I keep feeling run down and foggy after meals and my doctor found nothing wrong. I want to know if food is part of it.")
            except Exception: pass
            try: r.fill_ph("Recent diet changes, foods you already suspect, anything at all", "No big diet changes. I eat a lot of bread and cheese. Shellfish maybe twice a month.")
            except Exception: pass
            do_symptoms(r, plan)
        if "In a typical week" in r.text():
            S("p3_baselines", 1400)
            do_baselines(r, ["4","5","4","5","4","5"])
        do_freq(r, [("Cow Milk","Daily"), ("Wheat","3–5x/week"), ("Crab","1–2x/week"), ("Soy","Rarely")])
        do_lifestyle(r, sex="Female")
        S("p3_after_intake", 700)

    if "Upload your lab results" in r.text():
        lab_manual(r)
        lab_rig(r, [("Crab","Low")])
        S("p3_post_lab", 1000)
        r.goto(); r.sleep(2.5); r.wait_ready(25)

    if "Got it" in r.text():
        S("p3_track_intro_popup", 1600)
        r.click_btn("Got it"); r.sleep(1.0)
    S("p3_home_decision", 2000)
    # Pick tier 2 (Test 8 Foods); capture the Crab join banner + 8-row freq card
    r.click("Test 8 Foods"); r.sleep(1.0)
    S("p3_tier2_freq_card", 2600)
    for food, lbl in [("Dairy","Daily"), ("Gluten / wheat","3–5x/week"), ("Eggs","1–2x/week"),
                      ("Soy","Rarely"), ("Tree nuts","Almost never"), ("Corn","1–2x/week"),
                      ("Onion / garlic","Daily"), ("Legumes","Rarely")]:
        try: freq_pick(food, lbl)
        except Exception as e: r.note(f"[P3] freq {food}: {str(e)[:70]}")
    S("p3_freq_filled", 2000)
    r.click_btn("Start my protocol"); r.sleep(2.0); r.wait_ready(20)
    S("p3_post_start_home", 2000)
    srv_skip(EMAIL, 1)
    r.goto(); r.sleep(2.5); r.wait_ready(25)
    if "missed" in r.text().lower():
        S("p3_away_gate", 1200)
        r.cta(r"catch me up|all good|continue|yes"); r.sleep(1.2)
    S("p3_day1_home", 2000)
    # Day-1 daily check-in (female: cycle question should appear)
    r.click("Today's check-in", exact=False); r.sleep(1.8); r.wait_ready(15)
    S("p3_daily_open", 2400)
    try: r.page.click("xpath=//*[contains(normalize-space(text()),'stay on your plan')]/following::*[normalize-space(text())='Yes'][1]", timeout=5000); r.sleep(0.4)
    except Exception as e: r.note(f"[P3] plan yes: {str(e)[:60]}")
    try:
        r.page.get_by_text("Tap to enter", exact=True).nth(0).click(timeout=4000); r.sleep(0.6)
        r.numpad("8"); r.sleep(0.5)
    except Exception as e: r.note(f"[P3] sleep numpad: {str(e)[:60]}")
    r.answer("stress", "Mild")
    try:
        r.page.get_by_text("Tap to enter", exact=True).first.click(timeout=4000); r.sleep(0.6)
        r.numpad("5"); r.sleep(0.5)
    except Exception as e: r.note(f"[P3] water numpad: {str(e)[:60]}")
    if "Where are you in your cycle" in r.text():
        r.answer("cycle", "Not on it")
    else:
        r.note("[P3] FINDING-CHECK: cycle question absent for female user on day 1 daily")
    try: r.click("Felt fine", exact=True)
    except Exception: pass
    S("p3_daily_filled", 2400)
    try: r.cta(r"Done for today"); r.sleep(2.0); r.wait_ready(15)
    except Exception as e: r.note(f"[P3] save blocked: {str(e)[:80]}")
    S("p3_daily_payoff", 1600)
finally:
    with open("p3_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
