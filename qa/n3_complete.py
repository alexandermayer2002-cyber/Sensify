"""NIGHT 3 item 30: second cycle onward. +fable1 (Dairy already Limit) runs its
final food, Gluten / wheat, to a verdict -> program completion surfaces ->
the tier-1 escalation offer (never before seen live)."""
from robot import Robot
from pathkit import srv_skip as _rawskip, signup_or_login, nav_tab
import re, json

r = Robot("N3C")
EMAIL, NAME, PW = "alexandermayer2002+fable1@gmail.com", "Fable One", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=1700):
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

def do_weekly_if_due():
    home()
    if "Due now" not in r.text() and "Catch up" not in r.text(): return
    r.xclick("Weekly check-in", "Start →", required=False); r.sleep(2.2); r.wait_ready(12)
    if "Submit check-in" not in r.text(): return
    n = r.page.get_by_role("button", name=re.compile("^4$")).count()
    for i in range(n):
        try: r.page.get_by_role("button", name=re.compile("^4$")).nth(i).click(timeout=2500); r.sleep(0.12)
        except Exception: pass
    r.click("About the same", exact=True, required=False)
    r.click("Nothing unusual, a normal week", exact=True, required=False)
    r.click("Fully", exact=True, required=False)
    r.cta(r"Submit check-in"); r.sleep(3.0); r.wait_ready(15)
    for _ in range(30):
        if "Writing your insight" not in r.text(): break
        r.sleep(2.0)
    r.cta(r"Back to dashboard|Done"); r.sleep(2.0); r.wait_ready(12)

def expo_day(idx, symptom=None):
    home()
    r.page.get_by_text(re.compile(r"(Today|Tonight)'s check-in")).first.click(timeout=8000)
    r.sleep(1.8); r.wait_ready(10)
    r.page.locator("xpath=//*[contains(normalize-space(text()),'Did you eat')]/following::button[normalize-space(.)='Yes'][1]").first.click(timeout=5000); r.sleep(0.8)
    if symptom:
        r.page.locator("xpath=//*[contains(normalize-space(text()),'Any symptoms today?')]/following::button[normalize-space(.)='Yes'][1]").first.click(timeout=5000); r.sleep(0.6)
        r.click(symptom, exact=True, required=False); r.sleep(0.5)
        r.click("Mild", exact=True, required=False)
    else:
        r.click("No, felt fine", exact=False, required=False)
    r.page.locator("xpath=//*[contains(normalize-space(text()),'stay on your plan')]/following::button[normalize-space(.)='Yes'][1]").first.click(timeout=5000); r.sleep(0.4)
    if r.click("Tap to enter", required=False): r.numpad("7")
    r.xclick("your stress", "Low", required=False)
    if r.click("Tap to enter", required=False): r.numpad("6")
    r.cta(r"Done for today"); r.sleep(2.5); r.wait_ready(10)
    r.cta(r"Done"); r.sleep(1.5)

try:
    signup_or_login(r, EMAIL, NAME, PW)
    gate()
    do_weekly_if_due()
    home()
    S("n3c_home_between", 1800)      # second-cycle handoff state
    nav_tab(r, "Reintro")
    S("n3c_picker_final_food", 1800) # expect only Gluten / wheat remaining
    r.page.get_by_role("button", name=re.compile(r"Start cycle")).first.click(timeout=6000)
    r.sleep(1.8); r.wait_ready(12)
    r.click("Start today", exact=False, required=False)
    r.sleep(5.0); r.wait_ready(25)
    expo_day(1); skip(1)
    do_weekly_if_due()
    expo_day(2); skip(1)
    expo_day(3); skip(11)
    do_weekly_if_due()
    home()
    r.page.get_by_text("verdict is ready", exact=False).first.click(timeout=8000)
    r.sleep(2.0); r.wait_ready(15)
    if "Does that sound right" not in r.text():
        r.cta(r"Get my verdict"); r.sleep(2.0); r.wait_ready(15)
    r.click("Yes, that's accurate", exact=True, required=False)
    try: r.page.locator("textarea").first.fill("Clean run. No reactions I noticed.")
    except Exception: pass
    r.cta(r"Get my verdict")
    r.sleep(15.0); r.wait_ready(50)
    S("N3C_FINAL_RULING", 2200)
    r.shot("n3c_final_ruling")
    r.cta(r"View your verdicts|Done"); r.sleep(2.5); r.wait_ready(15)
    S("n3c_verdicts_wall", 2200)     # the finished 2-food wall
    nav_tab(r, "Reintro")
    S("n3c_ALL_DONE", 2800)          # expect TierEscalation (tier 1, not escalated)
    r.shot("n3c_escalation")
    # walk the escalation choice WITHOUT accepting (capture both options)
    home()
    S("n3c_home_complete", 2000)
finally:
    with open("n3c_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
