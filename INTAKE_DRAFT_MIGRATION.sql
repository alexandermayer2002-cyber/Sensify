-- ============================================================
-- INTAKE DRAFT MIRROR — survives a device switch mid-intake.
-- (QA 2026-10-31 #2: the intake draft lived only in localStorage,
-- so phone→laptop, private mode, or a cleared webview silently
-- discarded up to 100+ answers including the signed consent.)
--
-- The app already writes this column defensively: until this runs,
-- those writes fail quietly and localStorage remains the only net.
-- Run it and the cross-device mirror switches on by itself.
-- ============================================================

alter table profiles add column if not exists intake_draft jsonb;

-- No new policies needed: users already update their own profile row.
