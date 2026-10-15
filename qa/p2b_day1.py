"""P2 continuation: open and complete the day-1 daily check-in, then tour the tabs."""
from robot import Robot
from pathkit import *
import re, json

r = Robot("P2B")
EMAIL, NAME, PW = "alexandermayer2002+fable1@gmail.com", "Fable One", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=1400):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))

try:
    signup_or_login(r, EMAIL, NAME, PW)
    r.click("Today's check-in", exact=False); r.sleep(1.8); r.wait_ready(15)
    S("p2_daily_open", 2200)
    # Adaptive fill: on-plan yes, sleep, stress, water, then save
    try: r.page.click("xpath=//*[contains(normalize-space(text()),'stay on your plan')]/following::*[normalize-space(text())='Yes'][1]", timeout=5000); r.sleep(0.4)
    except Exception as e: r.note(f"[P2B] plan yes: {str(e)[:60]}")
    # Sleep and water are "Tap to enter" numpads; stress is a pill row
    try:
        r.page.get_by_text("Tap to enter", exact=True).nth(0).click(timeout=4000); r.sleep(0.6)
        S("p2_daily_numpad", 1200)
        r.numpad("7.5"); r.sleep(0.5)
    except Exception as e: r.note(f"[P2B] sleep numpad: {str(e)[:70]}")
    try: r.answer("stress", "Low")
    except Exception: pass
    try:
        r.page.get_by_text("Tap to enter", exact=True).first.click(timeout=4000); r.sleep(0.6)
        r.numpad("6"); r.sleep(0.5)
    except Exception as e: r.note(f"[P2B] water numpad: {str(e)[:70]}")
    try: r.click("Felt fine", exact=True)
    except Exception: pass
    S("p2_daily_filled", 2200)
    try:
        r.cta(r"Done for today"); r.sleep(2.0); r.wait_ready(15)
    except Exception as e:
        r.note(f"[P2B] save blocked: {str(e)[:80]} | screen: " + r.text()[:300].replace("\n"," | "))
    S("p2_daily_saved", 1800)
    for tab in ["Reintro", "Verdicts", "History"]:
        try:
            r.click(tab, exact=True); r.sleep(1.6); r.wait_ready(12)
            S(f"p2_tab_{tab.lower()}", 1600)
        except Exception as e:
            r.note(f"[P2B] tab {tab}: {str(e)[:60]}")
finally:
    with open("p2b_report.json", "w") as f:
        json.dump({"findings": r.findings, **report}, f, indent=1)
    r.close()
