from robot import Robot
import json
r = Robot("P1G")
r.login("alexandermayer2002+fable2@gmail.com", "RobotTester!2026"); r.sleep(2); r.wait_ready()
if "Were you on your plan" in r.text():
    r.click("Yes, I stayed on my plan"); r.sleep(2.0)
r.page.get_by_text("Verdicts", exact=True).first.click(timeout=6000); r.sleep(2.4); r.wait_ready(15)
t1 = r.snap("gallery", 1000); r.shot("gallery")
r.click("Crab", exact=True, required=False); r.sleep(1.4)
t2 = r.snap("record", 800); r.shot("record_open")
json.dump({"gallery": t1, "record": t2}, open("p1gallery.json","w"))
r.close()
