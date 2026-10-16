"""RETEST P1 (+fable5): flagged multi-level lab -> ONE frequency-ordered queue (doctrine on the flagged track)."""
from robot import Robot
from pathkit import *
import re, json
r = Robot("R2P1")
EMAIL, NAME, PW = "alexandermayer2002+fable5@gmail.com", "Fable Five", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=1600):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
def gate():
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
try:
    signup_or_login(r, EMAIL, NAME, PW)
    if "Start your intake survey" in r.text():
        enter_intake(r, NAME)
        if "What are you hoping" in r.text():
            r.click("Digestive health"); r.click_btn("Continue"); r.sleep(1.2)
        if "Tell us about" in r.text():
            plan = [("Daily",0), ("After specific foods",0), ("A few times a week",1),
                    ("Occasionally",1), ("Often irregular or uncomfortable",0), ("More than 3 years",0)]
            do_symptoms(r, plan)
        if "In a typical week" in r.text():
            do_baselines(r, ["7","6","4","6"])
        # frequencies chosen so the correct ORDER differs from tier order:
        # Crab (Low) daily must outrank Beef (High) 1-2x under the doctrine
        do_freq(r, [("Crab","Daily"), ("Egg Yolk","3–5x/week"), ("Beef","1–2x/week"), ("Avocado","Rarely")])
        do_lifestyle(r, sex="Female")
    if "Upload your lab results" in r.text():
        lab_manual(r)
        for food, lvl in [("Beef","High"), ("Egg Yolk","Moderate"), ("Avocado","High"), ("Crab","Low")]:
            r.fill_ph("Search foods", food); r.sleep(0.9)
            r.xclick(food, lvl); r.sleep(0.5)
        r.cta(r"Review my entry"); r.sleep(1.2)
        S("r1_readback", 1400)
        r.cta(r"Looks right, submit for review"); r.sleep(3.0); r.wait_ready(20)
        r.goto(); r.sleep(2.5); r.wait_ready(25)
    S("r1_home_flagged", 1600)   # flagged auto-approve: start tomorrow
    srv_skip(EMAIL, 57)
    r.goto(); r.sleep(2.5); r.wait_ready(25); gate()
    S("r1_unlock_hero", 1400)    # expect OF 56 (4 foods x 14)
    r.click("Reintro", exact=True); r.sleep(2.0); r.wait_ready(15)
    S("r1_picker", 2400)         # expect ONE queue: Crab, Egg Yolk, Beef, Avocado (freq order)
finally:
    with open("r2p1_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
