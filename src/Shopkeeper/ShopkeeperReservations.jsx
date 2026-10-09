import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock3,
  Home,
  MapPin,
  Package,
  Phone,
  Search,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { currentShop, shopkeeperReservations } from "./shopkeeperData";

const tabs = ["All", "Pending", "Confirmed", "Ready", "Completed", "Cancelled"];

const readReservations = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("nearGoShopkeeperReservations") || "null");
    return Array.isArray(saved) ? saved : shopkeeperReservations;
  } catch {
    return shopkeeperReservations;
  }
};

const statusStyles = {
  Pending: { tone: "bg-[#fff2df] text-[#b75d17]", icon: Clock3, description: "Waiting for your response" },
  Confirmed: { tone: "bg-[#e9f1f8] text-[#3e6d91]", icon: CheckCircle2, description: "Customer can collect during the pickup window" },
  Ready: { tone: "bg-[#e5f1ec] text-[#3b806a]", icon: Package, description: "Item is ready at the counter" },
  Completed: { tone: "bg-[#e5f1ec] text-[#3b806a]", icon: Check, description: "Pickup completed successfully" },
  Cancelled: { tone: "bg-[#f5e8e4] text-[#a45d4c]", icon: XCircle, description: "This request has been cancelled" },
};

export default function ShopkeeperReservations() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState(readReservations);
  const [activeTab, setActiveTab] = useState("All");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [notice, setNotice] = useState("");

  const counts = useMemo(() => tabs.reduce((all, tab) => ({ ...all, [tab]: tab === "All" ? reservations.length : reservations.filter((item) => item.status === tab).length }), {}), [reservations]);
  const visibleReservations = useMemo(() => reservations.filter((reservation) => {
    const text = `${reservation.id} ${reservation.customerName} ${reservation.productName}`.toLowerCase();
    return (activeTab === "All" || reservation.status === activeTab) && (!query.trim() || text.includes(query.trim().toLowerCase()));
  }), [reservations, activeTab, query]);

  const updateStatus = (id, status) => {
    const updated = reservations.map((reservation) => reservation.id === id ? { ...reservation, status, updatedAt: new Date().toISOString() } : reservation);
    setReservations(updated);
    localStorage.setItem("nearGoShopkeeperReservations", JSON.stringify(updated));
    setNotice(status === "Cancelled" ? "Reservation cancelled" : `Reservation marked ${status.toLowerCase()}`);
    window.setTimeout(() => setNotice(""), 2200);
  };

  const actionFor = (reservation) => {
    if (reservation.status === "Pending") return <><ActionButton onClick={() => updateStatus(reservation.id, "Confirmed")} tone="primary"><Check size={15} /> Accept</ActionButton><ActionButton onClick={() => updateStatus(reservation.id, "Cancelled")} tone="quiet"><X size={15} /> Decline</ActionButton></>;
    if (reservation.status === "Confirmed") return <ActionButton onClick={() => updateStatus(reservation.id, "Ready")} tone="primary"><Package size={15} /> Mark ready</ActionButton>;
    if (reservation.status === "Ready") return <ActionButton onClick={() => updateStatus(reservation.id, "Completed")} tone="primary"><Check size={15} /> Complete pickup</ActionButton>;
    return null;
  };

  return (
    <main className="min-h-screen bg-[#f5f6f2] pb-[calc(5.8rem+env(safe-area-inset-bottom))] text-[#173d3b]">
      <header className="border-b border-[#dfe4dd] bg-[#fffdfa]"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12"><div className="flex items-center gap-3"><button type="button" onClick={() => navigate(-1)} className="rounded-full p-2 text-[#65737a] hover:bg-[#f0f1ed]" aria-label="Go back"><ArrowLeft size={19} /></button><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f28a2e]">{currentShop.name}</p><h1 className="text-2xl font-semibold tracking-[-0.05em]">Reservations</h1></div></div><button type="button" onClick={() => navigate("/ShopkeeperProfile")} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf5f2] text-[#113b52]" aria-label="Open shop profile"><User size={19} /></button></div></header>

      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-12">
        {notice && <div className="mb-5 flex items-center gap-2 border border-[#c9e0d3] bg-[#edf7f0] px-4 py-3 text-sm font-bold text-[#3b806a]"><Check size={17} /> {notice}</div>}
        <section className="relative overflow-hidden bg-[#113b52] p-6 text-white sm:p-9"><div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f5b77b]"><Users size={15} /> Customer requests</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">Keep every pickup clear.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/65">Respond quickly, prepare the item and keep customers updated.</p></div><div className="text-left sm:text-right"><p className="text-4xl font-semibold tracking-[-0.06em]">{counts.Pending || 0}</p><p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-white/55">Needs response</p></div></div><div className="absolute -right-12 -top-20 h-60 w-60 rounded-full border-[28px] border-white/5" /></section>

        <section className="mt-5 flex flex-col gap-4 border border-[#e3e1d9] bg-[#fffdfa] p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 flex-1 items-center gap-2 border-b border-[#cfd5d1] pb-2 lg:max-w-md"><Search size={18} className="shrink-0 text-[#7c8583]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer or product" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />{query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={16} /></button>}</div><div className="flex gap-2 overflow-x-auto pb-1">{tabs.map((tab) => <button type="button" key={tab} onClick={() => setActiveTab(tab)} className={`flex shrink-0 items-center gap-2 border px-3 py-2 text-xs font-bold ${activeTab === tab ? "border-[#113b52] bg-[#113b52] text-white" : "border-[#d7dcd6] text-[#7c8583]"}`}>{tab}<span className={activeTab === tab ? "text-white/65" : "text-[#a1aaa5]"}>{counts[tab]}</span></button>)}</div></section>

        <section className="mt-5 space-y-3">{visibleReservations.map((reservation) => { const config = statusStyles[reservation.status] || statusStyles.Pending; const StatusIcon = config.icon; const isExpanded = expanded === reservation.id; return <article key={reservation.id} className="border border-[#e3e1d9] bg-[#fffdfa]"><div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center"><div className="flex min-w-0 flex-1 items-center gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#edf5f2] text-[#113b52]"><User size={19} /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{reservation.customerName}</h3><span className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${config.tone}`}><StatusIcon size={12} />{reservation.status}</span></div><p className="mt-1 truncate text-sm text-[#7c8583]">{reservation.productName} · Qty {reservation.quantity}</p><p className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#5e6d75]"><Clock3 size={13} className="text-[#f28a2e]" />{reservation.pickupTime}</p></div></div><div className="flex flex-wrap items-center gap-2 lg:justify-end"><span className="mr-2 text-lg font-semibold">₹{Number(reservation.total).toLocaleString("en-IN")}</span>{actionFor(reservation)}<button type="button" onClick={() => setExpanded(isExpanded ? null : reservation.id)} className="border border-[#d7dcd6] px-3 py-2 text-xs font-bold text-[#5e6d75]">{isExpanded ? "Hide" : "Details"}</button></div></div>{isExpanded && <div className="border-t border-[#ece9e1] bg-[#fcfbf7] px-5 py-5"><div className="grid gap-5 md:grid-cols-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#87908d]">Reservation ID</p><p className="mt-2 font-bold">{reservation.id}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#87908d]">Customer contact</p><p className="mt-2 font-bold">{reservation.customerPhone || "+91 98765 43210"}</p></div><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#87908d]">Current step</p><p className="mt-2 flex items-center gap-2 text-sm font-semibold"><span className={`h-2 w-2 rounded-full ${reservation.status === "Cancelled" ? "bg-[#a45d4c]" : "bg-[#3b806a]"}`} />{config.description}</p></div></div><div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => window.open(`tel:${reservation.customerPhone || "+919876543210"}`)} className="flex items-center gap-2 border border-[#d7dcd6] px-3 py-2 text-xs font-bold"><Phone size={14} /> Call customer</button>{reservation.status !== "Completed" && reservation.status !== "Cancelled" && <button type="button" onClick={() => updateStatus(reservation.id, "Cancelled")} className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#a45d4c]"><XCircle size={14} /> Cancel reservation</button>}</div></div>}</article>; })}{visibleReservations.length === 0 && <div className="border border-dashed border-[#cfd5d1] bg-[#fffdfa] px-5 py-16 text-center"><Users className="mx-auto text-[#7c8583]" size={30} /><h3 className="mt-4 text-xl font-bold">No reservations here</h3><p className="mt-2 text-sm text-[#7c8583]">Try another status tab or search term.</p><button type="button" onClick={() => { setActiveTab("All"); setQuery(""); }} className="mt-5 bg-[#113b52] px-5 py-2.5 text-sm font-bold text-white">Show all requests</button></div>}</section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dfe3de] bg-[#fffdfa]/95 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl"><div className="mx-auto flex max-w-xl items-center justify-around"><ShopNav icon={<Home />} label="Dashboard" onClick={() => navigate("/ShopkeeperDashboard")} /><ShopNav icon={<Package />} label="Inventory" onClick={() => navigate("/ShopkeeperInventory")} /><ShopNav icon={<Users />} label="Requests" active onClick={() => navigate("/ShopkeeperReservations")} /><ShopNav icon={<User />} label="Profile" onClick={() => navigate("/ShopkeeperProfile")} /></div></nav>
    </main>
  );
}

const ActionButton = ({ children, onClick, tone }) => <button type="button" onClick={onClick} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold ${tone === "primary" ? "bg-[#f28a2e] text-white hover:bg-[#df751c]" : "border border-[#d7dcd6] text-[#a45d4c]"}`}>{children}</button>;
const ShopNav = ({ icon, label, active, onClick }) => <button type="button" onClick={onClick} className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5 ${active ? "text-[#113b52]" : "text-[#87908d]"}`}>{React.cloneElement(icon, { size: 21, strokeWidth: active ? 2.7 : 1.9 })}<span className="text-[10px] font-bold sm:text-[11px]">{label}</span>{active && <span className="absolute -bottom-1 h-0.5 w-8 bg-[#f28a2e]" />}</button>;
