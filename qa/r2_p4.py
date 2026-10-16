"""RETEST P4 (+fable8): clean report via UI, decline, tracking states + real buttons."""
from robot import Robot
from pathkit import *
import re, json
r = Robot("R2P4")
EMAIL, NAME, PW = "alexandermayer2002+fable8@gmail.com", "Fable Eight", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=1600):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
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
            do_baselines(r, ["7","6","5","6"])
        do_freq(r, [("Cow Milk","Daily"), ("Wheat","Daily")])
        do_lifestyle(r, sex="Male")
    if "Upload your lab results" in r.text():
        lab_manual(r)
        r.click("My report shows no sensitivities", exact=False); r.sleep(0.8)
        r.cta(r"Review my entry"); r.sleep(1.2)
        r.cta(r"Looks right, submit for review"); r.sleep(3.0); r.wait_ready(20)
        r.goto(); r.sleep(2.5); r.wait_ready(25)
    if "Got it" in r.text():
        r.click_btn("Got it"); r.sleep(1.0)
    r.click_btn("I'd rather just track for now"); r.sleep(2.5); r.wait_ready(20)
    S("r4_tracking_home", 2400)
    # Real buttons: first bullet opens the daily
    r.click("Log how today went", exact=False); r.sleep(2.0); r.wait_ready(12)
    S("r4_daily_from_bullet", 1400)   # expect trimmed tracking daily
    r.click("← Back", exact=False, required=False) or r.goto(); r.sleep(2.0); r.wait_ready(15)
    # Second bullet opens Ask Sensify
    r.click("Ask Sensify to help spot patterns", exact=False); r.sleep(2.0); r.wait_ready(12)
    S("r4_ask_from_bullet", 1000)
    # Tracking-mode tabs
    for tab, tag in [("Reintro","r4_tab_reintro"), ("Verdicts","r4_tab_verdicts")]:
        try: r.page.get_by_text("Home", exact=True).first.click(timeout=3000); r.sleep(1.4)
        except Exception: r.goto(); r.sleep(2.0)
        r.click(tab, exact=True); r.sleep(1.8); r.wait_ready(12)
        S(tag, 1600)
finally:
    with open("r2p4_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
