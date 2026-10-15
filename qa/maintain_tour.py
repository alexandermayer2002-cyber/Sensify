from robot import Robot
from pathkit import signup_or_login
import json
r = Robot("MNT")
try:
    signup_or_login(r, "alexandermayer2002+fable1@gmail.com", "Fable One", "RobotTester!2026")
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    r.click("Maintain", exact=True); r.sleep(2.0); r.wait_ready(12)
    print("MAINTAIN:", r.snap("maintain", 2200).replace("\n", " | "))
    r.shot("maintain_tab")
finally:
    r.close()
