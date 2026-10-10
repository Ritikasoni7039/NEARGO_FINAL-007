import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Edit3,
  Home,
  Package,
  Plus,
  Search,
  Trash2,
  User,
  Users,
  X,
  Loader2,
  Mic,
  Clock3,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { currentShop, shopkeeperProducts } from "./shopkeeperData";
import VoiceProductModal from "./VoiceProductModal";

const emptyForm = { name: "", category: "General", price: "", quantity: "", details: "", emoji: "📦" };

export default function ShopkeeperInventory() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentShopId, setCurrentShopId] = useState(null);
  const [shopName, setShopName] = useState("My Shop");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [stockFilter, setStockFilter] = useState("All stock");
  const [formOpen, setFormOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  // 1. Fetch current seller shop and products from Supabase
  useEffect(() => {
    const fetchShopAndProducts = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;

        let shopId = null;
        if (user) {
          let { data: shopData } = await supabase
            .from("shops")
            .select("*")
            .eq("owner_id", user.id)
            .maybeSingle();

          // Auto-create shop if missing so shopId is never null
          if (!shopData) {
            const savedLocal = JSON.parse(localStorage.getItem("nearGoActiveShop") || "null");
            const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
            
            const newShopPayload = {
              owner_id: user.id,
              shop_name: savedLocal?.shopName || savedLocal?.name || (prof?.full_name ? `${prof.full_name}'s Store` : "My Shop"),
              category: savedLocal?.category || "General Store",
              shop_type: savedLocal?.shopType || "permanent",
              address: savedLocal?.address || "Mandsaur",
              city: "Mandsaur",
              pincode: "458001",
              latitude: 24.0722,
              longitude: 75.0683,
              is_live: true,
            };

            const { data: createdShop } = await supabase
              .from("shops")
              .insert([newShopPayload])
              .select()
              .maybeSingle();

            if (createdShop) shopData = createdShop;
          }

          if (shopData) {
            shopId = shopData.id;
            setCurrentShopId(shopData.id);
            setShopName(shopData.shop_name);
          }
        }

        // If shop found, fetch products from Supabase
        if (shopId) {
          const { data: dbProducts, error: prodErr } = await supabase
            .from("products")
            .select("*")
            .eq("shop_id", shopId)
            .order("created_at", { ascending: false });

          if (!prodErr && Array.isArray(dbProducts) && dbProducts.length > 0) {
            setProducts(
              dbProducts.map((p) => ({
                id: p.id,
                name: p.title,
                category: p.category || "General",
                price: Number(p.price),
                quantity: Number(p.stock) || 0,
                stockStatus: Number(p.stock) === 0 ? "Out of stock" : Number(p.stock) <= 7 ? "Low stock" : "In stock",
                details: p.description || "",
                lastUpdatedAt: p.last_updated_at || p.created_at || new Date().toISOString(),
                status: p.status || "active",
                emoji: "📦",
              }))
            );
            setLoading(false);
            return;
          }
        }

        // Fallback to local storage or mock products
        const saved = JSON.parse(localStorage.getItem("nearGoShopkeeperProducts") || "null");
        setProducts(Array.isArray(saved) && saved.length > 0 ? saved : shopkeeperProducts);
      } catch (err) {
        console.error("Inventory load error:", err);
        setProducts(shopkeeperProducts);
      } finally {
        setLoading(false);
      }
    };

    fetchShopAndProducts();

    const channel = supabase
      .channel("seller-inventory-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        fetchShopAndProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const saveProductsLocal = (next) => {
    setProducts(next);
    localStorage.setItem("nearGoShopkeeperProducts", JSON.stringify(next));
  };

  const categories = useMemo(() => {
    const set = new Set(["All"]);
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => products.filter((product) => {
    const text = `${product.name} ${product.category} ${product.details || ""}`.toLowerCase();
    const matchesQuery = !query.trim() || text.includes(query.trim().toLowerCase());
    const matchesCategory = category === "All" || product.category === category;
    const matchesStock = stockFilter === "All stock" || product.stockStatus === stockFilter;
    return matchesQuery && matchesCategory && matchesStock;
  }), [products, query, category, stockFilter]);

  const stockStatus = (quantity) => {
    const count = Number(quantity) || 0;
    if (count === 0) return "Out of stock";
    if (count <= 7) return "Low stock";
    return "In stock";
  };

  const getFreshnessInfo = (lastUpdated) => {
    if (!lastUpdated) return { days: 0, text: "Updated today", isWarning: false, isDraft: false };
    const diffMs = Date.now() - new Date(lastUpdated).getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days >= 5) {
      return { days, text: `Draft · Unconfirmed for ${days} days (Hidden)`, isWarning: true, isDraft: true };
    }
    if (days >= 3) {
      return { days, text: `Not updated by shopkeeper – updated ${days} days ago`, isWarning: true, isDraft: false };
    }
    if (days === 0) return { days: 0, text: "Updated today", isWarning: false, isDraft: false };
    if (days === 1) return { days: 1, text: "Updated yesterday", isWarning: false, isDraft: false };
    return { days, text: `Updated ${days} days ago`, isWarning: false, isDraft: false };
  };

  const confirmProductStock = async (id) => {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const now = new Date().toISOString();
    if (isUuid.test(id)) {
      try {
        await supabase
          .from("products")
          .update({ last_updated_at: now, status: "active" })
          .eq("id", id);
      } catch (err) {
        console.warn("Confirm stock error:", err);
      }
    }
    saveProductsLocal(
      products.map((p) => p.id === id ? { ...p, lastUpdatedAt: now, status: "active" } : p)
    );
    setNotice("Product stock verified and confirmed fresh!");
    setTimeout(() => setNotice(""), 2500);
  };

  const confirmAllStock = async () => {
    const now = new Date().toISOString();
    if (currentShopId) {
      try {
        await supabase
          .from("products")
          .update({ last_updated_at: now, status: "active" })
          .eq("shop_id", currentShopId);
      } catch (err) {
        console.warn("Confirm all stock error:", err);
      }
    }
    saveProductsLocal(
      products.map((p) => ({ ...p, lastUpdatedAt: now, status: "active" }))
    );
    setNotice(`All ${products.length} products verified and confirmed fresh!`);
    setTimeout(() => setNotice(""), 2500);
  };

  const staleProducts = useMemo(() => {
    return products.filter((p) => getFreshnessInfo(p.lastUpdatedAt).isWarning);
  }, [products]);

  const updateQuantity = async (id, delta) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    const nextQty = Math.max(0, Number(target.quantity || 0) + delta);
    const nextStatus = stockStatus(nextQty);
    const now = new Date().toISOString();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (isUuid.test(id)) {
      try {
        await supabase.from("products").update({ stock: nextQty, last_updated_at: now, status: "active" }).eq("id", id);
      } catch (err) {
        console.warn("Update stock error:", err);
      }
    }

    saveProductsLocal(products.map((product) => {
      if (product.id !== id) return product;
      return { ...product, quantity: nextQty, stockStatus: nextStatus, lastUpdatedAt: now, status: "active" };
    }));
  };

  const removeProduct = async (id) => {
    if (!window.confirm("Remove this product from your inventory?")) return;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (isUuid.test(id)) {
      try {
        await supabase.from("products").delete().eq("id", id);
      } catch (err) {
        console.warn("Delete product error:", err);
      }
    }

    saveProductsLocal(products.filter((product) => product.id !== id));
    setNotice("Product removed from inventory");
    window.setTimeout(() => setNotice(""), 2200);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    setForm({ name: product.name, category: product.category, price: product.price, quantity: product.quantity, details: product.details || "", emoji: product.emoji || "📦" });
    setFormOpen(true);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || form.price === "" || form.quantity === "") return;

    setSaving(true);
    const now = new Date().toISOString();
    const nextProduct = {
      ...form,
      name: form.name.trim(),
      price: Number(form.price),
      quantity: Number(form.quantity),
      stockStatus: stockStatus(form.quantity),
      lastUpdatedAt: now,
      status: "active",
      updatedAt: now,
    };

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    try {
      if (editingId) {
        if (isUuid.test(editingId)) {
          await supabase.from("products").update({
            title: nextProduct.name,
            category: nextProduct.category,
            price: nextProduct.price,
            stock: nextProduct.quantity,
            description: nextProduct.details,
            last_updated_at: now,
            status: "active",
          }).eq("id", editingId);
        }
        saveProductsLocal(products.map((product) => product.id === editingId ? { ...product, ...nextProduct } : product));
        setNotice("Product details updated & stock verified!");
      } else {
        let insertedId = Date.now();
        let targetShopId = currentShopId;

        if (!targetShopId) {
          const { data: sData } = await supabase.auth.getSession();
          const uid = sData?.session?.user?.id;
          if (uid) {
            const { data: sh } = await supabase.from("shops").select("id").eq("owner_id", uid).maybeSingle();
            if (sh?.id) targetShopId = sh.id;
          }
        }

        if (targetShopId) {
          const { data, error } = await supabase.from("products").insert([{
            shop_id: targetShopId,
            title: nextProduct.name,
            category: nextProduct.category,
            price: nextProduct.price,
            stock: nextProduct.quantity,
            description: nextProduct.details,
            last_updated_at: now,
            status: "active",
            image_url: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=700&q=85",
          }]).select().single();

          if (error) {
            console.error("Supabase product insert error:", error);
            setNotice(`Database sync warning: ${error.message}`);
          } else if (data) {
            insertedId = data.id;
            setNotice("Product saved to Supabase backend & inventory!");
          }
        }

        saveProductsLocal([{ ...nextProduct, id: insertedId, shopId: targetShopId || currentShop.id }, ...products]);
        if (!notice) setNotice("Product added to inventory!");
      }
    } catch (err) {
      console.error("Save product error:", err);
    } finally {
      setSaving(false);
      setFormOpen(false);
      window.setTimeout(() => setNotice(""), 2200);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f6f2] pb-[calc(5.8rem+env(safe-area-inset-bottom))] text-[#173d3b]">
      <header className="border-b border-[#dfe4dd] bg-[#fffdfa]"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12"><div className="flex items-center gap-3"><button type="button" onClick={() => navigate(-1)} className="rounded-full p-2 text-[#65737a] hover:bg-[#f0f1ed]" aria-label="Go back"><ArrowLeft size={19} /></button><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f28a2e]">{currentShop.name}</p><h1 className="text-2xl font-semibold tracking-[-0.05em]">Inventory</h1></div></div><button type="button" onClick={() => navigate("/ShopkeeperProfile")} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf5f2] text-[#113b52]" aria-label="Open shop profile"><User size={19} /></button></div></header>

      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-12">
        {notice && <div className="mb-5 flex items-center gap-2 border border-[#c9e0d3] bg-[#edf7f0] px-4 py-3 text-sm font-bold text-[#3b806a]"><Check size={17} /> {notice}</div>}

        {staleProducts.length > 0 && (
          <div className="mb-6 flex flex-col items-start justify-between gap-4 border border-[#f5c6cb] bg-[#fff5f5] p-4 text-[#842029] sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 shrink-0 text-[#dc3545]" size={20} />
              <div>
                <p className="font-bold text-sm">
                  {staleProducts.length} product{staleProducts.length > 1 ? "s" : ""} haven't been confirmed in 3+ days!
                </p>
                <p className="mt-0.5 text-xs text-[#a71d2a]">
                  Unconfirmed products show a warning badge to customers and are auto-converted to hidden Drafts after 5 days.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={confirmAllStock}
              className="flex items-center gap-2 rounded bg-[#dc3545] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#b02a37]"
            >
              <RefreshCw size={14} /> Confirm All Stock Fresh
            </button>
          </div>
        )}

        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f28a2e]">Product catalogue</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Keep your stock current.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#7c8583]">Customers see these products and quantities when they search nearby.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setVoiceModalOpen(true)}
              className="flex items-center justify-center gap-2 border border-[#f28a2e] bg-[#fffaf5] px-4 py-3 text-sm font-bold text-[#f28a2e] transition hover:bg-[#ffefe0]"
            >
              <Mic size={17} /> Voice Add
            </button>
            <button
              type="button"
              onClick={openAdd}
              className="flex items-center justify-center gap-2 bg-[#f28a2e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#df751c]"
            >
              <Plus size={17} /> Add product
            </button>
          </div>
        </section>

        <section className="mt-7 grid grid-cols-2 border border-[#e3e1d9] bg-[#fffdfa] sm:grid-cols-4"><InventoryMetric value={products.length} label="Total products" /><InventoryMetric value={products.filter((item) => item.stockStatus === "In stock").length} label="In stock" tone="green" /><InventoryMetric value={products.filter((item) => item.stockStatus === "Low stock").length} label="Low stock" tone="orange" /><InventoryMetric value={products.filter((item) => item.stockStatus === "Out of stock").length} label="Out of stock" tone="red" /></section>

        <section className="mt-7 border border-[#e3e1d9] bg-[#fffdfa] p-4 sm:p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 flex-1 items-center gap-2 border-b border-[#cfd5d1] pb-2 lg:max-w-md"><Search size={18} className="shrink-0 text-[#7c8583]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, categories..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={16} /></button>}</div><div className="flex gap-2 overflow-x-auto pb-1">{["All stock", "In stock", "Low stock", "Out of stock"].map((item) => <button type="button" key={item} onClick={() => setStockFilter(item)} className={`shrink-0 border px-3 py-2 text-xs font-bold ${stockFilter === item ? "border-[#113b52] bg-[#113b52] text-white" : "border-[#d7dcd6] text-[#7c8583]"}`}>{item}</button>)}</div></div><div className="mt-5 flex gap-2 overflow-x-auto border-t border-[#ece9e1] pt-4">{categories.map((item) => <button type="button" key={item} onClick={() => setCategory(item)} className={`shrink-0 px-3 py-2 text-xs font-bold ${category === item ? "bg-[#fff1e4] text-[#b75d17]" : "text-[#7c8583] hover:bg-[#f5f6f2]"}`}>{item}</button>)}</div></section>

        <section className="mt-5 space-y-3">
          {filteredProducts.map((product) => {
            const freshness = getFreshnessInfo(product.lastUpdatedAt);
            return (
              <article key={product.id} className="border border-[#e3e1d9] bg-[#fffdfa] p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-[#edf5f2] text-3xl">
                      {product.emoji || "📦"}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-bold">{product.name}</h3>
                        <StockBadge status={product.stockStatus} />
                        {freshness.isDraft && (
                          <span className="rounded bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                            Draft (Hidden)
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-[#7c8583]">
                        {product.category}{product.details ? ` · ${product.details}` : ""}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3">
                        <p className="text-lg font-semibold">₹{Number(product.price).toLocaleString("en-IN")}</p>
                        <span className={`inline-flex items-center gap-1 text-xs ${freshness.isWarning ? "font-semibold text-[#dc3545]" : "text-[#7c8583]"}`}>
                          <Clock3 size={13} />
                          {freshness.text}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => confirmProductStock(product.id)}
                      className={`flex items-center gap-1.5 border px-3 py-2 text-xs font-bold transition ${
                        freshness.isWarning
                          ? "border-[#f5c6cb] bg-[#fff5f5] text-[#dc3545] hover:bg-[#ffe5e5]"
                          : "border-[#d7dcd6] bg-[#fdfdfc] text-[#3b806a] hover:bg-[#edf5f2]"
                      }`}
                      title="Confirm this product stock is accurate and fresh"
                    >
                      <RefreshCw size={13} /> Confirm Stock
                    </button>
                    <div className="flex items-center border border-[#d7dcd6] bg-[#f9faf7]">
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, -1)}
                        className="px-3 py-2 text-lg text-[#5e6d75] hover:bg-[#edf5f2]"
                        aria-label={`Decrease ${product.name} quantity`}
                      >
                        −
                      </button>
                      <span className="min-w-12 text-center text-sm font-bold">{product.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, 1)}
                        className="px-3 py-2 text-lg text-[#5e6d75] hover:bg-[#edf5f2]"
                        aria-label={`Increase ${product.name} quantity`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEdit(product)}
                      className="flex items-center gap-1.5 border border-[#d7dcd6] px-3 py-2 text-xs font-bold text-[#173d3b]"
                    >
                      <Edit3 size={14} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeProduct(product.id)}
                      className="flex items-center gap-1.5 px-2 py-2 text-xs font-bold text-[#a45d4c]"
                      aria-label={`Delete ${product.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="border border-dashed border-[#cfd5d1] bg-[#fffdfa] px-5 py-16 text-center">
              <Package className="mx-auto text-[#7c8583]" size={30} />
              <h3 className="mt-4 text-xl font-bold">No products found</h3>
              <p className="mt-2 text-sm text-[#7c8583]">Try another search or add a new product to your catalogue.</p>
              <button type="button" onClick={openAdd} className="mt-5 bg-[#113b52] px-5 py-2.5 text-sm font-bold text-white">
                Add product
              </button>
            </div>
          )}
        </section>
      </div>

      <VoiceProductModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        shopId={currentShopId}
        onProductAdded={(newProduct) => {
          saveProductsLocal([newProduct, ...products]);
          setNotice(`"${newProduct.name}" added successfully!`);
          window.setTimeout(() => setNotice(""), 2500);
        }}
      />

      {formOpen && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#102a36]/45 p-3 sm:items-center"><form onSubmit={submitForm} className="w-full max-w-xl max-h-[90vh] overflow-y-auto border border-[#e3e1d9] bg-[#fffdfa] p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f28a2e]">Inventory editor</p><h3 className="mt-2 text-2xl font-semibold">{editingId ? "Edit product" : "Add a product"}</h3></div><button type="button" onClick={() => setFormOpen(false)} className="rounded-full bg-[#f0f1ed] p-2 text-[#5e6d75]" aria-label="Close product form"><X size={18} /></button></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="sm:col-span-2"><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8583]">Product name</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Philips LED Bulb" className="mt-2 w-full border-b border-[#cfd5d1] bg-transparent py-3 text-sm outline-none focus:border-[#f28a2e]" /></label><label><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8583]">Category</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-2 w-full border-b border-[#cfd5d1] bg-transparent py-3 text-sm outline-none focus:border-[#f28a2e]"><option>Grocery & Kirana</option><option>Stationery & Books</option><option>Fresh Fruits & Vegetables</option><option>Electronics & Mobile</option><option>Pharmacy & Wellness</option><option>Clothing & Footwear</option><option>Hardware & Tools</option><option>Sweets & Bakery</option><option>General Store</option></select></label><label><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8583]">Emoji</span><input value={form.emoji} onChange={(event) => setForm({ ...form, emoji: event.target.value })} className="mt-2 w-full border-b border-[#cfd5d1] bg-transparent py-3 text-sm outline-none focus:border-[#f28a2e]" /></label><label><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8583]">Price (₹)</span><input required min="0" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="149" className="mt-2 w-full border-b border-[#cfd5d1] bg-transparent py-3 text-sm outline-none focus:border-[#f28a2e]" /></label><label><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8583]">Quantity</span><input required min="0" type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} placeholder="24" className="mt-2 w-full border-b border-[#cfd5d1] bg-transparent py-3 text-sm outline-none focus:border-[#f28a2e]" /></label><label className="sm:col-span-2"><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8583]">Short details</span><input value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} placeholder="9W · Cool Day Light" className="mt-2 w-full border-b border-[#cfd5d1] bg-transparent py-3 text-sm outline-none focus:border-[#f28a2e]" /></label></div><button type="submit" className="mt-7 flex w-full items-center justify-center gap-2 bg-[#f28a2e] px-5 py-3 text-sm font-bold text-white"><Check size={17} /> {editingId ? "Save changes" : "Add product"}</button></form></div>}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dfe3de] bg-[#fffdfa]/95 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl"><div className="mx-auto flex max-w-xl items-center justify-around"><ShopNav icon={<Home />} label="Dashboard" onClick={() => navigate("/ShopkeeperDashboard")} /><ShopNav icon={<Package />} label="Inventory" active onClick={() => navigate("/ShopkeeperInventory")} /><ShopNav icon={<Users />} label="Requests" onClick={() => navigate("/ShopkeeperReservations")} /><ShopNav icon={<User />} label="Profile" onClick={() => navigate("/ShopkeeperProfile")} /></div></nav>
    </main>
  );
}

const InventoryMetric = ({ value, label, tone = "navy" }) => <div className="border-r border-[#ece9e1] p-4 last:border-r-0 sm:p-5"><p className={`text-2xl font-semibold tracking-[-0.04em] ${tone === "green" ? "text-[#3b806a]" : tone === "orange" ? "text-[#b75d17]" : tone === "red" ? "text-[#a45d4c]" : "text-[#113b52]"}`}>{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.13em] text-[#87908d]">{label}</p></div>;
const StockBadge = ({ status }) => <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${status === "In stock" ? "bg-[#e5f1ec] text-[#3b806a]" : status === "Low stock" ? "bg-[#fff2df] text-[#b75d17]" : "bg-[#f5e8e4] text-[#a45d4c]"}`}>{status}</span>;
const ShopNav = ({ icon, label, active, onClick }) => <button type="button" onClick={onClick} className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5 ${active ? "text-[#113b52]" : "text-[#87908d]"}`}>{React.cloneElement(icon, { size: 21, strokeWidth: active ? 2.7 : 1.9 })}<span className="text-[10px] font-bold sm:text-[11px]">{label}</span>{active && <span className="absolute -bottom-1 h-0.5 w-8 bg-[#f28a2e]" />}</button>;
