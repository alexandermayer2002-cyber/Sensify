-- Admin-read policies for tables the admin dashboard queries client-side.
-- daily_factors shipped with ONLY a user-scoped policy, so every admin
-- query returned just the admin's own rows: the stalled-user detector
-- flagged everyone (it could never see anyone's check-ins), and the
-- user-detail daily view was silently empty. is_admin_check() is the
-- security-definer helper from SECURITY_HARDENING.
drop policy if exists "Admins read all daily factors" on daily_factors;
create policy "Admins read all daily factors" on daily_factors
  for select using (is_admin_check());

drop policy if exists "Admins read all confound observations" on confound_observations;
create policy "Admins read all confound observations" on confound_observations
  for select using (is_admin_check());
