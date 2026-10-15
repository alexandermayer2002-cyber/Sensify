from robot import Robot
r = Robot("dbg")
r.login("alexandermayer2002+fable2@gmail.com", "RobotTester!2026"); r.sleep(3.0)
print("entry has setup card:", "Start your intake survey" in r.text())
loc = r.page.get_by_text("Start intake survey", exact=False)
print("matches:", loc.count())
for i in range(loc.count()):
    print(" ", i, loc.nth(i).evaluate("n=>n.tagName"), "|", loc.nth(i).inner_text()[:50].replace("\n","/"))
try:
    loc.last.click(timeout=5000); print("clicked last ok")
except Exception as e:
    print("click err:", str(e)[:200])
r.sleep(2.0)
print("AFTER:", r.text()[:120].replace("\n"," | "))
r.close()
