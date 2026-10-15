from robot import Robot
r = Robot("probe2")
r.goto(); r.click("Sign in"); r.sleep(1.2)
r.click("Continue here", required=False)
r.sleep(1.5)
r.shot("after_continue_here")
print("SCREEN:\n", r.text()[:450])
print("URL:", r.page.url)
r.close()
