from robot import Robot
import re, json, subprocess

r = Robot("P1i")
EMAIL, PW = "alexandermayer2002+fable2@gmail.com", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=850):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
def srv_skip(d):
    out = subprocess.run(["curl","-s","-X","POST",
        "https://singular-starship-09b1f1.netlify.app/.netlify/functions/test-skip",
        "-H","Content-Type: application/json",
        "-d", json.dumps({"email": EMAIL, "days": d})], capture_output=True, text=True).stdout
    print(f"skip{d}:", out[:160])
    r.goto(); r.sleep(2.2); r.wait_ready(25)
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)

def expo_day(idx, symptom=None):
    try: r.page.get_by_text("Home", exact=True).first.click(timeout=3000); r.sleep(1.5)
    except Exception: pass
    r.wait_ready(15)
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
    try: r.page.locator("xpath=//*[contains(normalize-space(text()),'in your cycle')]/following::button[1]").first.click(timeout=2500)
    except Exception: pass
    S(f"expoB{idx}_filled", 420)
    r.cta(r"Done for today"); r.sleep(2.5); r.wait_ready(10)
    S(f"expoB{idx}_payoff", 500)
    r.cta(r"Done"); r.sleep(1.5)

try:
    r.login(EMAIL, PW); r.sleep(2); r.wait_ready()
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    expo_day(2, symptom="Bloating")
    srv_skip(1)
    expo_day(3, symptom=None)
    srv_skip(11)
    S("verdict_ready", 700)
finally:
    with open("p1i_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
