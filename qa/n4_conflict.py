"""CONFLICT SLICE TEST (deploy 7). Two fresh accounts, both run a clean cycle
then dispute it ('felt worse'). A attributes it to the food on exposure days:
expect a one-step shift, the conflicted card, a retest offer, and a clean
retest that replaces the verdict with Safe and retires the offer. B spreads it
across the whole two weeks and blames something else: expect the data verdict
kept, context named, NO conflicted card, NO retest offer."""
from robot import Robot
from pathkit import srv_skip as _rawskip, signup_or_login, nav_tab, enter_intake, do_symptoms, do_baselines, do_freq, do_lifestyle, lab_manual
import re, json, sys, datetime

WHICH = sys.argv[1] if len(sys.argv) > 1 else "A"
# Fresh stamped account every run (the regression suite's pattern): a crashed
# attempt otherwise strands an active cycle and every retry dies at the
# missing Start button.
STAMP = datetime.datetime.now().strftime("%y%m%d%H%M")
EMAIL = f"alexandermayer2002+qan4{STAMP}{WHICH.lower()}@gmail.com"
NAME, PW = f"Conflict {WHICH}", "RobotTester!2026"

r = Robot(f"N4{WHICH}")
report = {"screens": {}, "shots": [], "checks": []}
def S(tag, n=1800):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
def CHECK(name, ok, detail=""):
    report["checks"].append({"check": name, "ok": bool(ok), "detail": str(detail)[:160]})
    print(f"{'PASS' if ok else 'FAIL'} {WHICH}.{name}" + ("" if ok else f" | {str(detail)[:90]}"))
def gate():
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    if "Got it" in r.text():
        try: r.click_btn("Got it"); r.sleep(1.0)
        except Exception: pass
def skip(d):
    _rawskip(EMAIL, d)
    r.goto(); r.sleep(2.6); r.wait_ready(25); gate()
def home():
    try: r.page.get_by_text("Home", exact=True).first.click(timeout=3000)
    except Exception: r.goto()
    r.sleep(1.8); r.wait_ready(15); gate()

def expo_day(idx):
    # The day-57 time machine backfills TODAY as already logged, so on cycle
    # day 1 the home hero hides its check-in CTA (test-rig artifact, not a
    # product state real users reach). The Reintro tab's own check-in button
    # works regardless; fall back to home's CTA when the tab lacks it.
    nav_tab(r, "Reintro"); r.sleep(1.5)
    try:
        r.page.get_by_text(re.compile(r"Log (today|tonight).s check-in|Log washout check")).first.click(timeout=6000)
    except Exception:
        home()
        r.page.get_by_text(re.compile(r"(Today|Tonight)'s check-in")).first.click(timeout=8000)
    r.sleep(1.8); r.wait_ready(10)
    r.page.locator("xpath=//*[contains(normalize-space(text()),'Did you eat')]/following::button[normalize-space(.)='Yes'][1]").first.click(timeout=5000); r.sleep(0.8)
    r.click("No, felt fine", exact=False, required=False)
    r.page.locator("xpath=//*[contains(normalize-space(text()),'stay on your plan')]/following::button[normalize-space(.)='Yes'][1]").first.click(timeout=5000); r.sleep(0.4)
    if r.click("Tap to enter", required=False): r.numpad("7")
    r.xclick("your stress", "Low", required=False)
    if r.click("Tap to enter", required=False): r.numpad("6")
    try: r.page.locator("xpath=//*[contains(normalize-space(text()),'in your cycle')]/following::button[1]").first.click(timeout=2500)
    except Exception: pass
    r.cta(r"Done for today"); r.sleep(2.5); r.wait_ready(10)
    r.cta(r"Done"); r.sleep(1.5)

def clean_cycle(start_label):
    nav_tab(r, "Reintro")
    r.sleep(1.5)
    r.page.get_by_role("button", name=re.compile(start_label)).first.click(timeout=8000)
    r.sleep(1.8); r.wait_ready(12)
    r.click("Start today", exact=False, required=False)
    r.sleep(5.0); r.wait_ready(25)
    expo_day(1); skip(1)
    expo_day(2); skip(1)
    expo_day(3); skip(11)
    try:
        r.page.get_by_text("verdict is ready", exact=False).first.click(timeout=8000)
    except Exception:
        nav_tab(r, "Reintro"); r.sleep(1.5)
        r.page.get_by_text(re.compile(r"Get my verdict")).first.click(timeout=8000)
    r.sleep(2.0); r.wait_ready(15)
    if "Does that sound right" not in r.text():
        r.cta(r"Get my verdict"); r.sleep(2.0); r.wait_ready(15)

