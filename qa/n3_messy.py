"""NIGHT 3 item 28: the deliberately messy robot (+qa-messy).
Flagged lab -> protocol -> slip-up day (plan NO) -> SlipupSurvey ->
three consecutive NOs -> the compliance audit -> how the weekly reads a dirty week."""
from robot import Robot
from pathkit import *
import re, json, traceback

r = Robot("N3M")
EMAIL, NAME, PW = "alexandermayer2002+qamessy@gmail.com", "Mess Tester", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=1800):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
def gate():
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
def skip(d):
    srv_skip(EMAIL, d)
    r.goto(); r.sleep(2.6); r.wait_ready(25); gate()

def daily_no(idx):
    r.page.get_by_text(re.compile(r"(Today|Tonight)'s check-in")).first.click(timeout=8000)
    r.sleep(1.8); r.wait_ready(10)
    r.page.click("xpath=//*[contains(normalize-space(text()),'stay on your plan')]/following::*[normalize-space(text())='No'][1]", timeout=5000); r.sleep(0.6)
    S(f"n3_daily_no{idx}_after_no", 1400)
    try:
        r.page.get_by_text("Tap to enter", exact=True).nth(0).click(timeout=4000); r.sleep(0.5); r.numpad("6"); r.sleep(0.4)
    except Exception: pass
    r.answer("stress", "High")
    try:
        r.page.get_by_text("Tap to enter", exact=True).first.click(timeout=4000); r.sleep(0.5); r.numpad("4"); r.sleep(0.4)
    except Exception: pass
    r.click("Something mild", exact=True, required=False); r.sleep(0.5)
    r.click("Bloating", exact=True, required=False); r.sleep(0.3)
    r.click("Mild", exact=True, required=False)
    try: r.cta(r"Done for today"); r.sleep(2.2); r.wait_ready(10)
    except Exception as e: r.note(f"[N3M] save{idx}: {str(e)[:70]} | " + r.text()[:200].replace(chr(10), " | "))
    S(f"n3_payoff_no{idx}", 1000)
    r.cta(r"Done"); r.sleep(1.5)

try:
    signup_or_login(r, EMAIL, NAME, PW)
    if "Start your intake survey" in r.text():
        enter_intake(r, NAME)
        if "What are you hoping" in r.text():
            r.click("Digestive health"); r.click_btn("Continue"); r.sleep(1.2)
        if "Tell us about" in r.text():
            plan = [("Daily",0), ("After specific foods",0), ("A few times a week",1),
                    ("Occasionally",1), ("Often irregular or uncomfortable",0), ("More than 3 years",0)]
            do_symptoms(r, plan)
        if "In a typical week" in r.text():
            do_baselines(r, ["7","6","5","6"])
        do_freq(r, [("Cow Milk","Daily"), ("Wheat","Daily"), ("Beef","3–5x/week")])
        do_lifestyle(r, sex="Male")
    if "Upload your lab results" in r.text():
        lab_manual(r)
        for food, lvl in [("Cow Milk","High"), ("Wheat","Moderate")]:
            r.fill_ph("Search foods", food); r.sleep(0.9)
            r.xclick(food, lvl); r.sleep(0.5)
        r.cta(r"Review my entry"); r.sleep(1.2)
        r.cta(r"Looks right, submit for review"); r.sleep(3.0); r.wait_ready(20)
        r.goto(); r.sleep(2.5); r.wait_ready(25)
    skip(1)   # day 1
    daily_no(1)
    # slip-up card should now be on home
    r.goto(); r.sleep(2.5); r.wait_ready(20); gate()
    S("n3_home_after_no", 2000)
    if "slip-up" in r.text().lower() or "slipped" in r.text().lower():
        try:
            r.cta(r"[Ss]lip|[Tt]ell us")
            r.sleep(2.0); r.wait_ready(12)
            S("n3_slipup_survey", 2400)
            # walk the slip-up survey adaptively
            r.click("Intentional. I chose to eat it", exact=False, required=False); r.sleep(0.6)
            r.click("Cow Milk", exact=True, required=False); r.sleep(0.4)
            for btn in ["Continue", "Submit", "Done"]:
                if r.click_btn(btn, required=False): r.sleep(1.5)
            S("n3_slipup_done", 1400)
        except Exception as e:
            r.note(f"[N3M] slipup: {str(e)[:80]}")
    skip(1); daily_no(2)
    skip(1); daily_no(3)
    r.goto(); r.sleep(2.5); r.wait_ready(20); gate()
    S("n3_home_after_3no", 2400)   # expect the audit card
    if "audit" in r.text().lower() or "last few days" in r.text().lower():
        try:
            r.cta(r"[Aa]udit|[Ll]et's talk|[Tt]alk about")
            r.sleep(2.0); r.wait_ready(12)
            S("n3_audit_open", 2400)
            # adaptive: answer whatever first options exist
            for lbl in ["I had a stressful week", "Social situations", "Cravings", "Hidden ingredients", "Stress"]:
                if r.click(lbl, exact=False, required=False): break
            r.sleep(0.6)
            for btn in ["Got it, continue →", "Continue", "Got it, submit →", "Submit"]:
                if r.click_btn(btn, required=False): r.sleep(1.5)
            S("n3_audit_step2", 2400)
            for btn in ["Got it, submit →", "Submit", "Done", "Continue"]:
                if r.click_btn(btn, required=False): r.sleep(1.5)
            S("n3_audit_done", 1800)
        except Exception as e:
            r.note(f"[N3M] audit: {str(e)[:80]}")
    # push to the weekly and read how the insight treats a dirty week
    skip(4)
    if "Due now" in r.text() or "Catch up" in r.text():
        r.xclick("Weekly check-in", "Start →", required=False); r.sleep(2.2); r.wait_ready(12)
        n = r.page.get_by_role("button", name=re.compile("^6$")).count()
        for i in range(n):
            try: r.page.get_by_role("button", name=re.compile("^6$")).nth(i).click(timeout=2500); r.sleep(0.15)
            except Exception: pass
        r.click("Worse", exact=True, required=False)
        r.click("I had a stressful week", exact=True, required=False)
        r.click("Some slip-ups", exact=True, required=False)
        try: r.page.locator("textarea").first.fill("Rough week. Ate dairy three times, could not keep it together.")
        except Exception: pass
        r.cta(r"Submit check-in"); r.sleep(3.0); r.wait_ready(15)
        for _ in range(35):
            if "Writing your insight" not in r.text(): break
            r.sleep(2.0)
        S("n3_weekly_dirty_payoff", 1600)
        r.cta(r"Back to dashboard|Done"); r.sleep(2.5); r.wait_ready(15)
        r.goto(); r.sleep(2.5); r.wait_ready(20); gate()
        S("n3_dirty_INSIGHT", 2600)
finally:
    with open("n3m_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
