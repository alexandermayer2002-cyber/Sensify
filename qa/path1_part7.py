from robot import Robot
import re, json

r = Robot("P1h")
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
def yes(n):
    b = r.page.get_by_role("button", name=re.compile(r"^Yes$"))
    b.nth(n).click(timeout=4000); r.sleep(0.6)

def expo_day(idx, symptom=None):
    home()
    r.page.get_by_text(re.compile(r"(Today|Tonight)'s check-in")).first.click(timeout=7000)
    r.sleep(1.8); r.wait_ready(10)
    yes(0)                                   # ate crab
    if symptom:
        yes(0)                               # symptoms yes (ate-Yes now selected; first ^Yes$ is symptoms? verify below)
        r.sleep(0.5)
        r.click(symptom, exact=True, required=False)
        r.sleep(0.4)
        for inten in ["Mild", "Moderate"]:
            if r.click(inten, exact=True, required=False): break
    else:
        r.click("No, felt fine", exact=False, required=False)
    # plan = last ^Yes$
    b = r.page.get_by_role("button", name=re.compile(r"^Yes$"))
    b.nth(b.count()-1).click(timeout=4000); r.sleep(0.4)
    if r.click("Tap to enter", required=False): r.numpad("7")
    r.xclick("your stress", "Low", required=False)
    if r.click("Tap to enter", required=False): r.numpad("6")
    try: r.page.locator("xpath=//*[contains(normalize-space(text()),'in your cycle')]/following::button[1]").first.click(timeout=2500)
    except Exception: pass
    sel = r.page.locator("button").evaluate_all("ns => ns.filter(n => ['rgb(61, 92, 60)','rgb(76, 122, 74)'].includes(getComputedStyle(n).backgroundColor)).map(n=>n.innerText.slice(0,12))")
    print(f"expo{idx} selected:", sel)
    S(f"expo{idx}_filled", 500)
    r.cta(r"Done for today")
    r.sleep(2.5); r.wait_ready(10)
    r.cta(r"Done")
    r.sleep(1.5)

try:
    r.login(EMAIL, PW); r.sleep(2); r.wait_ready()
    resolve_gate()
    # restart the stale crab cycle
    if "Restart the crab" in r.text() or "NEEDS A RESTART" in r.text():
        r.cta(r"restart")
        r.sleep(1.5); r.wait_ready(10)
        S("restart_sheet", 600)
        r.click("Start today", exact=False, required=False) or r.click("today", exact=False, required=False)
        r.sleep(6.0); r.wait_ready(25)
        S("restarted_day1", 600)
    expo_day(1, symptom=None)
    skip(1)
    expo_day(2, symptom="Bloating")
    skip(1)
    expo_day(3, symptom=None)
    skip(11)
    S("post_washout_home", 800)
finally:
    with open("p1h_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
