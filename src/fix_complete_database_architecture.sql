-- =========================================================================
-- NearGO Complete Database Architecture, Relational Integrity & Triggers
-- Run this complete script in Supabase SQL Editor.
-- =========================================================================

-- 1. Ensure extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. Profiles Table: update constraints and role definitions
-- Roles: 'customer', 'shopkeeper_permanent', 'shopkeeper_temporary', 'admin'
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text default 'customer',
  username text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Role check constraint
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('customer', 'shopkeeper_permanent', 'shopkeeper_temporary', 'seller', 'shopkeeper', 'admin'));

-- Enable RLS on profiles
alter table public.profiles enable row level security;
drop policy if exists "Allow public read on profiles" on public.profiles;
create policy "Allow public read on profiles" on public.profiles for select using (true);
drop policy if exists "Allow users update own profile" on public.profiles;
create policy "Allow users update own profile" on public.profiles for update using (auth.uid() = id);
drop policy if exists "Allow users insert own profile" on public.profiles;
create policy "Allow users insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- 3. Ensure a valid demo merchant exists in auth.users and profiles
-- (This ensures the 50 seed shops are foreign-keyed to a valid profile on delete cascade)
do $$
declare
  demo_uuid uuid := '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90';
begin
  if not exists (select 1 from auth.users where id = demo_uuid) then
    insert into auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) values (
      demo_uuid,
      '00000000-0000-00-00-00-00-000000000000',
      'authenticated',
      'authenticated',
      'demo_merchant@neargo.com',
      crypt('demo12345', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Mandsaur Demo Merchant"}',
      now(),
      now()
    );
  end if;

  if not exists (select 1 from public.profiles where id = demo_uuid) then
    insert into public.profiles (id, email, full_name, role, username)
    values (demo_uuid, 'demo_merchant@neargo.com', 'Mandsaur Demo Merchant', 'shopkeeper_permanent', 'mandsaur_demo');
  else
    update public.profiles set role = 'shopkeeper_permanent' where id = demo_uuid;
  end if;
exception when others then
  null;
end $$;

-- 4. Shops Table: Ensure columns exist
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  shop_name text not null,
  category text,
  shop_type text default 'permanent',
  sub_type text,
  address text,
  landmark text,
  city text default 'Mandsaur',
  pincode text default '458001',
  latitude double precision,
  longitude double precision,
  shop_image text,
  temporary_duration text,
  description text,
  opening_time text,
  closing_time text,
  current_area text,
  is_live boolean default true,
  location_updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Enable RLS on shops
alter table public.shops enable row level security;
drop policy if exists "Allow public read on shops" on public.shops;
create policy "Allow public read on shops" on public.shops for select using (true);
drop policy if exists "Allow owners manage own shops" on public.shops;
create policy "Allow owners manage own shops" on public.shops for all using (auth.uid() = owner_id);

-- 5. Products Table: Ensure columns exist
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  title text not null,
  description text,
  price numeric not null,
  category text,
  stock integer default 0,
  image_url text,
  status text default 'active' check (status in ('active', 'draft')),
  last_updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Enable RLS on products
alter table public.products enable row level security;
drop policy if exists "Allow public read on products" on public.products;
create policy "Allow public read on products" on public.products for select using (true);
drop policy if exists "Allow owners manage own products" on public.products;
create policy "Allow owners manage own products" on public.products for all
  using (exists (select 1 from public.shops where shops.id = products.shop_id and shops.owner_id = auth.uid()));

-- 6. Orders Table (Reservations): Ensure columns exist
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null,
  shop_id uuid not null,
  total_amount numeric default 0,
  status text default 'Pending',
  delivery_address text,
  pickup_code text,
  customer_latitude double precision,
  customer_longitude double precision,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on orders
alter table public.orders enable row level security;
drop policy if exists "Allow customer read own orders" on public.orders;
create policy "Allow customer read own orders" on public.orders for select using (auth.uid() = customer_id);
drop policy if exists "Allow customer create orders" on public.orders;
create policy "Allow customer create orders" on public.orders for insert with check (auth.uid() = customer_id);
drop policy if exists "Allow seller read shop orders" on public.orders;
create policy "Allow seller read shop orders" on public.orders for select
  using (exists (select 1 from public.shops where shops.id = orders.shop_id and shops.owner_id = auth.uid()));
drop policy if exists "Allow seller update shop orders" on public.orders;
create policy "Allow seller update shop orders" on public.orders for update
  using (exists (select 1 from public.shops where shops.id = orders.shop_id and shops.owner_id = auth.uid()));

-- 7. Order Items Table
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  product_id uuid not null,
  quantity integer default 1,
  price numeric not null
);

