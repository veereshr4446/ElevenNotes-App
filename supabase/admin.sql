-- ElevenNotes owner delete. Run once in Supabase: SQL Editor > New query > Run.
-- Lets ONE secret code (known only to the owner) delete any note from the normal Delete box.
-- The code itself is NOT in this file or in the website. Only a hash of it is stored in the database.
-- Set or change the code with the separate "Set admin code" query (never save or upload that one).

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.admin_secret (
    id        int primary key default 1 check (id = 1),
    code_hash text not null
);
alter table public.admin_secret enable row level security;
revoke all on public.admin_secret from anon, authenticated;

-- Same as before, plus: the admin code deletes any note.
-- Wrong guesses still count toward the 5-try, 15-minute lock on that note.
create or replace function public.delete_resource(p_id uuid, p_pin text)
returns text
language plpgsql security definer set search_path = public, extensions as $$
declare r public.resources; a text;
begin
    select * into r from public.resources where id = p_id for update;
    if not found then return 'missing'; end if;
    if r.locked_until is not null and r.locked_until > now() then return 'locked'; end if;
    select code_hash into a from public.admin_secret where id = 1;
    if crypt(p_pin, r.pin_hash) = r.pin_hash or (a is not null and char_length(p_pin) >= 8 and crypt(p_pin, a) = a) then
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

revoke all on function public.delete_resource(uuid,text) from public;
grant execute on function public.delete_resource(uuid,text) to anon, authenticated;
