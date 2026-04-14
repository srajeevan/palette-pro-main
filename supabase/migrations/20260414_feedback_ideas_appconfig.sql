-- ============================================================
-- Migration: Feedback, Feature Requests, Idea Board & App Config
-- ============================================================

-- 1. feedback table
create table if not exists public.feedback (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete set null,
    user_email text,
    category text not null check (category in ('bug', 'feedback', 'other')),
    message text not null,
    app_version text,
    device_info jsonb,
    created_at timestamptz default now()
);

alter table public.feedback enable row level security;

create policy "Users can insert own feedback"
    on public.feedback for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can view own feedback"
    on public.feedback for select
    to authenticated
    using (auth.uid() = user_id);

-- 2. feature_requests table
create table if not exists public.feature_requests (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete set null,
    title text not null,
    description text not null,
    status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
    vote_count int not null default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

alter table public.feature_requests enable row level security;

create index idx_feature_requests_status on public.feature_requests(status);
create index idx_feature_requests_vote_count on public.feature_requests(vote_count desc);
create index idx_feature_requests_created_at on public.feature_requests(created_at desc);

create policy "Anyone can view approved requests"
    on public.feature_requests for select
    to authenticated
    using (status = 'approved');

create policy "Users can view own requests"
    on public.feature_requests for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can insert own requests"
    on public.feature_requests for insert
    to authenticated
    with check (auth.uid() = user_id);

-- 3. feature_request_votes table
create table if not exists public.feature_request_votes (
    id uuid primary key default gen_random_uuid(),
    feature_request_id uuid not null references public.feature_requests(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz default now(),
    unique(feature_request_id, user_id)
);

alter table public.feature_request_votes enable row level security;

create policy "Users can view own votes"
    on public.feature_request_votes for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can insert own votes"
    on public.feature_request_votes for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can delete own votes"
    on public.feature_request_votes for delete
    to authenticated
    using (auth.uid() = user_id);

-- Trigger function to update vote_count
create or replace function public.update_vote_count()
returns trigger
language plpgsql
security definer
as $$
begin
    if TG_OP = 'INSERT' then
        update public.feature_requests
        set vote_count = vote_count + 1, updated_at = now()
        where id = NEW.feature_request_id;
        return NEW;
    elsif TG_OP = 'DELETE' then
        update public.feature_requests
        set vote_count = vote_count - 1, updated_at = now()
        where id = OLD.feature_request_id;
        return OLD;
    end if;
end;
$$;

create trigger trg_update_vote_count
    after insert or delete on public.feature_request_votes
    for each row execute function public.update_vote_count();

-- 4. moderation_tokens table
create table if not exists public.moderation_tokens (
    id uuid primary key default gen_random_uuid(),
    feature_request_id uuid not null references public.feature_requests(id) on delete cascade,
    action text not null check (action in ('approve', 'reject')),
    used boolean not null default false,
    expires_at timestamptz default now() + interval '7 days',
    created_at timestamptz default now()
);

alter table public.moderation_tokens enable row level security;
-- No client RLS policies — only edge functions with service role access this

-- 5. app_config table
create table if not exists public.app_config (
    key text primary key,
    value jsonb not null,
    updated_at timestamptz default now()
);

alter table public.app_config enable row level security;

create policy "Public read access to app_config"
    on public.app_config for select
    to anon, authenticated
    using (true);

-- Seed: latest_version
insert into public.app_config (key, value)
values (
    'latest_version',
    '{"version": "1.0.1", "min_version": "1.0.0", "store_url_ios": "https://apps.apple.com/us/app/palettepro-oil-paint-mixing/id6757408609", "type": "minor", "update_message": "Bug fixes and performance improvements.", "features": []}'::jsonb
)
on conflict (key) do nothing;
