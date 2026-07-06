-- Housekeeping: remove the dead messaging-v1 table (replaced by tickets +
-- ticket_messages in the support system). Nothing reads or writes it.
drop table if exists messages;
