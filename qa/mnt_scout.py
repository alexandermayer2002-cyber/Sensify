# Nightly scout 2026-10-29 — area 9: Maintain + household card (430px).
# Read-only on product; uses existing test account +fable1 (Limit+Safe verdicts,
# common track, day ~109 so Maintain tab visible). Mints a household link,
# reads the public card, compares against the dashboard avoiding list, then
# turns the link off to restore state.
import json, re, urllib.request
from robot import Robot
from pathkit import signup_or_login

SITE = "https://singular-starship-09b1f1.netlify.app"
EMAIL = "alexandermayer2002+fable1@gmail.com"

r = Robot("MNT9")
out = {}
try:
    signup_or_login(r, EMAIL, "Fable One", "RobotTester!2026")
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    r.wait_ready(15)
    out["home_text_head"] = r.text()[:400]
    r.shot("home_top")

    # 1) Dashboard avoiding list (home) — scroll to household card
    body = r.text()
    out["home_has_household"] = "Household card" in body
    out["home_avoiding_mentions_dairy"] = bool(re.search(r"Dairy", body))
    try:
        r.page.get_by_text("Household card", exact=False).first.scroll_into_view_if_needed(timeout=6000)
        r.sleep(0.6)
    except Exception as e:
        r.find(f"household card not found on home: {str(e)[:80]}")
    r.shot("household_share_card")

    # 2) Mint the link
    made = r.click_btn("Create link", required=False)
    r.sleep(2.0)
    token = None
    try:
        val = r.page.locator("input[readonly]").first.input_value(timeout=5000)
        m = re.search(r"household=([0-9a-f]{24})", val or "")
        token = m.group(1) if m else None
        out["minted_link"] = val
    except Exception as e:
        r.find(f"no link input after Create link: {str(e)[:80]}")
    r.shot("household_link_minted")
    out["token"] = token

    # 3) Public card: API JSON + rendered page at 430px (fresh unauthenticated context)
    if token:
        req = urllib.request.Request(SITE + "/.netlify/functions/household-card?token=" + token)
        out["card_json"] = json.loads(urllib.request.urlopen(req, timeout=20).read().decode())
        pub = r.browser.new_context(viewport={"width": 430, "height": 932})
        pp = pub.new_page()
        pp.goto(SITE + "/?household=" + token, wait_until="domcontentloaded")
        pp.wait_for_timeout(3500)
        out["card_page_text"] = pp.inner_text("body")[:600]
        import os
        shots = os.environ.get("QA_SHOTS", "/tmp")
        pp.screenshot(path=os.path.join(shots, "MNT9_public_card.png"))
        print("shot: MNT9_public_card.png")
        ow = pp.evaluate("document.documentElement.scrollWidth")
        out["card_overflow_width"] = ow
        pub.close()

    # 4) Maintain tab via More menu (phone bottom bar)
    opened = False
    for label in ["More", "Maintain"]:
        pass
    try:
        r.page.get_by_text("More", exact=True).first.click(timeout=4000); r.sleep(0.8)
    except Exception:
        pass
    if r.click("Maintain", exact=True, required=False):
        opened = True
    r.sleep(2.2); r.wait_ready(12)
    mt = r.text()
    out["maintain_opened"] = opened and ("Maintain" in mt or "map is yours" in mt)
    out["maintain_text"] = mt[:1400]
    r.shot("maintain_preview_top")
    # scroll through preview: price block, opt-in button, MapHealth
    for frac in (0.4, 0.75, 1.0):
        r.page.evaluate(f"window.scrollTo(0, document.body.scrollHeight*{frac})"); r.sleep(0.8)
        r.shot(f"maintain_scroll_{int(frac*100)}")
    out["maintain_overflow_width"] = r.page.evaluate("document.documentElement.scrollWidth")
    out["has_unlimited_copy"] = "unlimited" in mt.lower()
    out["maphealth_present"] = "MAP HEALTH" in mt or "drift detection" in mt.lower()

    # 5) Restore: turn the household link off (back to Home first)
    try:
        r.page.get_by_text("Home", exact=True).first.click(timeout=4000); r.sleep(1.5)
        r.page.get_by_text("Turn off link", exact=False).first.scroll_into_view_if_needed(timeout=6000)
        r.page.get_by_text("Turn off link", exact=False).first.click(timeout=5000); r.sleep(1.5)
        out["link_turned_off"] = "Create link" in r.text()
    except Exception as e:
        out["link_turned_off"] = False
        r.find(f"could not turn off link: {str(e)[:80]}")
    r.shot("household_after_off")

    out["console_errors"] = r.console[:12]
finally:
    with open("mnt9_report.json", "w") as f:
        json.dump(out, f, indent=1, default=str)
    print(json.dumps(out, indent=1, default=str)[:3000])
    r.close()
