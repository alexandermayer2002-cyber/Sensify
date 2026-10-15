"""PATH 1 — Foods flagged -> standard track. Robot +fable2.
Persona 'Jordan': daily bloating 3+ years, worst after meals."""
from robot import Robot
import re, json, sys

r = Robot("P1")
NAME, EMAIL, PW = "Fable Two", "alexandermayer2002+fable2@gmail.com", "RobotTester!2026"
report = {"screens": {}, "shots": []}

def S(tag):
    report["screens"][tag] = r.snap(tag, 700)
    report["shots"].append(r.shot(tag))

try:
    r.goto(); r.click("Sign in"); r.sleep(1.2)
    r.fill_ph("you@email.com", EMAIL)
    r.fill_ph("••••••••", PW)
    r.click_btn("Sign"); r.sleep(2.0); r.wait_ready()
    if "Invalid" in r.text() or "Sign in to continue" in r.text():
        print(">> no account yet, signing up")
        r.click("Continue here"); r.sleep(1.0)
        r.fill_ph("you@email.com", EMAIL)
        r.click_btn("Continue"); r.sleep(1.8)
        r.fill_ph("Sarah Chen", NAME)
        r.fill_ph("At least 8 characters", PW)
        r.fill_ph("Re-enter your password", PW)
        r.click_btn("Create"); r.sleep(2.0); r.wait_ready()
    S("entry")

    print("NAV: setup card present:", "Start your intake survey" in r.text())
    if "Start your intake survey" in r.text():
        for k in range(3):
            try:
                r.page.get_by_text("Start intake survey", exact=False).last.click(timeout=4000)
                print(f"NAV click {k}: ok")
            except Exception as e:
                print(f"NAV click {k} err:", str(e)[:100])
            r.sleep(1.2); r.wait_ready(12)
            print(f"NAV after {k}:", r.text()[:60].replace(chr(10), " | "))
            if "Before you begin" in r.text() or "What are you hoping" in r.text(): break
    if "Before you begin" in r.text():
        r.consent(NAME); S("post_consent")

    if "What are you hoping" in r.text():
        r.click("Digestive health")
        S("categories"); r.click_btn("Continue"); r.sleep(1.2)

    if "Tell us about" in r.text():
        plan = [("Daily", 0), ("After specific foods", 0), ("A few times a week", 1),
                ("Occasionally", 1), ("Often irregular or uncomfortable", 0), ("More than 3 years", 0)]
        for label, nth in plan:
            try: r.page.get_by_text(label, exact=True).nth(nth).click(timeout=3500); r.sleep(0.25)
            except Exception as e: r.find(f"[P1] s2 {label}#{nth}: {str(e)[:60]}")
        S("symptoms_answered")
        r.click_btn("Continue", required=False) or S("s2_blocked")
        r.sleep(1.2)

    for _ in range(2):
        body = r.text()
        if "How often do you eat" in body:
            for food, opt in [("Beef", "3–5x/week"), ("Egg Yolk", "Daily"), ("Avocado", "3–5x/week"),
                              ("Crab", "Rarely"), ("Shrimp", "1–2x/week"), ("Rice", "1–2x/week")]:
                r.xclick(food, opt, required=False)
            S("food_frequency")
            r.click_btn("Continue", required=False) or S("freq_blocked")
            r.sleep(1.2)
        elif "In a typical week" in body:
            n = body.count("In a typical week"); print("scales:", n)
            vals = ["7", "6", "4", "6", "5", "5", "5"]
            for i in range(n):
                try: r.page.get_by_role("button", name=re.compile(f"^{vals[i % len(vals)]}$")).nth(i).click(timeout=2600); r.sleep(0.2)
                except Exception as e: r.find(f"[P1] scale{i}: {str(e)[:50]}")
            S("baselines")
            r.click_btn("Continue", required=False) or S("baselines_blocked")
            r.sleep(1.2)
        else:
            break

    if "how many hours do you sleep" in r.text():
        S("lifestyle_raw")
        # sleep hours: open pad, clear if possible, type 7
        fld = r.page.get_by_text("hours", exact=False).first
        try:
            if "Tap to enter" in r.text(): r.click("Tap to enter")
            else: fld.click()
            r.sleep(0.5)
            for _ in range(3): r.click("\u2190", exact=True, required=False) or r.click("\u232b", exact=True, required=False)
            r.numpad("7")
        except Exception as e:
            r.find(f"[P1] sleep pad: {str(e)[:60]}")
        # water cups
        if r.click("Tap to enter", required=False): r.numpad("6")
        r.xclick("usual stress level", "Moderate")
        r.xclick("What's your sex", "Female")
        r.xclick("Do you drink alcohol", "No")
        S("lifestyle_done")
        r.click_btn("Complete intake", required=False) or r.click_btn("Continue", required=False) or S("lifestyle_blocked")
        r.sleep(3.0)

    r.wait_ready(); S("after_intake")

    # ---------- LAB ENTRY: rigged flagged results ----------
    if "lab" in r.text().lower() or "results" in r.text().lower():
        r.cta(r"upload|enter|results")
        r.sleep(1.5); r.wait_ready(10)
    S("lab_screen")
    r.click("Manual entry", exact=True, required=False); r.sleep(1.0)
    if "pick the sensitivity level" in r.text() or "tap its level" in r.text():
        rig = [("Beef", "High"), ("Egg Yolk", "Moderate"), ("Avocado", "High"), ("Crab", "Low")]
        for food, level in rig:
            r.fill_ph("Search foods", food); r.sleep(0.9)
            r.xclick(food, level, required=True); r.sleep(0.5)
        S("lab_rigged")
        r.cta(r"submit for review")
        r.sleep(1.5); r.wait_ready(10)
        S("lab_readback")
        r.cta(r"confirm|submit|looks right|save")
        r.sleep(3.0); r.wait_ready()
        S("post_lab")
        # the bypass should have auto-approved: reload home
        r.goto(); r.sleep(2.0); r.wait_ready()
        S("home_after_approval")

finally:
    with open("p1_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:10], **report}, f, indent=1)
    r.close()
