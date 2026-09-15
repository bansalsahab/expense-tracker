-- Expense Tracker schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- Enable Row Level Security on all tables so each user only sees their own data

-- ── Categories ──────────────────────────────────────────────────────────────
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  color       text not null default '#3b82f6',
  icon        text not null default '💸',
  type        text not null check (type in ('expense','income')),
  created_at  timestamptz not null default now()
);

alter table categories enable row level security;

create policy "Users see own categories"
  on categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Transactions ─────────────────────────────────────────────────────────────
create table if not exists transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  amount        numeric(12,2) not null check (amount > 0),
  description   text not null,
  category_id   uuid references categories(id) on delete set null,
  date          date not null,
  type          text not null check (type in ('expense','income')),
  notes         text,
  created_at    timestamptz not null default now()
);

alter table transactions enable row level security;

create policy "Users see own transactions"
  on transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Budgets ───────────────────────────────────────────────────────────────────
create table if not exists budgets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  category_id   uuid references categories(id) on delete cascade,
  amount        numeric(12,2) not null check (amount > 0),
  month         text not null,  -- YYYY-MM
  created_at    timestamptz not null default now(),
  unique (user_id, category_id, month)
);

alter table budgets enable row level security;

create policy "Users see own budgets"
  on budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Real-time ─────────────────────────────────────────────────────────────────
-- Allow real-time subscriptions on these tables
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table categories;
alter publication supabase_realtime add table budgets;
