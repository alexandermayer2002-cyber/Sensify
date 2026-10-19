"""NIGHTLY REGRESSION: condensed fresh-account walks of all four paths.
Writes regress_summary.json and prints one PASS/FAIL line per check.
Accounts are date-stamped (+qa<YYMMDD><path>) so every night starts clean."""
from robot import Robot
from pathkit import *
import re, json, datetime, traceback

STAMP = datetime.datetime.now().strftime("%y%m%d%H%M")
PW = "RobotTester!2026"
RESULTS = []

def check(name, ok, detail=""):
    RESULTS.append({"check": name, "ok": bool(ok), "detail": detail[:160]})
    print(f"{'PASS' if ok else 'FAIL'} {name}" + (f" | {detail[:80]}" if not ok else ""))

def acct(suffix, name):
    return f"alexandermayer2002+qa{STAMP}{suffix}@gmail.com", name

def dig_intake(r, cats):
    enter_intake(r, "QA Robot")
    if "What are you hoping" in r.text():
        for c in cats: r.click(c)
        r.click_btn("Continue"); r.sleep(1.2)
    if "Tell us about" in r.text():
        plan = [("Daily",0), ("After specific foods",0), ("A few times a week",1),
                ("Occasionally",1), ("Often irregular or uncomfortable",0), ("More than 3 years",0)]
        do_symptoms(r, plan)
    if "In a typical week" in r.text():
        do_baselines(r, ["6","5","5","5"])
    do_freq(r, [("Cow Milk","Daily"), ("Wheat","3–5x/week"), ("Crab","1–2x/week")])
    do_lifestyle(r, sex="Male")

def gate(r):
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)

def run_p1():
    EMAIL, NAME = acct("p1", "QA Robot")
    r = Robot("RG1")
    try:
        signup_or_login(r, EMAIL, NAME, PW)
        dig_intake(r, ["Digestive health"])
        check("p1.intake", "Upload your lab results" in r.text() or "ACTION NEEDED" in r.text(), r.text()[:150])
        lab_manual(r)
        for food, lvl in [("Beef","High"), ("Crab","Low")]:
            r.fill_ph("Search foods", food); r.sleep(0.9)
            r.xclick(food, lvl); r.sleep(0.5)
        r.cta(r"Review my entry"); r.sleep(1.2)
        check("p1.readback", "REVIEW BEFORE SUBMITTING" in r.text())
        r.cta(r"Looks right, submit for review"); r.sleep(3.0); r.wait_ready(20)
        r.goto(); r.sleep(2.5); r.wait_ready(25)
        t = r.text()
        check("p1.flagged_autostart", "Starts tomorrow" in t or "ELIMINATION" in t, t[:200])
        srv_skip(EMAIL, 57)
        r.goto(); r.sleep(2.5); r.wait_ready(25); gate(r)
        t = r.text()
        check("p1.unlock_hero", "TESTING OPEN" in t and "OF 28" in t, t[:300])
        check("p1.no_false_complete", "CYCLE COMPLETE" not in t)
        nav_tab(r, "Reintro")
        t = r.text()
        check("p1.single_queue", "YOUR FOODS" in t.upper() and "Start cycle" in t, t[:300])
        check("p1.freq_order_crab_first", t.find("Crab") < t.find("Beef") if ("Crab" in t and "Beef" in t) else False, t[:300])
    except Exception as e:
        check("p1.walk", False, traceback.format_exc()[-150:])
    finally:
        r.close()

