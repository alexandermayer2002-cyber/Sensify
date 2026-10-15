from robot import Robot
import re, json

r = Robot("P1c")
EMAIL, PW = "alexandermayer2002+fable2@gmail.com", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=650):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))

def open_daily():
    for _ in range(4):
        try:
            r.page.get_by_text(re.compile(r"(Today|Tonight)'s check-in")).first.click(timeout=4000)
            r.sleep(1.5); r.wait_ready(10); return True
        except Exception:
            r.sleep(1.5)
    r.find("[P1c] daily CTA never appeared"); S("no_daily_cta"); return False

def do_daily(event=None):
    r.xclick("stay on your plan", "Yes", required=False)
    if r.click("Tap to enter", required=False): r.numpad("7")
    r.xclick("your stress", "Low", required=False)
    if r.click("Tap to enter", required=False): r.numpad("6")
    try:
        r.page.locator("xpath=//*[contains(normalize-space(text()),'in your cycle')]/following::button[1]").first.click(timeout=3000); r.sleep(0.3)
    except Exception: pass
    if event:
        chip, timing = event
        r.click("Something notable", exact=True, required=False); r.sleep(0.5)
        r.click(chip, exact=True, required=False)
        r.click("After a meal", exact=True, required=False)
    else:
        r.click("Felt fine", exact=True, required=False)
    S("daily_filled")
    if not r.cta(r"save|submit|complete|log my|finish"):
        btns = r.page.get_by_role("button")
        names = [btns.nth(i).inner_text()[:28].replace("\n","/") for i in range(btns.count())]
        r.find("[P1c] save-miss; buttons: " + " | ".join(names))
    r.sleep(2.5); r.wait_ready(10)
    S("daily_payoff", 800)
    r.cta(r"done")
    r.sleep(1.5); r.wait_ready(10)

try:
    r.login(EMAIL, PW); r.sleep(2); r.wait_ready()
    if open_daily():
        do_daily(event=("Bloating", "after a meal"))
    S("home_after_daily", 700)
finally:
    with open("p1c_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
