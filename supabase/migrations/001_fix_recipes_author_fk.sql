-- Fixes recipes.author_id to reference profiles instead of auth.users directly,
-- so PostgREST can embed profiles(display_name) in the recipes query.
-- Run once in Supabase SQL editor if you already ran the original schema.sql.

alter table recipes drop constraint if exists recipes_author_id_fkey;
alter table recipes add constraint recipes_author_id_fkey
  foreign key (author_id) references profiles(id) on delete cascade;
