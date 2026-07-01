-- Run this once in your Supabase project's SQL editor (Project > SQL Editor > New query).
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE where possible.

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
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

-- Auto-create a profile row whenever someone signs up.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

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
