-- ============================================================
-- WEEKLY_UNIQUE_MIGRATION — one check-in per user per week
-- (QA 2026-11-05 minor note, shipped app-side guard in Deploy 18)
-- ------------------------------------------------------------
-- weekly_checkins has no unique (user_id, week_number) constraint,
-- so a double submit from two tabs can store twin rows; the streak
-- walk then breaks on the duplicate and under-counts. Deploy 18 adds
-- an app-side pre-check; this constraint is the real backstop.
--
-- RUN ONCE. Step 1 removes any twins already stored (keeps the
-- EARLIEST submission of each week, the one whose insight the user
-- saw first); step 2 adds the constraint.
-- ============================================================

-- 0) Preview duplicates (expect few or none):
SELECT user_id, week_number, COUNT(*) AS copies
FROM weekly_checkins
GROUP BY user_id, week_number
HAVING COUNT(*) > 1;

-- 1) Remove twins, keeping the earliest row per (user, week):
DELETE FROM weekly_checkins w
USING weekly_checkins keep
WHERE w.user_id = keep.user_id
  AND w.week_number = keep.week_number
  AND w.id <> keep.id
  AND (keep.submitted_at < w.submitted_at
       OR (keep.submitted_at = w.submitted_at AND keep.id < w.id));

-- 2) The constraint:
ALTER TABLE weekly_checkins
  ADD CONSTRAINT weekly_checkins_user_week_unique UNIQUE (user_id, week_number);
