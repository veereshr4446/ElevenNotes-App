-- ElevenNotes note types (Notes, Question paper, Lab manual, Assignment). Run once in Supabase: SQL Editor > New query > Run.
-- Run it AFTER setup.sql, filters.sql and password.sql. Safe to run again. Notes uploaded earlier become "Notes".

alter table public.resources add column if not exists kind text not null default 'Notes';
do $$ begin
    alter table public.resources add constraint resources_kind_check check (kind in ('Notes', 'Question paper', 'Lab manual', 'Assignment'));
exception when duplicate_object then null; end $$;

-- Upload with a type. The old six-argument version stays, so older copies of the app keep working.
create or replace function public.add_resource(p_class text, p_title text, p_subject text, p_url text, p_uploader text, p_pin text, p_kind text)
returns uuid
language plpgsql security definer set search_path = public, extensions as $$
declare new_id uuid;
begin
    if char_length(p_pin) < 6 or char_length(p_pin) > 30 then raise exception 'Password must be 6 to 30 characters'; end if;
    insert into public.resources (class_key, title, subject, url, uploader, pin_hash, kind)
    values (trim(p_class), trim(p_title), coalesce(nullif(trim(p_subject), ''), 'General'), trim(p_url),
            coalesce(nullif(trim(p_uploader), ''), 'Student'), crypt(p_pin, gen_salt('bf')),
            case when p_kind in ('Notes', 'Question paper', 'Lab manual', 'Assignment') then p_kind else 'Notes' end)
    returning id into new_id;
    return new_id;
end $$;

-- The list now also returns the type.
drop function if exists public.list_notes(text);
create function public.list_notes(p_voter text default null)
returns table (id uuid, class_key text, title text, subject text, url text, uploader text, created_at timestamptz, votes int, voted boolean, kind text)
language sql security definer set search_path = public as $$
    select r.id, r.class_key, r.title, r.subject, r.url, r.uploader, r.created_at,
           (select count(*)::int from public.resource_votes v where v.resource_id = r.id),
           exists (select 1 from public.resource_votes v where v.resource_id = r.id and v.voter = p_voter),
           r.kind
    from public.resources r
    where r.reports < 5
    order by r.created_at desc limit 300;
$$;

revoke all on function public.add_resource(text,text,text,text,text,text,text), public.list_notes(text) from public;
grant execute on function public.add_resource(text,text,text,text,text,text,text), public.list_notes(text) to anon, authenticated;
