"""Marketing page sweep: logged-out landing, full text, sections, link probe, console errors, two viewports."""
from robot import Robot
import json
r = Robot("MKT")
report = {"screens": {}, "shots": [], "links": [], "console": []}
try:
    r.goto(); r.sleep(3.0)
    full = r.snap("mkt_full", 12000)
    report["screens"]["mkt_full"] = full
    report["shots"].append(r.shot("mkt_top"))
    # scroll captures
    for i, frac in enumerate([0.25, 0.5, 0.75, 1.0]):
        r.page.evaluate(f"window.scrollTo(0, document.body.scrollHeight * {frac})")
        r.sleep(1.2)
        report["shots"].append(r.shot(f"mkt_scroll{i}"))
    # all anchors
    report["links"] = r.page.evaluate("() => [...document.querySelectorAll('a')].map(a => ({t: a.innerText.trim().slice(0,40), h: a.getAttribute('href')}))")
    # all buttons
    report["buttons"] = r.page.evaluate("() => [...document.querySelectorAll('button')].map(b => b.innerText.trim().slice(0,50))")
    report["console"] = r.console[:15]
    # desktop viewport pass
    r.page.set_viewport_size({"width": 1440, "height": 900})
    r.page.evaluate("window.scrollTo(0,0)"); r.sleep(1.5)
    report["shots"].append(r.shot("mkt_desktop_top"))
    r.page.evaluate("window.scrollTo(0, document.body.scrollHeight * 0.5)"); r.sleep(1.0)
    report["shots"].append(r.shot("mkt_desktop_mid"))
finally:
    with open("mkt_report.json", "w") as f:
        json.dump(report, f, indent=1)
    r.close()
