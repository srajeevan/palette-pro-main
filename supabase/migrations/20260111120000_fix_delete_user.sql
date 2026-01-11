-- Update delete_user to cascade delete linked tables
create or replace function delete_user()
returns void
language plpgsql
security definer
as $$
begin
  -- 1. Delete associated subscriptions to prevent FK violation
  delete from public.subscriptions where user_id = auth.uid();

  -- 2. Delete public profile
  delete from public.profiles where id = auth.uid();

  -- 3. Delete palettes (if not automatically cascaded)
  -- Assuming palettes reference auth.users. If they reference profiles, step 2 might have triggered it.
  -- But explicit is better if unsure.
  -- delete from public.palettes where user_id = auth.uid(); 
  
  -- 4. Delete the user from auth.users (this logs them out globally & removes auth entry)
  delete from auth.users where id = auth.uid();
end;
$$;
