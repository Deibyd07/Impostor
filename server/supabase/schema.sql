create table if not exists public.profiles (
  id uuid primary key,
  name text not null,
  avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matches (
  id text primary key,
  winner text not null check (winner in ('citizens', 'impostor')),
  reason text,
  mode text,
  category text,
  word text,
  fake_word text,
  played_at timestamptz not null default now()
);

create table if not exists public.match_players (
  match_id text not null references public.matches(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  avatar text,
  role text not null,
  won boolean not null,
  played_at timestamptz not null default now(),
  primary key (match_id, profile_id)
);

create table if not exists public.player_stats (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  name text not null,
  avatar text,
  games_played integer not null default 0,
  wins integer not null default 0,
  losses integer not null default 0,
  impostor_games integer not null default 0,
  citizen_games integer not null default 0,
  impostor_wins integer not null default 0,
  citizen_wins integer not null default 0,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  score integer not null default 0,
  last_role text,
  last_result text,
  last_played_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists player_stats_score_idx
  on public.player_stats(score desc, wins desc, games_played desc);

alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.player_stats enable row level security;

drop policy if exists "profiles are readable" on public.profiles;
drop policy if exists "matches are readable" on public.matches;
drop policy if exists "match players are readable" on public.match_players;
drop policy if exists "player stats are readable" on public.player_stats;

create policy "profiles are readable"
  on public.profiles for select
  using (true);

create policy "matches are readable"
  on public.matches for select
  using (true);

create policy "match players are readable"
  on public.match_players for select
  using (true);

create policy "player stats are readable"
  on public.player_stats for select
  using (true);
