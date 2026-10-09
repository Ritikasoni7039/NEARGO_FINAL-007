import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Home,
  MapPin,
  Package,
  Phone,
  Search,
  ShoppingBag,
  TimerReset,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { customerProducts, customerShops } from "../Customer/CustomerData";

const readOrders = () => {
  try {
    return JSON.parse(localStorage.getItem("nearGoOrders") || "[]");
  } catch {
    return [];
  }
};

const statusConfig = {
  Pending: { label: "Pending", tone: "amber", icon: Clock3, description: "Waiting for the shop to accept" },
  Reserved: { label: "Pending", tone: "amber", icon: Clock3, description: "Waiting for the shop to accept" },
  Confirmed: { label: "Confirmed", tone: "blue", icon: CheckCircle2, description: "Shop has accepted your reservation" },
  Ready: { label: "Ready for pickup", tone: "teal", icon: ShoppingBag, description: "Your order is ready at the shop" },
  Completed: { label: "Completed", tone: "green", icon: CheckCircle2, description: "Picked up successfully" },
  Cancelled: { label: "Cancelled", tone: "red", icon: XCircle, description: "This reservation was cancelled" },
};

const tabs = [
  ["All", "Everything"],
  ["Pending", "Pending"],
  ["Confirmed", "Confirmed"],
  ["Ready", "Ready"],
  ["Completed", "Completed"],
  ["Cancelled", "Cancelled"],
];

const CustomerOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState(readOrders);
  const [activeTab, setActiveTab] = useState("All");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(null);

  const getProduct = (order) => customerProducts.find((item) => item.id === order.id) || order;
  const getShop = (order) => customerShops[order.shopId] || null;

  const normalizedStatus = (order) => {
    if (order.status === "Reserved") return "Pending";
    return order.status || "Pending";
  };

  const counts = useMemo(() => {
    const count = (status) => orders.filter((order) => normalizedStatus(order) === status).length;
    return { all: orders.length, pending: count("Pending"), confirmed: count("Confirmed"), ready: count("Ready"), completed: count("Completed"), cancelled: count("Cancelled") };
  }, [orders]);

  const visibleOrders = useMemo(() => {
    return orders.filter((order) => {
      const product = getProduct(order);
      const searchable = `${product.name || ""} ${product.shop || ""} ${order.customerName || ""}`.toLowerCase();
      const matchesTab = activeTab === "All" || normalizedStatus(order) === activeTab;
      return matchesTab && (!query || searchable.includes(query.toLowerCase()));
    });
  }, [orders, activeTab, query]);

  const updateOrder = (id, status) => {
    const updated = orders.map((order) => order.id === id ? { ...order, status, updatedAt: new Date().toISOString() } : order);
    setOrders(updated);
    localStorage.setItem("nearGoOrders", JSON.stringify(updated));
  };

  return (
    <main className="min-h-screen bg-[#f6f7f3] pb-[calc(5.9rem+env(safe-area-inset-bottom))] text-[#173d3b]">
      <header className="border-b border-[#e1e4de] bg-[#fffdfa]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
          <div className="flex min-w-0 items-center gap-4">
            <button onClick={() => navigate(-1)} className="rounded-full p-2 text-[#65737a] hover:bg-[#f0f1ed]" aria-label="Go back"><ArrowLeft size={19} /></button>
            <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f28a2e]">Customer account</p><h1 className="truncate text-2xl font-semibold tracking-[-0.05em]">My orders</h1></div>
          </div>
          <button onClick={() => navigate("/Nearby")} className="flex items-center gap-2 text-sm font-bold text-[#b75d17]"><ShoppingBag size={16} /> <span className="hidden sm:inline">Find something new</span><span className="sm:hidden">Shop</span></button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8 lg:px-12">
        <section className="relative overflow-hidden bg-[#113b52] p-6 text-white sm:p-9"><div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f5b77b]"><Package size={15} /> Reservation desk</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Everything you have asked a local shop to hold.</h2><p className="mt-3 max-w-lg text-sm leading-6 text-white/65">Follow the status, pickup time and shop details from one calm place.</p></div><div className="text-left sm:text-right"><p className="text-4xl font-semibold tracking-[-0.06em]">{counts.all}</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-white/55">Total reservations</p></div></div><div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[28px] border-white/5" /></section>

        <section className="mt-5 grid grid-cols-2 border border-[#e3e1d9] bg-[#fffdfa] sm:grid-cols-5"><Summary value={counts.pending} label="Pending" tone="amber" /><Summary value={counts.confirmed} label="Confirmed" tone="blue" /><Summary value={counts.ready} label="Ready" tone="teal" /><Summary value={counts.completed} label="Completed" tone="green" /><Summary value={counts.cancelled} label="Cancelled" tone="red" /></section>

        <section className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f28a2e]">Your activity</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">Reservations</h2></div><div className="flex items-center gap-2 border-b border-[#cfd5d1] pb-2 sm:w-64"><Search size={17} className="text-[#7c8583]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search orders" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#a4adaa]" />{query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={16} /></button>}</div></section>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">{tabs.map(([value, label]) => <button key={value} onClick={() => setActiveTab(value)} className={`flex shrink-0 items-center gap-2 border px-3 py-2 text-xs font-bold ${activeTab === value ? "border-[#113b52] bg-[#113b52] text-white" : "border-[#d7dcd6] bg-[#fffdfa] text-[#7c8583]"}`}>{label}<span className={activeTab === value ? "text-white/65" : "text-[#a1aaa5]"}>{value === "All" ? counts.all : counts[value.toLowerCase()]}</span></button>)}</div>

        <section className="mt-5 space-y-4">{visibleOrders.map((order) => <OrderCard key={`${order.id}-${order.reservedAt || order.updatedAt || "order"}`} order={order} product={getProduct(order)} shop={getShop(order)} expanded={expanded === `${order.id}-${order.reservedAt || "order"}`} onExpand={() => setExpanded(expanded === `${order.id}-${order.reservedAt || "order"}` ? null : `${order.id}-${order.reservedAt || "order"}`)} onUpdate={updateOrder} onNavigate={navigate} />)}{visibleOrders.length === 0 && <EmptyOrders hasOrders={orders.length > 0} onBrowse={() => navigate("/Nearby")} onClear={() => { setQuery(""); setActiveTab("All"); }} />}</section>
      </div>

      <CustomerNav navigate={navigate} />
    </main>
  );
};

