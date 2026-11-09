# Nightly scout 2026-11-09 — area 9 (second pass): Maintain + household, 430px.
# Verifies the Deploy-14 fixes of the 10-29 report LIVE, then probes tonight's
# new candidates. Read-only on product except: mints then turns off a household
# link on +fable1 (same restore pattern as 10-29). Never clicks "Reserve
# Maintain" (would write to Stripe).
import json, re, os, urllib.request
from robot import Robot
from pathkit import signup_or_login

SITE = "https://singular-starship-09b1f1.netlify.app"
FABLE = "alexandermayer2002+fable1@gmail.com"
# current reintro fleet persona (day ~68) — read-only visit for the
# zero-verdict MapHealth stray-label probe
import datetime
ANCHOR = datetime.date(2026, 10, 1).toordinal()
REINTRO = f"alexandermayer2002+qafleetreintroc{(datetime.date.today().toordinal()-ANCHOR)//28}@gmail.com"

out = {}

def walk_fable():
    r = Robot("MNT9C")
    try:
        signup_or_login(r, FABLE, "Fable One", "RobotTester!2026")
        if "Were you on your plan" in r.text():
            r.click("Yes, I stayed on my plan"); r.sleep(2.0)
        r.wait_ready(15)
        body = r.text()
        out["fable_home_head"] = body[:300]

        # 1) household share card on home, mint link
        try:
            r.page.get_by_text("Household card", exact=False).first.scroll_into_view_if_needed(timeout=8000)
            r.sleep(0.6)
        except Exception as e:
            r.find(f"household card not on home: {str(e)[:80]}")
        r.shot("household_card_home")
        r.click_btn("Create link", required=False)
        r.sleep(2.2)
        token = None
        try:
            val = r.page.locator("input[readonly]").first.input_value(timeout=6000)
            m = re.search(r"household=([0-9a-f]{24})", val or "")
            token = m.group(1) if m else None
        except Exception as e:
            r.find(f"no link input: {str(e)[:80]}")
        out["token_minted"] = bool(token)

        # 2) public card JSON + page — fix #1 verification (Limit stays listed, labeled)
        if token:
            req = urllib.request.Request(SITE + "/.netlify/functions/household-card?token=" + token)
            cj = json.loads(urllib.request.urlopen(req, timeout=20).read().decode())
            out["card_json"] = cj
            pub = r.browser.new_context(viewport={"width": 430, "height": 932})
            pp = pub.new_page()
            pp.goto(SITE + "/?household=" + token, wait_until="domcontentloaded")
            pp.wait_for_timeout(3500)
            ptxt = pp.inner_text("body")
            out["card_page_text"] = ptxt[:700]
            out["card_shows_limit_label"] = ("SMALL AMOUNTS ONLY" in ptxt) or ("AVOID" in ptxt)
            out["card_overflow"] = pp.evaluate("document.documentElement.scrollWidth")
            shots = os.environ.get("QA_SHOTS", "/tmp")
            pp.screenshot(path=os.path.join(shots, "MNT9C_public_card.png"))
            print("shot: MNT9C_public_card.png")
            pub.close()

        # 3) Maintain tab (preview) — rate-line-once, unlimited copy, overflow
        try:
            r.page.get_by_text("More", exact=True).first.click(timeout=4000); r.sleep(0.8)
        except Exception:
            pass
        r.click("Maintain", exact=True, required=False)
        r.sleep(2.5); r.wait_ready(12)
        mt = r.text()
        out["maintain_text_head"] = mt[:1200]
        out["maintain_overflow"] = r.page.evaluate("document.documentElement.scrollWidth")
        out["unlimited_copy"] = "unlimited" in mt.lower()
        out["rate_line_count"] = len(re.findall(r"events a week, was", mt))
        out["maphealth_rendered"] = "MAP HEALTH" in mt
        r.shot("maintain_top")
        for frac in (0.5, 1.0):
            r.page.evaluate(f"window.scrollTo(0, document.body.scrollHeight*{frac})"); r.sleep(0.9)
            r.shot(f"maintain_{int(frac*100)}")

        # 4) restore: turn link off, then confirm the public card 404s
        try:
            r.page.get_by_text("Home", exact=True).first.click(timeout=4000); r.sleep(1.8)
            r.page.get_by_text("Turn off link", exact=False).first.scroll_into_view_if_needed(timeout=8000)
            r.page.get_by_text("Turn off link", exact=False).first.click(timeout=5000); r.sleep(1.8)
            out["link_off"] = "Create link" in r.text()
        except Exception as e:
            out["link_off"] = False
            r.find(f"turn off failed: {str(e)[:80]}")
        if token:
            try:
                req = urllib.request.Request(SITE + "/.netlify/functions/household-card?token=" + token)
                urllib.request.urlopen(req, timeout=20)
                out["revoked_404"] = False
            except urllib.error.HTTPError as e:
                out["revoked_404"] = (e.code == 404)
        out["fable_console"] = r.console[:10]
    finally:
        r.close()

def walk_reintro_readonly():
    # Zero/low-verdict account: does the preview show a floating
    # "What drift detection looks like" label over nothing?
    r = Robot("MNT9D")
    try:
        signup_or_login(r, REINTRO, "Fleet Reintro", "RobotTester!2026")
        if "Were you on your plan" in r.text():
            r.click("Yes, I stayed on my plan"); r.sleep(2.0)
        r.wait_ready(15)
        try:
            r.page.get_by_text("More", exact=True).first.click(timeout=4000); r.sleep(0.8)
        except Exception:
            pass
        opened = r.click("Maintain", exact=True, required=False)
        r.sleep(2.5); r.wait_ready(12)
        mt = r.text()
        out["reintro_maintain_opened"] = opened
        out["reintro_has_label"] = "What drift detection looks like" in mt
        out["reintro_maphealth_rendered"] = "MAP HEALTH" in mt
        out["reintro_text_tail"] = mt[-600:]
        r.page.evaluate("window.scrollTo(0, document.body.scrollHeight)"); r.sleep(0.9)
        r.shot("reintro_maintain_bottom")
        out["reintro_console"] = r.console[:10]
    finally:
        r.close()

try:
    walk_fable()
except Exception as e:
    out["fable_walk_error"] = str(e)[:200]
try:
    walk_reintro_readonly()
except Exception as e:
    out["reintro_walk_error"] = str(e)[:200]

with open("mnt9c_report.json", "w") as f:
    json.dump(out, f, indent=1, default=str)
print(json.dumps(out, indent=1, default=str)[:4000])
