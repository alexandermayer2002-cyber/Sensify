"""Scout 2026-11-04 part 2: the 3-NOs compliance audit walk. REPORT ONLY."""
import os, json
os.environ["QA_SHOTS"] = "/tmp/claude-0/-home-claude-sensify/1716ba7b-bc83-5816-86e9-8a544fc7cfe5/scratchpad/qa"
from robot import Robot
from pathkit import signup_or_login, ANON, SB

EMAIL = "alexandermayer2002+qa2611044scb@gmail.com"
PW = "RobotQA-2611!"

def rest(r, method, path, body=None):
    js = """async ([anon, sb, method, path, body]) => {
      const key = Object.keys(localStorage).find(k => k.endsWith('-auth-token'));
      const tok = JSON.parse(localStorage.getItem(key));
      const H = {apikey: anon, Authorization: 'Bearer ' + tok.access_token, 'Content-Type': 'application/json'};
      const uid = tok.user.id;
      const res = await fetch(sb + '/rest/v1/' + path.replace('$UID', uid), {method, headers: {...H, Prefer: 'return=representation'}, body: body ? JSON.stringify(body) : undefined});
      return {status: res.status, body: (await res.text()).slice(0, 900)};
    }"""
    return r.page.evaluate(js, [ANON, SB, method, path, body])

r = Robot("SC4B")
try:
    signup_or_login(r, EMAIL, "Scout Fournight", PW)
    r.sleep(2.0); r.wait_ready(20)
    r.shot("dash_auditcard")
    if not r.cta(r"talk"):
        print("NO LETS TALK:", r.text()[:400].replace("\n", " | "))
        raise SystemExit
    r.sleep(1.6); r.wait_ready(10)
    r.shot("audit_opening")
    r.click_btn("Okay, let's figure it out", required=False); r.sleep(1.2)
    r.shot("audit_q1")
    r.click("Food cravings", required=False); r.sleep(0.3)
    r.click("Life got in the way", required=False); r.sleep(0.3)
    r.click_btn("Continue"); r.sleep(1.4)
    r.shot("audit_cravings")
    try: r.page.locator("input").first.fill("fresh bread")
    except Exception as e: print("craving input:", str(e)[:60])
    r.sleep(0.4)
    r.click_btn("Continue"); r.sleep(1.4)
    r.shot("audit_life")
    r.click("8", exact=True, required=False); r.sleep(0.8)
    r.shot("audit_stress8")
    r.click_btn("Submit"); r.sleep(12.0)
    r.shot("audit_submitted")
    print("AUDIT_DONE:", r.text()[:700].replace("\n", " | "))
    r.click_btn("Back to dashboard", required=False); r.sleep(2.5); r.wait_ready(15)
    r.shot("dash_pending")
    t = r.text()
    print("PENDING_CARD:", "Guidance being prepared" in t or "being prepared" in t.lower())
    print("AUDITS:", rest(r, "GET", "compliance_audit?user_id=eq.$UID&select=trigger_type,status,hardest_parts,branch_responses,ai_acknowledgment&order=triggered_at.desc&limit=3"))
    # RLS probe: can the user flip their own audit status? (should be 200/zero rows)
    print("RLS_PATCH:", rest(r, "PATCH", "compliance_audit?user_id=eq.$UID&status=eq.pending_admin_review", {"status": "responded", "admin_note": "robot self-serve"}))
    print("CONSOLE_ERRORS:", json.dumps(r.console[:10]))
finally:
    r.close()
