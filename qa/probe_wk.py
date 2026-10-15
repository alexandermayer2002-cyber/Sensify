from robot import Robot
import re
r = Robot("wk")
r.login("alexandermayer2002+fable2@gmail.com", "RobotTester!2026"); r.sleep(2); r.wait_ready()
if "Were you on your plan" in r.text():
    r.click("Yes, I stayed on my plan"); r.sleep(2.0)
r.xclick("Weekly check-in", "Start →", required=False); r.sleep(2.0); r.wait_ready(10)
vals = ["5","5","3","5"]
for i in range(4):
    r.page.get_by_role("button", name=re.compile(f"^{vals[i]}$")).nth(i).click(timeout=3000); r.sleep(0.2)
r.click("Better", exact=True)
sel = r.page.locator("button").evaluate_all("ns => ns.filter(n => getComputedStyle(n).backgroundColor === 'rgb(61, 92, 60)').map(n=>n.innerText.slice(0,14))")
print("selected:", sel)
btn = r.page.get_by_role("button", name=re.compile("Submit check-in"))
print("submit count:", btn.count(), "disabled:", btn.first.is_disabled() if btn.count() else "n/a")
tail = r.text()[-500:]
print("TAIL:", tail.replace("\n"," | "))
r.close()
