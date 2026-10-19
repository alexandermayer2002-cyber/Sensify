"""Fresh 3-NO window on qamessy, then open and walk the audit interior."""
from robot import Robot
from pathkit import srv_skip as _rawskip, signup_or_login
import re, json
r = Robot("N3M2")
EMAIL, NAME, PW = "alexandermayer2002+qamessy@gmail.com", "Mess Tester", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=2000):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
def gate():
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
def skip(d):
    _rawskip(EMAIL, d); r.goto(); r.sleep(2.6); r.wait_ready(25); gate()
def daily_no():
    r.page.get_by_text(re.compile(r"(Today|Tonight)'s check-in")).first.click(timeout=8000)
    r.sleep(1.8); r.wait_ready(10)
    r.page.click("xpath=//*[contains(normalize-space(text()),'stay on your plan')]/following::*[normalize-space(text())='No'][1]", timeout=5000); r.sleep(0.6)
    try:
        r.page.get_by_text("Tap to enter", exact=True).nth(0).click(timeout=4000); r.sleep(0.5); r.numpad("6"); r.sleep(0.4)
    except Exception: pass
    r.answer("stress", "High")
    try:
        r.page.get_by_text("Tap to enter", exact=True).first.click(timeout=4000); r.sleep(0.5); r.numpad("4"); r.sleep(0.4)
    except Exception: pass
    r.click("Felt fine", exact=True, required=False)
    try: r.cta(r"Done for today"); r.sleep(2.2); r.wait_ready(10)
    except Exception: pass
    r.cta(r"Done"); r.sleep(1.4)
try:
    signup_or_login(r, EMAIL, NAME, PW)
    gate()
    for i in range(3):
        try: daily_no()
        except Exception as e: r.note(f"[N3M2] day{i}: {str(e)[:70]}")
        skip(1)
    if "Let's talk" in r.text() or "OFF PLAN" in r.text():
        S("m2_audit_card", 1600)
        r.cta(r"Let's talk"); r.sleep(2.4); r.wait_ready(12)
        S("m2_audit_1", 2400)
        for step in range(7):
            for lbl in ["I had a stressful week", "Cravings", "Social situations", "Hidden ingredients",
                        "Weekends", "Evenings", "Stress", "Moderate", "Yes, I do most of the cooking",
                        "Cost", "Missing favorite foods", "I'm not sure"]:
                if r.click(lbl, exact=False, required=False): r.sleep(0.5); break
            moved = False
            for btn in ["Got it, continue →", "Continue →", "Continue", "Got it, submit →", "Submit →", "Submit", "Send", "Done"]:
                if r.click_btn(btn, required=False): r.sleep(2.0); moved = True; break
            S(f"m2_audit_s{step}", 2000)
            if "24 hours" in r.text() or "guidance" in r.text().lower():
                S("m2_audit_submitted", 2000); break
            if not moved: break
    else:
        S("m2_no_card", 1400)
finally:
    with open("n3m2_report.json", "w") as f:
        json.dump({"findings": r.findings, **report}, f, indent=1)
    r.close()
