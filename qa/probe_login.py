from robot import Robot
r = Robot("probe")
r.goto()
r.click("Sign in")
r.sleep(1.5)
r.shot("login_screen")
print("LOGIN SCREEN TEXT:\n", r.text()[:500])
r.close()
