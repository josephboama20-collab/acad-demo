-- Patch: ensure new users get semesters bucket (run if 001 was applied earlier)
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
    (new.id, 'forge', '{}'::jsonb),
    (new.id, 'semesters', '{"currentSemesterId":null,"semesters":[],"snapshots":{}}'::jsonb);
  return new;
end;
$$;
