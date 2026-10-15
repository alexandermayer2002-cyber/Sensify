from robot import Robot
import json
r = Robot("ep")
r.login("alexandermayer2002+fable2@gmail.com", "RobotTester!2026"); r.sleep(2); r.wait_ready()
import re
try:
    r.page.get_by_text(re.compile(r"(Today|Tonight)'s check-in|log today")).first.click(timeout=5000)
except Exception:
    r.cta(r"check-in")
r.sleep(1.8); r.wait_ready(10)
t = r.snap("expo_daily", 1600)
r.shot("expo_daily")
json.dump({"t": t}, open("expo_probe.json","w"))
r.close()
