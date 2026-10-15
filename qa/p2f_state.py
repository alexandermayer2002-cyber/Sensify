from robot import Robot
from pathkit import signup_or_login
import json
r = Robot("P2F")
EMAIL, NAME, PW = "alexandermayer2002+fable1@gmail.com", "Fable One", "RobotTester!2026"
try:
    signup_or_login(r, EMAIL, NAME, PW)
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    print(r.snap("home", 1700).replace("\n", " | "))
finally:
    r.close()
