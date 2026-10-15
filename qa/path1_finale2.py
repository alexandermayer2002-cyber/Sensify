from robot import Robot
import re, json

r = Robot("P1R")
EMAIL, PW = "alexandermayer2002+fable2@gmail.com", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=1100):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))

try:
    r.login(EMAIL, PW); r.sleep(2); r.wait_ready()
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    r.page.get_by_text("Your Crab verdict is ready", exact=False).first.click(timeout=7000)
    r.sleep(2.0); r.wait_ready(15)
    if "Get my verdict" in r.text() and "Does that sound right" not in r.text():
        r.cta(r"Get my verdict"); r.sleep(2.0); r.wait_ready(15)
    S("survey_full", 1200)
    r.click("Yes, that's accurate", exact=True)
    try: r.page.locator("textarea").first.fill("That matches my notes. The day-two bloating was mild and passed by evening.")
    except Exception: pass
    r.cta(r"Get my verdict")
    r.sleep(14.0); r.wait_ready(45)
    S("THE_RULING", 1500)
    r.shot("THE_RULING_visual")
finally:
    with open("p1r_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
