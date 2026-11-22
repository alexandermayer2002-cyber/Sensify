import sys; sys.path.insert(0,'/home/claude/sensify/qa')
from pathkit import *
r=Robot("A"); em="alexandermayer2002+qa2611220253A@gmail.com"; nm="Qa Tester"
def D(t): print("\n#####",t); print(r.text())
signup_or_login(r,em,nm,"RobotTester!2026"); D("after login")
enter_intake(r,nm)
D("after consent")
import sys
r.click("Digestive health",required=False); r.click_btn("Continue",required=False); r.sleep(1.2)
r.answer_options(["A few times a week","After specific foods","Mostly regular","1–3 years","Inconsistent"]); r.sleep(.5)
r.click_btn("Continue",required=False); r.sleep(1.5); D("step3")
do_baselines(r,["6","5"]); D("step4")
