-- Create a table for subscriptions
create table subscriptions (
  id text not null primary key, -- Stripe Subscription ID
  user_id uuid references auth.users not null,
  status text check (status in ('active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused')) not null,
  metadata jsonb,
  price_id text, -- Stripe Price ID
  quantity integer,
  cancel_at_period_end boolean,
  created timestamp with time zone default timezone('utc'::text, now()) not null,
  current_period_start timestamp with time zone default timezone('utc'::text, now()) not null,
  current_period_end timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at timestamp with time zone default timezone('utc'::text, now()),
  cancel_at timestamp with time zone default timezone('utc'::text, now()),
  canceled_at timestamp with time zone default timezone('utc'::text, now()),
  trial_start timestamp with time zone default timezone('utc'::text, now()),
  trial_end timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table subscriptions enable row level security;

-- Policy: Users can view their own subscription
create policy "Users can view own subscription" on subscriptions
  for select using (auth.uid() = user_id);

-- Policy: Only service role can insert/update/delete (usually handled by webhooks)
-- But effectively default deny for others implies only service role can write if no policy exists for them.

-- Add stripe_customer_id to profiles (One-to-One mapping usually)
alter table profiles add column if not exists stripe_customer_id text;
alter table profiles add column if not exists is_pro boolean default false;

-- Add index for faster lookups
create index if not exists subscriptions_user_id_idx on subscriptions(user_id);
