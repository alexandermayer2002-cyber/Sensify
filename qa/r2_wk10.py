from robot import Robot
from pathkit import srv_skip as _rawskip, signup_or_login
import re, json
r = Robot("CXW")
EMAIL, NAME, PW = "alexandermayer2002+fable6@gmail.com", "Fable Six", "RobotTester!2026"
report = {"screens": {}, "shots": []}
def S(tag, n=1800):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
try:
    signup_or_login(r, EMAIL, NAME, PW)
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    if "Due now" not in r.text():
        _rawskip(EMAIL, 1)
        r.goto(); r.sleep(2.6); r.wait_ready(25)
        if "Were you on your plan" in r.text():
            r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    r.xclick("Weekly check-in", "Start →", required=False); r.sleep(2.2); r.wait_ready(12)
    n = r.page.get_by_role("button", name=re.compile("^5$")).count()
    for i in range(n):
        try: r.page.get_by_role("button", name=re.compile("^5$")).nth(i).click(timeout=2500); r.sleep(0.15)
        except Exception: pass
    r.click("About the same", exact=True, required=False)
    r.click("I had a stressful week", exact=True, required=False)
    r.click("Fully", exact=True, required=False)
    try: r.page.locator("textarea").first.fill("Three brutal deadline days this week. Stomach acted up on exactly those days, fine the rest.")
    except Exception: pass
    r.cta(r"Submit check-in"); r.sleep(3.0); r.wait_ready(15)
    for _ in range(35):
        if "Writing your insight" not in r.text(): break
        r.sleep(2.0)
    S("wk10_payoff", 1400)
    r.cta(r"Back to dashboard|Done"); r.sleep(2.5); r.wait_ready(15)
    r.goto(); r.sleep(2.5); r.wait_ready(20)
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    S("wk10_INSIGHT", 2400)
    r.shot("wk10_insight_visual")
finally:
    with open("wk10_report.json", "w") as f:
        json.dump({"findings": r.findings, **report}, f, indent=1)
    r.close()
