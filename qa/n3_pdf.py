"""NIGHT 3 item 27: the PDF upload path. +fable9 uploads a realistic lab report
(VitaPanel, 4 flagged foods) and the AI extraction builds the list."""
from robot import Robot
from pathkit import *
import re, json, os

r = Robot("N3P")
EMAIL, NAME, PW = "alexandermayer2002+fable9@gmail.com", "Fable Nine", "RobotTester!2026"
PDF = os.path.abspath("vitapanel_report.pdf")
report = {"screens": {}, "shots": []}
def S(tag, n=1800):
    report["screens"][tag] = r.snap(tag, n); report["shots"].append(r.shot(tag))

try:
    signup_or_login(r, EMAIL, NAME, PW)
    if "Start your intake survey" in r.text():
        enter_intake(r, NAME)
        if "What are you hoping" in r.text():
            r.click("Digestive health"); r.click_btn("Continue"); r.sleep(1.2)
        if "Tell us about" in r.text():
            plan = [("Daily",0), ("After specific foods",0), ("A few times a week",1),
                    ("Occasionally",1), ("Often irregular or uncomfortable",0), ("More than 3 years",0)]
            do_symptoms(r, plan)
        if "In a typical week" in r.text():
            do_baselines(r, ["6","5","5","5"])
        do_freq(r, [("Beef","3–5x/week"), ("Cow Milk","Daily"), ("Tomato","3–5x/week"), ("Almond","Rarely")])
        do_lifestyle(r, sex="Male")
    if "Upload your lab results" in r.text() or "ACTION NEEDED" in r.text():
        r.cta(r"Upload results"); r.sleep(1.6); r.wait_ready(12)
        S("n3p_lab_entry", 1600)
        # the upload path: Upload PDF tab should be default; set the file input
        try:
            r.page.locator("input[type='file']").first.set_input_files(PDF)
            r.sleep(1.2)
            S("n3p_file_attached", 1400)
        except Exception as e:
            r.note(f"[N3P] file input: {str(e)[:100]} | " + r.text()[:200].replace(chr(10), " | "))
        r.cta(r"Read my results")
        # extraction is an AI call; poll up to 60s
        for _ in range(30):
            if "extracted" in r.text().lower() or "processing" not in r.text().lower():
                if "extracted" in r.text().lower(): break
            r.sleep(2.0)
        r.sleep(2.0)
        S("n3p_extraction", 2400)   # expect: Beef High, Cow Milk Moderate, Tomato Low, Almond Low
        r.cta(r"Looks right, submit for review|submit for review")
        r.sleep(3.0); r.wait_ready(20)
        S("n3p_post_submit", 1400)
        r.goto(); r.sleep(2.5); r.wait_ready(25)
        S("n3p_home_after", 2000)   # flagged auto-approve: avoiding list should show the 4 foods
finally:
    with open("n3p_report.json", "w") as f:
        json.dump({"findings": r.findings, "console": r.console[:8], **report}, f, indent=1)
    r.close()
