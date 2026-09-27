-- Run once in Supabase SQL Editor. No browser role may read or mutate drafts.
create extension if not exists pgcrypto;
create table public.games (
 id uuid primary key default gen_random_uuid(),
 teacher_id uuid not null references auth.users(id) on delete cascade,
 code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
 status text not null default 'draft' check(status in ('draft','published')),
 data jsonb not null default '{"title":"Trò chơi mới","description":"","subject":"","grade":"","musicPath":null,"musicEnabled":true,"musicVolume":0.35,"timerMode":"none","timeLimit":300,"scoreEnabled":false,"sfxEnabled":false}',
 version integer not null default 0,
 published_data jsonb,
 published_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index games_teacher_idx on public.games(teacher_id,updated_at desc);
create table public.puzzle_rounds (
 id uuid primary key,
 game_id uuid not null references public.games(id) on delete cascade,
 position integer not null check(position>=0),
 image_path text not null,
 width integer not null check(width>0), height integer not null check(height>0),
 title text not null default '',hint text not null default '',completion_message text not null default '',
 rows integer not null check(rows between 2 and 10), columns integer not null check(columns between 2 and 10),
 enabled boolean not null default true,
 unique(game_id,position)
);
alter table public.games enable row level security;
alter table public.puzzle_rounds enable row level security;
revoke all on public.games,public.puzzle_rounds from anon, authenticated;
grant all on public.games,public.puzzle_rounds to service_role;

-- Atomic autosave, including ordering. Optimistic concurrency prevents lost edits.
create function public.save_game(p_game uuid,p_owner uuid,p_expected integer,p_data jsonb,p_rounds jsonb)
returns integer language plpgsql set search_path=public as $$
declare v integer; r jsonb; pos integer:=0;
begin
 update games set data=p_data,version=version+1,updated_at=now()
 where id=p_game and teacher_id=p_owner and version=p_expected returning version into v;
 if v is null then raise exception 'EDIT_CONFLICT'; end if;
 delete from puzzle_rounds where game_id=p_game;
 for r in select value from jsonb_array_elements(p_rounds) loop
  insert into puzzle_rounds(id,game_id,position,image_path,width,height,title,hint,completion_message,rows,columns,enabled)
  values((r->>'id')::uuid,p_game,pos,r->>'imagePath',(r->>'width')::int,(r->>'height')::int,r->>'title',r->>'hint',r->>'completionMessage',(r->>'rows')::int,(r->>'columns')::int,(r->>'enabled')::boolean);
  pos:=pos+1;
 end loop;
 return v;
end $$;
revoke all on function public.save_game(uuid,uuid,integer,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.save_game(uuid,uuid,integer,jsonb,jsonb) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('game-assets','game-assets',false,4194304,array['image/webp','audio/mpeg'])
on conflict(id) do nothing;
-- Storage is private. Only the server service role uploads and signs asset URLs.
