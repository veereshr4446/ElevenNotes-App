-- ElevenNotes Shared Library — run this once in Supabase: SQL Editor > New query > Run.
-- Design: the table is locked. The website can only call the functions below,
-- so nobody can read PIN hashes or delete rows directly.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.resources (
    id           uuid primary key default gen_random_uuid(),
    class_key    text not null check (char_length(class_key) between 1 and 40),
    title        text not null check (char_length(title) between 2 and 80),
    subject      text not null default 'General' check (char_length(subject) <= 20),
    url          text not null check (url ~* '^https://(drive|docs)\.google\.com/' and char_length(url) <= 500),
    uploader     text not null default 'Student' check (char_length(uploader) <= 40),
    pin_hash     text not null,
    fails        int  not null default 0,
    locked_until timestamptz,
    reports      int  not null default 0,
    created_at   timestamptz not null default now()
);
alter table public.resources enable row level security;   -- no policies: direct access is blocked
revoke all on public.resources from anon, authenticated;

-- List (never returns pin_hash). Items with 5+ reports are hidden.
create or replace function public.list_resources(p_class text)
returns table (id uuid, title text, subject text, url text, uploader text, created_at timestamptz)
language sql security definer set search_path = public as $$
    select r.id, r.title, r.subject, r.url, r.uploader, r.created_at
    from public.resources r
    where r.class_key = p_class and r.reports < 5
    order by r.created_at desc limit 200;
$$;

-- Add (PIN must be exactly 6 digits; stored only as a bcrypt hash).
create or replace function public.add_resource(p_class text, p_title text, p_subject text, p_url text, p_uploader text, p_pin text)
returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare new_id uuid;
begin
    if p_pin !~ '^[0-9]{6}$' then raise exception 'PIN must be 6 digits'; end if;
    insert into public.resources (class_key, title, subject, url, uploader, pin_hash)
    values (trim(p_class), trim(p_title), coalesce(nullif(trim(p_subject), ''), 'General'), trim(p_url),
            coalesce(nullif(trim(p_uploader), ''), 'Student'), crypt(p_pin, gen_salt('bf')))
    returning id into new_id;
    return new_id;
end $$;

-- Delete: returns 'ok', 'wrong', 'locked' or 'missing'. 5 wrong PINs lock that item for 15 minutes.
create or replace function public.delete_resource(p_id uuid, p_pin text)
returns text
language plpgsql security definer set search_path = public, extensions as $$
declare r public.resources;
begin
    select * into r from public.resources where id = p_id for update;
    if not found then return 'missing'; end if;
    if r.locked_until is not null and r.locked_until > now() then return 'locked'; end if;
    if crypt(p_pin, r.pin_hash) = r.pin_hash then
        delete from public.resources where id = p_id;
        return 'ok';
    end if;
    if r.fails + 1 >= 5 then
        update public.resources set fails = 0, locked_until = now() + interval '15 minutes' where id = p_id;
        return 'locked';
    end if;
    update public.resources set fails = fails + 1 where id = p_id;
    return 'wrong';
end $$;

-- Report a bad link
create or replace function public.report_resource(p_id uuid)
returns void
language sql security definer set search_path = public as $$
    update public.resources set reports = reports + 1 where id = p_id;
$$;

revoke all on function public.list_resources(text), public.add_resource(text,text,text,text,text,text),
    public.delete_resource(uuid,text), public.report_resource(uuid) from public;
grant execute on function public.list_resources(text), public.add_resource(text,text,text,text,text,text),
    public.delete_resource(uuid,text), public.report_resource(uuid) to anon, authenticated;
