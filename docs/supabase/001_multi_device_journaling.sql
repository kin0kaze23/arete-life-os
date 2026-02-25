-- Multi-device journaling schema (Plan 02)

create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  vault_salt text not null,
  vault_iterations int default 100000,
  timezone text default 'UTC',
  telegram_link_token text,
  telegram_link_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_profiles enable row level security;
create policy "users own profile" on user_profiles
  for all using (auth.uid() = id);

create table if not exists vault_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_type text not null check (entry_type in (
    'memory', 'claim', 'task', 'event', 'goal',
    'recommendation', 'blindspot', 'profile', 'rule_of_life'
  )),
  entry_id text not null,
  encrypted_data text not null,
  iv text not null,
  category text,
  subcategory text,
  sentiment text check (sentiment in ('positive', 'negative', 'neutral', 'mixed')),
  source text default 'dashboard',
  logged_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, entry_type, entry_id)
);

alter table vault_entries enable row level security;
create policy "users own vault entries" on vault_entries
  for all using (auth.uid() = user_id);

create index if not exists idx_vault_entries_user_type on vault_entries(user_id, entry_type);
create index if not exists idx_vault_entries_category on vault_entries(user_id, category);
create index if not exists idx_vault_entries_logged_at on vault_entries(user_id, logged_at desc);

create table if not exists inbox_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null default 'telegram',
  raw_content text not null,
  content_type text not null default 'text' check (content_type in ('text', 'image', 'url', 'video')),
  source_url text,
  media_storage_path text,
  ai_result jsonb,
  merged boolean not null default false,
  merged_at timestamptz,
  created_at timestamptz default now()
);

alter table inbox_entries enable row level security;
create policy "users own inbox" on inbox_entries
  for all using (auth.uid() = user_id);

create index if not exists idx_inbox_unmerged on inbox_entries(user_id, merged, created_at desc)
  where merged = false;

create table if not exists telegram_bindings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  telegram_chat_id bigint not null unique,
  telegram_username text,
  telegram_first_name text,
  linked_at timestamptz default now(),
  is_active boolean not null default true
);

alter table telegram_bindings enable row level security;
create policy "users own bindings" on telegram_bindings
  for all using (auth.uid() = user_id);

create table if not exists dimension_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  snapshotted_at timestamptz default now(),
  health_score numeric(4,1),
  finance_score numeric(4,1),
  relationships_score numeric(4,1),
  spiritual_score numeric(4,1),
  personal_score numeric(4,1),
  memory_count int,
  period_notes text
);

alter table dimension_snapshots enable row level security;
create policy "users own snapshots" on dimension_snapshots
  for all using (auth.uid() = user_id);

create index if not exists idx_snapshots_user on dimension_snapshots(user_id, snapshotted_at desc);
