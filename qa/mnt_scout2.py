import json, re, os
from robot import Robot
from pathkit import signup_or_login
r = Robot("MNT9B")
out = {}
try:
    signup_or_login(r, "alexandermayer2002+fable1@gmail.com", "Fable One", "RobotTester!2026")
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    r.wait_ready(15)
    # Maintain via More menu, role=button
    r.click_btn("More"); r.sleep(0.8)
    ok = r.click_btn("Maintain"); r.sleep(2.5); r.wait_ready(12)
    mt = r.text()
    out["on_maintain"] = "map is yours" in mt.lower() or "Maintain" in mt and "12.99" in mt
    out["maintain_text"] = mt[:2000]
    r.shot("maintain_top")
    for frac in (0.35, 0.7, 1.0):
        r.page.evaluate(f"window.scrollTo(0, document.body.scrollHeight*{frac})"); r.sleep(0.9)
        r.shot(f"maintain_{int(frac*100)}")
    out["overflow"] = r.page.evaluate("document.documentElement.scrollWidth")
    out["unlimited"] = "unlimited" in mt.lower()
    out["maphealth"] = "MAP HEALTH" in mt
    out["thin_copy"] = "Too little recent data" in mt
    # back Home, turn off household link
    r.click_btn("Home", required=False) or r.click("Home", exact=True, required=False)
    r.sleep(2.0); r.wait_ready(10)
    try:
        el = r.page.get_by_text("Turn off link", exact=False).first
        el.scroll_into_view_if_needed(timeout=8000); r.sleep(0.5)
        el.click(timeout=5000); r.sleep(2.0)
        out["link_off"] = "Create link" in r.text()
    except Exception as e:
        out["link_off"] = f"fail: {str(e)[:100]}"
    r.shot("household_restored")
    out["console"] = r.console[:8]
finally:
    with open("mnt9b_report.json","w") as f: json.dump(out,f,indent=1,default=str)
    print(json.dumps(out,indent=1,default=str)[:2600])
    r.close()
