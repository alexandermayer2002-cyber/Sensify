"""SCOUT 2026-11-02 — verify the 'Submit without the original file' escape hatch completes."""
import os, sys
os.environ["QA_SHOTS"] = "/tmp/claude-0/-home-claude-sensify/4850babc-c04c-5b6c-8f20-468aa37af4de/scratchpad/qa"
from robot import Robot
from pathkit import *

EMAIL = sys.argv[1]
PW = "RobotTester!2026"
SMALL = "/tmp/claude-0/-home-claude-sensify/4850babc-c04c-5b6c-8f20-468aa37af4de/scratchpad/smallpanel.pdf"

r = Robot("L2D")
try:
    signup_or_login(r, EMAIL, "QA Robot", PW)
    r.wait_ready(20)
    r.cta(r"upload|enter|results"); r.sleep(1.5); r.wait_ready(12)
    r.page.locator('input[type=file][accept=".pdf"]').set_input_files(SMALL)
    r.sleep(0.8)
    r.cta(r"Read my results")
    import time as _t
    end = _t.time() + 60
    while _t.time() < end:
        if "extracted from your results" in r.text() or "Something went wrong" in r.text(): break
        r.sleep(1.5)
    r.cta(r"Looks right, submit"); r.sleep(4.0); r.wait_ready(20)
    blocked = "didn't go through" in r.text()
    print("== blocked:", blocked)
    if blocked:
        r.cta(r"Submit without the original file"); r.sleep(4.0); r.wait_ready(25)
    r.shot("after_skipfile_submit")
    r.goto(); r.sleep(2.5); r.wait_ready(25)
    r.shot("dash_final")
    tl = r.text().lower()
    print("== post-skip dashboard: starts tomorrow:", "starts tomorrow" in tl, "| elimination:", "elimination" in tl,
          "| avoiding beef/cow:", ("beef" in tl or "cow milk" in tl))
    print("== still shows upload card:", "upload your lab results to begin" in tl)
    r.snap("dash-final", 1000)
finally:
    r.close()
print("DONE")
