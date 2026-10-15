from robot import Robot
import re, json

r = Robot("P1z")
EMAIL, PW = "alexandermayer2002+fable2@gmail.com", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=1000):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))

try:
    r.login(EMAIL, PW); r.sleep(2); r.wait_ready()
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    r.page.get_by_text("Your Crab verdict is ready", exact=False).first.click(timeout=7000)
    r.sleep(2.2); r.wait_ready(15)
    S("survey_readback", 1400)
    # accuracy options: click the this-matches one
    for lbl in ["sounds right", "matches", "accurate", "Yes, that"]:
        if r.click(lbl, exact=False, required=False): break
    r.sleep(0.5)
    try: r.page.locator("textarea").first.fill("That matches my notes. The bloating on day two was mild and passed by evening.")
    except Exception: pass
    S("survey_answered", 600)
    r.cta(r"submit|confirm|ruling|verdict")
    r.sleep(12.0); r.wait_ready(40)     # rules + AI layer
    S("THE_RULING", 1400)
    r.cta(r"done|continue|map|verdicts|home")
    r.sleep(2.0); r.wait_ready(10)
    try: r.page.get_by_text("Verdicts", exact=True).first.click(timeout=5000); r.sleep(2.2); r.wait_ready(15)
    except Exception: pass
    S("gallery", 1100)
    r.click("Crab", exact=True, required=False)
    r.sleep(1.2)
    S("gallery_record_open", 900)
finally:
    with open("p1z_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
