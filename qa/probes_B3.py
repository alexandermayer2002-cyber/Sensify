import json
from robot import Robot
import fleetkit as fk
r = Robot("QB3"); out={}
try:
    r.login("alexandermayer2002+qa2611220252B@gmail.com", fk.PW); r.sleep(3); r.wait_ready(25); fk.gate(r)
    out["home"]=r.text()[:2500]
    r.click("Tell us what happened", required=False); r.sleep(1.5)
    out["slip"]=r.text()[:2000]
    r.click("Skip", required=False)
    r.goto(); r.sleep(3); r.wait_ready(20)
    out["tab_Hist"]=None
    r.click("Reintro", exact=True); r.sleep(1.5); out["reintro"]=r.text()[:600]
    r.click("Home", exact=True); r.sleep(1)
    r.page.get_by_role("button", name="More").last.click(); r.sleep(.8)
    r.click("History", exact=True); r.sleep(2); out["history"]=r.text()[:1200]
finally:
    json.dump(out, open("probes_B3_out.json","w"), indent=1); r.close()
