"""NIGHT 3 item 29: verdict disagreement branches. +fable7 (8-food, post-unlock)
runs a clean Crab cycle, then answers 'Not quite, it felt worse than that'.
Question: does the AI layer move the provisional verdict one step and say why?"""
from robot import Robot
from pathkit import srv_skip as _rawskip, signup_or_login
import re, json

r = Robot("N3D")
EMAIL, NAME, PW = "alexandermayer2002+fable7@gmail.com", "Fable Seven", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=1600):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
def gate():
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
def skip(d):
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
    r.click("No, felt fine", exact=False, required=False)
    r.page.locator("xpath=//*[contains(normalize-space(text()),'stay on your plan')]/following::button[normalize-space(.)='Yes'][1]").first.click(timeout=5000); r.sleep(0.4)
    if r.click("Tap to enter", required=False): r.numpad("7")
    r.xclick("your stress", "Low", required=False)
    if r.click("Tap to enter", required=False): r.numpad("6")
    try: r.page.locator("xpath=//*[contains(normalize-space(text()),'in your cycle')]/following::button[1]").first.click(timeout=2500)
    except Exception: pass
    r.cta(r"Done for today"); r.sleep(2.5); r.wait_ready(10)
    r.cta(r"Done"); r.sleep(1.5)

try:
    signup_or_login(r, EMAIL, NAME, PW)
    gate()
    home()
    r.click("Reintro", exact=True); r.sleep(2.0); r.wait_ready(15)
    S("n3d_picker", 1600)
    r.page.get_by_role("button", name=re.compile(r"Start cycle")).first.click(timeout=6000)
    r.sleep(1.8); r.wait_ready(12)
    S("n3d_start_sheet", 1600)       # also captures the new scheduler option if present
    r.click("Start today", exact=False, required=False)
    r.sleep(5.0); r.wait_ready(25)
    expo_day(1); skip(1)
    expo_day(2); skip(1)
    expo_day(3); skip(11)
    r.page.get_by_text("verdict is ready", exact=False).first.click(timeout=8000)
    r.sleep(2.0); r.wait_ready(15)
    if "Does that sound right" not in r.text():
        r.cta(r"Get my verdict"); r.sleep(2.0); r.wait_ready(15)
    S("n3d_survey", 1600)
    # THE DISAGREEMENT: clean log, but the user says it felt worse
    r.click("Not quite, it felt worse than that", exact=True)
    r.sleep(0.6)
    S("n3d_disagree_picked", 1200)
    try: r.page.locator("textarea").first.fill("The logs look clean but I felt off every evening after eating it. Low grade, hard to pin down, but real.")
    except Exception: pass
    r.cta(r"Get my verdict")
    r.sleep(15.0); r.wait_ready(50)
    S("N3D_RULING", 2600)
    r.shot("n3d_ruling_visual")
finally:
    with open("n3d_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
