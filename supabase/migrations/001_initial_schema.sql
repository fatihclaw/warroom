-- WAR ROOM - Initial Database Schema
-- Content Intelligence Platform

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================
-- USERS
-- ============================================
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  full_name text,
  avatar_url text,
  settings jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- TRACKED ACCOUNTS
-- ============================================
create table public.tracked_accounts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  platform text not null check (platform in ('youtube', 'tiktok', 'instagram', 'twitter', 'linkedin')),
  platform_id text, -- platform-specific user/channel ID
  username text not null,
  display_name text,
  avatar_url text,
  profile_url text,
  follower_count bigint default 0,
  is_own_account boolean default false,
  sync_enabled boolean default true,
  last_synced_at timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, platform, username)
);

-- ============================================
-- VIDEOS / POSTS
-- ============================================
create table public.videos (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references public.tracked_accounts(id) on delete cascade,
  platform text not null,
  platform_video_id text not null,
  title text,
  description text,
  thumbnail_url text,
  video_url text,
  duration_seconds integer,
  view_count bigint default 0,
  like_count bigint default 0,
  comment_count bigint default 0,
  share_count bigint default 0,
  save_count bigint default 0,
  engagement_rate numeric(8,4) default 0,
  nx_avg numeric(8,2) default 0, -- views / account average views
  hashtags text[] default '{}',
  published_at timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(platform, platform_video_id)
);

-- ============================================
-- METRICS SNAPSHOTS (for trend curves)
-- ============================================
create table public.metrics_snapshots (
  id uuid primary key default uuid_generate_v4(),
  video_id uuid references public.videos(id) on delete cascade,
  view_count bigint default 0,
  like_count bigint default 0,
  comment_count bigint default 0,
  share_count bigint default 0,
  save_count bigint default 0,
  captured_at timestamptz default now()
);

-- ============================================
-- ACCOUNT SNAPSHOTS (daily account-level metrics)
-- ============================================
create table public.account_snapshots (
  id uuid primary key default uuid_generate_v4(),
  account_id uuid references public.tracked_accounts(id) on delete cascade,
  follower_count bigint default 0,
  total_views bigint default 0,
  total_videos integer default 0,
  avg_views bigint default 0,
  avg_engagement_rate numeric(8,4) default 0,
  captured_at timestamptz default now()
);

-- ============================================
-- COLLECTIONS
-- ============================================
create table public.collections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  description text,
  color text default '#ec4899',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.collection_items (
  id uuid primary key default uuid_generate_v4(),
  collection_id uuid references public.collections(id) on delete cascade,
  video_id uuid references public.videos(id) on delete cascade,
  notes text,
  added_at timestamptz default now(),
  unique(collection_id, video_id)
);

-- ============================================
-- CONTENT IDEAS (Ideation Module)
-- ============================================
create table public.content_ideas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  topic text not null,
  hook text,
  angle text,
  format text,
  target_platform text,
  reference_video_id uuid references public.videos(id) on delete set null,
  ai_reasoning text,
  status text default 'new' check (status in ('new', 'saved', 'used', 'dismissed')),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- ============================================
-- CONTENT SCRIPTS (Script Module)
-- ============================================
create table public.content_scripts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  idea_id uuid references public.content_ideas(id) on delete set null,
  title text not null,
  platform text not null,
  script_data jsonb not null default '{}', -- hook, beats, cta, hashtags, etc.
  plain_text text, -- rendered plain text version
  status text default 'draft' check (status in ('draft', 'in_review', 'approved', 'published')),
  version integer default 1,
  template_id uuid,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- CONTENT REVIEWS (Review Module)
-- ============================================
create table public.content_reviews (
  id uuid primary key default uuid_generate_v4(),
  script_id uuid references public.content_scripts(id) on delete cascade,
  score integer check (score between 0 and 100),
  hook_score integer check (hook_score between 0 and 100),
  feedback jsonb default '{}', -- structured feedback: flags, suggestions, etc.
  ai_analysis text,
  status text default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz default now()
);

