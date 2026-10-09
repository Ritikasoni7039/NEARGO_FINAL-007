import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  Heart,
  Home,
  MapPin,
  Navigation,
  Package,
  Pencil,
  Phone,
  Plus,
  Search,
  Store,
  Trash2,
  User,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";

export const customerProducts = [
  {
    id: 1,
    name: "iQOO Z9 5G",
    category: "Mobile",
    details: "8GB + 128GB · Ocean Blue",
    price: 17999,
    shopId: "sharma-mobiles",
    shop: "Sharma Mobiles",
    distance: "1.2 km",
    stock: "In stock",
    fresh: "2h ago",
    rating: "4.6",
    emoji: "📱",
    image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 2,
    name: "Philips LED Bulb",
    category: "Electrical",
    details: "9W · Cool Day Light",
    price: 149,
    shopId: "sharma-electricals",
    shop: "Sharma Electricals",
    distance: "0.8 km",
    stock: "In stock",
    fresh: "1h ago",
    rating: "4.8",
    emoji: "💡",
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 3,
    name: "Taparia Screwdriver Set",
    category: "Hardware",
    details: "6 pcs · Multi-purpose",
    price: 349,
    shopId: "gupta-hardware",
    shop: "Gupta Hardware",
    distance: "1.6 km",
    stock: "In stock",
    fresh: "3h ago",
    rating: "4.5",
    emoji: "🛠️",
    image: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 4,
    name: "Classmate Notebook",
    category: "Stationery",
    details: "200 pages · Single line",
    price: 65,
    shopId: "city-book-store",
    shop: "City Book Store",
    distance: "0.6 km",
    stock: "In stock",
    fresh: "30m ago",
    rating: "4.7",
    emoji: "📓",
    image: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 5,
    name: "boAt Type-C Cable",
    category: "Mobile",
    details: "1.5m · Fast charging",
    price: 299,
    shopId: "gupta-mobile-store",
    shop: "Gupta Mobile Store",
    distance: "1.1 km",
    stock: "In stock",
    fresh: "2h ago",
    rating: "4.4",
    emoji: "🔌",
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 6,
    name: "Drill Bit Set",
    category: "Hardware",
    details: "10 pcs · Heavy duty",
    price: 499,
    shopId: "gupta-hardware",
    shop: "Gupta Hardware",
    distance: "1.6 km",
    stock: "In stock",
    fresh: "4h ago",
    rating: "4.5",
    emoji: "🔧",
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=700&q=85",
  },
];

export const customerShops = {
  "sharma-mobiles": { id: "sharma-mobiles", name: "Sharma Mobiles", category: "Mobile & Accessories", distance: "1.2 km", rating: "4.6", phone: "+91 98765 43210", address: "56 MG Road, Indore", open: true },
  "sharma-electricals": { id: "sharma-electricals", name: "Sharma Electricals", category: "Electricals & Lighting", distance: "0.8 km", rating: "4.8", phone: "+91 98270 11223", address: "14 Siyaganj Market, Indore", open: true },
  "gupta-hardware": { id: "gupta-hardware", name: "Gupta Hardware", category: "Hardware & Tools", distance: "1.6 km", rating: "4.5", phone: "+91 98930 44321", address: "22 Jawahar Marg, Indore", open: true },
  "city-book-store": { id: "city-book-store", name: "City Book Store", category: "Stationery & Books", distance: "0.6 km", rating: "4.7", phone: "+91 97550 77881", address: "8 RNT Marg, Indore", open: false },
  "gupta-mobile-store": { id: "gupta-mobile-store", name: "Gupta Mobile Store", category: "Mobile & Accessories", distance: "1.1 km", rating: "4.4", phone: "+91 97700 33445", address: "31 Palasia Main Road, Indore", open: true },
};

const readJson = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; }
};

const getLocation = () => {
  try { return JSON.parse(sessionStorage.getItem("nearGoCustomerLocation") || "null") || { city: "Indore", radius: "2 km" }; } catch { return { city: "Indore", radius: "2 km" }; }
};

