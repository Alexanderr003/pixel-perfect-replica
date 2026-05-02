-- Template purchases (one-time unlocks)
create table if not exists public.template_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  template_id text not null,
  stripe_session_id text not null unique,
  environment text not null default 'sandbox',
  created_at timestamptz not null default now(),
  unique (user_id, template_id, environment)
);

create index if not exists idx_template_purchases_user on public.template_purchases(user_id);

alter table public.template_purchases enable row level security;

create policy "Users view own template purchases"
  on public.template_purchases for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Service role manages template purchases"
  on public.template_purchases for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Purchase events (idempotency log)
create table if not exists public.purchase_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  environment text not null,
  created_at timestamptz not null default now()
);

alter table public.purchase_events enable row level security;

create policy "Service role manages purchase events"
  on public.purchase_events for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Helper function
create or replace function public.user_owns_template(_user_id uuid, _template_id text, _env text default 'sandbox')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.template_purchases
    where user_id = _user_id
      and template_id = _template_id
      and environment = _env
  );
$$;