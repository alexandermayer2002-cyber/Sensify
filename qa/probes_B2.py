import re, json, sys
from robot import Robot
from pathkit import signup_or_login
import fleetkit as fk
email = "alexandermayer2002+qa2611220252B@gmail.com"
r = Robot("QB2"); out = {}
try:
    r.login(email, fk.PW); r.sleep(3); r.wait_ready(20); fk.gate(r)
    fk.home(r)
    for txt in ["How's today going", re.compile(r"(Today|Tonight)['’]s (check-in|washout check)", re.I)]:
        try: r.page.get_by_text(txt).first.click(timeout=4000); r.sleep(1.6); break
        except Exception: pass
    r.page.locator("xpath=//*[contains(normalize-space(text()),'stay on your plan')]/following::button[normalize-space(.)='No'][1]").first.click(timeout=4000)
    r.click("Tap to enter", required=False); r.numpad("7")
    r.answer("stress","Low"); r.sleep(.5)
    r.click("Tap to enter", required=False); r.numpad("6")
    r.click("Not sure", exact=True, required=False)
    r.click("Something mild", required=False); r.sleep(1)
    out["form_mild"] = r.text()[-1500:]
    r.cta(r"Done for today"); r.sleep(3); r.wait_ready(10)
    out["payoff"] = r.text()[:2500]
    for p in [r"^Done$", r"Back to Home", r"Done", r"Back"]:
        if r.cta(p): break
    r.sleep(2)
    out["home_after"] = r.text()[:3000]
    out["daily_factors"] = fk.rest(r, "daily_factors?user_id=eq.@UID@&select=*")
    out["compliance"] = fk.rest(r, "daily_compliance?user_id=eq.@UID@&select=*")
    out["streak"] = fk.rest(r, "profiles?id=eq.@UID@&select=streak,current_day")
    # more sheet
    r.page.get_by_role("button", name="More").last.click(); r.sleep(1)
    out["more"] = r.page.locator(".snfy-more-sheet").inner_text()
finally:
    json.dump(out, open("/home/claude/sensify/qa/probes_B2_out.json","w"), indent=1, default=str)
    r.close()
