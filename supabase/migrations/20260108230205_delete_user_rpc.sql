-- Create a secure function that allows a user to delete ONLY themselves
create or replace function delete_user()
returns void
language plpgsql
security definer
as $$
begin
  -- Delete public profile
  delete from public.profiles where id = auth.uid();
  
  -- Delete the user from auth.users (this logs them out globally & removes auth entry)
  delete from auth.users where id = auth.uid();
end;
$$;
