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
        # The robot door: test email into the paid-resume box skips payment check
        self.fill_ph("you@email.com", email)
        self.click_btn("Continue")
        self.sleep(1.8)
        self.fill_ph("Sarah Chen", name)
        try: self.page.get_by_placeholder("you@email.com").first.fill(email, timeout=2500)
        except Exception: pass  # prefilled + locked by the robot door — correct
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



    def answer(self, question_sub, option):
        """Click `option` within the question whose label contains question_sub."""
        try:
            x = f"xpath=//*[contains(normalize-space(.), {question_sub!r}) and not(.//*[contains(normalize-space(.), {question_sub!r})])]/following::*[normalize-space(text())={option!r}][1]"
            self.page.locator(x).first.click(timeout=4000)
            self.sleep(0.25)
            return True
        except Exception as e:
            self.find(f"[{self.tag}] answer fail {question_sub!r} -> {option!r}: {str(e)[:70]}")
            return False



    def wait_ready(self, timeout_s=25):
        """Poll until the app's loading states clear."""
        import time as _t
        end = _t.time() + timeout_s
        while _t.time() < end:
            t = self.text()
            if t and "Loading your program" not in t and "Loading..." not in t and len(t) > 60:
                return True
            self.sleep(0.8)
        self.find(f"[{self.tag}] still loading after {timeout_s}s")
        return False

    def note(self, s):
        self.findings.append("NOTE: " + s); print("NOTE:", s)

    def snap(self, tag, n=900):
        t = self.text()
        print(f"==[{tag}]==\n{t[:n]}\n==end {tag}==")
        return t

    def xclick(self, anchor, target, required=True):
        """Click `target` as the first match AFTER `anchor` in document order."""
        try:
            x = f"xpath=//*[contains(normalize-space(text()), {anchor!r})]/following::*[normalize-space(text())={target!r}][1]"
            self.page.locator(x).first.click(timeout=4000); self.sleep(0.25); return True
        except Exception as e:
            if required: self.find(f"[{self.tag}] xclick {anchor!r}->{target!r}: {str(e)[:60]}")
            return False

    def lifestyle_autofill(self, hours="6.5"):
        for _ in range(5):
            if not self.click("Tap to enter", required=False): break
            val = hours if "sleep" in self.text().lower()[: self.text().lower().find("tap to enter") + 40] else "5"
            self.numpad(val if _ == 0 else "5"); self.sleep(0.5)
        for band in ["Moderate", "Most days", "Some days", "About right", "Could drink more",
                     "Female", "Male", "Prefer not to say", "1\u20132 per week", "Rarely", "None", "Occasionally"]:
            self.click(band, exact=True, required=False)


    def cta(self, pattern):
        """Click the last visible BUTTON whose text matches pattern (regex, i)."""
        import re as _re
        try:
            btns = self.page.get_by_role("button")
            idxs = [i for i in range(btns.count()) if _re.search(pattern, btns.nth(i).inner_text() or "", _re.I)]
            if not idxs: raise RuntimeError("no button matches " + pattern)
            btns.nth(idxs[-1]).click(timeout=5000); self.sleep(1.0); return True
        except Exception as e:
            self.find(f"[{self.tag}] cta /{pattern}/: {str(e)[:70]}"); return False

    def consent(self, full_name):
        """The pre-intake 'Before you begin' gate: typed-name signature + agree.
        Case-insensitive: design-system labels are CSS-uppercased, and
        innerText reflects text-transform."""
        if "before you begin" not in self.text().lower():
            return False
        try:
            self.page.get_by_placeholder("Your full name").first.fill(full_name); self.sleep(0.3)
        except Exception:
            self.find(f"[{self.tag}] consent signature input not fillable")
        # the custom checkbox row: click its statement text to toggle agreed
        self.click("I understand that Sensify is a wellness program", exact=False, required=False)
        self.sleep(0.4)
        self.shot("consent_signed")
        self.click("I agree, start my intake", required=False) or self.click_btn("I agree", required=False) or self.find(f"[{self.tag}] consent agree unclickable")
        self.sleep(1.5)
        return True

    def close(self):
        try: self.browser.close()
        except Exception: pass
        self.pw.stop()
