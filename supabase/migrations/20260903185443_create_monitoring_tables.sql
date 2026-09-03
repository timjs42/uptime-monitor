create table public.monitors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint monitors_name_not_empty
    check (char_length(trim(name)) > 0),

  constraint monitors_valid_url
    check (url ~ '^https?://')
);

create table public.monitor_checks (
  id bigint generated always as identity primary key,
  monitor_id uuid not null references public.monitors(id) on delete cascade,
  status_code smallint,
  response_time_ms integer not null,
  is_up boolean not null,
  error_message text,
  checked_at timestamptz not null default now(),

  constraint monitor_checks_valid_status_code
    check (
      status_code is null
      or status_code between 100 and 599
    ),

  constraint monitor_checks_valid_response_time
    check (response_time_ms >= 0)
);

create index monitor_checks_monitor_checked_at_idx
  on public.monitor_checks (monitor_id, checked_at desc);

alter table public.monitors enable row level security;
alter table public.monitor_checks enable row level security;