const Shell = ({ children, title, eyebrow, back = true, action, className = "" }) => {
  const navigate = useNavigate();
  return (
    <main className={`min-h-screen bg-[#f7f7f4] pb-[calc(5.8rem+env(safe-area-inset-bottom))] text-[#173d3b] ${className}`}>
      <header className="border-b border-[#e3e2dc] bg-[#fffdfa]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
          <div className="flex min-w-0 items-center gap-4">
            {back && <button onClick={() => navigate(-1)} className="rounded-full p-2 text-[#5e6d75] hover:bg-[#f0f1ed]" aria-label="Go back"><ArrowLeft size={19} /></button>}
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f28a2e]">{eyebrow || "NEAR-GO"}</p>
              <h1 className="truncate text-2xl font-semibold tracking-[-0.04em]">{title}</h1>
            </div>
          </div>
          {action}
        </div>
      </header>
      {children}
      <CustomerNav />
    </main>
  );
};

const CustomerNav = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [saved, setSaved] = useState([]);
  useEffect(() => { setOrders(readJson("nearGoOrders", [])); setSaved(readJson("nearGoSaved", [])); }, []);
  const items = [
    [Home, "Home", "/CustomerDashboard"],
    [MapPin, "Nearby", "/Nearby"],
    [Package, "Orders", "/CustomerOrders", orders.length],
    [Heart, "Saved", "/CustomerSaved", saved.length],
  ];
  return <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dfe3de] bg-[#fffdfa]/95 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl"><div className="mx-auto flex max-w-xl items-center justify-around">{items.map(([Icon, label, path, badge]) => <button key={label} onClick={() => navigate(path)} className="relative flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5 text-[#87908d]"><span className="relative"><Icon size={21} strokeWidth={1.9} />{badge > 0 && <b className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f28a2e] px-1 text-[9px] text-white">{badge}</b>}</span><span className="text-[11px] font-bold">{label}</span></button>)}</div></nav>;
};

const PageFrame = ({ children }) => <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12">{children}</div>;
const SectionTitle = ({ eyebrow, title, text }) => <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f28a2e]">{eyebrow}</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">{title}</h2>{text && <p className="mt-2 max-w-xl text-sm leading-6 text-[#7c8583]">{text}</p>}</div>;
const Button = ({ children, onClick, variant = "primary", className = "", type = "button" }) => <button type={type} onClick={onClick} className={`flex items-center justify-center gap-2 px-5 py-3 text-sm font-bold transition ${variant === "primary" ? "bg-[#f28a2e] text-white hover:bg-[#df751c]" : variant === "dark" ? "bg-[#113b52] text-white hover:bg-[#0b2e40]" : "border border-[#d7dcd6] bg-[#fffdfa] text-[#173d3b] hover:border-[#173d3b]"} ${className}`}>{children}</button>;
const Field = ({ label, value, onChange, placeholder, type = "text" }) => <label className="block"><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8583]">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-2 w-full border-b border-[#cfd5d1] bg-transparent px-0 py-3 text-base outline-none transition focus:border-[#f28a2e] placeholder:text-[#a4adaa]" /></label>;

