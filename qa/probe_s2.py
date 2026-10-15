from robot import Robot
r = Robot("s2")
r.login("alexandermayer2002+fable2@gmail.com", "RobotTester!2026"); r.sleep(2); r.wait_ready()
r.page.get_by_text("Start intake survey", exact=False).last.click(); r.sleep(1.5); r.wait_ready(10)
r.consent("Fable Two"); r.sleep(1.0)
if "What are you hoping" in r.text():
    r.click("Digestive health"); r.click_btn("Continue"); r.sleep(1.2)
el = r.page.get_by_text("Daily", exact=True).nth(0)
print("tag:", el.evaluate("n=>n.tagName"), "bg before:", el.evaluate("n=>getComputedStyle(n).backgroundColor"))
el.click(); r.sleep(0.6)
el2 = r.page.get_by_text("Daily", exact=True).nth(0)
print("bg after:", el2.evaluate("n=>getComputedStyle(n).backgroundColor"))
# count selected buttons overall
sel = r.page.locator("button").evaluate_all("ns => ns.filter(n => getComputedStyle(n).backgroundColor === 'rgb(61, 92, 60)').length")
print("selected count:", sel)
r.close()
