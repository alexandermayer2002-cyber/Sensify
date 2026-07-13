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

  .mk-hero { position: relative; padding: 56px 64px 8px; background: #FAF8F4; overflow: hidden; }
  .mk-hero.dark { padding: 48px 40px; background: #FAF8F4; }
  .mk-hero.dark .mk-hero-centered { position: relative; background: #22301F; border-radius: 24px; padding: 68px 48px; box-shadow: 0 24px 60px rgba(34,48,31,0.3); overflow: hidden; max-width: 1000px; }
  .mk-hero.dark .mk-hero-orb1 { position: absolute; top: -70px; left: -40px; width: 260px; height: 260px; border-radius: 50%; background: #8BAE8A; opacity: 0.12; pointer-events: none; animation: mkHeroGlow 6s ease-in-out infinite; }
  .mk-hero.dark .mk-hero-orb2 { position: absolute; bottom: -80px; right: -40px; width: 220px; height: 220px; border-radius: 50%; background: #E8941F; opacity: 0.06; pointer-events: none; }
  @keyframes mkHeroGlow { 0%, 100% { opacity: 0.07; } 50% { opacity: 0.14; } }
  .mk-hero-eyebrow { font-family: 'DM Mono', monospace; font-size: 11px; letter-spacing: 2.5px; color: #C9A227; text-transform: uppercase; margin-bottom: 22px; }
  .mk-price-line { font-size: 12.5px; color: rgba(250,248,244,0.5); margin-top: 14px; }
  .mk-hero-inner { max-width: 960px; margin: 0 auto; }
  .mk-hero-split { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 48px; align-items: center; max-width: 1080px; margin: 0 auto; }
  @media (max-width: 860px) { .mk-hero-split { grid-template-columns: 1fr; gap: 36px; } .mk-hero-fmcard { order: -1; } }
  .mk-hero-centered { max-width: 760px; margin: 0 auto; text-align: center; }
  .mk-h1.centered { max-width: 100%; margin-left: auto; margin-right: auto; }
  .mk-sub.centered { margin-left: auto; margin-right: auto; }
  .mk-actions.centered { justify-content: center; }
  .fmshow { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
  @media (max-width: 800px) { .fmshow { grid-template-columns: 1fr; gap: 32px; } }
  .fmshow-points { display: flex; flex-direction: column; gap: 12px; }
  .fmshow-point { display: flex; align-items: center; gap: 11px; font-size: 14px; color: #4A4A45; }
  .fmshow-point strong { font-weight: 600; color: #1C1C1C; }
  .fmshow-pdot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
  .mk-tag { display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 500; color: #3D5C3C; background: #EDF3ED; padding: 5px 13px; border-radius: 20px; margin-bottom: 16px; }
  .mk-tag-dot { width: 6px; height: 6px; border-radius: 50%; background: #C9A227; flex-shrink: 0; }
  .mk-h1 { font-family: 'Fraunces', serif; font-size: 56px; font-weight: 300; line-height: 1.06; margin-bottom: 16px; letter-spacing: -1px; max-width: 680px; color: #1C1C1C; }
  .mk-hero.dark .mk-h1 { color: #FAF8F4; }
  .mk-h1 em { font-style: italic; color: #3D5C3C; }
  .mk-hero.dark .mk-h1 em { color: #8BAE8A; }
  .mk-sub { font-size: 17px; color: #7A7A72; line-height: 1.7; margin-bottom: 30px; max-width: 520px; }
  .mk-hero.dark .mk-sub { color: rgba(250,248,244,0.68); font-weight: 300; }
  .mk-three { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 36px; max-width: 580px; }
  .mk-3c { background: #FAF8F4; border-radius: 13px; padding: 16px; }
  .mk-3n { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 300; color: #3D5C3C; margin-bottom: 6px; }
  .mk-3t { font-size: 13px; font-weight: 500; margin-bottom: 4px; }
  .mk-3d { font-size: 12px; color: #7A7A72; line-height: 1.6; }
  .mk-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 36px; }
  .btn-p { background: #8BAE8A; color: #22301F; border: none; border-radius: 11px; padding: 14px 26px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
  .mk-priceline { font-size: 12.5px; color: rgba(250,248,244,0.55); margin-top: 12px; }
  .mk-hero.dark .btn-g { border: 1px solid rgba(250,248,244,0.25); color: #FAF8F4; background: transparent; }
  .mk-hero.dark .mk-trust { color: rgba(250,248,244,0.5) !important; }
  .btn-p:hover { opacity: 0.87; }
  .btn-g { background: none; color: #1C1C1C; border: 1.5px solid rgba(0,0,0,0.12); border-radius: 10px; padding: 13px 22px; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
  .btn-g:hover { border-color: #3D5C3C; color: #3D5C3C; }
  .mk-proof { display: flex; align-items: center; gap: 20px; padding-top: 32px; border-top: 1px solid rgba(0,0,0,0.07); flex-wrap: wrap; }
  .mk-proof-num { font-family: 'Fraunces', serif; font-size: 28px; font-weight: 300; line-height: 1; }
  .mk-proof-label { font-size: 11px; color: #7A7A72; margin-top: 2px; }
  .mk-proof-div { width: 1px; height: 38px; background: rgba(0,0,0,0.08); }
  .fmcard { background: #22301F; border-radius: 22px; padding: 24px; position: relative; overflow: hidden; box-shadow: 0 24px 60px rgba(34,48,31,0.35); }
  .fmcard-orb { position: absolute; top: -70px; right: -70px; width: 240px; height: 240px; border-radius: 50%; background: #8BAE8A; animation: mkGlow 5s ease-in-out infinite; pointer-events: none; }
  .fmcard-orb2 { position: absolute; bottom: -90px; left: -60px; width: 200px; height: 200px; border-radius: 50%; background: #E8941F; opacity: 0.05; pointer-events: none; }
  @keyframes mkGlow { 0%, 100% { opacity: 0.05; } 50% { opacity: 0.11; } }
  @keyframes mkChipIn { from { opacity: 0; transform: translateY(10px) scale(0.94); } to { opacity: 1; transform: translateY(0) scale(1); } }
  .fmcard::before { content: ''; position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(139,174,138,0.14) 0%, transparent 65%); pointer-events: none; }
  .fmcard-eyebrow { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.4px; color: rgba(139,174,138,0.7); margin-bottom: 7px; }
  .fmcard-title { font-family: 'Fraunces', serif; font-size: 21px; font-weight: 300; color: white; margin-bottom: 18px; }
  .fmcard-title em { font-style: italic; color: #8BAE8A; }
  .fmcard-cat { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
  .fmcard-catdot { width: 5px; height: 5px; border-radius: 50%; }
  .fmcard-row { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 16px; }
  .fmcard-chip { font-size: 11.5px; font-weight: 500; padding: 4px 12px; border-radius: 20px; border: 1px solid; opacity: 0; }
  .fmcard.inview .fmcard-chip { animation: mkChipIn 0.55s ease both; }
  .fmcard-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.08); }
  .fmcard-verify { font-family: 'DM Mono', monospace; font-size: 8.5px; color: rgba(255,255,255,0.3); letter-spacing: 0.4px; }

  .mk-section { padding: 64px 64px; max-width: 100%; }
  .mk-section-inner { max-width: 960px; margin: 0 auto; }
  .mk-section.alt { background: #FFFFFF; }
  .mk-section.sage { background: #F2F5EF; }
  .mk-section.cream { background: #FAF8F4; }
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
  .sci-answer { margin-top: 40px; background: #0E0E0C; border-radius: 18px; padding: 32px; }
  .sci-answer-tag { font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: rgba(139,174,138,0.8); margin-bottom: 12px; }
  .sci-answer-h { font-family: 'Fraunces', serif; font-size: 30px; font-weight: 300; color: white; margin-bottom: 14px; }
  .sci-answer-p { font-size: 15px; line-height: 1.7; color: rgba(255,255,255,0.72); max-width: 620px; }
  .sci-paths { margin-top: 40px; }
  .sci-paths-tag { font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #8BAE8A; margin-bottom: 10px; }
  .sci-paths-h { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 300; color: #1C1C1C; margin-bottom: 22px; max-width: 560px; }
  .sci-paths-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .sci-path { background: white; border: 1px solid rgba(0,0,0,0.08); border-radius: 14px; padding: 20px; }
  .sci-path-num { width: 28px; height: 28px; border-radius: 50%; background: #EDF3ED; color: #3D5C3C; font-family: 'DM Mono', monospace; font-size: 13px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
  .sci-path-t { font-size: 15px; font-weight: 600; color: #1C1C1C; margin-bottom: 8px; }
  .sci-path-d { font-size: 13px; line-height: 1.6; color: #6A6A62; }
  @media (max-width: 760px) { .sci-paths-grid { grid-template-columns: 1fr; } }
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

  .faq-wrap { max-width: 660px; margin: 0 auto; }
  .faq-group { margin-bottom: 32px; }
  .faq-group:last-child { margin-bottom: 0; }
  .faq-group-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #3D5C3C; margin-bottom: 14px; }
  .faq-list { display: flex; flex-direction: column; gap: 10px; }
  .faq-item { background: white; border: 1px solid rgba(0,0,0,0.07); border-radius: 13px; cursor: pointer; padding: 0 18px; transition: border-color 0.15s, box-shadow 0.15s; }
  .faq-item:hover { border-color: rgba(61,92,60,0.25); }
  .faq-item.open { border-color: rgba(61,92,60,0.3); box-shadow: 0 2px 12px rgba(61,92,60,0.06); }
  .faq-q { font-size: 14.5px; font-weight: 500; display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 17px 0; line-height: 1.45; }
  .faq-a { font-size: 13.5px; color: #7A7A72; line-height: 1.75; padding: 0 0 18px; }
  .faq-plus { font-size: 20px; color: #3D5C3C; flex-shrink: 0; font-weight: 300; line-height: 1; width: 20px; text-align: center; }

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

  /* ── MOBILE ─────────────────────────────────────────── */
  @media (max-width: 600px) {
    .mk-nav { padding: 0 16px; height: 54px; gap: 8px; }
    .mk-logo { font-size: 18px; flex-shrink: 0; }
    .mk-tabs { gap: 0; overflow-x: auto; -webkit-overflow-scrolling: touch; flex: 1; scrollbar-width: none; }
    .mk-tabs::-webkit-scrollbar { display: none; }
    .mk-tab { font-size: 12px; padding: 6px 8px; white-space: nowrap; flex-shrink: 0; }
    .mk-signin { display: none; }
    .mk-cta { padding: 8px 14px; font-size: 12px; flex-shrink: 0; }
    .mk-nav-right { gap: 4px; }
    .mk-hero { padding: 48px 22px 44px !important; }
    .mk-hero .mk-h1 { font-size: 36px !important; }
    .mk-h1 { font-size: 36px !important; letter-spacing: -0.5px; }
    .mk-sub { font-size: 15px; }
    .mk-section { padding: 44px 22px !important; }
    .mk-three { grid-template-columns: 1fr; }
    .ds-grid { grid-template-columns: 1fr; }
    .dark-strip { padding: 24px; }
    .sci-grid { grid-template-columns: 1fr; }
    .sci-disclaimers { grid-template-columns: 1fr; }
    .sci-compare-grid { grid-template-columns: 1fr; }
    .sci-arrow { transform: rotate(90deg); padding: 4px 0; }
    .sci-compare { padding: 24px; }
    .fmshow { grid-template-columns: 1fr; gap: 28px; }
    .mk-hero-split { grid-template-columns: 1fr; gap: 28px; }
    .prob-grid { grid-template-columns: 1fr; }
    .cta-section { padding: 56px 22px !important; }
    .cta-section h2 { font-size: 32px; }
    .mk-footer { padding: 28px 22px; flex-direction: column; gap: 14px; text-align: center; }
    .mk-actions { flex-direction: column; }
    .mk-actions.centered { flex-direction: column; }
    .btn-p, .btn-g { width: 100%; }
    .spine { padding-left: 36px; }
    .ph-name { font-size: 22px; }
    .sh { font-size: 26px !important; }
  }
  @media (max-width: 380px) {
    .mk-h1 { font-size: 31px !important; }
    .mk-tab { font-size: 11px; padding: 6px 5px; }
  }
`

const FAQ_GROUPS = [
  {
    group: 'Getting started',
    items: [
      { q: 'Do I need to already have a lab test?', a: 'No. When you purchase the program we guide you through ordering your food sensitivity test during onboarding. We tell you exactly which test to get and how to complete it from home.' },
      { q: "What's included in the $399?", a: 'Everything: your lab test, the full 6-month physician-reviewed elimination and reintroduction protocol, daily and weekly check-ins, personalized insights, and your permanent Food Map. There is no separate lab bill and nothing else to buy.' },
      { q: 'How much time does it take each week?', a: 'The daily check-in takes a second. The weekly check-in takes about 2 minutes. During reintroduction cycles you spend a few extra minutes logging symptoms. It is built to fit into normal life.' },
    ],
  },
  {
    group: 'The program',
    items: [
      { q: 'What makes Sensify different from just buying a test?', a: 'A lab test gives you a list. Sensify runs each food through a controlled 14-day reintroduction cycle with daily tracking, so by the end you know for certain what your body does and does not tolerate. The test finds the suspects. Sensify confirms the truth.' },
      { q: 'How do the daily check-ins work?', a: 'Each day you confirm whether you stayed on plan. Staying on plan builds your streak. A slip-up opens a quick log where you note what happened, and that data feeds your weekly insights. It takes a second a day.' },
      { q: "What if I don't see improvement during elimination?", a: 'Your symptom trends are monitored every week and flagged when improvement is not occurring. We look at compliance, hidden ingredients, and stress, and our team reviews the situation personally before any plan changes are suggested.' },
      { q: 'Do I have to do all 6 months?', a: 'The full value comes from completing the protocol, since the reintroduction phase is where your verdicts are earned. You can stop anytime, but your Food Map is only complete once each food has been tested. We designed the program to keep each step light so finishing feels doable.' },
      { q: 'What happens after 6 months?', a: 'You receive your completed Food Map, permanent and yours to keep. You can also continue with Maintain, our $12.99/month plan that keeps your Food Map working for you every day, with Ask Sensify on hand to check any food, menu, or meal against your results whenever you need it.' },
    ],
  },
  {
    group: 'Medical & safety',
    items: [
      { q: 'Is this a medical diagnosis?', a: 'No. Sensify is a wellness and educational program. It does not diagnose, treat, or cure any medical condition. If you have serious symptoms, always consult a licensed healthcare provider.' },
      { q: 'How accurate are IgG food sensitivity tests?', a: 'IgG tests measure immune reactivity, not confirmed intolerance. We treat your results as a starting hypothesis. The real evidence comes from the elimination and reintroduction protocol, which is why the protocol is the product, not the test.' },
      { q: 'What if it turns out food is not my problem?', a: 'That is a real and valuable answer, not a failure. Some people go through the protocol and find their body tolerates everything well. That means food sensitivity is unlikely to be driving what you feel, which saves you from years of cutting out foods for no reason and points you toward looking elsewhere. We would rather give you the honest truth than invent a problem that is not there. A clean result is still an answer you can trust and act on.' },
      { q: 'Is the protocol reviewed by a professional?', a: 'Our elimination timelines, reintroduction structure, and symptom tracking methodology are reviewed and approved by a licensed physician advisor. Any recommendation to change your protocol is reviewed by our team before it reaches you.' },
    ],
  },
]

function Faq() {
  const [open, setOpen] = useState('0-0')
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
    <div className="mk-footer-logo">sensi<em>fy</em></div>
    <div className="mk-footer-note">Wellness program only. Not medical advice.</div>
    <div className="mk-footer-links">
      <a className="mk-footer-link" href="/privacy.html" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>Privacy</a>
      <a className="mk-footer-link" href="/terms.html" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>Terms</a>
      <a className="mk-footer-link" href="mailto:alex@sensifyhealth.com" style={{ textDecoration: 'none' }}>Contact</a>
    </div>
  </div>
)

const CheckIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
)

export default function Marketing({ onGetStarted, onSignIn }) {
  const [tab, setTab] = useState('home')
  const [homeFaq, setHomeFaq] = useState(null)
  const [mapInView, setMapInView] = useState(false)
  const fmcardRef = React.useRef(null)
  React.useEffect(() => {
    const el = fmcardRef.current
    if (!el || mapInView) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setMapInView(true); obs.disconnect() }
    }, { threshold: 0.35 })
    obs.observe(el)
    return () => obs.disconnect()
  })

  const tabs = ['home', 'how', 'science', 'pricing', 'faq', 'about']

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
      <div className="mk-hero dark">
        <div className="mk-hero-centered" style={{ position: 'relative' }}>
          <div className="mk-hero-orb1"></div>
          <div className="mk-hero-orb2"></div>
          <div className="mk-hero-eyebrow" style={{ position: 'relative' }}>Physician-reviewed · 6-month program</div>
          <div className="mk-h1 centered">Stop guessing what your body <em>can't handle.</em></div>
          <div className="mk-sub centered">Lab testing, a structured elimination and reintroduction protocol, and daily guidance that gives you a definitive answer about how food affects your body. You end with a personal Food Map of exactly where you stand.</div>
          <div className="mk-actions centered">
            <button className="btn-p" onClick={onGetStarted} style={{ background: '#8BAE8A', color: '#22301F', fontWeight: 600 }}>Start your program</button>
            <button className="btn-g" onClick={() => setTab('how')} style={{ borderColor: 'rgba(250,248,244,0.25)', color: '#FAF8F4' }}>See how it works</button>
          </div>
          <div className="mk-price-line">$399 · lab test included · one payment</div>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderBottom: '1px solid rgba(0,0,0,0.07)', padding: '18px 24px' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', justifyContent: 'center', gap: '36px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '12.5px', color: '#5A5A52', display: 'flex', alignItems: 'center', gap: '7px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3D5C3C', flexShrink: 0 }}></span>Physician-reviewed protocol</div>
          <div style={{ fontSize: '12.5px', color: '#5A5A52', display: 'flex', alignItems: 'center', gap: '7px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3D5C3C', flexShrink: 0 }}></span>Built on the clinical elimination gold standard</div>
          <div style={{ fontSize: '12.5px', color: '#5A5A52', display: 'flex', alignItems: 'center', gap: '7px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3D5C3C', flexShrink: 0 }}></span>One price — lab test included</div>
        </div>
      </div>

      {/* The Food Map — its own showcase section */}
      <div className="mk-section cream">
        <div className="mk-section-inner">
          <div className="fmshow">
            <div className="fmshow-copy">
              <div className="ey">The outcome</div>
              <div className="sh" style={{ fontSize: '32px', marginBottom: '18px' }}>Your personal <em>Food Map.</em></div>
              <div className="ss" style={{ marginBottom: '22px' }}>Everything you eat, sorted into three honest categories — earned through six months of real testing, not a lab's best guess. It's the answer you've been missing, and it's yours to keep forever.</div>
              <div className="fmshow-points">
                <div className="fmshow-point"><div className="fmshow-pdot" style={{ background: '#2C9D8A' }}></div><div><strong>Safe</strong> — tested, tolerated, eat freely.</div></div>
                <div className="fmshow-point"><div className="fmshow-pdot" style={{ background: '#E8941F' }}></div><div><strong>Limit</strong> — fine in small amounts.</div></div>
                <div className="fmshow-point"><div className="fmshow-pdot" style={{ background: '#D64545' }}></div><div><strong>Avoid</strong> — a confirmed trigger.</div></div>
              </div>
            </div>
            <div className={`fmcard${mapInView ? ' inview' : ''}`} ref={fmcardRef}>
              <div className="fmcard-orb" />
              <div className="fmcard-orb2" />
              <div className="fmcard-eyebrow" style={{ position: 'relative' }}>Sensify · Verified result</div>
              <div className="fmcard-title">Sarah's <em>Food Map.</em></div>
              <div className="fmcard-cat" style={{ color: '#A8C5A7' }}><span className="fmcard-catdot" style={{ background: '#8BAE8A' }}></span>Safe — eat freely</div>
              <div className="fmcard-row">
                {['Chicken', 'Rice', 'Salmon', 'Oats', 'Almonds'].map((f, i) => (
                  <span key={f} className="fmcard-chip" style={{ background: 'rgba(44,157,138,0.14)', color: '#5FD4BC', borderColor: 'rgba(44,157,138,0.4)', boxShadow: '0 0 12px rgba(44,157,138,0.18)', animationDelay: `${0.3 + i * 0.09}s` }}>{f}</span>
                ))}
              </div>
              <div className="fmcard-cat" style={{ color: '#E0A977' }}><span className="fmcard-catdot" style={{ background: '#E8941F' }}></span>Limit — small amounts</div>
              <div className="fmcard-row">
                {['Wheat', 'Corn', 'Tomato'].map((f, i) => (
                  <span key={f} className="fmcard-chip" style={{ background: 'rgba(232,148,31,0.14)', color: '#F2C078', borderColor: 'rgba(232,148,31,0.4)', boxShadow: '0 0 12px rgba(232,148,31,0.16)', animationDelay: `${0.8 + i * 0.09}s` }}>{f}</span>
                ))}
              </div>
              <div className="fmcard-cat" style={{ color: '#E89090' }}><span className="fmcard-catdot" style={{ background: '#D64545' }}></span>Avoid — clear triggers</div>
              <div className="fmcard-row">
                {['Dairy', 'Eggs', 'Gluten'].map((f, i) => (
                  <span key={f} className="fmcard-chip" style={{ background: 'rgba(214,69,69,0.13)', color: '#F2A0A0', borderColor: 'rgba(214,69,69,0.4)', boxShadow: '0 0 12px rgba(214,69,69,0.16)', animationDelay: `${1.15 + i * 0.09}s` }}>{f}</span>
                ))}
              </div>
              <div className="fmcard-foot">
                <div className="fmcard-verify" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#8BAE8A', boxShadow: '0 0 8px rgba(139,174,138,0.8)' }} />SENSIFY VERIFIED · TESTED OVER 184 DAYS</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mk-section alt">
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
              <div className="ds-step"><div className="ds-sl">Step 1</div><div className="ds-st">Test</div><div className="ds-sd">Order your certified food sensitivity test. Upload results. They are read in seconds.</div></div>
              <div className="ds-step"><div className="ds-sl">Step 2</div><div className="ds-st">Protocol</div><div className="ds-sd">6 months of structured elimination and daily compliance tracking. Your symptoms are tracked every week.</div></div>
              <div className="ds-step"><div className="ds-sl">Step 3</div><div className="ds-st">Answers</div><div className="ds-sd">Your personal Food Map. Safe, Limit, Avoid — earned through real-world testing, not lab guesswork.</div></div>
            </div>
          </div>
        </div>
      </div>

      <div className="mk-section cream">
        <div className="mk-section-inner">
          <div className="ey">How it works</div>
          <div className="sh">Four steps to <em>certainty.</em></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginTop: '28px' }}>
            {[
              { n: '01', t: 'Test', d: 'Complete your intake and at-home lab test. Your results become the starting hypothesis — the suspects, not the verdict.' },
              { n: '02', t: 'Eliminate', d: 'Eight weeks without your flagged foods, with 30-second daily check-ins. Your symptoms settle into a clean baseline.' },
              { n: '03', t: 'Reintroduce', d: 'Each food returns one at a time in a controlled cycle while we track your response. Your body gives the real answer.' },
              { n: '04', t: 'Know', d: 'Every food lands where it belongs: Safe, Limit, or Avoid. Your Food Map is permanent and yours to keep.' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#FAF8F4', border: '0.5px solid rgba(0,0,0,0.06)', borderRadius: '14px', padding: '20px 18px' }}>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: '#8BAE8A', letterSpacing: '1px', marginBottom: '10px' }}>{s.n}</div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '19px', color: '#1C1C1C', marginBottom: '8px' }}>{s.t}</div>
                <div style={{ fontSize: '12.5px', color: '#7A7A72', lineHeight: 1.65 }}>{s.d}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '22px' }}>
            <button className="btn-g" onClick={() => setTab('how')}>See the full program &rarr;</button>
          </div>
        </div>
      </div>

<div className="mk-section alt">
        <div className="mk-section-inner">
          <div className="ey">The outcome</div>
          <div className="sh">A Food Map that's <em>actually earned.</em></div>
          <div className="ss">No food gets labeled Safe without being tested. No food gets labeled Avoid without structured evidence. Every category is earned through 6 months of real experimentation.</div>
          <div className="outcome-list">
            <div className="outcome-row" style={{ background: '#DEF2EE' }}><div className="outcome-dot" style={{ background: '#2C9D8A' }}></div><div><div style={{ fontSize: '13px', fontWeight: 500, color: '#1A6256', marginBottom: '3px' }}>Safe — tested and confirmed</div><div style={{ fontSize: '12px', color: '#1A6256', opacity: 0.85 }}>Reintroduced, monitored, tolerated. Eat freely.</div></div></div>
            <div className="outcome-row" style={{ background: '#FCEFD9' }}><div className="outcome-dot" style={{ background: '#E8941F' }}></div><div><div style={{ fontSize: '13px', fontWeight: 500, color: '#8A5410', marginBottom: '3px' }}>Limit — dose-sensitive</div><div style={{ fontSize: '12px', color: '#8A5410', opacity: 0.85 }}>Fine in small amounts. Worth being mindful of.</div></div></div>
            <div className="outcome-row" style={{ background: '#FBE9E9' }}><div className="outcome-dot" style={{ background: '#D64545' }}></div><div><div style={{ fontSize: '13px', fontWeight: 500, color: '#A32D2D', marginBottom: '3px' }}>Avoid — clear trigger confirmed</div><div style={{ fontSize: '12px', color: '#A32D2D', opacity: 0.85 }}>Repeatable symptom pattern. Confirmed by your own body.</div></div></div>
          </div>
        </div>
      </div>

      <div className="mk-section cream">
        <div className="mk-section-inner">
          <div className="ey">Before you start</div>
          <div className="sh">The questions <em>everyone asks.</em></div>
          <div className="faq-list" style={{ maxWidth: '660px', marginTop: '26px' }}>
            {[
              { q: "What's included in the $399?", a: 'Everything: your lab test, the full 6-month physician-reviewed elimination and reintroduction protocol, daily and weekly check-ins, personalized insights, and your permanent Food Map. There is no separate lab bill and nothing else to buy.' },
              { q: 'What makes Sensify different from just buying a test?', a: 'A lab test gives you a list. Sensify runs each food through a controlled 14-day reintroduction cycle with daily tracking, so by the end you know for certain what your body does and does not tolerate. The test finds the suspects. Sensify confirms the truth.' },
              { q: 'How much time does it take each week?', a: 'The daily check-in takes 30 seconds. The weekly check-in takes about 2 minutes. During reintroduction cycles you spend a few extra minutes logging symptoms. It is built to fit into normal life.' },
              { q: 'What if it turns out food is not my problem?', a: 'That is a real and valuable answer, not a failure. Some people finish the protocol and find their body tolerates everything well — which saves you from years of cutting out foods for no reason and points you toward looking elsewhere. A clean result is still an answer you can trust.' },
              { q: 'Do I need to already have a lab test?', a: 'No. When you purchase the program we guide you through ordering your food sensitivity test during onboarding. We tell you exactly which test to get and how to complete it from home.' },
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
          <div style={{ marginTop: '18px' }}>
            <button className="btn-g" onClick={() => setTab('faq')}>Read all FAQs &rarr;</button>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h2>Stop guessing.<br /><em>Start knowing.</em></h2>
        <p>A lab test alone costs $150–$300 and hands you a guess. Sensify includes the lab <em style={{ fontStyle: 'normal', fontWeight: 600 }}>and</em> the six months that turn it into an answer — one price, $399, nothing else to buy.</p>
        <button className="btn-p" onClick={onGetStarted}>Start your program — $399</button>
      </div>
      <Footer />
    </div>
  )

  if (tab === 'how') return (
    <div>
      <style>{css}</style>
      <Nav />
      <div className="mk-hero" style={{ padding: '56px 64px 12px' }}>
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
              <div className="spine-desc">After 6 months every tested food is categorized by real symptom evidence. Safe, Limit, Avoid, all earned. Your Food Map is permanent, personal, and yours to keep. You can continue with Maintain, which keeps your Food Map working for you every day with Ask Sensify always on hand.</div>
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
      <div className="mk-hero" style={{ padding: '56px 64px 12px' }}>
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

          {/* An answer either way */}
          <div className="sci-answer">
            <div className="sci-answer-tag">What you walk away with</div>
            <div className="sci-answer-h">An answer either way.</div>
            <div className="sci-answer-p">Most people who suspect food never get certainty. They cut things out, feel unsure, and second-guess forever. The protocol ends that. If a food is a trigger, you will know. And if your body turns out to tolerate everything well, you will know that too, with the same confidence. That is not a disappointing result. It means food is not the thing holding you back, which saves you years of needless restriction and tells you where to look instead. We will never invent a problem to justify the program. The honest answer is the whole point.</div>
          </div>

          {/* What happens based on your results — honest path for every outcome */}
          <div className="sci-paths">
            <div className="sci-paths-tag">A path for every result</div>
            <div className="sci-paths-h">Whatever your results show, you're not left guessing.</div>
            <div className="sci-paths-grid">
              <div className="sci-path">
                <div className="sci-path-num">1</div>
                <div className="sci-path-t">Your lab flags foods</div>
                <div className="sci-path-d">We build your protocol around the specific foods your panel flagged, testing each one through elimination and reintroduction to confirm which actually affect you.</div>
              </div>
              <div className="sci-path">
                <div className="sci-path-num">2</div>
                <div className="sci-path-t">Clean panel, real symptoms</div>
                <div className="sci-path-d">A clean panel doesn't mean nothing's wrong. Many real triggers, especially digestive ones, never show up on a lab. So we test the most common culprits directly, and you choose how thorough to go.</div>
              </div>
              <div className="sci-path">
                <div className="sci-path-num">3</div>
                <div className="sci-path-t">Food isn't the issue</div>
                <div className="sci-path-d">If your panel is clean and your symptoms are minimal, the honest answer may be that food isn't your problem. That's valuable to know, and we'll tell you plainly rather than run you through a protocol with nothing to find.</div>
              </div>
            </div>
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
      <div className="mk-hero" style={{ padding: '56px 64px 12px' }}>
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
      <div className="mk-hero" style={{ padding: '56px 64px 12px' }}>
        <div className="mk-hero-inner">
          <div className="mk-tag"><div className="mk-tag-dot"></div>Questions</div>
          <div className="mk-h1" style={{ fontSize: '46px' }}>Things people <em>ask us.</em></div>
          <div className="mk-sub" style={{ marginBottom: 0 }}>Everything you might want to know before you start. Still curious about something? Reach out anytime.</div>
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

  if (tab === 'about') return (
    <div>
      <style>{css}</style>
      <Nav />
      <div className="mk-hero" style={{ padding: '56px 64px 12px' }}>
        <div className="mk-hero-inner">
          <div className="mk-tag"><div className="mk-tag-dot"></div>Our story</div>
          <div className="mk-h1" style={{ fontSize: '46px' }}>Why we built <em>Sensify.</em></div>
          <div className="mk-sub" style={{ marginBottom: 0 }}>The short version of a longer story about guessing, testing, and finally knowing.</div>
        </div>
      </div>

      <div className="mk-section alt">
        <div className="mk-section-inner" style={{ maxWidth: '720px' }}>
          {/* ===== FOUNDER STORY — PLACEHOLDER: replace with Alex's real story ===== */}
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8BAE8A', marginBottom: '18px' }}>The beginning</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: '26px', fontWeight: 300, lineHeight: 1.4, color: '#1C1C1C', marginBottom: '24px' }}>
            [Your founder story goes here. The moment you realized food was the problem, the years of guessing, what you wish had existed.]
          </div>
          <div style={{ fontSize: '16px', color: '#4A4A45', lineHeight: 1.8, marginBottom: '20px' }}>
            [A paragraph on the frustration that started it — the tests that flagged everything and explained nothing, the elimination diets with no structure, the not-knowing.]
          </div>
          <div style={{ fontSize: '16px', color: '#4A4A45', lineHeight: 1.8, marginBottom: '20px' }}>
            [A paragraph on the insight — that a lab result is only a hypothesis, and the body is what gives the verdict. Why you built the protocol, not just another test.]
          </div>
          <div style={{ fontSize: '16px', color: '#4A4A45', lineHeight: 1.8 }}>
            [A closing paragraph on who Sensify is for and the promise: nothing labeled without being earned.]
          </div>
        </div>
      </div>

      <div className="mk-section">
        <div className="mk-section-inner" style={{ maxWidth: '720px' }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#3D5C3C', marginBottom: '18px' }}>What we believe</div>
          <div style={{ display: 'grid', gap: '16px' }}>
            {[
              ['The lab finds suspects. Your body gives the verdict.', 'A flagged food is a question, not a conviction. Nothing gets labeled without being tested.'],
              ['Honesty over hype.', 'We show you what the data says, including when it is inconclusive. No miracle claims, no guesswork dressed up as certainty.'],
              ['The answer should be permanent.', 'You do the work once and keep the map for life. Your Food Map is yours to keep.'],
            ].map(([h, d], i) => (
              <div key={i} style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '16px' }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: '20px', fontWeight: 300, color: '#1C1C1C', marginBottom: '6px' }}>{h}</div>
                <div style={{ fontSize: '14.5px', color: '#7A7A72', lineHeight: 1.65 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h2>Stop guessing.<br /><em>Start knowing.</em></h2>
        <p>The complete system — test, protocol, and answers — for $399.</p>
        <button className="btn-p" onClick={onGetStarted}>Start your program</button>
      </div>
      <Footer />
    </div>
  )

  return null
}
