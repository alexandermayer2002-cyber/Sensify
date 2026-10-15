from robot import Robot
import re, time

r = Robot("A")
EMAIL, PW = "alexandermayer2002+fable1@gmail.com", "RobotTester!2026"
r.login(EMAIL, PW)
r.shot("resume_after_login")
print("POST-LOGIN:", r.text()[:200].replace("\n", " | "))

# ---- Onboarding: click through whatever CTAs appear ----
for i in range(8):
    body = r.text()
    if "intake" in body.lower() and ("categor" in body.lower() or "What brings" in body or "symptom" in body.lower()):
        break
    moved = False
    for cta in ["Begin intake", "Start intake", "Let's begin", "Begin", "Continue", "Get started", "Next", "I'm ready", "Start"]:
        if r.click_btn(cta, required=False):
            moved = True; r.sleep(1.2); break
    if not moved:
        print("ONBOARD SCREEN (no CTA matched):", body[:250].replace("\n", " | "))
        r.shot(f"onboard_stuck_{i}")
        break
r.shot("intake_start")
print("INTAKE START:", r.text()[:260].replace("\n", " | "))

# ---- Intake step 1: categories (persona: digestive + energy — someone who needs this) ----
r.click("Digestive health", required=False)
r.click("Energy & clarity", required=False)
r.shot("intake_categories")
r.click_btn("Continue")

# ---- Step 2: symptom questions, persona answers (chronic, food-linked) ----
persona_prefs = [
    "A few times a week",        # bloating freq
    "After specific foods",      # bloating timing
    "Occasionally",              # gas / crashes etc.
    "Never",                     # reflux
    "Inconsistent",              # regularity
    "1–3 years",            # durations
    "Often tired",               # fatigue
    "A few times a week",        # fog
    "Okay but not great",        # sleep
]
for _ in range(14):
    if not any(r.click(p, exact=True, required=False) for p in persona_prefs):
        break
    r.sleep(0.3)
r.shot("intake_questions_done")
if not r.click_btn("Continue", required=False):
    print("QUESTIONS SCREEN STILL:", r.text()[:400].replace("\n", " | "))
    r.shot("questions_stuck")

# ---- Step 3: baselines 1-10 (mid-high symptoms: a person who needs the platform) ----
r.sleep(1.0)
targets = ["6", "5", "6", "4", "5", "6", "5", "5", "5", "5"]
# click one visible rating button per scale, top to bottom
try:
    rows = r.page.get_by_text("In a typical week", exact=False)
    n = rows.count()
    print("baseline scales visible:", n)
    for i in range(n):
        val = targets[i % len(targets)]
        btns = r.page.get_by_role("button", name=re.compile(f"^{val}$"))
        # pick the i-th scale's button: buttons repeat per row; click the first still-unselected match
        for j in range(btns.count()):
            try:
                btns.nth(j).click(timeout=1200); r.sleep(0.2); break
            except Exception: continue
except Exception as e:
    print("baseline pass issue:", str(e)[:120])
r.shot("intake_baselines")
r.click_btn("Continue", required=False) or print("BASELINES STUCK:", r.text()[:300].replace("\n"," | "))
r.sleep(1.0)
r.shot("intake_lifestyle")
print("LIFESTYLE SCREEN:\n", r.text()[:600])
r.close()
