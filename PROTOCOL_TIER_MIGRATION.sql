-- ============================================================
-- Protocol track engine — tier choice + user decision state
-- ============================================================

-- Which tier the user picked for the common track (1 = Test 2, 2 = Test 8).
alter table profiles add column if not exists protocol_tier integer;

-- The user's decision on the common track.
--   'pending'   = assigned common, hasn't chosen yet (popup/card showing)
--   'active'    = chose a tier, protocol running
--   'declined'  = chose to skip the protocol and self-track instead
alter table profiles add column if not exists track_decision text;

-- Escalation: did they complete a Tier 1 round clean but still have symptoms,
-- and were offered / did they accept Tier 2.
alter table profiles add column if not exists tier_escalated boolean default false;

-- Whether the user has seen the one-time explanation popup (so it shows once).
alter table profiles add column if not exists seen_track_intro boolean default false;
