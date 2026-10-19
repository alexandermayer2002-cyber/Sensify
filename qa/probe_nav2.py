from robot import Robot
from pathkit import signup_or_login
import re, traceback
r = Robot("PN2")
try:
    signup_or_login(r, "alexandermayer2002+fable6@gmail.com", "Fable Six", "RobotTester!2026")
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    try:
        btn = r.page.get_by_role("button", name=re.compile("^Verdicts$"))
        print("count:", btn.count())
        for i in range(btn.count()):
            print(i, "visible:", btn.nth(i).is_visible())
        btn.last.click(timeout=8000)
        r.sleep(2.0); r.wait_ready(12)
        print("after:", r.text()[:150].replace("\n", " | "))
    except Exception:
        traceback.print_exc()
finally:
    r.close()
