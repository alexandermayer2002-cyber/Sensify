"""Nightly scout 2026-11-05 — area 5, stage 2: the late weekly check-in itself.
+fable6 is in reintro (day ~103, week 14 due, weeks 11-13 skipped): walk the form
at 430px, submit, capture success hero / insight / streak card / History after."""
from robot import Robot
from pathkit import signup_or_login, nav_tab
import re, json

r = Robot("WK5B")
EMAIL, NAME, PW = "alexandermayer2002+fable6@gmail.com", "Fable Six", "RobotTester!2026"
report = {"screens": {}, "shots": []}

def S(tag, n=2000):
    report["screens"][tag] = r.snap(tag, n)
    report["shots"].append(r.shot(tag))

def gate():
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan", required=False); r.sleep(2.0)

try:
    signup_or_login(r, EMAIL, NAME, PW)
    gate(); r.wait_ready(20)
    r.xclick("Weekly check-in", "Start →", required=True); r.sleep(2.2); r.wait_ready(12)
    S("form_top", 1600)
    # answer scales: digestive gets a deliberate 7 ("very comfortable" side)
    body = r.text()
    import re as _re
    # click per-scale: find each question block and click a number under it
    scale_answers = [("bloating", "3"), ("gas or cramping", "4"), ("reflux", "5"),
                     ("digestive comfort", "7"), ("energy levels", "6"),
                     ("mental clarity", "6"), ("afternoon energy", "5"), ("sleep", "5")]
    for q, val in scale_answers:
        try:
            x = f"xpath=//*[contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), {q!r}) and not(.//*[contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'), {q!r})])]/following::button[normalize-space(text())={val!r}][1]"
            r.page.locator(x).first.click(timeout=3500); r.sleep(0.2)
        except Exception as e:
            r.find(f"scale {q}: {str(e)[:60]}")
    r.page.mouse.wheel(0, 1600); r.sleep(0.6)
    S("form_mid", 1600)
    r.click("Better", exact=True, required=False)
    r.click("My sleep was off", exact=True, required=False)
    r.click("Fully", exact=True, required=False)
    try: r.page.locator("textarea").first.fill("Testing gluten this cycle. Sleep was rough midweek.")
    except Exception: pass
    r.page.mouse.wheel(0, 800); r.sleep(0.5)
    S("form_filled", 1400)
    r.cta(r"Submit check-in"); r.sleep(3.0); r.wait_ready(15)
    S("success_early", 1800)
    r.sleep(5.0)   # confetti ends ~3.5s, streak card appears
    S("success_streak", 1800)
    r.sleep(6.0)   # wait out insight generation
    S("success_insight", 2000)
    r.cta(r"Back to dashboard"); r.sleep(2.5); r.wait_ready(15)
    gate()
    S("dash_after", 2400)
    nav_tab(r, "History")
    S("history_after", 2400)
finally:
    with open("wk5b_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:10], **report}, f, indent=1)
    r.close()
