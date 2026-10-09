import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Heart,
  Home,
  MapPin,
  Package,
  Search,
  ShoppingBag,
  Store,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { customerProducts, customerShops } from "../Customer/CustomerData";

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const CustomerSaved = () => {
  const navigate = useNavigate();
  const [savedIds, setSavedIds] = useState(readJson("nearGoSaved", []));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [reservedIds, setReservedIds] = useState(() => readJson("nearGoOrders", []).map((order) => order.id));
  const [notice, setNotice] = useState("");

  const savedProducts = useMemo(() => {
    return customerProducts.filter((product) => {
      const matchesSaved = savedIds.includes(product.id);
      const text = `${product.name} ${product.shop} ${product.category}`.toLowerCase();
      const matchesQuery = !query || text.includes(query.toLowerCase());
      const matchesCategory = category === "All" || product.category === category;
      return matchesSaved && matchesQuery && matchesCategory;
    });
  }, [savedIds, query, category]);

  const removeSaved = (id) => {
    const updated = savedIds.filter((savedId) => savedId !== id);
    setSavedIds(updated);
    localStorage.setItem("nearGoSaved", JSON.stringify(updated));
    setNotice("Removed from saved items");
    window.setTimeout(() => setNotice(""), 2200);
  };

  const reserveProduct = (product) => {
    const orders = readJson("nearGoOrders", []);
    if (!orders.some((order) => order.id === product.id)) {
      const updated = [...orders, { ...product, quantity: 1, status: "Reserved", reservedAt: new Date().toISOString() }];
      localStorage.setItem("nearGoOrders", JSON.stringify(updated));
      setReservedIds(updated.map((order) => order.id));
    }
    navigate(`/CustomerReservation?productId=${product.id}`);
  };

  return (
    <main className="min-h-screen bg-[#f6f7f3] pb-[calc(5.9rem+env(safe-area-inset-bottom))] text-[#173d3b]">
      <header className="border-b border-[#e1e4de] bg-[#fffdfa]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
          <div className="flex min-w-0 items-center gap-4">
            <button onClick={() => navigate(-1)} className="rounded-full p-2 text-[#65737a] hover:bg-[#f0f1ed]" aria-label="Go back"><ArrowLeft size={19} /></button>
            <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f28a2e]">Customer account</p><h1 className="truncate text-2xl font-semibold tracking-[-0.05em]">Saved items</h1></div>
          </div>
          <button onClick={() => navigate("/Nearby")} className="flex items-center gap-2 text-sm font-bold text-[#b75d17]"><ShoppingBag size={16} /> <span className="hidden sm:inline">Keep exploring</span><span className="sm:hidden">Explore</span></button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8 lg:px-12">
        {notice && <div className="mb-5 flex items-center gap-2 border border-[#c9e0d3] bg-[#edf7f0] px-4 py-3 text-sm font-bold text-[#3b806a]"><Check size={17} /> {notice}</div>}

        <section className="relative overflow-hidden bg-[#113b52] p-6 text-white sm:p-9"><div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f5b77b]"><Heart size={15} fill="currentColor" /> Your shortlist</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Good finds are worth keeping.</h2><p className="mt-3 max-w-lg text-sm leading-6 text-white/65">Save something today, compare it later, and reserve it when you are ready.</p></div><div className="text-left sm:text-right"><p className="text-4xl font-semibold tracking-[-0.06em]">{savedIds.length}</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-white/55">Saved products</p></div></div><div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[28px] border-white/5" /></section>

        <section className="mt-5 flex flex-col gap-4 border border-[#e3e1d9] bg-[#fffdfa] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div className="flex min-w-0 flex-1 items-center gap-3 border-b border-[#cfd5d1] pb-2 sm:max-w-sm sm:border-b-0 sm:border-r sm:pb-0 sm:pr-5"><Search size={18} className="shrink-0 text-[#7c8583]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saved items" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#a4adaa]" />{query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={16} /></button>}</div><div className="flex gap-2 overflow-x-auto">{["All", "Mobile", "Electrical", "Hardware", "Stationery"].map((item) => <button key={item} onClick={() => setCategory(item)} className={`shrink-0 border px-3 py-2 text-xs font-bold ${category === item ? "border-[#f28a2e] bg-[#fff2e7] text-[#b75d17]" : "border-[#d7dcd6] text-[#7c8583]"}`}>{item}</button>)}</div></section>

        <section className="mt-7"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f28a2e]">Your collection</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">Saved for later</h2></div><span className="text-xs font-bold text-[#7c8583]">{savedProducts.length} shown</span></div>
          {savedProducts.length > 0 ? <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{savedProducts.map((product) => <SavedCard key={product.id} product={product} reserved={reservedIds.includes(product.id)} onRemove={removeSaved} onReserve={reserveProduct} onOpen={() => navigate(`/CustomerProductDetails/${product.id}`)} onShop={() => navigate(`/CustomerShopDetails/${product.shopId}`)} />)}</div> : <EmptySaved hasSaved={savedIds.length > 0} onClear={() => { setQuery(""); setCategory("All"); }} onExplore={() => navigate("/Nearby")} />}
        </section>

        <section className="mt-8 grid gap-4 border border-[#d7e5dd] bg-[#edf5f2] p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center"><div className="flex h-11 w-11 items-center justify-center bg-[#113b52] text-white"><Store size={20} /></div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3b806a]">A little local tip</p><p className="mt-1 text-sm font-semibold leading-6 text-[#315e58]">Before visiting, check the product status—local stock can change during the day.</p></div><button onClick={() => navigate("/Nearby")} className="flex items-center gap-1 text-sm font-bold text-[#b75d17]">Check nearby <ArrowUpRight size={15} /></button></section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dfe3de] bg-[#fffdfa]/95 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl"><div className="mx-auto flex max-w-xl items-center justify-around"><NavItem icon={<Home />} label="Home" onClick={() => navigate("/CustomerDashboard")} /><NavItem icon={<MapPin />} label="Nearby" onClick={() => navigate("/Nearby")} /><NavItem icon={<Package />} label="Orders" onClick={() => navigate("/CustomerOrders")} /><NavItem icon={<Heart />} label="Saved" active onClick={() => navigate("/CustomerSaved")} /><NavItem icon={<User />} label="Profile" onClick={() => navigate("/CustomerProfile")} /></div></nav>
    </main>
  );
};

