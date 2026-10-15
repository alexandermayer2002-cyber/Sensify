"""Sensify Robot Tester — drives the live site end-to-end as persona accounts.
Findings are LOGGED, never fixed. Screenshots per milestone."""
import os, time, json, re
from playwright.sync_api import sync_playwright

SITE = "https://singular-starship-09b1f1.netlify.app"
SHOTS = os.environ.get("QA_SHOTS", "/tmp/claude-0/-home-claude-sensify/512e85e3-e74e-5efe-bd56-1a6472a82975/scratchpad/qa")
os.makedirs(SHOTS, exist_ok=True)

class Robot:
    def __init__(self, tag):
        self.tag = tag
        self.findings = []
        self.console = []
        self.shotn = 0
        self.pw = sync_playwright().start()
        proxy = os.environ.get("HTTPS_PROXY")
        self.browser = self.pw.chromium.launch(headless=True, proxy={"server": proxy} if proxy else None)
        self.ctx = self.browser.new_context(viewport={"width": 430, "height": 932}, ignore_https_errors=True)
        self.page = self.ctx.new_page()
        self.page.on("console", lambda m: self.console.append(m.text[:300]) if m.type == "error" else None)
        self.page.on("pageerror", lambda e: self.console.append("PAGEERROR " + str(e)[:300]))
        self.page.set_default_timeout(9000)

    def find(self, note):
        self.findings.append(note); print("FINDING:", note)

    def shot(self, name):
        self.shotn += 1
        p = f"{SHOTS}/{self.tag}_{self.shotn:02d}_{name}.png"
        self.page.screenshot(path=p)
        print("shot:", os.path.basename(p))
        return p

    def goto(self, path=""):
        self.page.goto(SITE + path, wait_until="domcontentloaded"); self.sleep(1.8)

    def sleep(self, s): self.page.wait_for_timeout(int(s * 1000))

    def text(self):
        try: return self.page.inner_text("body")
        except Exception: return ""

    def click(self, label, exact=False, nth=0, required=True):
        try:
            loc = self.page.get_by_text(label, exact=exact)
            loc.nth(nth).click(timeout=6000); self.sleep(0.7); return True
        except Exception as e:
            if required: self.find(f"[{self.tag}] could not click '{label}': {str(e)[:90]} | screen: {self.text()[:120]!r}")
            return False

    def click_btn(self, label, required=True):
        try:
            self.page.get_by_role("button", name=re.compile(re.escape(label), re.I)).first.click(timeout=6000)
            self.sleep(0.8); return True
        except Exception as e:
            if required: self.find(f"[{self.tag}] no button '{label}': {str(e)[:80]}")
            return False

    def fill_ph(self, placeholder, value):
        self.page.get_by_placeholder(placeholder).first.fill(value); self.sleep(0.2)

    # ---------- flows ----------
    def signup(self, email, name, pw):
        # Front door "Get started" goes to Stripe checkout (finding, logged by the
        # path runner). Free signup lives behind Sign in -> Sign up.
        self.goto()
        self.click("Sign in")
        self.sleep(1.0)
        self.click("Continue here", required=False)
        self.sleep(1.2)
        self.fill_ph("Sarah Chen", name)
        self.fill_ph("you@email.com", email)
        self.fill_ph("At least 8 characters", pw)
        self.fill_ph("Re-enter your password", pw)
        self.shot("signup_filled")
        self.click_btn("Create")
        self.sleep(3.5)
        body = self.text()
        if re.search(r"confirm|verify|check your email", body, re.I):
            self.shot("signup_email_confirm_wall")
            return "confirm_required"
        return "ok"

    def login(self, email, pw):
        self.goto()
        self.click("Sign in")
        self.fill_ph("you@email.com", email)
        self.fill_ph("••••••••", pw)
        self.click_btn("Sign")
        self.sleep(3.5)

    def answer_options(self, prefs, rounds=40):
        """Question screens: for each visible question, click the persona's preferred
        option (first pref substring that matches a clickable option)."""
        for _ in range(rounds):
            body = self.text()
            clicked = False
            for pref in prefs:
                try:
                    loc = self.page.get_by_text(pref, exact=True)
                    n = loc.count()
                    for i in range(n):
                        el = loc.nth(i)
                        if el.is_visible():
                            el.click(timeout=2500); self.sleep(0.4); clicked = True
                except Exception:
                    continue
            if not clicked:
                break

    def numpad(self, value):
        for ch in str(value):
            self.click(ch, exact=True, required=False)
        for done in ["Done", "Set", "OK", "✓"]:
            if self.click(done, exact=True, required=False): break

    def close(self):
        try: self.browser.close()
        except Exception: pass
        self.pw.stop()
