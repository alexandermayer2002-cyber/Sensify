"""PATH 1 part 2: day 1 -> daily -> weekly -> day 57 -> first cycle -> verdict."""
from robot import Robot
import re, json

r = Robot("P1b")
EMAIL, PW = "alexandermayer2002+fable2@gmail.com", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=650):
    report["screens"][tag] = r.snap(tag, n)
    report["shots"].append(r.shot(tag))

def skip(d):
    r.cta(rf"\+{d}d"); r.sleep(2.5); r.wait_ready(20); r.goto(); r.sleep(1.5); r.wait_ready(15)

try:
    r.login(EMAIL, PW); r.sleep(2); r.wait_ready()
    S("eve_state")
    skip(1)                       # start was tomorrow -> now day 1
    S("day1_dashboard", 900)

    # tabs capture
    for tab in ["Verdicts", "Reintro", "History"]:
        r.click(tab, exact=True); r.sleep(1.6); r.wait_ready(10)
        S(f"day1_tab_{tab.lower()}", 800)
    r.click("Home", exact=True); r.sleep(1.4)

    # ---- daily check-in day 1, with a symptom event ----
    r.cta(r"check-in|tonight|today")
    r.sleep(1.6); r.wait_ready(10)
    S("daily_checkin_screen", 900)
finally:
    with open("p1b_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
