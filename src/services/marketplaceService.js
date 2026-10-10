import { supabase } from "../supabaseClient";
import { customerProducts as mockProducts, customerShops as mockShops } from "../Customer/customerData";

// Earth radius in kilometers
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);
  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) return null;

  const R = 6371;
  const dLat = (nLat2 - nLat1) * (Math.PI / 180);
  const dLon = (nLon2 - nLon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(nLat1 * (Math.PI / 180)) *
      Math.cos(nLat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

// Default Mandsaur center coordinates
export const MANDSAUR_COORDS = { lat: 24.0722, lng: 75.0683 };

/**
 * 1. Fetch nearby shops within a radius (in km)
 * Calls public.nearby_shops(user_lat, user_lng, radius_km)
 * Falls back to querying `shops` table directly or local data if empty.
 */
export async function getNearbyShops(userLat = MANDSAUR_COORDS.lat, userLng = MANDSAUR_COORDS.lng, radiusKm = 5) {
  try {
    // 1. Try RPC function
    const { data: rpcData, error: rpcError } = await supabase.rpc("nearby_shops", {
      user_lat: Number(userLat),
      user_lng: Number(userLng),
      radius_km: Number(radiusKm),
    });

    if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
      return rpcData.map((s) => ({
        ...s,
        distance: s.distance_km != null ? `${Number(s.distance_km).toFixed(1)} km` : "Nearby",
        distanceKm: s.distance_km != null ? Number(s.distance_km) : null,
      }));
    }

    // 2. Fallback to direct shops table query
    const { data: tableData, error: tableError } = await supabase
      .from("shops")
      .select("*");

    if (!tableError && Array.isArray(tableData) && tableData.length > 0) {
      return tableData
        .map((s) => {
          const dist = calculateDistanceKm(userLat, userLng, s.latitude, s.longitude);
          return {
            ...s,
            distance: dist != null ? `${dist} km` : "Nearby",
            distanceKm: dist,
          };
        })
        .filter((s) => s.distanceKm == null || s.distanceKm <= radiusKm)
        .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }
  } catch (err) {
    console.warn("getNearbyShops error:", err);
  }

  // 3. Fallback to mock Mandsaur shops if DB is empty
  const fallbackList = Object.values(mockShops).map((s, idx) => ({
    id: s.id || `shop-${idx + 1}`,
    shop_name: s.name,
    category: s.category,
    address: s.address,
    city: s.city || "Mandsaur",
    phone: s.phone,
    rating: s.rating,
    is_live: true,
    shop_type: "permanent",
    distance: s.distance || "1.2 km",
    distanceKm: parseFloat(s.distance) || 1.2,
  }));

  return fallbackList.filter((s) => (s.distanceKm || 0) <= radiusKm);
}

/**
 * 2. Fetch nearby products with sequential radius expansion:
 * Checks radiusKm first; if 0 results, sequentially checks [4, 5, 8, 10] km.
 * Returns: { products, radiusChecked, message, isExpanded }
 */
export async function getNearbyProducts(
  userLat = MANDSAUR_COORDS.lat,
  userLng = MANDSAUR_COORDS.lng,
  selectedRadiusKm = 2,
  searchText = ""
) {
  // 1. Fetch products within selected radius
  const withinRadius = await fetchProductsAtRadius(userLat, userLng, selectedRadiusKm, searchText);

  // 2. Also fetch wider products up to 10 km to identify out-of-radius items
  const widerList = await fetchProductsAtRadius(userLat, userLng, 10, searchText);
  
  // Items that are beyond the selected radius
  const withinIds = new Set(withinRadius.map((p) => p.id));
  const outOfRadiusProducts = widerList.filter((p) => !withinIds.has(p.id));

  // Determine sequential radius message
  let message = null;
  let isExpanded = false;
  let foundRadius = null;

  if (withinRadius.length === 0) {
    if (outOfRadiusProducts.length > 0) {
      // Find the minimum distance in out-of-radius
      const nearestDist = Math.min(
        ...outOfRadiusProducts.map((p) => p.distanceKm || parseFloat(p.distance) || 4)
      );
      foundRadius = Math.ceil(nearestDist);
      message = `Ye product ${selectedRadiusKm} km radius mein available nahi hai, lekin ${foundRadius} km ke range mein available hai.`;
      isExpanded = true;
    } else {
      message = "Not available nearby";
    }
  }

  return {
    products: withinRadius,
    outOfRadiusProducts,
    allProducts: widerList,
    radiusChecked: selectedRadiusKm,
    foundRadius,
    message,
    isExpanded,
  };
}

async function fetchProductsAtRadius(userLat, userLng, radiusKm, searchText = "") {
  const cleanSearch = (searchText || "").trim();

  try {
    // 1. Try RPC function
    const { data: rpcData, error: rpcError } = await supabase.rpc("nearby_products", {
      user_lat: Number(userLat),
      user_lng: Number(userLng),
      radius_km: Number(radiusKm),
      search_text: cleanSearch,
    });

    if (!rpcError && Array.isArray(rpcData) && rpcData.length > 0) {
      return rpcData.map((p) => formatProduct(p));
    }

    // 2. Direct products query + resilient shops join
    const { data: dbProducts, error: pErr } = await supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (!pErr && Array.isArray(dbProducts) && dbProducts.length > 0) {
      // Fetch shops for these products
      const shopIds = [...new Set(dbProducts.map((p) => p.shop_id).filter(Boolean))];
      let shopsMap = {};
      if (shopIds.length > 0) {
        const { data: dbShops } = await supabase.from("shops").select("*").in("id", shopIds);
        if (dbShops) {
          dbShops.forEach((s) => {
            shopsMap[s.id] = s;
          });
        }
      }

      const enriched = dbProducts.map((p) => {
        const shop = shopsMap[p.shop_id] || {};
        const dist = calculateDistanceKm(userLat, userLng, shop.latitude, shop.longitude);
        return {
          id: p.id,
          name: p.title,
          title: p.title,
          category: p.category || "General",
          details: p.description || "",
          description: p.description || "",
          price: Number(p.price) || 0,
          shopId: p.shop_id,
          shop: shop.shop_name || "Local Shop",
          shopName: shop.shop_name || "Local Shop",
          shopAddress: shop.address || shop.landmark || "Mandsaur",
          shopLatitude: shop.latitude,
          shopLongitude: shop.longitude,
          shopType: shop.shop_type || "permanent",
          isLive: shop.is_live !== false,
          currentArea: shop.current_area || "",
          distance: dist != null ? `${dist} km` : "Nearby",
          distanceKm: dist,
          stock: Number(p.stock) > 0 ? "In stock" : "Out of stock",
          stockQuantity: Number(p.stock) || 0,
          image: p.image_url || "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=700&q=85",
          emoji: "📦",
        };
      });

      const filtered = enriched.filter((p) => {
        if (cleanSearch) {
          const s = cleanSearch.toLowerCase();
          const matchTitle = (p.title || "").toLowerCase().includes(s);
          const matchCat = (p.category || "").toLowerCase().includes(s);
          const matchShop = (p.shopName || "").toLowerCase().includes(s);
          if (!matchTitle && !matchCat && !matchShop) return false;
        }
        return p.distanceKm == null || p.distanceKm <= radiusKm;
      });

      if (filtered.length > 0) return filtered;
    }
  } catch (err) {
    console.warn("fetchProductsAtRadius error:", err);
  }

  // 3. Fallback to mock products if Supabase tables are empty
  const lowerSearch = cleanSearch.toLowerCase();
  return mockProducts
    .filter((p) => {
      const dist = parseFloat(p.distance) || 1.5;
      const matchesDist = dist <= radiusKm;
      const matchesSearch =
        !lowerSearch ||
        p.name.toLowerCase().includes(lowerSearch) ||
        p.category.toLowerCase().includes(lowerSearch) ||
        p.shop.toLowerCase().includes(lowerSearch);
      return matchesDist && matchesSearch;
    })
    .map((p) => ({
      ...p,
      title: p.name,
      shopName: p.shop,
      stockQuantity: p.stock === "Out of stock" ? 0 : 10,
    }));
}

function formatProduct(raw) {
  const stockQty = Number(raw.stock ?? raw.quantity ?? 10);
  const dist = raw.distance_km != null ? Number(raw.distance_km) : null;
  return {
    id: raw.id,
    name: raw.title || raw.name,
    title: raw.title || raw.name,
    category: raw.category,
    details: raw.description || raw.details || "",
    description: raw.description || raw.details || "",
    price: Number(raw.price) || 0,
    shopId: raw.shop_id || raw.shopId,
    shop: raw.shop_name || raw.shop || "Local Shop",
    shopName: raw.shop_name || raw.shop || "Local Shop",
    shopAddress: raw.shop_address || raw.address || "Mandsaur",
    shopLatitude: raw.shop_latitude || raw.latitude,
    shopLongitude: raw.shop_longitude || raw.longitude,
    shopType: raw.shop_type || "permanent",
    isLive: raw.is_live,
    currentArea: raw.current_area,
    distance: dist != null ? `${dist.toFixed(1)} km` : (raw.distance || "Nearby"),
    distanceKm: dist,
    stock: stockQty > 0 ? "In stock" : "Out of stock",
    stockQuantity: stockQty,
    avg_rating: raw.avg_rating != null ? Number(raw.avg_rating).toFixed(1) : "4.6",
    reviews_count: raw.reviews_count != null ? Number(raw.reviews_count) : 5,
    lastUpdatedAt: raw.last_updated_at || raw.created_at,
    status: raw.status || "active",
    image: raw.image_url || raw.image || "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=700&q=85",
    emoji: "📦",
  };
}

/**
 * 3. Create reservation in orders and order_items tables
 */
export async function createReservation({
  product,
  quantity = 1,
  pickupDate,
  pickupTime,
  customerName,
  customerPhone,
  notes = "",
  customerLat = MANDSAUR_COORDS.lat,
  customerLng = MANDSAUR_COORDS.lng,
}) {
  const { data: sessionData } = await supabase.auth.getSession();
  const customerId = sessionData?.session?.user?.id || null;
  const totalAmount = Number(product.price) * Number(quantity);
  const pickupCode = `NG-${Math.floor(1000 + Math.random() * 9000)}`;

  let createdOrder = null;

  try {
    // 1. Insert into orders table
    const orderPayload = {
      customer_id: customerId,
      shop_id: product.shopId && String(product.shopId).includes("-") && !isNaN(product.shopId)
        ? product.shopId
        : (product.shopId || null),
      total_amount: totalAmount,
      status: "pending",
      delivery_address: `Pickup on ${pickupDate} at ${pickupTime}${notes ? ` · Note: ${notes}` : ""}`,
      pickup_code: pickupCode,
      customer_latitude: Number(customerLat) || null,
      customer_longitude: Number(customerLng) || null,
    };

    // If shop_id is not a valid UUID (e.g. from mock string), set to null so Supabase foreign key doesn't fail
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (orderPayload.shop_id && !isUuid.test(orderPayload.shop_id)) {
      delete orderPayload.shop_id;
    }

    const { data: orderData, error: orderErr } = await supabase
      .from("orders")
      .insert([orderPayload])
      .select()
      .single();

    if (!orderErr && orderData) {
      createdOrder = orderData;

      // 2. Insert into order_items table
      const productIdValid = isUuid.test(product.id) ? product.id : null;
      if (productIdValid) {
        await supabase.from("order_items").insert([
          {
            order_id: orderData.id,
            product_id: productIdValid,
            quantity: Number(quantity),
            price: Number(product.price),
          },
        ]);
      }
    }
  } catch (err) {
    console.warn("DB reservation error, caching locally:", err);
  }

  // 3. Also persist in localStorage for resilient local state
  const localOrder = {
    ...product,
    id: createdOrder?.id || `NG-${Date.now()}`,
    orderId: createdOrder?.id,
    quantity,
    pickupDate,
    pickupTime,
    customerName,
    customerPhone,
    notes,
    status: "Pending",
    pickupCode,
    total: totalAmount,
    reservedAt: new Date().toISOString(),
  };

  const oldOrders = JSON.parse(localStorage.getItem("nearGoOrders") || "[]");
  localStorage.setItem("nearGoOrders", JSON.stringify([localOrder, ...oldOrders]));
  localStorage.setItem("nearGoLastReservation", JSON.stringify(localOrder));

  return localOrder;
}

/**
 * 4. Fetch customer's reservations
 */
export async function getCustomerReservations() {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;

  let dbOrders = [];
  if (user) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, shops(*), order_items(*, products(*))")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        dbOrders = data.map((o) => {
          const item = o.order_items?.[0] || {};
          const product = item.products || {};
          const shop = o.shops || {};
          return {
            id: o.id,
            name: product.title || "Reserved Item",
            price: Number(item.price || o.total_amount || 0),
            quantity: Number(item.quantity || 1),
            shop: shop.shop_name || "Local Shop",
            shopId: o.shop_id,
            shopAddress: shop.address || shop.landmark,
            shopLatitude: shop.latitude,
            shopLongitude: shop.longitude,
            shopType: shop.shop_type || "permanent",
            isLive: shop.is_live,
            currentArea: shop.current_area,
            locationUpdatedAt: shop.location_updated_at,
            status: normalizeStatus(o.status),
            pickupDate: o.delivery_address?.split("at")?.[0]?.replace("Pickup on", "")?.trim() || "Scheduled",
            pickupTime: o.delivery_address?.split("at")?.[1]?.split("·")?.[0]?.trim() || "Counter pickup",
            reservedAt: o.created_at,
            image: product.image_url || "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=700&q=85",
            emoji: "📦",
          };
        });
      }
    } catch (err) {
      console.warn("getCustomerReservations DB error:", err);
    }
  }

  // Merge with local storage orders (without duplicates)
  const local = JSON.parse(localStorage.getItem("nearGoOrders") || "[]");
  const dbIds = new Set(dbOrders.map((o) => o.id));
  const merged = [...dbOrders, ...local.filter((l) => !dbIds.has(l.id))];

  return merged;
}

