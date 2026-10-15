from robot import Robot
r = Robot("ps")
r.login("alexandermayer2002+fable2@gmail.com", "RobotTester!2026"); r.sleep(2.5)
els = r.page.get_by_text("intake", exact=False)
for i in range(min(els.count(), 6)):
    e = els.nth(i)
    print(i, "tag:", e.evaluate("n=>n.tagName"), "| txt:", e.inner_text()[:60].replace("\n"," / "), "| clickable:", e.evaluate("n=>!!(n.onclick||n.closest('button,a,[role=button],[onclick]'))"))
# brute: click the LAST intake-ish element then report
try:
    r.page.get_by_text("Start intake survey", exact=False).last.click(timeout=4000); r.sleep(2.0)
except Exception as ex: print("last-click failed:", str(ex)[:100])
print("AFTER:", r.text()[:150].replace("\n"," | "))
if "Good evening" in r.text():
    # try force-clicking the card container
    try:
        r.page.get_by_text("COMPLETE YOUR SETUP", exact=False).locator("xpath=ancestor::div[2]").click(timeout=3000)
        r.sleep(2.0); print("CARD CLICK ->", r.text()[:120].replace("\n"," | "))
    except Exception as ex: print("card click failed:", str(ex)[:90])
r.shot("setup_probe")
r.close()