export const CustomerLocation = () => {
  const navigate = useNavigate();
  const current = getLocation();
  const [city, setCity] = useState(current.city || "Indore");
  const [address, setAddress] = useState(current.address || "");
  const [pincode, setPincode] = useState(current.pincode || "");
  const [radius, setRadius] = useState(current.radius || "2 km");
  const save = () => { sessionStorage.setItem("nearGoCustomerLocation", JSON.stringify({ address, city, pincode, radius, latitude: current.latitude || null, longitude: current.longitude || null, locationSource: address ? "manual" : "city" })); navigate("/CustomerDashboard"); };
  return <Shell title="Set your shopping area" eyebrow="Location"><PageFrame><div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]"><section className="bg-[#113b52] p-6 text-white sm:p-9"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f5b77b]">Search closer</p><h2 className="mt-6 max-w-md text-4xl font-semibold leading-tight tracking-[-0.05em]">Tell us where you usually shop.</h2><p className="mt-5 max-w-md text-sm leading-6 text-white/65">We use this to show products that are actually available around you. Your readable address and map coordinates can be saved together.</p><div className="mt-12 border-t border-white/20 pt-5"><div className="flex gap-3 text-sm text-white/75"><MapPin className="shrink-0 text-[#f28a2e]" size={18} /><span>{address || `${city} · within ${radius}`}</span></div></div></section><section className="border border-[#e4e1d9] bg-[#fffdfa] p-6 sm:p-9"><SectionTitle eyebrow="Your location" title="Choose an area" text="You can fine-tune this later from the dashboard." /><div className="mt-8 space-y-7"><Field label="City or area" value={city} onChange={setCity} placeholder="e.g. Indore" /><Field label="Readable address" value={address} onChange={setAddress} placeholder="Near a landmark, street or locality" /><Field label="Pincode" value={pincode} onChange={setPincode} placeholder="e.g. 452001" type="tel" /><div><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8583]">Search within</span><div className="mt-3 flex gap-2">{["2 km", "3 km", "5 km"].map((option) => <button key={option} onClick={() => setRadius(option)} className={`border px-4 py-2.5 text-sm font-bold ${radius === option ? "border-[#f28a2e] bg-[#fff2e7] text-[#b75d17]" : "border-[#d7dcd6] text-[#7c8583]"}`}>{option}</button>)}</div></div><div className="relative flex h-44 items-center justify-center overflow-hidden bg-[#e7efe9]"><div className="absolute h-36 w-36 rounded-full border-[18px] border-[#cbdccf]" /><div className="absolute h-20 w-20 rounded-full border-[12px] border-[#d9e7dc]" /><MapPin className="relative text-[#f28a2e]" size={42} fill="currentColor" /><span className="absolute bottom-3 left-3 text-xs font-bold text-[#567263]">Map preview · {city}</span></div><div className="flex flex-col gap-3 sm:flex-row"><Button variant="dark" className="flex-1" onClick={save}><Check size={17} />Confirm location</Button><Button variant="ghost" className="flex-1" onClick={() => navigate("/CustomerDashboard")}>Not now</Button></div></div></section></div></PageFrame></Shell>;
};

const ProductRow = ({ product, onClick }) => <button onClick={onClick} className="group flex w-full gap-4 border-b border-[#ece9e1] bg-[#fffdfa] p-4 text-left transition hover:bg-[#faf8f2] sm:p-5"><div className="flex h-24 w-24 shrink-0 items-center justify-center bg-[#f1f2ee] sm:h-28 sm:w-28"><img src={product.image} alt={product.name} className="h-full w-full object-contain p-3 mix-blend-multiply" onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement.innerHTML = `<span style="font-size:36px">${product.emoji}</span>`; }} /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#f28a2e]">{product.category}</p><h3 className="mt-1 truncate text-lg font-bold">{product.name}</h3><p className="mt-1 truncate text-sm text-[#7c8583]">{product.details}</p></div><ArrowUpRight className="shrink-0 text-[#7c8583]" size={18} /></div><div className="mt-4 flex flex-wrap items-end justify-between gap-2"><div><p className="text-xl font-semibold">₹{product.price.toLocaleString("en-IN")}</p><p className="mt-1 text-xs text-[#7c8583]">{product.shop} · {product.distance}</p></div><span className="text-xs font-bold text-[#3b806a]">● {product.stock}</span></div></div></button>;

