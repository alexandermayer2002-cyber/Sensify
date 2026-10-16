"""Deep-dive: Ask Sensify conversations against real earned verdicts (Dairy Limit, Crab Safe)."""
from robot import Robot
from pathkit import signup_or_login
import re, json
r = Robot("ASK")
EMAIL, NAME, PW = "alexandermayer2002+fable1@gmail.com", "Fable One", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=2200):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
def ask(q, tag, wait=28):
    box = r.page.locator("textarea, input[type='text']").last
    box.fill(q); r.sleep(0.4)
    sent = False
    for sel in ["button:has-text('Send')", "button:has-text('→')", "button:has-text('↑')"]:
        try: r.page.locator(sel).last.click(timeout=2500); sent = True; break
        except Exception: pass
    if not sent:
        box.press("Enter")
    r.sleep(wait); r.wait_ready(10)
    S(tag, 2600); r.shot(tag + "_vis")
try:
    signup_or_login(r, EMAIL, NAME, PW)
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    r.click("Ask Sensify", exact=True); r.sleep(2.2); r.wait_ready(12)
    S("ask_landing", 1400)
    ask("Can I eat pizza tonight?", "ask_pizza")
    ask("I had a chicken salad with cheddar for lunch", "ask_logmeal")
    ask("What should I order at an Italian restaurant?", "ask_restaurant")
finally:
    with open("ask_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
