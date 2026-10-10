-- =========================================================================
-- NearGO Complete Database Setup & Realistic Mandsaur Seed Data
-- Run this script in your Supabase SQL Editor.
-- =========================================================================

-- 1. Ensure extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. Configure RLS Policies for All Tables (Ensure Public Read & User Write)

-- Profiles
alter table public.profiles enable row level security;
drop policy if exists "Allow public read on profiles" on public.profiles;
create policy "Allow public read on profiles" on public.profiles for select using (true);
drop policy if exists "Allow users insert own profile" on public.profiles;
create policy "Allow users insert own profile" on public.profiles for insert with check (true);
drop policy if exists "Allow users update own profile" on public.profiles;
create policy "Allow users update own profile" on public.profiles for update using (auth.uid() = id or auth.uid() is not null);

-- Seller Profiles
alter table public.seller_profiles enable row level security;
drop policy if exists "Allow public read on seller_profiles" on public.seller_profiles;
create policy "Allow public read on seller_profiles" on public.seller_profiles for select using (true);
drop policy if exists "Allow users manage seller_profiles" on public.seller_profiles;
create policy "Allow users manage seller_profiles" on public.seller_profiles for all using (true) with check (true);

-- Seller Locations
alter table public.seller_locations enable row level security;
drop policy if exists "Allow public read on seller_locations" on public.seller_locations;
create policy "Allow public read on seller_locations" on public.seller_locations for select using (true);
drop policy if exists "Allow users manage seller_locations" on public.seller_locations;
create policy "Allow users manage seller_locations" on public.seller_locations for all using (true) with check (true);

-- Inventory Items
alter table public.inventory_items enable row level security;
drop policy if exists "Allow public read on inventory_items" on public.inventory_items;
create policy "Allow public read on inventory_items" on public.inventory_items for select using (true);
drop policy if exists "Allow users manage inventory_items" on public.inventory_items;
create policy "Allow users manage inventory_items" on public.inventory_items for all using (true) with check (true);

-- Reservations
alter table public.reservations enable row level security;
drop policy if exists "Allow public read on reservations" on public.reservations;
create policy "Allow public read on reservations" on public.reservations for select using (true);
drop policy if exists "Allow users manage reservations" on public.reservations;
create policy "Allow users manage reservations" on public.reservations for all using (true) with check (true);

-- 3. Compatibility Views (Maps seller_profiles + seller_locations to shops & products)
drop view if exists public.shops cascade;
create or replace view public.shops as
select 
  sp.id,
  sp.user_id as owner_id,
  coalesce(sp.business_name, sp.owner_name, 'Local Shop') as shop_name,
  sp.owner_name,
  coalesce(sp.category, 'General Store') as category,
  coalesce(sp.seller_type, 'permanent') as shop_type,
  sl.shop_address as address,
  sl.base_area as current_area,
  'Mandsaur' as city,
  '458001' as pincode,
  coalesce(sl.latitude, 24.0722) as latitude,
  coalesce(sl.longitude, 75.0683) as longitude,
  sp.photo_url as shop_image,
  coalesce(sl.opening_time::text, '09:00:00') as opening_time,
  coalesce(sl.closing_time::text, '21:00:00') as closing_time,
  coalesce(sl.is_here_now, true) as is_live,
  sp.phone,
  sp.email,
  sp.created_at
from public.seller_profiles sp
left join public.seller_locations sl on sl.seller_id = sp.id;

drop view if exists public.products cascade;
create or replace view public.products as
select 
  ii.id,
  ii.seller_id as shop_id,
  ii.item_name as title,
  ii.item_name as description,
  ii.price,
  coalesce(sp.category, 'General') as category,
  coalesce(ii.quantity, 10) as stock,
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=85' as image_url,
  'active' as status,
  ii.created_at,
  ii.updated_at as last_updated_at
from public.inventory_items ii
left join public.seller_profiles sp on sp.id = ii.seller_id;

