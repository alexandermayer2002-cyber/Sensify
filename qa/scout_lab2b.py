"""SCOUT 2026-11-02 follow-up — isolate storage-upload failure + happy-path PDF submit."""
import os, datetime
os.environ["QA_SHOTS"] = "/tmp/claude-0/-home-claude-sensify/4850babc-c04c-5b6c-8f20-468aa37af4de/scratchpad/qa"
from robot import Robot
from pathkit import *
import sys

EMAIL = sys.argv[1]
PW = "RobotTester!2026"
SMALL = "/tmp/claude-0/-home-claude-sensify/4850babc-c04c-5b6c-8f20-468aa37af4de/scratchpad/smallpanel.pdf"

r = Robot("L2C")
try:
    # capture response bodies of failed requests
    fails = []
    def on_resp(resp):
        if resp.status >= 400:
            try: body = resp.text()[:300]
            except Exception: body = "<no body>"
            fails.append((resp.status, resp.url[:120], body))
    r.page.on("response", on_resp)

    signup_or_login(r, EMAIL, "QA Robot", PW)
    r.wait_ready(20)
    r.snap("dash-start", 400)
    r.cta(r"upload|enter|results"); r.sleep(1.5); r.wait_ready(12)
    r.page.locator('input[type=file][accept=".pdf"]').set_input_files(SMALL)
    r.sleep(0.8)
    r.cta(r"Read my results")
    import time as _t
    end = _t.time() + 60
    while _t.time() < end:
        t = r.text()
        if "extracted from your results" in t or "Something went wrong" in t:
            break
        r.sleep(1.5)
    r.shot("small_extraction")
    r.snap("small-extract", 900)
    # submit with the file attached -> exercises storage upload
    r.cta(r"Looks right, submit")
    r.sleep(4.0); r.wait_ready(20)
    r.shot("small_submit_outcome")
    body = r.text()
    print("== blocked by upload-failed:", "didn't go through" in body)
    r.goto(); r.sleep(2.5); r.wait_ready(25)
    r.shot("dash_after_pdf_submit")
    r.snap("dash-after", 900)
    print("== HTTP failures:")
    for s, u, b in fails:
        print("  ", s, u, "|", b.replace("\n"," ")[:200])
finally:
    r.close()
print("DONE")
