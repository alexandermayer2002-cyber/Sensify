"""P2 finale, take 2: start Dairy cycle properly, clear the due weekly, run 3 exposure days + washout to the verdict."""
from robot import Robot
from pathkit import srv_skip as _srv, signup_or_login
import re, json

r = Robot("P2E")
EMAIL, NAME, PW = "alexandermayer2002+fable1@gmail.com", "Fable One", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=1200):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
def resolve_gate():
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
def srv_skip(d):
    _srv(EMAIL, d)
    r.goto(); r.sleep(2.4); r.wait_ready(25); resolve_gate()
def home():
    try: r.page.get_by_text("Home", exact=True).first.click(timeout=3000)
    except Exception: r.goto()
    r.sleep(1.8); r.wait_ready(15); resolve_gate()

def do_weekly_if_due():
    home()
    if "Due now" not in r.text(): return
    r.xclick("Weekly check-in", "Start →", required=False); r.sleep(2.2); r.wait_ready(12)
    S("p2_weekly_open", 1800)
    # generic: every 0-10 scale gets a mid value by occurrence
    for v in ["4"]:
        n = r.page.get_by_role("button", name=re.compile(f"^{v}$")).count()
        for i in range(n):
            try: r.page.get_by_role("button", name=re.compile(f"^{v}$")).nth(i).click(timeout=2500); r.sleep(0.2)
            except Exception: pass
    for lbl in ["Better", "About the same"]:
        if r.click(lbl, exact=True, required=False): break
    r.click("Nothing unusual, a normal week", exact=True, required=False)
    r.click("Fully", exact=True, required=False)
    try: r.page.locator("textarea").first.fill("Felt steadier this stretch. Fewer afternoon crashes.")
    except Exception: pass
    S("p2_weekly_filled", 800)
    r.cta(r"Submit check-in"); r.sleep(3.0); r.wait_ready(15)
    S("p2_weekly_submitted", 1200)
    r.cta(r"Back to dashboard"); r.sleep(2.0); r.wait_ready(12)

def expo_day(idx, symptom=None):
    home()
    r.page.get_by_text(re.compile(r"(Today|Tonight)'s check-in")).first.click(timeout=8000)
    r.sleep(1.8); r.wait_ready(10)
    if idx == 1: S("p2_expo1_open", 1800)
    r.page.locator("xpath=//*[contains(normalize-space(text()),'Did you eat')]/following::button[normalize-space(.)='Yes'][1]").first.click(timeout=5000); r.sleep(0.8)
    if symptom:
        r.page.locator("xpath=//*[contains(normalize-space(text()),'Any symptoms today?')]/following::button[normalize-space(.)='Yes'][1]").first.click(timeout=5000); r.sleep(0.6)
        r.click(symptom, exact=True, required=False); r.sleep(0.5)
        for inten in ["Mild", "Moderate"]:
            if r.click(inten, exact=True, required=False): break
    else:
        r.click("No, felt fine", exact=False, required=False)
    r.page.locator("xpath=//*[contains(normalize-space(text()),'stay on your plan')]/following::button[normalize-space(.)='Yes'][1]").first.click(timeout=5000); r.sleep(0.4)
    if r.click("Tap to enter", required=False): r.numpad("7")
    r.xclick("your stress", "Low", required=False)
    if r.click("Tap to enter", required=False): r.numpad("6")
    S(f"p2_expo{idx}_filled", 600)
    r.cta(r"Done for today"); r.sleep(2.5); r.wait_ready(10)
    r.cta(r"Done"); r.sleep(1.5)

try:
    signup_or_login(r, EMAIL, NAME, PW)
    resolve_gate()
    do_weekly_if_due()
    # Start Dairy's cycle: first 'Start cycle' button on the Reintro tab
    r.click("Reintro", exact=True); r.sleep(2.0); r.wait_ready(15)
    r.page.get_by_role("button", name=re.compile(r"Start cycle")).first.click(timeout=6000)
    r.sleep(1.8); r.wait_ready(12)
    S("p2_start_sheet", 1800)
    r.click("Start today", exact=False, required=False)
    r.sleep(5.0); r.wait_ready(25)
    S("p2_cycle_day1_home", 1800)
    expo_day(1, symptom=None)
    srv_skip(1)
    expo_day(2, symptom="Bloating")
    srv_skip(1)
    expo_day(3, symptom=None)
    srv_skip(11)
    S("p2_verdict_ready_home", 1600)
    r.page.get_by_text("verdict is ready", exact=False).first.click(timeout=8000)
    r.sleep(2.0); r.wait_ready(15)
    S("p2_survey", 1800)
    r.click("Yes, that's accurate", exact=True, required=False)
    try: r.page.locator("textarea").first.fill("Sounds right. The bloating on day two was mild and gone by the next morning.")
    except Exception: pass
    r.cta(r"Get my verdict")
    r.sleep(14.0); r.wait_ready(45)
    S("P2_THE_RULING", 2200)
    r.shot("P2_THE_RULING_visual")
finally:
    with open("p2e_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
