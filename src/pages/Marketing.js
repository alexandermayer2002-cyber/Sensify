import React, { useState } from 'react'
import { Strip, VerdictCard, SuspectCard, StreakLine, CheckinButton, VerdictMoment } from '../components/objects'

/* MARKETING, refresh 2026-11-19. The page is the product's own material:
   stone page, paper objects, ink type, one forest panel (the hero). Every
   screen a buyer sees here is drawn with the seven shared objects, so the
   site and the program are the same thing. No scroll reveal, no orbs, no
   caps labels, no italics, no verdict color outside a ruling. */

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes mkFade { from { opacity: 0; } to { opacity: 1; } }

  .mk-page { background: #E3E4DC; min-height: 100vh; color: #151E18; }
  .mk-nav { background: rgba(227,228,220,.88); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); padding: 0 40px; display: flex; align-items: center; justify-content: space-between; height: 64px; position: sticky; top: 0; z-index: 100; }
  .mk-logo { font-family: var(--font-display); font-size: 22px; font-weight: 500; color: #151E18; letter-spacing: -0.3px; }
  .mk-logo-dot { color: #3C6A4B; }
  .mk-tabs { display: flex; gap: 2px; }
  .mk-tab { font-size: 15px; font-weight: 500; color: #737B73; padding: 8px 14px; border: none; background: none; cursor: pointer; transition: color 0.15s; border-bottom: 2px solid transparent; font-family: inherit; }
  .mk-tab.active { color: #151E18; border-bottom-color: #151E18; }
  .mk-tab:hover:not(.active) { color: #151E18; }
  .mk-nav-right { display: flex; align-items: center; gap: 8px; }
  .mk-signin { font-size: 14px; color: #434B44; background: none; border: none; cursor: pointer; font-weight: 500; padding: 8px 12px; font-family: inherit; }
  .mk-signin:hover { color: #151E18; }
  .mk-cta { background: #151E18; color: #FCFBF8; border: none; border-radius: 999px; padding: 11px 20px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; letter-spacing: -0.01em; box-shadow: 0 18px 40px -20px rgba(21,30,24,.55); transition: transform 160ms ease; }
  .mk-cta:active { transform: scale(.985); }
  .mk-menu-btn { display: none; font-size: 14px; color: #151E18; background: #FCFBF8; border: none; border-radius: 999px; cursor: pointer; font-weight: 600; padding: 9px 14px; font-family: inherit; }
  .mk-nav-panel { display: none; }

  .btn-p { background: #151E18; color: #FCFBF8; border: none; border-radius: 999px; padding: 16px 26px; font-size: 16px; font-weight: 600; cursor: pointer; font-family: inherit; letter-spacing: -0.01em; box-shadow: 0 22px 50px -22px rgba(21,30,24,.55); transition: transform 160ms ease; }
  .btn-p:active { transform: scale(.985); }
  .btn-g { background: #FCFBF8; color: #151E18; border: none; border-radius: 999px; padding: 16px 24px; font-size: 16px; font-weight: 600; cursor: pointer; font-family: inherit; letter-spacing: -0.01em; box-shadow: 0 1px 0 rgba(255,255,255,.9) inset, 0 14px 30px -20px rgba(22,31,25,.4); transition: transform 160ms ease; }
  .btn-g:active { transform: scale(.985); }
  .mk-hero.dark .btn-p { background: #FCFBF8; color: #151E18; box-shadow: 0 22px 50px -22px rgba(0,0,0,.5); }
  .mk-hero.dark .btn-g { background: rgba(252,251,248,.1); color: #FCFBF8; box-shadow: none; }

  .mk-hero { padding: 32px 40px 8px; }
  .mk-hero-inner { max-width: 1180px; margin: 0 auto; padding: 36px 0 20px; }
  .mk-hero.dark .mk-hero-inner { background: #1E3327; color: #FCFBF8; border-radius: 28px; padding: 64px 64px 56px; display: grid; grid-template-columns: 1.15fr .85fr; gap: 56px; align-items: center; box-shadow: 0 30px 60px -30px rgba(21,30,24,.6); }
  .mk-tag { font-size: 14px; font-weight: 500; color: #737B73; margin-bottom: 14px; }
  .mk-hero.dark .mk-tag { color: rgba(252,251,248,.62); }
  .mk-h1 { font-family: var(--font-display); font-size: 58px; font-weight: 300; line-height: 1.02; margin-bottom: 20px; letter-spacing: -0.025em; max-width: 680px; color: #151E18; }
  .mk-hero.dark .mk-h1 { color: #FCFBF8; }
  .mk-sub { font-size: 17px; color: #434B44; line-height: 1.6; margin-bottom: 28px; max-width: 540px; }
  .mk-hero.dark .mk-sub { color: rgba(252,251,248,.78); }
  .mk-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
  .mk-price-line { font-size: 14px; color: rgba(252,251,248,.62); }
  .mk-hero-objects { display: grid; gap: 14px; }
  .mk-hero-objects .ob-paper { padding: 22px 24px; }
  .mk-hero-objects .ob-vc { min-height: 0; }
  .mk-hero-objects .ob-vc .ob-v { margin-top: 12px; font-size: 44px; }
  .mk-hero-moment { padding: 24px 26px !important; }
  .mk-hero-moment .ob-moment-line { font-size: 14.5px; margin-top: 12px; }
  .mk-hero-moment .ob-moment-word { margin-top: 14px; }
  .mk-hero-moment .ob-moment-food { font-size: 13.5px; }

  .mk-section { padding: 56px 40px; }
  .mk-section-inner { max-width: 1180px; margin: 0 auto; }
  .ey { font-size: 14px; font-weight: 500; color: #737B73; margin-bottom: 12px; }
  .sh { font-family: var(--font-display); font-size: 38px; font-weight: 300; line-height: 1.1; margin-bottom: 14px; letter-spacing: -0.02em; color: #151E18; max-width: 760px; }
  .ss { font-size: 16px; color: #434B44; line-height: 1.65; max-width: 560px; margin-bottom: 28px; }
  .mk-two { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 56px; align-items: start; }
  .mk-rows { padding-top: 10px; }
  .mk-row { padding: 18px 0; border-top: 1px solid rgba(21,30,24,.1); }
  .mk-row-t { font-family: var(--font-display); font-size: 24px; font-weight: 400; color: #151E18; line-height: 1.15; }
  .mk-row-d { font-size: 15px; color: #434B44; line-height: 1.6; margin-top: 6px; }
  .mk-steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 10px; }
  .mk-step { background: #FCFBF8; border-radius: 14px; padding: 22px 24px 24px; box-shadow: var(--ob-shadow, 0 20px 40px -28px rgba(22,31,25,.35)); }
  .mk-step-n { font-family: var(--font-display); font-size: 15px; color: #737B73; margin-bottom: 26px; }
  .mk-step-t { font-family: var(--font-display); font-size: 28px; font-weight: 400; color: #151E18; letter-spacing: -0.02em; margin-bottom: 8px; }
  .mk-step-d { font-size: 14.5px; color: #434B44; line-height: 1.6; }

  .mk-show { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center; }
  .mk-chips { display: flex; gap: 8px; flex-wrap: wrap; margin: 22px 0 18px; }
  .mk-chip { background: #FCFBF8; color: #434B44; border: 0; border-radius: 999px; padding: 9px 16px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; box-shadow: 0 1px 0 rgba(255,255,255,.9) inset, 0 8px 18px -14px rgba(22,31,25,.3); }
  .mk-chip.on { background: #151E18; color: #FCFBF8; }
  .mk-phone { width: 318px; margin: 0 auto; background: #151E18; border-radius: 34px; padding: 10px; box-shadow: 0 40px 70px -30px rgba(21,30,24,.6); }
  .mk-phone-screen { background: #E3E4DC; border-radius: 26px; height: 600px; overflow: hidden; position: relative; }
  .mk-phone-inner { width: 390px; transform: scale(.7641); transform-origin: top left; padding: 22px 16px 28px; animation: mkFade .25s ease; }
  .mk-phone-inner .ob-paper { padding: 16px 18px; }
  .mk-phone-inner .ob-vc { min-height: 0; }
  .mk-phone-bar { font-family: var(--font-display); font-size: 18px; margin-bottom: 14px; color: #151E18; }
  .mk-caption { font-size: 15px; color: #434B44; line-height: 1.6; margin-top: 16px; min-height: 48px; }

  .mk-keep { background: #FCFBF8; border-radius: 14px; padding: 30px 32px 26px; box-shadow: var(--ob-shadow, 0 20px 40px -28px rgba(22,31,25,.35)); }
  .mk-keep-h { font-family: var(--font-display); font-size: 30px; font-weight: 300; letter-spacing: -0.02em; line-height: 1.05; }
  .mk-keep-m { font-size: 13.5px; color: #737B73; }
  .mk-keep-g { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 22px; }
  .mk-keep-v { font-family: var(--font-display); font-size: 34px; letter-spacing: -0.03em; line-height: 1; margin-bottom: 10px; }
  .mk-keep-f { font-size: 15px; color: #151E18; padding: 6px 0; border-top: 1px solid rgba(21,30,24,.08); }
  .safe { color: #1F9C87; } .limit { color: #D98A1C; } .avoid { color: #CF4B4B; }

  .mk-price { max-width: 560px; background: #FCFBF8; border-radius: 14px; padding: 30px 32px; box-shadow: var(--ob-shadow, 0 20px 40px -28px rgba(22,31,25,.35)); }
  .price-num { font-family: var(--font-display); font-size: 64px; font-weight: 300; line-height: 1; letter-spacing: -0.03em; }
  .price-sub { font-size: 14px; color: #737B73; margin: 6px 0 22px; }
  .price-item { display: flex; align-items: flex-start; gap: 11px; margin-bottom: 10px; font-size: 15px; line-height: 1.5; color: #151E18; }
  .p-check { width: 20px; height: 20px; background: #EEEFE8; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }
  .price-note { font-size: 13.5px; color: #737B73; margin-top: 18px; line-height: 1.6; padding-top: 16px; border-top: 1px solid rgba(21,30,24,.08); }

  .faq-wrap { max-width: 720px; }
  .faq-group { margin-bottom: 32px; }
  .faq-group-label { font-family: var(--font-display); font-size: 22px; color: #151E18; margin-bottom: 12px; }
  .faq-list { display: flex; flex-direction: column; gap: 8px; }
  .faq-item { background: #FCFBF8; border-radius: 14px; cursor: pointer; padding: 0 20px; box-shadow: 0 1px 0 rgba(255,255,255,.9) inset, 0 8px 18px -14px rgba(22,31,25,.25); }
  .faq-q { font-size: 16px; font-weight: 500; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 17px 0; line-height: 1.45; color: #151E18; }
  .faq-a { font-size: 15px; color: #434B44; line-height: 1.7; padding: 0 0 18px; }
  .faq-plus { font-size: 22px; color: #737B73; flex-shrink: 0; font-weight: 300; line-height: 1; width: 20px; text-align: center; }

  .cta-section { padding: 80px 40px 72px; text-align: center; }
  .cta-section h2 { font-family: var(--font-display); font-size: 46px; font-weight: 300; margin-bottom: 14px; letter-spacing: -0.025em; line-height: 1.05; color: #151E18; }
  .cta-section p { font-size: 16px; color: #434B44; margin: 0 auto 28px; max-width: 520px; line-height: 1.6; }

  .mk-footer { padding: 36px 40px 44px; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid rgba(21,30,24,.1); gap: 16px; flex-wrap: wrap; }
  .mk-footer-logo { font-family: var(--font-display); font-size: 18px; font-weight: 500; color: #151E18; }
  .mk-footer-note { font-size: 13px; color: #737B73; }
  .mk-footer-links { display: flex; gap: 20px; }
  .mk-footer-link { font-size: 13px; color: #737B73; cursor: pointer; text-decoration: none; }
  .mk-footer-link:hover { color: #151E18; }

  /* How it works page */
  .ph-head { display: flex; align-items: baseline; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
  .ph-name { font-family: var(--font-display); font-size: 34px; font-weight: 300; letter-spacing: -0.02em; line-height: 1.05; }
  .ph-time { font-size: 14px; color: #737B73; }
  .spine { display: grid; gap: 12px; max-width: 880px; }
  .spine-step { background: #FCFBF8; border-radius: 14px; padding: 20px 24px; box-shadow: 0 1px 0 rgba(255,255,255,.9) inset, 0 8px 18px -14px rgba(22,31,25,.25); display: grid; grid-template-columns: 140px 1fr; gap: 20px; }
  .spine-tag { font-size: 14px; color: #737B73; padding-top: 4px; }
  .spine-title { font-family: var(--font-display); font-size: 22px; margin-bottom: 6px; color: #151E18; }
  .spine-desc { font-size: 15px; color: #434B44; line-height: 1.65; max-width: 640px; }
  .cyclebox { margin-top: 16px; }
  .cb-label { font-size: 13.5px; color: #737B73; margin-top: 8px; }

  /* Science page */
  .sci-compare { background: #1E3327; color: #FCFBF8; border-radius: 28px; padding: 40px; margin-bottom: 48px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
  .sci-cside-tag { font-size: 14px; color: rgba(252,251,248,.6); margin-bottom: 10px; }
  .sci-cside-title { font-family: var(--font-display); font-size: 40px; font-weight: 300; letter-spacing: -0.02em; margin-bottom: 12px; line-height: 1; }
  .sci-cside-desc { font-size: 15px; line-height: 1.65; color: rgba(252,251,248,.78); }
  .sci-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 22px; }
  .sci-card { background: #FCFBF8; border-radius: 14px; padding: 22px 24px; box-shadow: 0 1px 0 rgba(255,255,255,.9) inset, 0 8px 18px -14px rgba(22,31,25,.25); }
  .sci-t { font-family: var(--font-display); font-size: 22px; margin-bottom: 8px; }
  .sci-d { font-size: 15px; color: #434B44; line-height: 1.65; }
  .sci-answer { margin-top: 48px; }
  .sci-answer-p { font-size: 16px; line-height: 1.7; color: #434B44; max-width: 680px; }
  .sci-paths { margin-top: 48px; }
  .sci-paths-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 20px; }
  .sci-path { background: #FCFBF8; border-radius: 14px; padding: 22px 24px; box-shadow: 0 1px 0 rgba(255,255,255,.9) inset, 0 8px 18px -14px rgba(22,31,25,.25); }
  .sci-path-t { font-family: var(--font-display); font-size: 22px; margin-bottom: 8px; }
  .sci-path-d { font-size: 14.5px; line-height: 1.6; color: #434B44; }
  .sci-disclaimers { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 40px; }
  .sci-disc-t { font-size: 15px; font-weight: 500; margin-bottom: 4px; }
  .sci-disc-d { font-size: 13.5px; color: #737B73; line-height: 1.6; }

  /* About */
  .ab-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
  .ab-cell { border-top: 1px solid rgba(21,30,24,.14); padding-top: 18px; }
  .ab-n { font-size: 14px; color: #737B73; margin-bottom: 10px; }
  .ab-t { font-family: var(--font-display); font-size: 26px; margin-bottom: 10px; line-height: 1.15; letter-spacing: -0.015em; }
  .ab-d { font-size: 15px; color: #434B44; line-height: 1.7; }
  .ab-quote { background: #FCFBF8; border-radius: 28px; padding: 56px 40px; text-align: center; margin: 0 40px; box-shadow: var(--ob-shadow, 0 20px 40px -28px rgba(22,31,25,.35)); }
  .ab-quote div { font-family: var(--font-display); font-size: 34px; font-weight: 300; line-height: 1.25; max-width: 680px; margin: 0 auto; letter-spacing: -0.02em; }

  @media (prefers-reduced-motion: reduce) { .mk-phone-inner { animation: none; } .btn-p, .btn-g, .mk-cta { transition: none; } }

  @media (max-width: 900px) {
    .mk-hero.dark .mk-hero-inner { grid-template-columns: 1fr; padding: 44px 32px; gap: 32px; }
    .mk-steps { grid-template-columns: 1fr 1fr; }
    .mk-show { grid-template-columns: 1fr; gap: 32px; }
    .sci-compare { grid-template-columns: 1fr; }
    .sci-paths-grid, .ab-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 640px) {
    .mk-nav { padding: 0 16px; height: 56px; gap: 8px; }
    .mk-logo { font-size: 19px; }
    .mk-tabs { display: none; }
    .mk-menu-btn { display: inline-block; }
    .mk-nav-panel { display: flex; flex-direction: column; position: absolute; top: 100%; left: 0; right: 0; background: #FCFBF8; border-radius: 0 0 16px 16px; box-shadow: 0 24px 44px -12px rgba(21,30,24,.3); padding: 6px 16px 10px; }
    .mk-menu-link { font-size: 15px; color: #151E18; background: none; border: none; border-bottom: 1px solid rgba(21,30,24,.06); text-align: left; padding: 13px 4px; cursor: pointer; font-family: inherit; }
    .mk-menu-link:last-child { border-bottom: none; }
    .mk-menu-link.active { font-weight: 600; }
    .mk-signin { padding: 6px 8px; font-size: 13px; }
    .mk-cta { padding: 9px 14px; font-size: 13px; }
    .mk-hero { padding: 14px 14px 0; }
    .mk-hero.dark .mk-hero-inner { padding: 36px 22px 32px; border-radius: 22px; }
    .mk-hero-inner { padding: 20px 6px 8px; }
    .mk-h1 { font-size: 38px; }
    .mk-sub { font-size: 16px; }
    .mk-section { padding: 36px 20px; }
    .sh { font-size: 30px; }
    .mk-two { grid-template-columns: 1fr; gap: 8px; }
    .mk-steps { grid-template-columns: 1fr; }
    .mk-keep-g { grid-template-columns: 1fr; gap: 14px; }
    .mk-phone { width: 100%; max-width: 318px; }
    .cta-section { padding: 56px 20px; }
    .cta-section h2 { font-size: 34px; }
    .mk-footer { padding: 28px 20px; flex-direction: column; text-align: center; }
    .mk-actions { flex-direction: column; align-items: stretch; }
    .btn-p, .btn-g { width: 100%; text-align: center; }
    .spine-step { grid-template-columns: 1fr; gap: 6px; }
    .sci-grid, .sci-disclaimers { grid-template-columns: 1fr; }
    .sci-compare { padding: 28px 22px; }
    .ab-quote { margin: 0 20px; padding: 40px 24px; }
    .ab-quote div { font-size: 26px; }
    .price-num { font-size: 52px; }
  }
`

const VC = { Safe: '#1F9C87', Limit: '#D98A1C', Avoid: '#CF4B4B' }

/* Sample program drawn with the real objects. Sarah is an example, and the
   page says so in words. Nothing here is a real tester. */
const SAMPLE = {
  strip: ['on', 'on', 'on', 'slipped', 'on', 'on', 'on', 'on', 'away', 'on', 'on', 'on', 'on', 'today'],
  milk: ['exposure', 'exposure-reacted', 'exposure-reacted', 'reacted', 'on', 'on', 'on', 'on', 'on', 'on', 'on', 'on', 'on', 'on'],
  oats: ['exposure', 'exposure', 'exposure', 'on', 'on', 'on', 'on', 'on', 'on', 'on', 'on', 'on', 'on', 'on'],
  coffee: ['exposure', 'exposure', 'exposure-reacted', 'on', 'on', 'on', 'on', 'on', 'on', 'on', 'on', 'on', 'on', 'on'],
  eggs: ['exposure', 'exposure', 'today-exposure', 'future', 'future', 'future', 'future', 'future', 'future', 'future', 'future', 'future', 'future', 'future'],
}

const SHOWCASE_CAPTIONS = {
  'Home': 'The day, the phase, your fourteen nights on the record, and tonight’s check-in. One glance and you’re oriented.',
  'Reintro': 'Three days eating it, eleven days watching clean. Then the verdict.',
  'Verdicts': 'Safe. Limit. Avoid. Each one a card you earned, with the fourteen-day trial that proves it.',
  'History': 'Every week on the record, measured against your own baseline.',
  'Ask Sensify': 'Knows your map, your lab results, and where you are in testing. Ask anything.',
}

function PhoneScreen({ tab }) {
  const Bar = () => <div className="mk-phone-bar">Sensify<span style={{ color: '#3C6A4B' }}>.</span></div>
  if (tab === 'Home') return (
    <>
      <Bar />
      <div className="ob-paper" style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 300, lineHeight: 1.1, letterSpacing: '-0.02em' }}>Good evening, Sarah.<br />Day 41 of 56, elimination.</div>
        <div style={{ fontSize: 14, color: '#434B44', marginTop: 8, lineHeight: 1.5 }}>Sixteen clean nights to go. Testing opens on day 57.</div>
      </div>
      <div className="ob-paper" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13.5, color: '#737B73', marginBottom: 10 }}>Your last fourteen nights</div>
        <Strip days={SAMPLE.strip} size="md" label="Fourteen nights" />
        <div style={{ marginTop: 12 }}><StreakLine state="active" count={5} /></div>
      </div>
      <CheckinButton state="tonight" block />
      <div className="ob-paper" style={{ marginTop: 12 }}>
        <div style={{ fontSize: 13.5, color: '#737B73', marginBottom: 8 }}>Against your baseline</div>
        {[['Bloating', '7 to 4', 'better'], ['Energy', '4 to 6', 'better'], ['Sleep', '5 to 5', 'no change']].map(([k, v, w]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid rgba(21,30,24,.08)', fontSize: 15 }}>
            <span>{k}</span><span style={{ color: '#434B44' }}>{v}, {w}</span>
          </div>
        ))}
      </div>
    </>
  )
  if (tab === 'Reintro') return (
    <>
      <Bar />
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 6 }}>Eggs are on trial.</div>
      <div style={{ fontSize: 14.5, color: '#434B44', marginBottom: 14, lineHeight: 1.5 }}>Day 3 of 14. Eat eggs today as you normally would.</div>
      <div className="ob-paper" style={{ marginBottom: 12 }}>
        <Strip days={SAMPLE.eggs} size="md" label="Trial strip" />
        <div style={{ fontSize: 13.5, color: '#737B73', marginTop: 10 }}>Three exposure days, then eleven clean days watching for anything delayed.</div>
      </div>
      <CheckinButton state="tonight" block />
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, margin: '20px 0 10px' }}>Up next</div>
      <div style={{ display: 'grid', gap: 10 }}>
        <SuspectCard food="Soy" meta="Lab flagged, moderate. You eat it often." state="next" line="Starts when eggs is ruled." />
        <SuspectCard food="Almond" meta="Lab flagged, low. You eat it weekly." state="suspect" line="Third in line." />
      </div>
    </>
  )
  if (tab === 'Verdicts') return (
    <>
      <Bar />
      <div className="ob-paper" style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1.05 }}>Sarah’s Food Map.</div>
        <div style={{ fontSize: 13, color: '#737B73', marginTop: 4 }}>4 of 6 ruled. Example program.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
          {[['Safe', ['Oats', 'Wheat']], ['Limit', ['Coffee']], ['Avoid', ['Cow milk']]].map(([v, foods]) => (
            <div key={v}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: '-0.03em', color: VC[v], lineHeight: 1, marginBottom: 6 }}>{v}.</div>
              {foods.map(f => <div key={f} style={{ fontSize: 14, padding: '4px 0', borderTop: '1px solid rgba(21,30,24,.08)' }}>{f}</div>)}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        <VerdictCard food="Cow milk" meta="Ruled on day 14" state="ruled" verdict="Avoid" evidence="Reacted on three of three exposure days" days={SAMPLE.milk} />
        <VerdictCard food="Oats" meta="Ruled on day 14" state="ruled" verdict="Safe" evidence="No reaction across fourteen days" days={SAMPLE.oats} />
      </div>
    </>
  )
  if (tab === 'History') return (
    <>
      <Bar />
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1.05, marginBottom: 14 }}>Nine weeks on the record.</div>
      <div className="ob-paper" style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13.5, color: '#737B73', marginBottom: 10 }}>Against your baseline, week by week</div>
        {[['Bloating', [7, 6, 6, 5, 4, 4, 3, 3, 3]], ['Reflux', [5, 5, 4, 4, 3, 3, 2, 2, 2]], ['Energy', [4, 4, 5, 5, 5, 6, 6, 7, 7]]].map(([k, pts]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderTop: '1px solid rgba(21,30,24,.08)' }}>
            <span style={{ width: 70, fontSize: 15 }}>{k}</span>
            <svg width="190" height="26" viewBox="0 0 190 26" style={{ flex: 'none' }}>
              <polyline fill="none" stroke="#3C6A4B" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={pts.map((p, i) => `${4 + i * 22.5},${24 - (p / 10) * 22}`).join(' ')} />
            </svg>
            <span style={{ fontSize: 13.5, color: '#434B44', marginLeft: 'auto' }}>{pts[0]} to {pts[pts.length - 1]}</span>
          </div>
        ))}
      </div>
      <div className="ob-paper">
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 6 }}>Week 9</div>
        <div style={{ fontSize: 14.5, color: '#434B44', lineHeight: 1.55 }}>Both of your main symptoms are holding well below baseline, even with eggs mid-trial. Nothing unusual flagged this week.</div>
      </div>
    </>
  )
  return (
    <>
      <Bar />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <div style={{ background: '#151E18', color: '#FCFBF8', borderRadius: '16px 16px 4px 16px', padding: '12px 14px', fontSize: 14.5, lineHeight: 1.5, maxWidth: '85%' }}>Going to an Italian place tonight. What can I actually order?</div>
      </div>
      <div className="ob-paper" style={{ borderRadius: '16px 16px 16px 4px', maxWidth: '94%' }}>
        <div style={{ fontSize: 14.5, lineHeight: 1.6, marginBottom: 10 }}>Plenty, with cow milk ruled Avoid and eggs still on trial.</div>
        {[['Order freely', 'Grilled branzino, steak, polenta, pomodoro or arrabbiata sauces.'], ['Skip', 'Anything with cream or cheese, since cow milk is a confirmed Avoid.'], ['Ask the kitchen', 'Whether the fresh pasta is made with egg. You are on day 3 of the eggs trial, so eating it is fine, just log it tonight.']].map(([t, d]) => (
          <div key={t} style={{ padding: '8px 0', borderTop: '1px solid rgba(21,30,24,.08)' }}>
            <div style={{ fontSize: 14.5, fontWeight: 500 }}>{t}</div>
            <div style={{ fontSize: 13.5, color: '#434B44', lineHeight: 1.5, marginTop: 2 }}>{d}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, background: '#FCFBF8', borderRadius: 999, padding: '12px 18px', fontSize: 14, color: '#737B73' }}>Ask about any food or menu</div>
    </>
  )
}

const FAQ_GROUPS = [
  {
    group: 'Getting started',
    items: [
      { q: 'Do I need to already have a lab test?', a: 'No. A food sensitivity lab test is part of the program. You complete it from home, with no clinic visits, and once your results are in you upload them and they are read straight into your protocol. Already have recent results? You can use those instead.' },
      { q: "What's included in the price?", a: 'Everything: your lab test, the full elimination and reintroduction protocol, daily and weekly check-ins, pattern detection that learns your baseline, personalized insights, and your completed verdicts. One payment covers it all, there is no separate lab bill and nothing else to buy. Current pricing is on the Pricing page.' },
      { q: 'How much time does it take each week?', a: 'The daily check-in takes about 30 seconds. The weekly check-in takes about 2 minutes. During reintroduction cycles you spend a few extra minutes logging symptoms. It is built to fit into normal life.' },
    ],
  },
  {
    group: 'The program',
    items: [
      { q: 'What makes Sensify different from just buying a test?', a: 'A lab test gives you a list. Sensify runs each food through a controlled 14-day reintroduction cycle with daily tracking, so by the end you have real evidence, from your own body, of what it does and does not tolerate. The test finds the suspects. Sensify puts each one on trial.' },
      { q: 'How do the daily check-ins work?', a: 'Each day you log a quick snapshot: sleep, stress, hydration, whether you stayed on plan, and anything your body did that day. About 30 seconds. Every entry feeds a system that learns your patterns, cross-references your symptoms against your sleep and stress, and weighs all of it when your verdicts are decided.' },
      { q: 'Does Sensify actually analyze my data?', a: 'Yes, and it shows its work. Sensify learns your personal baseline during elimination, spots when a bad week lines up with bad sleep or high stress rather than food, and brings that context into every verdict, so your sleep gets weighed before a food takes the blame. No standalone lab test can do any of that.' },
      { q: "What if I don't see improvement during elimination?", a: 'Your symptom trends are monitored every week and flagged when improvement is not occurring. We look at compliance, hidden ingredients, and stress, and every flagged case is reviewed personally before any plan changes are suggested.' },
      { q: 'Do I have to finish the whole protocol?', a: 'The full value comes from completing the protocol, since the reintroduction phase is where your verdicts are earned. You can stop anytime, but your verdicts are only complete once each food has been tested. We designed the program to keep each step light so finishing feels doable.' },
      { q: 'What happens when I finish?', a: 'You receive your completed verdicts, yours to keep. You can also continue with Maintain, an optional monthly plan that keeps your verdicts working for you every day, with Ask Sensify on hand to check any food, menu, or meal against your results whenever you need it. Maintain pricing is on the Pricing page.' },
    ],
  },
  {
    group: 'Medical & safety',
    items: [
      { q: 'Is this a medical diagnosis?', a: 'No. Sensify is a wellness and educational program. It does not diagnose, treat, or cure any medical condition. If you have serious symptoms, always consult a licensed healthcare provider.' },
      { q: 'Is it safe to cut several foods for eight weeks?', a: 'For most healthy adults, yes, with ordinary care: the protocol removes specific suspect foods, not whole food groups blindly, and nothing stops you from covering the same nutrients from other sources. That said, this is exactly the question to bring to your doctor or dietitian first if you are pregnant or breastfeeding, underweight, managing a medical condition, or have a history of disordered eating. Sensify is a wellness program, not medical care, and it should never override professional advice.' },
      { q: 'How accurate are IgG food sensitivity tests?', a: 'IgG tests measure immune reactivity, not confirmed intolerance. We treat your results as a starting hypothesis. The real evidence comes from the elimination and reintroduction protocol, which is why the protocol is the product, not the test.' },
      { q: 'What if it turns out food is not my problem?', a: 'That is a real and valuable answer, not a failure. Some people go through the protocol and find their body tolerates everything well. That means food sensitivity is unlikely to be driving what you feel, which saves you from years of cutting out foods for no reason and points you toward looking elsewhere. We would rather give you the honest truth than invent a problem that is not there. A clean result is still an answer you can trust and act on.' },
    ],
  },
]

function Faq() {
  const [open, setOpen] = useState(null)
  return (
    <div className="faq-wrap">
      {FAQ_GROUPS.map((grp, gi) => (
        <div key={gi} className="faq-group">
          <div className="faq-group-label">{grp.group}</div>
          <div className="faq-list">
            {grp.items.map((f, i) => {
              const key = `${gi}-${i}`
              const isOpen = open === key
              return (
                <div key={key} className={`faq-item${isOpen ? ' open' : ''}`} onClick={() => setOpen(isOpen ? null : key)}>
                  <div className="faq-q">{f.q}<span className="faq-plus">{isOpen ? '–' : '+'}</span></div>
                  {isOpen && <div className="faq-a">{f.a}</div>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

const Footer = () => (
  <div className="mk-footer">
    <div className="mk-footer-logo">Sensify<span className="mk-logo-dot">.</span></div>
    <div className="mk-footer-note">Wellness program only. Not medical advice.</div>
    <div className="mk-footer-links">
      <a className="mk-footer-link" href="/privacy.html" target="_blank" rel="noopener noreferrer">Privacy</a>
      <a className="mk-footer-link" href="/terms.html" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>Terms</a>
      <a className="mk-footer-link" href="mailto:alex@sensifyhealth.com" style={{ textDecoration: 'none' }}>Contact</a>
    </div>
  </div>
)

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#151E18" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
)

export default function Marketing({ onGetStarted, onSignIn }) {
  // X18: /science, /faq, /pricing, /how-it-works, /about open the matching tab; the URL follows the tab.
  const PATH_TAB = { '/how-it-works': 'how', '/how': 'how', '/science': 'science', '/pricing': 'pricing', '/faq': 'faq', '/about': 'about' }
  const TAB_PATH = { how: '/how-it-works', science: '/science', pricing: '/pricing', faq: '/faq', about: '/about', home: '/' }
  const [tab, setTabState] = useState(() => {
    try { return PATH_TAB[window.location.pathname.replace(/\/+$/, '')] || 'home' } catch (e) { return 'home' }
  })
  const setTab = t => {
    setTabState(t)
    try { window.history.replaceState(null, '', TAB_PATH[t] || '/') } catch (e) { /* path sync is cosmetic */ }
  }
  const [menuOpen, setMenuOpen] = useState(false)
  const [homeFaq, setHomeFaq] = useState(null)
  const [showcaseTab, setShowcaseTab] = useState('Home')
  React.useEffect(() => { window.scrollTo(0, 0) }, [tab])

  const tabs = ['home', 'how', 'science', 'pricing', 'faq', 'about']
  const tabLabel = t => t === 'home' ? 'Home' : t === 'how' ? 'How it works' : t === 'faq' ? 'FAQ' : t.charAt(0).toUpperCase() + t.slice(1)

  const Nav = () => (
    <nav className="mk-nav">
      <div className="mk-logo">Sensify<span className="mk-logo-dot">.</span></div>
      <div className="mk-tabs">
        {tabs.map(t => (
          <button key={t} className={`mk-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{tabLabel(t)}</button>
        ))}
      </div>
      <div className="mk-nav-right">
        <button className="mk-menu-btn" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>{menuOpen ? 'Close' : 'Menu'}</button>
        <button className="mk-signin" onClick={onSignIn}>Sign in</button>
        {/* Price shown before Stripe sees you (QA 2026-11-06 First-Timer #1). */}
        <button className="mk-cta" onClick={onGetStarted}>Get started, $399</button>
      </div>
      {menuOpen && (
        <div className="mk-nav-panel">
          {tabs.map(t => (
            <button key={t} className={`mk-menu-link${tab === t ? ' active' : ''}`} onClick={() => { setTab(t); setMenuOpen(false) }}>{tabLabel(t)}</button>
          ))}
        </div>
      )}
    </nav>
  )

  const PageHero = ({ tag, h1, sub }) => (
    <div className="mk-hero">
      <div className="mk-hero-inner">
        <div className="mk-tag">{tag}</div>
        <div className="mk-h1" style={{ fontSize: 48 }}>{h1}</div>
        <div className="mk-sub" style={{ marginBottom: 0 }}>{sub}</div>
      </div>
    </div>
  )

  const Cta = ({ h, p, label = 'Start your program' }) => (
    <div className="cta-section">
      <h2>{h}</h2>
      <p>{p}</p>
      <button className="btn-p" onClick={onGetStarted}>{label}</button>
    </div>
  )

  if (tab === 'home') return (
    <div className="mk-page">
      <style>{css}</style>
      <Nav />
      <div className="mk-hero dark">
        <div className="mk-hero-inner">
          <div>
            <div className="mk-tag">Test. Eliminate. Reintroduce. Know.</div>
            <div className="mk-h1">Stop guessing what your body can’t handle.</div>
            <div className="mk-sub">Bloating, brain fog, reflux, fatigue that keep coming back, and no way to know which food is behind them. A lab test only gives you suspects. Sensify puts each one on trial in your real life, fourteen days at a time, and rules it: Safe, Limit, or Avoid.</div>
            <div className="mk-actions">
              <button className="btn-p" onClick={onGetStarted}>Start your program</button>
              <button className="btn-g" onClick={() => setTab('how')}>See how it works</button>
            </div>
            <div className="mk-price-line">$399, lab test included, one payment.</div>
          </div>
          <div className="mk-hero-objects" aria-label="Example verdict">
            <div className="ob-paper mk-hero-moment">
              <VerdictMoment food="Cow milk. 14 logged days on the record, example." verdict="Avoid" days={SAMPLE.milk} size="md" wordSize="clamp(56px, 6vw, 84px)" line="Reacted on three of three exposure days. Ruled by your own record, not the lab." loop />
            </div>
            <VerdictCard food="Oats" meta="Ruled on day 14, example" state="ruled" verdict="Safe" evidence="No reaction across fourteen days" days={SAMPLE.oats} />
          </div>
        </div>
      </div>

      <div className="mk-section">
        <div className="mk-section-inner mk-two">
          <div>
            <div className="ey">The problem</div>
            <div className="sh">Most people suspect food. Almost none ever confirm it.</div>
            <div className="ss">Buying a test is easy. Knowing what to do with it isn’t. Without a structured process, most people eliminate a few things, feel slightly better, give up, and never get a real answer.</div>
          </div>
          <div className="mk-rows">
            {[
              ['Tests are easy to buy.', 'Following a proper elimination protocol afterward is the part almost nobody does.'],
              ['Guessing doesn’t work.', 'Randomly cutting foods with no structure gives you no signal. You don’t know what’s helping.'],
              ['No one holds the thread.', 'No nightly check-ins, no one tracking your symptoms, no verdicts at the end. Just a list and good luck.'],
            ].map(([t, d]) => (
              <div key={t} className="mk-row"><div className="mk-row-t">{t}</div><div className="mk-row-d">{d}</div></div>
            ))}
          </div>
        </div>
      </div>

      <div className="mk-section">
        <div className="mk-section-inner">
          <div className="ey">How it works</div>
          <div className="sh">Four steps to an answer.</div>
          <div className="mk-steps">
            {[
              ['First', 'Test', 'Complete your intake and at-home lab test. Your results become the starting hypothesis: the suspects, not the verdict.'],
              ['Then', 'Eliminate', 'Eight weeks without your suspect foods, with a thirty-second check-in each night. Your symptoms settle into a clean baseline.'],
              ['Next', 'Reintroduce', 'Each food returns one at a time, three days on and eleven days watching, while you log how your body responds.'],
              ['Finally', 'Know', 'Every food lands where it belongs: Safe, Limit, or Avoid. Every verdict is earned and yours to keep.'],
            ].map(([n, t, d]) => (
              <div key={t} className="mk-step"><div className="mk-step-n">{n}</div><div className="mk-step-t">{t}</div><div className="mk-step-d">{d}</div></div>
            ))}
          </div>
          <div style={{ marginTop: 22 }}><button className="btn-g" onClick={() => setTab('how')}>See the full program</button></div>
        </div>
      </div>

      <div className="mk-section">
        <div className="mk-section-inner mk-show">
          <div>
            <div className="ey">Inside the program</div>
            <div className="sh">Thirty seconds a night. One real check-in a week. And every so often, a verdict you earned.</div>
            <div className="ss" style={{ marginBottom: 0 }}>These are example screens from a sample program, drawn with the same objects you’ll use. Tap through them.</div>
            <div className="mk-chips">
              {Object.keys(SHOWCASE_CAPTIONS).map(t => (
                <button key={t} onClick={() => setShowcaseTab(t)} className={`mk-chip${showcaseTab === t ? ' on' : ''}`}>{t}</button>
              ))}
            </div>
            <div className="mk-caption">{SHOWCASE_CAPTIONS[showcaseTab]}</div>
          </div>
          <div className="mk-phone">
            <div className="mk-phone-screen">
              <div key={showcaseTab} className="mk-phone-inner"><PhoneScreen tab={showcaseTab} /></div>
            </div>
          </div>
        </div>
      </div>

      <div className="mk-section">
        <div className="mk-section-inner mk-two">
          <div>
            <div className="ey">The outcome</div>
            <div className="sh">Verdicts that are actually earned.</div>
            <div className="ss">No food is called Safe without being tested. No food is called Avoid without a record behind it. Everything you eat, sorted by your own body into three honest rulings, and yours to keep.</div>
            <div className="mk-rows">
              {[['Safe', 'Tested, tolerated, eat freely.'], ['Limit', 'Fine in small amounts.'], ['Avoid', 'A confirmed trigger.']].map(([v, d]) => (
                <div key={v} className="mk-row" style={{ display: 'flex', alignItems: 'baseline', gap: 16, padding: '12px 0' }}>
                  <span className={v.toLowerCase()} style={{ fontFamily: 'var(--font-display)', fontSize: 30, letterSpacing: '-0.03em', width: 110, flex: 'none' }}>{v}.</span>
                  <span style={{ fontSize: 15.5, color: '#434B44' }}>{d}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 15, color: '#434B44', lineHeight: 1.65, marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(21,30,24,.1)' }}>And sometimes the answer is that food was never the problem. That is a real result too, and knowing it saves you from years of cutting things out for nothing.</div>
          </div>
          <div className="mk-keep">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
              <div className="mk-keep-h">Sarah’s Food Map.</div>
              <div className="mk-keep-m">Complete, example program</div>
            </div>
            <div style={{ fontSize: 14.5, color: '#434B44', marginTop: 8, lineHeight: 1.5 }}>Ruled by her own record. Each verdict is a fourteen-day single-food trial, nothing assumed.</div>
            <div className="mk-keep-g">
              {[['Safe', ['Oats', 'Wheat', 'Almond']], ['Limit', ['Coffee', 'Soy']], ['Avoid', ['Cow milk', 'Eggs']]].map(([v, foods]) => (
                <div key={v}>
                  <div className={`mk-keep-v ${v.toLowerCase()}`}>{v}.</div>
                  {foods.map(f => <div key={f} className="mk-keep-f">{f}</div>)}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 22, paddingTop: 14, borderTop: '1px solid rgba(21,30,24,.08)' }}>
              <div style={{ fontSize: 13.5, color: '#737B73', marginBottom: 8 }}>Cow milk, the record behind the ruling</div>
              <Strip days={SAMPLE.milk} size="md" label="Cow milk trial" />
            </div>
          </div>
        </div>
      </div>

      <div className="mk-section">
        <div className="mk-section-inner mk-two">
          <div>
            <div className="ey">The price</div>
            <div className="sh">One payment. The whole answer.</div>
          <div className="mk-price" style={{ marginTop: 22, maxWidth: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <span className="price-num">$399</span>
              <span style={{ fontSize: 15, color: '#737B73' }}>one payment, nothing else to buy</span>
            </div>
            <div style={{ display: 'grid', gap: 8, margin: '20px 0 16px' }}>
              {[
                'Food sensitivity lab test, done from home',
                'The full elimination and reintroduction protocol',
                'Nightly and weekly check-ins with personalized insights',
                'Guided single-food trials with honest verdicts',
                'Your completed Food Map, yours to keep',
              ].map(it => <div key={it} className="price-item"><div className="p-check"><CheckIcon /></div>{it}</div>)}
            </div>
            <div style={{ fontSize: 14.5, color: '#434B44', lineHeight: 1.6, marginBottom: 18 }}>A lab test alone costs $150 to $300 and only hands you suspects. Sensify is the months of structure that turn them into answers, at about thirty seconds a night.</div>
            <button className="btn-p" style={{ width: '100%' }} onClick={onGetStarted}>Start your program</button>
            <div style={{ fontSize: 13, color: '#737B73', marginTop: 10, textAlign: 'center' }}>Optional after your program: Maintain, $12.99 a month, never required.</div>
          </div>
          </div>
          <div>
            <div className="ey">Before you start</div>
            <div className="sh">The questions everyone asks.</div>
          <div className="faq-list" style={{ marginTop: 22 }}>
            {[
              { q: 'What’s included in the price?', a: 'Everything: your lab test, the full elimination and reintroduction protocol, nightly and weekly check-ins, pattern detection that learns your baseline, personalized insights, and your completed verdicts. One payment covers it all, there is no separate lab bill and nothing else to buy.' },
              { q: 'What makes Sensify different from just buying a test?', a: 'A lab test gives you a list. Sensify runs each food through a controlled fourteen-day reintroduction trial with nightly tracking, so by the end you have real evidence, from your own body, of what it does and does not tolerate. The test finds the suspects. Sensify puts each one on trial.' },
              { q: 'How much time does it take each week?', a: 'The nightly check-in takes about thirty seconds. The weekly check-in takes about two minutes. During reintroduction you spend a few extra minutes logging symptoms. It is built to fit into normal life.' },
              { q: 'What if it turns out food is not my problem?', a: 'That is a real and valuable answer, not a failure. Some people finish the protocol and find their body tolerates everything well, which saves you from years of cutting out foods for no reason and points you toward looking elsewhere. A clean result is still an answer you can trust.' },
              { q: 'Do I need to already have a lab test?', a: 'No. A food sensitivity lab test is part of the program. You complete it from home, no clinic visits, then upload your results and they are read straight into your protocol. Already have recent results? You can use those instead.' },
              { q: 'Is it safe to cut several foods for eight weeks?', a: 'For most healthy adults, yes, with ordinary care: the protocol removes specific suspect foods, not whole food groups blindly, and nothing stops you from covering the same nutrients from other sources. That said, this is exactly the question to bring to your doctor or dietitian first if you are pregnant or breastfeeding, underweight, managing a medical condition, or have a history of disordered eating. Sensify is a wellness program, not medical care, and it should never override professional advice.' },
            ].map((f, i) => {
              const isOpen = homeFaq === i
              return (
                <div key={i} className={`faq-item${isOpen ? ' open' : ''}`} onClick={() => setHomeFaq(isOpen ? null : i)}>
                  <div className="faq-q">{f.q}<span className="faq-plus">{isOpen ? '−' : '+'}</span></div>
                  {isOpen && <div className="faq-a">{f.a}</div>}
                </div>
              )
            })}
          </div>
            <div style={{ marginTop: 18 }}><button className="btn-g" onClick={() => setTab('faq')}>Read all FAQs</button></div>
          </div>
        </div>
      </div>

      <Cta h={<>Stop guessing.<br />Start knowing.</>} p="A lab test alone hands you a guess. Sensify includes the lab and the months of structure that turn it into an answer. One price, nothing else to buy." />
      <Footer />
    </div>
  )

  if (tab === 'how') return (
    <div className="mk-page">
      <style>{css}</style>
      <Nav />
      <PageHero tag="The complete program" h1="How Sensify works." sub="A structured system that takes you from suspecting a food to having your verdicts: a personal, evidence-based ruling on every tested food." />

      <div className="mk-section">
        <div className="mk-section-inner">
          <div className="ph-head"><div className="ph-name">Setup. Before the protocol begins.</div><div className="ph-time">One time</div></div>
          <div className="spine">
            <div className="spine-step"><div className="spine-tag">Step one</div><div><div className="spine-title">Complete your intake survey</div><div className="spine-desc">Tell us about your symptoms and rate your baseline severity on a one to ten scale. This becomes the comparison point for every improvement throughout your program. You also tell us how often you eat common foods, so we know your habits before your lab results even arrive.</div></div></div>
            <div className="spine-step"><div className="spine-tag">Step two</div><div><div className="spine-title">Complete your lab test from home</div><div className="spine-desc">Your lab test is part of the $399, so there is no separate lab bill. You complete it from home, with no clinic visits, and if you already have recent results you can use those instead.</div></div></div>
            <div className="spine-step"><div className="spine-tag">Step three</div><div><div className="spine-title">Upload your results, read in seconds</div><div className="spine-desc">Upload your lab PDF, take a photo, or enter results by hand. Every flagged food is extracted and sorted as high, moderate, or low, then cross-referenced with your eating habits to build your elimination list. You review and confirm before anything starts.</div></div></div>
          </div>
        </div>
      </div>

      <div className="mk-section">
        <div className="mk-section-inner">
          <div className="ph-head"><div className="ph-name">Elimination. Eight weeks of clean signal.</div><div className="ph-time">Months one and two</div></div>
          <div className="spine">
            <div className="spine-step"><div className="spine-tag">Nightly</div><div><div className="spine-title">Nightly check-in, about thirty seconds</div><div className="spine-desc">Each night you log sleep, stress, hydration, whether you stayed on plan, and anything your body did. Staying on plan builds your streak, and an honest slip never counts against you. Every entry feeds a system that is learning your patterns.</div>
              <div className="cyclebox"><Strip days={SAMPLE.strip} size="md" label="Fourteen nights" /><div className="cb-label">Fourteen nights on the record. Green is on plan, striped is an honest slip, the dot is a night away.</div></div></div></div>
            <div className="spine-step"><div className="spine-tag">Weekly</div><div><div className="spine-title">Weekly symptom check-in</div><div className="spine-desc">Every seven days a check-in appears on your Home. It takes about two minutes. Rate your symptoms on a one to ten scale, with questions personalized to your intake. Submit and a personalized insight is written from your symptom trend, compliance, and baseline, and it sharpens every week.</div></div></div>
            <div className="spine-step"><div className="spine-tag">Always on</div><div><div className="spine-title">Sensify learns you</div><div className="spine-desc">Behind the check-ins, a pattern engine is building your personal baseline: how often symptoms show up on clean weeks, how your sleep and stress move with how you feel. By week four it starts cross-referencing, and everything it learns is weighed when your verdicts are decided, so your sleep gets considered before a food takes the blame.</div></div></div>
            <div className="spine-step"><div className="spine-tag">If needed</div><div><div className="spine-title">Support, if you hit a wall</div><div className="spine-desc">If staying on plan gets hard, you tell us what’s toughest, cravings, social situations, hidden ingredients, cost, and you get specific guidance for your situation. Every case is reviewed personally, by the founder, before any plan recommendation is made.</div></div></div>
          </div>
        </div>
      </div>

      <div className="mk-section">
        <div className="mk-section-inner">
          <div className="ph-head"><div className="ph-name">Reintroduction. Where you get your answers.</div><div className="ph-time">Months two to six</div></div>
          <div className="spine">
            <div className="spine-step"><div className="spine-tag">Ordered</div><div><div className="spine-title">Your testing order is decided, not random</div><div className="spine-desc">The foods you eat most often are tested first, because they matter most to your daily life. Among equals, your strongest lab suspects go ahead. You can always override the order and pick any food yourself.</div></div></div>
            <div className="spine-step"><div className="spine-tag">Fourteen days each</div><div><div className="spine-title">Each food gets a structured fourteen-day trial</div><div className="spine-desc">Three days eating the food as you normally would, then eleven days off to let symptoms settle. This exposure and washout pattern is modeled on the clinical elimination-diet standard for isolating how a single food affects you.</div>
              <div className="cyclebox"><Strip days={SAMPLE.oats} size="md" label="One fourteen-day trial" /><div className="cb-label">Three exposure days in ink, then eleven clean days watching for anything delayed.</div></div></div></div>
            <div className="spine-step"><div className="spine-tag">Day fourteen</div><div><div className="spine-title">Get your verdict</div><div className="spine-desc">Your nightly logs across the trial produce a verdict: Safe, Limit, or Avoid. Each one is entered in your Food Map with its fourteen-day record. No food gets labeled without real evidence from your own body.</div></div></div>
            <div className="spine-step"><div className="spine-tag">End of program</div><div><div className="spine-title">Keep your Food Map</div><div className="spine-desc">By the end, every tested food is ruled on real symptom evidence. Safe, Limit, Avoid, all earned. Your Food Map is personal and yours to keep. You can continue with Maintain, which keeps your verdicts working for you every day with Ask Sensify always on hand.</div></div></div>
          </div>
        </div>
      </div>

      <Cta h="Ready to start?" p="The complete system is $399, lab test included. Nothing else to buy." label="Get started today" />
      <Footer />
    </div>
  )

  if (tab === 'science') return (
    <div className="mk-page">
      <style>{css}</style>
      <Nav />
      <PageHero tag="The science" h1={<>Your lab test is a hypothesis.<br />Your body gives the verdict.</>} sub="IgG tests measure exposure, not reaction. A high reading for eggs might just mean you eat eggs every day. Sensify confirms what’s real by testing it in your actual life." />
      <div className="mk-section">
        <div className="mk-section-inner">
          <div className="sci-compare">
            <div><div className="sci-cside-tag">The lab test</div><div className="sci-cside-title">A hypothesis.</div><div className="sci-cside-desc">Measures how much your immune system has been exposed to a food. Flags what’s worth investigating. It cannot tell you what’s actually causing your symptoms.</div></div>
            <div><div className="sci-cside-tag">Sensify</div><div className="sci-cside-title">A verdict.</div><div className="sci-cside-desc">Removes and reintroduces each flagged food in real life, tracks your response nightly, and rules on the evidence: Safe, Limit, or Avoid.</div></div>
          </div>

          <div className="ey">Why the method works</div>
          <div className="sh">Built on the method clinicians actually use.</div>
          <div className="sci-grid">
            {[
              ['Elimination and reintroduction', 'The standard clinical approach for identifying food triggers, used by gastroenterologists and dietitians to separate real reactions from suspicion.'],
              ['Fourteen-day trials', 'Each food is reintroduced for three days then removed for eleven. This exposure and washout pattern isolates symptom responses with enough signal to draw reliable conclusions.'],
              ['Nightly tracking', 'Nightly check-ins give seven data points a week instead of one. That resolution makes it possible to spot patterns, like symptoms spiking the day after a slip, that weekly surveys miss entirely.'],
              ['An established method', 'Our elimination and reintroduction structure follows the general approach dietitians use. Sensify is a wellness program, not a medical service.'],
            ].map(([t, d]) => <div key={t} className="sci-card"><div className="sci-t">{t}</div><div className="sci-d">{d}</div></div>)}
          </div>

          <div className="sci-answer">
            <div className="ey">What you walk away with</div>
            <div className="sh">An answer either way.</div>
            <div className="sci-answer-p">Most people who suspect food never get a clear answer. They cut things out, feel unsure, and second-guess forever. The protocol gives you a structured way to find out. If a food is a trigger for you, your own record will point to it. And if your body tolerates everything well, your record will show that too. One cycle gives you a strong signal from your own data, not a laboratory-grade certainty. That is not a disappointing result. It means food is not the thing holding you back, which saves you years of needless restriction and tells you where to look instead. We will never invent a problem to justify the program. The honest answer is the whole point.</div>
          </div>

          <div className="sci-paths">
            <div className="ey">A path for every result</div>
            <div className="sh">Whatever your results show, you’re not left guessing.</div>
            <div className="sci-paths-grid">
              {[
                ['Your lab flags foods', 'We build your protocol around the specific foods your panel flagged, testing each one through elimination and reintroduction to confirm which actually affect you.'],
                ['Clean panel, real symptoms', 'A clean panel doesn’t mean nothing’s wrong. Many real triggers, especially digestive ones, never show up on a lab. So we test the most common culprits directly, and you choose how thorough to go.'],
                ['Food isn’t the issue', 'If your panel is clean and your symptoms are minimal, the honest answer may be that food isn’t your problem. That’s valuable to know, and we’ll tell you plainly rather than run you through a protocol with nothing to find.'],
              ].map(([t, d]) => <div key={t} className="sci-path"><div className="sci-path-t">{t}</div><div className="sci-path-d">{d}</div></div>)}
            </div>
          </div>

          <div className="sci-disclaimers">
            <div><div className="sci-disc-t">Human review for plan changes</div><div className="sci-disc-d">Insights are generated automatically, but any recommendation to change your protocol is personally reviewed first. No automated plan decisions that bypass human judgment.</div></div>
            <div><div className="sci-disc-t">A wellness program, not a diagnosis</div><div className="sci-disc-d">Sensify is an educational wellness tool. It does not diagnose, treat, or cure any condition. Always consult a healthcare provider for serious or concerning symptoms.</div></div>
          </div>
        </div>
      </div>
      <Cta h="Test the hypothesis." p="Everything you need to go from suspicion to answer, in one program." />
      <Footer />
    </div>
  )

  if (tab === 'pricing') return (
    <div className="mk-page">
      <style>{css}</style>
      <Nav />
      <PageHero tag="Simple pricing" h1="One program, one price." sub="No hidden fees. One flat price for the complete system." />
      <div className="mk-section" style={{ paddingTop: 16 }}>
        <div className="mk-section-inner">
          <div className="mk-price">
            <div style={{ fontSize: 14, color: '#737B73', marginBottom: 10 }}>The complete system</div>
            <div className="price-num">$399</div>
            <div className="price-sub">One-time payment, lab test included</div>
            <button className="btn-p" style={{ width: '100%' }} onClick={onGetStarted}>Get started today</button>
            <div style={{ height: 1, background: 'rgba(21,30,24,.08)', margin: '24px 0' }} />
            {[
              'Intake survey: symptoms, baseline, and food frequency',
              'Your food sensitivity lab test, completed from home',
              'Your results read and extracted automatically',
              'Full structured elimination and reintroduction protocol',
              'Quick nightly check-ins right in the app',
              'Fourteen-day reintroduction trials with clear verdicts',
              'Ask Sensify: check any food, menu, or meal against your results',
              'Weekly symptom insights from your check-ins',
              'Compliance support with human review',
              'Every food ruled: your Food Map at completion',
              'Structured protocol built on an established method',
            ].map(item => <div key={item} className="price-item"><div className="p-check"><CheckIcon /></div>{item}</div>)}
            <div className="price-note">Everything included: your lab test, the full protocol, guidance, and your completed verdicts. No hidden costs, no separate lab bill.</div>
            <div className="price-note" style={{ marginTop: 8 }}>After you finish, Maintain is an optional $12.99 a month companion that keeps your verdicts working day to day. Entirely optional, nothing is required beyond the one price above.</div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )

  if (tab === 'faq') return (
    <div className="mk-page">
      <style>{css}</style>
      <Nav />
      <PageHero tag="Questions" h1="Things people ask us." sub="Everything you might want to know before you start. Still curious about something? Reach out anytime." />
      <div className="mk-section" style={{ paddingTop: 16 }}>
        <div className="mk-section-inner"><Faq /></div>
      </div>
      <Cta h={<>Stop guessing.<br />Start knowing.</>} p="One program, one price. The test, the protocol, and the answers it earns." />
      <Footer />
    </div>
  )

  if (tab === 'about') return (
    <div className="mk-page">
      <style>{css}</style>
      <Nav />
      <PageHero tag="Our story" h1={<>I spent years guessing.<br />Sensify exists so you don’t have to.</>} sub="Years of feeling off, a drawer of half-read lab reports, and nobody who could say which food was actually the problem. This company started as a stubborn refusal to keep guessing." />
      <div className="mk-section">
        <div className="mk-section-inner ab-grid">
          {[
            ['The guessing', 'Cutting foods at random', 'Dropping dairy one month, gluten the next. Feeling slightly better, never knowing why, always drifting back. No structure, no signal, no answer.'],
            ['The test', 'A list, then silence', 'The lab flagged a page of foods and handed over nothing else. No protocol, no guidance, no way to know which flags were real. A list is not an answer.'],
            ['The system', 'Running it properly', 'A real elimination. Foods tested back one at a time, logged nightly, judged on evidence. It worked, and it was brutal to run alone. That became the product.'],
          ].map(([n, t, d]) => <div key={n} className="ab-cell"><div className="ab-n">{n}</div><div className="ab-t">{t}</div><div className="ab-d">{d}</div></div>)}
        </div>
      </div>
      <div className="ab-quote"><div>The test was easy to buy. The answer took a system. So I built the system.</div></div>
      <div className="mk-section">
        <div className="mk-section-inner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 30, flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 520 }}>
            <div className="sh" style={{ fontSize: 30, marginBottom: 8 }}>Every verdict we issue is the one we never got.</div>
            <div style={{ fontSize: 15, color: '#434B44', lineHeight: 1.65 }}>Sensify exists to turn a suspicion into a ruling: Safe, Limit, or Avoid, earned from your own body’s evidence. No guessing. No drifting back.</div>
          </div>
          <button className="btn-p" onClick={onGetStarted}>Start your program</button>
        </div>
      </div>
      <Footer />
    </div>
  )

  return null
}
