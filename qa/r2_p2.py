"""RETEST P2 (+fable6): clean report through the REAL UI, decision, day 1, unlock. Verifies fixes 1,2,3,5(partially),8,9,10,12."""
from robot import Robot
from pathkit import *
import re, json

r = Robot("R2P2")
EMAIL, NAME, PW = "alexandermayer2002+fable6@gmail.com", "Fable Six", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=1600):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
def gate():
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)

try:
    signup_or_login(r, EMAIL, NAME, PW)
    if "Start your intake survey" in r.text():
        enter_intake(r, NAME)
        if "What are you hoping" in r.text():
            r.click("Digestive health"); r.click("Energy & clarity"); r.click_btn("Continue"); r.sleep(1.2)
        if "Tell us about" in r.text():
            plan = [("A few times a week",0), ("After specific foods",0), ("Occasionally",0),
                    ("Occasionally",1), ("Inconsistent",0), ("1–3 years",0),
                    ("Often tired",0), ("A few times a week",3), ("Most afternoons",0),
                    ("Okay but not great",0), ("1–3 years",1)]
            do_symptoms(r, plan)
        if "In a typical week" in r.text():
            do_baselines(r, ["6","5","5","4","5","4","5","5"])
        do_freq(r, [("Dairy","Daily"), ("Wheat","3–5x/week")])
        do_lifestyle(r, sex="Male")

    # THE BIG VERIFY: clean report through the real UI
    if "Upload your lab results" in r.text():
        lab_manual(r)
        S("r2_lab_manual", 2400)   # expect: 'My report shows no sensitivities' VISIBLE
        r.click("My report shows no sensitivities", exact=False); r.sleep(0.8)
        S("r2_toggle_on", 1200)
        r.cta(r"Review my entry")  # first press: expect read-back card
        r.sleep(1.2)
        S("r2_readback", 1600)     # expect: 'Your report shows no sensitivities. We will review...'
        r.cta(r"Looks right, submit for review")
        r.sleep(3.0); r.wait_ready(20)
        S("r2_post_submit", 1200)
        r.goto(); r.sleep(2.5); r.wait_ready(25)

    # Pre-decision home: protocol-works section should be ABSENT
    if "Got it" in r.text():
        S("r2_popup", 1800)        # expect clean-panel script (0 flags)
        r.click_btn("Got it"); r.sleep(1.0)
    S("r2_home_decision", 2600)    # expect NO 'HOW YOUR PROTOCOL WORKS', NO '1 FOODS'
    # Suggested badge: this persona is GI -> expect badge on Test 8 Foods
    r.click("Test 2 Foods"); r.sleep(1.0)
    def freq_pick(food, lbl):
        r.page.click(f"xpath=//*[normalize-space(text())='{food}']/following::*[normalize-space(text())='{lbl}'][1]", timeout=6000)
        r.sleep(0.4)
    freq_pick("Dairy", "Daily")
    freq_pick("Gluten / wheat", "3–5x/week")
    r.click_btn("Start my protocol"); r.sleep(2.0); r.wait_ready(20)
    S("r2_post_start", 1800)       # expect protocol-works NOW present, streak 0
    srv_skip(EMAIL, 1)
    r.goto(); r.sleep(2.5); r.wait_ready(25); gate()
    S("r2_day1", 1600)             # expect '1 day streak' at most (not 4)
    # Numeric validation probe: open daily, type 65 hours
    r.page.get_by_text(re.compile(r"(Today|Tonight)'s check-in")).first.click(timeout=8000)
    r.sleep(1.8); r.wait_ready(10)
    try: r.page.click("xpath=//*[contains(normalize-space(text()),'stay on your plan')]/following::*[normalize-space(text())='Yes'][1]", timeout=5000); r.sleep(0.4)
    except Exception: pass
    r.page.get_by_text("Tap to enter", exact=True).nth(0).click(timeout=4000); r.sleep(0.6)
    r.numpad("65"); r.sleep(0.8)
    S("r2_validation_probe", 1600) # expect 'Between 0 and 14 hours.' warning, value not accepted
    # clear and enter sane value, finish the daily
    for ch in ["⌫","←"]:
        r.click(ch, exact=True, required=False)
    r.numpad("7"); r.sleep(0.5)
    r.answer("stress", "Low")
    r.page.get_by_text("Tap to enter", exact=True).first.click(timeout=4000); r.sleep(0.6)
    r.numpad("6"); r.sleep(0.5)
    try: r.cta(r"Done for today"); r.sleep(2.2); r.wait_ready(12)
    except Exception as e: r.note(f"[R2P2] daily save: {str(e)[:80]}")
    S("r2_daily_payoff", 1200)     # expect '1 DAY STREAK'
    r.cta(r"Done"); r.sleep(1.5)
    # Time machine to unlock
    srv_skip(EMAIL, 56)
    r.goto(); r.sleep(2.5); r.wait_ready(25); gate()
    S("r2_unlock_hero", 1800)      # expect 'OF 28' and 'TESTING OPEN', not 'OF 112 CYCLE COMPLETE'
    r.click("Reintro", exact=True); r.sleep(2.0); r.wait_ready(15)
    S("r2_picker", 1800)           # expect 'YOUR FOODS · UNLOCKED', Dairy first
finally:
    with open("r2p2_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
