from robot import Robot
from pathkit import signup_or_login, nav_tab
import re
r = Robot("PNAV")
try:
    signup_or_login(r, "alexandermayer2002+fable6@gmail.com", "Fable Six", "RobotTester!2026")
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    btns = r.page.evaluate("() => [...document.querySelectorAll('.snfy-bottombar button')].map(b => ({t: b.innerText.trim(), vis: !!b.offsetParent}))")
    print("BB:", btns)
    ok = nav_tab(r, "Verdicts")
    print("nav returned:", ok)
    print("after:", r.text()[:220].replace("\n", " | "))
    cls = r.page.evaluate("() => [...document.querySelectorAll('.snfy-bb-btn')].map(b => b.className)")
    print("classes:", cls)
finally:
    r.close()
