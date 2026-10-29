# Verify + screenshot the elimlate ringCount crash (tonight's persona, day 42)
from robot import Robot
from pathkit import signup_or_login
r = Robot("ELX")
try:
    signup_or_login(r, "alexandermayer2002+qafleetelimlatec2@gmail.com", "Fleet Elimlate", "RobotTester!2026")
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    r.sleep(3.0)
    print("TEXT:", r.text()[:300].replace("\n"," | "))
    print("CONSOLE:", r.console[:3])
    r.shot("elimlate_home_crash")
finally:
    r.close()
