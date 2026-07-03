-- Fixes handle_new_user from 003: rpad(s, 3) TRUNCATES strings longer than 3,
-- so every generated username collapsed to 3 characters. Pad only when short.
-- Existing truncated usernames can be fixed by their owners in Settings > Profile.

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base text;
  candidate text;
  n int := 0;
begin
  base := coalesce(nullif(regexp_replace(
    lower(split_part(new.email, '@', 1)), '[^a-z0-9_]', '', 'g'), ''), 'user');
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