export const Nearby = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Recommended");
  const location = getLocation();
  const results = useMemo(() => { let list = customerProducts.filter((p) => (!query || `${p.name} ${p.shop} ${p.category}`.toLowerCase().includes(query.toLowerCase())) && (category === "All" || p.category === category)); if (sort === "Cheapest") list.sort((a, b) => a.price - b.price); if (sort === "Nearest") list.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance)); return list; }, [query, category, sort]);
  return <Shell title="Nearby products" eyebrow={`${location.city} · within ${location.radius}`} action={<button onClick={() => navigate("/CustomerLocation")} className="text-sm font-bold text-[#b75d17]">Change area</button>}><PageFrame><div className="grid gap-8 lg:grid-cols-[280px_1fr]"><aside className="h-fit border border-[#e4e1d9] bg-[#fffdfa] p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7c8583]">Find something</p><div className="mt-4 flex items-center gap-2 border-b border-[#cfd5d1] pb-2"><Search size={18} className="text-[#7c8583]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Product or shop" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></div><p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-[#7c8583]">Category</p><div className="mt-3 space-y-1">{["All", "Mobile", "Electrical", "Hardware", "Stationery"].map((item) => <button key={item} onClick={() => setCategory(item)} className={`flex w-full justify-between px-3 py-2.5 text-left text-sm font-semibold ${category === item ? "bg-[#fff2e7] text-[#b75d17]" : "text-[#5e6d75]"}`}>{item}{category === item && <Check size={16} />}</button>)}</div></aside><section><div className="flex flex-col justify-between gap-4 border-b border-[#e4e1d9] pb-5 sm:flex-row sm:items-end"><SectionTitle eyebrow={`${results.length} options found`} title="Compare nearby" text="Availability and price are shown from local shops." /><div className="flex gap-2">{["Recommended", "Cheapest", "Nearest"].map((item) => <button key={item} onClick={() => setSort(item)} className={`border px-3 py-2 text-xs font-bold ${sort === item ? "border-[#113b52] bg-[#113b52] text-white" : "border-[#d7dcd6] text-[#7c8583]"}`}>{item}</button>)}</div></div><div className="mt-5">{results.map((product) => <ProductRow key={product.id} product={product} onClick={() => navigate(`/CustomerProductDetails/${product.id}`)} />)}{results.length === 0 && <div className="bg-[#fffdfa] px-5 py-16 text-center"><Search className="mx-auto text-[#7c8583]" /><h3 className="mt-4 font-bold">No nearby matches</h3><p className="mt-2 text-sm text-[#7c8583]">Try a different product or category.</p></div>}</div></section></div></PageFrame></Shell>;
};

export const CustomerProductDetails = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const product = customerProducts.find((item) => item.id === Number(productId)) || customerProducts[0];
  const [saved, setSaved] = useState(readJson("nearGoSaved", []).includes(product.id));
  const shop = customerShops[product.shopId];
  const toggleSave = () => { const current = readJson("nearGoSaved", []); const updated = current.includes(product.id) ? current.filter((id) => id !== product.id) : [...current, product.id]; localStorage.setItem("nearGoSaved", JSON.stringify(updated)); setSaved(!saved); };
  return <Shell title="Product details" eyebrow={product.category}><PageFrame><div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]"><div className="relative flex min-h-[360px] items-center justify-center bg-[#edf0eb] sm:min-h-[500px]"><img src={product.image} alt={product.name} className="h-full max-h-[440px] w-full object-contain p-12 mix-blend-multiply" /><button onClick={toggleSave} className={`absolute right-5 top-5 rounded-full bg-white p-3 shadow-sm ${saved ? "text-[#f28a2e]" : "text-[#7c8583]"}`}><Heart size={20} fill={saved ? "currentColor" : "none"} /></button></div><div className="border border-[#e4e1d9] bg-[#fffdfa] p-6 sm:p-9"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f28a2e]">{product.category} · {product.stock}</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em]">{product.name}</h2><p className="mt-3 text-base text-[#7c8583]">{product.details}</p><div className="mt-8 flex items-end justify-between border-b border-[#ece9e1] pb-6"><p className="text-4xl font-semibold">₹{product.price.toLocaleString("en-IN")}</p><span className="text-sm font-bold text-[#3b806a]">Updated {product.fresh}</span></div><div className="mt-6 flex items-start gap-4"><div className="flex h-11 w-11 items-center justify-center bg-[#edf5f2] text-[#113b52]"><Store size={20} /></div><div><button onClick={() => navigate(`/CustomerShopDetails/${product.shopId}`)} className="font-bold hover:text-[#b75d17]">{shop.name} <ArrowUpRight className="inline" size={15} /></button><p className="mt-1 text-sm text-[#7c8583]">{shop.address} · {shop.distance}</p><p className="mt-1 text-sm text-[#3b806a]">{shop.open ? "Open now" : "Closed now"} · ★ {shop.rating}</p></div></div><div className="mt-9 grid gap-3 sm:grid-cols-2"><Button onClick={() => navigate(`/CustomerReservation?productId=${product.id}`)}><Package size={17} />Reserve for pickup</Button><Button variant="ghost" onClick={() => navigate(`/CustomerShopDetails/${product.shopId}`)}>View shop</Button></div></div></div></PageFrame></Shell>;
};

