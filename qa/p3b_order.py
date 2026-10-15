from robot import Robot
from pathkit import srv_skip as _srv, signup_or_login
import re, json
r = Robot("P3B")
EMAIL, NAME, PW = "alexandermayer2002+fable3@gmail.com", "Fable Three", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=1600):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
try:
    signup_or_login(r, EMAIL, NAME, PW)
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    _srv(EMAIL, 56)
    r.goto(); r.sleep(2.5); r.wait_ready(25)
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    S("p3_day57_home", 1800)
    r.click("Reintro", exact=True); r.sleep(2.0); r.wait_ready(15)
    S("p3_reintro_order", 3400)
finally:
    with open("p3b_report.json", "w") as f:
        json.dump({"findings": r.findings, **report}, f, indent=1)
    r.close()
