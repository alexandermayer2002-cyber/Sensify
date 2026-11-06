"""Deploy 20 spot verification — scale anchors/flip chip, why-disabled hints,
range persistence, locked tabs, kit confirm/undo. Fresh +qa account."""
import os, re, json
os.environ["QA_SHOTS"] = "/tmp/claude-0/-home-claude-sensify/1716ba7b-bc83-5816-86e9-8a544fc7cfe5/scratchpad/qa"
from robot import Robot
from pathkit import signup_or_login, enter_intake, do_symptoms

EMAIL = "alexandermayer2002+qa2611066d20@gmail.com"
PW = "RobotQA-2611!"

r = Robot("D20")
try:
    signup_or_login(r, EMAIL, "Verify Twenty", PW)
    # Day-0 dashboard: locked tabs + kit confirm + jargon pass
    t = r.text()
    print("DAY0_COPY:", "appears here once your results are in" in t, "|", "usually within a day" in t)
    print("KIT_CARD:", "I took my test" in t)
    if r.click_btn("I took my test", required=False):
        r.sleep(0.8); t = r.text()
        print("KIT_CONFIRM_STEP:", "Just to confirm" in t and "Not yet" in t)
        r.shot("kit_confirm")
        r.click_btn("Not yet", required=False); r.sleep(0.5)
    # Reintro tab locked state
    try:
        btn = r.page.get_by_role("button", name=re.compile("^Reintro$"))
        for i in range(btn.count()):
            if btn.nth(i).is_visible(): btn.nth(i).evaluate("el => el.click()"); break
        r.sleep(1.5); t = r.text()
        print("REINTRO_LOCKED:", "Reintroduction unlocks later" in t)
        r.shot("locked_reintro")
        r.click_btn("Back to Home", required=False); r.sleep(1.2)
    except Exception as e: print("reintro tab:", str(e)[:60])
    # Intake: consent hint, step hints, scale anchors
    enter_intake(r, "Verify Twenty")
    t = r.text()
    if "To continue:" in t:
        print("CONSENT_HINT:", True)
    if "What are you hoping" in r.text():
        r.click("Digestive health"); r.click_btn("Continue"); r.sleep(1.2)
    if "Tell us about" in r.text():
        t = r.text()
        print("STEP2_HINT:", "still need" in t)
        r.shot("step2_hint")
        do_symptoms(r, [("Daily", 0), ("After specific foods", 0), ("A few times a week", 1),
                        ("Occasionally", 1), ("Often irregular or uncomfortable", 0), ("More than 3 years", 0)])
    if "In a typical week" in r.text():
        t = r.text()
        print("FLIP_CHIP:", "runs the other way" in t)
        r.shot("scale_anchors")
        # answer all scales with 6
        n = r.page.get_by_role("button", name=re.compile("^6$")).count()
        for i in range(n):
            try: r.page.get_by_role("button", name=re.compile("^6$")).nth(i).click(timeout=2200); r.sleep(0.15)
            except Exception: pass
        r.click_btn("Continue", required=False); r.sleep(1.2)
    # food freq step -> skip through quickly
    from pathkit import do_freq
    do_freq(r, [("Cow Milk", "Daily"), ("Wheat", "3–5x/week")])
    if "how many hours do you sleep" in r.text():
        # enter an absurd sleep value, close the pad, check persistent warning + missing list
        if r.click("Tap to enter", required=False):
            r.numpad("75")  # numpad ✓ won't close (out of range) — close by toggling the field
        r.click("75 hours", required=False) or r.page.get_by_text("75", exact=False).first.click()
        r.sleep(0.8)
        t = r.text()
        print("RANGE_PERSIST:", "doesn't look right" in t)
        print("STEP5_MISSING_LIST:", "Still needed:" in t)
        r.shot("step5_warnings")
    print("CONSOLE:", json.dumps(r.console[:6]))
finally:
    r.close()
