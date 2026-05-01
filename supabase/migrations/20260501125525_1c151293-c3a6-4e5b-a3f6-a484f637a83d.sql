-- Roles enum + table (separated for security)
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null default 'user',
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view their own roles"
on public.user_roles for select
to authenticated
using (auth.uid() = user_id);

-- Plan enum
create type public.plan_tier as enum ('free', 'pro', 'elite');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  plan plan_tier not null default 'free',
  credits int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users view own profile"
on public.profiles for select to authenticated
using (auth.uid() = id);

create policy "Users update own profile"
on public.profiles for update to authenticated
using (auth.uid() = id);

create policy "Users insert own profile"
on public.profiles for insert to authenticated
with check (auth.uid() = id);

-- CVs
create table public.cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Untitled CV',
  template_id text not null default 'ivory',
  data jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cvs enable row level security;

create policy "Users view own cvs"
on public.cvs for select to authenticated
using (auth.uid() = user_id);

create policy "Users insert own cvs"
on public.cvs for insert to authenticated
with check (auth.uid() = user_id);

create policy "Users update own cvs"
on public.cvs for update to authenticated
using (auth.uid() = user_id);

create policy "Users delete own cvs"
on public.cvs for delete to authenticated
using (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger cvs_updated_at before update on public.cvs
  for each row execute function public.set_updated_at();

-- Auto-create profile + role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  insert into public.user_roles (user_id, role)
  values (new.id, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();