-- Enable RLS on order_items
alter table public.order_items enable row level security;
drop policy if exists "Allow users read related order items" on public.order_items;
create policy "Allow users read related order items" on public.order_items for select using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.customer_id = auth.uid() or exists (select 1 from public.shops s where s.id = o.shop_id and s.owner_id = auth.uid()))
  )
);
drop policy if exists "Allow customer insert order items" on public.order_items;
create policy "Allow customer insert order items" on public.order_items for insert with check (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.customer_id = auth.uid()
  )
);

-- 8. Shop Reviews Table
create table if not exists public.shop_reviews (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null,
  customer_id uuid not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on shop_reviews
alter table public.shop_reviews enable row level security;
drop policy if exists "Allow public read on shop_reviews" on public.shop_reviews;
create policy "Allow public read on shop_reviews" on public.shop_reviews for select using (true);
drop policy if exists "Allow authenticated customer insert review" on public.shop_reviews;
create policy "Allow authenticated customer insert review" on public.shop_reviews
  for insert with check (auth.uid() = customer_id);
drop policy if exists "Allow customer update own review" on public.shop_reviews;
create policy "Allow customer update own review" on public.shop_reviews
  for update using (auth.uid() = customer_id);
drop policy if exists "Allow customer delete own review" on public.shop_reviews;
create policy "Allow customer delete own review" on public.shop_reviews
  for delete using (auth.uid() = customer_id);

-- =========================================================================
-- 9. CLEAN UP ORPHANED RECORDS TO ENSURE FOREIGN KEYS NEVER FAIL
-- =========================================================================
delete from public.order_items where product_id in (select id from public.products where shop_id in (select id from public.shops where owner_id not in (select id from public.profiles)));
delete from public.products where shop_id in (select id from public.shops where owner_id not in (select id from public.profiles));
delete from public.shops where owner_id not in (select id from public.profiles);
delete from public.products where shop_id not in (select id from public.shops);
delete from public.order_items where order_id in (select id from public.orders where customer_id not in (select id from public.profiles) or shop_id not in (select id from public.shops));
delete from public.orders where customer_id not in (select id from public.profiles) or shop_id not in (select id from public.shops);
delete from public.shop_reviews where shop_id not in (select id from public.shops) or customer_id not in (select id from public.profiles);

-- =========================================================================
-- 10. ESTABLISH FORMAL FOREIGN KEY CONSTRAINTS (Connects lines in Supabase ER diagram)
-- =========================================================================

-- shops.owner_id -> profiles.id
alter table public.shops drop constraint if exists fk_shops_owner;
alter table public.shops drop constraint if exists shops_owner_id_fkey;
alter table public.shops
  add constraint fk_shops_owner
  foreign key (owner_id) references public.profiles(id) on delete cascade;

-- products.shop_id -> shops.id
alter table public.products drop constraint if exists fk_products_shop;
alter table public.products drop constraint if exists products_shop_id_fkey;
alter table public.products
  add constraint fk_products_shop
  foreign key (shop_id) references public.shops(id) on delete cascade;

-- orders.customer_id -> profiles.id
alter table public.orders drop constraint if exists fk_orders_customer;
alter table public.orders drop constraint if exists orders_customer_id_fkey;
alter table public.orders
  add constraint fk_orders_customer
  foreign key (customer_id) references public.profiles(id) on delete cascade;

-- orders.shop_id -> shops.id
alter table public.orders drop constraint if exists fk_orders_shop;
alter table public.orders drop constraint if exists orders_shop_id_fkey;
alter table public.orders
  add constraint fk_orders_shop
  foreign key (shop_id) references public.shops(id) on delete cascade;

-- order_items.order_id -> orders.id
alter table public.order_items drop constraint if exists fk_order_items_order;
alter table public.order_items drop constraint if exists order_items_order_id_fkey;
alter table public.order_items
  add constraint fk_order_items_order
  foreign key (order_id) references public.orders(id) on delete cascade;

-- order_items.product_id -> products.id
alter table public.order_items drop constraint if exists fk_order_items_product;
alter table public.order_items drop constraint if exists order_items_product_id_fkey;
alter table public.order_items
  add constraint fk_order_items_product
  foreign key (product_id) references public.products(id) on delete cascade;

-- shop_reviews.shop_id -> shops.id
alter table public.shop_reviews drop constraint if exists fk_shop_reviews_shop;
alter table public.shop_reviews drop constraint if exists shop_reviews_shop_id_fkey;
alter table public.shop_reviews
  add constraint fk_shop_reviews_shop
  foreign key (shop_id) references public.shops(id) on delete cascade;

-- shop_reviews.customer_id -> profiles.id
alter table public.shop_reviews drop constraint if exists fk_shop_reviews_customer;
alter table public.shop_reviews drop constraint if exists shop_reviews_customer_id_fkey;
alter table public.shop_reviews
  add constraint fk_shop_reviews_customer
  foreign key (customer_id) references public.profiles(id) on delete cascade;

-- =========================================================================
-- 11. TRIGGER: DELETING PROFILE AUTOMATICALLY REMOVES USER FROM AUTH.USERS
-- (Ensures deleted profiles can NEVER log in again)
-- =========================================================================
create or replace function public.on_profile_deleted_delete_auth_user()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Deleting from auth.users permanently prevents future login
  delete from auth.users where id = OLD.id;
  return OLD;
end;
$$;

drop trigger if exists tr_on_profile_deleted on public.profiles;
create trigger tr_on_profile_deleted
after delete on public.profiles
for each row
execute function public.on_profile_deleted_delete_auth_user();

-- =========================================================================
-- 12. TRIGGER: AUTO CREATE SHOP WHEN SELLER PROFILE IS REGISTERED
-- (When user signs up as shopkeeper, their shop is created automatically)
-- =========================================================================
create or replace function public.auto_create_shop_for_seller()
returns trigger
language plpgsql
security definer
as $$
begin
  if NEW.role in ('shopkeeper_permanent', 'shopkeeper_temporary', 'seller', 'shopkeeper') then
    if not exists (select 1 from public.shops where owner_id = NEW.id) then
      insert into public.shops (
        owner_id,
        shop_name,
        category,
        shop_type,
        address,
        city,
        pincode,
        is_live,
        latitude,
        longitude
      ) values (
        NEW.id,
        coalesce(nullif(NEW.full_name, ''), 'My Store') || ' Shop',
        'General Store',
        case when NEW.role = 'shopkeeper_temporary' then 'temporary' else 'permanent' end,
        'Mandsaur',
        'Mandsaur',
        '458001',
        true,
        24.0722,
        75.0683
      );
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists tr_auto_create_shop_for_seller on public.profiles;
create trigger tr_auto_create_shop_for_seller
after insert or update of role on public.profiles
for each row
execute function public.auto_create_shop_for_seller();

-- =========================================================================
-- 13. STOCK FRESHNESS: AUTO-DRAFT (5 DAYS) AND AUTO-DELETE (10 DAYS)
-- =========================================================================
create or replace function public.process_stock_freshness()
returns void
language plpgsql
security definer
as $$
begin
  -- 1. If stock unconfirmed for 5+ days, convert to draft (hidden from customer discovery)
  update public.products
  set status = 'draft'
  where (status is null or status = 'active')
    and coalesce(last_updated_at, created_at) < now() - interval '5 days';

  -- 2. If stock unconfirmed for 10+ days, permanently delete from database
  delete from public.products
  where coalesce(last_updated_at, created_at) < now() - interval '10 days';
end;
$$;

-- Try scheduling with pg_cron if active
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('daily-stock-freshness');
    perform cron.schedule('daily-stock-freshness', '0 3 * * *', 'select public.process_stock_freshness();');
  end if;
exception when others then
  null;
end $$;

-- =========================================================================
-- 14. REAL-TIME REPLICATION ENABLEMENT (Amazon / Meesho style live updates)
-- =========================================================================
do $$
begin
  alter publication supabase_realtime add table public.shops;
exception when others then null; end $$;

do $$
begin
  alter publication supabase_realtime add table public.products;
exception when others then null; end $$;

do $$
begin
  alter publication supabase_realtime add table public.orders;
exception when others then null; end $$;

do $$
begin
  alter publication supabase_realtime add table public.order_items;
exception when others then null; end $$;

do $$
begin
  alter publication supabase_realtime add table public.shop_reviews;
exception when others then null; end $$;

-- =========================================================================
-- 15. NEARBY SEARCH RPC FUNCTIONS (With live fresh products and rating)
-- =========================================================================
create or replace function public.nearby_products(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision default 2.0,
  search_text text default null
)
returns table (
  id uuid,
  title text,
  description text,
  price numeric,
  category text,
  stock integer,
  image_url text,
  shop_id uuid,
  shop_name text,
  shop_type text,
  shop_address text,
  current_area text,
  distance_km double precision,
  avg_rating numeric,
  reviews_count bigint,
  last_updated_at timestamptz,
  status text
)
language plpgsql
security definer
as $$
begin
  -- Run stock freshness check on execution to keep inventory always up-to-date
  perform public.process_stock_freshness();

  return query
  select
    p.id,
    p.title,
    p.description,
    p.price,
    p.category,
    p.stock,
    p.image_url,
    s.id as shop_id,
    s.shop_name,
    s.shop_type,
    s.address as shop_address,
    s.current_area,
    round(
      (6371 * acos(
        least(1.0, greatest(-1.0,
          cos(radians(user_lat)) * cos(radians(coalesce(s.latitude, user_lat))) *
          cos(radians(coalesce(s.longitude, user_lng)) - radians(user_lng)) +
          sin(radians(user_lat)) * sin(radians(coalesce(s.latitude, user_lat)))
        ))
      ))::numeric, 2
    )::double precision as distance_km,
    coalesce(round(avg(r.rating)::numeric, 1), 4.5) as avg_rating,
    count(r.id) as reviews_count,
    p.last_updated_at,
    p.status
  from public.products p
  join public.shops s on p.shop_id = s.id
  left join public.shop_reviews r on r.shop_id = s.id
  where
    s.latitude is not null
    and s.longitude is not null
    and (p.status is null or p.status = 'active')
    and (6371 * acos(
      least(1.0, greatest(-1.0,
        cos(radians(user_lat)) * cos(radians(s.latitude)) *
        cos(radians(s.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(s.latitude))
      ))
    )) <= radius_km
    and (
      search_text is null 
      or search_text = ''
      or p.title ilike '%' || search_text || '%'
      or p.category ilike '%' || search_text || '%'
      or s.shop_name ilike '%' || search_text || '%'
      or s.current_area ilike '%' || search_text || '%'
    )
  group by p.id, s.id
  order by distance_km asc, p.created_at desc;
end;
$$;

create or replace function public.nearby_shops(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision default 10.0
)
returns table (
  id uuid,
  owner_id uuid,
  shop_name text,
  category text,
  shop_type text,
  address text,
  landmark text,
  city text,
  pincode text,
  latitude double precision,
  longitude double precision,
  shop_image text,
  current_area text,
  is_live boolean,
  distance_km double precision,
  avg_rating numeric,
  reviews_count bigint
)
language sql
stable
as $$
  select
    s.id,
    s.owner_id,
    s.shop_name,
    s.category,
    s.shop_type,
    s.address,
    s.landmark,
    s.city,
    s.pincode,
    s.latitude,
    s.longitude,
    s.shop_image,
    s.current_area,
    s.is_live,
    round(
      (6371 * acos(
        least(1.0, greatest(-1.0,
          cos(radians(user_lat)) * cos(radians(coalesce(s.latitude, user_lat))) *
          cos(radians(coalesce(s.longitude, user_lng)) - radians(user_lng)) +
          sin(radians(user_lat)) * sin(radians(coalesce(s.latitude, user_lat)))
        ))
      ))::numeric, 2
    )::double precision as distance_km,
    coalesce(round(avg(r.rating)::numeric, 1), 4.6) as avg_rating,
    count(r.id) as reviews_count
  from public.shops s
  left join public.shop_reviews r on r.shop_id = s.id
  where
    s.latitude is not null
    and s.longitude is not null
    and (6371 * acos(
      least(1.0, greatest(-1.0,
        cos(radians(user_lat)) * cos(radians(s.latitude)) *
        cos(radians(s.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(s.latitude))
      ))
    )) <= radius_km
  group by s.id
  order by distance_km asc;
$$;

-- =========================================================================
-- 16. DEDICATED SECTION VIEWS (Distinct visible tables/sections in Supabase)
-- =========================================================================

-- View: Customers section
create or replace view public.customers as
select
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.username,
  p.avatar_url,
  p.created_at
from public.profiles p
where p.role = 'customer';

-- View: Permanent Shopkeepers section
create or replace view public.shopkeepers_permanent as
select
  p.id as profile_id,
  p.email,
  p.full_name,
  p.phone,
  s.id as shop_id,
  s.shop_name,
  s.category,
  s.address,
  s.city,
  s.opening_time,
  s.closing_time,
  s.is_live,
  p.created_at
from public.profiles p
left join public.shops s on s.owner_id = p.id
where p.role in ('shopkeeper_permanent', 'seller', 'shopkeeper');

-- View: Temporary Vendors section
create or replace view public.shopkeepers_temporary as
select
  p.id as profile_id,
  p.email,
  p.full_name,
  p.phone,
  s.id as shop_id,
  s.shop_name,
  s.category,
  s.sub_type,
  s.current_area,
  s.temporary_duration,
  s.is_live,
  s.location_updated_at,
  p.created_at
from public.profiles p
left join public.shops s on s.owner_id = p.id
where p.role = 'shopkeeper_temporary';

-- View: Inventory section (Per-shop stock & products)
create or replace view public.inventory as
select
  p.id as product_id,
  s.id as shop_id,
  s.shop_name,
  p.title as product_name,
  p.category,
  p.price,
  p.stock,
  p.status,
  p.last_updated_at,
  p.created_at
from public.products p
join public.shops s on s.id = p.shop_id;


