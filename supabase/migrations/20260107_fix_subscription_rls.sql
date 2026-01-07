-- Allow users to insert their own subscription records
create policy "Users can insert own subscription" on subscriptions
  for insert with check (auth.uid() = user_id);

-- Allow users to update their own subscription records
create policy "Users can update own subscription" on subscriptions
  for update using (auth.uid() = user_id);