try:
    signup_or_login(r, EMAIL, NAME, PW)
    gate()
    # Setup mirrors regress_all's proven p1 walk exactly, resumable at each gate.
    if "Start your intake survey" in r.text() or "Before you begin" in r.text() or "What are you hoping" in r.text():
        enter_intake(r, NAME)
        if "What are you hoping" in r.text():
            r.click("Digestive health"); r.click_btn("Continue"); r.sleep(1.2)
        if "Tell us about" in r.text():
            do_symptoms(r, [("Daily",0), ("After specific foods",0), ("A few times a week",1),
                            ("Occasionally",1), ("Often irregular or uncomfortable",0), ("More than 3 years",0)])
        if "In a typical week" in r.text():
            do_baselines(r, ["6","5","5","5"])
        do_freq(r, [("Cow Milk","Daily"), ("Wheat","3–5x/week"), ("Crab","1–2x/week")])
        do_lifestyle(r, sex="Male")
        r.goto(); r.sleep(2.5); r.wait_ready(25)
    if "Upload your lab results" in r.text() or "ACTION NEEDED" in r.text():
        lab_manual(r)
        r.fill_ph("Search foods", "Cow Milk"); r.sleep(0.9)
        r.xclick("Cow Milk", "High"); r.sleep(0.5)
        r.cta(r"Review my entry"); r.sleep(1.2)
        r.cta(r"Looks right, submit for review"); r.sleep(3.0); r.wait_ready(20)
        r.goto(); r.sleep(2.5); r.wait_ready(25)

    skip(57)
    home()

    # ---- CYCLE 1: clean logs, then the dispute ----
    clean_cycle(r"Start cycle")
    S("survey", 1600)
    r.click("Not quite, it felt worse than that", exact=True); r.sleep(0.8)
    t = r.text()
    CHECK("followup_appears", "Tell us about the gap" in t, t[:200])
    S("followup_open")
    # CTA must wait for the two required answers
    blocked = False
    try:
        blocked = r.page.get_by_role("button", name=re.compile("Get my verdict")).first.is_disabled()
    except Exception: pass
    CHECK("cta_blocked_until_answered", blocked)
    r.click("Bloating", exact=True); r.sleep(0.3)
    if WHICH == "A":
        r.page.locator("input[placeholder*='own words']").first.fill("Felt heavy and off within a couple hours of the milk, every time.")
        r.click("On the days I ate", exact=False); r.sleep(0.3)
        r.click("Yes, I think it was the", exact=False); r.sleep(0.3)
    else:
        r.click("The whole two weeks, evenly", exact=False); r.sleep(0.3)
        r.click("Probably something else going on", exact=False); r.sleep(0.3)
        r.page.locator("textarea").first.fill("Brutal week at work, barely slept. Honestly it was probably that.")
    S("followup_answered")
    r.cta(r"Get my verdict")
    r.sleep(15.0); r.wait_ready(50)
    t = r.snap("RULING", 2600); report["screens"]["RULING"] = t
    r.shot("ruling_visual")
    if WHICH == "A":
        CHECK("shifted_to_limit", "Limit." in t and "Safe." not in t.split("ENTERED")[0], t[:300])
        CHECK("conflicted_card", "RULED ON CONFLICTING EVIDENCE" in t.upper(), t[:300])
    else:
        CHECK("kept_safe", "Safe." in t, t[:300])
        CHECK("no_conflicted_card", "RULED ON CONFLICTING EVIDENCE" not in t.upper())
    r.cta(r"View your verdicts"); r.sleep(2.5); r.wait_ready(15)

    # ---- RETEST OFFER ----
    home()
    nav_tab(r, "Reintro"); r.sleep(1.8)
    t = r.snap("reintro_after", 2200); report["screens"]["reintro_after"] = t
    if WHICH == "A":
        CHECK("retest_offered", "Retest available" in t and "Retest" in t, t[:300])
        r.shot("retest_offer")
        # ---- RETEST CYCLE: clean, accurate -> Safe should replace Limit ----
        clean_cycle(r"Retest")
        S("retest_survey", 1200)
        r.click("Yes, that's accurate", exact=True); r.sleep(0.5)
        r.cta(r"Get my verdict")
        r.sleep(15.0); r.wait_ready(50)
        t = r.snap("RETEST_RULING", 2400); report["screens"]["RETEST_RULING"] = t
        r.shot("retest_ruling_visual")
        CHECK("retest_safe", "Safe." in t, t[:300])
        r.cta(r"View your verdicts"); r.sleep(2.5); r.wait_ready(15)
        t = r.snap("verdicts_after_retest", 2000); report["screens"]["verdicts_after_retest"] = t
        CHECK("verdict_replaced", "Safe" in t and ("Cow Milk" in t), t[:300])
        home(); nav_tab(r, "Reintro"); r.sleep(1.8)
        t = r.text()
        CHECK("retest_offer_gone", "Retest available" not in t, t[:200])
    else:
        CHECK("no_retest_offer", "Retest available" not in t)
finally:
    passed = sum(1 for c in report["checks"] if c["ok"])
    print(f"N4{WHICH}: {passed}/{len(report['checks'])} checks passed")
    with open(f"n4_conflict_{WHICH}.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
