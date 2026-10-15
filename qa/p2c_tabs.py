from robot import Robot
from pathkit import *
import json
r = Robot("P2C")
EMAIL, NAME, PW = "alexandermayer2002+fable1@gmail.com", "Fable One", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=1600):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
try:
    signup_or_login(r, EMAIL, NAME, PW)
    for tab in ["Reintro", "Verdicts", "History", "Ask Sensify"]:
        try:
            r.click(tab, exact=True); r.sleep(1.8); r.wait_ready(12)
            S("p2_tab_" + tab.lower().replace(" ", "_"))
        except Exception as e:
            r.note(f"[P2C] tab {tab}: {str(e)[:60]}")
finally:
    with open("p2c_report.json", "w") as f:
        json.dump({"findings": r.findings, **report}, f, indent=1)
    r.close()
