-- Run this once in your Supabase project's SQL editor (Project > SQL Editor > New query).
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE where possible.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  avatar_emoji text,
  avatar_color text,
  created_at timestamptz not null default now()
);

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  cuisine text not null,
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  prep_time_minutes int not null,
  cook_time_minutes int not null,
  servings int not null,
  estimated_cost_eur numeric not null,
  total_calories numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  dietary_tags jsonb not null default '[]',
  possible_additions jsonb not null default '[]',
  calorie_reductions jsonb not null default '[]',
  description text not null,
  ingredients jsonb not null,
  instructions jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists recipes_author_id_idx on recipes(author_id);

-- Auto-create a profile row whenever someone signs up: unique username from the
-- sanitized email local-part, numeric suffix on collision.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base text;
  candidate text;
  n int := 0;
begin
  base := coalesce(nullif(regexp_replace(
    lower(split_part(new.email, '@', 1)), '[^a-z0-9_]', '', 'g'), ''), 'user');
  -- rpad would truncate long names to 3 chars — pad only when actually short.
  base := left(base, 20);
  if length(base) < 3 then
    base := rpad(base, 3, '0');
  end if;
  candidate := base;
  while exists (select 1 from profiles where username = candidate) loop
    n := n + 1;
    candidate := left(base, 20 - length(n::text)) || n::text;
  end loop;
  insert into public.profiles (id, username) values (new.id, candidate);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Row Level Security
alter table profiles enable row level security;
alter table recipes enable row level security;

drop policy if exists "profiles are publicly readable" on profiles;
create policy "profiles are publicly readable" on profiles for select using (true);

drop policy if exists "users can update their own profile" on profiles;
create policy "users can update their own profile" on profiles
  for update to authenticated using (id = auth.uid());

drop policy if exists "recipes are publicly readable" on recipes;
create policy "recipes are publicly readable" on recipes for select using (true);

drop policy if exists "authenticated users can insert their own recipes" on recipes;
create policy "authenticated users can insert their own recipes" on recipes
  for insert to authenticated with check (author_id = auth.uid());

drop policy if exists "authors can update their own recipes" on recipes;
create policy "authors can update their own recipes" on recipes
  for update to authenticated using (author_id = auth.uid());

drop policy if exists "authors can delete their own recipes" on recipes;
create policy "authors can delete their own recipes" on recipes
  for delete to authenticated using (author_id = auth.uid());
