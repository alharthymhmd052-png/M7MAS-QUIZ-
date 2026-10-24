create table rooms(code text primary key,host uuid,status text default 'lobby',category text,difficulty text,round int default 0,
 question text,reveal text,buzzed_by uuid,buzzed_at timestamptz,failed uuid[] default '{}',used text[] default '{}',created_at timestamptz default now());
create table players(id uuid primary key default gen_random_uuid(),room_code text references rooms(code) on delete cascade,
 name text,avatar text,score int default 0,cooldown_until timestamptz,last_seen timestamptz default now());
create table secrets(code text primary key references rooms(code) on delete cascade,answer text,aliases text[]);
alter table rooms enable row level security; alter table players enable row level security; alter table secrets enable row level security;
create policy "read rooms" on rooms for select using(true);
create policy "read players" on players for select using(true);
-- no write policies: all writes go through the service role in /api/game. secrets has no policy = unreadable by clients.
alter publication supabase_realtime add table rooms, players;
create or replace function buzz(p_code text,p_pid uuid) returns boolean language plpgsql as $$
declare n int; begin
 update rooms r set buzzed_by=p_pid,buzzed_at=now() where r.code=p_code and r.status='question' and r.buzzed_by is null
  and not (p_pid = any(r.failed))
  and exists(select 1 from players p where p.id=p_pid and p.room_code=p_code and (p.cooldown_until is null or p.cooldown_until<=now()));
 get diagnostics n=row_count; return n=1; end $$;
