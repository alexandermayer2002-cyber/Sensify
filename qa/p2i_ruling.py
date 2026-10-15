from robot import Robot
from pathkit import signup_or_login
import re, json
r = Robot("P2I")
EMAIL, NAME, PW = "alexandermayer2002+fable1@gmail.com", "Fable One", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=1600):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
try:
    signup_or_login(r, EMAIL, NAME, PW)
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    r.page.get_by_text("Your Dairy verdict is ready", exact=False).first.click(timeout=8000)
    r.sleep(2.0); r.wait_ready(15)
    if "Does that sound right" not in r.text():
        r.cta(r"Get my verdict"); r.sleep(2.0); r.wait_ready(15)
    S("p2_survey_confirm", 1600)
    r.click("Yes, that's accurate", exact=True)
    try: r.page.locator("textarea").first.fill("Sounds right. The bloating on the second exposure day was mild and gone by the next morning.")
    except Exception: pass
    r.cta(r"Get my verdict")
    r.sleep(15.0); r.wait_ready(50)
    S("P2_THE_RULING", 2600)
    r.shot("P2_RULING_visual")
finally:
    with open("p2i_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
