import React, { useMemo, useState } from "react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { currentShop, shopkeeperProducts } from "./shopkeeperData";

const categories = ["All", "Electrical", "Switches", "Wiring", "Lighting"];

const readProducts = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("nearGoShopkeeperProducts") || "null");
    return Array.isArray(saved) ? saved : shopkeeperProducts;
  } catch {
    return shopkeeperProducts;
  }
};

const emptyForm = { name: "", category: "Electrical", price: "", quantity: "", details: "", emoji: "📦" };

export default function ShopkeeperInventory() {
  const navigate = useNavigate();
  const [products, setProducts] = useState(readProducts);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [stockFilter, setStockFilter] = useState("All stock");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState("");

  const saveProducts = (next) => {
    setProducts(next);
    localStorage.setItem("nearGoShopkeeperProducts", JSON.stringify(next));
  };

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

  const updateQuantity = (id, delta) => {
    saveProducts(products.map((product) => {
      if (product.id !== id) return product;
      const quantity = Math.max(0, Number(product.quantity || 0) + delta);
      return { ...product, quantity, stockStatus: stockStatus(quantity), updatedAt: new Date().toISOString() };
    }));
  };

  const removeProduct = (id) => {
    if (!window.confirm("Remove this product from your inventory?")) return;
    saveProducts(products.filter((product) => product.id !== id));
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

  const submitForm = (event) => {
    event.preventDefault();
    if (!form.name.trim() || form.price === "" || form.quantity === "") return;
    const nextProduct = { ...form, name: form.name.trim(), price: Number(form.price), quantity: Number(form.quantity), stockStatus: stockStatus(form.quantity), updatedAt: new Date().toISOString() };
    if (editingId) {
      saveProducts(products.map((product) => product.id === editingId ? { ...product, ...nextProduct } : product));
      setNotice("Product details updated");
    } else {
      saveProducts([...products, { ...nextProduct, id: Date.now(), shopId: currentShop.id }]);
      setNotice("Product added to inventory");
    }
    setFormOpen(false);
    window.setTimeout(() => setNotice(""), 2200);
  };

  return (
    <main className="min-h-screen bg-[#f5f6f2] pb-[calc(5.8rem+env(safe-area-inset-bottom))] text-[#173d3b]">
      <header className="border-b border-[#dfe4dd] bg-[#fffdfa]"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12"><div className="flex items-center gap-3"><button type="button" onClick={() => navigate(-1)} className="rounded-full p-2 text-[#65737a] hover:bg-[#f0f1ed]" aria-label="Go back"><ArrowLeft size={19} /></button><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f28a2e]">{currentShop.name}</p><h1 className="text-2xl font-semibold tracking-[-0.05em]">Inventory</h1></div></div><button type="button" onClick={() => navigate("/ShopkeeperProfile")} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf5f2] text-[#113b52]" aria-label="Open shop profile"><User size={19} /></button></div></header>

      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-12">
        {notice && <div className="mb-5 flex items-center gap-2 border border-[#c9e0d3] bg-[#edf7f0] px-4 py-3 text-sm font-bold text-[#3b806a]"><Check size={17} /> {notice}</div>}
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f28a2e]">Product catalogue</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Keep your stock current.</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#7c8583]">Customers see these products and quantities when they search nearby.</p></div><button type="button" onClick={openAdd} className="flex items-center justify-center gap-2 bg-[#f28a2e] px-5 py-3 text-sm font-bold text-white hover:bg-[#df751c]"><Plus size={17} /> Add product</button></section>

        <section className="mt-7 grid grid-cols-2 border border-[#e3e1d9] bg-[#fffdfa] sm:grid-cols-4"><InventoryMetric value={products.length} label="Total products" /><InventoryMetric value={products.filter((item) => item.stockStatus === "In stock").length} label="In stock" tone="green" /><InventoryMetric value={products.filter((item) => item.stockStatus === "Low stock").length} label="Low stock" tone="orange" /><InventoryMetric value={products.filter((item) => item.stockStatus === "Out of stock").length} label="Out of stock" tone="red" /></section>

        <section className="mt-7 border border-[#e3e1d9] bg-[#fffdfa] p-4 sm:p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 flex-1 items-center gap-2 border-b border-[#cfd5d1] pb-2 lg:max-w-md"><Search size={18} className="shrink-0 text-[#7c8583]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, categories..." className="min-w-0 flex-1 bg-transparent text-sm outline-none" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={16} /></button>}</div><div className="flex gap-2 overflow-x-auto pb-1">{["All stock", "In stock", "Low stock", "Out of stock"].map((item) => <button type="button" key={item} onClick={() => setStockFilter(item)} className={`shrink-0 border px-3 py-2 text-xs font-bold ${stockFilter === item ? "border-[#113b52] bg-[#113b52] text-white" : "border-[#d7dcd6] text-[#7c8583]"}`}>{item}</button>)}</div></div><div className="mt-5 flex gap-2 overflow-x-auto border-t border-[#ece9e1] pt-4">{categories.map((item) => <button type="button" key={item} onClick={() => setCategory(item)} className={`shrink-0 px-3 py-2 text-xs font-bold ${category === item ? "bg-[#fff1e4] text-[#b75d17]" : "text-[#7c8583] hover:bg-[#f5f6f2]"}`}>{item}</button>)}</div></section>

        <section className="mt-5 space-y-3">{filteredProducts.map((product) => <article key={product.id} className="border border-[#e3e1d9] bg-[#fffdfa] p-4 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-center gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center bg-[#edf5f2] text-3xl">{product.emoji || "📦"}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-lg font-bold">{product.name}</h3><StockBadge status={product.stockStatus} /></div><p className="mt-1 text-sm text-[#7c8583]">{product.category}{product.details ? ` · ${product.details}` : ""}</p><p className="mt-2 text-lg font-semibold">₹{Number(product.price).toLocaleString("en-IN")}</p></div></div><div className="flex flex-wrap items-center gap-3 sm:justify-end"><div className="flex items-center border border-[#d7dcd6] bg-[#f9faf7]"><button type="button" onClick={() => updateQuantity(product.id, -1)} className="px-3 py-2 text-lg text-[#5e6d75] hover:bg-[#edf5f2]" aria-label={`Decrease ${product.name} quantity`}>−</button><span className="min-w-12 text-center text-sm font-bold">{product.quantity}</span><button type="button" onClick={() => updateQuantity(product.id, 1)} className="px-3 py-2 text-lg text-[#5e6d75] hover:bg-[#edf5f2]" aria-label={`Increase ${product.name} quantity`}>+</button></div><button type="button" onClick={() => openEdit(product)} className="flex items-center gap-1.5 border border-[#d7dcd6] px-3 py-2 text-xs font-bold text-[#173d3b]"><Edit3 size={14} /> Edit</button><button type="button" onClick={() => removeProduct(product.id)} className="flex items-center gap-1.5 px-2 py-2 text-xs font-bold text-[#a45d4c]" aria-label={`Delete ${product.name}`}><Trash2 size={15} /></button></div></div></article>)}{filteredProducts.length === 0 && <div className="border border-dashed border-[#cfd5d1] bg-[#fffdfa] px-5 py-16 text-center"><Package className="mx-auto text-[#7c8583]" size={30} /><h3 className="mt-4 text-xl font-bold">No products found</h3><p className="mt-2 text-sm text-[#7c8583]">Try another search or add a new product to your catalogue.</p><button type="button" onClick={openAdd} className="mt-5 bg-[#113b52] px-5 py-2.5 text-sm font-bold text-white">Add product</button></div>}</section>
      </div>

      {formOpen && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-[#102a36]/45 p-3 sm:items-center"><form onSubmit={submitForm} className="w-full max-w-xl border border-[#e3e1d9] bg-[#fffdfa] p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f28a2e]">Inventory editor</p><h3 className="mt-2 text-2xl font-semibold">{editingId ? "Edit product" : "Add a product"}</h3></div><button type="button" onClick={() => setFormOpen(false)} className="rounded-full bg-[#f0f1ed] p-2 text-[#5e6d75]" aria-label="Close product form"><X size={18} /></button></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="sm:col-span-2"><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8583]">Product name</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Philips LED Bulb" className="mt-2 w-full border-b border-[#cfd5d1] bg-transparent py-3 text-sm outline-none focus:border-[#f28a2e]" /></label><label><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8583]">Category</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-2 w-full border-b border-[#cfd5d1] bg-transparent py-3 text-sm outline-none focus:border-[#f28a2e]"><option>Electrical</option><option>Switches</option><option>Wiring</option><option>Lighting</option></select></label><label><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8583]">Emoji</span><input value={form.emoji} onChange={(event) => setForm({ ...form, emoji: event.target.value })} className="mt-2 w-full border-b border-[#cfd5d1] bg-transparent py-3 text-sm outline-none focus:border-[#f28a2e]" /></label><label><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8583]">Price (₹)</span><input required min="0" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="149" className="mt-2 w-full border-b border-[#cfd5d1] bg-transparent py-3 text-sm outline-none focus:border-[#f28a2e]" /></label><label><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8583]">Quantity</span><input required min="0" type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} placeholder="24" className="mt-2 w-full border-b border-[#cfd5d1] bg-transparent py-3 text-sm outline-none focus:border-[#f28a2e]" /></label><label className="sm:col-span-2"><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8583]">Short details</span><input value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} placeholder="9W · Cool Day Light" className="mt-2 w-full border-b border-[#cfd5d1] bg-transparent py-3 text-sm outline-none focus:border-[#f28a2e]" /></label></div><button type="submit" className="mt-7 flex w-full items-center justify-center gap-2 bg-[#f28a2e] px-5 py-3 text-sm font-bold text-white"><Check size={17} /> {editingId ? "Save changes" : "Add product"}</button></form></div>}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dfe3de] bg-[#fffdfa]/95 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl"><div className="mx-auto flex max-w-xl items-center justify-around"><ShopNav icon={<Home />} label="Dashboard" onClick={() => navigate("/ShopkeeperDashboard")} /><ShopNav icon={<Package />} label="Inventory" active onClick={() => navigate("/ShopkeeperInventory")} /><ShopNav icon={<Users />} label="Requests" onClick={() => navigate("/ShopkeeperReservations")} /><ShopNav icon={<User />} label="Profile" onClick={() => navigate("/ShopkeeperProfile")} /></div></nav>
    </main>
  );
}

const InventoryMetric = ({ value, label, tone = "navy" }) => <div className="border-r border-[#ece9e1] p-4 last:border-r-0 sm:p-5"><p className={`text-2xl font-semibold tracking-[-0.04em] ${tone === "green" ? "text-[#3b806a]" : tone === "orange" ? "text-[#b75d17]" : tone === "red" ? "text-[#a45d4c]" : "text-[#113b52]"}`}>{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.13em] text-[#87908d]">{label}</p></div>;
const StockBadge = ({ status }) => <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${status === "In stock" ? "bg-[#e5f1ec] text-[#3b806a]" : status === "Low stock" ? "bg-[#fff2df] text-[#b75d17]" : "bg-[#f5e8e4] text-[#a45d4c]"}`}>{status}</span>;
const ShopNav = ({ icon, label, active, onClick }) => <button type="button" onClick={onClick} className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5 ${active ? "text-[#113b52]" : "text-[#87908d]"}`}>{React.cloneElement(icon, { size: 21, strokeWidth: active ? 2.7 : 1.9 })}<span className="text-[10px] font-bold sm:text-[11px]">{label}</span>{active && <span className="absolute -bottom-1 h-0.5 w-8 bg-[#f28a2e]" />}</button>;