-- ============================================
-- PUBLISHING QUEUE
-- ============================================
create table public.publishing_queue (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  script_id uuid references public.content_scripts(id) on delete set null,
  platform text not null,
  account_id uuid references public.tracked_accounts(id) on delete set null,
  content jsonb not null default '{}', -- caption, hashtags, media URLs
  scheduled_at timestamptz not null,
  published_at timestamptz,
  status text default 'pending' check (status in ('pending', 'publishing', 'published', 'failed')),
  published_url text,
  error_message text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- ============================================
-- TRENDS (Research Module)
-- ============================================
create table public.trends (
  id uuid primary key default uuid_generate_v4(),
  type text not null check (type in ('content', 'sound', 'hashtag', 'format')),
  platform text,
  title text not null,
  description text,
  data jsonb default '{}', -- trend-specific data (sound URL, hashtag stats, etc.)
  growth_rate numeric(10,2) default 0,
  detected_at timestamptz default now(),
  expires_at timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- ============================================
-- TEMPLATES (reusable content formats)
-- ============================================
create table public.templates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  platform text not null,
  structure jsonb not null default '{}',
  description text,
  usage_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- AGENT CONVERSATIONS
-- ============================================
create table public.agent_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  title text,
  messages jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- INDEXES
-- ============================================
create index idx_videos_account on public.videos(account_id);
create index idx_videos_platform on public.videos(platform);
create index idx_videos_published on public.videos(published_at desc);
create index idx_videos_views on public.videos(view_count desc);
create index idx_videos_nx_avg on public.videos(nx_avg desc);
create index idx_metrics_video on public.metrics_snapshots(video_id, captured_at desc);
create index idx_account_snapshots on public.account_snapshots(account_id, captured_at desc);
create index idx_tracked_accounts_user on public.tracked_accounts(user_id);
create index idx_content_ideas_user on public.content_ideas(user_id, created_at desc);
create index idx_content_scripts_user on public.content_scripts(user_id, created_at desc);
create index idx_publishing_queue_scheduled on public.publishing_queue(scheduled_at) where status = 'pending';
create index idx_trends_type on public.trends(type, detected_at desc);
create index idx_collections_user on public.collections(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.users enable row level security;
alter table public.tracked_accounts enable row level security;
alter table public.videos enable row level security;
alter table public.metrics_snapshots enable row level security;
alter table public.account_snapshots enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.content_ideas enable row level security;
alter table public.content_scripts enable row level security;
alter table public.content_reviews enable row level security;
alter table public.publishing_queue enable row level security;
alter table public.trends enable row level security;
alter table public.templates enable row level security;
alter table public.agent_conversations enable row level security;

-- For now, allow all operations for authenticated users (single-user app)
-- These policies can be tightened for multi-tenant later

create policy "Users can manage own data" on public.users
  for all using (true) with check (true);

create policy "Manage tracked accounts" on public.tracked_accounts
  for all using (true) with check (true);

create policy "Manage videos" on public.videos
  for all using (true) with check (true);

create policy "Manage metrics snapshots" on public.metrics_snapshots
  for all using (true) with check (true);

create policy "Manage account snapshots" on public.account_snapshots
  for all using (true) with check (true);

create policy "Manage collections" on public.collections
  for all using (true) with check (true);

create policy "Manage collection items" on public.collection_items
  for all using (true) with check (true);

create policy "Manage content ideas" on public.content_ideas
  for all using (true) with check (true);

create policy "Manage content scripts" on public.content_scripts
  for all using (true) with check (true);

create policy "Manage content reviews" on public.content_reviews
  for all using (true) with check (true);

create policy "Manage publishing queue" on public.publishing_queue
  for all using (true) with check (true);

create policy "Manage trends" on public.trends
  for all using (true) with check (true);

create policy "Manage templates" on public.templates
  for all using (true) with check (true);

create policy "Manage agent conversations" on public.agent_conversations
  for all using (true) with check (true);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.users
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.tracked_accounts
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.videos
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.collections
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.content_scripts
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.templates
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.agent_conversations
  for each row execute function public.handle_updated_at();
