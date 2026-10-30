"""Nightly scout 2026-10-30: marketing page walk at 430px (redesigned page)."""
from robot import Robot
import json, os

OUT = os.environ.get("QA_SHOTS")
r = Robot("MKT30")
report = {"tabs": {}, "shots": [], "overflow": {}, "console": [], "statics": {}}
try:
    r.goto(); r.sleep(3.0)
    for tab, label in [("home","Home"), ("how","How it works"), ("science","Science"),
                       ("pricing","Pricing"), ("faq","FAQ"), ("about","About")]:
        if tab != "home":
            # mobile <=500px likely hamburger
            try:
                r.page.evaluate("() => { const b=[...document.querySelectorAll('button')].find(x=>x.getAttribute('aria-label')==='Menu'||x.className.includes('burger')||x.className.includes('menu')); if(b) b.click(); }")
                r.sleep(0.6)
                r.click(label)
            except Exception:
                try: r.click(label)
                except Exception as e: r.find(f"nav to {tab} failed: {e}"); continue
            r.sleep(1.5)
        r.page.evaluate("window.scrollTo(0,0)"); r.sleep(0.8)
        report["tabs"][tab] = r.snap(f"mkt30_{tab}", 14000)
        report["overflow"][tab] = r.page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
        h = r.page.evaluate("() => document.body.scrollHeight")
        n = min(6, max(1, h // 900))
        for i in range(n + 1):
            r.page.evaluate(f"window.scrollTo(0, {i} * document.body.scrollHeight / {max(n,1)})")
            r.sleep(1.0)
            report["shots"].append(r.shot(f"{tab}_s{i}"))
    report["links"] = r.page.evaluate("() => [...document.querySelectorAll('a')].map(a => ({t: a.innerText.trim().slice(0,40), h: a.getAttribute('href')}))")
    report["buttons"] = r.page.evaluate("() => [...document.querySelectorAll('button')].map(b => b.innerText.trim().slice(0,50))")
    # statics
    for p in ["/privacy.html", "/terms.html"]:
        resp = r.page.goto(r.page.url.split("/")[0] + "//" + r.page.url.split("/")[2] + p, wait_until="domcontentloaded")
        report["statics"][p] = resp.status if resp else None
        r.sleep(0.5)
    report["console"] = r.console[:20]
finally:
    with open("mkt30_report.json", "w") as f:
        json.dump(report, f, indent=1)
    r.close()
print("done; console errors:", len(report["console"]))
