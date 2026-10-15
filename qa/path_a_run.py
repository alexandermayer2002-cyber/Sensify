from robot import Robot
import re, sys

r = Robot("A")
NAME, EMAIL, PW = "Fable One", "alexandermayer2002+fable1@gmail.com", "RobotTester!2026"
r.login(EMAIL, PW)

def cta_until(predicate, ctas, tries=8, tag="nav"):
    for _ in range(tries):
        if predicate(r.text()): return True
        if not any(r.click_btn(c, required=False) for c in ctas):
            r.find(f"[A/{tag}] stuck: {r.text()[:140]!r}"); r.shot(f"stuck_{tag}"); return False
        r.sleep(1.2)
    return predicate(r.text())

# 1. Onboarding -> consent -> intake categories
cta_until(lambda b: "Before you begin" in b or "Digestive health" in b,
          ["Begin intake", "Start intake", "Begin", "Continue", "Get started", "Start"], tag="onboard")
if "Before you begin" in r.text():
    r.consent(NAME)
print("STEP:", r.text()[:120].replace("\n", " | "))

# 2. Categories
if "Digestive health" in r.text():
    r.click("Digestive health"); r.click("Energy & clarity")
    r.shot("categories"); r.click_btn("Continue"); r.sleep(1.0)

# 3. Symptom questions — persona: chronic, food-linked, needs the platform
prefs = ["A few times a week", "After specific foods", "Occasionally", "Never",
         "Inconsistent", "1–3 years", "Often tired", "Okay but not great"]
for _ in range(16):
    if not any(r.click(p, exact=True, required=False) for p in prefs): break
    r.sleep(0.25)
r.shot("questions")
r.click_btn("Continue", required=False) or (r.find(f"[A/questions] not complete: {r.text()[:200]!r}"), r.shot("q_stuck"))
r.sleep(1.0)

# 4. Baselines 1-10 — click a mid-high value in每 scale (one per row)
body = r.text()
n_scales = body.count("In a typical week")
print("scales:", n_scales)
vals = ["6", "5", "6", "4", "5", "6", "5", "5"]
for i in range(n_scales):
    btn = r.page.get_by_role("button", name=re.compile(r"^" + vals[i % len(vals)] + r"$"))
    done = False
    for j in range(btn.count()):
        try:
            b = btn.nth(j)
            if b.is_visible(): b.click(timeout=1200); r.sleep(0.2); done = True; break
        except Exception: continue
    if not done: r.find(f"[A/baselines] could not rate scale {i}")
r.shot("baselines")
r.click_btn("Continue", required=False) or (r.find("[A/baselines] continue blocked"), r.shot("b_stuck"))
r.sleep(1.0)

# 5. Lifestyle: numpad fields + bands
print("LIFESTYLE:", r.text()[:450].replace("\n", " | "))
r.shot("lifestyle_raw")
# sleep hours
if r.click("Tap to enter", required=False):
    r.numpad("7"); r.sleep(0.4)
# remaining numfields / bands: click any leftover Tap-to-enter then mid options
for _ in range(3):
    if not r.click("Tap to enter", required=False): break
    r.numpad("5"); r.sleep(0.4)
for band in ["Moderate", "Most days", "Sometimes", "Female", "1–3 per week", "Rarely", "None"]:
    r.click(band, exact=True, required=False)
r.shot("lifestyle_done")
r.click_btn("Continue", required=False)
r.sleep(1.0)

# 6. Final: optional text + complete
print("FINAL STEP:", r.text()[:300].replace("\n", " | "))
r.shot("final_step")
r.click_btn("Complete intake", required=False) or r.click_btn("Complete", required=False)
r.sleep(3.0)
r.shot("after_intake")
print("AFTER INTAKE:", r.text()[:260].replace("\n", " | "))
print("\nFINDINGS:", *r.findings, sep="\n- ")
print("CONSOLE:", r.console[:5])
r.close()
