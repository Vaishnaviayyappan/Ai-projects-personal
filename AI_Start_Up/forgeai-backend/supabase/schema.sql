-- ForgeAI Supabase Database Schema

-- 1. Users Table (Extends Supabase Auth)
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  tier text default 'free',
  credits integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Projects Table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users on delete cascade,
  idea_prompt text not null,
  status text default 'initializing',
  github_repo_url text,
  vercel_deployment_url text,
  validation_score integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Agent Logs Table (For real-time streaming to the Factory Floor UI)
create table public.agent_logs (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects on delete cascade not null,
  agent_name text not null,
  log_message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Generated Assets Table
create table public.assets (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects on delete cascade not null,
  asset_type text not null, -- 'prd', 'pitch_deck', 'market_research'
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.agent_logs enable row level security;
alter table public.assets enable row level security;

-- Create Policies
create policy "Users can view their own profile." on public.users for select using (auth.uid() = id);
create policy "Users can update their own profile." on public.users for update using (auth.uid() = id);

create policy "Users can view their own projects." on public.projects for select using (auth.uid() = user_id);
create policy "Users can insert their own projects." on public.projects for insert with check (auth.uid() = user_id);

create policy "Users can view logs for their projects." on public.agent_logs for select using (
  auth.uid() in (select user_id from public.projects where id = project_id)
);

create policy "Users can view assets for their projects." on public.assets for select using (
  auth.uid() in (select user_id from public.projects where id = project_id)
);
