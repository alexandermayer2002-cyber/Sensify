from robot import Robot
import re, json

r = Robot("P1e")
EMAIL, PW = "alexandermayer2002+fable2@gmail.com", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=750):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
def skip(d):
    if not r.cta(rf"\+{d}d"): return False
    r.sleep(3.5); r.goto(); r.sleep(2.2); r.wait_ready(25); return True

try:
    r.login(EMAIL, PW); r.sleep(2); r.wait_ready()
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    if "Weekly check-in" in r.text() and "Start" in r.text():
        r.xclick("Weekly check-in", "Start →", required=False); r.sleep(2.0); r.wait_ready(10)
    if "How was your bloating" in r.text():
        vals = ["5", "5", "3", "5"]
        for i in range(4):
            try: r.page.get_by_role("button", name=re.compile(f"^{vals[i]}$")).nth(i).click(timeout=3000); r.sleep(0.2)
            except Exception as e: r.find(f"[P1e] wk scale{i}: {str(e)[:50]}")
        r.click("Better", exact=True, required=False)
        r.click("I had a stressful week", exact=True, required=False)
        r.click("Fully", exact=True, required=False)
        try: r.page.locator("textarea").first.fill("Less bloated than when I started. Stressful week at work though.")
        except Exception: pass
        S("weekly_filled")
        r.cta(r"Submit check-in")
        r.sleep(7.0); r.wait_ready(30)
        S("weekly_insight", 950)
        r.cta(r"dashboard|done|continue|home")
        r.sleep(2.0); r.wait_ready(10)
    skip(43)
    S("day_post43_home", 850)
    try:
        r.page.get_by_text("Reintro", exact=True).first.click(timeout=5000)
        r.sleep(2.2); r.wait_ready(15)
    except Exception as e:
        r.find("[P1e] reintro tab: " + str(e)[:60])
    S("reintro_picker", 1100)
finally:
    with open("p1e_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
