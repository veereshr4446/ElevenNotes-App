-- ElevenNotes branch and semester filters. Run once in Supabase: SQL Editor > New query > Run.
-- Safe to run after setup.sql and upvotes.sql. Lists notes from every class (with their class) so the app can filter them.

create or replace function public.list_notes(p_voter text default null)
returns table (id uuid, class_key text, title text, subject text, url text, uploader text, created_at timestamptz, votes int, voted boolean)
language sql security definer set search_path = public as $$
    select r.id, r.class_key, r.title, r.subject, r.url, r.uploader, r.created_at,
           (select count(*)::int from public.resource_votes v where v.resource_id = r.id),
           exists (select 1 from public.resource_votes v where v.resource_id = r.id and v.voter = p_voter)
    from public.resources r
    where r.reports < 5
    order by r.created_at desc limit 300;
$$;

revoke all on function public.list_notes(text) from public;
grant execute on function public.list_notes(text) to anon, authenticated;
