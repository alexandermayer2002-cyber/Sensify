import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { recommendTrack, countFlags, symptomBurden, COMMON_TRIGGERS, toBadness } from '../utils/trackRecommendation'
import { symptomsAreGI, COMMON_TRACK_ENABLED } from '../utils/protocolEngine'


const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Fraunces:ital,wght@0,300;0,500;1,300&display=swap');
  .adm { min-height: 100vh; background: #FAF8F4; font-family: 'DM Sans', sans-serif; color: #1C1C1C; }
  .adm-track { background: #0E0E0C; border-radius: 12px; padding: 15px; margin-bottom: 12px; }
  .adm-track-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 9px; }
  .adm-track-eye { font-family: 'DM Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: rgba(139,174,138,0.8); }
  .adm-track-conf { font-family: 'DM Mono', monospace; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 7px; border-radius: 5px; }
  .adm-track-conf.high { background: rgba(74,140,106,0.25); color: #8FD9B0; }
  .adm-track-conf.medium { background: rgba(232,148,31,0.22); color: #F0B468; }
  .adm-track-conf.low { background: rgba(214,69,69,0.22); color: #F0998F; }
  .adm-track-rec { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 300; color: white; margin-bottom: 6px; }
  .adm-track-reason { font-size: 12px; line-height: 1.5; color: rgba(255,255,255,0.6); margin-bottom: 10px; }
  .adm-track-signals { display: flex; gap: 16px; font-size: 11px; color: rgba(255,255,255,0.5); font-family: 'DM Mono', monospace; }
  .adm-track-signals b { color: rgba(255,255,255,0.85); }
  .adm-symptom-breakdown { background: #FAF8F4; border: 1px solid rgba(0,0,0,0.07); border-radius: 12px; padding: 14px 16px; margin-bottom: 14px; }
  .adm-sb-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: #7A7A72; margin-bottom: 10px; }
  .adm-sb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 6px 14px; margin-bottom: 10px; }
  .adm-sb-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .adm-sb-name { font-size: 12px; color: #3A3A35; }
  .adm-sb-val { font-size: 12px; font-weight: 600; font-family: 'DM Mono', monospace; }
  .adm-sb-val.high { color: #D64545; }
  .adm-sb-val.mid { color: #E8941F; }
  .adm-sb-val.low { color: #4A8C6A; }
  .adm-sb-text { font-size: 12px; color: #4A4A45; line-height: 1.5; margin-top: 6px; }
  .adm-sb-text-label { font-weight: 600; color: #3D5C3C; }
  .adm-sb-qual { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; }
  .adm-sb-qual-item { display: flex; align-items: center; gap: 6px; background: white; border: 1px solid rgba(0,0,0,0.06); border-radius: 7px; padding: 4px 9px; }
  .adm-sb-qual-name { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: #9A9A92; }
  .adm-sb-qual-val { font-size: 12px; color: #2A2A28; }
  .adm-track-opts { display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; }
  .adm-track-opt { padding: 8px 13px; border-radius: 9px; border: 1.5px solid rgba(0,0,0,0.12); background: white; font-size: 12.5px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; color: #1C1C1C; }
  .adm-track-opt.on { border-color: #3D5C3C; background: #EDF3ED; color: #2D6B42; }
  .adm-foodpick { background: #F2F5EF; border-radius: 10px; padding: 12px; margin-bottom: 10px; }
  .adm-foodpick-label { font-size: 11px; font-weight: 600; color: #3D5C3C; margin-bottom: 9px; }
  .adm-foodpick-grid { display: flex; flex-wrap: wrap; gap: 6px; }
  .adm-foodpick-chip { padding: 6px 11px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.12); background: white; font-size: 11.5px; cursor: pointer; font-family: 'DM Sans', sans-serif; color: #1C1C1C; }
  .adm-foodpick-chip.on { border-color: #3D5C3C; background: #3D5C3C; color: white; }
  .adm-decline-note { font-size: 12px; color: #8A5410; background: #FCEFD9; border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; }
  .adm-btn.amber { background: #E8941F; color: white; }
  .adm-overview { display: flex; flex-direction: column; gap: 16px; }
  .adm-metrics { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
  @media (max-width: 760px) { .adm-metrics { grid-template-columns: repeat(2, 1fr); } }
  .adm-metric { background: #0E0E0C; border-radius: 13px; padding: 18px; }
  .adm-metric.alert { background: #2A1410; }
  .adm-metric-val { font-family: 'Fraunces', serif; font-size: 32px; font-weight: 300; color: white; line-height: 1; }
  .adm-metric-label { font-family: 'DM Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.6px; color: rgba(255,255,255,0.5); margin-top: 8px; }
  .adm-ov-card { background: white; border: 1px solid rgba(0,0,0,0.07); border-radius: 14px; padding: 18px; }
  .adm-ov-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 760px) { .adm-ov-grid { grid-template-columns: 1fr; } }
  .adm-ov-title { font-size: 13px; font-weight: 600; margin-bottom: 14px; }
  .adm-bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 9px; }
  .adm-bar-label { font-size: 12px; color: #3A3A38; width: 130px; flex-shrink: 0; display: flex; align-items: center; }
  .adm-bar-track { flex: 1; height: 7px; background: #F1EFE8; border-radius: 4px; overflow: hidden; }
  .adm-bar-fill { height: 7px; background: #3D5C3C; border-radius: 4px; }
  .adm-bar-val { font-family: 'DM Mono', monospace; font-size: 12px; color: #1C1C1C; width: 28px; text-align: right; }
  .adm-track-dot { width: 8px; height: 8px; border-radius: 50%; margin-right: 7px; }
  .adm-nav { background: rgba(255,255,255,0.92); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(0,0,0,0.07); padding: 0 28px; display: flex; align-items: center; justify-content: space-between; height: 56px; position: sticky; top: 0; z-index: 100; }
  .adm-logo { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 500; color: #1C1C1C; }
  .adm-logo em { color: #3D5C3C; font-style: italic; }
  .adm-badge { font-size: 11px; background: #1C1C1C; color: white; padding: 3px 9px; border-radius: 20px; font-weight: 600; margin-left: 8px; }
  .adm-back { font-size: 13px; color: #7A7A72; background: none; border: none; cursor: pointer; font-family: 'DM Sans', sans-serif; }
  .adm-back:hover { color: #1C1C1C; }

  .adm-body { max-width: 1100px; margin: 0 auto; padding: 28px 28px 60px; }

  .adm-stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .adm-stat-card { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 13px; padding: 16px; }
  .adm-stat-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: #7A7A72; margin-bottom: 8px; }
  .adm-stat-val { font-family: 'Fraunces', serif; font-size: 32px; font-weight: 300; line-height: 1; margin-bottom: 3px; letter-spacing: -0.5px; }
  .adm-stat-sub { font-size: 11px; color: #7A7A72; }
  .adm-stat-card.alert { border-color: rgba(212,137,74,0.3); background: #FDF2EA; }
  .adm-stat-card.alert .adm-stat-val { color: #D4894A; }

  .adm-tabs { display: flex; gap: 1px; background: rgba(0,0,0,0.05); border-radius: 10px; padding: 3px; margin-bottom: 20px; width: fit-content; }
  .adm-tab { font-size: 13px; font-weight: 500; color: #7A7A72; padding: 7px 16px; border-radius: 8px; border: none; background: none; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; display: flex; align-items: center; gap: 7px; }
  .adm-tab.active { background: #FFFFFF; color: #1C1C1C; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .adm-tab-count { background: #3D5C3C; color: white; font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 10px; }
  .adm-tab-alert { background: #D4894A; color: white; font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 10px; }

  .adm-toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
  .adm-search { flex: 1; min-width: 200px; border: 1.5px solid rgba(0,0,0,0.08); border-radius: 9px; padding: 9px 14px; font-size: 13px; font-family: 'DM Sans', sans-serif; color: #1C1C1C; background: #FFFFFF; outline: none; }
  .adm-search:focus { border-color: #3D5C3C; }
  .adm-filter { font-size: 12px; font-family: 'DM Sans', sans-serif; border: 1.5px solid rgba(0,0,0,0.08); border-radius: 9px; padding: 8px 12px; background: #FFFFFF; color: #1C1C1C; cursor: pointer; outline: none; }
  .adm-filter:focus { border-color: #3D5C3C; }
  .adm-export { font-size: 12px; font-weight: 500; color: #7A7A72; background: none; border: 1px solid rgba(0,0,0,0.1); border-radius: 9px; padding: 8px 14px; cursor: pointer; font-family: 'DM Sans', sans-serif; }
  .adm-export:hover { color: #1C1C1C; border-color: rgba(0,0,0,0.2); }

  .adm-section-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; color: #7A7A72; margin-bottom: 12px; }
  .adm-card { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 16px; padding: 22px; margin-bottom: 14px; }
  .adm-card.urgent { border-color: rgba(212,137,74,0.4); }
  .adm-card-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
  .adm-user-name { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 300; margin-bottom: 3px; cursor: pointer; }
  .adm-user-name:hover em { text-decoration: underline; }
  .adm-user-name em { font-style: italic; color: #3D5C3C; }
  .adm-user-meta { font-size: 12px; color: #7A7A72; }
  .adm-date { font-size: 12px; color: #7A7A72; text-align: right; }

  .adm-food-groups { margin-bottom: 18px; }
  .adm-food-group { margin-bottom: 10px; }
  .adm-food-group-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #7A7A72; margin-bottom: 7px; }
  .adm-food-pills { display: flex; flex-wrap: wrap; gap: 6px; }
  .adm-pill { font-size: 12px; font-weight: 500; padding: 4px 11px; border-radius: 20px; }
  .adm-pill.high { background: #FBE9E9; color: #A32D2D; }
  .adm-pill.moderate { background: #FCEFD9; color: #8A5410; }
  .adm-pill.low { background: #DEF2EE; color: #1A6256; }

  .adm-actions { display: flex; gap: 9px; flex-wrap: wrap; align-items: center; }
  .adm-btn { border: none; border-radius: 9px; padding: 10px 18px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: opacity 0.15s; }
  .adm-btn:hover { opacity: 0.87; }
  .adm-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .adm-btn.green { background: #3D5C3C; color: white; }
  .adm-btn.amber { background: #D4894A; color: white; }
  .adm-btn.red { background: none; color: #C95B5B; border: 1.5px solid #C95B5B; }
  .adm-btn.ghost { background: none; color: #7A7A72; border: 1px solid rgba(0,0,0,0.1); }
  .adm-btn.ghost:hover { color: #1C1C1C; border-color: rgba(0,0,0,0.2); }
  .adm-success-badge { display: inline-flex; align-items: center; gap: 5px; background: #EAF4EE; color: #4A8C6A; font-size: 12px; font-weight: 500; padding: 6px 12px; border-radius: 20px; }
  .adm-divider { height: 1px; background: rgba(0,0,0,0.06); margin: 16px 0; }

  .adm-trend { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
  .adm-trend-card { background: #FAF8F4; border-radius: 10px; padding: 12px; }
  .adm-trend-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #7A7A72; margin-bottom: 8px; }
  .adm-trend-row { display: flex; align-items: center; gap: 10px; }
  .adm-trend-val { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 300; line-height: 1; }
  .adm-trend-sub { font-size: 11px; color: #7A7A72; margin-top: 2px; }
  .adm-trend-change { font-size: 11px; font-weight: 500; margin-top: 3px; }
  .adm-trend-change.good { color: #4A8C6A; }
  .adm-trend-change.bad { color: #C95B5B; }

  .adm-dots { display: flex; gap: 4px; margin-bottom: 16px; flex-wrap: wrap; }
  .adm-dot-col { display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .adm-dot-bar { width: 16px; height: 7px; border-radius: 4px; }
  .adm-dot-bar.yes { background: #4A8C6A; }
  .adm-dot-bar.no { background: #C95B5B; }
  .adm-dot-bar.none { background: rgba(0,0,0,0.07); }

  .adm-audit-answers { background: #FAF8F4; border-radius: 10px; padding: 14px; margin-bottom: 16px; }
  .adm-audit-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #7A7A72; margin-bottom: 10px; }
  .adm-audit-item { font-size: 13px; color: #1C1C1C; margin-bottom: 6px; display: flex; gap: 8px; }
  .adm-audit-item span { color: #7A7A72; flex-shrink: 0; }
  .adm-ai-ack { background: #EDF3ED; border-radius: 10px; padding: 12px; margin-bottom: 16px; }
  .adm-ai-ack-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #3D5C3C; margin-bottom: 6px; }
  .adm-ai-ack-text { font-size: 13px; color: #1C1C1C; line-height: 1.65; }
  .adm-suggested { display: inline-flex; align-items: center; gap: 6px; background: #FAF8F4; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; padding: 5px 10px; font-size: 12px; color: #7A7A72; margin-bottom: 14px; }
  .adm-suggested strong { color: #1C1C1C; }

  .adm-note { width: 100%; border: 1.5px solid rgba(0,0,0,0.08); border-radius: 10px; padding: 11px 13px; font-size: 13px; font-family: 'DM Sans', sans-serif; color: #1C1C1C; background: #FFFFFF; resize: none; height: 72px; outline: none; margin-bottom: 12px; }
  .adm-note:focus { border-color: #3D5C3C; }

  .adm-msg-compose { background: #FAF8F4; border-radius: 10px; padding: 14px; margin-top: 14px; }
  .adm-msg-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #7A7A72; margin-bottom: 8px; }
  .adm-msg-input { width: 100%; border: 1.5px solid rgba(0,0,0,0.08); border-radius: 9px; padding: 10px 12px; font-size: 13px; font-family: 'DM Sans', sans-serif; color: #1C1C1C; background: #FFFFFF; outline: none; margin-bottom: 8px; }
  .adm-msg-input:focus { border-color: #3D5C3C; }
  .adm-msg-body { width: 100%; border: 1.5px solid rgba(0,0,0,0.08); border-radius: 9px; padding: 10px 12px; font-size: 13px; font-family: 'DM Sans', sans-serif; color: #1C1C1C; background: #FFFFFF; resize: none; height: 80px; outline: none; margin-bottom: 8px; }
  .adm-msg-body:focus { border-color: #3D5C3C; }

  .adm-users-table { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 14px; overflow: hidden; }
  .adm-table-header { display: grid; grid-template-columns: 2fr 1.2fr 0.8fr 0.8fr 1fr 1fr 0.8fr; gap: 10px; padding: 11px 16px; background: #FAF8F4; border-bottom: 1px solid rgba(0,0,0,0.07); }
  .adm-th { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #7A7A72; }
  .adm-table-row { display: grid; grid-template-columns: 2fr 1.2fr 0.8fr 0.8fr 1fr 1fr 0.8fr; gap: 10px; padding: 12px 16px; border-bottom: 1px solid rgba(0,0,0,0.05); align-items: center; font-size: 13px; cursor: pointer; transition: background 0.1s; }
  .adm-table-row:hover { background: #FAF8F4; }
  .adm-table-row:last-child { border-bottom: none; }
  .adm-table-row.inactive { opacity: 0.6; }
  .adm-table-name { font-weight: 500; color: #3D5C3C; }
  .adm-table-email { font-size: 11px; color: #7A7A72; margin-top: 1px; }
  .adm-phase-pill { font-size: 10px; font-weight: 500; padding: 3px 8px; border-radius: 20px; display: inline-block; }
  .adm-phase-pill.setup { background: #FAF8F4; color: #7A7A72; border: 1px solid rgba(0,0,0,0.08); }
  .adm-phase-pill.elimination { background: #EDF3ED; color: #3D5C3C; }
  .adm-phase-pill.reintroduction { background: #FDF2EA; color: #D4894A; }
  .adm-phase-pill.pending { background: #FDF2EA; color: #D4894A; }
  .adm-phase-pill.complete { background: #EAF4EE; color: #4A8C6A; }
  .adm-inactive-dot { width: 7px; height: 7px; border-radius: 50%; background: #C95B5B; display: inline-block; margin-right: 5px; }

  .adm-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; text-align: center; background: #FFFFFF; border: 1px solid rgba(0,0,0,0.07); border-radius: 14px; }
  .adm-empty-title { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 300; margin-bottom: 6px; }
  .adm-empty-title em { font-style: italic; color: #3D5C3C; }
  .adm-empty-sub { font-size: 13px; color: #7A7A72; }

  .adm-spinner { width: 28px; height: 28px; border: 2.5px solid #EDF3ED; border-top-color: #3D5C3C; border-radius: 50%; animation: adm-spin 0.8s linear infinite; margin: 40px auto; }
  @keyframes adm-spin { to { transform: rotate(360deg) } }

  /* User profile modal */
  .adm-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .adm-modal { background: #FFFFFF; border-radius: 18px; width: 100%; max-width: 640px; max-height: 85vh; overflow-y: auto; }
  .adm-modal-header { padding: 22px 24px 0; display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; position: sticky; top: 0; background: #FFFFFF; border-bottom: 1px solid rgba(0,0,0,0.06); padding-bottom: 16px; }
  .adm-modal-title { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 300; }
  .adm-modal-title em { font-style: italic; color: #3D5C3C; }
  .adm-modal-close { background: none; border: none; font-size: 22px; color: #7A7A72; cursor: pointer; line-height: 1; }
  .adm-modal-body { padding: 16px 24px 24px; }
  .adm-profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
  .adm-profile-card { background: #FAF8F4; border-radius: 10px; padding: 12px; }
  .adm-profile-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #7A7A72; margin-bottom: 5px; }
  .adm-profile-val { font-size: 13px; color: #1C1C1C; font-weight: 500; }
  .adm-profile-sub { font-size: 11px; color: #7A7A72; margin-top: 2px; }
  .adm-checkin-list { display: flex; flex-direction: column; gap: 8px; }
  .adm-checkin-item { background: #FAF8F4; border-radius: 9px; padding: 11px 13px; }
  .adm-checkin-week { font-size: 12px; font-weight: 500; color: #3D5C3C; margin-bottom: 5px; }
  .adm-checkin-scores { display: flex; gap: 12px; flex-wrap: wrap; }
  .adm-checkin-score { font-size: 12px; color: #7A7A72; }
  .adm-checkin-score strong { color: #1C1C1C; }
  .adm-checkin-insight { font-size: 12px; color: #7A7A72; margin-top: 5px; font-style: italic; line-height: 1.55; }

  .adm-audit-history { display: flex; flex-direction: column; gap: 8px; }
  .adm-audit-history-item { background: #FAF8F4; border-radius: 9px; padding: 11px 13px; }
  .adm-audit-outcome { display: inline-flex; align-items: center; font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 20px; margin-bottom: 5px; }
  .adm-audit-outcome.keep { background: #EDF3ED; color: #3D5C3C; }
  .adm-audit-outcome.reset { background: #FDF2EA; color: #D4894A; }
  .adm-audit-outcome.escalate { background: #FAEAEA; color: #C95B5B; }
  .adm-audit-note { font-size: 12px; color: #7A7A72; margin-top: 4px; font-style: italic; }
`

const HARDEST_PARTS_LABELS = {
  cravings: 'Food cravings', social: 'Social situations', hidden: 'Hidden ingredients',
  life: 'Life got in the way', cooking: 'Cooking for others', cost: 'Cost',
  ideas: "Don't know what to eat", other: 'Other',
}

const SUGGESTED_OUTCOME = (audit) => {
  const stress = audit.branch_responses?.stress_score
  if (stress >= 8) return 'Reset clock'
  if (audit.hardest_parts?.includes('hidden') || audit.hardest_parts?.includes('social')) return 'Keep going'
  return 'Keep going'
}

export default function AdminDashboard({ session, onBack }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [labResults, setLabResults] = useState([])
  const [audits, setAudits] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState({})
  const [responding, setResponding] = useState({})
  const [notes, setNotes] = useState({})
  const [responded, setResponded] = useState({})
  const [approved, setApproved] = useState({})
  const [search, setSearch] = useState('')
  const [phaseFilter, setPhaseFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDetail, setUserDetail] = useState(null)
  const [loadingUser, setLoadingUser] = useState(false)
  const [msgSubject, setMsgSubject] = useState({})
  const [msgBody, setMsgBody] = useState({})
  const [msgSent, setMsgSent] = useState({})
  const [showMsgCompose, setShowMsgCompose] = useState({})
  const [trackChoice, setTrackChoice] = useState({})    // labId -> chosen track
  const [trackFoodSel, setTrackFoodSel] = useState({})  // labId -> array of selected food names

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const { data: labs } = await supabase.from('lab_results').select('*').eq('status', 'pending_review').order('submitted_at', { ascending: false })
      if (labs) {
        const enriched = await Promise.all(labs.map(async (l) => {
          const { data: p } = await supabase.from('profiles').select('*').eq('id', l.user_id).maybeSingle()
          // Prefer a short-lived signed URL (works with a private bucket).
          // Falls back to legacy public file_url if no path stored.
          let viewUrl = l.file_url
          if (l.file_path) {
            const { data: signed } = await supabase.storage.from('lab-results').createSignedUrl(l.file_path, 3600)
            if (signed?.signedUrl) viewUrl = signed.signedUrl
          }
          return { ...l, profile: p, view_url: viewUrl }
        }))
        setLabResults(enriched)
      }

      const { data: auditData } = await supabase.from('compliance_audit').select('*').eq('status', 'pending_admin_review').order('triggered_at', { ascending: false })
      if (auditData) {
        const enriched = await Promise.all(auditData.map(async (a) => {
          const { data: p } = await supabase.from('profiles').select('*').eq('id', a.user_id).single()
          const { data: checkins } = await supabase.from('weekly_checkins').select('answers, week_number').eq('user_id', a.user_id).order('submitted_at', { ascending: false }).limit(1).single()
          const { data: comp } = await supabase.from('daily_compliance').select('*').eq('user_id', a.user_id).order('date', { ascending: false }).limit(30)
          return { ...a, profile: p, latest_checkin: checkins, compliance_history: comp || [] }
        }))
        setAudits(enriched)
      }

      const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (profiles) setUsers(profiles)
    } catch (e) {}
    setLoading(false)
  }

  const loadUserDetail = async (user) => {
    setLoadingUser(true)
    setSelectedUser(user)
    try {
      const { data: checkins } = await supabase.from('weekly_checkins').select('*').eq('user_id', user.id).order('submitted_at', { ascending: false })
      const { data: labs } = await supabase.from('lab_results').select('*').eq('user_id', user.id).order('submitted_at', { ascending: false }).limit(1).single()
      const { data: comp } = await supabase.from('daily_compliance').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(30)
      const { data: auditHistory } = await supabase.from('compliance_audit').select('*').eq('user_id', user.id).order('triggered_at', { ascending: false })
      const { data: foodMap } = await supabase.from('food_map').select('*').eq('user_id', user.id)
      const { data: dailyFactors } = await supabase.from('daily_factors').select('*').eq('user_id', user.id).order('log_date', { ascending: false }).limit(30)
      const { data: confoundObs } = await supabase.from('confound_observations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
      setUserDetail({ checkins: checkins || [], labs, comp: comp || [], auditHistory: auditHistory || [], foodMap: foodMap || [], dailyFactors: dailyFactors || [], confoundObs: confoundObs || [] })
    } catch (e) {}
    setLoadingUser(false)
  }

  const approveLab = async (labId, userId, track = 'flagged', trackFoods = null, trackNote = '') => {
    setApproving(prev => ({ ...prev, [labId]: true }))

    // Declining: mark the lab reviewed but do NOT start a protocol.
    if (track === 'declined') {
      const { error: labError } = await supabase.from('lab_results').update({ status: 'approved' }).eq('id', labId)
      const { error: profileError, data: updated } = await supabase.from('profiles').update({
        program_phase: 'declined',
        protocol_track: 'declined',
        track_assigned_at: new Date().toISOString(),
        track_note: trackNote || null,
      }).eq('id', userId).select()
      setApproving(prev => ({ ...prev, [labId]: false }))
      if (labError || profileError || !updated || updated.length === 0) {
        alert(`Update failed: ${labError?.message || profileError?.message || 'profile update blocked (check RLS admin policy)'}`)
        return
      }
      setApproved(prev => ({ ...prev, [labId]: true }))
      return
    }

    // Start date is tomorrow — gives user rest of today to prepare
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const { error: labError } = await supabase.from('lab_results').update({ status: 'approved' }).eq('id', labId)

    // Flagged track starts elimination immediately (as before).
    // Common track is assigned but the USER chooses their tier (or declines)
    // before the protocol starts, so it goes into a pending-decision state.
    const profileUpdate = track === 'common'
      ? {
          program_phase: 'awaiting_decision',
          protocol_track: 'common',
          track_decision: 'pending',
          track_assigned_at: new Date().toISOString(),
          track_note: trackNote || null,
        }
      : {
          program_phase: 'elimination',
          protocol_start_date: tomorrowStr,
          protocol_track: track,
          track_foods: trackFoods,
          track_assigned_at: new Date().toISOString(),
          track_note: trackNote || null,
        }

    const { error: profileError, data: updated } = await supabase.from('profiles')
      .update(profileUpdate).eq('id', userId).select()

    setApproving(prev => ({ ...prev, [labId]: false }))

    // RLS silently "succeeds" with 0 rows updated — treat that as failure too
    if (labError || profileError || !updated || updated.length === 0) {
      alert(`Approval failed: ${labError?.message || profileError?.message || 'profile update blocked (check RLS admin policy)'}`)
      return
    }
    setApproved(prev => ({ ...prev, [labId]: true }))
  }

  const respondToAudit = async (auditId, userId, outcome) => {
    setResponding(prev => ({ ...prev, [auditId]: true }))
    const note = notes[auditId] || ''
    await supabase.from('compliance_audit').update({ status: 'responded', admin_outcome: outcome, admin_note: note, responded_at: new Date().toISOString() }).eq('id', auditId)
    if (outcome === 'Reset clock') {
      const today = new Date().toISOString().split('T')[0]
      await supabase.from('profiles').update({ protocol_start_date: today, program_phase: 'elimination' }).eq('id', userId)
    }
    setResponded(prev => ({ ...prev, [auditId]: outcome }))
    setResponding(prev => ({ ...prev, [auditId]: false }))
  }

  const exportCSV = () => {
    const headers = ['Name', 'Phase', 'Day', 'Streak', 'Last Check-in', 'Joined']
    const rows = filteredUsers.map(u => [
      u.full_name || '', u.program_phase || 'setup', u.current_day || 0,
      u.streak || 0, u.last_checkin_at ? new Date(u.last_checkin_at).toLocaleDateString() : '',
      u.created_at ? new Date(u.created_at).toLocaleDateString() : ''
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'sensify-users.csv'; a.click()
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
  const formatDateTime = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  // Protocol day computed from start date (same logic as the user dashboard),
  // since current_day isn't a live-maintained column.
  const computeDay = (u) => {
    if (!u?.protocol_start_date) return null
    if (u.program_phase === 'pending_review' || u.program_phase === 'awaiting_results' || !u.program_phase) return null
    const [y, m, d] = u.protocol_start_date.split('T')[0].split('-').map(Number)
    const start = new Date(y, m - 1, d)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const day = Math.round((today - start) / (1000 * 60 * 60 * 24)) + 1
    return Math.max(0, day)
  }

  const isInactive = (u) => {
    if (!u.last_checkin_at && !u.intake_completed_at) return false
    const lastActivity = u.last_checkin_at || u.intake_completed_at
    const daysSince = (new Date() - new Date(lastActivity)) / (1000 * 60 * 60 * 24)
    return daysSince > 14
  }

  // Aggregate stats across all users for the Overview cockpit
  const stats = (() => {
    const total = users.length
    const byPhase = { setup: 0, awaiting_results: 0, pending_review: 0, elimination: 0, reintroduction: 0, declined: 0, complete: 0 }
    users.forEach(u => {
      const p = u.program_phase || 'setup'
      if (byPhase[p] != null) byPhase[p]++
      else byPhase.setup++
    })
    const active = byPhase.elimination + byPhase.reintroduction
    const inactive = users.filter(isInactive).length

    // Track distribution
    // Detailed outcome buckets (Option B): active protocols separated from
    // tracking exits, with the two tracking sources split (admin-skip vs user-decline).
    const outcomes = {
      flagged: 0,
      commonAwaiting: 0,
      commonTest2: 0,
      commonTest8: 0,
      userDeclined: 0,    // was on common, chose to track
      adminSkipped: 0,    // admin assigned skip -> track
      completed: 0,
    }
    users.forEach(u => {
      const t = u.protocol_track
      const d = u.track_decision
      if (u.program_phase === 'complete') { outcomes.completed++; return }
      if (t === 'flagged') outcomes.flagged++
      else if (t === 'common') {
        if (d === 'declined') outcomes.userDeclined++
        else if (d === 'active') {
          if (Number(u.protocol_tier) === 2) outcomes.commonTest8++
          else outcomes.commonTest2++
        } else outcomes.commonAwaiting++  // pending / null
      } else if (t === 'declined') outcomes.adminSkipped++
    })
    const byTrack = { flagged: 0, common: 0, wellness: 0, declined: 0 }
    users.forEach(u => { if (u.protocol_track && byTrack[u.protocol_track] != null) byTrack[u.protocol_track]++ })

    // Average symptom burden of users who completed intake
    const burdens = users.map(u => symptomBurden(u)).filter(b => b > 0)
    const avgBurden = burdens.length ? burdens.reduce((a, b) => a + b, 0) / burdens.length : 0

    // Completion proxy: intake completed
    const intakeDone = users.filter(u => u.intake_completed_at).length
    const intakeRate = total ? Math.round((intakeDone / total) * 100) : 0

    // Funnel
    const signed = total
    const didIntake = intakeDone
    const inProtocol = active
    const completed = byPhase.complete

    return { total, byPhase, active, inactive, byTrack, outcomes, avgBurden, intakeRate, funnel: { signed, didIntake, inProtocol, completed } }
  })()

  const pendingLabCount = labResults.filter(l => !approved[l.id]).length
  const pendingAuditCount = audits.filter(a => !responded[a.id]).length
  const activeUsers = users.filter(u => u.program_phase === 'elimination' || u.program_phase === 'reintroduction').length
  const inactiveUsers = users.filter(u => isInactive(u)).length

  const filteredUsers = users.filter(u => {
    const matchSearch = !search || (u.full_name || '').toLowerCase().includes(search.toLowerCase()) || (u.id || '').includes(search)
    const matchPhase = phaseFilter === 'all' || u.program_phase === phaseFilter || (phaseFilter === 'inactive' && isInactive(u))
    return matchSearch && matchPhase
  })

  return (
    <div className="adm">
      <style>{css}</style>

      <nav className="adm-nav">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div className="adm-logo">sensi<em>fy</em></div>
          <span className="adm-badge">Admin</span>
        </div>
        <button className="adm-back" onClick={onBack}>← Back to dashboard</button>
      </nav>

      <div className="adm-body">

        {/* STATS */}
        <div className="adm-stats-row">
          <div className="adm-stat-card">
            <div className="adm-stat-label">Total users</div>
            <div className="adm-stat-val">{users.length}</div>
            <div className="adm-stat-sub">all time</div>
          </div>
          <div className="adm-stat-card">
            <div className="adm-stat-label">Active</div>
            <div className="adm-stat-val">{activeUsers}</div>
            <div className="adm-stat-sub">in program</div>
          </div>
          <div className={`adm-stat-card${pendingLabCount + pendingAuditCount > 0 ? ' alert' : ''}`}>
            <div className="adm-stat-label">Pending</div>
            <div className="adm-stat-val">{pendingLabCount + pendingAuditCount}</div>
            <div className="adm-stat-sub">need your attention</div>
          </div>
          <div className={`adm-stat-card${inactiveUsers > 0 ? ' alert' : ''}`}>
            <div className="adm-stat-label">Inactive</div>
            <div className="adm-stat-val">{inactiveUsers}</div>
            <div className="adm-stat-sub">14+ days silent</div>
          </div>
        </div>

        {/* TABS */}
        <div className="adm-tabs">
          <button className={`adm-tab${activeTab === 'overview' ? ' active' : ''}`} onClick={() => setActiveTab('overview')}>
            Overview
          </button>
          <button className={`adm-tab${activeTab === 'labs' ? ' active' : ''}`} onClick={() => setActiveTab('labs')}>
            Lab results {pendingLabCount > 0 && <span className="adm-tab-count">{pendingLabCount}</span>}
          </button>
          <button className={`adm-tab${activeTab === 'audits' ? ' active' : ''}`} onClick={() => setActiveTab('audits')}>
            Audits {pendingAuditCount > 0 && <span className="adm-tab-alert">{pendingAuditCount}</span>}
          </button>
          <button className={`adm-tab${activeTab === 'users' ? ' active' : ''}`} onClick={() => setActiveTab('users')}>
            All users <span style={{ fontSize: '11px', color: '#7A7A72', marginLeft: '2px' }}>{users.length}</span>
          </button>
        </div>

        {loading && <div className="adm-spinner" />}

        {/* LAB RESULTS TAB */}
        {!loading && activeTab === 'overview' && (
          <div className="adm-overview">
            {/* Top metric row */}
            <div className="adm-metrics">
              <div className="adm-metric">
                <div className="adm-metric-val">{stats.total}</div>
                <div className="adm-metric-label">Total users</div>
              </div>
              <div className="adm-metric">
                <div className="adm-metric-val">{stats.active}</div>
                <div className="adm-metric-label">In protocol</div>
              </div>
              <div className="adm-metric">
                <div className="adm-metric-val">{stats.intakeRate}%</div>
                <div className="adm-metric-label">Completed intake</div>
              </div>
              <div className="adm-metric">
                <div className="adm-metric-val">{stats.avgBurden.toFixed(1)}</div>
                <div className="adm-metric-label">Avg symptom burden</div>
              </div>
              <div className="adm-metric alert">
                <div className="adm-metric-val">{stats.inactive}</div>
                <div className="adm-metric-label">Inactive 14d+</div>
              </div>
            </div>

            {/* Phase distribution */}
            <div className="adm-ov-card">
              <div className="adm-ov-title">Phase distribution</div>
              {[
                { k: 'setup', label: 'Setup' },
                { k: 'awaiting_results', label: 'Awaiting results' },
                { k: 'pending_review', label: 'Pending review' },
                { k: 'elimination', label: 'Elimination' },
                { k: 'reintroduction', label: 'Reintroduction' },
                { k: 'complete', label: 'Complete' },
                { k: 'declined', label: 'Declined' },
              ].map(({ k, label }) => {
                const n = stats.byPhase[k] || 0
                const pct = stats.total ? Math.round((n / stats.total) * 100) : 0
                return (
                  <div key={k} className="adm-bar-row">
                    <div className="adm-bar-label">{label}</div>
                    <div className="adm-bar-track"><div className="adm-bar-fill" style={{ width: `${pct}%` }} /></div>
                    <div className="adm-bar-val">{n}</div>
                  </div>
                )
              })}
            </div>

            {/* Track distribution + funnel */}
            <div className="adm-ov-grid">
              <div className="adm-ov-card">
                <div className="adm-ov-title">Protocol outcomes</div>
                {(() => {
                  const o = stats.outcomes
                  const Row = ({ label, n, c, indent }) => (
                    <div className="adm-bar-row" style={indent ? { paddingLeft: '16px' } : {}}>
                      <div className="adm-bar-label" style={indent ? { fontSize: '12px', color: '#7A7A72' } : {}}>
                        {c && <span className="adm-track-dot" style={{ background: c }} />}{indent && <span style={{ color: '#C3C3BB', marginRight: '4px' }}>↳</span>}{label}
                      </div>
                      <div className="adm-bar-val">{n}</div>
                    </div>
                  )
                  return (
                    <>
                      <Row label="Test Flagged Foods" n={o.flagged} c="#3D5C3C" />
                      <div style={{ height: '8px' }} />
                      <div className="adm-bar-label" style={{ fontWeight: 600, color: '#E8941F', marginBottom: '6px' }}>Test Common Triggers</div>
                      <Row label="Awaiting choice" n={o.commonAwaiting} indent />
                      <Row label="Test 2 Foods" n={o.commonTest2} indent />
                      <Row label="Test 8 Foods" n={o.commonTest8} indent />
                      <div style={{ height: '8px' }} />
                      <div className="adm-bar-label" style={{ fontWeight: 600, color: '#D64545', marginBottom: '6px' }}>Tracking (no protocol)</div>
                      <Row label="Declined by user" n={o.userDeclined} indent />
                      <Row label="Skipped by admin" n={o.adminSkipped} indent />
                      <div style={{ height: '8px' }} />
                      <Row label="Completed (Food Map)" n={o.completed} c="#4A8C6A" />
                    </>
                  )
                })()}
              </div>

              <div className="adm-ov-card">
                <div className="adm-ov-title">Funnel</div>
                {[
                  { label: 'Signed up', n: stats.funnel.signed },
                  { label: 'Completed intake', n: stats.funnel.didIntake },
                  { label: 'In protocol', n: stats.funnel.inProtocol },
                  { label: 'Completed program', n: stats.funnel.completed },
                ].map((s, i) => {
                  const pct = stats.funnel.signed ? Math.round((s.n / stats.funnel.signed) * 100) : 0
                  return (
                    <div key={i} className="adm-bar-row">
                      <div className="adm-bar-label">{s.label}</div>
                      <div className="adm-bar-track"><div className="adm-bar-fill" style={{ width: `${pct}%` }} /></div>
                      <div className="adm-bar-val">{s.n}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'labs' && (
          <>
            {labResults.length === 0 ? (
              <div className="adm-empty">
                <div className="adm-empty-title">No pending <em>lab results.</em></div>
                <div className="adm-empty-sub">When users submit their results they'll appear here for your review.</div>
              </div>
            ) : (
              <>
                <div className="adm-section-label">{pendingLabCount} pending approval</div>
                {labResults.map(lab => {
                  const isApproved = approved[lab.id]
                  const highFoods = lab.foods?.filter(f => f.level === 'High') || []
                  const moderateFoods = lab.foods?.filter(f => f.level === 'Moderate') || []
                  const lowFoods = lab.foods?.filter(f => f.level === 'Low') || []
                  const totalFoods = highFoods.length + moderateFoods.length + lowFoods.length
                  return (
                    <div key={lab.id} className="adm-card">
                      <div className="adm-card-header">
                        <div>
                          <div className="adm-user-name" onClick={() => { const u = users.find(u => u.id === lab.user_id); if (u) loadUserDetail(u) }}>
                            <em>{lab.user_name || lab.profile?.full_name || 'Unknown user'}</em>
                          </div>
                          <div className="adm-user-meta">{lab.foods?.length || 0} foods flagged · Submitted {formatDateTime(lab.submitted_at)}</div>
                        </div>
                        <div className="adm-date">{lab.user_id?.slice(0, 8)}...</div>
                      </div>

                      <div className="adm-food-groups">
                        {(lab.view_url || lab.file_url) && (
                          <div style={{ marginBottom: '14px' }}>
                            <div className="adm-food-group-label" style={{ marginBottom: '8px' }}>Original submission</div>
                            {(lab.file_path || lab.file_url || '').endsWith('.pdf') ? (
                              <a href={lab.view_url || lab.file_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: '#3D5C3C', fontWeight: 500, textDecoration: 'none', background: '#EDF3ED', padding: '8px 14px', borderRadius: '9px' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3D5C3C" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                View PDF
                              </a>
                            ) : (
                              <a href={lab.view_url || lab.file_url} target="_blank" rel="noopener noreferrer">
                                <img src={lab.view_url || lab.file_url} alt="Lab results" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.08)', objectFit: 'contain' }} />
                              </a>
                            )}
                          </div>
                        )}
                        {!lab.file_url && (
                          <div style={{ marginBottom: '14px', fontSize: '12px', color: '#7A7A72', fontStyle: 'italic' }}>Manually entered — no file uploaded</div>
                        )}
                        {highFoods.length > 0 && (
                          <div className="adm-food-group">
                            <div className="adm-food-group-label">High — {highFoods.length}</div>
                            <div className="adm-food-pills">{highFoods.map((f, i) => <div key={i} className="adm-pill high">{f.name}</div>)}</div>
                          </div>
                        )}
                        {moderateFoods.length > 0 && (
                          <div className="adm-food-group">
                            <div className="adm-food-group-label">Moderate — {moderateFoods.length}</div>
                            <div className="adm-food-pills">{moderateFoods.map((f, i) => <div key={i} className="adm-pill moderate">{f.name}</div>)}</div>
                          </div>
                        )}
                        {lowFoods.length > 0 && (
                          <div className="adm-food-group">
                            <div className="adm-food-group-label">Low — {lowFoods.length}</div>
                            <div className="adm-food-pills">{lowFoods.map((f, i) => <div key={i} className="adm-pill low">{f.name}</div>)}</div>
                          </div>
                        )}
                      </div>

                      <div className="adm-actions">
                        {isApproved ? (
                          <div className="adm-success-badge">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4A8C6A" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            {trackChoice[lab.id] === 'declined' ? 'Reviewed — declined, no protocol started' : 'Approved — protocol activated'}
                          </div>
                        ) : (() => {
                          const rec = recommendTrack({ profile: lab.profile, labFoods: lab.foods })
                          // Map any legacy 'wellness' recommendation to 'declined' (wellness removed).
                          const recTrack = rec.track === 'wellness' ? 'declined' : rec.track
                          const chosen = trackChoice[lab.id] || recTrack
                          const burden = symptomBurden(lab.profile)
                          const flags = countFlags(lab.foods)
                          const giSymptoms = symptomsAreGI(lab.profile)
                          const trackOptions = [
                            { id: 'flagged', label: 'Test Flagged Foods' },
                            { id: 'common', label: 'Test Common Triggers' },
                            { id: 'declined', label: 'Skip Protocol → Track' },
                          ]
                          const commonGated = !COMMON_TRACK_ENABLED
                          const confirmTrack = () => {
                            // Safety: never assign common while it's gated.
                            if (chosen === 'common' && commonGated) {
                              alert('The Common Triggers track is held until physician sign-off.')
                              return
                            }
                            // No admin food-picking anymore: flagged uses lab foods,
                            // common lets the USER pick their tier, declined = no protocol.
                            approveLab(lab.id, lab.user_id, chosen, null)
                          }
                          return (
                          <div style={{ width: '100%' }}>
                            {/* Recommendation panel */}
                            <div className="adm-track">
                              <div className="adm-track-head">
                                <span className="adm-track-eye">Recommended track</span>
                                <span className={`adm-track-conf ${rec.confidence}`}>{rec.confidence} confidence</span>
                              </div>
                              <div className="adm-track-rec">{rec.label}</div>
                              <div className="adm-track-reason">{rec.reason}</div>
                              <div className="adm-track-signals">
                                <span>Symptom burden <b>{burden.toFixed(1)}/10</b></span>
                                <span>Lab flags <b>{flags.total}</b> ({flags.high}H/{flags.moderate}M/{flags.low}L)</span>
                                <span>Symptoms <b>{giSymptoms ? 'GI-related' : 'non-GI'}</b></span>
                              </div>
                            </div>

                            {/* Per-symptom breakdown — what they actually reported */}
                            {(() => {
                              const p = lab.profile || {}
                              const ia = p.intake_answers || {}
                              // Each scale tagged with its baseline key so coloring respects
                              // the single source of truth (some scales high=good, some high=bad).
                              const severityScales = [
                                ['Bloating', p.baseline_bloating, 'bloating'],
                                ['Gas / cramping', p.baseline_gas, 'gas'],
                                ['Reflux / heartburn', p.baseline_reflux, 'reflux'],
                                ['Digestive comfort', p.baseline_digestive, 'digestive'],
                                ['Energy', p.baseline_energy, 'energy'],
                                ['Mental clarity', p.baseline_clarity, 'clarity'],
                                ['Afternoon energy', p.baseline_afternoon, 'afternoon'],
                                ['Sleep quality', p.baseline_sleep, 'sleep'],
                                ['Overall wellbeing', p.baseline_wellbeing, 'wellbeing'],
                              ].filter(([, v]) => v != null && v !== undefined && v !== '')
                              // Qualitative/frequency answers + free text from intake_answers
                              const freeText = [
                                ia.interest_reason && ['Why interested', ia.interest_reason],
                                ia.additional_context && ['Anything else', ia.additional_context],
                              ].filter(Boolean)
                              if (severityScales.length === 0 && freeText.length === 0) return null
                              // Qualitative frequency/character answers worth seeing at decision time.
                              const qualMap = [
                                ['bloating_freq', 'Bloating'],
                                ['bloating_timing', 'Bloating timing'],
                                ['gas_cramping_freq', 'Gas/cramping'],
                                ['reflux_freq', 'Reflux'],
                                ['digestion_regularity', 'Digestion'],
                                ['digestive_duration', 'Digestive duration'],
                                ['fatigue_freq', 'Fatigue'],
                                ['brain_fog_freq', 'Brain fog'],
                                ['crashes_freq', 'Afternoon crashes'],
                                ['sleep_quality', 'Sleep'],
                                ['energy_duration', 'Low-energy duration'],
                                ['general_digestion', 'Digestive discomfort'],
                                ['general_energy', 'Energy'],
                              ]
                              const qual = qualMap.map(([id, name]) => ia[id] ? [name, ia[id]] : null).filter(Boolean)
                              return (
                                <div className="adm-symptom-breakdown">
                                  <div className="adm-sb-label">What they reported at intake</div>
                                  {severityScales.length > 0 && (
                                    <div className="adm-sb-grid">
                                      {severityScales.map(([name, val, key]) => {
                                        const badness = toBadness(key, val)
                                        const sev = badness >= 7 ? 'high' : badness >= 4 ? 'mid' : 'low'
                                        return (
                                          <div key={name} className="adm-sb-item">
                                            <span className="adm-sb-name">{name}</span>
                                            <span className={`adm-sb-val ${sev}`}>{val}/10</span>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                  {qual.length > 0 && (
                                    <div className="adm-sb-qual">
                                      {qual.map(([name, val]) => (
                                        <div key={name} className="adm-sb-qual-item">
                                          <span className="adm-sb-qual-name">{name}</span>
                                          <span className="adm-sb-qual-val">{val}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {freeText.map(([label, text]) => (
                                    <div key={label} className="adm-sb-text">
                                      <span className="adm-sb-text-label">{label}:</span> {text}
                                    </div>
                                  ))}
                                </div>
                              )
                            })()}

                            {/* Track selector — confirm or override */}
                            <div className="adm-track-opts">
                              {trackOptions.map(opt => {
                                const gated = opt.id === 'common' && !COMMON_TRACK_ENABLED
                                return (
                                  <button key={opt.id}
                                    disabled={gated}
                                    title={gated ? 'Held until physician sign-off' : ''}
                                    className={`adm-track-opt${chosen === opt.id ? ' on' : ''}${recTrack === opt.id ? ' rec' : ''}`}
                                    style={gated ? { opacity: 0.45, cursor: 'not-allowed' } : {}}
                                    onClick={() => { if (!gated) setTrackChoice(prev => ({ ...prev, [lab.id]: opt.id })) }}>
                                    {opt.label}{recTrack === opt.id ? ' ★' : ''}{gated ? ' 🔒' : ''}
                                  </button>
                                )
                              })}
                            </div>

                            {!COMMON_TRACK_ENABLED && (recTrack === 'common' || chosen === 'common') && (
                              <div className="adm-decline-note">
                                The Common Triggers track is built but held until physician sign-off (tier food lists + FODMAP logic need clinical review). Until then, assign Flagged or Skip → Track.
                              </div>
                            )}

                            {chosen === 'common' && (
                              <div className="adm-decline-note" style={{ background: '#EDF3ED', color: '#2D6B42' }}>
                                The patient will choose their own depth (Test 2 or Test 8 foods) and can decline to self-tracking.
                                {giSymptoms && ' GI symptoms present — Test 8 (incl. FODMAPs) will be recommended to them.'}
                              </div>
                            )}

                            {chosen === 'declined' && (
                              <div className="adm-decline-note">No protocol will be started. The user gets an honest readout plus self-tracking tools, and can start the protocol later.</div>
                            )}

                            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                              <button className={`adm-btn ${chosen === 'declined' ? 'amber' : 'green'}`}
                                disabled={approving[lab.id] || (chosen === 'common' && commonGated)}
                                onClick={confirmTrack}>
                                {approving[lab.id] ? 'Saving...' : chosen === 'declined' ? 'Confirm — Skip → Track' : `Approve — ${trackOptions.find(t => t.id === chosen)?.label} →`}
                              </button>
                              <button className="adm-btn ghost" onClick={() => setShowMsgCompose(prev => ({ ...prev, [lab.id]: !prev[lab.id] }))}>
                                Message user
                              </button>
                            </div>
                          </div>
                          )
                        })()}
                      </div>

                      {showMsgCompose[lab.id] && !isApproved && (
                        <div className="adm-msg-compose">
                          <div className="adm-msg-label">Send message to user</div>
                          <input className="adm-msg-input" placeholder="Subject" value={msgSubject[lab.id] || ''} onChange={e => setMsgSubject(prev => ({ ...prev, [lab.id]: e.target.value }))} />
                          <textarea className="adm-msg-body" placeholder="Your message..." value={msgBody[lab.id] || ''} onChange={e => setMsgBody(prev => ({ ...prev, [lab.id]: e.target.value }))} />
                          <button className="adm-btn green" style={{ fontSize: '12px', padding: '8px 14px' }} onClick={() => setMsgSent(prev => ({ ...prev, [lab.id]: true }))}>
                            {msgSent[lab.id] ? '✓ Sent' : 'Send message'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </>
        )}

        {/* AUDITS TAB */}
        {!loading && activeTab === 'audits' && (
          <>
            {audits.length === 0 ? (
              <div className="adm-empty">
                <div className="adm-empty-title">No pending <em>audits.</em></div>
                <div className="adm-empty-sub">When users complete a compliance audit it will appear here for your review.</div>
              </div>
            ) : (
              <>
                <div className="adm-section-label">{pendingAuditCount} pending response</div>
                {audits.map(audit => {
                  const isResponded = responded[audit.id]
                  const profile = audit.profile
                  const latest = audit.latest_checkin
                  const comp = audit.compliance_history || []
                  const suggested = SUGGESTED_OUTCOME(audit)
                  const bloatingBaseline = profile?.baseline_bloating
                  const bloatingNow = latest?.answers?.bloating
                  const energyBaseline = profile?.baseline_energy
                  const energyNow = latest?.answers?.energy

                  return (
                    <div key={audit.id} className={`adm-card${audit.hardest_parts?.length > 3 ? ' urgent' : ''}`}>
                      <div className="adm-card-header">
                        <div>
                          <div className="adm-user-name" onClick={() => profile && loadUserDetail(profile)}>
                            <em>{profile?.full_name || 'Unknown user'}</em>
                          </div>
                          <div className="adm-user-meta">Day {profile?.current_day || '—'} · Week {latest?.week_number || '—'} · Triggered {formatDateTime(audit.triggered_at)}</div>
                        </div>
                      </div>

                      <div className="adm-trend">
                        <div className="adm-trend-card">
                          <div className="adm-trend-label">Bloating</div>
                          <div className="adm-trend-row">
                            <div><div className="adm-trend-val">{bloatingBaseline || '—'}</div><div className="adm-trend-sub">baseline</div></div>
                            <div style={{ fontSize: '16px', color: '#7A7A72' }}>→</div>
                            <div><div className="adm-trend-val">{bloatingNow || '—'}</div><div className="adm-trend-sub">latest</div></div>
                          </div>
                          {bloatingBaseline && bloatingNow && (
                            <div className={`adm-trend-change ${bloatingNow < bloatingBaseline ? 'good' : 'bad'}`}>
                              {bloatingNow < bloatingBaseline ? `↓ ${Math.round(((bloatingBaseline - bloatingNow) / bloatingBaseline) * 100)}% improvement` : `↑ ${Math.round(((bloatingNow - bloatingBaseline) / bloatingBaseline) * 100)}% worse`}
                            </div>
                          )}
                        </div>
                        <div className="adm-trend-card">
                          <div className="adm-trend-label">Energy</div>
                          <div className="adm-trend-row">
                            <div><div className="adm-trend-val">{energyBaseline || '—'}</div><div className="adm-trend-sub">baseline</div></div>
                            <div style={{ fontSize: '16px', color: '#7A7A72' }}>→</div>
                            <div><div className="adm-trend-val">{energyNow || '—'}</div><div className="adm-trend-sub">latest</div></div>
                          </div>
                          {energyBaseline && energyNow && (
                            <div className={`adm-trend-change ${energyNow > energyBaseline ? 'good' : 'bad'}`}>
                              {energyNow > energyBaseline ? `↑ ${Math.round(((energyNow - energyBaseline) / energyBaseline) * 100)}% improvement` : `↓ ${Math.round(((energyBaseline - energyNow) / energyBaseline) * 100)}% worse`}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="adm-section-label" style={{ marginBottom: '8px' }}>30-day compliance</div>
                      <div className="adm-dots">
                        {[...Array(30)].map((_, i) => {
                          const d = new Date(); d.setDate(d.getDate() - (29 - i))
                          const dateStr = d.toISOString().split('T')[0]
                          const entry = comp.find(c => c.date === dateStr)
                          return <div key={i} className="adm-dot-col"><div className={`adm-dot-bar ${entry?.response === 'YES' ? 'yes' : entry?.response === 'NO' ? 'no' : 'none'}`} title={dateStr} /></div>
                        })}
                      </div>
                      <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: '#7A7A72', marginBottom: '16px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#4A8C6A', display: 'inline-block' }}></span>On plan</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#C95B5B', display: 'inline-block' }}></span>Slip-up</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'rgba(0,0,0,0.1)', display: 'inline-block' }}></span>No response</span>
                      </div>

                      <div className="adm-divider" />

                      <div className="adm-audit-answers">
                        <div className="adm-audit-label">What they told us</div>
                        {audit.hardest_parts?.map((part, i) => (
                          <div key={i} className="adm-audit-item"><span>Selected:</span>{HARDEST_PARTS_LABELS[part] || part}</div>
                        ))}
                        {audit.branch_responses?.stress_score && <div className="adm-audit-item"><span>Stress:</span>{audit.branch_responses.stress_score}/10</div>}
                        {audit.branch_responses?.social_when && <div className="adm-audit-item"><span>Social timing:</span>{audit.branch_responses.social_when}</div>}
                        {audit.branch_responses?.cooking_role && <div className="adm-audit-item"><span>Cooking role:</span>{audit.branch_responses.cooking_role}</div>}
                        {audit.branch_responses?.craving_food && <div className="adm-audit-item"><span>Craving:</span>{audit.branch_responses.craving_food}</div>}
                        {audit.branch_responses?.other_text && <div className="adm-audit-item"><span>Other:</span>"{audit.branch_responses.other_text}"</div>}
                      </div>

                      {audit.ai_acknowledgment && (
                        <div className="adm-ai-ack">
                          <div className="adm-ai-ack-label">AI already sent them</div>
                          <div className="adm-ai-ack-text">{audit.ai_acknowledgment}</div>
                        </div>
                      )}

                      <div className="adm-suggested">Rules engine suggests: <strong>{suggested}</strong></div>

                      {isResponded ? (
                        <div className="adm-success-badge">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4A8C6A" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          Response sent — {isResponded}
                        </div>
                      ) : (
                        <>
                          <textarea className="adm-note" placeholder="Optional personal note to the user..." value={notes[audit.id] || ''} onChange={e => setNotes(prev => ({ ...prev, [audit.id]: e.target.value }))} />
                          <div className="adm-actions">
                            <button className="adm-btn green" disabled={responding[audit.id]} onClick={() => respondToAudit(audit.id, audit.user_id, 'Keep going')}>Keep going →</button>
                            <button className="adm-btn amber" disabled={responding[audit.id]} onClick={() => respondToAudit(audit.id, audit.user_id, 'Reset clock')}>Reset clock</button>
                            <button className="adm-btn red" disabled={responding[audit.id]} onClick={() => respondToAudit(audit.id, audit.user_id, 'Escalate')}>Escalate to provider</button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </>
        )}

        {/* USERS TAB */}
        {!loading && activeTab === 'users' && (
          <>
            <div className="adm-toolbar">
              <input className="adm-search" placeholder="Search by name or ID..." value={search} onChange={e => setSearch(e.target.value)} />
              <select className="adm-filter" value={phaseFilter} onChange={e => setPhaseFilter(e.target.value)}>
                <option value="all">All phases</option>
                <option value="awaiting_results">Awaiting results</option>
                <option value="pending_review">Pending review</option>
                <option value="elimination">Elimination</option>
                <option value="reintroduction">Reintroduction</option>
                <option value="complete">Complete</option>
                <option value="inactive">Inactive 14+ days</option>
              </select>
              <button className="adm-export" onClick={exportCSV}>Export CSV</button>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="adm-empty">
                <div className="adm-empty-title">No users <em>found.</em></div>
                <div className="adm-empty-sub">Try adjusting your search or filter.</div>
              </div>
            ) : (
              <div className="adm-users-table">
                <div className="adm-table-header">
                  <div className="adm-th">User</div>
                  <div className="adm-th">Phase</div>
                  <div className="adm-th">Day</div>
                  <div className="adm-th">Streak</div>
                  <div className="adm-th">Last check-in</div>
                  <div className="adm-th">Joined</div>
                  <div className="adm-th">Status</div>
                </div>
                {filteredUsers.map((u, i) => (
                  <div key={i} className={`adm-table-row${isInactive(u) ? ' inactive' : ''}`} onClick={() => loadUserDetail(u)}>
                    <div>
                      <div className="adm-table-name">{u.full_name || '—'}</div>
                      <div className="adm-table-email">{u.id?.slice(0, 12)}...</div>
                    </div>
                    <div>
                      <div className={`adm-phase-pill ${u.program_phase || 'setup'}`}>
                        {u.program_phase === 'elimination' ? 'Elimination' : u.program_phase === 'reintroduction' ? 'Reintro' : u.program_phase === 'pending_review' ? 'Pending' : u.program_phase === 'awaiting_results' ? 'Awaiting' : u.program_phase === 'awaiting_decision' ? 'Choosing' : u.program_phase === 'tracking' ? 'Tracking' : u.program_phase === 'declined' ? 'Declined' : 'Setup'}
                      </div>
                    </div>
                    <div>{(() => { const d = computeDay(u); return d != null ? `Day ${d}` : '—' })()}</div>
                    <div>{u.program_phase === 'elimination' || u.program_phase === 'reintroduction' ? `${u.streak || 0}d` : '—'}</div>
                    <div style={{ fontSize: '12px', color: '#7A7A72' }}>{formatDate(u.last_checkin_at)}</div>
                    <div style={{ fontSize: '12px', color: '#7A7A72' }}>{formatDate(u.created_at)}</div>
                    <div style={{ fontSize: '11px' }}>
                      {isInactive(u) ? <span style={{ color: '#C95B5B' }}>● Inactive</span> : <span style={{ color: '#4A8C6A' }}>● Active</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* USER DETAIL MODAL */}
      {selectedUser && (
        <div className="adm-modal-overlay" onClick={() => { setSelectedUser(null); setUserDetail(null) }}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <div className="adm-modal-title"><em>{selectedUser.full_name || 'Unknown'}</em></div>
              <button className="adm-modal-close" onClick={() => { setSelectedUser(null); setUserDetail(null) }}>×</button>
            </div>
            <div className="adm-modal-body">
              {loadingUser ? (
                <div className="adm-spinner" />
              ) : (
                <>
                  {/* Intake answers */}
                  <div className="adm-section-label" style={{ marginTop: '4px' }}>Intake survey</div>
                  <div className="adm-profile-grid" style={{ marginBottom: '16px' }}>
                    <div className="adm-profile-card">
                      <div className="adm-profile-label">Symptom focus</div>
                      <div className="adm-profile-val" style={{ fontSize: '12px' }}>{selectedUser.symptoms?.join(', ') || '—'}</div>
                    </div>
                    <div className="adm-profile-card">
                      <div className="adm-profile-label">Intake completed</div>
                      <div className="adm-profile-val" style={{ fontSize: '12px' }}>{selectedUser.intake_completed_at ? formatDate(selectedUser.intake_completed_at) : 'Not completed'}</div>
                    </div>
                    <div className="adm-profile-card">
                      <div className="adm-profile-label">Bloating baseline</div>
                      <div className="adm-profile-val">{selectedUser.baseline_bloating || '—'}<span style={{ fontSize: '12px', fontWeight: 400, color: '#7A7A72' }}>/10</span></div>
                    </div>
                    <div className="adm-profile-card">
                      <div className="adm-profile-label">Energy baseline</div>
                      <div className="adm-profile-val">{selectedUser.baseline_energy || '—'}<span style={{ fontSize: '12px', fontWeight: 400, color: '#7A7A72' }}>/10</span></div>
                    </div>
                    <div className="adm-profile-card">
                      <div className="adm-profile-label">Text time</div>
                      <div className="adm-profile-val">{selectedUser.text_time_preference || '—'}</div>
                      <div className="adm-profile-sub">{selectedUser.phone_number ? selectedUser.phone_number : 'No phone on file'}</div>
                    </div>
                    <div className="adm-profile-card">
                      <div className="adm-profile-label">Program phase</div>
                      <div className="adm-profile-val" style={{ fontSize: '13px' }}>{selectedUser.program_phase || 'Setup'}</div>
                      <div className="adm-profile-sub">Day {computeDay(selectedUser) ?? 0} · Streak {(() => {
                        const sorted = [...(userDetail?.comp || [])].sort((a, b) => new Date(b.date) - new Date(a.date))
                        let count = 0
                        for (const e of sorted) { if (e.response === 'YES') count++; else break }
                        return count
                      })()}d</div>
                    </div>
                    <div className="adm-profile-card">
                      <div className="adm-profile-label">Protocol track</div>
                      <div className="adm-profile-val" style={{ fontSize: '13px' }}>{(() => {
                        const t = selectedUser.protocol_track
                        if (t === 'flagged') return 'Flagged foods'
                        if (t === 'common') return `Common triggers${Number(selectedUser.protocol_tier) === 2 ? ' · Test 8' : Number(selectedUser.protocol_tier) === 1 ? ' · Test 2' : ''}${selectedUser.tier_escalated ? ' (escalated)' : ''}`
                        if (t === 'declined') return 'Skip → Tracking'
                        return 'Not assigned'
                      })()}</div>
                      <div className="adm-profile-sub">{(() => {
                        const d = selectedUser.track_decision
                        if (d === 'pending') return 'Awaiting user decision'
                        if (d === 'active') return 'User started protocol'
                        if (d === 'declined') return 'User chose to self-track'
                        return selectedUser.protocol_track ? 'Assigned' : '—'
                      })()}</div>
                    </div>
                  </div>
                  {/* Lifestyle baselines & confound factors */}
                  <div className="adm-section-label" style={{ marginTop: '16px' }}>Lifestyle baselines</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '14px' }}>
                    {[
                      ['Sex', selectedUser.gender || '—'],
                      ['Avg sleep', selectedUser.baseline_avg_sleep || '—'],
                      ['Avg stress', selectedUser.baseline_avg_stress || '—'],
                      ['Avg hydration', selectedUser.baseline_avg_hydration || '—'],
                      ['Drinks alcohol', selectedUser.drinks_alcohol === true ? 'Yes' : selectedUser.drinks_alcohol === false ? 'No' : '—'],
                      ['Avg drinks/wk', selectedUser.baseline_avg_drinks_week || '—'],
                    ].map(([label, val]) => (
                      <div key={label} style={{ background: '#FAF8F4', borderRadius: '8px', padding: '8px 10px' }}>
                        <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#7A7A72', marginBottom: '3px' }}>{label}</div>
                        <div style={{ fontSize: '12px', color: '#1C1C1C', fontWeight: 500 }}>{val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Recent daily check-ins */}
                  {userDetail?.dailyFactors?.length > 0 && (
                    <>
                      <div className="adm-section-label">Recent daily check-ins ({userDetail.dailyFactors.length})</div>
                      <div style={{ background: '#FAF8F4', borderRadius: '10px', padding: '10px', marginBottom: '14px', maxHeight: '160px', overflowY: 'auto' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr 1fr 1fr', gap: '4px', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', color: '#A0A096', paddingBottom: '6px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                          <div>Date</div><div>Plan</div><div>Sleep</div><div>Stress</div><div>Hyd</div>
                        </div>
                        {userDetail.dailyFactors.map((f, i) => (
                          <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 1fr 1fr 1fr', gap: '4px', fontSize: '11px', color: '#1C1C1C', padding: '5px 0', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                            <div style={{ color: '#7A7A72' }}>{(f.log_date || '').slice(5)}</div>
                            <div>{f.followed_protocol === true ? '✓' : f.followed_protocol === false ? '✕' : '—'}</div>
                            <div>{f.sleep || '—'}</div>
                            <div>{f.stress || '—'}</div>
                            <div>{f.hydration || '—'}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Confound observations the engine has logged */}
                  {userDetail?.confoundObs?.length > 0 && (
                    <>
                      <div className="adm-section-label">Confound observations ({userDetail.confoundObs.length})</div>
                      <div style={{ background: '#FAF8F4', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
                        {userDetail.confoundObs.map((o, i) => (
                          <div key={i} style={{ fontSize: '11.5px', color: '#1C1C1C', padding: '5px 0', borderBottom: i < userDetail.confoundObs.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                            <strong style={{ textTransform: 'capitalize' }}>{o.factor}</strong> · {o.engine}{o.direction ? ` (${o.direction})` : ''}{o.repeats ? ` · ${o.repeats}×` : ''} · <span style={{ color: '#7A7A72' }}>{o.confidence}</span> · <span style={{ color: '#A0A096' }}>{(o.week_start || '').slice(5)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {/* Lab results */}
                  {userDetail?.labs && (
                    <>
                      <div className="adm-section-label" style={{ marginTop: '16px' }}>Lab results</div>
                      <div style={{ background: '#FAF8F4', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
                        <div style={{ fontSize: '11px', color: '#7A7A72', marginBottom: '8px' }}>Status: <strong style={{ color: userDetail.labs.status === 'approved' ? '#4A8C6A' : '#D4894A' }}>{userDetail.labs.status}</strong> · Submitted {formatDate(userDetail.labs.submitted_at)}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {userDetail.labs.foods?.map((f, i) => (
                            <div key={i} className={`adm-pill ${f.level.toLowerCase()}`}>{f.name}</div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* 30-day compliance */}
                  {userDetail?.comp?.length > 0 && (
                    <>
                      <div className="adm-section-label">30-day compliance</div>
                      <div className="adm-dots" style={{ marginBottom: '16px' }}>
                        {[...Array(30)].map((_, i) => {
                          const d = new Date(); d.setDate(d.getDate() - (29 - i))
                          const dateStr = d.toISOString().split('T')[0]
                          const entry = userDetail.comp.find(c => c.date === dateStr)
                          return <div key={i} className="adm-dot-col"><div className={`adm-dot-bar ${entry?.response === 'YES' ? 'yes' : entry?.response === 'NO' ? 'no' : 'none'}`} title={dateStr} /></div>
                        })}
                      </div>
                    </>
                  )}

                  {/* Check-in history */}
                  {userDetail?.checkins?.length > 0 && (
                    <>
                      <div className="adm-section-label">Check-in history ({userDetail.checkins.length})</div>
                      <div className="adm-checkin-list" style={{ marginBottom: '16px' }}>
                        {userDetail.checkins.map((c, i) => (
                          <div key={i} className="adm-checkin-item">
                            <div className="adm-checkin-week">Week {c.week_number || i + 1} · {formatDate(c.submitted_at)}</div>
                            <div className="adm-checkin-scores">
                              {c.answers?.bloating && <div className="adm-checkin-score">Bloating: <strong>{c.answers.bloating}</strong></div>}
                              {c.answers?.energy && <div className="adm-checkin-score">Energy: <strong>{c.answers.energy}</strong></div>}
                              {c.answers?.compliance && <div className="adm-checkin-score">Compliance: <strong>{c.answers.compliance}</strong></div>}
                            </div>
                            {c.ai_insight && <div className="adm-checkin-insight">"{c.ai_insight}"</div>}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Audit history */}
                  {userDetail?.auditHistory?.length > 0 && (
                    <>
                      <div className="adm-section-label">Audit history ({userDetail.auditHistory.length})</div>
                      <div className="adm-audit-history" style={{ marginBottom: '16px' }}>
                        {userDetail.auditHistory.map((a, i) => (
                          <div key={i} className="adm-audit-history-item">
                            <div style={{ fontSize: '11px', color: '#7A7A72', marginBottom: '4px' }}>{formatDate(a.triggered_at)}</div>
                            {a.admin_outcome && (
                              <div className={`adm-audit-outcome ${a.admin_outcome === 'Keep going' ? 'keep' : a.admin_outcome === 'Reset clock' ? 'reset' : 'escalate'}`}>
                                {a.admin_outcome}
                              </div>
                            )}
                            {a.admin_note && <div className="adm-audit-note">"{a.admin_note}"</div>}
                            {!a.admin_outcome && <div style={{ fontSize: '11px', color: '#D4894A' }}>Pending response</div>}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Food map */}
                  {userDetail?.foodMap?.length > 0 && (
                    <>
                      <div className="adm-section-label">Food map ({userDetail.foodMap.length} foods)</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                        {userDetail.foodMap.map((f, i) => (
                          <div key={i} className={`adm-pill ${f.verdict === 'Safe' ? 'low' : f.verdict === 'Limit' ? 'moderate' : 'high'}`}>{f.food}</div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Message user */}
                  <div className="adm-msg-compose">
                    <div className="adm-msg-label">Send message to {selectedUser.full_name?.split(' ')[0] || 'user'}</div>
                    <input className="adm-msg-input" placeholder="Subject" value={msgSubject[selectedUser.id] || ''} onChange={e => setMsgSubject(prev => ({ ...prev, [selectedUser.id]: e.target.value }))} />
                    <textarea className="adm-msg-body" placeholder="Your message..." value={msgBody[selectedUser.id] || ''} onChange={e => setMsgBody(prev => ({ ...prev, [selectedUser.id]: e.target.value }))} />
                    <button className="adm-btn green" style={{ fontSize: '12px', padding: '8px 14px' }} onClick={() => setMsgSent(prev => ({ ...prev, [selectedUser.id]: true }))}>
                      {msgSent[selectedUser.id] ? '✓ Sent' : 'Send message'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
