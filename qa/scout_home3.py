"""Nightly scout 2026-11-03 — home dashboard (area 3), second pass.
READ-ONLY walk: logs in as existing fleet personas, screenshots dashboard
states at 430px, measures overflow, and runs one fault probe (profiles
fetch blocked client-side). Writes nothing to any account.
"""
import json, datetime
from robot import Robot
from fleetkit import stage_email, PW

REPORT = {}

def widths(r):
    return r.page.evaluate("() => [document.documentElement.scrollWidth, document.body.scrollWidth]")

def login(r, email):
    r.goto(); r.click("Sign in"); r.sleep(1.2)
    r.fill_ph("you@email.com", email)
    r.fill_ph("••••••••", PW)
    r.click_btn("Sign"); r.sleep(2.5); r.wait_ready(20)

def snap_state(r, tag):
    t = r.text()
    REPORT[tag] = {
        "widths": widths(r),
        "console": list(r.console),
        "has_test_panel": "TIME MACHINE" in t,
        "text_head": t[:900],
    }
    r.shot("top")
    # scroll through the page capturing sections
    for i in range(1, 5):
        r.page.evaluate(f"() => window.scrollTo(0, {i} * 800)")
        r.sleep(0.6)
        r.shot(f"scroll{i}")
    r.page.evaluate("() => window.scrollTo(0, 0)")
    r.sleep(0.4)
    return t

stages = ["elimearly", "elimlate", "reintro", "tracking", "audit"]
for stage in stages:
    tag = f"SC3{stage[:6].upper()}"
    r = Robot(tag)
    try:
        login(r, stage_email(stage))
        t = snap_state(r, stage)
        # full page text for offline analysis
        REPORT[stage]["text_full"] = t
        if stage == "elimlate":
            REPORT[stage]["constellation_present"] = ("constellation" in t.lower() or "hangs a star" in t.lower())
        if stage == "reintro":
            # capture hero clock labels
            REPORT[stage]["clock"] = [x for x in t.split("\n") if "map complete" in x.lower() or "verdict" in x.lower()][:6]
    except Exception as e:
        REPORT[stage] = {"error": str(e)[:300]}
    finally:
        r.close()

# --- Fault probe: profiles REST blocked -> what does an established customer see? ---
r = Robot("SC3FAULT")
try:
    login(r, stage_email("elimearly"))
    r.sleep(1.0)
    r.page.route("**/rest/v1/profiles*", lambda route: route.abort())
    r.page.evaluate("() => window.scrollTo(0,0)")
    # force a reload so loadData runs with profiles blocked
    r.page.reload(wait_until="domcontentloaded")
    r.sleep(4.0)
    t = r.text()
    r.shot("profiles_blocked")
    REPORT["fault_profiles_blocked"] = {
        "shows_intake_cta": ("Start your intake survey" in t or "intake survey" in t.lower()),
        "shows_error": ("something went wrong" in t.lower() or "try again" in t.lower() or "connection" in t.lower()),
        "text_head": t[:700],
        "widths": widths(r),
    }
except Exception as e:
    REPORT["fault_profiles_blocked"] = {"error": str(e)[:300]}
finally:
    r.close()

with open("sc3_report.json", "w") as f:
    json.dump(REPORT, f, indent=1)
print("WROTE sc3_report.json")
