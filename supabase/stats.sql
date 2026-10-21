-- ElevenNotes usage numbers. Run once in Supabase: SQL Editor > New query > Run.
-- Counts anonymous devices only (a random id made on each phone). No names, no emails, no personal data.

create table if not exists public.app_devices (
    device     text primary key check (char_length(device) between 8 and 64),
    first_seen timestamptz not null default now(),
    last_seen  timestamptz not null default now()
);
alter table public.app_devices enable row level security;
revoke all on public.app_devices from anon, authenticated;

-- Called once a day by the app.
create or replace function public.ping_device(p_device text)
returns void
language sql security definer set search_path = public as $$
    insert into public.app_devices (device) values (p_device)
    on conflict (device) do update set last_seen = now();
$$;

-- Private numbers: only you can read them (SQL Editor). The website cannot call this.
create or replace function public.get_stats()
returns jsonb
language sql security definer set search_path = public as $$
    select jsonb_build_object(
        'students',    (select count(*) from public.app_devices),
        'active_week', (select count(*) from public.app_devices where last_seen > now() - interval '7 days'),
        'notes',       (select count(*) from public.resources where reports < 5),
        'likes',       (select count(*) from public.resource_votes),
        'classes',     (select count(distinct class_key) from public.resources where reports < 5)
    );
$$;

revoke all on function public.ping_device(text), public.get_stats() from public, anon, authenticated;
grant execute on function public.ping_device(text) to anon, authenticated;   -- the app may only say hello, never read the numbers
