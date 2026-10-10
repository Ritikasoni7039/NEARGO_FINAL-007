-- =========================================================================
-- NearGO Realistic Mandsaur Dataset & Phase 2 Schema Upgrades
-- Run this complete script in Supabase SQL Editor.
-- =========================================================================

-- 1. Create shop_reviews table if it doesn't exist
create table if not exists public.shop_reviews (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on shop_reviews
alter table public.shop_reviews enable row level security;

-- Policies for shop_reviews
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

-- 2. Add stock freshness columns to products table if missing
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name = 'last_updated_at') then
    alter table public.products add column last_updated_at timestamptz default now();
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name = 'status') then
    alter table public.products add column status text default 'active' check (status in ('active', 'draft'));
  end if;
end $$;

-- 3. Stock Freshness Cron / Stored Procedure
create or replace function public.process_stock_freshness()
returns void
language plpgsql
as $$
begin
  -- Mark products unconfirmed for 5+ days as draft (hidden from discovery)
  update public.products
  set status = 'draft'
  where status = 'active'
    and coalesce(last_updated_at, created_at) < now() - interval '5 days';

  -- Automatically delete products unconfirmed for 10+ days
  delete from public.products
  where coalesce(last_updated_at, created_at) < now() - interval '10 days';
end;
$$;

-- Try scheduling via pg_cron if extension exists
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('daily-stock-freshness');
    perform cron.schedule('daily-stock-freshness', '0 3 * * *', 'select public.process_stock_freshness();');
  end if;
exception when others then
  raise notice 'pg_cron extension not active or permission restricted; function process_stock_freshness can be invoked via webhooks/cron';
end $$;

-- 4. Delete old CSV demo products and demo shops (PRESERVING real authenticated user shops)
-- We identify demo shops as those whose owner_id is either '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90' or not in profiles
delete from public.order_items where product_id in (select id from public.products where shop_id in (select id from public.shops where owner_id = '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90' or owner_id not in (select id from auth.users)));
delete from public.products where shop_id in (select id from public.shops where owner_id = '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90' or owner_id not in (select id from auth.users));
delete from public.shops where owner_id = '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90' or owner_id not in (select id from auth.users);

-- Ensure a demo owner profile exists for foreign key references
do $$
declare
  demo_uuid uuid := '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90';
begin
  if not exists (select 1 from public.profiles where id = demo_uuid) then
    insert into public.profiles (id, full_name, role, username)
    values (demo_uuid, 'Mandsaur Merchant Partner', 'seller', 'mandsaur_demo_merchant');
  end if;
exception when others then
  -- Ignore if profiles has strict auth.users fk
  null;
end $$;

-- 5. Insert 50 Realistic Mandsaur Shops and Products

