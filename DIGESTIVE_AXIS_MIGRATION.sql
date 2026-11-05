-- ============================================================
-- DIGESTIVE_AXIS_MIGRATION — repair inverted baseline_digestive
-- (QA 2026-11-05 #1, shipped code-side in Deploy 18)
-- ------------------------------------------------------------
-- THE BUG: intake's MAIN digestive question captured the scale with
-- 10 = "Very uncomfortable" (discomfort axis), while the weekly
-- check-in, the dashboard, History, and intake's own POST-MEAL
-- variant all treat 10 = "Very comfortable" (comfort axis). The AI
-- insight therefore read digestive improvements as reactions.
--
-- Deploy 18 relabels the intake question and flips SCALE_DIRECTION,
-- so every NEW baseline is on the comfort axis. This script repairs
-- the baselines stored BEFORE that deploy.
--
-- WHO GETS FLIPPED: only users who answered the MAIN variant — it
-- fired when intake_answers.digestion_regularity exists and is not
-- 'Very regular'. (If that variant fired, the post-meal variant was
-- skipped, so the two never overlap.) Users who answered only the
-- post-meal variant were already on the comfort axis: untouched.
--
-- RUN ONCE, right after Deploy 18 is live. Set the cutoff below to
-- the actual deploy time (UTC) so intakes completed on the new label
-- are never double-flipped. Scale is 1..10, so flip = 11 - value.
-- ============================================================

-- 1) Preview what will change (run this first, sanity-check the count):
SELECT id, email, baseline_digestive AS old_value, 11 - baseline_digestive AS new_value
FROM profiles
WHERE baseline_digestive IS NOT NULL
  AND intake_answers->>'digestion_regularity' IS NOT NULL
  AND intake_answers->>'digestion_regularity' <> 'Very regular'
  AND intake_completed_at < '2026-11-05T00:00:00Z';  -- <<< SET TO DEPLOY 18 TIME (UTC)

-- 2) The repair:
UPDATE profiles
SET baseline_digestive = 11 - baseline_digestive
WHERE baseline_digestive IS NOT NULL
  AND intake_answers->>'digestion_regularity' IS NOT NULL
  AND intake_answers->>'digestion_regularity' <> 'Very regular'
  AND intake_completed_at < '2026-11-05T00:00:00Z';  -- <<< SAME CUTOFF

-- NOTE: stored weekly AI insight texts generated from the inverted
-- reading (latest_insight on profiles, insight text on weekly_checkins)
-- are NOT rewritten by this script; they age out as new check-ins land.
-- Until this script runs, pre-deploy customers' digestive baselines
-- read inverted in the admin panel and weekly comparisons.
