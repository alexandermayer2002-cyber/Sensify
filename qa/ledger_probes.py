# Nightly Critic ledger probes (live site, text only, 430x932). Prints PROBE <id> PASS|FAIL | detail
import re
from playwright.sync_api import sync_playwright
S="https://singular-starship-09b1f1.netlify.app"
out=[]
def P(i,ok,d=""): print(f"PROBE {i} {'PASS' if ok else 'FAIL'} | {d}"[:200]); 
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={"width":430,"height":932}).new_page()
    pg.goto(S); pg.wait_for_timeout(3000)
    t=pg.inner_text("body")
    P("M03",bool(re.search(r"brain fog|bloating|reflux",t[:1500],re.I)),"hero names symptoms? (Alex chose symptom-vague)")
    P("M06",bool(re.search(r"months",t,re.I)),"duration 'months' on home")
    P("M07",len(re.findall("clinical standard",t,re.I))==0,f"'clinical standard' x{len(re.findall('clinical standard',t,re.I))}")
    P("M08",bool(re.search(r"EXAMPLE",t)),"EXAMPLE label on home")
    P("M09",bool(re.search(r"safe to (cut|eliminate|remove)|nutrition|dietitian|physician|doctor",t,re.I)),"safety FAQ/physician line on home")
    P("M01",bool(re.search(r"guarantee|money.back|refund",t,re.I)),"risk reversal text (Alex: refunds silent)")
    h=[ (e.inner_text()[:25], e.bounding_box()["height"]) for e in pg.query_selector_all("nav button, header button, nav a") if e.is_visible() and e.bounding_box()]
    P("M12",all(x[1]>=44 for x in h) and bool(h),f"nav heights {[(a,round(b)) for a,b in h]}")
    P("D17",not re.search("TEST MODE",t),"logged-out home lacks TEST MODE")
    for path in ["/science","/faq"]:
        pg.goto(S+path); pg.wait_for_timeout(2000); tt=pg.inner_text("body")
        if path=="/science": P("D01",bool(re.search(r"56|eight weeks",tt) and re.search(r"why (eight|8|56)",tt,re.I)),"Science explains 56 days")
        else: P("M09b",bool(re.search(r"safe|physician|doctor",tt,re.I)),"FAQ safety answer")
    pg.goto(S); pg.wait_for_timeout(1500); pg.get_by_text("Sign in").first.click(); pg.wait_for_timeout(1200)
    lt=pg.inner_text("body"); P("D03",bool(re.search(r"Paid but never finished",lt)) and bool(re.search(r"paid|payment",lt,re.I)),"resume door text present")
    b.close()
