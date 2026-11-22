"""Critic C 2026-11-22: reintro + ask live walk on a fresh +qa..C account. REPORT-ONLY."""
import sys, json, datetime, re
sys.path.insert(0, '/home/claude/sensify/qa')
from robot import Robot
from pathkit import signup_or_login, nav_tab
import fleetkit as fk

EMAIL = "alexandermayer2002+qa2611221300C@gmail.com"
r = Robot("CC")
out = {}
def S(tag, n=2500):
    out[tag] = r.snap(tag, n); print("==", tag, "\n", out[tag][:n], "\n")
try:
    signup_or_login(r, EMAIL, "Critic C", fk.PW)
    t = r.text()
    if "Start your intake survey" in t or "Upload your lab results" in t:
        fk.seed(r, "reintro", EMAIL)
    fk.gate(r)
    # Ask
    nav_tab(r, "Ask"); r.sleep(2.2); r.wait_ready(12)
    S("ask_landing", 1500)
    def ask(q, tag, wait=25):
        box = r.page.locator("textarea, input[type='text']").last
        box.fill(q); r.sleep(0.4)
        sent = False
        for sel in ["button:has-text('Send')", "button[aria-label*='end']"]:
            try: r.page.locator(sel).last.click(timeout=2500); sent = True; break
            except Exception: pass
        if not sent: box.press("Enter")
        r.sleep(wait); r.wait_ready(10); S(tag, 3000)
    ask("Is eight weeks really enough, and can this hurt me?", "ask_enough")
    ask("If I quit, can I get my data and have it deleted?", "ask_quit")
    ask("Can I have cheddar pizza tonight?", "ask_cheddar")
finally:
    json.dump({"findings": r.findings, "console": r.console[:8], **out}, open("/home/claude/sensify/qa/probes_C_ask.json", "w"), indent=1)
    r.close()