-- 4. Spatial Distance Search RPC Function
create or replace function public.nearby_shops(
  user_lat float8,
  user_lng float8,
  radius_km float8 default 5.0
)
returns table (
  id uuid,
  shop_name text,
  category text,
  shop_type text,
  address text,
  latitude float8,
  longitude float8,
  is_live boolean,
  distance_km float8
)
language sql
stable
as $$
  select 
    sp.id,
    coalesce(sp.business_name, sp.owner_name, 'Local Shop')::text as shop_name,
    coalesce(sp.category, 'General Store')::text as category,
    coalesce(sp.seller_type, 'permanent')::text as shop_type,
    coalesce(sl.shop_address, 'Mandsaur')::text as address,
    sl.latitude,
    sl.longitude,
    coalesce(sl.is_here_now, true) as is_live,
    round((6371 * acos(
      least(1.0, greatest(-1.0, 
        cos(radians(user_lat)) * cos(radians(sl.latitude)) * 
        cos(radians(sl.longitude) - radians(user_lng)) + 
        sin(radians(user_lat)) * sin(radians(sl.latitude))
      ))
    ))::numeric, 2)::float8 as distance_km
  from public.seller_profiles sp
  join public.seller_locations sl on sl.seller_id = sp.id
  where sl.latitude is not null and sl.longitude is not null
    and (6371 * acos(
      least(1.0, greatest(-1.0, 
        cos(radians(user_lat)) * cos(radians(sl.latitude)) * 
        cos(radians(sl.longitude) - radians(user_lng)) + 
        sin(radians(user_lat)) * sin(radians(sl.latitude))
      ))
    )) <= radius_km
  order by distance_km asc;
$$;

-- 5. Insert Realistic Mandsaur Seed Data (Shops & Inventory Items)
do $$
declare
  s1 uuid := gen_random_uuid();
  s2 uuid := gen_random_uuid();
  s3 uuid := gen_random_uuid();
  s4 uuid := gen_random_uuid();
  s5 uuid := gen_random_uuid();
  s6 uuid := gen_random_uuid();
  s7 uuid := gen_random_uuid();
  s8 uuid := gen_random_uuid();
  s9 uuid := gen_random_uuid();
  s10 uuid := gen_random_uuid();
  s11 uuid := gen_random_uuid();
  s12 uuid := gen_random_uuid();
