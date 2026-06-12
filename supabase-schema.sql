create table if not exists public.rehab_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date_key date not null,
  completed boolean not null default false,
  manual_completion boolean not null default false,
  checklist jsonb not null default '{}'::jsonb,
  set_rows jsonb not null default '{}'::jsonb,
  timer jsonb not null default '{}'::jsonb,
  notes text not null default '',
  exercises jsonb not null default '{}'::jsonb,
  monitoring jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, date_key)
);

create index if not exists rehab_sessions_user_date_idx
  on public.rehab_sessions (user_id, date_key);

alter table public.rehab_sessions enable row level security;

drop policy if exists "Users can read own rehab sessions" on public.rehab_sessions;
create policy "Users can read own rehab sessions"
  on public.rehab_sessions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own rehab sessions" on public.rehab_sessions;
create policy "Users can insert own rehab sessions"
  on public.rehab_sessions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own rehab sessions" on public.rehab_sessions;
create policy "Users can update own rehab sessions"
  on public.rehab_sessions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own rehab sessions" on public.rehab_sessions;
create policy "Users can delete own rehab sessions"
  on public.rehab_sessions
  for delete
  using (auth.uid() = user_id);
