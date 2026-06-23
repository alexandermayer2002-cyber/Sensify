-- ============================================================
-- Admin track assignment — store the protocol track decision
-- made at admin approval, plus any custom food selection.
-- ============================================================

alter table profiles add column if not exists protocol_track text;
-- 'flagged' | 'common' | 'wellness' | 'declined'

alter table profiles add column if not exists track_foods jsonb;
-- For common/wellness tracks: the specific foods the admin chose to test,
-- e.g. [{ name, level }]. Null for flagged track (uses lab results).

alter table profiles add column if not exists track_assigned_at timestamptz;
alter table profiles add column if not exists track_note text;
-- Optional admin note about the decision.
