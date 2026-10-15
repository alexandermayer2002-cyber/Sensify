"""PATH 4: clean lab -> declines the protocol -> self-tracking mode. Robot +fable4 (digestive persona 'Jordan')."""
from robot import Robot
from pathkit import *
import re, json

r = Robot("P4")
EMAIL, NAME, PW = "alexandermayer2002+fable4@gmail.com", "Fable Four", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=1400):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))

try:
    signup_or_login(r, EMAIL, NAME, PW)
    if "Start your intake survey" in r.text():
        enter_intake(r, NAME)
        if "What are you hoping" in r.text():
            r.click("Digestive health"); r.click_btn("Continue"); r.sleep(1.2)
        if "Tell us about" in r.text():
            plan = [("Daily",0), ("After specific foods",0), ("A few times a week",1),
                    ("Occasionally",1), ("Often irregular or uncomfortable",0), ("More than 3 years",0)]
            try: r.page.locator("textarea").last.fill("I suspect dairy but have never tested it properly.")
            except Exception: pass
            do_symptoms(r, plan)
        if "In a typical week" in r.text():
            do_baselines(r, ["7","6","5","6"])
        do_freq(r, [("Cow Milk","Daily"), ("Cheese","3–5x/week"), ("Wheat","Daily")])
        do_lifestyle(r, sex="Male")
        S("p4_after_intake", 700)

    if "Upload your lab results" in r.text():
        # clean report: UI dead end (documented in P2) -> rig via robot door
        rig_lab(r, EMAIL, [], {
            "program_phase": "awaiting_decision", "protocol_track": "common",
            "track_decision": "pending", "track_note": "TEST AUTO-APPROVE (rigged clean report)"})
        r.goto(); r.sleep(2.5); r.wait_ready(25)

    if "Got it" in r.text():
        r.click_btn("Got it"); r.sleep(1.0)
    S("p4_decision", 1600)
    r.click_btn("I'd rather just track for now"); r.sleep(2.5); r.wait_ready(20)
    S("p4_post_decline_home", 2400)
    # Tracking-mode daily, if offered
    try:
        r.page.get_by_text(re.compile(r"(Today|Tonight)'s check-in")).first.click(timeout=6000)
        r.sleep(1.8); r.wait_ready(10)
        S("p4_tracking_daily_open", 2200)
        try: r.page.click("xpath=//*[contains(normalize-space(text()),'stay on your plan')]/following::*[normalize-space(text())='Yes'][1]", timeout=4000); r.sleep(0.4)
        except Exception: pass
        if r.click("Tap to enter", required=False): r.numpad("7")
        r.answer("stress", "Low")
        if r.click("Tap to enter", required=False): r.numpad("6")
        r.click("Felt fine", exact=True, required=False)
        try: r.cta(r"Done for today"); r.sleep(2.0); r.wait_ready(12)
        except Exception as e: r.note(f"[P4] daily save: {str(e)[:70]}")
        S("p4_tracking_daily_payoff", 1400)
    except Exception as e:
        r.note(f"[P4] no tracking daily card: {str(e)[:70]}")
    # Tabs in tracking mode
    for tab in ["Reintro", "Verdicts", "History", "Ask Sensify"]:
        try:
            r.page.get_by_text("Home", exact=True).first.click(timeout=3000); r.sleep(1.2)
        except Exception: r.goto(); r.sleep(2.0)
        try:
            r.click(tab, exact=True); r.sleep(1.8); r.wait_ready(12)
            S("p4_tab_" + tab.lower().replace(" ", "_"), 1600)
        except Exception as e:
            r.note(f"[P4] tab {tab}: {str(e)[:60]}")
finally:
    with open("p4_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
