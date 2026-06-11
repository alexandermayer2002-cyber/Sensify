import React, { useState } from 'react'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Fraunces:ital,wght@0,300;0,500;1,300&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --sage: #3D5C3C; --sage-light: #EDF3ED; --sage-mid: #8BAE8A;
    --cream: #FAF8F4; --warm: #FFFFFF; --charcoal: #1C1C1C; --muted: #7A7A72;
    --border: rgba(0,0,0,0.07); --amber: #D4894A; --amber-light: #FDF2EA;
    --red: #C95B5B; --red-light: #FAEAEA; --green: #4A8C6A; --green-light: #EAF4EE;
  }
  body { font-family: 'DM Sans', sans-serif; color: #1C1C1C; background: #FAF8F4; }

  .mk-nav {
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(0,0,0,0.07);
    padding: 0 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    position: sticky;
    top: 0;
    z-index: 100;
  }
  .mk-logo { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 500; color: #1C1C1C; letter-spacing: -0.3px; }
  .mk-logo em { color: #3D5C3C; font-style: italic; }
  .mk-tabs { display: flex; gap: 2px; }
  .mk-tab { font-size: 13px; font-weight: 400; color: #7A7A72; padding: 6px 12px; border: none; background: none; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: color 0.15s; letter-spacing: -0.1px; border-bottom: 2px solid transparent; }
  .mk-tab.active { color: #1C1C1C; font-weight: 500; border-bottom: 2px solid #3D5C3C; }
  .mk-tab:hover:not(.active) { color: #1C1C1C; }
  .mk-tab:hover:not(.active) { color: #1C1C1C; }
  .mk-nav-right { display: flex; align-items: center; gap: 8px; }
  .mk-signin { font-size: 13px; color: #1C1C1C; background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; font-weight: 500; padding: 8px 12px; }
  .mk-signin:hover { color: #3D5C3C; }
  .mk-cta { background: #3D5C3C; color: white; border: none; border-radius: 9px; padding: 9px 20px; font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500; cursor: pointer; transition: opacity 0.15s; letter-spacing: -0.1px; }
  .mk-cta:hover { opacity: 0.87; }

  .mk-hero { padding: 88px 64px 80px; background: #FFFFFF; border-bottom: 1px solid rgba(0,0,0,0.07); }
  .mk-hero-inner { max-width: 960px; margin: 0 auto; }
  .mk-tag { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 500; color: #3D5C3C; background: #EDF3ED; padding: 5px 13px; border-radius: 20px; margin-bottom: 28px; }
  .mk-tag-dot { width: 6px; height: 6px; border-radius: 50%; background: #3D5C3C; flex-shrink: 0; }
  .mk-h1 { font-family: 'Fraunces', serif; font-size: 58px; font-weight: 300; line-height: 1.06; margin-bottom: 22px; letter-spacing: -1px; max-width: 680px; }
  .mk-h1 em { font-style: italic; color: #3D5C3C; }
  .mk-sub { font-size: 18px; color: #7A7A72; line-height: 1.72; margin-bottom: 40px; max-width: 520px; }
  .mk-three { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 36px; max-width: 580px; }
  .mk-3c { background: #FAF8F4; border-radius: 13px; padding: 16px; }
  .mk-3n { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 300; color: #3D5C3C; margin-bottom: 6px; }
  .mk-3t { font-size: 13px; font-weight: 500; margin-bottom: 4px; }
  .mk-3d { font-size: 12px; color: #7A7A72; line-height: 1.6; }
  .mk-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 36px; }
  .btn-p { background: #3D5C3C; color: white; border: none; border-radius: 10px; padding: 14px 26px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: opacity 0.15s; }
  .btn-p:hover { opacity: 0.87; }
  .btn-g { background: none; color: #1C1C1C; border: 1.5px solid rgba(0,0,0,0.12); border-radius: 10px; padding: 13px 22px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
  .btn-g:hover { border-color: #3D5C3C; color: #3D5C3C; }
  .mk-proof { display: flex; align-items: center; gap: 20px; padding-top: 32px; border-top: 1px solid rgba(0,0,0,0.07); flex-wrap: wrap; }
  .mk-proof-num { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 300; line-height: 1; }
  .mk-proof-label { font-size: 11px; color: #7A7A72; margin-top: 2px; }
  .mk-proof-div { width: 1px; height: 38px; background: rgba(0,0,0,0.08); }

  .mk-section { padding: 72px 64px; border-bottom: 1px solid rgba(0,0,0,0.07); max-width: 100%; }
  .mk-section-inner { max-width: 960px; margin: 0 auto; }
  .mk-section.alt { background: #FFFFFF; }
  .ey { font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: #3D5C3C; margin-bottom: 14px; }
  .sh { font-family: 'Fraunces', serif; font-size: 38px; font-weight: 300; line-height: 1.2; margin-bottom: 16px; letter-spacing: -0.5px; }
  .sh em { font-style: italic; color: #3D5C3C; }
  .ss { font-size: 16px; color: #7A7A72; line-height: 1.78; max-width: 560px; margin-bottom: 40px; }

  .dark-strip { background: #1C1C1C; border-radius: 16px; padding: 36px; margin-bottom: 36px; }
  .ds-label { font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: rgba(255,255,255,0.3); margin-bottom: 20px; }
  .ds-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; background: rgba(255,255,255,0.07); border-radius: 11px; overflow: hidden; }
  .ds-step { background: #1C1C1C; padding: 20px; }
  .ds-sl { font-size: 10px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; color: #8BAE8A; margin-bottom: 7px; }
  .ds-st { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 300; color: white; margin-bottom: 6px; }
  .ds-sd { font-size: 12px; color: rgba(255,255,255,0.42); line-height: 1.65; }

  .outcome-list { display: flex; flex-direction: column; gap: 10px; max-width: 460px; }
  .outcome-row { display: flex; align-items: center; gap: 14px; border-radius: 12px; padding: 15px 18px; }
  .outcome-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

  .how-steps { display: flex; flex-direction: column; }
  .how-step { display: flex; gap: 28px; padding: 28px 0; border-bottom: 1px solid rgba(0,0,0,0.06); align-items: flex-start; }
  .how-step:last-child { border-bottom: none; }
  .how-n { font-family: 'Fraunces', serif; font-size: 52px; font-weight: 300; color: #EDF3ED; line-height: 1; flex-shrink: 0; width: 64px; }
  .how-content { padding-top: 8px; }
  .how-title { font-size: 16px; font-weight: 500; margin-bottom: 6px; color: #1C1C1C; }
  .how-desc { font-size: 14px; color: #7A7A72; line-height: 1.75; margin-bottom: 0; }
  .how-tag { display: inline-flex; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: #3D5C3C; background: #EDF3ED; padding: 3px 9px; border-radius: 20px; margin-bottom: 8px; }
  .how-tag.amber { color: #D4894A; background: #FDF2EA; }

  .sci-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .sci-card { background: #FAF8F4; border-radius: 14px; padding: 22px; }
  .sci-icon { width: 36px; height: 36px; border-radius: 11px; background: #EDF3ED; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
  .sci-t { font-size: 14px; font-weight: 500; margin-bottom: 7px; }
  .sci-d { font-size: 13px; color: #7A7A72; line-height: 1.7; }

  .pricing-wrap { max-width: 440px; }
  .pricing-card { background: #FFFFFF; border: 2px solid #3D5C3C; border-radius: 18px; padding: 32px; }
  .price-tag { font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: #3D5C3C; margin-bottom: 10px; }
  .price-num { font-family: 'Fraunces', serif; font-size: 54px; font-weight: 300; line-height: 1; margin-bottom: 6px; letter-spacing: -1px; }
  .price-sub { font-size: 13px; color: #7A7A72; margin-bottom: 22px; }
  .price-div { height: 1px; background: rgba(0,0,0,0.07); margin: 22px 0; }
  .price-item { display: flex; align-items: flex-start; gap: 11px; margin-bottom: 12px; font-size: 13px; line-height: 1.5; }
  .p-check { width: 19px; height: 19px; background: #EDF3ED; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
  .price-note { font-size: 12px; color: #7A7A72; margin-top: 16px; line-height: 1.65; padding-top: 16px; border-top: 1px solid rgba(0,0,0,0.07); }

  .faq-list { max-width: 620px; }
  .faq-item { border-bottom: 1px solid rgba(0,0,0,0.07); cursor: pointer; }
  .faq-item:first-child { border-top: 1px solid rgba(0,0,0,0.07); }
  .faq-q { font-size: 15px; font-weight: 500; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 22px 0; line-height: 1.4; }
  .faq-a { font-size: 14px; color: #7A7A72; line-height: 1.78; padding-bottom: 22px; }
  .faq-plus { font-size: 22px; color: #7A7A72; flex-shrink: 0; font-weight: 300; line-height: 1; }

  .cta-section { padding: 80px 64px; text-align: center; background: #FFFFFF; border-top: 1px solid rgba(0,0,0,0.07); }
  .cta-section h2 { font-family: 'Fraunces', serif; font-size: 36px; font-weight: 300; margin-bottom: 14px; letter-spacing: -0.5px; }
  .cta-section h2 em { font-style: italic; color: #3D5C3C; }
  .cta-section p { font-size: 15px; color: #7A7A72; margin-bottom: 28px; }

  .mk-footer { padding: 36px 64px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(0,0,0,0.07); background: #FFFFFF; }
  .mk-footer-logo { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 500; color: #1C1C1C; }
  .mk-footer-logo em { color: #3D5C3C; font-style: italic; }
  .mk-footer-note { font-size: 12px; color: #7A7A72; }
  .mk-footer-links { display: flex; gap: 20px; }
  .mk-footer-link { font-size: 12px; color: #7A7A72; cursor: pointer; }
  .mk-footer-link:hover { color: #1C1C1C; }

  .prob-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 40px; }
  .prob-card { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 14px; padding: 20px; }
  .prob-t { font-size: 14px; font-weight: 500; margin-bottom: 7px; }
  .prob-d { font-size: 13px; color: #7A7A72; line-height: 1.65; }
`

const FAQS = [
  { q: 'Do I need to already have a lab test?', a: 'No. When you purchase the program we guide you through ordering your food sensitivity test during onboarding. We tell you exactly which test to get and how to do it from home.' },
  { q: 'What makes Sensify different from just buying a test?', a: 'A lab test gives you a list. Sensify takes that list and runs each food through a controlled 14-day reintroduction cycle with daily compliance tracking — so by the end you know for certain what your body does and doesn\'t tolerate. The test finds the suspects. Sensify simplifies the truth.' },
  { q: 'How does the daily text check-in work?', a: 'Every evening at your chosen time we send you a text — just reply YES if you stayed on plan or NO if something came up. YES builds your streak. NO triggers a quick slip-up log in the app. Three consecutive NOs triggers a personalized compliance conversation reviewed by our team.' },
  { q: 'Is this a medical diagnosis?', a: 'No. Sensify is a wellness and educational program. It does not diagnose, treat, or cure any medical condition. If you have serious symptoms, always consult a licensed healthcare provider.' },
  { q: 'How accurate are IgG food sensitivity tests?', a: 'IgG tests measure immune reactivity, not confirmed intolerance. We treat your results as a starting hypothesis. The real evidence comes from the elimination and reintroduction protocol — that\'s why the protocol is the product, not the test.' },
  { q: 'What if I don\'t see improvement during elimination?', a: 'The AI monitors your symptom trends weekly and flags when improvement isn\'t occurring. We investigate compliance, hidden ingredients, and stress — and our team reviews the situation personally before any plan changes are recommended.' },
  { q: 'How much time does it take each week?', a: 'The daily text takes 1 second to reply to. The weekly check-in takes about 2 minutes. During reintroduction cycles you\'ll spend a few extra minutes logging symptoms. Built to fit into normal life.' },
  { q: 'What happens after 6 months?', a: 'You receive your completed Food Map — permanent, personalized, yours to keep forever. You can also continue with our Maintain plan for ongoing symptom tracking, meal logging against your Food Map, and annual retesting.' },
]

function Faq() {
  const [open, setOpen] = useState(null)
  return (
    <div className="faq-list">
      {FAQS.map((f, i) => (
        <div key={i} className="faq-item" onClick={() => setOpen(open === i ? null : i)}>
          <div className="faq-q">{f.q}<span className="faq-plus">{open === i ? '×' : '+'}</span></div>
          {open === i && <div className="faq-a">{f.a}</div>}
        </div>
      ))}
    </div>
  )
}

const Footer = () => (
  <div className="mk-footer">
    <div className="mk-footer-logo">sensi<em>fy</em></div>
    <div className="mk-footer-note">Wellness program only. Not medical advice.</div>
    <div className="mk-footer-links">
      <span className="mk-footer-link">Privacy</span>
      <span className="mk-footer-link">Terms</span>
      <span className="mk-footer-link">Contact</span>
    </div>
  </div>
)

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
)

export default function Marketing({ onGetStarted, onSignIn }) {
  const [tab, setTab] = useState('home')

  const tabs = ['home', 'how', 'science', 'pricing', 'faq']

  const Nav = () => (
    <nav className="mk-nav">
      <div className="mk-logo">sensi<em>fy</em></div>
      <div className="mk-tabs">
        {tabs.map(t => (
          <button key={t} className={`mk-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t === 'home' ? 'Home' : t === 'how' ? 'How it works' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="mk-nav-right">
        <button className="mk-signin" onClick={onSignIn}>Sign in</button>
        <button className="mk-cta" onClick={onGetStarted}>Get started</button>
      </div>
    </nav>
  )

  if (tab === 'home') return (
    <div>
      <style>{css}</style>
      <Nav />
      <div className="mk-hero">
        <div className="mk-hero-inner">
          <div className="mk-tag"><div className="mk-tag-dot"></div>Physician-reviewed · AI-guided · 6 months</div>
          <div className="mk-h1">The complete system for finding your <em>food triggers.</em></div>
          <div className="mk-sub">Sensitivity meets simplicity. Sensify guides you from test to answers — with a personal Food Map that tells you exactly what your body can and can't handle.</div>
          <div className="mk-three">
            <div className="mk-3c"><div className="mk-3n">01</div><div className="mk-3t">The test</div><div className="mk-3d">Order your certified food sensitivity test. We guide you to the right one.</div></div>
            <div className="mk-3c"><div className="mk-3n">02</div><div className="mk-3t">The protocol</div><div className="mk-3d">6-month AI-guided elimination and reintroduction program with daily check-ins.</div></div>
            <div className="mk-3c"><div className="mk-3n">03</div><div className="mk-3t">The answers</div><div className="mk-3d">A personal Food Map based on how your body actually responds.</div></div>
          </div>
          <div className="mk-actions">
            <button className="btn-p" onClick={onGetStarted}>Start your program — $199</button>
            <button className="btn-g" onClick={() => setTab('how')}>See how it works</button>
          </div>
          <div className="mk-proof">
            <div><div className="mk-proof-num">6mo</div><div className="mk-proof-label">Guided program</div></div>
            <div className="mk-proof-div"></div>
            <div><div className="mk-proof-num">AI</div><div className="mk-proof-label">Weekly insights</div></div>
            <div className="mk-proof-div"></div>
            <div><div className="mk-proof-num">Daily</div><div className="mk-proof-label">SMS check-ins</div></div>
            <div className="mk-proof-div"></div>
            <div><div className="mk-proof-num">MD</div><div className="mk-proof-label">Reviewed protocol</div></div>
          </div>
        </div>
      </div>

      <div className="mk-section">
        <div className="mk-section-inner">
          <div className="ey">The problem</div>
          <div className="sh">Most people suspect food.<br />Almost none ever <em>confirm it.</em></div>
          <div className="ss">Food sensitivity tests are more accessible than ever. But buying a test is easy — knowing what to do with it isn't. Without a structured process, most people eliminate a few things, feel slightly better, give up, and never get real answers.</div>
          <div className="prob-grid">
            <div className="prob-card"><div className="prob-t">Tests are easy to buy</div><div className="prob-d">But most people who buy a food sensitivity test never follow a proper elimination protocol.</div></div>
            <div className="prob-card"><div className="prob-t">Guessing doesn't work</div><div className="prob-d">Randomly cutting foods with no structure gives you no signal. You don't know what's helping.</div></div>
            <div className="prob-card"><div className="prob-t">No accountability</div><div className="prob-d">No daily check-ins, no AI tracking your symptoms, no verdicts at the end. Just a list and good luck.</div></div>
          </div>
          <div className="dark-strip">
            <div className="ds-label">The Sensify system</div>
            <div className="ds-grid">
              <div className="ds-step"><div className="ds-sl">Step 1</div><div className="ds-st">Test</div><div className="ds-sd">Order your certified food sensitivity test. Upload results. AI reads them in seconds.</div></div>
              <div className="ds-step"><div className="ds-sl">Step 2</div><div className="ds-st">Protocol</div><div className="ds-sd">6 months of structured elimination and daily compliance tracking. AI watches your symptoms every week.</div></div>
              <div className="ds-step"><div className="ds-sl">Step 3</div><div className="ds-st">Answers</div><div className="ds-sd">Your personal Food Map. Safe, Limit, Avoid — earned through real-world testing, not lab guesswork.</div></div>
            </div>
          </div>
        </div>
      </div>

      <div className="mk-section alt">
        <div className="mk-section-inner">
          <div className="ey">The outcome</div>
          <div className="sh">A Food Map that's <em>actually earned.</em></div>
          <div className="ss">No food gets labeled Safe without being tested. No food gets labeled Avoid without structured evidence. Every category is earned through 6 months of real experimentation.</div>
          <div className="outcome-list">
            <div className="outcome-row" style={{ background: '#EAF4EE' }}><div className="outcome-dot" style={{ background: '#4A8C6A' }}></div><div><div style={{ fontSize: '13px', fontWeight: 500, color: '#4A8C6A', marginBottom: '3px' }}>Safe — tested and confirmed</div><div style={{ fontSize: '12px', color: '#4A8C6A', opacity: 0.85 }}>Reintroduced, monitored, tolerated. Eat freely.</div></div></div>
            <div className="outcome-row" style={{ background: '#FDF2EA' }}><div className="outcome-dot" style={{ background: '#D4894A' }}></div><div><div style={{ fontSize: '13px', fontWeight: 500, color: '#D4894A', marginBottom: '3px' }}>Limit — dose-sensitive</div><div style={{ fontSize: '12px', color: '#D4894A', opacity: 0.85 }}>Fine in small amounts. Worth being mindful of.</div></div></div>
            <div className="outcome-row" style={{ background: '#FAEAEA' }}><div className="outcome-dot" style={{ background: '#C95B5B' }}></div><div><div style={{ fontSize: '13px', fontWeight: 500, color: '#C95B5B', marginBottom: '3px' }}>Avoid — clear trigger confirmed</div><div style={{ fontSize: '12px', color: '#C95B5B', opacity: 0.85 }}>Repeatable symptom pattern. Confirmed by your own body.</div></div></div>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h2>Stop guessing.<br /><em>Start knowing.</em></h2>
        <p>The complete system — test, protocol, and answers — for $199.</p>
        <button className="btn-p" onClick={onGetStarted}>Start your program — $199</button>
      </div>
      <Footer />
    </div>
  )

  if (tab === 'how') return (
    <div>
      <style>{css}</style>
      <Nav />
      <div className="mk-hero" style={{ padding: '72px 64px 64px' }}>
        <div className="mk-hero-inner">
          <div className="mk-tag"><div className="mk-tag-dot"></div>The complete program</div>
          <div className="mk-h1" style={{ fontSize: '46px' }}>How Sensify <em>works.</em></div>
          <div className="mk-sub" style={{ marginBottom: 0 }}>A structured 6-month system that takes you from suspecting a food trigger to having a permanent, evidence-based Food Map.</div>
        </div>
      </div>

      <div className="mk-section alt">
        <div className="mk-section-inner">
          <div className="ey">Phase 1 — Setup</div>
          <div className="sh" style={{ fontSize: '28px', marginBottom: '32px' }}>Before the protocol <em>begins.</em></div>
          <div className="how-steps">
            <div className="how-step">
              <div className="how-n">1</div>
              <div className="how-content">
                <div className="how-tag">One time</div>
                <div className="how-title">Complete your intake survey</div>
                <div className="how-desc">Tell us about your symptoms — bloating, fatigue, skin issues, brain fog, or digestive issues. Rate your baseline severity on a 1-10 scale. This becomes the comparison point for every improvement throughout your program. You also tell us how often you eat common foods, so we already know your habits before your lab results arrive.</div>
              </div>
            </div>
            <div className="how-step">
              <div className="how-n">2</div>
              <div className="how-content">
                <div className="how-tag">One time</div>
                <div className="how-title">Order your lab test — we guide you to the right one</div>
                <div className="how-desc">We point you to our certified lab partner and walk you through exactly which test to order. It ships to your door, you complete it at home, and send it back. Results arrive in about a week. No clinic visits.</div>
              </div>
            </div>
            <div className="how-step">
              <div className="how-n">3</div>
              <div className="how-content">
                <div className="how-tag">One time</div>
                <div className="how-title">Upload your results — AI reads them instantly</div>
                <div className="how-desc">Upload your lab PDF, take a photo of your results, or enter them manually. The AI extracts every flagged food and categorizes it as High, Moderate, or Low sensitivity. Because we already know how often you eat each food, it immediately cross-references your results with your eating habits to build your elimination list. You review and confirm before anything starts.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mk-section">
        <div className="mk-section-inner">
          <div className="ey">Phase 2 — Elimination (Months 1-2)</div>
          <div className="sh" style={{ fontSize: '28px', marginBottom: '32px' }}>Eight weeks of <em>clean signal.</em></div>
          <div className="how-steps">
            <div className="how-step">
              <div className="how-n">4</div>
              <div className="how-content">
                <div className="how-tag">Daily</div>
                <div className="how-title">Get your daily compliance text</div>
                <div className="how-desc">Every evening at your chosen time — anywhere from 6pm to 10pm — you get a text from Sensify. Reply YES if you stayed on plan or NO if something came up. That's it. One second, every day. YES builds your streak. NO triggers a quick slip-up log where you tell us what happened — the data feeds your weekly insights.</div>
              </div>
            </div>
            <div className="how-step">
              <div className="how-n">5</div>
              <div className="how-content">
                <div className="how-tag">Weekly</div>
                <div className="how-title">Complete your weekly check-in</div>
                <div className="how-desc">Every 7 days, a check-in card appears on your dashboard. Takes about 2 minutes. Rate your symptoms on a 1-10 scale — questions are personalized to what you told us in your intake survey. Submit and the AI immediately generates a personalized insight based on your symptom trend, compliance data, and baseline scores. It appears on your dashboard and gets smarter every week.</div>
              </div>
            </div>
            <div className="how-step">
              <div className="how-n">6</div>
              <div className="how-content">
                <div className="how-tag amber">If needed</div>
                <div className="how-title">Compliance support — if you hit a wall</div>
                <div className="how-desc">Three consecutive NO replies trigger a personalized compliance conversation in the app. You tell us what's been hardest — cravings, social situations, hidden ingredients, cost, cooking for others, not knowing what to eat. The app responds with specific approved guidance for your situation. Our team reviews every audit personally before any plan recommendation is made.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mk-section alt">
        <div className="mk-section-inner">
          <div className="ey">Phase 3 — Reintroduction (Months 2-6)</div>
          <div className="sh" style={{ fontSize: '28px', marginBottom: '32px' }}>Where you get your <em>answers.</em></div>
          <div className="how-steps">
            <div className="how-step">
              <div className="how-n">7</div>
              <div className="how-content">
                <div className="how-tag">Month 2</div>
                <div className="how-title">Low sensitivity foods unlock first</div>
                <div className="how-desc">At the start of month 2, your Low sensitivity foods become available to reintroduce. Moderate foods unlock at month 4. High sensitivity foods unlock at month 6. This staggered approach lets you build a clear symptom baseline before testing your most reactive foods.</div>
              </div>
            </div>
            <div className="how-step">
              <div className="how-n">8</div>
              <div className="how-content">
                <div className="how-tag">14 days per food</div>
                <div className="how-title">Each food gets a structured 14-day cycle</div>
                <div className="how-desc">Days 1-3 are the exposure phase — eat the food as you normally would. Days 4-14 are the washout phase — avoid the food completely and let your symptoms settle. This exposure-washout pattern is the clinically validated method for isolating food responses. Daily texts continue throughout.</div>
              </div>
            </div>
            <div className="how-step">
              <div className="how-n">9</div>
              <div className="how-content">
                <div className="how-tag">Day 14</div>
                <div className="how-title">Complete your reintroduction survey — get your verdict</div>
                <div className="how-desc">On day 14 a verdict survey appears on your dashboard. You compare your symptoms during the exposure phase against your baseline, tell us your confidence level, and the AI delivers a verdict: Safe, Limit, or Avoid. Each verdict updates your Food Map permanently. No food gets labeled without real evidence from your own body.</div>
              </div>
            </div>
            <div className="how-step">
              <div className="how-n">10</div>
              <div className="how-content">
                <div className="how-tag">End of program</div>
                <div className="how-title">Receive your personal Food Map</div>
                <div className="how-desc">After 6 months every tested food is categorized by real symptom evidence. Safe, Limit, Avoid — all earned. Your Food Map is permanent, personalized, and yours to keep forever. You can also continue with our Maintain plan for ongoing tracking and annual retesting as your sensitivities evolve over time.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h2>Ready to <em>start?</em></h2>
        <p>The complete system is $199. Lab test ordered during onboarding.</p>
        <button className="btn-p" onClick={onGetStarted}>Get started today</button>
      </div>
      <Footer />
    </div>
  )

  if (tab === 'science') return (
    <div>
      <style>{css}</style>
      <Nav />
      <div className="mk-hero" style={{ padding: '72px 64px 64px' }}>
        <div className="mk-hero-inner">
          <div className="mk-tag"><div className="mk-tag-dot"></div>The science</div>
          <div className="mk-h1" style={{ fontSize: '46px' }}>Why this <em>works.</em></div>
          <div className="mk-sub" style={{ marginBottom: 0 }}>The elimination and reintroduction protocol is the gold standard for identifying food sensitivities. Here's what you should know before you start.</div>
        </div>
      </div>
      <div className="mk-section alt">
        <div className="mk-section-inner">
          <div className="ey">The honest truth about IgG tests</div>
          <div className="sh" style={{ fontSize: '30px' }}>Your lab test is a <em>hypothesis,</em> not a verdict.</div>
          <div className="ss">IgG tests measure how much your immune system has been exposed to a food — not whether it's actually causing your symptoms. A high reading for eggs might just mean you eat eggs every day. What matters is what happens when you remove and reintroduce it in real life. That's what Sensify tests.</div>
          <div className="sci-grid">
            {[
              { title: 'Elimination and reintroduction', desc: 'The structured elimination diet is the most clinically validated method for identifying food sensitivities. Used by gastroenterologists and functional medicine practitioners worldwide.' },
              { title: '14-day reintroduction cycles', desc: 'Each food is reintroduced for 3 days then removed for 11. This exposure-washout pattern isolates symptom responses with enough signal to draw reliable conclusions.' },
              { title: 'Daily compliance tracking', desc: 'Daily SMS check-ins give the AI 7 data points per week instead of one. That resolution makes it possible to spot patterns — like symptoms spiking the day after a slip-up — that weekly surveys miss entirely.' },
              { title: 'Physician-reviewed protocol', desc: 'Our elimination timelines, reintroduction structure, symptom tracking methodology, and AI response copy have all been reviewed and approved by a licensed physician advisor.' },
              { title: 'Human review for plan changes', desc: 'The AI generates insights and patterns — but any recommendation to change your protocol is reviewed by our team first. No automated plan decisions that bypass human judgment.' },
              { title: 'Wellness program, not medical diagnosis', desc: 'Sensify is an educational wellness tool. It does not diagnose, treat, or cure any condition. Always consult a healthcare provider if you have serious or concerning symptoms.' },
            ].map((item, i) => (
              <div key={i} className="sci-card">
                <div className="sci-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {i === 0 && <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>}
                    {i === 1 && <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}
                    {i === 2 && <><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></>}
                    {i === 3 && <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></>}
                    {i === 4 && <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></>}
                    {i === 5 && <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></>}
                  </svg>
                </div>
                <div className="sci-t">{item.title}</div>
                <div className="sci-d">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )

  if (tab === 'pricing') return (
    <div>
      <style>{css}</style>
      <Nav />
      <div className="mk-hero" style={{ padding: '72px 64px 64px' }}>
        <div className="mk-hero-inner">
          <div className="mk-tag"><div className="mk-tag-dot"></div>Simple pricing</div>
          <div className="mk-h1" style={{ fontSize: '46px' }}>One program, <em>one price.</em></div>
          <div className="mk-sub" style={{ marginBottom: 0 }}>No subscriptions. No hidden fees. One flat price for the complete 6-month system.</div>
        </div>
      </div>
      <div className="mk-section alt">
        <div className="mk-section-inner">
          <div className="pricing-wrap">
            <div className="pricing-card">
              <div className="price-tag">Complete 6-month system</div>
              <div className="price-num">$199</div>
              <div className="price-sub">One-time payment · Lab test ordered during onboarding</div>
              <button className="btn-p" style={{ width: '100%' }} onClick={onGetStarted}>Get started today</button>
              <div className="price-div"></div>
              {[
                'Intake survey — symptoms, baseline, and food frequency',
                'Guided lab test ordering — we tell you exactly what to get',
                'AI reads and extracts your results automatically',
                'Full 6-month structured elimination protocol',
                'Daily SMS compliance check-ins at your chosen time',
                '14-day reintroduction cycles with AI verdicts',
                'Weekly AI-generated symptom insights',
                'Compliance audit system with human review',
                'Personal Food Map at program completion',
                'Physician-reviewed protocol and messaging',
              ].map((item, i) => (
                <div key={i} className="price-item">
                  <div className="p-check"><CheckIcon /></div>
                  {item}
                </div>
              ))}
              <div className="price-note">Lab test purchased separately through our certified partner during onboarding. Typical cost $150–$200. Total investment approximately $350–$400. We walk you through every step.</div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )

  if (tab === 'faq') return (
    <div>
      <style>{css}</style>
      <Nav />
      <div className="mk-hero" style={{ padding: '72px 64px 64px' }}>
        <div className="mk-hero-inner">
          <div className="mk-tag"><div className="mk-tag-dot"></div>Questions</div>
          <div className="mk-h1" style={{ fontSize: '46px' }}>Things people <em>ask us.</em></div>
        </div>
      </div>
      <div className="mk-section alt">
        <div className="mk-section-inner"><Faq /></div>
      </div>
      <div className="cta-section">
        <h2>Stop guessing.<br /><em>Start knowing.</em></h2>
        <p>The complete system — test, protocol, and answers — for $199.</p>
        <button className="btn-p" onClick={onGetStarted}>Start your program — $199</button>
      </div>
      <Footer />
    </div>
  )

  return null
}
