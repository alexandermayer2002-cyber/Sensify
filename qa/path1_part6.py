from robot import Robot
import re, json

r = Robot("P1g")
EMAIL, PW = "alexandermayer2002+fable2@gmail.com", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=800):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
def home():
    try: r.page.get_by_text("Home", exact=True).first.click(timeout=4000)
    except Exception: r.goto()
    r.sleep(1.8); r.wait_ready(15)
def resolve_gate():
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
def skip(d):
    home(); resolve_gate()
    if not r.cta(rf"\+{d}d"): return False
    r.sleep(3.5); r.goto(); r.sleep(2.2); r.wait_ready(25); resolve_gate(); return True

def open_daily():
    home()
    try:
        r.page.get_by_text(re.compile(r"(Today|Tonight)'s check-in")).first.click(timeout=6000)
        r.sleep(1.8); r.wait_ready(10); return True
    except Exception:
        r.find("[P1g] daily open miss: " + r.text()[:120].replace("\n"," | ")); return False

def expo_day(idx, ate=True, symptom=None):
    if not open_daily(): return
    r.xclick("eat crab", "Yes" if ate else "Not today", required=False)
    r.sleep(0.8)
    if symptom:
        S(f"expo{idx}_after_yes", 1100)   # discover symptom follow-up
        for lbl in ["Yes, something", "Any symptoms", symptom]:
            r.click(lbl, exact=False, required=False)
        r.click(symptom, exact=True, required=False)
        for inten in ["Mild", "Moderate"]:
            if r.click(inten, exact=True, required=False): break
    r.xclick("stay on your plan", "Yes", required=False)
    if r.click("Tap to enter", required=False): r.numpad("7")
    r.xclick("your stress", "Low", required=False)
    if r.click("Tap to enter", required=False): r.numpad("6")
    try: r.page.locator("xpath=//*[contains(normalize-space(text()),'in your cycle')]/following::button[1]").first.click(timeout=2500)
    except Exception: pass
    S(f"expo{idx}_filled", 700)
    r.cta(r"Done for today")
    r.sleep(2.5); r.wait_ready(10)
    r.cta(r"done|Done")
    r.sleep(1.5)

try:
    r.login(EMAIL, PW); r.sleep(2); r.wait_ready()
    expo_day(1, ate=True, symptom=None)
    skip(1)
    expo_day(2, ate=True, symptom="Bloating")
    skip(1)
    expo_day(3, ate=True, symptom=None)
    skip(11)
    S("verdict_ready_home", 800)
finally:
    with open("p1g_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
