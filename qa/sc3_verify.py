"""Verify pass: (1) elimearly/elimlate with a long settle — are SuspectBoard /
BaselineSharpness really absent, or was the first grab too early?
(2) fault probe with profiles blocked, 15s settle, to see the final state."""
import json
from robot import Robot
from fleetkit import stage_email, PW

OUT = {}

def login(r, email):
    r.goto(); r.click("Sign in"); r.sleep(1.2)
    r.fill_ph("you@email.com", email)
    r.fill_ph("••••••••", PW)
    r.click_btn("Sign"); r.sleep(2.5); r.wait_ready(20)

for stage in ["elimearly", "elimlate"]:
    r = Robot(f"V3{stage[:6].upper()}")
    try:
        login(r, stage_email(stage))
        r.sleep(8.0)
        t = r.text()
        OUT[stage] = {
            "suspect_board": "SUSPECT BOARD" in t.upper(),
            "baseline_sharpness": "BASELINE SHARPNESS" in t.upper(),
            "len": len(t),
        }
        r.shot("settled")
    except Exception as e:
        OUT[stage] = {"error": str(e)[:200]}
    finally:
        r.close()

r = Robot("V3FAULT")
try:
    login(r, stage_email("elimearly"))
    r.sleep(2.0)
    r.page.route("**/rest/v1/profiles*", lambda route: route.abort())
    r.page.reload(wait_until="domcontentloaded")
    r.sleep(15.0)
    t = r.text()
    r.shot("blocked_15s")
    OUT["fault"] = {
        "still_loading": "Loading your program" in t,
        "intake_cta": "intake survey" in t.lower(),
        "any_error_copy": any(s in t.lower() for s in ["went wrong", "try again", "trouble", "offline", "connection"]),
        "head": t[:500],
    }
except Exception as e:
    OUT["fault"] = {"error": str(e)[:200]}
finally:
    r.close()

print(json.dumps(OUT, indent=1))