export const CustomerShopDetails = () => {
  const navigate = useNavigate();
  const { shopId } = useParams();
  const shop = customerShops[shopId] || customerShops["sharma-electricals"];
  const products = customerProducts.filter((product) => product.shopId === shop.id);
  return <Shell title="Shop details" eyebrow="Local shop"><PageFrame><section className="bg-[#113b52] p-7 text-white sm:p-10"><div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f5b77b]">{shop.category}</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em]">{shop.name}</h2><p className="mt-4 flex items-center gap-2 text-sm text-white/70"><MapPin size={16} className="text-[#f28a2e]" />{shop.address} · {shop.distance}</p></div><div className="flex gap-2"><Button variant="primary" onClick={() => window.open(`tel:${shop.phone}`)}><Phone size={16} />Call shop</Button><Button variant="ghost" onClick={() => navigate("/Nearby")}><Navigation size={16} />Directions</Button></div></div></section><div className="mt-8 grid gap-8 lg:grid-cols-[0.7fr_1.3fr]"><div><SectionTitle eyebrow="About this shop" title={shop.open ? "Open today" : "Closed now"} text={`Rated ${shop.rating} by local customers. Stock and pricing are updated by the shopkeeper.`} /><div className="mt-6 border border-[#e4e1d9] bg-[#fffdfa] p-5 text-sm text-[#5e6d75]"><div className="flex items-center gap-3"><Clock3 size={18} className="text-[#f28a2e]" />Usually open until 8:30 PM</div><div className="mt-4 flex items-center gap-3"><Phone size={18} className="text-[#f28a2e]" />{shop.phone}</div></div></div><div><div className="flex items-end justify-between"><SectionTitle eyebrow="Available here" title="Products in stock" /><button onClick={() => navigate("/Nearby")} className="text-sm font-bold">See nearby <ArrowUpRight className="inline" size={16} /></button></div><div className="mt-4">{products.map((product) => <ProductRow key={product.id} product={product} onClick={() => navigate(`/CustomerProductDetails/${product.id}`)} />)}</div></div></div></PageFrame></Shell>;
};

