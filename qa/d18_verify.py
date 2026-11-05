"""Deploy 18 live verification — digestive axis end-to-end + TM pill + 400-pinning.
Fresh digestive-path persona: intake (comfort label check) -> lab -> day 8 ->
weekly check-in answering digestive HIGH (comfortable) -> insight direction check."""
import os, json, re
os.environ["QA_SHOTS"] = "/tmp/claude-0/-home-claude-sensify/1716ba7b-bc83-5816-86e9-8a544fc7cfe5/scratchpad/qa"
from robot import Robot
from pathkit import (signup_or_login, enter_intake, do_symptoms, do_baselines,
                     do_freq, lab_manual, srv_skip, ANON, SB, SITE_FN)
from fleetkit import _flag_and_submit, gate
import subprocess

EMAIL = "alexandermayer2002+qa2611055d18@gmail.com"
PW = "RobotQA-2611!"
NAME = "Verify Eighteen"

def rest(r, path):
    js = """async ([anon, sb, path]) => {
      const key = Object.keys(localStorage).find(k => k.endsWith('-auth-token'));
      const tok = JSON.parse(localStorage.getItem(key));
      const H = {apikey: anon, Authorization: 'Bearer ' + tok.access_token};
      const res = await fetch(sb + '/rest/v1/' + path.replace('$UID', tok.user.id), {headers: H});
      return {status: res.status, body: (await res.text()).slice(0, 600)};
    }"""
    return r.page.evaluate(js, [ANON, SB, path])

r = Robot("D18")
bad = []
r.page.on("response", lambda resp: bad.append(f"{resp.status} {resp.url[:120]}") if resp.status >= 400 else None)
try:
    signup_or_login(r, EMAIL, NAME, PW)
    enter_intake(r, NAME)
    if "What are you hoping" in r.text():
        r.click("Digestive health"); r.click_btn("Continue"); r.sleep(1.2)
    if "Tell us about" in r.text():
        do_symptoms(r, [("Daily", 0), ("After specific foods", 0), ("A few times a week", 1),
                        ("Occasionally", 1), ("Often irregular or uncomfortable", 0), ("More than 3 years", 0)])
    # THE LABEL CHECK: digestive comfort scale must read comfort axis
    t = r.text()
    if "digestive comfort" in t.lower():
        seg = t[t.lower().index("digestive comfort"):][:260]
        print("INTAKE_SCALE_SEG:", seg.replace("\n", " | "))
        r.shot("intake_scales")
    if "In a typical week" in r.text():
        do_baselines(r, ["8", "5", "5", "5"])  # 8 on comfort axis = quite comfortable baseline
    do_freq(r, [("Cow Milk", "Daily"), ("Wheat", "3–5x/week")])
    if "how many hours do you sleep" in r.text():
        if r.click("Tap to enter", required=False): r.numpad("7")
        if r.click("Tap to enter", required=False): r.numpad("6")
        r.xclick("usual stress level", "Moderate")
        r.xclick("What's your sex", "Male")
        r.xclick("Do you drink alcohol", "No")
        r.click_btn("Complete intake", required=False)
        r.sleep(2.5); r.wait_ready(20)
    r.goto(); r.sleep(2.0); r.wait_ready(20)
    print("BASELINE_ROW:", rest(r, "profiles?id=eq.$UID&select=baseline_digestive,baseline_bloating"))
    if "Upload your lab results" in r.text():
        lab_manual(r)
        _flag_and_submit(r, [("Cow Milk", "High"), ("Wheat", "Moderate")])
        out = subprocess.run(["curl","-s","-X","POST", f"{SITE_FN}/test-approve-lab",
            "-H","Content-Type: application/json","-d", json.dumps({"email": EMAIL})],
            capture_output=True, text=True).stdout
        print("approve:", out[:100])
    srv_skip(EMAIL, 7)
    r.goto(); r.sleep(2.5); r.wait_ready(20); gate(r)
    t = r.text()
    print("TM_PILL:", "⏱ TM" in t or "TM" in t, "| PANEL_OPEN:", "TIME MACHINE" in t)
    r.shot("dash_day8")
    # Weekly check-in: answer digestive HIGH (= very comfortable now)
    if not r.xclick("Weekly check-in", "Start →", required=False):
        r.cta(r"Start check-in")
    r.sleep(2.2); r.wait_ready(12)
    body = r.text()
    print("WK_Q_COMPLIANCE:", "your protocol" in body, "| old wording:", "the elimination plan" in body)
    if "digestive comfort" in body.lower():
        seg = body[body.lower().index("digestive comfort"):][:200]
        print("WK_SCALE_SEG:", seg.replace("\n", " | "))
    # answer all 1-10 scales with 9 (comfort axis: feeling great)
    n = r.page.get_by_role("button", name=re.compile("^9$")).count()
    for i in range(n):
        try: r.page.get_by_role("button", name=re.compile("^9$")).nth(i).click(timeout=2500); r.sleep(0.15)
        except Exception: pass
    r.click("Much better", exact=True, required=False) or r.click("Better", exact=True, required=False) or r.click("About the same", exact=True, required=False)
    r.click("Nothing unusual, a normal week", exact=True, required=False)
    r.click("Fully", exact=True, required=False)
    r.shot("wk_filled")
    if r.cta(r"Submit check-in"):
        r.sleep(3.0); r.wait_ready(15)
        for _ in range(30):
            if "Writing your insight" not in r.text(): break
            r.sleep(2.0)
        t = r.text()
        r.shot("wk_insight")
        print("INSIGHT_TEXT:", t[:900].replace("\n", " | "))
        low = t.lower()
        print("AXIS_SMELL: worsen-words:", any(w in low for w in ["rose sharply", "worsened", "discomfort rose", "up 75", "worse this week"]))
        r.cta(r"Back to dashboard|Done"); r.sleep(2.0); r.wait_ready(15)
    print("BAD_RESPONSES:", json.dumps(bad[:12], indent=0))
    print("CONSOLE:", json.dumps(r.console[:8]))
finally:
    r.close()
