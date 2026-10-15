from robot import Robot
import re, json

r = Robot("P1d")
EMAIL, PW = "alexandermayer2002+fable2@gmail.com", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=700):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
def skip(d):
    if not r.cta(rf"\+{d}d"): return False
    r.sleep(3.5); r.goto(); r.sleep(2.0); r.wait_ready(20); return True

try:
    r.login(EMAIL, PW); r.sleep(2); r.wait_ready()
    # resolve the away-gate like a returning human
    if "Were you on your plan" in r.text():
        S("away_gate_modal")
        r.click("Yes, I stayed on my plan"); r.sleep(2.0); r.wait_ready(10)
        S("after_away_resume", 500)
    # weekly check-in via its Start button
    if "Weekly check-in" in r.text():
        r.xclick("Weekly check-in", "Start →", required=False) or r.cta(r"start")
        r.sleep(1.8); r.wait_ready(10)
        S("weekly_form", 900)
finally:
    with open("p1d_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()

# ---- continuation: fill weekly, insight, jump to day 57+, open picker ----
r2 = Robot("P1e")
report2 = {"screens": {}, "shots": []}
def S2(tag, n=750):
    report2["screens"][tag] = r2.snap(tag, n); report2["shots"].append(r2.shot(tag))
def skip2(d):
    if not r2.cta(rf"\+{d}d"): return False
    r2.sleep(3.5); r2.goto(); r2.sleep(2.0); r2.wait_ready(20); return True

try:
    r2.login(EMAIL, PW); r2.sleep(2); r2.wait_ready()
    if "Were you on your plan" in r2.text():
        r2.click("Yes, I stayed on my plan"); r2.sleep(2.0)
    if "Weekly check-in" in r2.text():
        r2.xclick("Weekly check-in", "Start →", required=False)
        r2.sleep(1.8); r2.wait_ready(10)
    if "How was your" in r2.text():
        vals = ["5", "5", "3", "5"]
        n = len(re.findall(r"this week\?", r2.text()))
        for i in range(min(n, 4)):
            try: r2.page.get_by_role("button", name=re.compile(f"^{vals[i]}$")).nth(i).click(timeout=3000); r2.sleep(0.2)
            except Exception as e: r2.find(f"[P1e] wk scale{i}: {str(e)[:50]}")
        r2.click("Better", exact=True, required=False)
        r2.click("I had a stressful week", exact=True, required=False)
        try: r2.page.locator("textarea").first.fill("Definitely less bloated than before I started. Work was stressful this week though.")
        except Exception: pass
        S2("weekly_filled")
        r2.cta(r"submit|complete|finish|save")
        r2.sleep(6.0); r2.wait_ready(25)
        S2("weekly_insight", 900)
        r2.cta(r"done|home|continue")
        r2.sleep(1.5)
    skip2(43)
    S2("day60_home", 800)
    r2.click("Reintro", exact=True); r2.sleep(2.0); r2.wait_ready(15)
    S2("reintro_tab_day60", 1000)
finally:
    with open("p1e_report.json", "w") as f:
        json.dump({"findings": r2.findings, "console": r2.console[:8], **report2}, f, indent=1)
    r2.close()
