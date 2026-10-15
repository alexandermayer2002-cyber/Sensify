from robot import Robot
from pathkit import signup_or_login
r = Robot("P4D")
try:
    signup_or_login(r, "alexandermayer2002+fable4@gmail.com", "Fable Four", "RobotTester!2026")
    btns = r.page.evaluate("() => [...document.querySelectorAll('button')].map(b => b.innerText.trim().slice(0,50))")
    print("BUTTONS:", btns)
finally:
    r.close()
