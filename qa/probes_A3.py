import sys; sys.path.insert(0,'/home/claude/sensify/qa')
from pathkit import *
r=Robot("A"); em="alexandermayer2002+qa2611220253A@gmail.com"; nm="Qa Tester"
def D(t): print("\n#####",t); print(r.text())
signup_or_login(r,em,nm,"RobotTester!2026")
r.click("I took my test",required=False); r.sleep(2); D("lab landing")
r.click("Yes, it's done",required=False); r.sleep(2.5); D("after yes")
r.click("Manual entry",exact=True,required=False); r.sleep(1); D("manual")
r.click_btn("Review my entry",required=False); r.sleep(1); D("after review click")
r.click("My report shows no sensitivities",exact=False,required=False); r.sleep(.8)
r.cta(r"review"); r.sleep(1.5); D("review step")
