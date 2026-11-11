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
        tl = r.text().lower()
        check("p1.intake", "upload your lab results" in tl or "action needed" in tl, r.text()[:150])
        lab_manual(r)
        for food, lvl in [("Beef","High"), ("Crab","Low")]:
            r.fill_ph("Search foods", food); r.sleep(0.9)
            r.xclick(food, lvl); r.sleep(0.5)
        r.cta(r"Review my entry"); r.sleep(1.2)
        check("p1.readback", "review before submitting" in r.text().lower())
        r.cta(r"Looks right, submit for review"); r.sleep(3.0); r.wait_ready(20)
        r.goto(); r.sleep(2.5); r.wait_ready(25)
        tl = r.text().lower()
        check("p1.flagged_autostart", "starts tomorrow" in tl or "elimination" in tl, r.text()[:200])
        srv_skip(EMAIL, 57)
        r.goto(); r.sleep(2.5); r.wait_ready(25); gate(r)
        tl = r.text().lower()
        check("p1.unlock_hero", "reintroduction" in tl and ("pick your next food" in tl or "start cycle" in tl), r.text()[:300])
        check("p1.no_false_complete", "cycle complete" not in tl)
        nav_tab(r, "Reintro")
        t = r.text()
        tl = t.lower()
        check("p1.single_queue", "your foods" in tl and "start cycle" in tl, t[:300])
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
        check("p2.clean_readback", "no sensitivities" in r.text().lower(), r.text()[:200])
        r.cta(r"Looks right, submit for review"); r.sleep(3.0); r.wait_ready(20)
        r.goto(); r.sleep(2.5); r.wait_ready(25)
        if "Got it" in r.text():
            check("p2.popup_clean_script", "clean panel" in r.text().lower())
            r.click_btn("Got it"); r.sleep(1.0)
        t = r.text()
        check("p2.no_premature_protocol", "FOODS REMOVED" not in t, t[:200])
        check("p2.decision_present", "choose your path" in t.lower(), t[:200])
        r.click("Test 2 Foods"); r.sleep(1.0)
        # Deploy 9's tier cards list the food names ("Dairy, Gluten / wheat"), so an
        # anchor on contains() grabs the card and the 'following' pill lands in the
        # wrong food's row. Anchor on the freq-section heading (exact text node).
        for food, lbl in [("Dairy","Daily"), ("Gluten / wheat","3–5x/week")]:
            r.page.locator(f"xpath=//*[normalize-space(text())='{food}']/following::button[normalize-space(.)='{lbl}'][1]").last.click(timeout=6000); r.sleep(0.4)
        r.click_btn("Start my protocol"); r.sleep(2.0); r.wait_ready(20)
        check("p2.protocol_started", "starts tomorrow" in r.text().lower(), r.text()[:200])
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
        check("p3.union_banner", "also flagged crab" in r.text().lower(), r.text()[:200])
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
        check("p4.tracking_landing", "tracking, not testing" in t.lower(), t[:200])
        nav_tab(r, "Verdicts")
        tl = r.text().lower()
        # Re-keyed 2026-11-07 for Deploy 20: pre-protocol tabs (gate:
        # !profile.protocol_start_date) now render locked explainer cards
        # instead of the 2026-10-23 tracking copy ("earned by…/no trials are
        # scheduled"). Tracking-mode users hit the same gate. The check's
        # purpose is unchanged: the tab must explain itself, never sit dead.
        # NOTE (reported 11-07, for Alex): the Reintro explainer promises
        # "your elimination stretch… from day 57" — wrong for a user who
        # DECLINED the protocol; tracking mode deserves its own line.
        check("p4.verdicts_tracking_state", "your verdicts live here" in tl and "safe, limit, or avoid" in tl, r.text()[:250])
        try: r.page.get_by_text("Home", exact=True).first.click(timeout=3000); r.sleep(1.4)
        except Exception: r.goto(); r.sleep(2.0)
        nav_tab(r, "Reintro")
        check("p4.reintro_tracking_state", ("reintroduction unlocks later" in r.text().lower() or "tracking, not testing" in r.text().lower()), r.text()[:200])
    except Exception as e:
        check("p4.walk", False, traceback.format_exc()[-150:])
    finally:
        r.close()

