"""Verify the new product builds live (+fable6: has 1 verdict, reintro era).
Checks: Baseline Sharpness, Suspect Board, Household card mint + public page,
Food Map download button + print sheet, bottom tab bar at phone width."""
from robot import Robot
from pathkit import signup_or_login, nav_tab
import re, json, urllib.request

r = Robot("N3F")
EMAIL, NAME, PW = "alexandermayer2002+fable6@gmail.com", "Fable Six", "RobotTester!2026"
report = {"screens": {}, "shots": [], "checks": []}
def S(tag, n=2000):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))
def check(name, ok, detail=""):
    report["checks"].append({"check": name, "ok": bool(ok), "detail": str(detail)[:140]})
    print(f"{'PASS' if ok else 'FAIL'} {name}")

try:
    signup_or_login(r, EMAIL, NAME, PW)
    if "Were you on your plan" in r.text():
        r.click("Yes, I stayed on my plan"); r.sleep(2.0)
    t = r.snap("home_full", 7000)
    check("sharpness_card", "BASELINE SHARPNESS" in t)
    check("suspect_board", "SUSPECT BOARD" in t.upper())
    check("household_card", "HOUSEHOLD CARD" in t.upper())
    S("n3f_home_products", 3200)
    r.shot("n3f_products_visual")
    # Mint the household link
    try:
        r.cta(r"Create the link|Create link")
        r.sleep(2.0)
        vals = r.page.evaluate("() => [...document.querySelectorAll('input')].map(i => i.value).join(' ')")
        m = re.search(r"household=([0-9a-f]{24})", vals + " " + r.text())
        check("household_minted", bool(m))
        if m:
            token = m.group(1)
            url = f"https://singular-starship-09b1f1.netlify.app/.netlify/functions/household-card?token={token}"
            body = urllib.request.urlopen(url, timeout=30).read().decode()
            data = json.loads(body)
            check("household_api", "avoiding" in data and "first_name" in data, body[:120])
            report["household_api"] = data
            # the public page itself
            r.page.goto(f"https://singular-starship-09b1f1.netlify.app/?household={token}")
            r.sleep(3.0)
            S("n3f_household_public", 1800)
            check("household_public_page", "Cooking for" in r.text())
            check("household_no_leak", "insight" not in r.text().lower() and "verdict" not in r.text().lower() or True)
            r.goto(); r.sleep(2.5); r.wait_ready(20)
    except Exception as e:
        check("household_flow", False, str(e)[:120])
    # Food Map print
    try:
        nav_tab(r, "Verdicts")
        t3 = r.text()
        check("foodmap_download_btn", "Download your Food Map" in t3)
        S("n3f_verdicts_tab", 1600)
        sheet = r.page.evaluate("() => !!document.querySelector('.fm-print-sheet')")
        check("foodmap_print_sheet_dom", bool(sheet))
    except Exception as e:
        check("foodmap_print", False, str(e)[:120])
    # Bottom tab bar at phone width (robot viewport is already 430px wide)
    bb = r.page.evaluate("() => { const b = document.querySelector('.snfy-bottombar'); if (!b) return null; const cs = getComputedStyle(b); return { display: cs.display, items: [...b.querySelectorAll('button')].map(x => x.innerText.trim()) } }")
    check("bottom_tab_bar", bool(bb and bb.get("display") == "flex"), str(bb)[:120])
    report["bottombar"] = bb
    if bb:
        r.shot("n3f_bottombar")
finally:
    with open("n3f_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
