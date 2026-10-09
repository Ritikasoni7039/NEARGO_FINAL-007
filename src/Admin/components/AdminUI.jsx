import React from "react";
import { BarChart3, Building2, LayoutDashboard, Settings, ShieldCheck, ShoppingBag, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const links = [
  [LayoutDashboard, "Dashboard", "/AdminDashboard"],
  [Users, "Users", "/AdminUsers"],
  [Building2, "Shops", "/AdminShops"],
  [ShoppingBag, "Reservations", "/AdminReservations"],
  [BarChart3, "Analytics", "/AdminAnalytics"],
  [Settings, "Settings", "/AdminSettings"],
];

export function AdminNavigation({ active = "Dashboard" }) {
  const navigate = useNavigate();
  return <aside className="hidden w-64 shrink-0 border-r border-[#dfe4dd] bg-[#fffdfa] lg:block"><div className="sticky top-0 flex h-screen flex-col p-5"><div className="flex items-center gap-3 border-b border-[#ece9e1] pb-6"><div className="flex h-10 w-10 items-center justify-center bg-[#113b52] text-white"><ShieldCheck size={21} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f28a2e]">NEAR-GO</p><p className="font-bold text-[#173d3b]">Admin console</p></div></div><nav className="mt-7 space-y-1">{links.map(([Icon, label, path]) => <button type="button" key={label} onClick={() => navigate(path)} className={`flex w-full items-center gap-3 px-3 py-3 text-left text-sm font-bold ${active === label ? "bg-[#113b52] text-white" : "text-[#6e7b7b] hover:bg-[#edf5f2] hover:text-[#113b52]"}`}><Icon size={18} />{label}</button>)}</nav><div className="mt-auto border-t border-[#ece9e1] pt-5"><p className="text-xs font-bold text-[#173d3b]">System healthy</p><p className="mt-1 text-xs text-[#7c8583]">Last sync · just now</p></div></div></aside>;
}

export function AdminMobileNav({ active = "Dashboard" }) {
  const navigate = useNavigate();
  const mobileLinks = links.slice(0, 5);
  return <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dfe3de] bg-[#fffdfa]/95 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden"><div className="mx-auto flex max-w-xl items-center justify-around">{mobileLinks.map(([Icon, label, path]) => <button type="button" key={label} onClick={() => navigate(path)} className={`flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5 ${active === label ? "text-[#113b52]" : "text-[#87908d]"}`}><Icon size={19} strokeWidth={active === label ? 2.7 : 1.9} /><span className="text-[9px] font-bold">{label}</span></button>)}</div></nav>;
}

export function AdminStatusBadge({ status }) {
  const tone = status === "Active" || status === "Completed" ? "bg-[#e5f1ec] text-[#3b806a]" : status === "Suspended" || status === "Cancelled" ? "bg-[#f5e8e4] text-[#a45d4c]" : status === "Pending" || status === "Pending approval" || status === "Pending review" ? "bg-[#fff2df] text-[#b75d17]" : "bg-[#e9f1f8] text-[#3e6d91]";
  return <span className={`inline-flex px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${tone}`}>{status}</span>;
}

export function AdminMetric({ icon, value, label, detail, tone = "navy" }) {
  const color = tone === "orange" ? "text-[#b75d17]" : tone === "green" ? "text-[#3b806a]" : tone === "red" ? "text-[#a45d4c]" : "text-[#113b52]";
  return <div className="border-r border-[#ece9e1] p-4 last:border-r-0 sm:p-5"><div className={`flex h-9 w-9 items-center justify-center bg-[#edf5f2] ${color}`}>{React.cloneElement(icon, { size: 17 })}</div><p className={`mt-4 text-2xl font-semibold tracking-[-0.05em] ${color}`}>{value}</p><p className="mt-1 text-xs font-bold text-[#5e6d75]">{label}</p><p className="mt-1 text-[10px] text-[#87908d]">{detail}</p></div>;
}
