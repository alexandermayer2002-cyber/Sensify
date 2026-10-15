"""Probe: enter +fable1 intake step 2, apply plan, dump answered-state per question."""
from robot import Robot
from pathkit import *
import json

r = Robot("PROBE")
EMAIL, NAME, PW = "alexandermayer2002+fable1@gmail.com", "Fable One", "RobotTester!2026"
try:
    signup_or_login(r, EMAIL, NAME, PW)
    enter_intake(r, NAME)
    if "What are you hoping" in r.text():
        print("goals screen:", r.text()[:400].replace("\n", " | "))
        r.click("Digestive health"); r.click("Energy & clarity"); r.click_btn("Continue"); r.sleep(1.2)
    plan = [("A few times a week",0), ("After specific foods",0), ("Occasionally",0),
            ("Occasionally",1), ("Inconsistent",0), ("1–3 years",0),
            ("Often tired",0), ("A few times a week",3), ("Occasionally",2),
            ("Okay but not great",0), ("1–3 years",1)]
    for label, nth in plan:
        try:
            r.page.get_by_text(label, exact=True).nth(nth).click(timeout=3500); r.sleep(0.2)
        except Exception as e:
            print(f"CLICK FAIL {label}#{nth}: {str(e)[:80]}")
    state = r.page.evaluate("""() => {
      const cards = [...document.querySelectorAll('div')].filter(d =>
        d.style && d.style.borderRadius === '14px' && d.querySelector('button'));
      const out = [];
      for (const c of cards) {
        const label = c.querySelector('div')?.innerText?.slice(0, 60) || '?';
        const btns = [...c.querySelectorAll('button')];
        if (!btns.length) continue;
        const sel = btns.filter(b => b.style.background.includes('61, 92, 60') || b.style.backgroundColor === 'rgb(61, 92, 60)');
        out.push({q: label, answered: sel.map(b => b.innerText), n: btns.length});
      }
      const cta = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'Continue');
      return {cards: out, ctaDisabled: cta ? cta.disabled : 'no-cta'};
    }""")
    print(json.dumps(state, indent=1))
finally:
    r.close()
