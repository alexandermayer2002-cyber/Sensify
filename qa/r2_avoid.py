"""Deep-dive: the harsh end of the verdict engine. Dairy (eaten daily) reacts on all 3 exposures -> expect Avoid."""
from robot import Robot
from pathkit import srv_skip as _rawskip, signup_or_login
import re, json
r = Robot("CXA")
EMAIL, NAME, PW = "alexandermayer2002+fable6@gmail.com", "Fable Six", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=1500):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
def gate():
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
def srv_skip(d):
    _rawskip(EMAIL, d)
    r.goto(); r.sleep(2.6); r.wait_ready(25); gate()
def home():
    try: r.page.get_by_text("Home", exact=True).first.click(timeout=3000)
    except Exception: r.goto()
    r.sleep(1.8); r.wait_ready(15); gate()

def expo_day(idx):
    home()
    r.page.get_by_text(re.compile(r"(Today|Tonight)'s check-in")).first.click(timeout=8000)
    r.sleep(1.8); r.wait_ready(10)
    r.page.locator("xpath=//*[contains(normalize-space(text()),'Did you eat')]/following::button[normalize-space(.)='Yes'][1]").first.click(timeout=5000); r.sleep(0.8)
    r.page.locator("xpath=//*[contains(normalize-space(text()),'Any symptoms today?')]/following::button[normalize-space(.)='Yes'][1]").first.click(timeout=5000); r.sleep(0.6)
    r.click("Bloating", exact=True, required=False); r.sleep(0.4)
    r.click("Moderate", exact=True, required=False); r.sleep(0.4)
    r.page.locator("xpath=//*[contains(normalize-space(text()),'stay on your plan')]/following::button[normalize-space(.)='Yes'][1]").first.click(timeout=5000); r.sleep(0.4)
    if r.click("Tap to enter", required=False): r.numpad("7")
    r.xclick("your stress", "Low", required=False)
    if r.click("Tap to enter", required=False): r.numpad("6")
    r.cta(r"Done for today"); r.sleep(2.5); r.wait_ready(10)
    r.cta(r"Done"); r.sleep(1.5)

try:
    signup_or_login(r, EMAIL, NAME, PW)
    gate()
    home()
    r.click("Reintro", exact=True); r.sleep(2.0); r.wait_ready(15)
    r.page.get_by_role("button", name=re.compile(r"Start cycle")).first.click(timeout=6000)
    r.sleep(1.8); r.wait_ready(12)
    r.click("Start today", exact=False, required=False)
    r.sleep(5.0); r.wait_ready(25)
    expo_day(1); srv_skip(1)
    expo_day(2); srv_skip(1)
    expo_day(3); srv_skip(11)
    S("cxa_verdict_ready", 1200)
    r.page.get_by_text("verdict is ready", exact=False).first.click(timeout=8000)
    r.sleep(2.0); r.wait_ready(15)
    if "Does that sound right" not in r.text():
        r.cta(r"Get my verdict"); r.sleep(2.0); r.wait_ready(15)
    S("cxa_survey", 1500)
    r.click("Yes, that's accurate", exact=True, required=False)
    try: r.page.locator("textarea").first.fill("It hit every single day I ate it. Same bloating, a few hours after.")
    except Exception: pass
    r.cta(r"Get my verdict")
    r.sleep(15.0); r.wait_ready(50)
    S("CXA_RULING", 2400)
    r.shot("cxa_ruling_visual")
finally:
    with open("cxa_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
