from robot import Robot
r = Robot("probeC")
r.login("alexandermayer2002+fable1@gmail.com", "RobotTester!2026")
r.sleep(1.5)
for cta in ["Begin intake", "Start intake", "Begin", "Continue", "Start"]:
    if r.click_btn(cta, required=False): break
r.sleep(1.2)
print("FULL CONSENT TEXT:\n", r.text()[-700:])
btns = r.page.get_by_role("button")
print("\nBUTTONS:", [btns.nth(i).inner_text()[:40] for i in range(min(btns.count(), 12))])
cbs = r.page.locator("input[type=checkbox]")
print("CHECKBOXES:", cbs.count())
r.shot("consent_full")
r.close()
