"""P2 finale, take 4: defensive loop - weekly if due, 3 exposure days, washout, survey, verdict."""
from robot import Robot
from pathkit import srv_skip as _srv, signup_or_login
import re, json

r = Robot("P2H")
EMAIL, NAME, PW = "alexandermayer2002+fable1@gmail.com", "Fable One", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=1300):
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
    n = r.page.get_by_role("button", name=re.compile("^4$")).count()
    for i in range(n):
        try: r.page.get_by_role("button", name=re.compile("^4$")).nth(i).click(timeout=2500); r.sleep(0.15)
        except Exception: pass
    r.click("Better", exact=True, required=False)
    r.click("Nothing unusual, a normal week", exact=True, required=False)
    r.click("Fully", exact=True, required=False)
    # reintro weeks may add adherence/cycle questions; answer any leftover Yes rows
    r.cta(r"Submit check-in")
    r.sleep(3.0); r.wait_ready(15)
    S("p2h_weekly_done", 900)
    r.cta(r"Back to dashboard|Done")
    r.sleep(1.5)

def expo_day(idx, symptom=None):
    r.page.get_by_text(re.compile(r"(Today|Tonight)'s check-in")).first.click(timeout=8000)
    r.sleep(1.8); r.wait_ready(10)
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
    r.cta(r"Done for today"); r.sleep(2.5); r.wait_ready(10)
    r.cta(r"Done"); r.sleep(1.5)

try:
    signup_or_login(r, EMAIL, NAME, PW)
    resolve_gate()
    expos = 0
    attempts = 0
    while expos < 3 and attempts < 7:
        attempts += 1
        do_weekly_if_due()
        home()
        if "restart" in r.text().lower():
            r.cta(r"[Rr]estart"); r.sleep(1.6); r.wait_ready(12)
            r.click("Start today", exact=False, required=False)
            r.sleep(5.0); r.wait_ready(25); home()
        if "Today's check-in" in r.text() or "Tonight's check-in" in r.text():
            try:
                expo_day(expos + 1, symptom="Bloating" if expos == 1 else None)
                expos += 1
                print(f"expo {expos} logged")
            except Exception as e:
                r.note(f"[P2H] expo fail: {str(e)[:90]}")
        if expos < 3:
            srv_skip(1)
    S("p2h_after_expos", 1200)
    srv_skip(11)
    S("p2h_verdict_ready_home", 1500)
    r.page.get_by_text("verdict is ready", exact=False).first.click(timeout=8000)
    r.sleep(2.0); r.wait_ready(15)
    S("p2h_survey", 1800)
    r.click("Yes, that's accurate", exact=True, required=False)
    try: r.page.locator("textarea").first.fill("Sounds right. The bloating on the second exposure day was mild and gone by the next morning.")
    except Exception: pass
    r.cta(r"Get my verdict")
    r.sleep(14.0); r.wait_ready(45)
    S("P2_THE_RULING", 2400)
    r.shot("P2_THE_RULING_visual")
finally:
    with open("p2h_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
