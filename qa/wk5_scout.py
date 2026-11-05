"""Nightly scout 2026-11-05 — area 5 (weekly check-in + insights), stage 1.
Reuses +fable6 (engineered stress-week history, week-1 check-in, now mid-protocol
with gap weeks): dashboard insight card staleness, History states, late check-in."""
from robot import Robot
from pathkit import signup_or_login, nav_tab
import re, json, os

os.environ.setdefault("QA_SHOTS", "")
r = Robot("WK5")
EMAIL, NAME, PW = "alexandermayer2002+fable6@gmail.com", "Fable Six", "RobotTester!2026"
report = {"screens": {}, "shots": []}

def S(tag, n=1800):
    report["screens"][tag] = r.snap(tag, n)
    report["shots"].append(r.shot(tag))

def gate():
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan", required=False); r.sleep(2.0)

try:
    signup_or_login(r, EMAIL, NAME, PW)
    gate()
    r.wait_ready(20)
    S("dash_top", 2600)                       # insight card staleness + weekly slim card
    # scroll to the insight + weekly cards
    r.page.mouse.wheel(0, 1400); r.sleep(1.0)
    S("dash_mid", 2200)
    r.page.mouse.wheel(0, 1400); r.sleep(1.0)
    S("dash_low", 2200)
    # History tab
    nav_tab(r, "History")
    S("history_top", 2600)
    r.page.mouse.wheel(0, 1200); r.sleep(0.8)
    S("history_mid", 2200)
    r.page.mouse.wheel(0, 1400); r.sleep(0.8)
    S("history_low", 2200)
finally:
    with open("wk5_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:10], **report}, f, indent=1)
    r.close()
