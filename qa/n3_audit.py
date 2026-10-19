"""Finish the messy leg: open and walk the 3-NO compliance audit (+qamessy)."""
from robot import Robot
from pathkit import signup_or_login
import json
r = Robot("N3A")
report = {"screens": {}, "shots": []}
def S(tag, n=2200):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
try:
    signup_or_login(r, "alexandermayer2002+qamessy@gmail.com", "Mess Tester", "RobotTester!2026")
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    if "Let's talk" in r.text() or "figure this out" in r.text():
        r.cta(r"Let's talk"); r.sleep(2.2); r.wait_ready(12)
        S("n3a_audit_open", 2600)
        # adaptive walk: click the first plausible option on each step, then advance
        for step in range(6):
            advanced = False
            for lbl in ["I had a stressful week", "Cravings", "Social situations", "Hidden ingredients",
                        "Weekends", "Evenings", "Family meals", "Stress", "Moderate",
                        "Yes, I do most of the cooking", "Cost", "I'm not sure"]:
                if r.click(lbl, exact=False, required=False):
                    r.sleep(0.5); break
            for btn in ["Got it, continue →", "Continue →", "Continue", "Got it, submit →", "Submit →", "Submit", "Done"]:
                if r.click_btn(btn, required=False):
                    r.sleep(1.8); advanced = True; break
            S(f"n3a_step{step}", 1800)
            t = r.text()
            if "guidance" in t.lower() and ("24 hours" in t or "coming" in t.lower()):
                break
            if not advanced:
                break
        S("n3a_audit_end", 2200)
    else:
        S("n3a_no_audit_card", 1400)
finally:
    with open("n3a_report.json", "w") as f:
        json.dump({"findings": r.findings, **report}, f, indent=1)
    r.close()
