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
  .ph-head { display: flex; align-items: center; gap: 14px; margin-bottom: 26px; }
  .ph-badge { font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500; color: white; background: #3D5C3C; padding: 6px 13px; border-radius: 8px; flex-shrink: 0; letter-spacing: 0.5px; }
  .ph-name { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 300; line-height: 1; }
  .ph-name em { font-style: italic; color: #3D5C3C; }
  .ph-time { font-size: 12px; color: #A8A69E; margin-top: 5px; font-family: 'DM Mono', monospace; }
  .spine { position: relative; padding-left: 44px; }
  .spine::before { content: ''; position: absolute; left: 15px; top: 8px; bottom: 8px; width: 2px; background: linear-gradient(#3D5C3C, rgba(61,92,60,0.15)); }
  .spine-step { position: relative; margin-bottom: 26px; }
  .spine-step:last-child { margin-bottom: 0; }
  .spine-dot { position: absolute; left: -36px; top: 2px; width: 16px; height: 16px; border-radius: 50%; background: white; border: 3px solid #3D5C3C; }
  .spine-tag { display: inline-block; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #3D5C3C; background: #EDF3ED; padding: 3px 9px; border-radius: 20px; margin-bottom: 8px; }
  .spine-tag.amber { color: #9A5F1A; background: #FCEFD9; }
  .spine-title { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
  .spine-desc { font-size: 13px; color: #7A7A72; line-height: 1.65; max-width: 520px; }
  .cyclebox { background: #0E0E0C; border-radius: 14px; padding: 20px; margin-top: 16px; max-width: 520px; }
  .cb-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: rgba(139,174,138,0.7); margin-bottom: 14px; }
  .cb-dots { display: flex; gap: 3px; margin-bottom: 10px; }
  .cb-dot { flex: 1; height: 9px; border-radius: 3px; }
  .cb-labels { display: flex; font-size: 10px; color: rgba(255,255,255,0.45); }
  @media (max-width: 700px) {
    .spine-desc, .cyclebox { max-width: 100%; }
    .ph-name { font-size: 22px; }
  }
  .how-title { font-size: 16px; font-weight: 500; margin-bottom: 6px; color: #1C1C1C; }
  .how-desc { font-size: 14px; color: #7A7A72; line-height: 1.75; margin-bottom: 0; }
  .how-tag { display: inline-flex; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: #3D5C3C; background: #EDF3ED; padding: 3px 9px; border-radius: 20px; margin-bottom: 8px; }
  .how-tag.amber { color: #D4894A; background: #FDF2EA; }

  .sci-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .sci-card { background: #FAF8F4; border-radius: 14px; padding: 22px; }
  .sci-icon { width: 36px; height: 36px; border-radius: 11px; background: #EDF3ED; display: flex; align-items: center; justify-content: center; margin-bottom: 14px; }
  .sci-t { font-size: 14px; font-weight: 500; margin-bottom: 7px; }
  .sci-d { font-size: 13px; color: #7A7A72; line-height: 1.7; }
  .sci-badge { display: inline-block; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; padding: 3px 9px; border-radius: 20px; background: #EDF3ED; color: #3D5C3C; margin-top: 12px; }
  .sci-compare { background: #0E0E0C; border-radius: 20px; padding: 36px; margin: 8px 0 40px; }
  .sci-compare-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.4px; color: rgba(139,174,138,0.7); margin-bottom: 26px; text-align: center; }
  .sci-compare-grid { display: grid; grid-template-columns: 1fr auto 1fr; gap: 22px; align-items: stretch; }
  .sci-cside { padding: 26px; border-radius: 16px; }
  .sci-cside.test { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
  .sci-cside.verdict { background: rgba(139,174,138,0.1); border: 1px solid rgba(139,174,138,0.25); }
  .sci-cside-tag { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
  .sci-cside.test .sci-cside-tag { color: rgba(255,255,255,0.4); }
  .sci-cside.verdict .sci-cside-tag { color: #8BAE8A; }
  .sci-cside-title { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 300; color: white; margin-bottom: 12px; line-height: 1.2; }
  .sci-cside-desc { font-size: 13px; line-height: 1.65; color: rgba(255,255,255,0.55); }
  .sci-cside.verdict .sci-cside-desc { color: rgba(255,255,255,0.72); }
  .sci-arrow { display: flex; align-items: center; justify-content: center; color: rgba(139,174,138,0.6); font-size: 24px; }
  .sci-disclaimers { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
  .sci-disc { display: flex; gap: 10px; align-items: flex-start; padding: 16px; background: #FAF8F4; border-radius: 12px; }
  .sci-disc-t { font-size: 12px; font-weight: 600; margin-bottom: 4px; }
  .sci-disc-d { font-size: 11.5px; color: #7A7A72; line-height: 1.55; }
  @media (max-width: 700px) {
    .sci-grid { grid-template-columns: 1fr; }
    .sci-compare-grid { grid-template-columns: 1fr; }
    .sci-arrow { transform: rotate(90deg); padding: 4px 0; }
    .sci-disclaimers { grid-template-columns: 1fr; }
  }

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
            <button className="btn-p" onClick={onGetStarted}>Start your program — $399</button>
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
        <p>The complete system — test, protocol, and answers — for $399.</p>
        <button className="btn-p" onClick={onGetStarted}>Start your program — $399</button>
      </div>
      <Footer />
    </div>
  )

  if (tab === 'how') return (
    <div>
      <style>{css}</style>
      <Nav />
      <div className="mk-hero" style={{ padding: '72px 64px 48px' }}>
        <div className="mk-hero-inner">
          <div className="mk-tag"><div className="mk-tag-dot"></div>The complete program</div>
          <div className="mk-h1" style={{ fontSize: '46px' }}>How Sensify <em>works.</em></div>
          <div className="mk-sub" style={{ marginBottom: 0 }}>A structured 6-month system that takes you from suspecting a food trigger to having a permanent, evidence-based Food Map.</div>
        </div>
      </div>

      {/* PHASE 1 — SETUP */}
      <div className="mk-section alt">
        <div className="mk-section-inner">
          <div className="ph-head">
            <span className="ph-badge">SETUP</span>
            <div><div className="ph-name">Before the protocol <em>begins.</em></div><div className="ph-time">One time</div></div>
          </div>
          <div className="spine">
            <div className="spine-step">
              <div className="spine-dot"></div>
              <div className="spine-tag">Step 1</div>
              <div className="spine-title">Complete your intake survey</div>
              <div className="spine-desc">Tell us about your symptoms and rate your baseline severity on a 1 to 10 scale. This becomes the comparison point for every improvement throughout your program. You also tell us how often you eat common foods, so we know your habits before your lab results even arrive.</div>
            </div>
            <div className="spine-step">
              <div className="spine-dot"></div>
              <div className="spine-tag">Step 2</div>
              <div className="spine-title">Order your lab test, we guide you to the right one</div>
              <div className="spine-desc">We point you to our certified lab partner and walk you through exactly which test to order. It ships to your door, you complete it at home, and send it back. Results arrive in about a week. No clinic visits.</div>
            </div>
            <div className="spine-step">
              <div className="spine-dot"></div>
              <div className="spine-tag">Step 3</div>
              <div className="spine-title">Upload your results, read instantly</div>
              <div className="spine-desc">Upload your lab PDF, take a photo, or enter results manually. Every flagged food is extracted and categorized as High, Moderate, or Low sensitivity, then cross-referenced with your eating habits to build your elimination list. You review and confirm before anything starts.</div>
            </div>
          </div>
        </div>
      </div>

      {/* PHASE 2 — ELIMINATION */}
      <div className="mk-section">
        <div className="mk-section-inner">
          <div className="ph-head">
            <span className="ph-badge">ELIMINATION</span>
            <div><div className="ph-name">Eight weeks of <em>clean signal.</em></div><div className="ph-time">Months 1–2</div></div>
          </div>
          <div className="spine">
            <div className="spine-step">
              <div className="spine-dot"></div>
              <div className="spine-tag">Daily</div>
              <div className="spine-title">Daily compliance check-in</div>
              <div className="spine-desc">A quick daily check to confirm you stayed on plan. One second, every day. Staying on plan builds your streak. A slip-up triggers a short log where you tell us what happened, and that data feeds your weekly insights.</div>
            </div>
            <div className="spine-step">
              <div className="spine-dot"></div>
              <div className="spine-tag">Weekly</div>
              <div className="spine-title">Weekly symptom check-in</div>
              <div className="spine-desc">Every 7 days a check-in appears on your dashboard. Takes about 2 minutes. Rate your symptoms on a 1 to 10 scale, with questions personalized to your intake. Submit and a personalized insight is generated from your symptom trend, compliance, and baseline, and it sharpens every week.</div>
            </div>
            <div className="spine-step">
              <div className="spine-dot"></div>
              <div className="spine-tag amber">If needed</div>
              <div className="spine-title">Compliance support, if you hit a wall</div>
              <div className="spine-desc">If staying on plan gets hard, you tell us what's toughest, cravings, social situations, hidden ingredients, cost, and the app responds with specific guidance for your situation. Our team reviews every case personally before any plan recommendation is made.</div>
            </div>
          </div>
        </div>
      </div>

      {/* PHASE 3 — REINTRODUCTION */}
      <div className="mk-section alt">
        <div className="mk-section-inner">
          <div className="ph-head">
            <span className="ph-badge">REINTRODUCTION</span>
            <div><div className="ph-name">Where you get your <em>answers.</em></div><div className="ph-time">Months 2–6</div></div>
          </div>
          <div className="spine">
            <div className="spine-step">
              <div className="spine-dot"></div>
              <div className="spine-tag">Staggered</div>
              <div className="spine-title">Foods unlock by tier</div>
              <div className="spine-desc">Low sensitivity foods unlock first, Moderate at month 4, High at month 6. This staggered approach lets you build a clear symptom baseline before testing your most reactive foods.</div>
            </div>
            <div className="spine-step">
              <div className="spine-dot"></div>
              <div className="spine-tag">14 days each</div>
              <div className="spine-title">Each food gets a structured 14-day cycle</div>
              <div className="spine-desc">Three days eating the food as you normally would, then eleven days off to let symptoms settle. This exposure-washout pattern is the clinically validated method for isolating how a single food affects you.</div>
              <div className="cyclebox">
                <div className="cb-label">One 14-day cycle</div>
                <div className="cb-dots">
                  {[...Array(14)].map((_, i) => (
                    <div key={i} className="cb-dot" style={{ background: i < 3 ? '#6DBF8A' : '#E0A977', marginRight: i === 2 ? '6px' : undefined }}></div>
                  ))}
                </div>
                <div className="cb-labels"><span style={{ flex: 3 }}>Exposure (days 1–3)</span><span style={{ flex: 11, textAlign: 'right' }}>Washout (days 4–14)</span></div>
              </div>
            </div>
            <div className="spine-step">
              <div className="spine-dot"></div>
              <div className="spine-tag">Day 14</div>
              <div className="spine-title">Get your verdict</div>
              <div className="spine-desc">Your daily logs across the cycle produce a verdict: Safe, Limit, or Avoid. Each verdict updates your Food Map permanently. No food gets labeled without real evidence from your own body.</div>
            </div>
            <div className="spine-step">
              <div className="spine-dot"></div>
              <div className="spine-tag">End of program</div>
              <div className="spine-title">Receive your personal Food Map</div>
              <div className="spine-desc">After 6 months every tested food is categorized by real symptom evidence. Safe, Limit, Avoid, all earned. Your Food Map is permanent, personal, and yours to keep. You can continue with our Maintain plan for ongoing tracking and annual retesting as your sensitivities evolve.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h2>Ready to <em>start?</em></h2>
        <p>The complete system is $399, lab test included. Nothing else to buy.</p>
        <button className="btn-p" onClick={onGetStarted}>Get started today</button>
      </div>
      <Footer />
    </div>
  )

  if (tab === 'science') return (
    <div>
      <style>{css}</style>
      <Nav />
      <div className="mk-hero" style={{ padding: '72px 64px 48px' }}>
        <div className="mk-hero-inner">
          <div className="mk-tag"><div className="mk-tag-dot"></div>The science</div>
          <div className="mk-h1" style={{ fontSize: '46px' }}>Your lab test is a <em>hypothesis.</em><br />Your body gives the <em>verdict.</em></div>
          <div className="mk-sub" style={{ marginBottom: 0 }}>IgG tests measure exposure, not reaction. A high reading for eggs might just mean you eat eggs every day. Sensify confirms what's real by testing it in your actual life.</div>
        </div>
      </div>
      <div className="mk-section alt">
        <div className="mk-section-inner">
          {/* Hypothesis vs verdict centerpiece */}
          <div className="sci-compare">
            <div className="sci-compare-label">The difference that matters</div>
            <div className="sci-compare-grid">
              <div className="sci-cside test">
                <div className="sci-cside-tag">The lab test</div>
                <div className="sci-cside-title">A hypothesis</div>
                <div className="sci-cside-desc">Measures how much your immune system has been exposed to a food. Flags what's worth investigating. It cannot tell you what's actually causing your symptoms.</div>
              </div>
              <div className="sci-arrow">→</div>
              <div className="sci-cside verdict">
                <div className="sci-cside-tag">Sensify</div>
                <div className="sci-cside-title">A verdict</div>
                <div className="sci-cside-desc">Removes and reintroduces each flagged food in real life, tracks your response daily, and confirms the truth: Safe, Limit, or Avoid.</div>
              </div>
            </div>
          </div>

          <div className="ey">Why the method works</div>
          <div className="sh" style={{ fontSize: '28px', marginBottom: '8px' }}>Built on the <em>clinical gold standard.</em></div>
          <div className="sci-grid" style={{ marginTop: '24px' }}>
            {[
              { title: 'Elimination & reintroduction', desc: 'The most clinically validated method for identifying food sensitivities. Used by gastroenterologists and functional medicine practitioners worldwide.', badge: null },
              { title: '14-day reintroduction cycles', desc: 'Each food is reintroduced for 3 days then removed for 11. This exposure-washout pattern isolates symptom responses with enough signal to draw reliable conclusions.', badge: null },
              { title: 'Daily compliance tracking', desc: 'Daily check-ins give seven data points per week instead of one. That resolution makes it possible to spot patterns, like symptoms spiking the day after a slip-up, that weekly surveys miss entirely.', badge: null },
              { title: 'Physician-reviewed protocol', desc: 'Our elimination timelines, reintroduction structure, and symptom tracking methodology have been reviewed and approved by a licensed physician advisor.', badge: 'MD reviewed' },
            ].map((item, i) => (
              <div key={i} className="sci-card">
                <div className="sci-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {i === 0 && <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>}
                    {i === 1 && <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}
                    {i === 2 && <><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></>}
                    {i === 3 && <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></>}
                  </svg>
                </div>
                <div className="sci-t">{item.title}</div>
                <div className="sci-d">{item.desc}</div>
                {item.badge && <div className="sci-badge">{item.badge}</div>}
              </div>
            ))}
          </div>

          {/* Honest disclaimers — smaller, footnote style */}
          <div className="sci-disclaimers">
            <div className="sci-disc">
              <div>
                <div className="sci-disc-t">Human review for plan changes</div>
                <div className="sci-disc-d">Insights are generated automatically, but any recommendation to change your protocol is reviewed by our team first. No automated plan decisions that bypass human judgment.</div>
              </div>
            </div>
            <div className="sci-disc">
              <div>
                <div className="sci-disc-t">A wellness program, not a diagnosis</div>
                <div className="sci-disc-d">Sensify is an educational wellness tool. It does not diagnose, treat, or cure any condition. Always consult a healthcare provider for serious or concerning symptoms.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="cta-section">
        <h2>Test the <em>hypothesis.</em></h2>
        <p>The complete system — test, protocol, and answers — for $399.</p>
        <button className="btn-p" onClick={onGetStarted}>Start your program — $399</button>
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
              <div className="price-num">$399</div>
              <div className="price-sub">One-time payment · Lab test included</div>
              <button className="btn-p" style={{ width: '100%' }} onClick={onGetStarted}>Get started today</button>
              <div className="price-div"></div>
              {[
                'Intake survey — symptoms, baseline, and food frequency',
                'Guided lab test ordering — we tell you exactly what to get',
                'Your results read and extracted automatically',
                'Full 6-month structured elimination protocol',
                'Daily SMS compliance check-ins at your chosen time',
                '14-day reintroduction cycles with clear verdicts',
                'Weekly symptom insights from your check-ins',
                'Compliance audit system with human review',
                'Personal Food Map at program completion',
                'Physician-reviewed protocol and messaging',
              ].map((item, i) => (
                <div key={i} className="price-item">
                  <div className="p-check"><CheckIcon /></div>
                  {item}
                </div>
              ))}
              <div className="price-note">Everything included: your lab test, the full 6-month physician-reviewed protocol, AI guidance, and your permanent Food Map. No hidden costs, no separate lab bill.</div>
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
        <p>The complete system — test, protocol, and answers — for $399.</p>
        <button className="btn-p" onClick={onGetStarted}>Start your program — $399</button>
      </div>
      <Footer />
    </div>
  )

  return null
}
