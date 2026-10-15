from robot import Robot
r = Robot("A")
res = r.signup("alexandermayer2002+fable1@gmail.com", "Fable One", "RobotTester!2026")
print("SIGNUP RESULT:", res)
print("SCREEN NOW:", r.text()[:300].replace("\n", " | "))
r.shot("after_signup")
print("CONSOLE ERRORS:", r.console[:4])
r.close()