export const CustomerReservation = () => {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const initial = customerProducts.find((product) => product.id === Number(params.get("productId"))) || customerProducts[0];
  const [productId, setProductId] = useState(String(initial.id));
  const product = customerProducts.find((item) => item.id === Number(productId)) || initial;
  const [quantity, setQuantity] = useState(1);
  const [date, setDate] = useState("Today");
  const [time, setTime] = useState("4:30 PM");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const submit = (e) => { e.preventDefault(); const order = { ...product, quantity, pickupDate: date, pickupTime: time, customerName: name, customerPhone: phone, reservedAt: new Date().toISOString(), status: "Reserved" }; const orders = readJson("nearGoOrders", []); localStorage.setItem("nearGoOrders", JSON.stringify([...orders.filter((item) => item.id !== product.id), order])); localStorage.setItem("nearGoLastReservation", JSON.stringify(order)); navigate("/CustomerReservationConfirmation"); };
  return <Shell title="Reserve for pickup" eyebrow="Reservation"><PageFrame><form onSubmit={submit} className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.85fr_1.15fr]"><section className="border border-[#e4e1d9] bg-[#fffdfa] p-6 sm:p-8"><SectionTitle eyebrow="Your selection" title="Confirm the item" /><div className="mt-7 flex gap-4 border-b border-[#ece9e1] pb-6"><div className="flex h-24 w-24 items-center justify-center bg-[#edf0eb]"><img src={product.image} alt={product.name} className="h-full w-full object-contain p-3 mix-blend-multiply" /></div><div><p className="font-bold">{product.name}</p><p className="mt-1 text-sm text-[#7c8583]">{product.shop}</p><p className="mt-3 text-xl font-semibold">₹{product.price.toLocaleString("en-IN")}</p></div></div><label className="mt-7 block"><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8583]">Product</span><select value={productId} onChange={(e) => setProductId(e.target.value)} className="mt-2 w-full border-b border-[#cfd5d1] bg-transparent py-3 outline-none"><option value="1">iQOO Z9 5G</option><option value="2">Philips LED Bulb</option><option value="3">Taparia Screwdriver Set</option><option value="4">Classmate Notebook</option><option value="5">boAt Type-C Cable</option><option value="6">Drill Bit Set</option></select></label><div className="mt-7"><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8583]">Quantity</span><div className="mt-2 flex items-center gap-4"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-10 w-10 border border-[#d7dcd6] text-xl">−</button><span className="w-8 text-center font-bold">{quantity}</span><button type="button" onClick={() => setQuantity(quantity + 1)} className="h-10 w-10 border border-[#d7dcd6] text-xl">+</button></div></div></section><section className="border border-[#e4e1d9] bg-[#fffdfa] p-6 sm:p-8"><SectionTitle eyebrow="Pickup details" title="When will you collect it?" /><div className="mt-8 grid gap-6 sm:grid-cols-2"><label><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8583]">Pickup day</span><select value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 w-full border-b border-[#cfd5d1] bg-transparent py-3 outline-none"><option>Today</option><option>Tomorrow</option><option>Saturday</option></select></label><label><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8583]">Pickup time</span><select value={time} onChange={(e) => setTime(e.target.value)} className="mt-2 w-full border-b border-[#cfd5d1] bg-transparent py-3 outline-none"><option>4:30 PM</option><option>6:00 PM</option><option>7:30 PM</option></select></label></div><div className="mt-8 space-y-6"><Field label="Your name" value={name} onChange={setName} placeholder="Enter your name" /><Field label="Mobile number" value={phone} onChange={setPhone} placeholder="10-digit mobile number" type="tel" /></div><div className="mt-8 border-t border-[#ece9e1] pt-5"><div className="flex justify-between text-sm text-[#7c8583]"><span>Estimated total</span><span className="font-bold text-[#173d3b]">₹{(product.price * quantity).toLocaleString("en-IN")}</span></div><Button type="submit" className="mt-5 w-full"><Check size={17} />Confirm reservation</Button></div></section></form></PageFrame></Shell>;
};

export const CustomerReservationConfirmation = () => {
  const navigate = useNavigate();
  const order = readJson("nearGoLastReservation", null) || readJson("nearGoOrders", [])[0];
  if (!order) return <Shell title="Reservation" eyebrow="NEAR-GO"><PageFrame><EmptyState title="No reservation found" text="Choose a product nearby to reserve it for pickup." action={() => navigate("/Nearby")} actionText="Browse nearby" /></PageFrame></Shell>;
  return <Shell title="Reservation confirmed" eyebrow="All set"><PageFrame><div className="mx-auto max-w-2xl border border-[#cfe2d7] bg-[#edf5f2] p-7 text-center sm:p-12"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#3b806a] text-white"><Check size={32} /></div><p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#3b806a]">Reserved successfully</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.06em]">Your item is waiting.</h2><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#567263]">Show this reservation at the shop during your pickup window. The shopkeeper has your request.</p><div className="mx-auto mt-8 max-w-md bg-[#fffdfa] p-5 text-left"><div className="flex justify-between gap-4"><span className="text-sm text-[#7c8583]">Product</span><b className="text-right">{order.name}</b></div><div className="mt-3 flex justify-between gap-4"><span className="text-sm text-[#7c8583]">Shop</span><b className="text-right">{order.shop}</b></div><div className="mt-3 flex justify-between gap-4"><span className="text-sm text-[#7c8583]">Pickup</span><b className="text-right">{order.pickupDate || "Today"}, {order.pickupTime || "4:30 PM"}</b></div><div className="mt-3 flex justify-between gap-4"><span className="text-sm text-[#7c8583]">Total</span><b className="text-right">₹{(order.price * (order.quantity || 1)).toLocaleString("en-IN")}</b></div></div><div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center"><Button variant="dark" onClick={() => navigate("/CustomerOrders")}>View my orders</Button><Button variant="ghost" onClick={() => navigate("/Nearby")}>Continue shopping</Button></div></div></PageFrame></Shell>;
};