def run_p5():
    """Upload path end-to-end: a tiny PDF through real extraction to a FILED
    submission, with the stored file_path verified over REST. This is the gap
    that hid the storage-RLS breakage (2026-11-02 #1) for 13 nights — the
    suite only ever exercised manual entry."""
    import os as _os
    from fleetkit import rest
    EMAIL, NAME = acct("p5", "QA Robot")
    r = Robot("RG5")
    try:
        pdf = _os.path.join(_os.environ.get("QA_SHOTS", "/tmp"), "rg5_lab.pdf")
        pg = r.ctx.new_page()
        pg.set_content("<h1>IgG Panel</h1><table border=1><tr><td>Cow's Milk</td><td>HIGH</td></tr><tr><td>Wheat</td><td>MODERATE</td></tr><tr><td>Chicken</td><td>No reaction</td></tr></table>")
        pg.pdf(path=pdf); pg.close()
        signup_or_login(r, EMAIL, NAME, PW)
        dig_intake(r, ["Digestive health"])
        r.cta(r"upload|results"); r.sleep(1.5); r.wait_ready(12)
        r.page.set_input_files("input[accept='.pdf']", pdf); r.sleep(0.8)
        r.click_btn("Read my results"); r.sleep(2.0)
        for _ in range(30):
            t = r.text()
            if "extracted from your results" in t or "couldn't be read" in t or "Something went wrong" in t: break
            r.sleep(1.0)
        t = r.text()
        check("p5.upload_extracted", "extracted from your results" in t, t[:200])
        r.cta(r"Looks right, submit for review"); r.sleep(3.0); r.wait_ready(20)
        check("p5.upload_no_error", "didn't go through" not in r.text(), r.text()[:200])
        r.goto(); r.sleep(2.5); r.wait_ready(25)
        row = rest(r, "lab_results?user_id=eq.@UID@&select=file_path&order=submitted_at.desc&limit=1")
        body = row.get("body") or []
        check("p5.file_stored", bool(body and body[0].get("file_path")), str(body)[:120])
    except Exception as e:
        check("p5.walk", False, traceback.format_exc()[-150:])
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
    import sys
    run_marketing()
    run_p1()
    run_p2()
    run_p3()
    run_p4()
    run_p5()
    # DEPTH LAYER (2026-10-23): aged-persona fleet + invariant sweep. Guarded so
    # a fleet crash can never take down the base suite. --no-fleet skips it.
    if "--no-fleet" not in sys.argv:
        try:
            from fleetkit import run_fleet
            run_fleet(check)
        except Exception:
            check("fleet.boot", False, traceback.format_exc()[-150:])
    # SENTINEL (2026-11-03): security (RLS) + data-integrity + static scans.
    # Guarded so a sentinel crash can't take down the suite. --no-sentinel skips.
    if "--no-sentinel" not in sys.argv:
        try:
            from sentinelkit import run_sentinel
            run_sentinel(check)
        except Exception:
            check("sentinel.boot", False, traceback.format_exc()[-150:])
    # FAULT INJECTION (2026-11-03): induce write failures, assert the UI surfaces
    # them (no false success) — proves the write-first fixes hold. --no-fault skips.
    if "--no-fault" not in sys.argv:
        try:
            from faultkit import run_faults
            run_faults(check)
        except Exception:
            check("fault.boot", False, traceback.format_exc()[-150:])
    passed = sum(1 for x in RESULTS if x["ok"])
    summary = {"date": STAMP, "passed": passed, "total": len(RESULTS), "results": RESULTS}
    with open("regress_summary.json", "w") as f:
        json.dump(summary, f, indent=1)
    print(f"\nREGRESSION: {passed}/{len(RESULTS)} checks passed")
