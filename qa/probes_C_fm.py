import sys, json
sys.path.insert(0,'/home/claude/sensify/qa')
from robot import Robot
from pathkit import signup_or_login, nav_tab
import fleetkit as fk
r=Robot("CF"); out={}
try:
    signup_or_login(r,"alexandermayer2002+qa2611221300C@gmail.com","Critic C",fk.PW); fk.gate(r)
    nav_tab(r,"Verdicts"); r.sleep(2); r.wait_ready(12); out['fm']=r.text()[:2500]
    nav_tab(r,"More"); r.sleep(1.5); out['more']=r.text()[:1500]
finally:
    json.dump(out,open('/home/claude/sensify/qa/probes_C_fm.json','w'),indent=1); r.close()