-- Shop 1: MDS Super Kirana (Gandhi Chowk)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a0100000-0000-0000-0000-000000000001', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'MDS Super Kirana', 'Grocery & Daily Essentials', 'permanent',
  'Gandhi Chowk, Mandsaur', 'Near Gandhi Chauraha', 'Mandsaur', '458001',
  24.0672, 75.0701, 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80', 'MDS Super Kirana in Gandhi Chowk, Mandsaur. Serving verified Grocery & Daily Essentials with timely local delivery and counter pickup.',
  '07:30', '21:30', 'Gandhi Chowk', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0100000-0000-0000-0000-000000000001', 'a0100000-0000-0000-0000-000000000001', 'Basmati Rice 5 kg', 'Long-grain fragrant rice',
  330, 'Grocery & Daily Essentials', 45, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0100000-0000-0000-0000-000000000002', 'a0100000-0000-0000-0000-000000000001', 'Toor Dal 1 kg', 'Clean polished premium pulses',
  145, 'Grocery & Daily Essentials', 35, 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0100000-0000-0000-0000-000000000003', 'a0100000-0000-0000-0000-000000000001', 'Aashirvaad Shudh Chakki Atta 5 kg', '100% whole wheat flour',
  235, 'Grocery & Daily Essentials', 50, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0100000-0000-0000-0000-000000000004', 'a0100000-0000-0000-0000-000000000001', 'Fortune Sunflower Oil 1 L', 'Refined heart-healthy cooking oil',
  138, 'Grocery & Daily Essentials', 40, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0100000-0000-0000-0000-000000000005', 'a0100000-0000-0000-0000-000000000001', 'Tata Salt 1 kg', 'Vacuum evaporated iodized salt',
  18, 'Grocery & Daily Essentials', 80, 'https://images.unsplash.com/photo-1518110903419-548c7c9c0b11?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0100000-0000-0000-0000-000000000006', 'a0100000-0000-0000-0000-000000000001', 'Red Label Tea 500 g', 'Brooke Bond strong blended tea',
  250, 'Grocery & Daily Essentials', 30, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0100000-0000-0000-0000-000000000007', 'a0100000-0000-0000-0000-000000000001', 'Madhur Pure Sugar 1 kg', 'Refined sulfur-free crystals',
  42, 'Grocery & Daily Essentials', 65, 'https://images.unsplash.com/photo-1622484214149-14a9058b8d0e?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0100000-0000-0000-0000-000000000008', 'a0100000-0000-0000-0000-000000000001', 'Surf Excel Easy Wash 1 kg', 'Advanced stain removal detergent',
  130, 'Grocery & Daily Essentials', 25, 'https://images.unsplash.com/photo-1585670270608-b4be4fbcf05d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 2: Shree Balaji Provision Store (Dhan Mandi)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a0200000-0000-0000-0000-000000000002', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Shree Balaji Provision Store', 'Grocery & Daily Essentials', 'permanent',
  'Dhan Mandi, Mandsaur', 'Old Mandi Road', 'Mandsaur', '458001',
  24.0664, 75.0718, 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80', 'Shree Balaji Provision Store in Dhan Mandi, Mandsaur. Serving verified Grocery & Daily Essentials with timely local delivery and counter pickup.',
  '08:00', '21:00', 'Dhan Mandi', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0200000-0000-0000-0000-000000000001', 'a0200000-0000-0000-0000-000000000002', 'Basmati Rice 5 kg', 'Long-grain fragrant rice',
  335, 'Grocery & Daily Essentials', 45, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0200000-0000-0000-0000-000000000002', 'a0200000-0000-0000-0000-000000000002', 'Toor Dal 1 kg', 'Clean polished premium pulses',
  150, 'Grocery & Daily Essentials', 35, 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0200000-0000-0000-0000-000000000003', 'a0200000-0000-0000-0000-000000000002', 'Aashirvaad Shudh Chakki Atta 5 kg', '100% whole wheat flour',
  240, 'Grocery & Daily Essentials', 50, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0200000-0000-0000-0000-000000000004', 'a0200000-0000-0000-0000-000000000002', 'Fortune Sunflower Oil 1 L', 'Refined heart-healthy cooking oil',
  143, 'Grocery & Daily Essentials', 40, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0200000-0000-0000-0000-000000000005', 'a0200000-0000-0000-0000-000000000002', 'Tata Salt 1 kg', 'Vacuum evaporated iodized salt',
  23, 'Grocery & Daily Essentials', 80, 'https://images.unsplash.com/photo-1518110903419-548c7c9c0b11?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0200000-0000-0000-0000-000000000006', 'a0200000-0000-0000-0000-000000000002', 'Red Label Tea 500 g', 'Brooke Bond strong blended tea',
  255, 'Grocery & Daily Essentials', 30, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0200000-0000-0000-0000-000000000007', 'a0200000-0000-0000-0000-000000000002', 'Madhur Pure Sugar 1 kg', 'Refined sulfur-free crystals',
  47, 'Grocery & Daily Essentials', 65, 'https://images.unsplash.com/photo-1622484214149-14a9058b8d0e?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0200000-0000-0000-0000-000000000008', 'a0200000-0000-0000-0000-000000000002', 'Surf Excel Easy Wash 1 kg', 'Advanced stain removal detergent',
  135, 'Grocery & Daily Essentials', 25, 'https://images.unsplash.com/photo-1585670270608-b4be4fbcf05d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 3: Kisan Sabzi Mandi Stalls (Sarafa Bazaar)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a0300000-0000-0000-0000-000000000003', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Kisan Sabzi Mandi Stalls', 'Fresh Fruits & Vegetables', 'temporary',
  'Sarafa Bazaar, Mandsaur', 'Vegetable Alley', 'Mandsaur', '458001',
  24.0625, 75.0712, 'https://images.unsplash.com/photo-1543083477-4f785aeafaa9?w=800&auto=format&fit=crop&q=80', 'Kisan Sabzi Mandi Stalls in Sarafa Bazaar, Mandsaur. Serving verified Fresh Fruits & Vegetables with timely local delivery and counter pickup.',
  '06:00', '13:00', 'Sarafa Bazaar', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0300000-0000-0000-0000-000000000001', 'a0300000-0000-0000-0000-000000000003', 'Fresh Red Tomatoes 1 kg', 'Farm fresh juicy salad tomatoes',
  35, 'Fresh Fruits & Vegetables', 60, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0300000-0000-0000-0000-000000000002', 'a0300000-0000-0000-0000-000000000003', 'Desi Onions 1 kg', 'Fresh harvest pungent onions',
  30, 'Fresh Fruits & Vegetables', 75, 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0300000-0000-0000-0000-000000000003', 'a0300000-0000-0000-0000-000000000003', 'Pahadi Potatoes 1 kg', 'Clean starchy fresh potatoes',
  25, 'Fresh Fruits & Vegetables', 90, 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0300000-0000-0000-0000-000000000004', 'a0300000-0000-0000-0000-000000000003', 'Shimla Green Apples 1 kg', 'Crisp and sweet fresh apples',
  160, 'Fresh Fruits & Vegetables', 30, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0300000-0000-0000-0000-000000000005', 'a0300000-0000-0000-0000-000000000003', 'Robusta Bananas 1 Dozen', 'Naturally ripened sweet bananas',
  50, 'Fresh Fruits & Vegetables', 40, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0300000-0000-0000-0000-000000000006', 'a0300000-0000-0000-0000-000000000003', 'Spicy Green Chilies 250 g', 'Fresh pungent cooking chilies',
  20, 'Fresh Fruits & Vegetables', 50, 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0300000-0000-0000-0000-000000000007', 'a0300000-0000-0000-0000-000000000003', 'Fresh Ginger 250 g', 'Aromatic pungent desi adrak',
  30, 'Fresh Fruits & Vegetables', 35, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 4: Jain Brothers Grocery (Jankupura)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a0400000-0000-0000-0000-000000000004', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Jain Brothers Grocery', 'Grocery & Daily Essentials', 'permanent',
  'Jankupura, Mandsaur', 'Jankupura Main Gate', 'Mandsaur', '458001',
  24.0649, 75.0731, 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=800&auto=format&fit=crop&q=80', 'Jain Brothers Grocery in Jankupura, Mandsaur. Serving verified Grocery & Daily Essentials with timely local delivery and counter pickup.',
  '08:00', '21:00', 'Jankupura', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0400000-0000-0000-0000-000000000001', 'a0400000-0000-0000-0000-000000000004', 'Basmati Rice 5 kg', 'Long-grain fragrant rice',
  345, 'Grocery & Daily Essentials', 45, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0400000-0000-0000-0000-000000000002', 'a0400000-0000-0000-0000-000000000004', 'Toor Dal 1 kg', 'Clean polished premium pulses',
  160, 'Grocery & Daily Essentials', 35, 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0400000-0000-0000-0000-000000000003', 'a0400000-0000-0000-0000-000000000004', 'Aashirvaad Shudh Chakki Atta 5 kg', '100% whole wheat flour',
  250, 'Grocery & Daily Essentials', 50, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0400000-0000-0000-0000-000000000004', 'a0400000-0000-0000-0000-000000000004', 'Fortune Sunflower Oil 1 L', 'Refined heart-healthy cooking oil',
  153, 'Grocery & Daily Essentials', 40, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0400000-0000-0000-0000-000000000005', 'a0400000-0000-0000-0000-000000000004', 'Tata Salt 1 kg', 'Vacuum evaporated iodized salt',
  33, 'Grocery & Daily Essentials', 80, 'https://images.unsplash.com/photo-1518110903419-548c7c9c0b11?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0400000-0000-0000-0000-000000000006', 'a0400000-0000-0000-0000-000000000004', 'Red Label Tea 500 g', 'Brooke Bond strong blended tea',
  265, 'Grocery & Daily Essentials', 30, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0400000-0000-0000-0000-000000000007', 'a0400000-0000-0000-0000-000000000004', 'Madhur Pure Sugar 1 kg', 'Refined sulfur-free crystals',
  57, 'Grocery & Daily Essentials', 65, 'https://images.unsplash.com/photo-1622484214149-14a9058b8d0e?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0400000-0000-0000-0000-000000000008', 'a0400000-0000-0000-0000-000000000004', 'Surf Excel Easy Wash 1 kg', 'Advanced stain removal detergent',
  145, 'Grocery & Daily Essentials', 25, 'https://images.unsplash.com/photo-1585670270608-b4be4fbcf05d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 5: Navneet Pustak & Stationers (Kalakhet)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a0500000-0000-0000-0000-000000000005', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Navneet Pustak & Stationers', 'Stationery & Study Essentials', 'permanent',
  'Kalakhet, Mandsaur', 'Near Jain Temple', 'Mandsaur', '458001',
  24.0735, 75.074, 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop&q=80', 'Navneet Pustak & Stationers in Kalakhet, Mandsaur. Serving verified Stationery & Study Essentials with timely local delivery and counter pickup.',
  '09:00', '21:00', 'Kalakhet', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0500000-0000-0000-0000-000000000001', 'a0500000-0000-0000-0000-000000000005', 'Classmate Spiral Notebook 300 Pages', 'Single line ruled notebook with divider',
  125, 'Stationery & Study Essentials', 60, 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0500000-0000-0000-0000-000000000002', 'a0500000-0000-0000-0000-000000000005', 'Reynolds 045 Ball Pens Pack of 10', 'Smooth smudge-free blue ballpoint pens',
  90, 'Stationery & Study Essentials', 70, 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0500000-0000-0000-0000-000000000003', 'a0500000-0000-0000-0000-000000000005', 'JK Copier A4 Paper 75 GSM 500 Sheets', 'Ultra-white high-speed photocopy ream',
  350, 'Stationery & Study Essentials', 30, 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0500000-0000-0000-0000-000000000004', 'a0500000-0000-0000-0000-000000000005', 'Camlin 12 Shades Acrylic Colours Set', 'Vibrant fast-drying hobby paints with brush',
  205, 'Stationery & Study Essentials', 25, 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0500000-0000-0000-0000-000000000005', 'a0500000-0000-0000-0000-000000000005', 'Casio Scientific Calculator FX-82MS', '240 functions 2-line display student calculator',
  590, 'Stationery & Study Essentials', 15, 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0500000-0000-0000-0000-000000000006', 'a0500000-0000-0000-0000-000000000005', 'Fevicol MR Squeezy Glue Bottle 200g', 'Strong craft adhesive for paper and wood',
  65, 'Stationery & Study Essentials', 45, 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 6: Bherulal Ji Namkeen & Poha (Tower Chowk)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a0600000-0000-0000-0000-000000000006', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Bherulal Ji Namkeen & Poha', 'Sweets, Bakery & Snacks', 'permanent',
  'Tower Chowk, Mandsaur', 'Opposite Clock Tower', 'Mandsaur', '458001',
  24.0689, 75.0687, 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?w=800&auto=format&fit=crop&q=80', 'Bherulal Ji Namkeen & Poha in Tower Chowk, Mandsaur. Serving verified Sweets, Bakery & Snacks with timely local delivery and counter pickup.',
  '06:30', '22:00', 'Tower Chowk', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0600000-0000-0000-0000-000000000001', 'a0600000-0000-0000-0000-000000000006', 'Famous Mandsaur Ratlami Sev 500g', 'Authentic spicy clove-infused gram flour sev',
  130, 'Sweets, Bakery & Snacks', 45, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0600000-0000-0000-0000-000000000002', 'a0600000-0000-0000-0000-000000000006', 'Shudh Mawa Peda 500g', 'Traditional milk fudge garnished with cardamom',
  230, 'Sweets, Bakery & Snacks', 20, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0600000-0000-0000-0000-000000000003', 'a0600000-0000-0000-0000-000000000006', 'Desi Ghee Kaju Katli 250g', 'Rich melt-in-mouth cashew diamond sweets',
  250, 'Sweets, Bakery & Snacks', 25, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0600000-0000-0000-0000-000000000004', 'a0600000-0000-0000-0000-000000000006', 'Crispy Maskachaska Khari 400g', 'Fresh baked flaky tea-time puff pastry',
  70, 'Sweets, Bakery & Snacks', 35, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0600000-0000-0000-0000-000000000005', 'a0600000-0000-0000-0000-000000000006', 'Eggless Belgian Chocolate Cake 500g', 'Fresh baked creamy dark chocolate celebration cake',
  370, 'Sweets, Bakery & Snacks', 10, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 7: Goyal Electricals & Lights (Tower Chowk)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a0700000-0000-0000-0000-000000000007', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Goyal Electricals & Lights', 'Home & Electrical Essentials', 'permanent',
  'Tower Chowk, Mandsaur', 'Near Municipal Council', 'Mandsaur', '458001',
  24.0693, 75.0698, 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80', 'Goyal Electricals & Lights in Tower Chowk, Mandsaur. Serving verified Home & Electrical Essentials with timely local delivery and counter pickup.',
  '09:30', '20:30', 'Tower Chowk', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0700000-0000-0000-0000-000000000001', 'a0700000-0000-0000-0000-000000000007', 'Philips 9W LED Bulb B22', 'Cool daylight energy saving bulb',
  80, 'Home & Electrical Essentials', 50, 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0700000-0000-0000-0000-000000000002', 'a0700000-0000-0000-0000-000000000007', 'Havells 4-Way Extension Board', 'Surge protected 2m cord strip',
  375, 'Home & Electrical Essentials', 20, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0700000-0000-0000-0000-000000000003', 'a0700000-0000-0000-0000-000000000007', 'Anchor Roma 1-Way Switch 6A', 'Modular white flame retardant switch',
  37, 'Home & Electrical Essentials', 100, 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0700000-0000-0000-0000-000000000004', 'a0700000-0000-0000-0000-000000000007', 'Syska Rechargeable Mosquito Swatter', 'Electric insect racket with LED',
  294, 'Home & Electrical Essentials', 25, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0700000-0000-0000-0000-000000000005', 'a0700000-0000-0000-0000-000000000007', 'Polycab 1.5 sq mm Wire 90m', 'FR PVC insulated copper wire coil',
  1445, 'Home & Electrical Essentials', 15, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0700000-0000-0000-0000-000000000006', 'a0700000-0000-0000-0000-000000000007', 'Crompton 1200mm Ceiling Fan', 'High-speed energy efficient fan',
  1845, 'Home & Electrical Essentials', 12, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 8: Station Road Fruit Corner (Station Road)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a0800000-0000-0000-0000-000000000008', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Station Road Fruit Corner', 'Fresh Fruits & Vegetables', 'temporary',
  'Station Road, Mandsaur', 'Outside Railway Reservation', 'Mandsaur', '458001',
  24.0715, 75.0665, 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=800&auto=format&fit=crop&q=80', 'Station Road Fruit Corner in Station Road, Mandsaur. Serving verified Fresh Fruits & Vegetables with timely local delivery and counter pickup.',
  '07:00', '21:30', 'Station Road', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0800000-0000-0000-0000-000000000001', 'a0800000-0000-0000-0000-000000000008', 'Fresh Red Tomatoes 1 kg', 'Farm fresh juicy salad tomatoes',
  35, 'Fresh Fruits & Vegetables', 60, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0800000-0000-0000-0000-000000000002', 'a0800000-0000-0000-0000-000000000008', 'Desi Onions 1 kg', 'Fresh harvest pungent onions',
  30, 'Fresh Fruits & Vegetables', 75, 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0800000-0000-0000-0000-000000000003', 'a0800000-0000-0000-0000-000000000008', 'Pahadi Potatoes 1 kg', 'Clean starchy fresh potatoes',
  25, 'Fresh Fruits & Vegetables', 90, 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0800000-0000-0000-0000-000000000004', 'a0800000-0000-0000-0000-000000000008', 'Shimla Green Apples 1 kg', 'Crisp and sweet fresh apples',
  160, 'Fresh Fruits & Vegetables', 30, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0800000-0000-0000-0000-000000000005', 'a0800000-0000-0000-0000-000000000008', 'Robusta Bananas 1 Dozen', 'Naturally ripened sweet bananas',
  50, 'Fresh Fruits & Vegetables', 40, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0800000-0000-0000-0000-000000000006', 'a0800000-0000-0000-0000-000000000008', 'Spicy Green Chilies 250 g', 'Fresh pungent cooking chilies',
  20, 'Fresh Fruits & Vegetables', 50, 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0800000-0000-0000-0000-000000000007', 'a0800000-0000-0000-0000-000000000008', 'Fresh Ginger 250 g', 'Aromatic pungent desi adrak',
  30, 'Fresh Fruits & Vegetables', 35, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 9: Mandsaur Hardware House (Station Road)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a0900000-0000-0000-0000-000000000009', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Mandsaur Hardware House', 'Hardware & Tools', 'permanent',
  'Station Road, Mandsaur', 'Railway Station Market', 'Mandsaur', '458001',
  24.0704, 75.0649, 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&auto=format&fit=crop&q=80', 'Mandsaur Hardware House in Station Road, Mandsaur. Serving verified Hardware & Tools with timely local delivery and counter pickup.',
  '09:00', '20:30', 'Station Road', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0900000-0000-0000-0000-000000000001', 'a0900000-0000-0000-0000-000000000009', 'Heavy Duty Claw Hammer 500g', 'Drop-forged steel with rubber grip',
  225, 'Hardware & Tools', 30, 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0900000-0000-0000-0000-000000000002', 'a0900000-0000-0000-0000-000000000009', 'Godrej Nav-Tal 7 Levers Brass Padlock', 'Hardened shackle high-security lock',
  415, 'Hardware & Tools', 24, 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0900000-0000-0000-0000-000000000003', 'a0900000-0000-0000-0000-000000000009', 'Stanley 5m Steel Measuring Tape', 'Polymer-coated corrosion resistant tape',
  165, 'Hardware & Tools', 40, 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0900000-0000-0000-0000-000000000004', 'a0900000-0000-0000-0000-000000000009', 'Stainless Steel Screws Assortment Box', '300-piece assorted drywall and wood screws',
  185, 'Hardware & Tools', 50, 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0900000-0000-0000-0000-000000000005', 'a0900000-0000-0000-0000-000000000009', 'Teflon Thread Seal Tape (Pack of 5)', 'Plumber tape for water leak prevention',
  80, 'Hardware & Tools', 70, 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b0900000-0000-0000-0000-000000000006', 'a0900000-0000-0000-0000-000000000009', 'Tap Spindle Brass Replacement 1/2 inch', 'Heavy ceramic disc tap valve core',
  115, 'Hardware & Tools', 35, 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 10: Sanjivani Medical & General (District Hospital Road)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a1000000-0000-0000-0000-000000000010', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Sanjivani Medical & General', 'Pharmacy & Wellness', 'permanent',
  'District Hospital Road, Mandsaur', 'Opposite Hospital Gate 1', 'Mandsaur', '458001',
  24.074, 75.072, 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=80', 'Sanjivani Medical & General in District Hospital Road, Mandsaur. Serving verified Pharmacy & Wellness with timely local delivery and counter pickup.',
  '24 Hours', '24 Hours', 'District Hospital Road', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000010', 'Dolo 650mg Paracetamol Tablets 15s', 'Fever and pain relief medication strip',
  42, 'Pharmacy & Wellness', 80, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000010', 'Dettol Antiseptic Liquid 250ml', 'Trusted disinfectant for cuts and hygiene',
  135, 'Pharmacy & Wellness', 40, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000010', 'Volini Joint & Muscle Pain Relief Spray 55g', 'Quick absorption micro-gel formulation',
  165, 'Pharmacy & Wellness', 30, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000010', 'Digene Acidity & Gas Relief Mint Gel 200ml', 'Fast cooling soothing antacid syrup',
  155, 'Pharmacy & Wellness', 25, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000010', 'Band-Aid Washproof Strips Box of 20', 'Sterile protective wound dressing band',
  70, 'Pharmacy & Wellness', 60, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 11: Mogra Flowers & Gift Center (Gandhi Chowk)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a1100000-0000-0000-0000-000000000011', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Mogra Flowers & Gift Center', 'Handmade Gifts & Flowers', 'permanent',
  'Gandhi Chowk, Mandsaur', 'Flower Market Lane', 'Mandsaur', '458001',
  24.0677, 75.0708, 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&auto=format&fit=crop&q=80', 'Mogra Flowers & Gift Center in Gandhi Chowk, Mandsaur. Serving verified Handmade Gifts & Flowers with timely local delivery and counter pickup.',
  '06:30', '21:30', 'Gandhi Chowk', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1100000-0000-0000-0000-000000000001', 'a1100000-0000-0000-0000-000000000011', 'Fresh Dutch Rose Bouquet (10 Stems)', 'Hand-tied premium red roses with ribbon',
  289, 'Handmade Gifts & Flowers', 15, 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1100000-0000-0000-0000-000000000002', 'a1100000-0000-0000-0000-000000000011', 'Mogra & Marigold Puja Garland Set', 'Fragrant fresh flowers for daily home temple',
  50, 'Handmade Gifts & Flowers', 30, 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1100000-0000-0000-0000-000000000003', 'a1100000-0000-0000-0000-000000000011', 'Handcrafted Terracotta Diya & Candle Stand', 'Artisanal clay home decor and festive lighting',
  170, 'Handmade Gifts & Flowers', 20, 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1100000-0000-0000-0000-000000000004', 'a1100000-0000-0000-0000-000000000011', 'Personalized Handmade Wooden Photo Frame', 'Rustic tabletop photo frame 5x7 inches',
  230, 'Handmade Gifts & Flowers', 15, 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 12: Sanwariya Sweets & Dairy (Nai Abadi)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a1200000-0000-0000-0000-000000000012', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Sanwariya Sweets & Dairy', 'Sweets, Bakery & Snacks', 'permanent',
  'Nai Abadi, Mandsaur', 'Near Water Tank', 'Mandsaur', '458001',
  24.0808, 75.0672, 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?w=800&auto=format&fit=crop&q=80', 'Sanwariya Sweets & Dairy in Nai Abadi, Mandsaur. Serving verified Sweets, Bakery & Snacks with timely local delivery and counter pickup.',
  '07:00', '22:00', 'Nai Abadi', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1200000-0000-0000-0000-000000000001', 'a1200000-0000-0000-0000-000000000012', 'Famous Mandsaur Ratlami Sev 500g', 'Authentic spicy clove-infused gram flour sev',
  135, 'Sweets, Bakery & Snacks', 45, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1200000-0000-0000-0000-000000000002', 'a1200000-0000-0000-0000-000000000012', 'Shudh Mawa Peda 500g', 'Traditional milk fudge garnished with cardamom',
  235, 'Sweets, Bakery & Snacks', 20, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1200000-0000-0000-0000-000000000003', 'a1200000-0000-0000-0000-000000000012', 'Desi Ghee Kaju Katli 250g', 'Rich melt-in-mouth cashew diamond sweets',
  255, 'Sweets, Bakery & Snacks', 25, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1200000-0000-0000-0000-000000000004', 'a1200000-0000-0000-0000-000000000012', 'Crispy Maskachaska Khari 400g', 'Fresh baked flaky tea-time puff pastry',
  75, 'Sweets, Bakery & Snacks', 35, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1200000-0000-0000-0000-000000000005', 'a1200000-0000-0000-0000-000000000012', 'Eggless Belgian Chocolate Cake 500g', 'Fresh baked creamy dark chocolate celebration cake',
  375, 'Sweets, Bakery & Snacks', 10, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 13: Mahavir Cloth Store (Sarafa Bazaar)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a1300000-0000-0000-0000-000000000013', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Mahavir Cloth Store', 'Clothing & Footwear', 'permanent',
  'Sarafa Bazaar, Mandsaur', 'Cloth Market Row', 'Mandsaur', '458001',
  24.0618, 75.0719, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80', 'Mahavir Cloth Store in Sarafa Bazaar, Mandsaur. Serving verified Clothing & Footwear with timely local delivery and counter pickup.',
  '10:00', '20:30', 'Sarafa Bazaar', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1300000-0000-0000-0000-000000000001', 'a1300000-0000-0000-0000-000000000013', 'Cotton Casual Men''s Full Sleeve Shirt', 'Breathable 100% cotton regular fit shirt',
  540, 'Clothing & Footwear', 20, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1300000-0000-0000-0000-000000000002', 'a1300000-0000-0000-0000-000000000013', 'Traditional Chanderi Printed Kurti', 'Elegant ethnic daily wear cotton kurti',
  490, 'Clothing & Footwear', 25, 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1300000-0000-0000-0000-000000000003', 'a1300000-0000-0000-0000-000000000013', 'Comfort Foam Daily Wear Flip-Flops', 'Lightweight water-resistant non-slip slippers',
  199, 'Clothing & Footwear', 35, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1300000-0000-0000-0000-000000000004', 'a1300000-0000-0000-0000-000000000013', 'Classic Stretchable Blue Denim Jeans', 'Durable mid-rise slim comfort fit jeans',
  799, 'Clothing & Footwear', 18, 'https://images.unsplash.com/photo-1542272604-780c96856592?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 14: Patel Sanitary & Hardware (Kalakhet)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a1400000-0000-0000-0000-000000000014', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Patel Sanitary & Hardware', 'Hardware & Tools', 'permanent',
  'Kalakhet, Mandsaur', 'Near Old Bus Stand', 'Mandsaur', '458001',
  24.0725, 75.0735, 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?w=800&auto=format&fit=crop&q=80', 'Patel Sanitary & Hardware in Kalakhet, Mandsaur. Serving verified Hardware & Tools with timely local delivery and counter pickup.',
  '09:00', '20:00', 'Kalakhet', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1400000-0000-0000-0000-000000000001', 'a1400000-0000-0000-0000-000000000014', 'Heavy Duty Claw Hammer 500g', 'Drop-forged steel with rubber grip',
  225, 'Hardware & Tools', 30, 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1400000-0000-0000-0000-000000000002', 'a1400000-0000-0000-0000-000000000014', 'Godrej Nav-Tal 7 Levers Brass Padlock', 'Hardened shackle high-security lock',
  415, 'Hardware & Tools', 24, 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1400000-0000-0000-0000-000000000003', 'a1400000-0000-0000-0000-000000000014', 'Stanley 5m Steel Measuring Tape', 'Polymer-coated corrosion resistant tape',
  165, 'Hardware & Tools', 40, 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1400000-0000-0000-0000-000000000004', 'a1400000-0000-0000-0000-000000000014', 'Stainless Steel Screws Assortment Box', '300-piece assorted drywall and wood screws',
  185, 'Hardware & Tools', 50, 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1400000-0000-0000-0000-000000000005', 'a1400000-0000-0000-0000-000000000014', 'Teflon Thread Seal Tape (Pack of 5)', 'Plumber tape for water leak prevention',
  80, 'Hardware & Tools', 70, 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1400000-0000-0000-0000-000000000006', 'a1400000-0000-0000-0000-000000000014', 'Tap Spindle Brass Replacement 1/2 inch', 'Heavy ceramic disc tap valve core',
  115, 'Hardware & Tools', 35, 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 15: Student Corner Xerox & Stationery (College Road)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a1500000-0000-0000-0000-000000000015', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Student Corner Xerox & Stationery', 'Stationery & Study Essentials', 'permanent',
  'College Road, Mandsaur', 'Opp. Govt PG College', 'Mandsaur', '458001',
  24.0752, 75.073, 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80', 'Student Corner Xerox & Stationery in College Road, Mandsaur. Serving verified Stationery & Study Essentials with timely local delivery and counter pickup.',
  '08:30', '20:30', 'College Road', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1500000-0000-0000-0000-000000000001', 'a1500000-0000-0000-0000-000000000015', 'Classmate Spiral Notebook 300 Pages', 'Single line ruled notebook with divider',
  125, 'Stationery & Study Essentials', 60, 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1500000-0000-0000-0000-000000000002', 'a1500000-0000-0000-0000-000000000015', 'Reynolds 045 Ball Pens Pack of 10', 'Smooth smudge-free blue ballpoint pens',
  90, 'Stationery & Study Essentials', 70, 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1500000-0000-0000-0000-000000000003', 'a1500000-0000-0000-0000-000000000015', 'JK Copier A4 Paper 75 GSM 500 Sheets', 'Ultra-white high-speed photocopy ream',
  350, 'Stationery & Study Essentials', 30, 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1500000-0000-0000-0000-000000000004', 'a1500000-0000-0000-0000-000000000015', 'Camlin 12 Shades Acrylic Colours Set', 'Vibrant fast-drying hobby paints with brush',
  205, 'Stationery & Study Essentials', 25, 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1500000-0000-0000-0000-000000000005', 'a1500000-0000-0000-0000-000000000015', 'Casio Scientific Calculator FX-82MS', '240 functions 2-line display student calculator',
  590, 'Stationery & Study Essentials', 15, 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1500000-0000-0000-0000-000000000006', 'a1500000-0000-0000-0000-000000000015', 'Fevicol MR Squeezy Glue Bottle 200g', 'Strong craft adhesive for paper and wood',
  65, 'Stationery & Study Essentials', 45, 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 16: Shree Annapurna Kirana (Bus Stand)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a1600000-0000-0000-0000-000000000016', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Shree Annapurna Kirana', 'Grocery & Daily Essentials', 'permanent',
  'Bus Stand, Mandsaur', 'Main Bus Terminal Row', 'Mandsaur', '458001',
  24.0736, 75.0693, 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80', 'Shree Annapurna Kirana in Bus Stand, Mandsaur. Serving verified Grocery & Daily Essentials with timely local delivery and counter pickup.',
  '07:00', '22:00', 'Bus Stand', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1600000-0000-0000-0000-000000000001', 'a1600000-0000-0000-0000-000000000016', 'Basmati Rice 5 kg', 'Long-grain fragrant rice',
  330, 'Grocery & Daily Essentials', 45, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1600000-0000-0000-0000-000000000002', 'a1600000-0000-0000-0000-000000000016', 'Toor Dal 1 kg', 'Clean polished premium pulses',
  145, 'Grocery & Daily Essentials', 35, 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1600000-0000-0000-0000-000000000003', 'a1600000-0000-0000-0000-000000000016', 'Aashirvaad Shudh Chakki Atta 5 kg', '100% whole wheat flour',
  235, 'Grocery & Daily Essentials', 50, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1600000-0000-0000-0000-000000000004', 'a1600000-0000-0000-0000-000000000016', 'Fortune Sunflower Oil 1 L', 'Refined heart-healthy cooking oil',
  138, 'Grocery & Daily Essentials', 40, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1600000-0000-0000-0000-000000000005', 'a1600000-0000-0000-0000-000000000016', 'Tata Salt 1 kg', 'Vacuum evaporated iodized salt',
  18, 'Grocery & Daily Essentials', 80, 'https://images.unsplash.com/photo-1518110903419-548c7c9c0b11?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1600000-0000-0000-0000-000000000006', 'a1600000-0000-0000-0000-000000000016', 'Red Label Tea 500 g', 'Brooke Bond strong blended tea',
  250, 'Grocery & Daily Essentials', 30, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1600000-0000-0000-0000-000000000007', 'a1600000-0000-0000-0000-000000000016', 'Madhur Pure Sugar 1 kg', 'Refined sulfur-free crystals',
  42, 'Grocery & Daily Essentials', 65, 'https://images.unsplash.com/photo-1622484214149-14a9058b8d0e?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1600000-0000-0000-0000-000000000008', 'a1600000-0000-0000-0000-000000000016', 'Surf Excel Easy Wash 1 kg', 'Advanced stain removal detergent',
  130, 'Grocery & Daily Essentials', 25, 'https://images.unsplash.com/photo-1585670270608-b4be4fbcf05d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 17: Apollo Partner Medicos (Nai Abadi)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a1700000-0000-0000-0000-000000000017', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Apollo Partner Medicos', 'Pharmacy & Wellness', 'permanent',
  'Nai Abadi, Mandsaur', 'Mhow Neemuch Main', 'Mandsaur', '458001',
  24.082, 75.0665, 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=800&auto=format&fit=crop&q=80', 'Apollo Partner Medicos in Nai Abadi, Mandsaur. Serving verified Pharmacy & Wellness with timely local delivery and counter pickup.',
  '08:00', '23:00', 'Nai Abadi', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1700000-0000-0000-0000-000000000001', 'a1700000-0000-0000-0000-000000000017', 'Dolo 650mg Paracetamol Tablets 15s', 'Fever and pain relief medication strip',
  27, 'Pharmacy & Wellness', 80, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1700000-0000-0000-0000-000000000002', 'a1700000-0000-0000-0000-000000000017', 'Dettol Antiseptic Liquid 250ml', 'Trusted disinfectant for cuts and hygiene',
  120, 'Pharmacy & Wellness', 40, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1700000-0000-0000-0000-000000000003', 'a1700000-0000-0000-0000-000000000017', 'Volini Joint & Muscle Pain Relief Spray 55g', 'Quick absorption micro-gel formulation',
  150, 'Pharmacy & Wellness', 30, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1700000-0000-0000-0000-000000000004', 'a1700000-0000-0000-0000-000000000017', 'Digene Acidity & Gas Relief Mint Gel 200ml', 'Fast cooling soothing antacid syrup',
  140, 'Pharmacy & Wellness', 25, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1700000-0000-0000-0000-000000000005', 'a1700000-0000-0000-0000-000000000017', 'Band-Aid Washproof Strips Box of 20', 'Sterile protective wound dressing band',
  55, 'Pharmacy & Wellness', 60, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 18: Fresh Basket Veggies (Thela) (Bus Stand)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a1800000-0000-0000-0000-000000000018', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Fresh Basket Veggies (Thela)', 'Fresh Fruits & Vegetables', 'temporary',
  'Bus Stand, Mandsaur', 'Near Auto Stand', 'Mandsaur', '458001',
  24.0745, 75.0699, 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&auto=format&fit=crop&q=80', 'Fresh Basket Veggies (Thela) in Bus Stand, Mandsaur. Serving verified Fresh Fruits & Vegetables with timely local delivery and counter pickup.',
  '07:00', '20:00', 'Bus Stand', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1800000-0000-0000-0000-000000000001', 'a1800000-0000-0000-0000-000000000018', 'Fresh Red Tomatoes 1 kg', 'Farm fresh juicy salad tomatoes',
  35, 'Fresh Fruits & Vegetables', 60, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1800000-0000-0000-0000-000000000002', 'a1800000-0000-0000-0000-000000000018', 'Desi Onions 1 kg', 'Fresh harvest pungent onions',
  30, 'Fresh Fruits & Vegetables', 75, 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1800000-0000-0000-0000-000000000003', 'a1800000-0000-0000-0000-000000000018', 'Pahadi Potatoes 1 kg', 'Clean starchy fresh potatoes',
  25, 'Fresh Fruits & Vegetables', 90, 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1800000-0000-0000-0000-000000000004', 'a1800000-0000-0000-0000-000000000018', 'Shimla Green Apples 1 kg', 'Crisp and sweet fresh apples',
  160, 'Fresh Fruits & Vegetables', 30, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1800000-0000-0000-0000-000000000005', 'a1800000-0000-0000-0000-000000000018', 'Robusta Bananas 1 Dozen', 'Naturally ripened sweet bananas',
  50, 'Fresh Fruits & Vegetables', 40, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1800000-0000-0000-0000-000000000006', 'a1800000-0000-0000-0000-000000000018', 'Spicy Green Chilies 250 g', 'Fresh pungent cooking chilies',
  20, 'Fresh Fruits & Vegetables', 50, 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1800000-0000-0000-0000-000000000007', 'a1800000-0000-0000-0000-000000000018', 'Fresh Ginger 250 g', 'Aromatic pungent desi adrak',
  30, 'Fresh Fruits & Vegetables', 35, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 19: Om Sai Electrical & Electronics (Station Road)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a1900000-0000-0000-0000-000000000019', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Om Sai Electrical & Electronics', 'Home & Electrical Essentials', 'permanent',
  'Station Road, Mandsaur', 'Electrical Market', 'Mandsaur', '458001',
  24.0709, 75.0667, 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80', 'Om Sai Electrical & Electronics in Station Road, Mandsaur. Serving verified Home & Electrical Essentials with timely local delivery and counter pickup.',
  '09:30', '20:30', 'Station Road', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1900000-0000-0000-0000-000000000001', 'a1900000-0000-0000-0000-000000000019', 'Philips 9W LED Bulb B22', 'Cool daylight energy saving bulb',
  90, 'Home & Electrical Essentials', 50, 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1900000-0000-0000-0000-000000000002', 'a1900000-0000-0000-0000-000000000019', 'Havells 4-Way Extension Board', 'Surge protected 2m cord strip',
  385, 'Home & Electrical Essentials', 20, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1900000-0000-0000-0000-000000000003', 'a1900000-0000-0000-0000-000000000019', 'Anchor Roma 1-Way Switch 6A', 'Modular white flame retardant switch',
  47, 'Home & Electrical Essentials', 100, 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1900000-0000-0000-0000-000000000004', 'a1900000-0000-0000-0000-000000000019', 'Syska Rechargeable Mosquito Swatter', 'Electric insect racket with LED',
  304, 'Home & Electrical Essentials', 25, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1900000-0000-0000-0000-000000000005', 'a1900000-0000-0000-0000-000000000019', 'Polycab 1.5 sq mm Wire 90m', 'FR PVC insulated copper wire coil',
  1455, 'Home & Electrical Essentials', 15, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b1900000-0000-0000-0000-000000000006', 'a1900000-0000-0000-0000-000000000019', 'Crompton 1200mm Ceiling Fan', 'High-speed energy efficient fan',
  1855, 'Home & Electrical Essentials', 12, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 20: Royal Footwear & Bags (Gandhi Chowk)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a2000000-0000-0000-0000-000000000020', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Royal Footwear & Bags', 'Clothing & Footwear', 'permanent',
  'Gandhi Chowk, Mandsaur', 'Main Square', 'Mandsaur', '458001',
  24.067, 75.0695, 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&auto=format&fit=crop&q=80', 'Royal Footwear & Bags in Gandhi Chowk, Mandsaur. Serving verified Clothing & Footwear with timely local delivery and counter pickup.',
  '10:30', '21:00', 'Gandhi Chowk', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000020', 'Cotton Casual Men''s Full Sleeve Shirt', 'Breathable 100% cotton regular fit shirt',
  550, 'Clothing & Footwear', 20, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000020', 'Traditional Chanderi Printed Kurti', 'Elegant ethnic daily wear cotton kurti',
  500, 'Clothing & Footwear', 25, 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000020', 'Comfort Foam Daily Wear Flip-Flops', 'Lightweight water-resistant non-slip slippers',
  209, 'Clothing & Footwear', 35, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2000000-0000-0000-0000-000000000004', 'a2000000-0000-0000-0000-000000000020', 'Classic Stretchable Blue Denim Jeans', 'Durable mid-rise slim comfort fit jeans',
  809, 'Clothing & Footwear', 18, 'https://images.unsplash.com/photo-1542272604-780c96856592?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 21: Kisan Iron Works & Tools (New Krishi Upaj Mandi)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a2100000-0000-0000-0000-000000000021', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Kisan Iron Works & Tools', 'Hardware & Tools', 'permanent',
  'New Krishi Upaj Mandi, Mandsaur', 'Bhunyakhedi Road', 'Mandsaur', '458001',
  24.088, 75.079, 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&auto=format&fit=crop&q=80', 'Kisan Iron Works & Tools in New Krishi Upaj Mandi, Mandsaur. Serving verified Hardware & Tools with timely local delivery and counter pickup.',
  '08:00', '19:30', 'New Krishi Upaj Mandi', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2100000-0000-0000-0000-000000000001', 'a2100000-0000-0000-0000-000000000021', 'Heavy Duty Claw Hammer 500g', 'Drop-forged steel with rubber grip',
  210, 'Hardware & Tools', 30, 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2100000-0000-0000-0000-000000000002', 'a2100000-0000-0000-0000-000000000021', 'Godrej Nav-Tal 7 Levers Brass Padlock', 'Hardened shackle high-security lock',
  400, 'Hardware & Tools', 24, 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2100000-0000-0000-0000-000000000003', 'a2100000-0000-0000-0000-000000000021', 'Stanley 5m Steel Measuring Tape', 'Polymer-coated corrosion resistant tape',
  150, 'Hardware & Tools', 40, 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2100000-0000-0000-0000-000000000004', 'a2100000-0000-0000-0000-000000000021', 'Stainless Steel Screws Assortment Box', '300-piece assorted drywall and wood screws',
  170, 'Hardware & Tools', 50, 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2100000-0000-0000-0000-000000000005', 'a2100000-0000-0000-0000-000000000021', 'Teflon Thread Seal Tape (Pack of 5)', 'Plumber tape for water leak prevention',
  65, 'Hardware & Tools', 70, 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2100000-0000-0000-0000-000000000006', 'a2100000-0000-0000-0000-000000000021', 'Tap Spindle Brass Replacement 1/2 inch', 'Heavy ceramic disc tap valve core',
  100, 'Hardware & Tools', 35, 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 22: Mhow-Neemuch Highway Mart (Mhow-Neemuch Road)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a2200000-0000-0000-0000-000000000022', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Mhow-Neemuch Highway Mart', 'Grocery & Daily Essentials', 'permanent',
  'Mhow-Neemuch Road, Mandsaur', 'Near Toll Gate Old', 'Mandsaur', '458001',
  24.098, 75.056, 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80', 'Mhow-Neemuch Highway Mart in Mhow-Neemuch Road, Mandsaur. Serving verified Grocery & Daily Essentials with timely local delivery and counter pickup.',
  '07:00', '23:00', 'Mhow-Neemuch Road', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2200000-0000-0000-0000-000000000001', 'a2200000-0000-0000-0000-000000000022', 'Basmati Rice 5 kg', 'Long-grain fragrant rice',
  335, 'Grocery & Daily Essentials', 45, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2200000-0000-0000-0000-000000000002', 'a2200000-0000-0000-0000-000000000022', 'Toor Dal 1 kg', 'Clean polished premium pulses',
  150, 'Grocery & Daily Essentials', 35, 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2200000-0000-0000-0000-000000000003', 'a2200000-0000-0000-0000-000000000022', 'Aashirvaad Shudh Chakki Atta 5 kg', '100% whole wheat flour',
  240, 'Grocery & Daily Essentials', 50, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2200000-0000-0000-0000-000000000004', 'a2200000-0000-0000-0000-000000000022', 'Fortune Sunflower Oil 1 L', 'Refined heart-healthy cooking oil',
  143, 'Grocery & Daily Essentials', 40, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2200000-0000-0000-0000-000000000005', 'a2200000-0000-0000-0000-000000000022', 'Tata Salt 1 kg', 'Vacuum evaporated iodized salt',
  23, 'Grocery & Daily Essentials', 80, 'https://images.unsplash.com/photo-1518110903419-548c7c9c0b11?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2200000-0000-0000-0000-000000000006', 'a2200000-0000-0000-0000-000000000022', 'Red Label Tea 500 g', 'Brooke Bond strong blended tea',
  255, 'Grocery & Daily Essentials', 30, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2200000-0000-0000-0000-000000000007', 'a2200000-0000-0000-0000-000000000022', 'Madhur Pure Sugar 1 kg', 'Refined sulfur-free crystals',
  47, 'Grocery & Daily Essentials', 65, 'https://images.unsplash.com/photo-1622484214149-14a9058b8d0e?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2200000-0000-0000-0000-000000000008', 'a2200000-0000-0000-0000-000000000022', 'Surf Excel Easy Wash 1 kg', 'Advanced stain removal detergent',
  135, 'Grocery & Daily Essentials', 25, 'https://images.unsplash.com/photo-1585670270608-b4be4fbcf05d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 23: Green Valley Nursery & Flowers (Yuvraj Club Bypass)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a2300000-0000-0000-0000-000000000023', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Green Valley Nursery & Flowers', 'Handmade Gifts & Flowers', 'permanent',
  'Yuvraj Club Bypass, Mandsaur', 'Bypass Junction', 'Mandsaur', '458001',
  24.089, 75.047, 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&auto=format&fit=crop&q=80', 'Green Valley Nursery & Flowers in Yuvraj Club Bypass, Mandsaur. Serving verified Handmade Gifts & Flowers with timely local delivery and counter pickup.',
  '07:30', '19:00', 'Yuvraj Club Bypass', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2300000-0000-0000-0000-000000000001', 'a2300000-0000-0000-0000-000000000023', 'Fresh Dutch Rose Bouquet (10 Stems)', 'Hand-tied premium red roses with ribbon',
  299, 'Handmade Gifts & Flowers', 15, 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2300000-0000-0000-0000-000000000002', 'a2300000-0000-0000-0000-000000000023', 'Mogra & Marigold Puja Garland Set', 'Fragrant fresh flowers for daily home temple',
  60, 'Handmade Gifts & Flowers', 30, 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2300000-0000-0000-0000-000000000003', 'a2300000-0000-0000-0000-000000000023', 'Handcrafted Terracotta Diya & Candle Stand', 'Artisanal clay home decor and festive lighting',
  180, 'Handmade Gifts & Flowers', 20, 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2300000-0000-0000-0000-000000000004', 'a2300000-0000-0000-0000-000000000023', 'Personalized Handmade Wooden Photo Frame', 'Rustic tabletop photo frame 5x7 inches',
  240, 'Handmade Gifts & Flowers', 15, 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 24: Rewas Dewda Dairy & Bakery (Rewas Dewda Road)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a2400000-0000-0000-0000-000000000024', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Rewas Dewda Dairy & Bakery', 'Sweets, Bakery & Snacks', 'permanent',
  'Rewas Dewda Road, Mandsaur', 'Near Bridge Point', 'Mandsaur', '458001',
  24.092, 75.093, 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?w=800&auto=format&fit=crop&q=80', 'Rewas Dewda Dairy & Bakery in Rewas Dewda Road, Mandsaur. Serving verified Sweets, Bakery & Snacks with timely local delivery and counter pickup.',
  '06:30', '21:30', 'Rewas Dewda Road', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2400000-0000-0000-0000-000000000001', 'a2400000-0000-0000-0000-000000000024', 'Famous Mandsaur Ratlami Sev 500g', 'Authentic spicy clove-infused gram flour sev',
  145, 'Sweets, Bakery & Snacks', 45, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2400000-0000-0000-0000-000000000002', 'a2400000-0000-0000-0000-000000000024', 'Shudh Mawa Peda 500g', 'Traditional milk fudge garnished with cardamom',
  245, 'Sweets, Bakery & Snacks', 20, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2400000-0000-0000-0000-000000000003', 'a2400000-0000-0000-0000-000000000024', 'Desi Ghee Kaju Katli 250g', 'Rich melt-in-mouth cashew diamond sweets',
  265, 'Sweets, Bakery & Snacks', 25, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2400000-0000-0000-0000-000000000004', 'a2400000-0000-0000-0000-000000000024', 'Crispy Maskachaska Khari 400g', 'Fresh baked flaky tea-time puff pastry',
  85, 'Sweets, Bakery & Snacks', 35, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2400000-0000-0000-0000-000000000005', 'a2400000-0000-0000-0000-000000000024', 'Eggless Belgian Chocolate Cake 500g', 'Fresh baked creamy dark chocolate celebration cake',
  385, 'Sweets, Bakery & Snacks', 10, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 25: Sanjeet Road Agro & Seeds (Sanjeet Road)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a2500000-0000-0000-0000-000000000025', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Sanjeet Road Agro & Seeds', 'Hardware & Tools', 'permanent',
  'Sanjeet Road, Mandsaur', 'Outer Checkpost', 'Mandsaur', '458001',
  24.056, 75.038, 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&auto=format&fit=crop&q=80', 'Sanjeet Road Agro & Seeds in Sanjeet Road, Mandsaur. Serving verified Hardware & Tools with timely local delivery and counter pickup.',
  '08:30', '19:30', 'Sanjeet Road', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2500000-0000-0000-0000-000000000001', 'a2500000-0000-0000-0000-000000000025', 'Heavy Duty Claw Hammer 500g', 'Drop-forged steel with rubber grip',
  230, 'Hardware & Tools', 30, 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2500000-0000-0000-0000-000000000002', 'a2500000-0000-0000-0000-000000000025', 'Godrej Nav-Tal 7 Levers Brass Padlock', 'Hardened shackle high-security lock',
  420, 'Hardware & Tools', 24, 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2500000-0000-0000-0000-000000000003', 'a2500000-0000-0000-0000-000000000025', 'Stanley 5m Steel Measuring Tape', 'Polymer-coated corrosion resistant tape',
  170, 'Hardware & Tools', 40, 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2500000-0000-0000-0000-000000000004', 'a2500000-0000-0000-0000-000000000025', 'Stainless Steel Screws Assortment Box', '300-piece assorted drywall and wood screws',
  190, 'Hardware & Tools', 50, 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2500000-0000-0000-0000-000000000005', 'a2500000-0000-0000-0000-000000000025', 'Teflon Thread Seal Tape (Pack of 5)', 'Plumber tape for water leak prevention',
  85, 'Hardware & Tools', 70, 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2500000-0000-0000-0000-000000000006', 'a2500000-0000-0000-0000-000000000025', 'Tap Spindle Brass Replacement 1/2 inch', 'Heavy ceramic disc tap valve core',
  120, 'Hardware & Tools', 35, 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 26: Fresh Orchard Fruits Mobile Cart (Overbridge Service Road)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a2600000-0000-0000-0000-000000000026', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Fresh Orchard Fruits Mobile Cart', 'Fresh Fruits & Vegetables', 'temporary',
  'Overbridge Service Road, Mandsaur', 'Overbridge Circle', 'Mandsaur', '458001',
  24.081, 75.084, 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&auto=format&fit=crop&q=80', 'Fresh Orchard Fruits Mobile Cart in Overbridge Service Road, Mandsaur. Serving verified Fresh Fruits & Vegetables with timely local delivery and counter pickup.',
  '08:00', '20:00', 'Overbridge Service Road', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2600000-0000-0000-0000-000000000001', 'a2600000-0000-0000-0000-000000000026', 'Fresh Red Tomatoes 1 kg', 'Farm fresh juicy salad tomatoes',
  25, 'Fresh Fruits & Vegetables', 60, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2600000-0000-0000-0000-000000000002', 'a2600000-0000-0000-0000-000000000026', 'Desi Onions 1 kg', 'Fresh harvest pungent onions',
  20, 'Fresh Fruits & Vegetables', 75, 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2600000-0000-0000-0000-000000000003', 'a2600000-0000-0000-0000-000000000026', 'Pahadi Potatoes 1 kg', 'Clean starchy fresh potatoes',
  15, 'Fresh Fruits & Vegetables', 90, 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2600000-0000-0000-0000-000000000004', 'a2600000-0000-0000-0000-000000000026', 'Shimla Green Apples 1 kg', 'Crisp and sweet fresh apples',
  150, 'Fresh Fruits & Vegetables', 30, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2600000-0000-0000-0000-000000000005', 'a2600000-0000-0000-0000-000000000026', 'Robusta Bananas 1 Dozen', 'Naturally ripened sweet bananas',
  40, 'Fresh Fruits & Vegetables', 40, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2600000-0000-0000-0000-000000000006', 'a2600000-0000-0000-0000-000000000026', 'Spicy Green Chilies 250 g', 'Fresh pungent cooking chilies',
  10, 'Fresh Fruits & Vegetables', 50, 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2600000-0000-0000-0000-000000000007', 'a2600000-0000-0000-0000-000000000026', 'Fresh Ginger 250 g', 'Aromatic pungent desi adrak',
  20, 'Fresh Fruits & Vegetables', 35, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 27: Arihant Lights & Home Decor (Overbridge Bypass)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a2700000-0000-0000-0000-000000000027', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Arihant Lights & Home Decor', 'Home & Electrical Essentials', 'permanent',
  'Overbridge Bypass, Mandsaur', 'Overbridge Market', 'Mandsaur', '458001',
  24.079, 75.082, 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=800&auto=format&fit=crop&q=80', 'Arihant Lights & Home Decor in Overbridge Bypass, Mandsaur. Serving verified Home & Electrical Essentials with timely local delivery and counter pickup.',
  '10:00', '21:00', 'Overbridge Bypass', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2700000-0000-0000-0000-000000000001', 'a2700000-0000-0000-0000-000000000027', 'Philips 9W LED Bulb B22', 'Cool daylight energy saving bulb',
  80, 'Home & Electrical Essentials', 50, 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2700000-0000-0000-0000-000000000002', 'a2700000-0000-0000-0000-000000000027', 'Havells 4-Way Extension Board', 'Surge protected 2m cord strip',
  375, 'Home & Electrical Essentials', 20, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2700000-0000-0000-0000-000000000003', 'a2700000-0000-0000-0000-000000000027', 'Anchor Roma 1-Way Switch 6A', 'Modular white flame retardant switch',
  37, 'Home & Electrical Essentials', 100, 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2700000-0000-0000-0000-000000000004', 'a2700000-0000-0000-0000-000000000027', 'Syska Rechargeable Mosquito Swatter', 'Electric insect racket with LED',
  294, 'Home & Electrical Essentials', 25, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2700000-0000-0000-0000-000000000005', 'a2700000-0000-0000-0000-000000000027', 'Polycab 1.5 sq mm Wire 90m', 'FR PVC insulated copper wire coil',
  1445, 'Home & Electrical Essentials', 15, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2700000-0000-0000-0000-000000000006', 'a2700000-0000-0000-0000-000000000027', 'Crompton 1200mm Ceiling Fan', 'High-speed energy efficient fan',
  1845, 'Home & Electrical Essentials', 12, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 28: Janta Daily Needs Kirana (Bhunyakhedi)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a2800000-0000-0000-0000-000000000028', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Janta Daily Needs Kirana', 'Grocery & Daily Essentials', 'permanent',
  'Bhunyakhedi, Mandsaur', 'Village Cross Road', 'Mandsaur', '458001',
  24.095, 75.085, 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&auto=format&fit=crop&q=80', 'Janta Daily Needs Kirana in Bhunyakhedi, Mandsaur. Serving verified Grocery & Daily Essentials with timely local delivery and counter pickup.',
  '07:00', '21:00', 'Bhunyakhedi', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2800000-0000-0000-0000-000000000001', 'a2800000-0000-0000-0000-000000000028', 'Basmati Rice 5 kg', 'Long-grain fragrant rice',
  340, 'Grocery & Daily Essentials', 45, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2800000-0000-0000-0000-000000000002', 'a2800000-0000-0000-0000-000000000028', 'Toor Dal 1 kg', 'Clean polished premium pulses',
  155, 'Grocery & Daily Essentials', 35, 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2800000-0000-0000-0000-000000000003', 'a2800000-0000-0000-0000-000000000028', 'Aashirvaad Shudh Chakki Atta 5 kg', '100% whole wheat flour',
  245, 'Grocery & Daily Essentials', 50, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2800000-0000-0000-0000-000000000004', 'a2800000-0000-0000-0000-000000000028', 'Fortune Sunflower Oil 1 L', 'Refined heart-healthy cooking oil',
  148, 'Grocery & Daily Essentials', 40, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2800000-0000-0000-0000-000000000005', 'a2800000-0000-0000-0000-000000000028', 'Tata Salt 1 kg', 'Vacuum evaporated iodized salt',
  28, 'Grocery & Daily Essentials', 80, 'https://images.unsplash.com/photo-1518110903419-548c7c9c0b11?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2800000-0000-0000-0000-000000000006', 'a2800000-0000-0000-0000-000000000028', 'Red Label Tea 500 g', 'Brooke Bond strong blended tea',
  260, 'Grocery & Daily Essentials', 30, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2800000-0000-0000-0000-000000000007', 'a2800000-0000-0000-0000-000000000028', 'Madhur Pure Sugar 1 kg', 'Refined sulfur-free crystals',
  52, 'Grocery & Daily Essentials', 65, 'https://images.unsplash.com/photo-1622484214149-14a9058b8d0e?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2800000-0000-0000-0000-000000000008', 'a2800000-0000-0000-0000-000000000028', 'Surf Excel Easy Wash 1 kg', 'Advanced stain removal detergent',
  140, 'Grocery & Daily Essentials', 25, 'https://images.unsplash.com/photo-1585670270608-b4be4fbcf05d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 29: City Care Chemist & Wellness (Sanjeet Road)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a2900000-0000-0000-0000-000000000029', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'City Care Chemist & Wellness', 'Pharmacy & Wellness', 'permanent',
  'Sanjeet Road, Mandsaur', 'Sanjeet Naka Chowk', 'Mandsaur', '458001',
  24.059, 75.049, 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=800&auto=format&fit=crop&q=80', 'City Care Chemist & Wellness in Sanjeet Road, Mandsaur. Serving verified Pharmacy & Wellness with timely local delivery and counter pickup.',
  '08:00', '22:00', 'Sanjeet Road', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2900000-0000-0000-0000-000000000001', 'a2900000-0000-0000-0000-000000000029', 'Dolo 650mg Paracetamol Tablets 15s', 'Fever and pain relief medication strip',
  37, 'Pharmacy & Wellness', 80, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2900000-0000-0000-0000-000000000002', 'a2900000-0000-0000-0000-000000000029', 'Dettol Antiseptic Liquid 250ml', 'Trusted disinfectant for cuts and hygiene',
  130, 'Pharmacy & Wellness', 40, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2900000-0000-0000-0000-000000000003', 'a2900000-0000-0000-0000-000000000029', 'Volini Joint & Muscle Pain Relief Spray 55g', 'Quick absorption micro-gel formulation',
  160, 'Pharmacy & Wellness', 30, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2900000-0000-0000-0000-000000000004', 'a2900000-0000-0000-0000-000000000029', 'Digene Acidity & Gas Relief Mint Gel 200ml', 'Fast cooling soothing antacid syrup',
  150, 'Pharmacy & Wellness', 25, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b2900000-0000-0000-0000-000000000005', 'a2900000-0000-0000-0000-000000000029', 'Band-Aid Washproof Strips Box of 20', 'Sterile protective wound dressing band',
  65, 'Pharmacy & Wellness', 60, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 30: Bypass Fast Fashion Point (Yuvraj Club)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a3000000-0000-0000-0000-000000000030', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Bypass Fast Fashion Point', 'Clothing & Footwear', 'permanent',
  'Yuvraj Club, Mandsaur', 'Shopping Arcade', 'Mandsaur', '458001',
  24.086, 75.044, 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&auto=format&fit=crop&q=80', 'Bypass Fast Fashion Point in Yuvraj Club, Mandsaur. Serving verified Clothing & Footwear with timely local delivery and counter pickup.',
  '10:30', '21:30', 'Yuvraj Club', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3000000-0000-0000-0000-000000000001', 'a3000000-0000-0000-0000-000000000030', 'Cotton Casual Men''s Full Sleeve Shirt', 'Breathable 100% cotton regular fit shirt',
  550, 'Clothing & Footwear', 20, 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3000000-0000-0000-0000-000000000002', 'a3000000-0000-0000-0000-000000000030', 'Traditional Chanderi Printed Kurti', 'Elegant ethnic daily wear cotton kurti',
  500, 'Clothing & Footwear', 25, 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3000000-0000-0000-0000-000000000003', 'a3000000-0000-0000-0000-000000000030', 'Comfort Foam Daily Wear Flip-Flops', 'Lightweight water-resistant non-slip slippers',
  209, 'Clothing & Footwear', 35, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3000000-0000-0000-0000-000000000004', 'a3000000-0000-0000-0000-000000000030', 'Classic Stretchable Blue Denim Jeans', 'Durable mid-rise slim comfort fit jeans',
  809, 'Clothing & Footwear', 18, 'https://images.unsplash.com/photo-1542272604-780c96856592?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 31: Mandsaur Book House Extension (Mhow Neemuch Bypass)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a3100000-0000-0000-0000-000000000031', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Mandsaur Book House Extension', 'Stationery & Study Essentials', 'permanent',
  'Mhow Neemuch Bypass, Mandsaur', 'Near DPS School', 'Mandsaur', '458001',
  24.102, 75.059, 'https://images.unsplash.com/photo-1507842229451-77b103b47453?w=800&auto=format&fit=crop&q=80', 'Mandsaur Book House Extension in Mhow Neemuch Bypass, Mandsaur. Serving verified Stationery & Study Essentials with timely local delivery and counter pickup.',
  '09:00', '20:00', 'Mhow Neemuch Bypass', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3100000-0000-0000-0000-000000000001', 'a3100000-0000-0000-0000-000000000031', 'Classmate Spiral Notebook 300 Pages', 'Single line ruled notebook with divider',
  105, 'Stationery & Study Essentials', 60, 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3100000-0000-0000-0000-000000000002', 'a3100000-0000-0000-0000-000000000031', 'Reynolds 045 Ball Pens Pack of 10', 'Smooth smudge-free blue ballpoint pens',
  70, 'Stationery & Study Essentials', 70, 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3100000-0000-0000-0000-000000000003', 'a3100000-0000-0000-0000-000000000031', 'JK Copier A4 Paper 75 GSM 500 Sheets', 'Ultra-white high-speed photocopy ream',
  330, 'Stationery & Study Essentials', 30, 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3100000-0000-0000-0000-000000000004', 'a3100000-0000-0000-0000-000000000031', 'Camlin 12 Shades Acrylic Colours Set', 'Vibrant fast-drying hobby paints with brush',
  185, 'Stationery & Study Essentials', 25, 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3100000-0000-0000-0000-000000000005', 'a3100000-0000-0000-0000-000000000031', 'Casio Scientific Calculator FX-82MS', '240 functions 2-line display student calculator',
  570, 'Stationery & Study Essentials', 15, 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3100000-0000-0000-0000-000000000006', 'a3100000-0000-0000-0000-000000000031', 'Fevicol MR Squeezy Glue Bottle 200g', 'Strong craft adhesive for paper and wood',
  45, 'Stationery & Study Essentials', 45, 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 32: Kisan Mandi Fresh Veg Stalls (Krishi Mandi Gate 2)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a3200000-0000-0000-0000-000000000032', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Kisan Mandi Fresh Veg Stalls', 'Fresh Fruits & Vegetables', 'temporary',
  'Krishi Mandi Gate 2, Mandsaur', 'Mandi Gate', 'Mandsaur', '458001',
  24.087, 75.076, 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=800&auto=format&fit=crop&q=80', 'Kisan Mandi Fresh Veg Stalls in Krishi Mandi Gate 2, Mandsaur. Serving verified Fresh Fruits & Vegetables with timely local delivery and counter pickup.',
  '06:00', '14:00', 'Krishi Mandi Gate 2', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3200000-0000-0000-0000-000000000001', 'a3200000-0000-0000-0000-000000000032', 'Fresh Red Tomatoes 1 kg', 'Farm fresh juicy salad tomatoes',
  30, 'Fresh Fruits & Vegetables', 60, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3200000-0000-0000-0000-000000000002', 'a3200000-0000-0000-0000-000000000032', 'Desi Onions 1 kg', 'Fresh harvest pungent onions',
  25, 'Fresh Fruits & Vegetables', 75, 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3200000-0000-0000-0000-000000000003', 'a3200000-0000-0000-0000-000000000032', 'Pahadi Potatoes 1 kg', 'Clean starchy fresh potatoes',
  20, 'Fresh Fruits & Vegetables', 90, 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3200000-0000-0000-0000-000000000004', 'a3200000-0000-0000-0000-000000000032', 'Shimla Green Apples 1 kg', 'Crisp and sweet fresh apples',
  155, 'Fresh Fruits & Vegetables', 30, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3200000-0000-0000-0000-000000000005', 'a3200000-0000-0000-0000-000000000032', 'Robusta Bananas 1 Dozen', 'Naturally ripened sweet bananas',
  45, 'Fresh Fruits & Vegetables', 40, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3200000-0000-0000-0000-000000000006', 'a3200000-0000-0000-0000-000000000032', 'Spicy Green Chilies 250 g', 'Fresh pungent cooking chilies',
  15, 'Fresh Fruits & Vegetables', 50, 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3200000-0000-0000-0000-000000000007', 'a3200000-0000-0000-0000-000000000032', 'Fresh Ginger 250 g', 'Aromatic pungent desi adrak',
  25, 'Fresh Fruits & Vegetables', 35, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 33: National Highway Hardware (Mhow-Neemuch Highway)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a3300000-0000-0000-0000-000000000033', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'National Highway Hardware', 'Hardware & Tools', 'permanent',
  'Mhow-Neemuch Highway, Mandsaur', 'HP Petrol Pump', 'Mandsaur', '458001',
  24.104, 75.052, 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&auto=format&fit=crop&q=80', 'National Highway Hardware in Mhow-Neemuch Highway, Mandsaur. Serving verified Hardware & Tools with timely local delivery and counter pickup.',
  '08:30', '20:30', 'Mhow-Neemuch Highway', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3300000-0000-0000-0000-000000000001', 'a3300000-0000-0000-0000-000000000033', 'Heavy Duty Claw Hammer 500g', 'Drop-forged steel with rubber grip',
  220, 'Hardware & Tools', 30, 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3300000-0000-0000-0000-000000000002', 'a3300000-0000-0000-0000-000000000033', 'Godrej Nav-Tal 7 Levers Brass Padlock', 'Hardened shackle high-security lock',
  410, 'Hardware & Tools', 24, 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3300000-0000-0000-0000-000000000003', 'a3300000-0000-0000-0000-000000000033', 'Stanley 5m Steel Measuring Tape', 'Polymer-coated corrosion resistant tape',
  160, 'Hardware & Tools', 40, 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3300000-0000-0000-0000-000000000004', 'a3300000-0000-0000-0000-000000000033', 'Stainless Steel Screws Assortment Box', '300-piece assorted drywall and wood screws',
  180, 'Hardware & Tools', 50, 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3300000-0000-0000-0000-000000000005', 'a3300000-0000-0000-0000-000000000033', 'Teflon Thread Seal Tape (Pack of 5)', 'Plumber tape for water leak prevention',
  75, 'Hardware & Tools', 70, 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3300000-0000-0000-0000-000000000006', 'a3300000-0000-0000-0000-000000000033', 'Tap Spindle Brass Replacement 1/2 inch', 'Heavy ceramic disc tap valve core',
  110, 'Hardware & Tools', 35, 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 34: Shree Krishna Bakery & Cafe (Sanjeet Road)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a3400000-0000-0000-0000-000000000034', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Shree Krishna Bakery & Cafe', 'Sweets, Bakery & Snacks', 'permanent',
  'Sanjeet Road, Mandsaur', 'Near ITI College', 'Mandsaur', '458001',
  24.053, 75.041, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80', 'Shree Krishna Bakery & Cafe in Sanjeet Road, Mandsaur. Serving verified Sweets, Bakery & Snacks with timely local delivery and counter pickup.',
  '08:00', '22:30', 'Sanjeet Road', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3400000-0000-0000-0000-000000000001', 'a3400000-0000-0000-0000-000000000034', 'Famous Mandsaur Ratlami Sev 500g', 'Authentic spicy clove-infused gram flour sev',
  145, 'Sweets, Bakery & Snacks', 45, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3400000-0000-0000-0000-000000000002', 'a3400000-0000-0000-0000-000000000034', 'Shudh Mawa Peda 500g', 'Traditional milk fudge garnished with cardamom',
  245, 'Sweets, Bakery & Snacks', 20, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3400000-0000-0000-0000-000000000003', 'a3400000-0000-0000-0000-000000000034', 'Desi Ghee Kaju Katli 250g', 'Rich melt-in-mouth cashew diamond sweets',
  265, 'Sweets, Bakery & Snacks', 25, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3400000-0000-0000-0000-000000000004', 'a3400000-0000-0000-0000-000000000034', 'Crispy Maskachaska Khari 400g', 'Fresh baked flaky tea-time puff pastry',
  85, 'Sweets, Bakery & Snacks', 35, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3400000-0000-0000-0000-000000000005', 'a3400000-0000-0000-0000-000000000034', 'Eggless Belgian Chocolate Cake 500g', 'Fresh baked creamy dark chocolate celebration cake',
  385, 'Sweets, Bakery & Snacks', 10, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 35: Shubh Labh General Mart (Rewas Dewda Road)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a3500000-0000-0000-0000-000000000035', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Shubh Labh General Mart', 'Grocery & Daily Essentials', 'permanent',
  'Rewas Dewda Road, Mandsaur', 'Housing Board Colony', 'Mandsaur', '458001',
  24.086, 75.099, 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&auto=format&fit=crop&q=80', 'Shubh Labh General Mart in Rewas Dewda Road, Mandsaur. Serving verified Grocery & Daily Essentials with timely local delivery and counter pickup.',
  '07:30', '21:30', 'Rewas Dewda Road', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3500000-0000-0000-0000-000000000001', 'a3500000-0000-0000-0000-000000000035', 'Basmati Rice 5 kg', 'Long-grain fragrant rice',
  350, 'Grocery & Daily Essentials', 45, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3500000-0000-0000-0000-000000000002', 'a3500000-0000-0000-0000-000000000035', 'Toor Dal 1 kg', 'Clean polished premium pulses',
  165, 'Grocery & Daily Essentials', 35, 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3500000-0000-0000-0000-000000000003', 'a3500000-0000-0000-0000-000000000035', 'Aashirvaad Shudh Chakki Atta 5 kg', '100% whole wheat flour',
  255, 'Grocery & Daily Essentials', 50, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3500000-0000-0000-0000-000000000004', 'a3500000-0000-0000-0000-000000000035', 'Fortune Sunflower Oil 1 L', 'Refined heart-healthy cooking oil',
  158, 'Grocery & Daily Essentials', 40, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3500000-0000-0000-0000-000000000005', 'a3500000-0000-0000-0000-000000000035', 'Tata Salt 1 kg', 'Vacuum evaporated iodized salt',
  38, 'Grocery & Daily Essentials', 80, 'https://images.unsplash.com/photo-1518110903419-548c7c9c0b11?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3500000-0000-0000-0000-000000000006', 'a3500000-0000-0000-0000-000000000035', 'Red Label Tea 500 g', 'Brooke Bond strong blended tea',
  270, 'Grocery & Daily Essentials', 30, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3500000-0000-0000-0000-000000000007', 'a3500000-0000-0000-0000-000000000035', 'Madhur Pure Sugar 1 kg', 'Refined sulfur-free crystals',
  62, 'Grocery & Daily Essentials', 65, 'https://images.unsplash.com/photo-1622484214149-14a9058b8d0e?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3500000-0000-0000-0000-000000000008', 'a3500000-0000-0000-0000-000000000035', 'Surf Excel Easy Wash 1 kg', 'Advanced stain removal detergent',
  150, 'Grocery & Daily Essentials', 25, 'https://images.unsplash.com/photo-1585670270608-b4be4fbcf05d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 36: Pawan Electrical Spares (Krishi Mandi Service Rd)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a3600000-0000-0000-0000-000000000036', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Pawan Electrical Spares', 'Home & Electrical Essentials', 'permanent',
  'Krishi Mandi Service Rd, Mandsaur', 'Warehouse Lane', 'Mandsaur', '458001',
  24.0895, 75.0775, 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=800&auto=format&fit=crop&q=80', 'Pawan Electrical Spares in Krishi Mandi Service Rd, Mandsaur. Serving verified Home & Electrical Essentials with timely local delivery and counter pickup.',
  '09:00', '20:00', 'Krishi Mandi Service Rd', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3600000-0000-0000-0000-000000000001', 'a3600000-0000-0000-0000-000000000036', 'Philips 9W LED Bulb B22', 'Cool daylight energy saving bulb',
  75, 'Home & Electrical Essentials', 50, 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3600000-0000-0000-0000-000000000002', 'a3600000-0000-0000-0000-000000000036', 'Havells 4-Way Extension Board', 'Surge protected 2m cord strip',
  370, 'Home & Electrical Essentials', 20, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3600000-0000-0000-0000-000000000003', 'a3600000-0000-0000-0000-000000000036', 'Anchor Roma 1-Way Switch 6A', 'Modular white flame retardant switch',
  32, 'Home & Electrical Essentials', 100, 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3600000-0000-0000-0000-000000000004', 'a3600000-0000-0000-0000-000000000036', 'Syska Rechargeable Mosquito Swatter', 'Electric insect racket with LED',
  289, 'Home & Electrical Essentials', 25, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3600000-0000-0000-0000-000000000005', 'a3600000-0000-0000-0000-000000000036', 'Polycab 1.5 sq mm Wire 90m', 'FR PVC insulated copper wire coil',
  1440, 'Home & Electrical Essentials', 15, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3600000-0000-0000-0000-000000000006', 'a3600000-0000-0000-0000-000000000036', 'Crompton 1200mm Ceiling Fan', 'High-speed energy efficient fan',
  1840, 'Home & Electrical Essentials', 12, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 37: Handicrafts & Mitti Bartan (Mhow Road)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a3700000-0000-0000-0000-000000000037', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Handicrafts & Mitti Bartan', 'Handmade Gifts & Flowers', 'temporary',
  'Mhow Road, Mandsaur', 'Near Flyover Foot', 'Mandsaur', '458001',
  24.093, 75.062, 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&auto=format&fit=crop&q=80', 'Handicrafts & Mitti Bartan in Mhow Road, Mandsaur. Serving verified Handmade Gifts & Flowers with timely local delivery and counter pickup.',
  '09:00', '19:00', 'Mhow Road', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3700000-0000-0000-0000-000000000001', 'a3700000-0000-0000-0000-000000000037', 'Fresh Dutch Rose Bouquet (10 Stems)', 'Hand-tied premium red roses with ribbon',
  294, 'Handmade Gifts & Flowers', 15, 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3700000-0000-0000-0000-000000000002', 'a3700000-0000-0000-0000-000000000037', 'Mogra & Marigold Puja Garland Set', 'Fragrant fresh flowers for daily home temple',
  55, 'Handmade Gifts & Flowers', 30, 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3700000-0000-0000-0000-000000000003', 'a3700000-0000-0000-0000-000000000037', 'Handcrafted Terracotta Diya & Candle Stand', 'Artisanal clay home decor and festive lighting',
  175, 'Handmade Gifts & Flowers', 20, 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3700000-0000-0000-0000-000000000004', 'a3700000-0000-0000-0000-000000000037', 'Personalized Handmade Wooden Photo Frame', 'Rustic tabletop photo frame 5x7 inches',
  235, 'Handmade Gifts & Flowers', 15, 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 38: LifeLine Pharmacy Express (Rewas Dewda Highway)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a3800000-0000-0000-0000-000000000038', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'LifeLine Pharmacy Express', 'Pharmacy & Wellness', 'permanent',
  'Rewas Dewda Highway, Mandsaur', 'Near Shanti Kunj', 'Mandsaur', '458001',
  24.088, 75.096, 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=80', 'LifeLine Pharmacy Express in Rewas Dewda Highway, Mandsaur. Serving verified Pharmacy & Wellness with timely local delivery and counter pickup.',
  '08:00', '22:00', 'Rewas Dewda Highway', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3800000-0000-0000-0000-000000000001', 'a3800000-0000-0000-0000-000000000038', 'Dolo 650mg Paracetamol Tablets 15s', 'Fever and pain relief medication strip',
  32, 'Pharmacy & Wellness', 80, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3800000-0000-0000-0000-000000000002', 'a3800000-0000-0000-0000-000000000038', 'Dettol Antiseptic Liquid 250ml', 'Trusted disinfectant for cuts and hygiene',
  125, 'Pharmacy & Wellness', 40, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3800000-0000-0000-0000-000000000003', 'a3800000-0000-0000-0000-000000000038', 'Volini Joint & Muscle Pain Relief Spray 55g', 'Quick absorption micro-gel formulation',
  155, 'Pharmacy & Wellness', 30, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3800000-0000-0000-0000-000000000004', 'a3800000-0000-0000-0000-000000000038', 'Digene Acidity & Gas Relief Mint Gel 200ml', 'Fast cooling soothing antacid syrup',
  145, 'Pharmacy & Wellness', 25, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3800000-0000-0000-0000-000000000005', 'a3800000-0000-0000-0000-000000000038', 'Band-Aid Washproof Strips Box of 20', 'Sterile protective wound dressing band',
  60, 'Pharmacy & Wellness', 60, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 39: Multanpura Kisan Seva Kendra (Multanpura)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a3900000-0000-0000-0000-000000000039', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Multanpura Kisan Seva Kendra', 'Hardware & Tools', 'permanent',
  'Multanpura, Mandsaur', 'Main Multanpura Chauraha', 'Mandsaur', '458001',
  24.02, 75.105, 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&auto=format&fit=crop&q=80', 'Multanpura Kisan Seva Kendra in Multanpura, Mandsaur. Serving verified Hardware & Tools with timely local delivery and counter pickup.',
  '08:00', '19:00', 'Multanpura', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3900000-0000-0000-0000-000000000001', 'a3900000-0000-0000-0000-000000000039', 'Heavy Duty Claw Hammer 500g', 'Drop-forged steel with rubber grip',
  225, 'Hardware & Tools', 30, 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3900000-0000-0000-0000-000000000002', 'a3900000-0000-0000-0000-000000000039', 'Godrej Nav-Tal 7 Levers Brass Padlock', 'Hardened shackle high-security lock',
  415, 'Hardware & Tools', 24, 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3900000-0000-0000-0000-000000000003', 'a3900000-0000-0000-0000-000000000039', 'Stanley 5m Steel Measuring Tape', 'Polymer-coated corrosion resistant tape',
  165, 'Hardware & Tools', 40, 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3900000-0000-0000-0000-000000000004', 'a3900000-0000-0000-0000-000000000039', 'Stainless Steel Screws Assortment Box', '300-piece assorted drywall and wood screws',
  185, 'Hardware & Tools', 50, 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3900000-0000-0000-0000-000000000005', 'a3900000-0000-0000-0000-000000000039', 'Teflon Thread Seal Tape (Pack of 5)', 'Plumber tape for water leak prevention',
  80, 'Hardware & Tools', 70, 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b3900000-0000-0000-0000-000000000006', 'a3900000-0000-0000-0000-000000000039', 'Tap Spindle Brass Replacement 1/2 inch', 'Heavy ceramic disc tap valve core',
  115, 'Hardware & Tools', 35, 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 40: Multanpura Village Kirana (Multanpura)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a4000000-0000-0000-0000-000000000040', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Multanpura Village Kirana', 'Grocery & Daily Essentials', 'permanent',
  'Multanpura, Mandsaur', 'Panchayat Bhawan', 'Mandsaur', '458001',
  24.022, 75.102, 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&auto=format&fit=crop&q=80', 'Multanpura Village Kirana in Multanpura, Mandsaur. Serving verified Grocery & Daily Essentials with timely local delivery and counter pickup.',
  '07:00', '21:00', 'Multanpura', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4000000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000040', 'Basmati Rice 5 kg', 'Long-grain fragrant rice',
  350, 'Grocery & Daily Essentials', 45, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4000000-0000-0000-0000-000000000002', 'a4000000-0000-0000-0000-000000000040', 'Toor Dal 1 kg', 'Clean polished premium pulses',
  165, 'Grocery & Daily Essentials', 35, 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4000000-0000-0000-0000-000000000003', 'a4000000-0000-0000-0000-000000000040', 'Aashirvaad Shudh Chakki Atta 5 kg', '100% whole wheat flour',
  255, 'Grocery & Daily Essentials', 50, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4000000-0000-0000-0000-000000000004', 'a4000000-0000-0000-0000-000000000040', 'Fortune Sunflower Oil 1 L', 'Refined heart-healthy cooking oil',
  158, 'Grocery & Daily Essentials', 40, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4000000-0000-0000-0000-000000000005', 'a4000000-0000-0000-0000-000000000040', 'Tata Salt 1 kg', 'Vacuum evaporated iodized salt',
  38, 'Grocery & Daily Essentials', 80, 'https://images.unsplash.com/photo-1518110903419-548c7c9c0b11?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4000000-0000-0000-0000-000000000006', 'a4000000-0000-0000-0000-000000000040', 'Red Label Tea 500 g', 'Brooke Bond strong blended tea',
  270, 'Grocery & Daily Essentials', 30, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4000000-0000-0000-0000-000000000007', 'a4000000-0000-0000-0000-000000000040', 'Madhur Pure Sugar 1 kg', 'Refined sulfur-free crystals',
  62, 'Grocery & Daily Essentials', 65, 'https://images.unsplash.com/photo-1622484214149-14a9058b8d0e?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4000000-0000-0000-0000-000000000008', 'a4000000-0000-0000-0000-000000000040', 'Surf Excel Easy Wash 1 kg', 'Advanced stain removal detergent',
  150, 'Grocery & Daily Essentials', 25, 'https://images.unsplash.com/photo-1585670270608-b4be4fbcf05d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 41: Daloda Mandi Sabzi Depot (Daloda)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a4100000-0000-0000-0000-000000000041', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Daloda Mandi Sabzi Depot', 'Fresh Fruits & Vegetables', 'temporary',
  'Daloda, Mandsaur', 'Daloda Sub Mandi', 'Mandsaur', '458001',
  23.992, 75.081, 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&auto=format&fit=crop&q=80', 'Daloda Mandi Sabzi Depot in Daloda, Mandsaur. Serving verified Fresh Fruits & Vegetables with timely local delivery and counter pickup.',
  '06:30', '13:30', 'Daloda', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4100000-0000-0000-0000-000000000001', 'a4100000-0000-0000-0000-000000000041', 'Fresh Red Tomatoes 1 kg', 'Farm fresh juicy salad tomatoes',
  25, 'Fresh Fruits & Vegetables', 60, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4100000-0000-0000-0000-000000000002', 'a4100000-0000-0000-0000-000000000041', 'Desi Onions 1 kg', 'Fresh harvest pungent onions',
  20, 'Fresh Fruits & Vegetables', 75, 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4100000-0000-0000-0000-000000000003', 'a4100000-0000-0000-0000-000000000041', 'Pahadi Potatoes 1 kg', 'Clean starchy fresh potatoes',
  15, 'Fresh Fruits & Vegetables', 90, 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4100000-0000-0000-0000-000000000004', 'a4100000-0000-0000-0000-000000000041', 'Shimla Green Apples 1 kg', 'Crisp and sweet fresh apples',
  150, 'Fresh Fruits & Vegetables', 30, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4100000-0000-0000-0000-000000000005', 'a4100000-0000-0000-0000-000000000041', 'Robusta Bananas 1 Dozen', 'Naturally ripened sweet bananas',
  40, 'Fresh Fruits & Vegetables', 40, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4100000-0000-0000-0000-000000000006', 'a4100000-0000-0000-0000-000000000041', 'Spicy Green Chilies 250 g', 'Fresh pungent cooking chilies',
  10, 'Fresh Fruits & Vegetables', 50, 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4100000-0000-0000-0000-000000000007', 'a4100000-0000-0000-0000-000000000041', 'Fresh Ginger 250 g', 'Aromatic pungent desi adrak',
  20, 'Fresh Fruits & Vegetables', 35, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 42: Daloda Mega Provision Store (Daloda Center)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a4200000-0000-0000-0000-000000000042', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Daloda Mega Provision Store', 'Grocery & Daily Essentials', 'permanent',
  'Daloda Center, Mandsaur', 'Railway Gate Road', 'Mandsaur', '458001',
  23.988, 75.079, 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80', 'Daloda Mega Provision Store in Daloda Center, Mandsaur. Serving verified Grocery & Daily Essentials with timely local delivery and counter pickup.',
  '07:30', '21:30', 'Daloda Center', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4200000-0000-0000-0000-000000000001', 'a4200000-0000-0000-0000-000000000042', 'Basmati Rice 5 kg', 'Long-grain fragrant rice',
  335, 'Grocery & Daily Essentials', 45, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4200000-0000-0000-0000-000000000002', 'a4200000-0000-0000-0000-000000000042', 'Toor Dal 1 kg', 'Clean polished premium pulses',
  150, 'Grocery & Daily Essentials', 35, 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4200000-0000-0000-0000-000000000003', 'a4200000-0000-0000-0000-000000000042', 'Aashirvaad Shudh Chakki Atta 5 kg', '100% whole wheat flour',
  240, 'Grocery & Daily Essentials', 50, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4200000-0000-0000-0000-000000000004', 'a4200000-0000-0000-0000-000000000042', 'Fortune Sunflower Oil 1 L', 'Refined heart-healthy cooking oil',
  143, 'Grocery & Daily Essentials', 40, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4200000-0000-0000-0000-000000000005', 'a4200000-0000-0000-0000-000000000042', 'Tata Salt 1 kg', 'Vacuum evaporated iodized salt',
  23, 'Grocery & Daily Essentials', 80, 'https://images.unsplash.com/photo-1518110903419-548c7c9c0b11?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4200000-0000-0000-0000-000000000006', 'a4200000-0000-0000-0000-000000000042', 'Red Label Tea 500 g', 'Brooke Bond strong blended tea',
  255, 'Grocery & Daily Essentials', 30, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4200000-0000-0000-0000-000000000007', 'a4200000-0000-0000-0000-000000000042', 'Madhur Pure Sugar 1 kg', 'Refined sulfur-free crystals',
  47, 'Grocery & Daily Essentials', 65, 'https://images.unsplash.com/photo-1622484214149-14a9058b8d0e?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4200000-0000-0000-0000-000000000008', 'a4200000-0000-0000-0000-000000000042', 'Surf Excel Easy Wash 1 kg', 'Advanced stain removal detergent',
  135, 'Grocery & Daily Essentials', 25, 'https://images.unsplash.com/photo-1585670270608-b4be4fbcf05d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 43: Sitamau Phata Highway Mart (Sitamau Road)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a4300000-0000-0000-0000-000000000043', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Sitamau Phata Highway Mart', 'Grocery & Daily Essentials', 'permanent',
  'Sitamau Road, Mandsaur', 'Phata Junction', 'Mandsaur', '458001',
  24.125, 75.132, 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&auto=format&fit=crop&q=80', 'Sitamau Phata Highway Mart in Sitamau Road, Mandsaur. Serving verified Grocery & Daily Essentials with timely local delivery and counter pickup.',
  '06:00', '23:00', 'Sitamau Road', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4300000-0000-0000-0000-000000000001', 'a4300000-0000-0000-0000-000000000043', 'Basmati Rice 5 kg', 'Long-grain fragrant rice',
  340, 'Grocery & Daily Essentials', 45, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4300000-0000-0000-0000-000000000002', 'a4300000-0000-0000-0000-000000000043', 'Toor Dal 1 kg', 'Clean polished premium pulses',
  155, 'Grocery & Daily Essentials', 35, 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4300000-0000-0000-0000-000000000003', 'a4300000-0000-0000-0000-000000000043', 'Aashirvaad Shudh Chakki Atta 5 kg', '100% whole wheat flour',
  245, 'Grocery & Daily Essentials', 50, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4300000-0000-0000-0000-000000000004', 'a4300000-0000-0000-0000-000000000043', 'Fortune Sunflower Oil 1 L', 'Refined heart-healthy cooking oil',
  148, 'Grocery & Daily Essentials', 40, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4300000-0000-0000-0000-000000000005', 'a4300000-0000-0000-0000-000000000043', 'Tata Salt 1 kg', 'Vacuum evaporated iodized salt',
  28, 'Grocery & Daily Essentials', 80, 'https://images.unsplash.com/photo-1518110903419-548c7c9c0b11?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4300000-0000-0000-0000-000000000006', 'a4300000-0000-0000-0000-000000000043', 'Red Label Tea 500 g', 'Brooke Bond strong blended tea',
  260, 'Grocery & Daily Essentials', 30, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4300000-0000-0000-0000-000000000007', 'a4300000-0000-0000-0000-000000000043', 'Madhur Pure Sugar 1 kg', 'Refined sulfur-free crystals',
  52, 'Grocery & Daily Essentials', 65, 'https://images.unsplash.com/photo-1622484214149-14a9058b8d0e?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4300000-0000-0000-0000-000000000008', 'a4300000-0000-0000-0000-000000000043', 'Surf Excel Easy Wash 1 kg', 'Advanced stain removal detergent',
  140, 'Grocery & Daily Essentials', 25, 'https://images.unsplash.com/photo-1585670270608-b4be4fbcf05d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 44: Highway Farmers Fresh Cart (Highway Toll Road)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a4400000-0000-0000-0000-000000000044', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Highway Farmers Fresh Cart', 'Fresh Fruits & Vegetables', 'temporary',
  'Highway Toll Road, Mandsaur', 'Near Toll Plaza', 'Mandsaur', '458001',
  24.135, 75.02, 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=800&auto=format&fit=crop&q=80', 'Highway Farmers Fresh Cart in Highway Toll Road, Mandsaur. Serving verified Fresh Fruits & Vegetables with timely local delivery and counter pickup.',
  '07:00', '20:00', 'Highway Toll Road', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4400000-0000-0000-0000-000000000001', 'a4400000-0000-0000-0000-000000000044', 'Fresh Red Tomatoes 1 kg', 'Farm fresh juicy salad tomatoes',
  40, 'Fresh Fruits & Vegetables', 60, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4400000-0000-0000-0000-000000000002', 'a4400000-0000-0000-0000-000000000044', 'Desi Onions 1 kg', 'Fresh harvest pungent onions',
  35, 'Fresh Fruits & Vegetables', 75, 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4400000-0000-0000-0000-000000000003', 'a4400000-0000-0000-0000-000000000044', 'Pahadi Potatoes 1 kg', 'Clean starchy fresh potatoes',
  30, 'Fresh Fruits & Vegetables', 90, 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4400000-0000-0000-0000-000000000004', 'a4400000-0000-0000-0000-000000000044', 'Shimla Green Apples 1 kg', 'Crisp and sweet fresh apples',
  165, 'Fresh Fruits & Vegetables', 30, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4400000-0000-0000-0000-000000000005', 'a4400000-0000-0000-0000-000000000044', 'Robusta Bananas 1 Dozen', 'Naturally ripened sweet bananas',
  55, 'Fresh Fruits & Vegetables', 40, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4400000-0000-0000-0000-000000000006', 'a4400000-0000-0000-0000-000000000044', 'Spicy Green Chilies 250 g', 'Fresh pungent cooking chilies',
  25, 'Fresh Fruits & Vegetables', 50, 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4400000-0000-0000-0000-000000000007', 'a4400000-0000-0000-0000-000000000044', 'Fresh Ginger 250 g', 'Aromatic pungent desi adrak',
  35, 'Fresh Fruits & Vegetables', 35, 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 45: Suwasra Link Agro Supplies (Suwasra Link Road)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a4500000-0000-0000-0000-000000000045', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Suwasra Link Agro Supplies', 'Hardware & Tools', 'permanent',
  'Suwasra Link Road, Mandsaur', 'Suwasra Turn', 'Mandsaur', '458001',
  24.038, 75.161, 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&auto=format&fit=crop&q=80', 'Suwasra Link Agro Supplies in Suwasra Link Road, Mandsaur. Serving verified Hardware & Tools with timely local delivery and counter pickup.',
  '08:30', '19:00', 'Suwasra Link Road', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4500000-0000-0000-0000-000000000001', 'a4500000-0000-0000-0000-000000000045', 'Heavy Duty Claw Hammer 500g', 'Drop-forged steel with rubber grip',
  230, 'Hardware & Tools', 30, 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4500000-0000-0000-0000-000000000002', 'a4500000-0000-0000-0000-000000000045', 'Godrej Nav-Tal 7 Levers Brass Padlock', 'Hardened shackle high-security lock',
  420, 'Hardware & Tools', 24, 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4500000-0000-0000-0000-000000000003', 'a4500000-0000-0000-0000-000000000045', 'Stanley 5m Steel Measuring Tape', 'Polymer-coated corrosion resistant tape',
  170, 'Hardware & Tools', 40, 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4500000-0000-0000-0000-000000000004', 'a4500000-0000-0000-0000-000000000045', 'Stainless Steel Screws Assortment Box', '300-piece assorted drywall and wood screws',
  190, 'Hardware & Tools', 50, 'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4500000-0000-0000-0000-000000000005', 'a4500000-0000-0000-0000-000000000045', 'Teflon Thread Seal Tape (Pack of 5)', 'Plumber tape for water leak prevention',
  85, 'Hardware & Tools', 70, 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4500000-0000-0000-0000-000000000006', 'a4500000-0000-0000-0000-000000000045', 'Tap Spindle Brass Replacement 1/2 inch', 'Heavy ceramic disc tap valve core',
  120, 'Hardware & Tools', 35, 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 46: Daloda Health Care & Chemist (Daloda)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a4600000-0000-0000-0000-000000000046', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Daloda Health Care & Chemist', 'Pharmacy & Wellness', 'permanent',
  'Daloda, Mandsaur', 'Bus Stand Daloda', 'Mandsaur', '458001',
  23.991, 75.083, 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=80', 'Daloda Health Care & Chemist in Daloda, Mandsaur. Serving verified Pharmacy & Wellness with timely local delivery and counter pickup.',
  '08:00', '21:30', 'Daloda', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4600000-0000-0000-0000-000000000001', 'a4600000-0000-0000-0000-000000000046', 'Dolo 650mg Paracetamol Tablets 15s', 'Fever and pain relief medication strip',
  22, 'Pharmacy & Wellness', 80, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4600000-0000-0000-0000-000000000002', 'a4600000-0000-0000-0000-000000000046', 'Dettol Antiseptic Liquid 250ml', 'Trusted disinfectant for cuts and hygiene',
  115, 'Pharmacy & Wellness', 40, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4600000-0000-0000-0000-000000000003', 'a4600000-0000-0000-0000-000000000046', 'Volini Joint & Muscle Pain Relief Spray 55g', 'Quick absorption micro-gel formulation',
  145, 'Pharmacy & Wellness', 30, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4600000-0000-0000-0000-000000000004', 'a4600000-0000-0000-0000-000000000046', 'Digene Acidity & Gas Relief Mint Gel 200ml', 'Fast cooling soothing antacid syrup',
  135, 'Pharmacy & Wellness', 25, 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4600000-0000-0000-0000-000000000005', 'a4600000-0000-0000-0000-000000000046', 'Band-Aid Washproof Strips Box of 20', 'Sterile protective wound dressing band',
  50, 'Pharmacy & Wellness', 60, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 47: Piplia Road Sweets & Snacks (Piplia Road)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a4700000-0000-0000-0000-000000000047', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Piplia Road Sweets & Snacks', 'Sweets, Bakery & Snacks', 'permanent',
  'Piplia Road, Mandsaur', 'Highway Midway', 'Mandsaur', '458001',
  24.148, 75.032, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80', 'Piplia Road Sweets & Snacks in Piplia Road, Mandsaur. Serving verified Sweets, Bakery & Snacks with timely local delivery and counter pickup.',
  '07:00', '22:00', 'Piplia Road', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4700000-0000-0000-0000-000000000001', 'a4700000-0000-0000-0000-000000000047', 'Famous Mandsaur Ratlami Sev 500g', 'Authentic spicy clove-infused gram flour sev',
  135, 'Sweets, Bakery & Snacks', 45, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4700000-0000-0000-0000-000000000002', 'a4700000-0000-0000-0000-000000000047', 'Shudh Mawa Peda 500g', 'Traditional milk fudge garnished with cardamom',
  235, 'Sweets, Bakery & Snacks', 20, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4700000-0000-0000-0000-000000000003', 'a4700000-0000-0000-0000-000000000047', 'Desi Ghee Kaju Katli 250g', 'Rich melt-in-mouth cashew diamond sweets',
  255, 'Sweets, Bakery & Snacks', 25, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4700000-0000-0000-0000-000000000004', 'a4700000-0000-0000-0000-000000000047', 'Crispy Maskachaska Khari 400g', 'Fresh baked flaky tea-time puff pastry',
  75, 'Sweets, Bakery & Snacks', 35, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4700000-0000-0000-0000-000000000005', 'a4700000-0000-0000-0000-000000000047', 'Eggless Belgian Chocolate Cake 500g', 'Fresh baked creamy dark chocolate celebration cake',
  375, 'Sweets, Bakery & Snacks', 10, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 48: Guradia Rural Electricals (Guradia Deda)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a4800000-0000-0000-0000-000000000048', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Guradia Rural Electricals', 'Home & Electrical Essentials', 'permanent',
  'Guradia Deda, Mandsaur', 'Main Village Square', 'Mandsaur', '458001',
  24.045, 75.021, 'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=800&auto=format&fit=crop&q=80', 'Guradia Rural Electricals in Guradia Deda, Mandsaur. Serving verified Home & Electrical Essentials with timely local delivery and counter pickup.',
  '09:00', '20:00', 'Guradia Deda', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4800000-0000-0000-0000-000000000001', 'a4800000-0000-0000-0000-000000000048', 'Philips 9W LED Bulb B22', 'Cool daylight energy saving bulb',
  85, 'Home & Electrical Essentials', 50, 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4800000-0000-0000-0000-000000000002', 'a4800000-0000-0000-0000-000000000048', 'Havells 4-Way Extension Board', 'Surge protected 2m cord strip',
  380, 'Home & Electrical Essentials', 20, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4800000-0000-0000-0000-000000000003', 'a4800000-0000-0000-0000-000000000048', 'Anchor Roma 1-Way Switch 6A', 'Modular white flame retardant switch',
  42, 'Home & Electrical Essentials', 100, 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4800000-0000-0000-0000-000000000004', 'a4800000-0000-0000-0000-000000000048', 'Syska Rechargeable Mosquito Swatter', 'Electric insect racket with LED',
  299, 'Home & Electrical Essentials', 25, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4800000-0000-0000-0000-000000000005', 'a4800000-0000-0000-0000-000000000048', 'Polycab 1.5 sq mm Wire 90m', 'FR PVC insulated copper wire coil',
  1450, 'Home & Electrical Essentials', 15, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4800000-0000-0000-0000-000000000006', 'a4800000-0000-0000-0000-000000000048', 'Crompton 1200mm Ceiling Fan', 'High-speed energy efficient fan',
  1850, 'Home & Electrical Essentials', 12, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 49: Sitamau Road Stationery & Cyber (Sitamau Road)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a4900000-0000-0000-0000-000000000049', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Sitamau Road Stationery & Cyber', 'Stationery & Study Essentials', 'permanent',
  'Sitamau Road, Mandsaur', 'Near High School', 'Mandsaur', '458001',
  24.12, 75.128, 'https://images.unsplash.com/photo-1507842229451-77b103b47453?w=800&auto=format&fit=crop&q=80', 'Sitamau Road Stationery & Cyber in Sitamau Road, Mandsaur. Serving verified Stationery & Study Essentials with timely local delivery and counter pickup.',
  '08:30', '20:00', 'Sitamau Road', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4900000-0000-0000-0000-000000000001', 'a4900000-0000-0000-0000-000000000049', 'Classmate Spiral Notebook 300 Pages', 'Single line ruled notebook with divider',
  120, 'Stationery & Study Essentials', 60, 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4900000-0000-0000-0000-000000000002', 'a4900000-0000-0000-0000-000000000049', 'Reynolds 045 Ball Pens Pack of 10', 'Smooth smudge-free blue ballpoint pens',
  85, 'Stationery & Study Essentials', 70, 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4900000-0000-0000-0000-000000000003', 'a4900000-0000-0000-0000-000000000049', 'JK Copier A4 Paper 75 GSM 500 Sheets', 'Ultra-white high-speed photocopy ream',
  345, 'Stationery & Study Essentials', 30, 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4900000-0000-0000-0000-000000000004', 'a4900000-0000-0000-0000-000000000049', 'Camlin 12 Shades Acrylic Colours Set', 'Vibrant fast-drying hobby paints with brush',
  200, 'Stationery & Study Essentials', 25, 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4900000-0000-0000-0000-000000000005', 'a4900000-0000-0000-0000-000000000049', 'Casio Scientific Calculator FX-82MS', '240 functions 2-line display student calculator',
  585, 'Stationery & Study Essentials', 15, 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b4900000-0000-0000-0000-000000000006', 'a4900000-0000-0000-0000-000000000049', 'Fevicol MR Squeezy Glue Bottle 200g', 'Strong craft adhesive for paper and wood',
  60, 'Stationery & Study Essentials', 45, 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- Shop 50: Toll Plaza Highway Dhaba & Sweets (Fourlane Highway)
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  'a5000000-0000-0000-0000-000000000050', '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90', 'Toll Plaza Highway Dhaba & Sweets', 'Sweets, Bakery & Snacks', 'permanent',
  'Fourlane Highway, Mandsaur', 'Midway Parking', 'Mandsaur', '458001',
  24.138, 75.018, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80', 'Toll Plaza Highway Dhaba & Sweets in Fourlane Highway, Mandsaur. Serving verified Sweets, Bakery & Snacks with timely local delivery and counter pickup.',
  '06:00', '23:30', 'Fourlane Highway', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b5000000-0000-0000-0000-000000000001', 'a5000000-0000-0000-0000-000000000050', 'Famous Mandsaur Ratlami Sev 500g', 'Authentic spicy clove-infused gram flour sev',
  150, 'Sweets, Bakery & Snacks', 45, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b5000000-0000-0000-0000-000000000002', 'a5000000-0000-0000-0000-000000000050', 'Shudh Mawa Peda 500g', 'Traditional milk fudge garnished with cardamom',
  250, 'Sweets, Bakery & Snacks', 20, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b5000000-0000-0000-0000-000000000003', 'a5000000-0000-0000-0000-000000000050', 'Desi Ghee Kaju Katli 250g', 'Rich melt-in-mouth cashew diamond sweets',
  270, 'Sweets, Bakery & Snacks', 25, 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b5000000-0000-0000-0000-000000000004', 'a5000000-0000-0000-0000-000000000050', 'Crispy Maskachaska Khari 400g', 'Fresh baked flaky tea-time puff pastry',
  90, 'Sweets, Bakery & Snacks', 35, 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  'b5000000-0000-0000-0000-000000000005', 'a5000000-0000-0000-0000-000000000050', 'Eggless Belgian Chocolate Cake 500g', 'Fresh baked creamy dark chocolate celebration cake',
  390, 'Sweets, Bakery & Snacks', 10, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';

-- 6. Updated Nearby Products RPC with Status Filter and Shop Details
create or replace function public.nearby_products(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision default 10.0,
  search_text text default null
)
returns table (
  id uuid,
  shop_id uuid,
  title text,
  description text,
  price numeric,
  category text,
  stock integer,
  image_url text,
  created_at timestamptz,
  last_updated_at timestamptz,
  status text,
  shop_name text,
  shop_category text,
  shop_type text,
  shop_address text,
  current_area text,
  distance_km double precision,
  avg_rating numeric,
  reviews_count bigint
)
language sql
stable
as $$
  select
    p.id,
    p.shop_id,
    p.title,
    p.description,
    p.price,
    p.category,
    p.stock,
    p.image_url,
    p.created_at,
    p.last_updated_at,
    p.status,
    s.shop_name,
    s.category as shop_category,
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
    count(r.id) as reviews_count
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
$$;

-- 7. Updated Nearby Shops RPC with Avg Rating
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
