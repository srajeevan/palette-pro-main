-- Add developer response fields to feature_requests
alter table public.feature_requests
    add column if not exists dev_response text,
    add column if not exists dev_response_at timestamptz;
