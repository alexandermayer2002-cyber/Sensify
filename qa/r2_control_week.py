"""CONNECTIONS DEEP-DIVE part 1 (+fable6): a stress-correlated week.
Symptoms only on high-stress days; sleep/water constant. Then the weekly.
Question: does the insight engine connect symptoms to stress instead of food?"""
from robot import Robot
from pathkit import srv_skip as _rawskip, signup_or_login
import re, json

r = Robot("CXC")
EMAIL, NAME, PW = "alexandermayer2002+fable7@gmail.com", "Fable Seven", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=1500):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
def _srv(email, d):
    _rawskip(email, d)
    r.goto(); r.sleep(2.6); r.wait_ready(25)
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)

def gate():
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
def home():
    try: r.page.get_by_text("Home", exact=True).first.click(timeout=3000)
    except Exception: r.goto()
    r.sleep(1.8); r.wait_ready(15); gate()

def open_daily():
    for sel in [r"or log today", r"or log tonight"]:
        try:
            r.cta(sel); r.sleep(1.8); r.wait_ready(10); return True
        except Exception: pass
    try:
        r.page.get_by_text(re.compile(r"(Today|Tonight)'s check-in")).first.click(timeout=5000)
        r.sleep(1.8); r.wait_ready(10); return True
    except Exception: pass
    try:
        r.page.get_by_text("DAILY CHECK-IN", exact=False).first.click(timeout=5000)
        r.sleep(1.8); r.wait_ready(10); return True
    except Exception as e:
        r.note(f"[CXS] no daily entry: {str(e)[:60]} | " + r.text()[:200].replace("\n", " | "))
        return False

def daily(stress, symptom=False, tag=None):
    home()
    if not open_daily(): return
    try: r.page.click("xpath=//*[contains(normalize-space(text()),'stay on your plan')]/following::*[normalize-space(text())='Yes'][1]", timeout=4000); r.sleep(0.4)
    except Exception: pass
    try:
        r.page.get_by_text("Tap to enter", exact=True).nth(0).click(timeout=4000); r.sleep(0.5)
        r.numpad("7"); r.sleep(0.4)
    except Exception: pass
    r.answer("stress", stress)
    try:
        r.page.get_by_text("Tap to enter", exact=True).first.click(timeout=4000); r.sleep(0.5)
        r.numpad("6"); r.sleep(0.4)
    except Exception: pass
    r.answer("cycle", "Not on it")
    if symptom:
        r.click("Something notable", exact=True, required=False); r.sleep(0.8)
        if tag == "first_symptom": S("cx_symptom_picker", 1800)
        for lbl in ["Bloating", "Gas or cramping", "Stomach discomfort"]:
            if r.click(lbl, exact=True, required=False): break
        r.sleep(0.4)
        for inten in ["Moderate", "Mild"]:
            if r.click(inten, exact=True, required=False): break
        r.sleep(0.4)
    else:
        r.click("Felt fine", exact=True, required=False)
    if tag: S(tag, 900)
    try: r.cta(r"Done for today"); r.sleep(2.2); r.wait_ready(10)
    except Exception as e: r.note(f"[CXS] save: {str(e)[:70]} | " + r.text()[:250].replace("\n"," | "))
    if tag == "first_symptom":
        S("cx_payoff_memory", 1400)   # memory beat should fire: first of its kind
    r.cta(r"Done"); r.sleep(1.4)

try:
    signup_or_login(r, EMAIL, NAME, PW)
    gate()
    # Seven engineered days: symptoms ride ONLY the High-stress days
    daily("High", symptom=True, tag="cx2_day1")
    _srv(EMAIL, 1)
    daily("Low", symptom=False)
    _srv(EMAIL, 1)
    daily("High", symptom=True)
    _srv(EMAIL, 1)
    daily("Low", symptom=False)
    _srv(EMAIL, 1)
    daily("Low", symptom=False)
    _srv(EMAIL, 1)
    daily("High", symptom=True)
    _srv(EMAIL, 1)
    daily("Low", symptom=False)
    # The weekly over this exact week
    home()
    r.xclick("Weekly check-in", "Start →", required=False); r.sleep(2.2); r.wait_ready(12)
    S("cx_weekly_open", 1200)
    n = r.page.get_by_role("button", name=re.compile("^5$")).count()
    for i in range(n):
        try: r.page.get_by_role("button", name=re.compile("^5$")).nth(i).click(timeout=2500); r.sleep(0.15)
        except Exception: pass
    r.click("About the same", exact=True, required=False)
    r.click("Nothing unusual, a normal week", exact=True, required=False)
    r.click("Fully", exact=True, required=False)
    r.cta(r"Submit check-in"); r.sleep(3.0); r.wait_ready(15)
    for _ in range(30):
        if "Writing your insight" not in r.text(): break
        r.sleep(2.0)
    S("cx_weekly_payoff", 1800)
    r.cta(r"Back to dashboard|Done"); r.sleep(2.5); r.wait_ready(15)
    home()
    S("cx_INSIGHT", 2600)            # THE QUESTION: does it connect stress, not food?
    r.shot("cx_insight_visual")
finally:
    with open("cxc_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
