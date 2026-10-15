"""P2 finale: +fable1 (common 2-food) through elimination via time machine,
then the full Dairy trial to a verdict - first verdict earned on the common track."""
from robot import Robot
from pathkit import srv_skip as _srv, signup_or_login
import re, json

r = Robot("P2D")
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

def expo_day(idx, symptom=None):
    try: r.page.get_by_text("Home", exact=True).first.click(timeout=3000); r.sleep(1.5)
    except Exception: pass
    r.wait_ready(15)
    r.page.get_by_text(re.compile(r"(Today|Tonight)'s check-in")).first.click(timeout=8000)
    r.sleep(1.8); r.wait_ready(10)
    S(f"p2_expo{idx}_open", 1500)
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
    srv_skip(56)                       # day 1 -> day 57: elimination complete
    S("p2_elim_complete_home", 2000)
    # Weekly check-in may block; note state, then head to Reintro to start Dairy
    r.click("Reintro", exact=True); r.sleep(2.0); r.wait_ready(15)
    S("p2_reintro_unlocked", 2200)
    started = False
    for pat in [r"Start the dairy", r"Start dairy", r"Begin", r"Start"]:
        try:
            r.cta(pat); r.sleep(1.6); r.wait_ready(12); started = True; break
        except Exception: pass
    if not started:
        r.note("[P2D] no start CTA found on reintro: " + r.text()[:300].replace("\n"," | "))
    S("p2_trial_start_sheet", 1600)
    r.click("Start today", exact=False, required=False)
    r.sleep(5.0); r.wait_ready(25)
    S("p2_trial_day1_home", 1600)
    expo_day(1, symptom=None)
    srv_skip(1)
    expo_day(2, symptom="Bloating")
    srv_skip(1)
    expo_day(3, symptom=None)
    srv_skip(11)
    S("p2_verdict_ready_home", 1500)
    r.page.get_by_text("verdict is ready", exact=False).first.click(timeout=8000)
    r.sleep(2.0); r.wait_ready(15)
    S("p2_survey", 1600)
    r.click("Yes, that's accurate", exact=True, required=False)
    try: r.page.locator("textarea").first.fill("Sounds right. The bloating on day two was mild and gone by the next morning.")
    except Exception: pass
    r.cta(r"Get my verdict")
    r.sleep(14.0); r.wait_ready(45)
    S("P2_THE_RULING", 2000)
    r.shot("P2_THE_RULING_visual")
finally:
    with open("p2d_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
