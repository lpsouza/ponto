-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  preferences jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Access policies for profiles
alter table public.profiles enable row level security;

create policy "Users can view their own profile."
  on public.profiles for select
  using ( auth.uid() = id );

create policy "Users can update their own profile."
  on public.profiles for update
  using ( auth.uid() = id );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

-- Create companies table
create table if not exists public.companies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Access policies for companies
alter table public.companies enable row level security;

create policy "Users can view their own companies."
  on public.companies for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own companies."
  on public.companies for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own companies."
  on public.companies for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own companies."
  on public.companies for delete
  using ( auth.uid() = user_id );

-- Create time_records table
create table if not exists public.time_records (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  company_id uuid references public.companies(id) not null,
  timestamp timestamptz not null default now(),
  type text not null check (type in ('start', 'pause', 'resume', 'finish')),
  is_manual_entry boolean default false,
  notes text,
  location text,
  device_time timestamptz,
  created_at timestamptz default now()
);

-- Access policies for time_records
alter table public.time_records enable row level security;

create policy "Users can view their own time records."
  on public.time_records for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own time records."
  on public.time_records for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own time records."
  on public.time_records for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own time records."
  on public.time_records for delete
  using ( auth.uid() = user_id );
