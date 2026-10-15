"""P1 part 2b: full day-1 daily (with symptom event + memory beat), weekly, to day 57."""
from robot import Robot
import re, json

r = Robot("P1c")
EMAIL, PW = "alexandermayer2002+fable2@gmail.com", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=650):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
def skip(d):
    r.cta(rf"\+{d}d"); r.sleep(3.0); r.goto(); r.sleep(1.8); r.wait_ready(20)
def open_daily():
    for _ in range(4):
        try:
            r.page.get_by_text(re.compile(r"(Today|Tonight)'s check-in")).first.click(timeout=4000)
            r.sleep(1.5); r.wait_ready(10); return True
        except Exception:
            r.sleep(1.5)
    r.find("[P1c] daily CTA never appeared"); S("no_daily_cta"); return False

def do_daily(event=None):
    """event = (chipLabel, timingLabel) or None"""
    r.xclick("sleep", "7–8 hrs", required=False) or r.click("7–8 hrs", exact=True, required=False)
    r.xclick("stress", "Low", required=False) or r.click("Low", exact=True, required=False)
    if r.click("Tap to enter", required=False): r.numpad("6")
    r.xclick("plan", "Yes", required=False) or r.click("Yes", exact=True, required=False)
    if event:
        chip, timing = event
        r.click("Something notable", exact=True, required=False) or r.click("Something mild", exact=True, required=False)
        r.sleep(0.5)
        r.click(chip, exact=True, required=False)
        r.click(timing.capitalize(), exact=True, required=False) or r.click(timing, exact=True, required=False)
    else:
        r.click("Felt fine", exact=True, required=False)
    S("daily_filled")
    r.cta(r"save|complete|done|submit")
    r.sleep(2.5); r.wait_ready(10)
    S("daily_payoff", 800)   # memory beat lives here
    r.cta(r"done")
    r.sleep(1.5); r.wait_ready(10)

try:
    r.login(EMAIL, PW); r.sleep(2); r.wait_ready()
    if open_daily():
        do_daily(event=("Bloating", "after a meal"))
    S("home_after_daily", 700)
finally:
    with open("p1c_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
