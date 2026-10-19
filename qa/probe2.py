from robot import Robot
from pathkit import signup_or_login, nav_tab
import re, json
r = Robot("PR2")
try:
    # 1) household mint on fable6
    signup_or_login(r, "alexandermayer2002+fable6@gmail.com", "Fable Six", "RobotTester!2026")
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    t = r.text()
    i = t.upper().find("HOUSEHOLD")
    print("CARD AREA:", t[i:i+260].replace("\n", " | ") if i >= 0 else "NO CARD")
    try:
        btn = r.page.get_by_role("button", name=re.compile(r"Create.*link", re.I))
        print("mint buttons:", btn.count())
        btn.last.evaluate("el => el.click()")
        r.sleep(2.5)
        vals = r.page.evaluate("() => [...document.querySelectorAll('input')].map(i => i.value)")
        print("inputs:", [v[:70] for v in vals if v])
        i2 = r.text().upper().find("HOUSEHOLD")
        print("after:", r.text()[i2:i2+300].replace("\n", " | "))
        print("console:", r.console[:3])
    except Exception as e:
        print("mint err:", str(e)[:150])
    # 2) fable1 reintro tab state
    r.page.goto("about:blank"); r.sleep(0.5)
    signup_or_login(r, "alexandermayer2002+fable1@gmail.com", "Fable One", "RobotTester!2026")
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    nav_tab(r, "Reintro")
    print("REINTRO TAB:", r.text()[:900].replace("\n", " | "))
    print("console:", r.console[:4])
finally:
    r.close()
