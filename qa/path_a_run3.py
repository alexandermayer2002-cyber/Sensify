from robot import Robot
import re

r = Robot("A")
NAME, EMAIL, PW = "Fable One", "alexandermayer2002+fable1@gmail.com", "RobotTester!2026"

def nthclick(label, nth, exact=True):
    try:
        r.page.get_by_text(label, exact=exact).nth(nth).click(timeout=4000); r.sleep(0.25); return True
    except Exception as e:
        r.find(f"[A] nthclick {label!r}#{nth}: {str(e)[:60]}"); return False

def dump(tag):
    print(f"--{tag}--:", r.text()[:300].replace("\n", " | ")); r.shot(tag)

r.login(EMAIL, PW); r.sleep(2.2)

# From dashboard setup card into intake
if "Start your intake survey" in r.text():
    r.click("Start your intake survey"); r.sleep(1.5)
if "Before you begin" in r.text():
    r.consent(NAME)
if "What are you hoping" in r.text():
    r.click("Digestive health"); r.click("Energy & clarity")
    r.click_btn("Continue"); r.sleep(1.2)

# Step 2 — deterministic persona answers (occurrence-indexed)
if "Tell us about" in r.text():
    plan = [("A few times a week",0), ("After specific foods",0), ("Occasionally",0),
            ("Occasionally",1), ("Inconsistent",0), ("1–3 years",0),
            ("Often tired",0), ("A few times a week",2), ("Occasionally",2),
            ("Okay but not great",0), ("1–3 years",1)]
    for label, nth in plan: nthclick(label, nth)
    r.shot("s2_answered")
    ok = r.click_btn("Continue", required=False)
    if not ok:
        dump("s2_blocked")
r.sleep(1.2)

# Step 3 — baselines: value per scale, scale order fixed
if "In a typical week" in r.text():
    vals = ["6", "5", "4", "5", "4", "5", "5", "5", "5"]
    n = r.text().count("In a typical week")
    print("scales:", n)
    for i in range(n):
        v = vals[i % len(vals)]
        try:
            r.page.get_by_role("button", name=re.compile(f"^{v}$")).nth(i).click(timeout=3000); r.sleep(0.2)
        except Exception as e:
            r.find(f"[A] scale {i} val {v}: {str(e)[:60]}")
    r.shot("s3_baselines")
    r.click_btn("Continue", required=False) or dump("s3_blocked")
r.sleep(1.2)

# Step 4 — lifestyle: dump first, then generic handling
dump("s4_lifestyle")
for _ in range(4):
    if not r.click("Tap to enter", required=False): break
    r.numpad("7"); r.sleep(0.5)
for band in ["Moderate", "7–8 hours", "6–8 glasses", "About right", "Some days", "Female", "Prefer not to say", "1–2 drinks", "Rarely", "None"]:
    r.click(band, exact=True, required=False)
r.shot("s4_done")
r.click_btn("Continue", required=False) or dump("s4_blocked")
r.sleep(1.2)

# Step 5 — final notes + complete
dump("s5_final")
r.click_btn("Complete intake", required=False) or r.click_btn("Complete", required=False)
r.sleep(3.0)
dump("after_intake")

# Lab entry: the none-sensitivities card
if "Start your intake survey" not in r.text():
    for cta in ["Enter your results", "Enter results", "Add your results", "Enter my results", "lab results"]:
        if r.click(cta, exact=False, required=False): break
    r.sleep(1.5)
    dump("lab_entry")
r.close()