export const CustomerOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState(readJson("nearGoOrders", []));
  const cancel = (id) => { const updated = orders.map((item) => item.id === id ? { ...item, status: "Cancelled" } : item); setOrders(updated); localStorage.setItem("nearGoOrders", JSON.stringify(updated)); };
  return <Shell title="My orders" eyebrow="Customer account"><PageFrame><SectionTitle eyebrow={`${orders.filter((o) => o.status !== "Cancelled").length} active reservations`} title="Reservations" text="Keep track of items you have asked local shops to hold." /><div className="mt-7 grid gap-4">{orders.map((order) => <div key={`${order.id}-${order.reservedAt}`} className="flex flex-col gap-5 border border-[#e4e1d9] bg-[#fffdfa] p-5 sm:flex-row sm:items-center"><div className="flex h-20 w-20 shrink-0 items-center justify-center bg-[#edf0eb]"><img src={order.image} alt={order.name} className="h-full w-full object-contain p-2 mix-blend-multiply" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{order.name}</h3><span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${order.status === "Cancelled" ? "bg-[#f2e5e1] text-[#a45d4c]" : "bg-[#e5f1ec] text-[#3b806a]"}`}>{order.status}</span></div><p className="mt-1 text-sm text-[#7c8583]">{order.shop} · {order.distance}</p><p className="mt-3 text-sm font-semibold">Pickup: {order.pickupDate || "Today"}, {order.pickupTime || "4:30 PM"}</p></div><div className="flex gap-2 sm:flex-col"><Button variant="ghost" onClick={() => navigate(`/CustomerProductDetails/${order.id}`)}>View item</Button>{order.status !== "Cancelled" && <Button variant="ghost" onClick={() => cancel(order.id)}><X size={15} />Cancel</Button>}</div></div>)}{orders.length === 0 && <EmptyState title="No reservations yet" text="When you reserve a product, it will appear here." action={() => navigate("/Nearby")} actionText="Find a product" />}</div></PageFrame></Shell>;
};

export const CustomerSaved = () => {
  const navigate = useNavigate();
  const [savedIds, setSavedIds] = useState(readJson("nearGoSaved", []));
  const saved = customerProducts.filter((product) => savedIds.includes(product.id));
  const remove = (id) => { const updated = savedIds.filter((item) => item !== id); setSavedIds(updated); localStorage.setItem("nearGoSaved", JSON.stringify(updated)); };
  return <Shell title="Saved items" eyebrow="Customer account"><PageFrame><SectionTitle eyebrow={`${saved.length} saved`} title="Keep useful finds close" text="Products you may want to buy later are collected here." /><div className="mt-7 grid gap-4 md:grid-cols-2">{saved.map((product) => <div key={product.id} className="flex gap-4 border border-[#e4e1d9] bg-[#fffdfa] p-4"><div className="flex h-24 w-24 shrink-0 items-center justify-center bg-[#edf0eb]"><img src={product.image} alt={product.name} className="h-full w-full object-contain p-3 mix-blend-multiply" /></div><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><div><h3 className="truncate font-bold">{product.name}</h3><p className="mt-1 text-sm text-[#7c8583]">{product.shop}</p></div><button onClick={() => remove(product.id)} className="text-[#7c8583] hover:text-[#b75d17]" aria-label="Remove saved item"><Trash2 size={17} /></button></div><p className="mt-4 text-xl font-semibold">₹{product.price.toLocaleString("en-IN")}</p><button onClick={() => navigate(`/CustomerProductDetails/${product.id}`)} className="mt-3 text-sm font-bold text-[#b75d17]">View details <ArrowUpRight className="inline" size={15} /></button></div></div>)}{saved.length === 0 && <div className="md:col-span-2"><EmptyState title="Nothing saved yet" text="Tap the heart on a product when you want to remember it." action={() => navigate("/Nearby")} actionText="Explore products" /></div>}</div></PageFrame></Shell>;
};

export const CustomerProfile = () => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(() => { try { return JSON.parse(sessionStorage.getItem("nearGoSignupData") || "null")?.fullName || "Your name"; } catch { return "Your name"; } });
  const [phone, setPhone] = useState(() => { try { return JSON.parse(sessionStorage.getItem("nearGoSignupData") || "null")?.mobile || "Not added"; } catch { return "Not added"; } });
  const location = getLocation();
  const save = () => { sessionStorage.setItem("nearGoCustomerProfile", JSON.stringify({ name, phone })); setEditing(false); };
  return <Shell title="Your profile" eyebrow="Customer account"><PageFrame><div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]"><section className="bg-[#113b52] p-7 text-white sm:p-9"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f28a2e] text-2xl font-bold">{name.slice(0, 1).toUpperCase()}</div><h2 className="mt-7 text-3xl font-semibold tracking-[-0.05em]">{name}</h2><p className="mt-2 text-sm text-white/60">NEAR-GO customer</p><div className="mt-10 border-t border-white/20 pt-5 text-sm text-white/70"><div className="flex gap-3"><MapPin size={17} className="text-[#f28a2e]" />{location.address || location.city}</div><div className="mt-4 flex gap-3"><Phone size={17} className="text-[#f28a2e]" />{phone}</div></div></section><section className="border border-[#e4e1d9] bg-[#fffdfa] p-6 sm:p-9"><div className="flex items-center justify-between"><SectionTitle eyebrow="Personal details" title="About you" /><button onClick={() => editing ? save() : setEditing(true)} className="flex items-center gap-2 text-sm font-bold text-[#b75d17]">{editing ? <><Check size={16} />Save</> : <><Pencil size={16} />Edit</>}</button></div><div className="mt-8 grid gap-7 sm:grid-cols-2"><Field label="Full name" value={name} onChange={setName} placeholder="Your full name" /><Field label="Mobile number" value={phone} onChange={setPhone} placeholder="Your mobile number" /></div><div className="mt-10 border-t border-[#ece9e1] pt-7"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#7c8583]">Default shopping area</p><div className="mt-4 flex items-center justify-between gap-4"><div><p className="font-bold">{location.city}</p><p className="mt-1 text-sm text-[#7c8583]">{location.address || `Within ${location.radius}`}</p></div><button onClick={() => window.location.href = "/CustomerLocation"} className="text-sm font-bold text-[#b75d17]">Change</button></div></div></section></div></PageFrame></Shell>;
};

const EmptyState = ({ title, text, action, actionText }) => <div className="border border-dashed border-[#cfd5d1] bg-[#fffdfa] px-5 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#edf5f2] text-[#3b806a]"><Package size={22} /></div><h3 className="mt-4 text-xl font-bold">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#7c8583]">{text}</p>{action && <Button variant="dark" className="mx-auto mt-6" onClick={action}>{actionText}</Button>}</div>;

export default {
  CustomerLocation,
  Nearby,
  CustomerProductDetails,
  CustomerShopDetails,
  CustomerReservation,
  CustomerReservationConfirmation,
  CustomerOrders,
  CustomerSaved,
  CustomerProfile,
};