begin
  -- Clear existing fake data if you want fresh seed (optional)
  -- delete from public.inventory_items;
  -- delete from public.seller_locations;
  -- delete from public.seller_profiles;

  -- 1. Shri Krishna Dairy & Sweets (Gandhi Chouraha - 0.4 km)
  insert into public.seller_profiles (id, business_name, owner_name, category, seller_type, email, phone, photo_url)
  values (s1, 'Shri Krishna Dairy & Sweets', 'Gopal Sharma', 'Dairy & Sweets', 'permanent', 'krishna.dairy@neargo.in', '9826111222', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&auto=format&fit=crop&q=80')
  on conflict do nothing;

  insert into public.seller_locations (seller_id, shop_address, base_area, latitude, longitude, opening_time, closing_time, is_here_now)
  values (s1, 'Shop No 14, Near Gandhi Chouraha, Mandsaur', 'Gandhi Chouraha', 24.0735, 75.0695, '07:00:00', '22:00:00', true)
  on conflict do nothing;

  insert into public.inventory_items (seller_id, item_name, quantity, unit, price, is_available) values
  (s1, 'Fresh Pure Cow Milk 1L', 60, 'Liter', 62, true),
  (s1, 'Fresh Buffalo Milk 1L', 80, 'Liter', 70, true),
  (s1, 'Fresh Malai Paneer 500g', 35, 'Pack', 180, true),
  (s1, 'Desi Ghee 1L Tin', 20, 'Jar', 650, true),
  (s1, 'Fresh Curd / Dahi 1kg', 40, 'kg', 80, true),
  (s1, 'Special Mandsaur Peda 500g', 25, 'Box', 220, true),
  (s1, 'Gulab Jamun Fresh (10 pcs)', 30, 'Box', 150, true),
  (s1, 'Chilled Masala Chhaachh 500ml', 50, 'Bottle', 25, true)
  on conflict do nothing;

  -- 2. Patidar Kirana & Supermarket (Kalakhet - 1.1 km)
  insert into public.seller_profiles (id, business_name, owner_name, category, seller_type, email, phone, photo_url)
  values (s2, 'Patidar Kirana & Supermarket', 'Ramesh Patidar', 'Grocery', 'permanent', 'patidar.kirana@neargo.in', '9826222333', 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80')
  on conflict do nothing;

  insert into public.seller_locations (seller_id, shop_address, base_area, latitude, longitude, opening_time, closing_time, is_here_now)
  values (s2, 'Main Road, Kalakhet Market, Mandsaur', 'Kalakhet', 24.0768, 75.0645, '08:00:00', '21:30:00', true)
  on conflict do nothing;

  insert into public.inventory_items (seller_id, item_name, quantity, unit, price, is_available) values
  (s2, 'Fortune Sunlite Refined Oil 1L', 45, 'Pouch', 135, true),
  (s2, 'Aashirvaad Shudh Chakki Atta 10kg', 30, 'Bag', 420, true),
  (s2, 'Daawat Rozana Basmati Rice 5kg', 25, 'Bag', 380, true),
  (s2, 'Tata Salt Vacuum Evaporated 1kg', 100, 'Pack', 28, true),
  (s2, 'Madhur Pure Sugar 5kg', 30, 'Bag', 225, true),
  (s2, 'Tata Tea Gold Premium 500g', 40, 'Pack', 290, true),
  (s2, 'Toor Dal Premium 1kg', 50, 'kg', 165, true),
  (s2, 'Everest Garam Masala 100g', 60, 'Box', 85, true)
  on conflict do nothing;

  -- 3. Mahaveer Medicos & Healthcare (Station Road - 2.0 km)
  insert into public.seller_profiles (id, business_name, owner_name, category, seller_type, email, phone, photo_url)
  values (s3, 'Mahaveer Medicos & Healthcare', 'Dr. Alok Jain', 'Pharmacy', 'permanent', 'mahaveer.pharma@neargo.in', '9826333444', 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=800&auto=format&fit=crop&q=80')
  on conflict do nothing;

  insert into public.seller_locations (seller_id, shop_address, base_area, latitude, longitude, opening_time, closing_time, is_here_now)
  values (s3, 'Opposite Railway Hospital, Station Road, Mandsaur', 'Station Road', 24.0620, 75.0740, '08:00:00', '23:00:00', true)
  on conflict do nothing;

  insert into public.inventory_items (seller_id, item_name, quantity, unit, price, is_available) values
  (s3, 'Dolo 650mg Paracetamol Tablets (15 pcs)', 100, 'Strip', 32, true),
  (s3, 'Crocin Advance Pain Relief (15 pcs)', 80, 'Strip', 25, true),
  (s3, 'Volini Pain Relief Gel 50g', 40, 'Tube', 145, true),
  (s3, 'Dettol Antiseptic Liquid 250ml', 50, 'Bottle', 125, true),
  (s3, 'Benadryl Cough Syrup 100ml', 35, 'Bottle', 115, true),
  (s3, 'Digital Thermometer Waterproof', 25, 'Piece', 190, true),
  (s3, 'ORSL Electrolyte Energy Drink 200ml', 60, 'Tetra', 45, true),
  (s3, 'Band-Aid First Aid Washproof (10 pcs)', 120, 'Pack', 30, true)
  on conflict do nothing;

  -- 4. Saraswati Book Depot & Stationery (Nai Abaadi - 1.6 km)
  insert into public.seller_profiles (id, business_name, owner_name, category, seller_type, email, phone, photo_url)
  values (s4, 'Saraswati Book Depot & Stationery', 'Sunil Tiwari', 'Stationery', 'permanent', 'saraswati.books@neargo.in', '9826444555', 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=800&auto=format&fit=crop&q=80')
  on conflict do nothing;

  insert into public.seller_locations (seller_id, shop_address, base_area, latitude, longitude, opening_time, closing_time, is_here_now)
  values (s4, 'Near Govt College, Nai Abaadi, Mandsaur', 'Nai Abaadi', 24.0810, 75.0720, '09:00:00', '21:00:00', true)
  on conflict do nothing;

  insert into public.inventory_items (seller_id, item_name, quantity, unit, price, is_available) values
  (s4, 'Classmate Long Ruled Notebook 172 pgs', 120, 'Piece', 55, true),
  (s4, 'Reynolds 045 Fine Ball Pens (Pack of 5)', 80, 'Pack', 50, true),
  (s4, 'Doms A1 Drawing Book & Color Set', 40, 'Set', 160, true),
  (s4, 'A4 Copy Paper Bundle 500 Sheets 75GSM', 30, 'Ream', 290, true),
  (s4, 'Apsara Platinum Extra Dark Pencils (10 pcs)', 90, 'Box', 60, true),
  (s4, 'Kangaro Stapler No 10 with Pins', 50, 'Set', 85, true),
  (s4, 'Fevistick Glue Stick 15g', 100, 'Piece', 35, true)
  on conflict do nothing;

  -- 5. Malwa Fresh Fruits & Organic Sabzi (Moving Vendor - YPS Circle 3.2 km)
  insert into public.seller_profiles (id, business_name, owner_name, category, seller_type, email, phone, photo_url)
  values (s5, 'Malwa Fresh Fruits & Vegetables', 'Kailash Mali', 'Fruits & Vegetables', 'temporary', 'malwa.fruits@neargo.in', '9826555666', 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&auto=format&fit=crop&q=80')
  on conflict do nothing;

  insert into public.seller_locations (seller_id, shop_address, base_area, latitude, longitude, opening_time, closing_time, is_here_now)
  values (s5, 'Mobile Cart, YPS Circle to Bus Stand, Mandsaur', 'YPS Circle', 24.0880, 75.0590, '07:30:00', '20:30:00', true)
  on conflict do nothing;

  insert into public.inventory_items (seller_id, item_name, quantity, unit, price, is_available) values
  (s5, 'Fresh Shimla Red Apples 1kg', 30, 'kg', 140, true),
  (s5, 'Robusta Fresh Bananas 1 Dozen', 40, 'Dozen', 50, true),
  (s5, 'Fresh Hybrid Tomatoes 1kg', 50, 'kg', 35, true),
  (s5, 'New Crop Desi Potatoes / Aloo 1kg', 80, 'kg', 25, true),
  (s5, 'Nasik Fresh Onions / Pyaz 1kg', 60, 'kg', 40, true),
  (s5, 'Fresh Green Coriander & Chillies', 40, 'Bundle', 20, true),
  (s5, 'Nagpur Fresh Sweet Oranges 1kg', 35, 'kg', 80, true)
  on conflict do nothing;

  -- 6. Balaji Hardware & Electricals (Khanpura - 4.5 km)
  insert into public.seller_profiles (id, business_name, owner_name, category, seller_type, email, phone, photo_url)
  values (s6, 'Balaji Hardware & Sanitary', 'Manish Gupta', 'Hardware', 'permanent', 'balaji.hardware@neargo.in', '9826666777', 'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&auto=format&fit=crop&q=80')
  on conflict do nothing;

  insert into public.seller_locations (seller_id, shop_address, base_area, latitude, longitude, opening_time, closing_time, is_here_now)
  values (s6, 'Khanpura Main Road, Near Old Bridge, Mandsaur', 'Khanpura', 24.0610, 75.0980, '09:00:00', '20:30:00', true)
  on conflict do nothing;

  insert into public.inventory_items (seller_id, item_name, quantity, unit, price, is_available) values
  (s6, 'Philips LED Bulb 9W Cool Daylight', 70, 'Piece', 95, true),
  (s6, 'Asian Paints Tractor Emulsion White 4L', 20, 'Bucket', 650, true),
  (s6, 'Anchor 6A 3-Pin Multi Plug Adaptor', 50, 'Piece', 75, true),
  (s6, 'Tap Brass Heavy Quality 1/2 inch', 30, 'Piece', 220, true),
  (s6, 'Stanley Steel Measuring Tape 5m', 25, 'Piece', 180, true)
  on conflict do nothing;

  -- 7. Shiv Shakti Fast Food & Poha Center (Semi-Fixed Vendor - BPL Chouraha 1.8 km)
  insert into public.seller_profiles (id, business_name, owner_name, category, seller_type, email, phone, photo_url)
  values (s7, 'Shiv Shakti Fast Food & Namkeen', 'Rajendra Solanki', 'Fast Food', 'temporary', 'shiv.fastfood@neargo.in', '9826777888', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80')
  on conflict do nothing;

  insert into public.seller_locations (seller_id, shop_address, base_area, latitude, longitude, opening_time, closing_time, is_here_now)
  values (s7, 'Kiosk 3, BPL Chouraha, Mandsaur', 'BPL Chouraha', 24.0680, 75.0600, '06:30:00', '22:00:00', true)
  on conflict do nothing;

  insert into public.inventory_items (seller_id, item_name, quantity, unit, price, is_available) values
  (s7, 'Hot Malwi Sev Usal Poha Plate', 100, 'Plate', 25, true),
  (s7, 'Khasta Dal Kachori with Chutney (2 pcs)', 80, 'Plate', 30, true),
  (s7, 'Crispy Aloo Samosa (2 pcs)', 90, 'Plate', 30, true),
  (s7, 'Special Mandsauri Ujjaini Sev 500g', 40, 'Pouch', 110, true),
  (s7, 'Ratlami Laung Sev 500g', 50, 'Pouch', 120, true)
  on conflict do nothing;

end $$;

