-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users profile table (extends Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  phone text,
  savings_total numeric(10, 2) default 0,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz default now()
);

-- Retailers
create table public.retailers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  domain text not null unique,
  checkout_url_patterns text[] not null default '{}',
  cart_total_selectors text[] not null default '{}',
  gift_card_input_selector text,
  gift_card_pin_selector text,
  apply_button_selector text,
  add_another_selector text,
  max_gift_cards_per_order int,
  available_denominations int[] not null default '{}',
  per_user_daily_limit_usd numeric(10, 2) not null default 200,
  stacking_notes text,
  is_active boolean not null default false,
  logo_url text,
  updated_at timestamptz default now()
);

-- Transactions
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  retailer_id uuid not null references public.retailers(id),
  cards_purchased jsonb not null default '[]',
  total_paid numeric(10, 2) not null,
  total_value numeric(10, 2) not null,
  savings numeric(10, 2) not null,
  residual_balance numeric(10, 2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  payment_processor_id text,
  demo boolean not null default false,
  created_at timestamptz default now()
);

-- Stashly balances
create table public.stashly_balances (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  retailer_id uuid not null references public.retailers(id),
  balance numeric(10, 2) not null default 0,
  updated_at timestamptz default now(),
  unique (user_id, retailer_id)
);

-- Payment methods
create table public.payment_methods (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  processor_token text not null,
  last_four text not null,
  brand text not null,
  is_default boolean not null default false,
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.retailers enable row level security;
alter table public.transactions enable row level security;
alter table public.stashly_balances enable row level security;
alter table public.payment_methods enable row level security;

-- Profiles: users can read/update own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Retailers: all authenticated users can read active retailers
create policy "Anyone can view active retailers"
  on public.retailers for select
  using (is_active = true);

create policy "Admins can manage retailers"
  on public.retailers for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Transactions: users can read own transactions
create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

-- Stashly balances: users can read own balances
create policy "Users can view own balances"
  on public.stashly_balances for select
  using (auth.uid() = user_id);

-- Payment methods: users can manage own payment methods
create policy "Users can manage own payment methods"
  on public.payment_methods for all
  using (auth.uid() = user_id);

-- Indexes
create index idx_transactions_user_id on public.transactions(user_id);
create index idx_transactions_created_at on public.transactions(created_at desc);
create index idx_stashly_balances_user_retailer on public.stashly_balances(user_id, retailer_id);
create index idx_retailers_domain on public.retailers(domain);

-- Function: auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seed data: MVP retailers
insert into public.retailers (name, domain, checkout_url_patterns, available_denominations, per_user_daily_limit_usd, is_active) values
  ('Apple', 'apple.com', '{"/shop/checkout","/store/checkout"}', '{25,50,100}', 500, true),
  ('Chipotle', 'chipotle.com', '{"/order/checkout","/checkout"}', '{10,25,50}', 200, true),
  ('Dominos', 'dominos.com', '{"/pages/order/checkout"}', '{10,20,25,50}', 200, true),
  ('Riot Games', 'riotgames.com', '{"/en/checkout","/checkout"}', '{10,25,50}', 200, true),
  ('eBay', 'ebay.com', '{"/pay/"}', '{25,50,100}', 500, true),
  ('New Era', 'neweracap.com', '{"/checkout"}', '{25,50}', 200, true),
  ('NFL Shop', 'nflshop.com', '{"/checkout"}', '{25,50,100}', 300, true),
  ('Jersey Mikes', 'jerseymikes.com', '{"/checkout"}', '{10,25,50,100}', 200, true),
  ('Off Season', 'offseason.com', '{"/checkout"}', '{25,50,100}', 500, true),
  ('Fanatics', 'fanatics.com', '{"/checkout"}', '{25,50}', 200, true);
