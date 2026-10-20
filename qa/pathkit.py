from robot import Robot
import re, json, subprocess

SITE_FN = "https://singular-starship-09b1f1.netlify.app/.netlify/functions"

def srv_skip(email, days):
    out = subprocess.run(["curl","-s","-X","POST", f"{SITE_FN}/test-skip",
        "-H","Content-Type: application/json","-d", json.dumps({"email": email, "days": days})],
        capture_output=True, text=True).stdout
    print(f"skip{days}:", out[:110]); return out

def signup_or_login(r, email, name, pw):
    r.goto(); r.click("Sign in"); r.sleep(1.2)
    r.fill_ph("you@email.com", email)
    r.fill_ph("••••••••", pw)
    r.click_btn("Sign"); r.sleep(2.0); r.wait_ready(20)
    if "Sign in to continue" in r.text() or "Invalid" in r.text():
        r.click("Continue here"); r.sleep(1.0)
        r.fill_ph("you@email.com", email); r.click_btn("Continue"); r.sleep(1.8)
        r.fill_ph("Sarah Chen", name)
        r.fill_ph("At least 8 characters", pw)
        r.fill_ph("Re-enter your password", pw)
        r.click_btn("Create"); r.sleep(2.0); r.wait_ready(25)

def enter_intake(r, name):
    if "Start your intake survey" in r.text():
        for _ in range(3):
            try: r.page.get_by_text("Start intake survey", exact=False).last.click(timeout=4000)
            except Exception: pass
            r.sleep(1.8); r.wait_ready(12)
            if "before you begin" in r.text().lower() or "What are you hoping" in r.text(): break
    if "before you begin" in r.text().lower():
        r.consent(name)

def do_symptoms(r, plan):
    for label, nth in plan:
        try: r.page.get_by_text(label, exact=True).nth(nth).click(timeout=3500); r.sleep(0.25)
        except Exception as e: r.find(f"s2 {label}#{nth}: {str(e)[:50]}")
    r.click_btn("Continue", required=False) or r.find("s2 blocked: " + r.text()[:150].replace("\n"," | "))
    r.sleep(1.2)

def do_baselines(r, vals):
    body = r.text()
    n = body.count("In a typical week")
    for i in range(n):
        try: r.page.get_by_role("button", name=re.compile(f"^{vals[i % len(vals)]}$")).nth(i).click(timeout=2600); r.sleep(0.2)
        except Exception as e: r.find(f"scale{i}: {str(e)[:40]}")
    r.click_btn("Continue", required=False) or r.find("baselines blocked")
    r.sleep(1.2)

def do_freq(r, pairs):
    if "How often do you eat" not in r.text(): return
    for food, opt in pairs:
        r.xclick(food, opt, required=False)
    r.click_btn("Continue", required=False)
    r.sleep(1.2)

def do_lifestyle(r, sex="Female"):
    if "how many hours do you sleep" not in r.text(): return
    if r.click("Tap to enter", required=False): r.numpad("7")
    if r.click("Tap to enter", required=False): r.numpad("6")
    r.xclick("usual stress level", "Moderate")
    r.xclick("What's your sex", sex)
    r.xclick("Do you drink alcohol", "No")
    r.click_btn("Complete intake", required=False) or r.find("lifestyle blocked: " + r.text()[-200:].replace("\n"," | "))
    r.sleep(2.5); r.wait_ready(20)

def lab_manual(r):
    r.cta(r"upload|enter|results"); r.sleep(1.5); r.wait_ready(12)
    r.click("Manual entry", exact=True, required=False); r.sleep(1.0)

def lab_rig(r, rig):
    for food, level in rig:
        r.fill_ph("Search foods", food); r.sleep(0.9)
        r.xclick(food, level); r.sleep(0.5)
    r.cta(r"submit for review"); r.sleep(1.5); r.wait_ready(12)
    r.cta(r"confirm|submit|looks right|save"); r.sleep(3.0); r.wait_ready(20)

def lab_none(r):
    r.click("My report shows no sensitivities", exact=False); r.sleep(0.8)
    r.cta(r"submit|review|confirm"); r.sleep(1.5); r.wait_ready(12)
    r.cta(r"confirm|submit|looks right"); r.sleep(3.0); r.wait_ready(20)

ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtY2RtZnFhd3ZkeW5jbW94ZGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NzMxMTEsImV4cCI6MjA5NDM0OTExMX0.hwWDOdicLRQ6UIhzeupVeCSwygpkJxBMwS0-AwCTxW4"
SB = "https://cmcdmfqawvdyncmoxdfz.supabase.co"

def rig_lab(r, email, foods, profile_patch):
    """UI-independent lab rig via the signed-in robot's own session (normal RLS),
    plus the existing test-approve-lab function for the status flip. Exists because
    the UI has NO reachable route for a clean report (P1 finding, held for the doc)."""
    js = """async ([anon, sb, foods, patch]) => {
      const key = Object.keys(localStorage).find(k => k.endsWith('-auth-token'));
      if (!key) return {err: 'no auth token in localStorage'};
      const tok = JSON.parse(localStorage.getItem(key));
      const jwt = tok.access_token, uid = tok.user.id, uname = (tok.user.user_metadata||{}).full_name || tok.user.email;
      const H = {apikey: anon, Authorization: 'Bearer ' + jwt, 'Content-Type': 'application/json'};
      const ins = await fetch(sb + '/rest/v1/lab_results', {method: 'POST',
        headers: {...H, Prefer: 'return=representation'},
        body: JSON.stringify({user_id: uid, user_name: uname, foods: foods,
          submitted_at: new Date().toISOString(), status: 'pending_review'})});
      const insBody = await ins.text();
      const up = await fetch(sb + '/rest/v1/profiles?id=eq.' + uid, {method: 'PATCH',
        headers: H, body: JSON.stringify(patch)});
      return {ins: ins.status, insBody: insBody.slice(0,200), up: up.status, upBody: (await up.text()).slice(0,200)};
    }"""
    out = r.page.evaluate(js, [ANON, SB, foods, profile_patch])
    print("rig_lab:", out)
    approve = subprocess.run(["curl","-s","-X","POST", f"{SITE_FN}/test-approve-lab",
        "-H","Content-Type: application/json","-d", json.dumps({"email": email})],
        capture_output=True, text=True).stdout
    print("approve:", approve[:160])
    return out

def nav_tab(r, label):
    """Navigate via the phone bottom bar (top tabs are hidden under 640px).
    History/Maintain live behind More."""
    import re as _re
    bb = {"Ask Sensify": "Ask"}.get(label, label)
    if label in ("History", "Maintain", "Support"):
        try:
            more = r.page.get_by_role("button", name=_re.compile("^More$"))
            for i in range(more.count()):
                if more.nth(i).is_visible(): more.nth(i).click(); break
            r.sleep(0.6)
            item = r.page.get_by_role("button", name=_re.compile(f"^{label}$"))
            for i in range(item.count()):
                if item.nth(i).is_visible(): item.nth(i).click(); r.sleep(1.8); r.wait_ready(12); return True
        except Exception: pass
        return False
    try:
        btn = r.page.get_by_role("button", name=_re.compile(f"^{bb}$"))
        for i in range(btn.count() - 1, -1, -1):
            b = btn.nth(i)
            try:
                if b.is_visible():
                    # JS click: overlays (the robot-only test panel) intercept
                    # pointer events; dispatching avoids hit-testing entirely.
                    b.evaluate("el => el.click()")
                    r.sleep(1.8); r.wait_ready(12); return True
            except Exception: continue
    except Exception: pass
    return False
