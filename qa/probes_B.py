import re, json, datetime, sys
from robot import Robot
from pathkit import signup_or_login, srv_skip
import fleetkit as fk
stamp = datetime.datetime.now().strftime("%y%m%d%H%M")
email = f"alexandermayer2002+qa{stamp}B@gmail.com"
r = Robot("QB"); out = {}
try:
    signup_or_login(r, email, "QA Bee", fk.PW)
    fk.seed(r, "elimearly", email)
    fk.home(r)
    out["home"] = r.text()[:2500]
    # More sheet
    r.click("More", exact=True, required=False); r.sleep(1)
    out["more"] = r.text()[-700:]
    r.click("More", exact=True, required=False); r.sleep(0.5)
    # daily: open, out-of-range sleep
    fk.home(r)
    for txt in ["How's today going", re.compile(r"(Today|Tonight)['’]s (check-in|washout check)", re.I)]:
        try: r.page.get_by_text(txt).first.click(timeout=4000); r.sleep(1.6); break
        except Exception: pass
    out["daily_open"] = r.text()[:2500]
    try:
        r.page.locator("xpath=//*[contains(normalize-space(text()),'stay on your plan')]/following::button[normalize-space(.)='No'][1]").first.click(timeout=4000)
    except Exception as e: out["no_click"] = str(e)[:80]
    if r.click("Tap to enter", required=False): r.numpad("75")
    r.answer("stress", "Low"); r.sleep(0.8)
    out["after75"] = r.text()[:2500]
    out["donebtn_disabled"] = r.page.get_by_text(re.compile("Done for today")).first.is_disabled() if r.page.get_by_text(re.compile("Done for today")).count() else None
    # fix to 7 and finish
    if r.click("Tap to enter", required=False): r.numpad("7")
    r.sleep(0.5)
    if r.click("Tap to enter", required=False): r.numpad("5")
    for lbl in ["Felt fine", "No, felt fine"]:
        if r.click(lbl, exact=False, required=False): break
    r.cta(r"Done for today"); r.sleep(2.5); r.wait_ready(10)
    out["payoff"] = r.text()[:2500]
    r.cta(r"^Done$|Back to Home"); r.sleep(1.5)
    out["home_after"] = r.text()[:3000]
    out["rest_logs"] = fk.rest(r, "daily_logs?user_id=eq.@UID@&select=*")
    out["rest_comp"] = fk.rest(r, "compliance_log?user_id=eq.@UID@&select=*")
    out["rest_prof"] = fk.rest(r, "profiles?id=eq.@UID@&select=*")
    out["email"] = email
finally:
    json.dump(out, open("/home/claude/sensify/qa/probes_B_out.json","w"), indent=1, default=str)
    r.close()
