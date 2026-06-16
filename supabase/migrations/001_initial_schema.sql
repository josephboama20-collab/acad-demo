-- Acad Phase 2 schema: profiles + per-user JSON buckets with RLS

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_data (
  user_id uuid not null references auth.users (id) on delete cascade,
  bucket text not null check (bucket in ('scholar', 'courses', 'flashcards', 'game', 'habits', 'forge')),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, bucket)
);

create index if not exists user_data_user_id_idx on public.user_data (user_id);

alter table public.profiles enable row level security;
alter table public.user_data enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "user_data_select_own" on public.user_data
  for select using (auth.uid() = user_id);

create policy "user_data_insert_own" on public.user_data
  for insert with check (auth.uid() = user_id);

create policy "user_data_update_own" on public.user_data
  for update using (auth.uid() = user_id);

create policy "user_data_delete_own" on public.user_data
  for delete using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.email, '')
  );
  insert into public.user_data (user_id, bucket, payload) values
    (new.id, 'scholar', '{}'::jsonb),
    (new.id, 'courses', '[]'::jsonb),
    (new.id, 'flashcards', '[]'::jsonb),
    (new.id, 'game', '{"xp":0,"achievements":[],"challengeProgress":{}}'::jsonb),
    (new.id, 'habits', '[]'::jsonb),
    (new.id, 'forge', '{}'::jsonb);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
