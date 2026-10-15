from robot import Robot
import re, json

r = Robot("P1f")
EMAIL, PW = "alexandermayer2002+fable2@gmail.com", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=800):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
def home():
    try: r.page.get_by_text("Home", exact=True).first.click(timeout=4000); r.sleep(1.8); r.wait_ready(15)
    except Exception: r.goto(); r.sleep(2.0); r.wait_ready(15)
def skip(d):
    home()
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    if not r.cta(rf"\+{d}d"): return False
    r.sleep(3.5); r.goto(); r.sleep(2.2); r.wait_ready(25)
    if "Were you on your plan" in r.text():
        S(f"awaygate_after_{d}")
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    return True

try:
    r.login(EMAIL, PW); r.sleep(2); r.wait_ready()
    skip(43)
    S("day59_home", 850)
    r.page.get_by_text("Reintro", exact=True).first.click(timeout=5000); r.sleep(2.2); r.wait_ready(15)
    S("reintro_unlocked", 1100)
    # start the first offered cycle
    r.cta(r"start cycle|start →|begin")
    r.sleep(1.8); r.wait_ready(10)
    S("start_choice", 700)
    r.click("today", exact=False, required=False) or r.click("Today", exact=False, required=False)
    r.sleep(1.0)
    r.cta(r"start|begin|confirm")
    r.sleep(8.0); r.wait_ready(30)   # AI briefing generates
    S("briefing", 1100)
finally:
    with open("p1f_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
