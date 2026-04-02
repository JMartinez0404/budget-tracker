-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  sort_order int not null default 0,
  notes text,
  budget_limit numeric(10,2),
  is_income boolean not null default false,
  created_at timestamptz not null default now()
);

-- Transactions
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  category_id uuid not null references categories(id) on delete cascade,
  month date not null, -- first of month, e.g. '2026-01-01'
  name text not null,
  transaction_date date not null,
  amount numeric(10,2) not null,
  is_recurring boolean not null default false,
  recurring_template_id uuid,
  created_at timestamptz not null default now()
);

-- Recurring templates
create table recurring_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  amount numeric(10,2) not null,
  day_of_month int,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_transactions_user_month on transactions(user_id, month);
create index idx_transactions_category on transactions(category_id);
create index idx_categories_user on categories(user_id);
create index idx_recurring_user on recurring_templates(user_id);

-- Row Level Security
alter table categories enable row level security;
alter table transactions enable row level security;
alter table recurring_templates enable row level security;

-- RLS Policies: users can only access their own data
create policy "Users can view own categories"
  on categories for select using (auth.uid() = user_id);
create policy "Users can insert own categories"
  on categories for insert with check (auth.uid() = user_id);
create policy "Users can update own categories"
  on categories for update using (auth.uid() = user_id);
create policy "Users can delete own categories"
  on categories for delete using (auth.uid() = user_id);

create policy "Users can view own transactions"
  on transactions for select using (auth.uid() = user_id);
create policy "Users can insert own transactions"
  on transactions for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions"
  on transactions for update using (auth.uid() = user_id);
create policy "Users can delete own transactions"
  on transactions for delete using (auth.uid() = user_id);

create policy "Users can view own templates"
  on recurring_templates for select using (auth.uid() = user_id);
create policy "Users can insert own templates"
  on recurring_templates for insert with check (auth.uid() = user_id);
create policy "Users can update own templates"
  on recurring_templates for update using (auth.uid() = user_id);
create policy "Users can delete own templates"
  on recurring_templates for delete using (auth.uid() = user_id);
