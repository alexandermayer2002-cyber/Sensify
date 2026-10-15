"""PATH 2: no sensitivities -> common 2-food. Robot +fable1 (digestive+energy persona 'Sam')."""
from robot import Robot
from pathkit import *
import re, json

r = Robot("P2")
EMAIL, NAME, PW = "alexandermayer2002+fable1@gmail.com", "Fable One", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=900):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))

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
        do_freq(r, [("Dairy","Daily"), ("Wheat","3–5x/week"), ("Egg Yolk","1–2x/week"), ("Beef","1–2x/week")])
        do_lifestyle(r, sex="Male")
        S("p2_after_intake", 600)

    # Lab stage. The real UI dead-end gets documented first, then we rig.
    if "Upload your lab results" in r.text():
        lab_manual(r)
        S("p2_lab_manual_deadend", 2400)  # full text: no 'no sensitivities' affordance anywhere
        try:
            r.cta(r"Submit for review")   # expect: disabled, click times out
            r.note("[P2] zero-food submit CLICKED (unexpected - should be disabled)")
        except Exception:
            r.note("[P2] zero-food submit: disabled as rendered (dead end confirmed live)")
        r.goto(); r.sleep(2.0); r.wait_ready(20)
        # Rig the clean report server/REST-side (UI cannot express it - P1 finding)
        rig_lab(r, EMAIL, [], {
            "program_phase": "awaiting_decision", "protocol_track": "common",
            "track_decision": "pending", "track_note": "TEST AUTO-APPROVE (rigged clean report)"})
        r.goto(); r.sleep(2.5); r.wait_ready(25)

    # One-time intro popup (seen_track_intro false on first visit)
    if "Got it" in r.text():
        S("p2_track_intro_popup", 1200)
        r.click_btn("Got it"); r.sleep(1.0)
    S("p2_home_decision", 1800)
    # Expand the explanation body once for the record
    try:
        r.click("Choose your path"); r.sleep(0.8)
        S("p2_decision_expanded", 1800)
    except Exception as e:
        r.note(f"[P2] expand head: {e}")
    # Pick tier 1 (Test 2 Foods)
    r.click("Test 2 Foods"); r.sleep(1.0)
    S("p2_tier1_freq_card", 1800)
    # Frequency ratings for the tier foods (persona Sam: dairy heavy, wheat regular).
    # Exact-text anchor: the tier card's own food list ("Dairy, Gluten / wheat")
    # defeats a contains() anchor, so target the freq card's exact label node.
    def freq_pick(food, lbl):
        r.page.click(f"xpath=//*[normalize-space(text())='{food}']/following::*[normalize-space(text())='{lbl}'][1]", timeout=6000)
        r.sleep(0.4)
    freq_pick("Dairy", "Daily")
    freq_pick("Gluten / wheat", "3–5x/week")
    S("p2_freq_filled", 1400)
    # Quick probe of the never-note: set Dairy to Never, snap, set back
    try:
        freq_pick("Dairy", "Never")
        S("p2_never_note", 1400)
        freq_pick("Dairy", "Daily")
    except Exception as e:
        r.note(f"[P2] never-note probe: {e}")
    r.click_btn("Start my protocol"); r.sleep(2.0); r.wait_ready(20)
    S("p2_post_start_home", 1800)
    # Server time machine: jump to day 1 of elimination
    srv_skip(EMAIL, 1)
    r.goto(); r.sleep(2.5); r.wait_ready(25)
    if "missed" in r.text().lower():
        S("p2_away_gate", 1200)
        r.cta(r"catch me up|all good|continue|yes")
        r.sleep(1.2)
    S("p2_day1_home", 1800)
    # Open the daily check-in if offered
    try:
        r.cta(r"check in|log today|daily")
        r.sleep(1.5)
        S("p2_day1_daily", 1800)
    except Exception as e:
        r.note(f"[P2] day1 daily open: {e}")
finally:
    with open("p2_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
