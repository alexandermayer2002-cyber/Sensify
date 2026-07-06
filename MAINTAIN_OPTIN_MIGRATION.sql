-- Maintain opt-in: card saved mid-protocol (Stripe setup mode, no charge),
-- subscription created only when the protocol completes.
alter table profiles add column if not exists maintain_opt_in boolean default false;
alter table profiles add column if not exists stripe_customer_id text;
alter table profiles add column if not exists maintain_active boolean default false;
alter table profiles add column if not exists maintain_subscription_id text;