const SavedCard = ({ product, reserved, onRemove, onReserve, onOpen, onShop }) => <article className="group overflow-hidden border border-[#e3e1d9] bg-[#fffdfa] transition hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(24,45,61,0.08)]"><div className="relative flex h-48 items-center justify-center bg-[#edf0eb]"><img src={product.image} alt={product.name} className="h-full w-full object-contain p-7 mix-blend-multiply transition duration-500 group-hover:scale-105" onError={(event) => { event.currentTarget.style.display = "none"; event.currentTarget.parentElement.innerHTML = `<span style="font-size:70px">${product.emoji}</span>`; }} /><button onClick={() => onRemove(product.id)} className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-[#f28a2e] shadow-sm" aria-label={`Remove ${product.name} from saved`}><Heart size={18} fill="currentColor" /></button><span className="absolute bottom-3 left-3 bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#b75d17]">{product.category}</span></div><div className="p-5"><button onClick={onOpen} className="block text-left"><h3 className="truncate text-lg font-bold hover:text-[#b75d17]">{product.name}</h3><p className="mt-1 truncate text-sm text-[#7c8583]">{product.details}</p></button><div className="mt-4 flex items-end justify-between gap-3"><div><p className="text-2xl font-semibold">₹{product.price.toLocaleString("en-IN")}</p><button onClick={onShop} className="mt-1 flex items-center gap-1 truncate text-xs font-semibold text-[#7c8583] hover:text-[#b75d17]">{product.shop} · {product.distance}<ArrowUpRight size={12} /></button></div><span className="text-[10px] font-bold text-[#3b806a]">● {product.stock}</span></div><button onClick={() => onReserve(product)} className={`mt-5 flex h-11 w-full items-center justify-center gap-2 text-sm font-bold ${reserved ? "bg-[#e5f1ec] text-[#3b806a]" : "bg-[#f28a2e] text-white hover:bg-[#df751c]"}`}>{reserved ? <><Check size={16} /> Already reserved</> : <><Package size={16} /> Reserve for pickup</>}</button></div></article>;
const EmptySaved = ({ hasSaved, onClear, onExplore }) => <div className="mt-5 border border-dashed border-[#cfd5d1] bg-[#fffdfa] px-5 py-16 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff1e4] text-[#f28a2e]"><Heart size={25} /></div><h3 className="mt-5 text-xl font-bold">{hasSaved ? "No saved item matches" : "Your shortlist is waiting"}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#7c8583]">{hasSaved ? "Try another search or clear the category filter." : "Tap the heart on anything you like and it will stay here for later."}</p><button onClick={hasSaved ? onClear : onExplore} className="mt-6 bg-[#113b52] px-5 py-3 text-sm font-bold text-white">{hasSaved ? "Show all saved" : "Explore nearby"}</button></div>;
const NavItem = ({ icon, label, active, onClick }) => <button onClick={onClick} className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5 ${active ? "text-[#113b52]" : "text-[#87908d]"}`}>{React.cloneElement(icon, { size: 21, strokeWidth: active ? 2.7 : 1.9, fill: active && label === "Saved" ? "currentColor" : "none" })}<span className="text-[11px] font-bold">{label}</span>{active && <span className="absolute -bottom-1 h-0.5 w-8 bg-[#f28a2e]" />}</button>;

export default CustomerSaved;
