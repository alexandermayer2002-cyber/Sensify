"""SCOUT 2026-11-02 — Lab entry + approval, second pass (first: 10-22, all closed).
Fresh angles only: manual custom-add canonicalization gap, large-panel extraction
truncation, post-approval dashboard back-half. REPORT-ONLY."""
import os, sys, datetime
os.environ["QA_SHOTS"] = "/tmp/claude-0/-home-claude-sensify/4850babc-c04c-5b6c-8f20-468aa37af4de/scratchpad/qa"
from robot import Robot
from pathkit import *

STAMP = datetime.datetime.now().strftime("%y%m%d%H%M")
EMAIL = f"alexandermayer2002+qa{STAMP}l2b@gmail.com"
PW = "RobotTester!2026"
BIGPDF = "/tmp/claude-0/-home-claude-sensify/4850babc-c04c-5b6c-8f20-468aa37af4de/scratchpad/bigpanel.pdf"

r = Robot("L2B")
try:
    print("== account:", EMAIL)
    signup_or_login(r, EMAIL, "QA Robot", PW)
    enter_intake(r, "QA Robot")
    if "What are you hoping" in r.text():
        r.click("Digestive health"); r.click_btn("Continue"); r.sleep(1.2)
    if "Tell us about" in r.text():
        do_symptoms(r, [("Daily",0), ("After specific foods",0), ("A few times a week",1),
                        ("Occasionally",1), ("Often irregular or uncomfortable",0), ("More than 3 years",0)])
    if "In a typical week" in r.text():
        do_baselines(r, ["6","5","5","5"])
    do_freq(r, [("Cow Milk","Daily"), ("Wheat","3–5x/week"), ("Crab","1–2x/week")])
    do_lifestyle(r, sex="Male")
    r.shot("dashboard_pre_lab")

    # ---- into lab entry
    r.cta(r"upload|enter|results"); r.sleep(1.5); r.wait_ready(12)
    r.shot("lab_pdf_tab")
    r.snap("lab-pdf-tab", 600)

    # ---- PROBE 1: large-panel PDF through live extraction (67 reacted foods)
    r.page.locator('input[type=file][accept=".pdf"]').set_input_files(BIGPDF)
    r.sleep(0.8); r.shot("bigpdf_attached")
    r.cta(r"Read my results")
    # extraction takes a while for 3 pages; poll up to 75s
    import time as _t
    end = _t.time() + 75
    while _t.time() < end:
        t = r.text()
        if "extracted from your results" in t or "Something went wrong" in t or "too large" in t:
            break
        r.sleep(1.5)
    r.shot("bigpdf_outcome")
    body = r.text()
    print("== BIGPDF outcome contains 'extracted':", "extracted from your results" in body)
    print("== BIGPDF outcome contains error:", "Something went wrong" in body)
    import re as _re
    m = _re.search(r"(\d+) foods? extracted", body)
    print("== BIGPDF extracted count:", m.group(1) if m else "n/a")
    r.snap("bigpdf-body", 1200)
    print("== console errors so far:", r.console[:6])

    # ---- PROBE 2: manual entry — custom-add path skips canonicalization
    r.click("Manual entry", exact=True, required=False); r.sleep(1.0)
    r.fill_ph("Search foods", "Cows Milk"); r.sleep(0.9)
    r.shot("manual_cows_milk_search")
    t = r.text()
    print("== 'No match' shown for 'Cows Milk':", "No match" in t)
    if "No match" in t:
        r.cta(r"Add .Cows Milk. as a food"); r.sleep(0.8)
        r.shot("manual_cows_milk_added")
        # flag it High to prove it saves as a duplicate vocabulary entry
        r.xclick("Cows Milk", "High", required=False); r.sleep(0.5)
        r.shot("manual_cows_milk_flagged")
        # now show the canonical food exists separately
        r.fill_ph("Search foods", "Cow Milk"); r.sleep(0.9)
        r.shot("manual_cow_milk_canonical")
        r.snap("dup-vocab", 700)
        # clean up: unflag the custom food
        r.fill_ph("Search foods", "Cows Milk"); r.sleep(0.8)
        r.xclick("Cows Milk", "High", required=False); r.sleep(0.5)

    # alias probe: does typing the alias 'milk' surface canonical Cow Milk? (substring yes)
    r.fill_ph("Search foods", "yoghurt"); r.sleep(0.9)
    t = r.text()
    print("== 'yoghurt' (UK spelling) matches Yogurt:", "Yogurt" in t and "No match" not in t, "| No-match card:", "No match" in t)
    r.shot("manual_yoghurt_spelling")

    # ---- real submission: Beef High, Crab Low
    for food, lvl in [("Beef","High"), ("Crab","Low")]:
        r.fill_ph("Search foods", food); r.sleep(0.9)
        r.xclick(food, lvl); r.sleep(0.5)
    r.fill_ph("Search foods", ""); r.sleep(0.6)
    r.shot("manual_flagged_two")
    r.cta(r"Review my entry"); r.sleep(1.2)
    r.shot("manual_readback")
    r.cta(r"Looks right, submit for review"); r.sleep(3.0); r.wait_ready(20)
    r.shot("post_submit")

    # ---- back-half: dashboard after auto-approval
    r.goto(); r.sleep(2.5); r.wait_ready(25)
    r.shot("dashboard_post_approval")
    r.snap("dash-approved", 1400)
    tl = r.text().lower()
    print("== starts tomorrow:", "starts tomorrow" in tl, "| elimination:", "elimination" in tl)
    print("== lab kit card still visible post-approval:", "your lab kit" in tl, "| took my test btn:", "i took my test" in tl)
    print("== avoiding list present:", "avoiding" in tl)
    print("== console errors total:", len(r.console)); [print("  CONSOLE:", c[:160]) for c in r.console[:8]]
finally:
    r.close()
print("SCOUT WALK DONE")
