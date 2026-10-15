from robot import Robot
from pathkit import signup_or_login
import json
r = Robot("P4B")
EMAIL, NAME, PW = "alexandermayer2002+fable4@gmail.com", "Fable Four", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=1600):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
try:
    signup_or_login(r, EMAIL, NAME, PW)
    S("p4_tracking_home_full", 2600)
    try:
        r.cta(r"protocol|Start|answers"); r.sleep(2.5); r.wait_ready(20)
        S("p4_after_revert", 1800)
        # back on the decision card; decline again to leave the account in tracking
        if "Got it" in r.text(): r.click_btn("Got it"); r.sleep(0.8)
        r.click_btn("I'd rather just track for now"); r.sleep(2.5); r.wait_ready(15)
        S("p4_redeclined", 1200)
    except Exception as e:
        r.note(f"[P4B] revert: {str(e)[:90]}")
finally:
    with open("p4b_report.json", "w") as f:
        json.dump({"findings": r.findings, **report}, f, indent=1)
    r.close()