/**
 * 5. Fetch seller's incoming orders from Supabase
 */
export async function getSellerOrders(shopId) {
  let dbOrders = [];
  if (shopId) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*, products(*)), profiles(*)")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        dbOrders = data.map((o) => {
          const item = o.order_items?.[0] || {};
          const product = item.products || {};
          const customer = o.profiles || {};
          return {
            id: o.id,
            customerName: customer.full_name || "Customer",
            customerPhone: customer.phone || "+91 98765 43210",
            productName: product.title || "Reserved Item",
            quantity: Number(item.quantity || 1),
            total: Number(o.total_amount || 0),
            status: normalizeStatus(o.status),
            pickupTime: o.delivery_address || "Pickup scheduled",
            createdAt: o.created_at,
          };
        });
      }
    } catch (err) {
      console.warn("getSellerOrders error:", err);
    }
  }

  // Fallback to local storage reservations
  const local = JSON.parse(localStorage.getItem("nearGoShopkeeperReservations") || "[]");
  if (dbOrders.length === 0) return local;

  const dbIds = new Set(dbOrders.map((o) => o.id));
  return [...dbOrders, ...local.filter((l) => !dbIds.has(l.id))];
}

/**
 * 6. Update order status in Supabase
 */
export async function updateOrderStatus(orderId, nextStatus) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const dbStatus = nextStatus.toLowerCase();

  if (isUuid.test(orderId)) {
    try {
      await supabase
        .from("orders")
        .update({
          status: dbStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);
    } catch (err) {
      console.error("updateOrderStatus DB error:", err);
    }
  }

  // Also update local storage caches for instant reactive UI
  const localCustomerOrders = JSON.parse(localStorage.getItem("nearGoOrders") || "[]");
  const updatedCust = localCustomerOrders.map((o) =>
    o.id === orderId ? { ...o, status: nextStatus, updatedAt: new Date().toISOString() } : o
  );
  localStorage.setItem("nearGoOrders", JSON.stringify(updatedCust));

  const localSellerOrders = JSON.parse(localStorage.getItem("nearGoShopkeeperReservations") || "[]");
  const updatedSeller = localSellerOrders.map((o) =>
    o.id === orderId ? { ...o, status: nextStatus, updatedAt: new Date().toISOString() } : o
  );
  localStorage.setItem("nearGoShopkeeperReservations", JSON.stringify(updatedSeller));

  return true;
}

function normalizeStatus(st = "") {
  const lower = st.toLowerCase();
  if (lower === "pending") return "Pending";
  if (lower === "accepted" || lower === "confirmed") return "Confirmed";
  if (lower === "ready") return "Ready";
  if (lower === "completed") return "Completed";
  if (lower === "cancelled" || lower === "rejected") return "Cancelled";
  return "Pending";
}

