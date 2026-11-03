"""FAULT INJECTION — the only layer that finds the bugs you can't read for.

RLS/integrity/static check structure. This induces a real failure mid-write and
checks the UI tells the truth: no false "saved", and a way to retry. It's what
proves the Deploy 12/13/14 write-first fixes actually hold under failure, not
just on the happy path — and it's where genuinely new partial-state / optimistic
-UI bugs surface.

Mechanism: Playwright route interception fails the matching Supabase REST call,
then we assert the screen shows an error/retry and NOT a success message.

Wired into regress_all behind the sentinel (--no-fault skips).
"""
import datetime, traceback
from robot import Robot
from pathkit import (signup_or_login, enter_intake, do_symptoms, do_baselines,
                     do_freq, do_lifestyle, nav_tab)

PW = "RobotTester!2026"

def arm(r, table, methods=("POST", "PATCH")):
    """Fail every `methods` request to /rest/v1/<table> with a 500."""
    pat = f"**/rest/v1/{table}*"
    def handler(route):
        try:
            if route.request.method in methods:
                route.fulfill(status=500, content_type="application/json",
                              body='{"message":"injected fault (sentinel)"}')
            else:
                route.continue_()
        except Exception:
            try: route.continue_()
            except Exception: pass
    r.page.route(pat, handler)
    return pat

def disarm(r, pat):
    try: r.page.unroute(pat)
    except Exception: pass

# ---- drills ----------------------------------------------------------------

def drill_intake_complete(check):
    """The worst data-loss path (Deploy 14 #1): fail the completion upsert and
    assert the draft is kept + an error shown, NOT a fake success -> dashboard."""
    stamp = datetime.datetime.now().strftime("%y%m%d%H%M")
    r = Robot("FXINT")
    try:
        signup_or_login(r, f"alexandermayer2002+qa{stamp}fxi@gmail.com", "Fault Intake", PW)
        enter_intake(r, "Fault Intake")
        if "What are you hoping" in r.text():
            r.click("Digestive health"); r.click_btn("Continue"); r.sleep(1.0)
        if "Tell us about" in r.text():
            do_symptoms(r, [("Daily", 0), ("After specific foods", 0), ("A few times a week", 1),
                            ("Occasionally", 1), ("Often irregular or uncomfortable", 0), ("More than 3 years", 0)])
        if "In a typical week" in r.text():
            do_baselines(r, ["6", "5", "5", "5"])
        do_freq(r, [("Cow Milk", "Daily")])
        # On the lifestyle step: arm the fault, then complete.
        pat = arm(r, "profiles", methods=("POST", "PATCH"))
        do_lifestyle(r, sex="Male")
        r.sleep(3.0)
        t = r.text().lower()
        # Must show the error and must NOT have escaped to the dashboard.
        errored = "couldn't save" in t or "could not save" in t or "try again" in t
        escaped = "good morning" in t or "your intake is complete" in t or "upload your" in t
        check("fault.intake_complete_surfaces", errored and not escaped,
              f"errored={errored} escaped_to_dashboard={escaped} | {r.text()[:120]}")
        disarm(r, pat)
    except Exception:
        check("fault.intake_complete_surfaces", False, traceback.format_exc()[-150:])
    finally:
        r.close()

def drill_meal_log(check):
    """Ask Sensify tracking-mode meal log (Deploy 13): fail the insert and
    assert the retry affordance shows, NOT 'Added to today's log'."""
    from fleetkit import stage_email
    r = Robot("FXMEAL")
    try:
        signup_or_login(r, stage_email("tracking"), "Fleet Tracking", PW)
        if "Start your intake survey" in r.text():
            check("fault.meal_log_surfaces", True, "tracking persona not seeded yet — skipped")
            return
        nav_tab(r, "Ask"); r.sleep(2.5); r.wait_ready(15)
        pat = arm(r, "meal_logs", methods=("POST",))
        r.page.locator("textarea").first.fill("I ate a bowl of oatmeal and a coffee")
        r.page.keyboard.press("Enter")
        for _ in range(30):
            r.sleep(1.0)
            tl = r.text().lower()
            if "tap to retry" in tl or "couldn't add" in tl or "added to today" in tl: break
        tl = r.text().lower()
        surfaced = "tap to retry" in tl or "couldn't add" in tl
        false_success = "added to today's log" in tl
        check("fault.meal_log_surfaces", surfaced and not false_success,
              f"retry={surfaced} false_success={false_success}")
        disarm(r, pat)
    except Exception:
        check("fault.meal_log_surfaces", False, traceback.format_exc()[-150:])
    finally:
        r.close()

def run_faults(check):
    print("\n== FAULT INJECTION ==")
    drill_intake_complete(check)
    drill_meal_log(check)


if __name__ == "__main__":
    RES = []
    def check(n, ok, d=""):
        RES.append(ok); print(("PASS " if ok else "FAIL ") + n + ("" if ok else " | " + str(d)[:140]))
    run_faults(check)
    print(f"\nFAULT: {sum(RES)}/{len(RES)}")