const OrderCard = ({ order, product, shop, expanded, onExpand, onUpdate, onNavigate }) => {
  const currentStatus = statusConfig[order.status] || statusConfig.Pending;
  const Icon = currentStatus.icon;
  const total = product.price * (order.quantity || 1);
  const toneClasses = { amber: "bg-[#fff2df] text-[#b75d17]", blue: "bg-[#e9f1f8] text-[#3e6d91]", teal: "bg-[#e5f1ec] text-[#3b806a]", green: "bg-[#e5f1ec] text-[#3b806a]", red: "bg-[#f5e8e4] text-[#a45d4c]" };
  const statusLabel = currentStatus.label;

  return <article className="overflow-hidden border border-[#e3e1d9] bg-[#fffdfa]"><div className="flex flex-col gap-5 p-4 sm:flex-row sm:items-center sm:p-5"><button onClick={() => onNavigate(`/CustomerProductDetails/${product.id}`)} className="flex min-w-0 flex-1 gap-4 text-left"><div className="flex h-24 w-24 shrink-0 items-center justify-center bg-[#edf0eb] sm:h-28 sm:w-28"><img src={product.image} alt={product.name} className="h-full w-full object-contain p-3 mix-blend-multiply" onError={(event) => { event.currentTarget.style.display = "none"; event.currentTarget.parentElement.innerHTML = `<span style="font-size:40px">${product.emoji}</span>`; }} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-lg font-bold">{product.name}</h3><span className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${toneClasses[currentStatus.tone]}`}><Icon size={12} /> {statusLabel}</span></div><p className="mt-1 text-sm text-[#7c8583]">{product.shop} · {product.distance}</p><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[#5e6d75]"><span className="flex items-center gap-1.5"><CalendarDays size={14} className="text-[#f28a2e]" /> {order.pickupDate || "Today"}, {order.pickupTime || "4:30 PM"}</span><span>Qty {order.quantity || 1} · ₹{total.toLocaleString("en-IN")}</span></div></div></button><div className="flex shrink-0 gap-2 sm:flex-col"><button onClick={onExpand} className="flex items-center justify-center gap-1 border border-[#d7dcd6] px-3 py-2 text-xs font-bold text-[#5e6d75]">{expanded ? "Hide details" : "View details"}<ArrowUpRight size={14} /></button>{order.status !== "Cancelled" && order.status !== "Completed" && <button onClick={() => onUpdate(order.id, "Cancelled")} className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold text-[#a45d4c]"><X size={14} /> Cancel</button>}</div></div>{expanded && <div className="border-t border-[#ece9e1] bg-[#fcfbf7] px-5 py-5 sm:px-7"><div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f28a2e]">Reservation progress</p><div className="mt-5 flex items-start"><TimelineStep done={currentStatus.label !== "Pending" && currentStatus.label !== "Cancelled"} active={currentStatus.label === "Pending"} label="Requested" /><TimelineStep done={["Confirmed", "Ready for pickup", "Completed"].includes(currentStatus.label)} active={currentStatus.label === "Confirmed"} label="Accepted" /><TimelineStep done={["Ready for pickup", "Completed"].includes(currentStatus.label)} active={currentStatus.label === "Ready for pickup"} label="Ready" /><TimelineStep done={currentStatus.label === "Completed"} active={currentStatus.label === "Completed"} label="Picked up" last /></div><p className="mt-5 text-sm text-[#7c8583]">{currentStatus.description}.</p></div><div className="border-l-0 border-[#e6e4dc] lg:border-l lg:pl-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f28a2e]">Pickup details</p><p className="mt-3 font-bold">{shop?.name || product.shop}</p><p className="mt-1 flex items-start gap-2 text-sm text-[#7c8583]"><MapPin size={15} className="mt-0.5 shrink-0 text-[#f28a2e]" />{shop?.address || "Nearby local shop"}</p><p className="mt-2 flex items-center gap-2 text-sm text-[#7c8583]"><Clock3 size={15} className="text-[#f28a2e]" />{order.pickupDate || "Today"}, {order.pickupTime || "4:30 PM"}</p><div className="mt-5 flex flex-wrap gap-2"><button onClick={() => onNavigate(`/CustomerShopDetails/${product.shopId}`)} className="border border-[#d7dcd6] px-3 py-2 text-xs font-bold text-[#173d3b]">View shop</button>{shop?.phone && <button onClick={() => window.open(`tel:${shop.phone}`)} className="flex items-center gap-1 border border-[#d7dcd6] px-3 py-2 text-xs font-bold text-[#173d3b]"><Phone size={13} /> Call</button>}</div></div></div>{order.status === "Cancelled" && <button onClick={() => onNavigate(`/CustomerReservation?productId=${product.id}`)} className="mt-5 flex items-center gap-2 text-sm font-bold text-[#b75d17]">Reserve again <ArrowUpRight size={15} /></button>}</div>}</article>;
};

const TimelineStep = ({ label, done, active, last }) => <div className="relative flex min-w-0 flex-1 flex-col items-center text-center"><div className="flex w-full items-center"><span className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${done ? "bg-[#3b806a] text-white" : active ? "bg-[#f28a2e] text-white" : "bg-[#dfe5df] text-[#87908d]"}`}>{done ? <Check size={14} /> : <span className="h-2 w-2 rounded-full bg-current" />}</span>{!last && <span className={`h-0.5 flex-1 ${done ? "bg-[#3b806a]" : "bg-[#dfe5df]"}`} />}</div><span className={`mt-2 text-[10px] font-bold ${done || active ? "text-[#173d3b]" : "text-[#9aa39e]"}`}>{label}</span></div>;
const Summary = ({ value, label, tone }) => <div className="border-r border-[#ece9e1] p-4 last:border-r-0 sm:p-5"><p className={`text-2xl font-semibold tracking-[-0.04em] ${tone === "amber" ? "text-[#b75d17]" : tone === "red" ? "text-[#a45d4c]" : tone === "green" ? "text-[#3b806a]" : "text-[#3e6d91]"}`}>{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.13em] text-[#87908d]">{label}</p></div>;
const EmptyOrders = ({ hasOrders, onBrowse, onClear }) => <div className="border border-dashed border-[#cfd5d1] bg-[#fffdfa] px-5 py-16 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#edf5f2] text-[#3b806a]"><TimerReset size={25} /></div><h3 className="mt-5 text-xl font-bold">{hasOrders ? "No orders in this view" : "Your order list is empty"}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#7c8583]">{hasOrders ? "Try another status tab or clear your search." : "When you reserve something from a local shop, the full journey will appear here."}</p><button onClick={hasOrders ? onClear : onBrowse} className="mt-6 bg-[#113b52] px-5 py-3 text-sm font-bold text-white">{hasOrders ? "Show all orders" : "Explore nearby"}</button></div>;
const CustomerNav = ({ navigate }) => <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dfe3de] bg-[#fffdfa]/95 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl"><div className="mx-auto flex max-w-xl items-center justify-around"><NavItem icon={<Home />} label="Home" onClick={() => navigate("/CustomerDashboard")} /><NavItem icon={<MapPin />} label="Nearby" onClick={() => navigate("/Nearby")} /><NavItem icon={<Package />} label="Orders" active onClick={() => navigate("/CustomerOrders")} /><NavItem icon={<HeartIcon />} label="Saved" onClick={() => navigate("/CustomerSaved")} /><NavItem icon={<User />} label="Profile" onClick={() => navigate("/CustomerProfile")} /></div></nav>;
const HeartIcon = () => <span className="text-[20px]">♡</span>;
const NavItem = ({ icon, label, active, onClick }) => <button onClick={onClick} className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5 ${active ? "text-[#113b52]" : "text-[#87908d]"}`}>{React.isValidElement(icon) && icon.type === HeartIcon ? icon : React.cloneElement(icon, { size: 21, strokeWidth: active ? 2.7 : 1.9 })}<span className="text-[11px] font-bold">{label}</span>{active && <span className="absolute -bottom-1 h-0.5 w-8 bg-[#f28a2e]" />}</button>;

export default CustomerOrders;
