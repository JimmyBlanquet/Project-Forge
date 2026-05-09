-- Initial Schema Migration for saas-base
-- This migration creates the profiles table and necessary policies for a SaaS application
-- using Supabase Auth as the authentication provider

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================

-- Create profiles table (extends auth.users with additional user data)
-- This table stores user profile information and subscription data
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  image text,
  role text not null default 'USER',

  -- Stripe subscription fields
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  stripe_current_period_end timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create indexes for performance
create index profiles_email_idx on public.profiles(email);
create index profiles_stripe_customer_id_idx on public.profiles(stripe_customer_id);
create index profiles_stripe_subscription_id_idx on public.profiles(stripe_subscription_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- RLS Policies for profiles table

-- Allow users to read their own profile
create policy "Users can view their own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update their own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Create function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for updated_at
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- Create function to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, image)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to create profile when user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================================
-- COMMENTS
-- ============================================================================

comment on table public.profiles is 'User profile information extending auth.users';
comment on column public.profiles.role is 'User role: USER or ADMIN';
comment on column public.profiles.stripe_customer_id is 'Stripe customer ID for billing';
comment on column public.profiles.stripe_subscription_id is 'Stripe subscription ID';
comment on column public.profiles.stripe_price_id is 'Stripe price ID for current subscription';
comment on column public.profiles.stripe_current_period_end is 'End date of current billing period';
