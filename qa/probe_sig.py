from robot import Robot
r = Robot("sig")
r.login("alexandermayer2002+fable1@gmail.com", "RobotTester!2026")
r.sleep(1.5)
for cta in ["Begin intake", "Begin", "Continue", "Start"]:
    if r.click_btn(cta, required=False): break
r.sleep(1.2)
ins = r.page.locator("input")
print("inputs:", ins.count())
for i in range(ins.count()):
    el = ins.nth(i)
    print(i, "type=", el.get_attribute("type"), "ph=", el.get_attribute("placeholder"), "visible=", el.is_visible())
# try filling by placeholder guess
for ph in ["Your full name", "Full name", "Sarah Chen", "Type your full name"]:
    try:
        r.page.get_by_placeholder(ph).first.fill("Fable One", timeout=1500)
        print("filled via placeholder:", ph); break
    except Exception: pass
else:
    try:
        ins.last.fill("Fable One", timeout=2000); print("filled via last input")
    except Exception as e: print("still unfillable:", str(e)[:100])
r.sleep(0.5)
ok = r.click_btn("I agree", required=False)
print("agree clicked:", ok)
r.sleep(1.5)
print("NOW:", r.text()[:150].replace("\n"," | "))
r.shot("post_agree")
r.close()
