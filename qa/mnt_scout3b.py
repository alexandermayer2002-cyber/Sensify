# Scout 2026-11-09 fix-up: restore fable1 (turn link off + 404 check) and open
# the Maintain tab via the More-menu item (the bare get_by_text hit the hidden
# desktop nav tab at 430px).
import json, re, os, urllib.request, urllib.error, datetime
from robot import Robot
from pathkit import signup_or_login

SITE = "https://singular-starship-09b1f1.netlify.app"
ANCHOR = datetime.date(2026, 10, 1).toordinal()
REINTRO = f"alexandermayer2002+qafleetreintroc{(datetime.date.today().toordinal()-ANCHOR)//28}@gmail.com"
out = {}

def open_maintain(r):
    # bottom-bar More -> menu item
    try:
        r.page.locator(".snfy-bb-btn", has_text="More").first.click(timeout=5000); r.sleep(0.8)
    except Exception:
        r.page.get_by_text("More", exact=True).last.click(timeout=5000); r.sleep(0.8)
    try:
        r.page.locator(".snfy-more-item", has_text="Maintain").first.click(timeout=5000)
    except Exception:
        r.page.get_by_text("Maintain", exact=True).last.click(timeout=5000)
    r.sleep(2.5); r.wait_ready(12)

r = Robot("MNT9E")
try:
    signup_or_login(r, "alexandermayer2002+fable1@gmail.com", "Fable One", "RobotTester!2026")
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    r.wait_ready(15)

    # 1) restore: turn the household link off
    token = None
    try:
        r.page.get_by_text("Household card", exact=False).last.scroll_into_view_if_needed(timeout=8000); r.sleep(0.6)
        val = r.page.locator("input[readonly]").first.input_value(timeout=6000)
        m = re.search(r"household=([0-9a-f]{24})", val or "")
        token = m.group(1) if m else None
        r.page.get_by_text("Turn off link", exact=False).last.click(timeout=6000); r.sleep(2.0)
        out["link_off"] = "Create link" in r.text()
    except Exception as e:
        out["link_off_err"] = str(e)[:150]
    if token:
        try:
            urllib.request.urlopen(SITE + "/.netlify/functions/household-card?token=" + token, timeout=20)
            out["revoked_404"] = False
        except urllib.error.HTTPError as e:
            out["revoked_404"] = (e.code == 404)
    r.shot("household_restored")

    # 2) Maintain preview, properly
    open_maintain(r)
    mt = r.text()
    out["maintain_opened"] = "map is yours" in mt or "Maintain" in mt and "Reserve" in mt
    out["unlimited_copy"] = "unlimited" in mt.lower()
    out["rate_line_count"] = len(re.findall(r"events a week, was", mt))
    out["maphealth_rendered"] = "MAP HEALTH" in mt
    out["drift_label"] = "What drift detection looks like" in mt
    out["maintain_text"] = mt[:1600]
    out["maintain_overflow"] = r.page.evaluate("document.documentElement.scrollWidth")
    r.shot("maintain_top")
    r.page.evaluate("window.scrollTo(0, document.body.scrollHeight*0.55)"); r.sleep(0.9)
    r.shot("maintain_mid")
    r.page.evaluate("window.scrollTo(0, document.body.scrollHeight)"); r.sleep(0.9)
    r.shot("maintain_bottom")
    out["fable_console"] = r.console[:10]
finally:
    r.close()

r2 = Robot("MNT9F")
try:
    signup_or_login(r2, REINTRO, "Fleet Reintro", "RobotTester!2026")
    if "Were you on your plan" in r2.text():
        r2.click("Yes, I stayed on my plan"); r2.sleep(2.0)
    r2.wait_ready(15)
    open_maintain(r2)
    mt = r2.text()
    out["reintro_maintain_opened"] = "map is yours" in mt
    out["reintro_drift_label"] = "What drift detection looks like" in mt
    out["reintro_maphealth_rendered"] = "MAP HEALTH" in mt
    out["reintro_verdictish"] = mt.count("SAFE") + mt.count("LIMIT") + mt.count("AVOID")
    out["reintro_text_tail"] = mt[-500:]
    r2.page.evaluate("window.scrollTo(0, document.body.scrollHeight)"); r2.sleep(0.9)
    r2.shot("reintro_maintain_bottom")
    out["reintro_console"] = r2.console[:10]
finally:
    r2.close()

with open("mnt9e_report.json", "w") as f:
    json.dump(out, f, indent=1, default=str)
print(json.dumps(out, indent=1, default=str)[:3500])
