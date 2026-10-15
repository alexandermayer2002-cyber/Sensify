from robot import Robot
import re, json

r = Robot("P1d")
EMAIL, PW = "alexandermayer2002+fable2@gmail.com", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=650):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
def skip(d):
    if not r.cta(rf"\+{d}d"): return False
    r.sleep(3.0); r.goto(); r.sleep(2.0); r.wait_ready(20); return True

try:
    r.login(EMAIL, PW); r.sleep(2); r.wait_ready()
    r.cta(r"done", ) if "Done" in r.text() else None
    skip(7)
    S("day8_home", 800)
    # weekly check-in
    if not r.cta(r"weekly"):
        r.click("Weekly check-in", exact=False, required=False)
    r.sleep(1.8); r.wait_ready(10)
    S("weekly_form", 900)
finally:
    with open("p1d_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
