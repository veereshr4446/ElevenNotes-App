-- ElevenNotes upvotes. Run once in Supabase: SQL Editor > New query > Run.
-- Safe to run after setup.sql. One vote per device (anonymous id), tap again to remove.

create table if not exists public.resource_votes (
    resource_id uuid not null references public.resources(id) on delete cascade,
    voter       text not null check (char_length(voter) between 8 and 64),
    created_at  timestamptz not null default now(),
    primary key (resource_id, voter)
);
alter table public.resource_votes enable row level security;
revoke all on public.resource_votes from anon, authenticated;

drop function if exists public.list_resources(text);
create or replace function public.list_resources(p_class text, p_voter text default null)
returns table (id uuid, title text, subject text, url text, uploader text, created_at timestamptz, votes int, voted boolean)
language sql security definer set search_path = public as $$
    select r.id, r.title, r.subject, r.url, r.uploader, r.created_at,
           (select count(*)::int from public.resource_votes v where v.resource_id = r.id),
           exists (select 1 from public.resource_votes v where v.resource_id = r.id and v.voter = p_voter)
    from public.resources r
    where r.class_key = p_class and r.reports < 5
    order by r.created_at desc limit 200;
$$;

-- Toggle a vote. Returns the new vote count.
create or replace function public.vote_resource(p_id uuid, p_voter text)
returns int
language plpgsql security definer set search_path = public as $$
begin
    if exists (select 1 from public.resource_votes where resource_id = p_id and voter = p_voter) then
        delete from public.resource_votes where resource_id = p_id and voter = p_voter;
    else
        insert into public.resource_votes (resource_id, voter) values (p_id, p_voter);
    end if;
    return (select count(*)::int from public.resource_votes where resource_id = p_id);
end $$;

revoke all on function public.list_resources(text, text), public.vote_resource(uuid, text) from public;
grant execute on function public.list_resources(text, text), public.vote_resource(uuid, text) to anon, authenticated;