def run_p2():
    EMAIL, NAME = acct("p2", "QA Robot")
    r = Robot("RG2")
    try:
        signup_or_login(r, EMAIL, NAME, PW)
        dig_intake(r, ["Digestive health"])
        lab_manual(r)
        ok_toggle = False
        try:
            r.click("My report shows no sensitivities", exact=False); ok_toggle = True
        except Exception: pass
        check("p2.clean_toggle_visible", ok_toggle)
        r.sleep(0.8)
        r.cta(r"Review my entry"); r.sleep(1.2)
        check("p2.clean_readback", "no sensitivities" in r.text().lower())
        r.cta(r"Looks right, submit for review"); r.sleep(3.0); r.wait_ready(20)
        r.goto(); r.sleep(2.5); r.wait_ready(25)
        if "Got it" in r.text():
            check("p2.popup_clean_script", "clean panel" in r.text().lower())
            r.click_btn("Got it"); r.sleep(1.0)
        t = r.text()
        check("p2.no_premature_protocol", "FOODS REMOVED" not in t, t[:200])
        check("p2.decision_present", "Choose your path" in t)
        r.click("Test 2 Foods"); r.sleep(1.0)
        for food, lbl in [("Dairy","Daily"), ("Gluten / wheat","3–5x/week")]:
            r.page.click(f"xpath=//*[normalize-space(text())='{food}']/following::*[normalize-space(text())='{lbl}'][1]", timeout=6000); r.sleep(0.4)
        r.click_btn("Start my protocol"); r.sleep(2.0); r.wait_ready(20)
        check("p2.protocol_started", "Starts tomorrow" in r.text())
    except Exception as e:
        check("p2.walk", False, traceback.format_exc()[-150:])
    finally:
        r.close()

def run_p3():
    EMAIL, NAME = acct("p3", "QA Robot")
    r = Robot("RG3")
    try:
        signup_or_login(r, EMAIL, NAME, PW)
        dig_intake(r, ["Digestive health"])
        lab_manual(r)
        r.fill_ph("Search foods", "Crab"); r.sleep(0.9)
        r.xclick("Crab", "Low"); r.sleep(0.5)
        r.cta(r"Review my entry"); r.sleep(1.2)
        r.cta(r"Looks right, submit for review"); r.sleep(3.0); r.wait_ready(20)
        r.goto(); r.sleep(2.5); r.wait_ready(25)
        if "Got it" in r.text():
            check("p3.popup_flagged_script", "flags are real" in r.text().lower(), r.text()[:300])
            r.click_btn("Got it"); r.sleep(1.0)
        check("p3.union_banner", "also flagged Crab" in r.text())
    except Exception as e:
        check("p3.walk", False, traceback.format_exc()[-150:])
    finally:
        r.close()

def run_p4():
    EMAIL, NAME = acct("p4", "QA Robot")
    r = Robot("RG4")
    try:
        signup_or_login(r, EMAIL, NAME, PW)
        dig_intake(r, ["Digestive health"])
        lab_manual(r)
        r.click("My report shows no sensitivities", exact=False); r.sleep(0.8)
        r.cta(r"Review my entry"); r.sleep(1.2)
        r.cta(r"Looks right, submit for review"); r.sleep(3.0); r.wait_ready(20)
        r.goto(); r.sleep(2.5); r.wait_ready(25)
        if "Got it" in r.text():
            r.click_btn("Got it"); r.sleep(1.0)
        r.click_btn("I'd rather just track for now"); r.sleep(2.5); r.wait_ready(20)
        t = r.text()
        check("p4.tracking_landing", "tracking, not testing" in t)
        nav_tab(r, "Verdicts")
        t = r.text()
        check("p4.verdicts_tracking_state", "Earned by" in t and "RULED" not in t, t[:250])
        try: r.page.get_by_text("Home", exact=True).first.click(timeout=3000); r.sleep(1.4)
        except Exception: r.goto(); r.sleep(2.0)
        nav_tab(r, "Reintro")
        check("p4.reintro_tracking_state", "no cycles are scheduled" in r.text())
    except Exception as e:
        check("p4.walk", False, traceback.format_exc()[-150:])
    finally:
        r.close()

def run_marketing():
    r = Robot("RGM")
    try:
        r.goto(); r.sleep(3.0)
        t = r.snap("mkt", 9000)
        check("mkt.example_labels", "EXAMPLE" in t and "VERIFIED RESULT" not in t)
        check("mkt.console_clean", len(r.console) == 0, str(r.console[:2]))
    except Exception as e:
        check("mkt.walk", False, traceback.format_exc()[-150:])
    finally:
        r.close()

if __name__ == "__main__":
    run_marketing()
    run_p1()
    run_p2()
    run_p3()
    run_p4()
    passed = sum(1 for x in RESULTS if x["ok"])
    summary = {"date": STAMP, "passed": passed, "total": len(RESULTS), "results": RESULTS}
    with open("regress_summary.json", "w") as f:
        json.dump(summary, f, indent=1)
    print(f"\nREGRESSION: {passed}/{len(RESULTS)} checks passed")
