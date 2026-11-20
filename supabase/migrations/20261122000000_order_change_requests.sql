-- Customer change requests on paid orders (PRD § 08 "Change requests").
-- An order carries at most one OPEN change request: the customer's message and when
-- it was made. Pre-press clears it when they send the revised proof. The full history
-- stays in order_events and draft_proofs.
alter table public.orders add column if not exists change_request text;
alter table public.orders add column if not exists change_requested_at timestamptz;

create index if not exists orders_open_change_request_idx
  on public.orders (change_requested_at)
  where change_request is not null;
