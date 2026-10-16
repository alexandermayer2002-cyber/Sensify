"""RETEST P3 (+fable7): one Low flag via real UI two-press, flagged popup script, 8-food union, single ordered queue."""
from robot import Robot
from pathkit import *
import re, json

r = Robot("R2P3")
EMAIL, NAME, PW = "alexandermayer2002+fable7@gmail.com", "Fable Seven", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=1600):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
def gate():
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
def freq_pick(food, lbl):
    r.page.click(f"xpath=//*[normalize-space(text())='{food}']/following::*[normalize-space(text())='{lbl}'][1]", timeout=6000)
    r.sleep(0.35)

try:
    signup_or_login(r, EMAIL, NAME, PW)
    if "Start your intake survey" in r.text():
        enter_intake(r, NAME)
        if "What are you hoping" in r.text():
            r.click("General wellness"); r.click_btn("Continue"); r.sleep(1.2)
        if "Tell us about" in r.text():
            plan = [("Occasionally",0), ("Occasional discomfort",0), ("Regularly",1),
                    ("Okay but not great",0), ("Occasionally",2),
                    ("Variable. Good and bad days",0), ("6–12 months",0)]
            try: r.fill_ph("Tell us in your own words...", "Run down after meals for a year, doctor found nothing. Want to know if food is part of it.")
            except Exception: pass
            do_symptoms(r, plan)
        if "In a typical week" in r.text():
            do_baselines(r, ["4","5","4","5","4","5"])
        do_freq(r, [("Cow Milk","Daily"), ("Wheat","3–5x/week"), ("Crab","1–2x/week")])
        do_lifestyle(r, sex="Female")

    if "Upload your lab results" in r.text():
        lab_manual(r)
        # one Low flag through the REAL two-press flow
        r.fill_ph("Search foods", "Crab"); r.sleep(0.9)
        r.xclick("Crab", "Low"); r.sleep(0.5)
        r.cta(r"Review my entry"); r.sleep(1.2)
        S("r3_readback", 1600)      # expect 'Crab (Low)' read-back
        r.cta(r"Looks right, submit for review"); r.sleep(3.0); r.wait_ready(20)
        r.goto(); r.sleep(2.5); r.wait_ready(25)

    if "Got it" in r.text():
        S("r3_popup_flagged", 1800) # expect 'Your flags are real' script, NOT clean-panel
        r.click_btn("Got it"); r.sleep(1.0)
    S("r3_decision", 2000)
    r.click("Test 8 Foods"); r.sleep(1.0)
    for food, lbl in [("Dairy","Daily"), ("Gluten / wheat","3–5x/week"), ("Eggs","1–2x/week"),
                      ("Soy","Rarely"), ("Tree nuts","Almost never"), ("Corn","1–2x/week"),
                      ("Onion / garlic","Daily"), ("Legumes","Rarely")]:
        try: freq_pick(food, lbl)
        except Exception as e: r.note(f"[R2P3] freq {food}: {str(e)[:70]}")
    r.click_btn("Start my protocol"); r.sleep(2.0); r.wait_ready(20)
    srv_skip(EMAIL, 57)
    r.goto(); r.sleep(2.5); r.wait_ready(25); gate()
    S("r3_unlock_hero", 1600)       # expect 'OF 126' (9 foods x 14), 'TESTING OPEN'
    r.click("Reintro", exact=True); r.sleep(2.0); r.wait_ready(15)
    S("r3_picker", 3000)            # expect ONE list, 9 foods, frequency order, Crab mid-queue
finally:
    with open("r2p3_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
