# Bundle + path probes (text only). N03 uses real fragment phrases (the old probe's '.' matched a comma).
import re, urllib.request, sys
S="https://singular-starship-09b1f1.netlify.app"
html=urllib.request.urlopen(S+"/").read().decode()
m=re.search(r"main\.[a-z0-9]+\.js",html).group(0)
js=urllib.request.urlopen(f"{S}/static/js/{m}").read().decode()
def P(i,ok,d=""): print(f"PROBE {i} {'PASS' if ok else 'FAIL'} | {d}")
frag=[r"Setup complete\. your results",r"Slip-up logged\. thank you",r"At 28 nights\. four clean",r"That didn.t save\. please",r"Your data is safe\. we just"]
P("N03",not any(re.search(f,js) for f in frag),m)
P("N05",not re.search(r'children:"\\\\u',js),"no literal \\u escape as JSX text")
P("X04",js.count("Tap to fix it")>=3,"persistent pad warning present")
P("X17",'lab-error' in js and "to continue." in js,"lab error scroll + hint")
P("N06",not re.search("Six clean weeks",js),"hero mock no longer says Six clean weeks")
P("X20",not re.search(r"foods total",js),"no '1 foods total' string in bundle")
P("N07",not (re.search(r"takes 2 minutes|time:.?.2 minutes",js,re.I) and re.search(r"thirty seconds",js,re.I)),"app says 2 minutes for nightly check-in while marketing says thirty seconds (FAIL while contradictory)")
P("F06",not re.search(r"14 days per cycle",js),"no '14 days per cycle' string")
P("X15",not re.search(r"clearest signal so far",js),"no 'clearest signal so far' string")
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={"width":430,"height":932}).new_page()
    for path,needle in [("/faq","Things people ask us"),("/science","science"),("/pricing","399")]:
        pg.goto(S+path); pg.wait_for_timeout(2500); t=pg.inner_text("body")
        h=pg.inner_text("body")[:0]
        P("X18"+path,needle.lower() in t.lower() and not re.search(r"^\s*Home\b.*hero",t[:0]),f"{path} text has '{needle}'")
    pg.goto(S+"/faq"); pg.wait_for_timeout(2000)
    P("X18-tab", "Things people ask us" in pg.inner_text("body") and not pg.query_selector("text=See the full program"), "/faq does not show home-only CTA")
    b.close()
