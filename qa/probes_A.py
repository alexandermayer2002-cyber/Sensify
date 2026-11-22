from playwright.sync_api import sync_playwright
S="https://singular-starship-09b1f1.netlify.app"
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_context(viewport={"width":430,"height":932}).new_page()
    for path in ["/","/science","/faq","/pricing"]:
        pg.goto(S+path); pg.wait_for_timeout(2500)
        print("=====",path); print(pg.inner_text("body"))
    pg.goto(S); pg.wait_for_timeout(1500); pg.get_by_text("Sign in").first.click(); pg.wait_for_timeout(1200)
    print("===== LOGIN"); print(pg.inner_text("body"))
    b.close()
