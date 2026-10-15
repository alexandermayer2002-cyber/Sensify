from robot import Robot
from pathkit import signup_or_login
import json
r = Robot("P4C")
EMAIL, NAME, PW = "alexandermayer2002+fable4@gmail.com", "Fable Four", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=1600):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
try:
    signup_or_login(r, EMAIL, NAME, PW)
    # capture the home sections BELOW the landing (daily card label etc.)
    full = r.snap("full", 6000)
    print("TAIL:", full[2400:4600].replace("\n", " | "))
    r.click_btn("Start the full protocol"); r.sleep(2.5); r.wait_ready(20)
    S("p4_after_revert_decision", 1600)
    if "Got it" in r.text(): r.click_btn("Got it"); r.sleep(0.8)
    r.click_btn("I'd rather just track for now"); r.sleep(2.5); r.wait_ready(15)
    S("p4_redeclined_home", 900)
finally:
    with open("p4c_report.json", "w") as f:
        json.dump({"findings": r.findings, **report}, f, indent=1)
    r.close()
