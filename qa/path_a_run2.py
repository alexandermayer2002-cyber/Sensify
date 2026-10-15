from robot import Robot
import re

r = Robot("A")
NAME, EMAIL, PW = "Fable One", "alexandermayer2002+fable1@gmail.com", "RobotTester!2026"
r.login(EMAIL, PW)
r.sleep(2.0)

# Resume: whatever step we're on
body = r.text()
if "Before you begin" in body: r.consent(NAME)
if "What are you hoping" in r.text():
    r.click("Digestive health"); r.click("Energy & clarity"); r.click_btn("Continue"); r.sleep(1.0)

# ---- Step 2: persona Q->A ----
if "Tell us about" in r.text():
    qa = [
        ("How often do you experience bloating?", "A few times a week"),
        ("When does bloating typically happen?", "After specific foods"),
        ("gas or cramping", "Occasionally"),
        ("reflux or heartburn", "Occasionally"),
        ("digestion regularity", "Inconsistent"),
        ("dealing with digestive symptoms", "1–3 years"),
        ("overall fatigue levels", "Often tired"),
        ("brain fog or difficulty", "A few times a week"),
        ("afternoon energy crashes", "Occasionally"),
        ("sleep quality", "Okay but not great"),
        ("low energy or brain fog", "1–3 years"),
    ]
    for q, a in qa: r.answer(q, a)
    r.shot("questions_answered")
    r.click_btn("Continue") ; r.sleep(1.2)

# ---- Step 3: baselines — per-scale 6/5 values ----
if "In a typical week" in r.text():
    scales = [
        ("rate your bloating", "6"), ("rate your gas", "5"), ("reflux", "4"),
        ("digestion", "5"), ("rate your energy", "4"), ("mental clarity", "5"),
        ("afternoon energy", "4"), ("sleep quality", "5"), ("overall wellbeing", "5"),
    ]
    for ssub, v in scales:
        try:
            x = f"xpath=//*[contains(normalize-space(.), {ssub!r}) and contains(normalize-space(.), 'typical week') and not(.//*[contains(normalize-space(.), 'typical week')])]/following::button[normalize-space(text())={v!r}][1]"
            r.page.locator(x).first.click(timeout=2500); r.sleep(0.2)
        except Exception:
            pass  # scale not present for this persona — fine
    r.shot("baselines_answered")
    r.click_btn("Continue", required=False) or (r.find("[A] baselines still blocked: " + r.text()[:250].replace("\\n"," | ")), r.shot("bstuck2"))
    r.sleep(1.2)

print("STEP NOW:", r.text()[:260].replace("\n", " | "))
r.shot("step4_view")
r.close()
