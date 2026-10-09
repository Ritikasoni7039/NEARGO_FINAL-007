import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowUpRight,
  Bell,
  Check,
  ChevronRight,
  Clock3,
  Edit3,
  LayoutDashboard,
  MapPin,
  Package,
  Plus,
  Settings2,
  ShoppingBag,
  Store,
  User,
  Users,
  WalletCards,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { shopkeeperProducts, shopkeeperReservations } from "./shopkeeperData";

const readSetting = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("nearGoShopkeeperSettings") || "null");
    return saved || { isOpen: true, acceptsReservations: true };
  } catch {
    return { isOpen: true, acceptsReservations: true };
  }
};

const statusStyle = {
  Pending: "bg-[#fff2df] text-[#b75d17]",
  Confirmed: "bg-[#e9f1f8] text-[#3e6d91]",
  Ready: "bg-[#e5f1ec] text-[#3b806a]",
};

export default function ShopkeeperDashboard() {
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(readSetting);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const fetchShopDataFromSupabase = async () => {
      try {
        // 1. Get current authenticated user session
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;

        if (!user) {
          // If no session, fallback to local/session storage or redirect to login
          const savedLocal = JSON.parse(
            localStorage.getItem("nearGoActiveShop") ||
            sessionStorage.getItem("nearGoShopkeeperData") ||
            "null"
          );
          if (savedLocal) {
            setShop(savedLocal);
          }
          setLoading(false);
          return;
        }

        // 2. Fetch shop data from 'shops' table for this owner
        const { data: shopData, error: shopErr } = await supabase
          .from("shops")
          .select("*")
          .eq("owner_id", user.id)
          .single();

        if (shopErr && shopErr.code !== "PGRST116") {
          console.error("Error fetching shop:", shopErr);
        }

        if (shopData) {
          setShop({
            name: shopData.shop_name,
            ownerName: user.user_metadata?.full_name || "Shop Owner",
            category: shopData.category,
            address: shopData.address || shopData.landmark || "Mandsaur, MP",
            mobile: user.user_metadata?.phone || "Not Provided",
            email: user.email,
            shopType: shopData.shop_type || "permanent",
            subType: shopData.sub_type || "",
            openingTime: shopData.opening_time || "09:00 AM",
            closingTime: shopData.closing_time || "09:00 PM",
            shopImage: shopData.shop_image,
          });
        } else {
          // Fallback if shop row not found yet
          setShop({
            name: "My Registered Shop",
            ownerName: user.user_metadata?.full_name || "Shop Owner",
            category: "General Store",
            address: "Mandsaur, MP",
            mobile: "Not Provided",
            email: user.email,
            shopType: "permanent",
            subType: "",
            openingTime: "09:00 AM",
            closingTime: "09:00 PM",
          });
        }
      } catch (err) {
        console.error("Supabase fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchShopDataFromSupabase();
  }, []);

  const lowStock = useMemo(() => shopkeeperProducts.filter((product) => product.stockStatus === "Low stock"), []);
  const outOfStock = useMemo(() => shopkeeperProducts.filter((product) => product.stockStatus === "Out of stock"), []);

  const updateSettings = (next) => {
    setSettings(next);
    localStorage.setItem("nearGoShopkeeperSettings", JSON.stringify(next));
    setNotice(next.isOpen ? "Your shop is now open" : "Your shop is now closed");
    window.setTimeout(() => setNotice(""), 2200);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f6f2] flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-[#113b52]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f6f2] pb-[calc(5.7rem+env(safe-area-inset-bottom))] text-[#173d3b]">
      <header className="border-b border-[#dfe4dd] bg-[#fffdfa]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-[#113b52] text-white"><Store size={20} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f28a2e]">Shopkeeper workspace</p>
              <h1 className="text-xl font-semibold tracking-[-0.04em] sm:text-2xl">Good morning, {shop?.ownerName?.split(" ")[0]}</h1>
            </div>
          </div>
          <button type="button" onClick={() => navigate("/ShopkeeperProfile")} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf5f2] text-[#113b52]" aria-label="Open shop profile"><User size={19} /></button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-12">
        {notice && <div className="mb-5 flex items-center gap-2 border border-[#c9e0d3] bg-[#edf7f0] px-4 py-3 text-sm font-bold text-[#3b806a]"><Check size={17} /> {notice}</div>}

        {/* Hero Section with Supabase Data */}
        <section className="relative overflow-hidden bg-[#113b52] p-6 text-white sm:p-9">
          <div className="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f5b77b]">
                <Store size={15} /> {shop?.category} 
                <span className="ml-2 rounded bg-[#f28a2e] px-2 py-0.5 text-[10px] text-white uppercase">{shop?.shopType} {shop?.subType ? `(${shop.subType})` : ""}</span>
              </div>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">{shop?.name}</h2>
              <p className="mt-3 flex items-center gap-2 text-sm text-white/65"><MapPin size={15} className="text-[#f28a2e]" />{shop?.address}</p>
              <p className="mt-1 text-xs text-white/50">Timings: {shop?.openingTime} - {shop?.closingTime} | Mobile: {shop?.mobile}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => updateSettings({ ...settings, isOpen: !settings.isOpen })} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold ${settings.isOpen ? "bg-[#3b806a] text-white" : "bg-white/10 text-white"}`}>
                <span className={`h-2 w-2 rounded-full ${settings.isOpen ? "bg-[#b9f0c9]" : "bg-white/50"}`} />
                {settings.isOpen ? "Shop is open" : "Shop is closed"}
              </button>
              <button type="button" onClick={() => navigate("/ShopkeeperProfile")} className="flex items-center gap-2 border border-white/25 px-4 py-2.5 text-sm font-bold text-white"><Edit3 size={15} /> Edit profile</button>
            </div>
          </div>
          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border-[30px] border-white/5" />
          <div className="absolute -bottom-40 right-40 h-72 w-72 rounded-full border-[22px] border-[#f28a2e]/10" />
        </section>

        <section className="mt-5 grid grid-cols-2 border border-[#e3e1d9] bg-[#fffdfa] sm:grid-cols-4">
          <Metric icon={<WalletCards />} value="₹8,420" label="Today's sales" detail="+12% this week" tone="orange" />
          <Metric icon={<ShoppingBag />} value={shopkeeperReservations.length} label="Reservations" detail="Needs attention" tone="blue" />
          <Metric icon={<Package />} value={shopkeeperProducts.length} label="Products listed" detail="Keep stock fresh" tone="teal" />
          <Metric icon={<Bell />} value={lowStock.length + outOfStock.length} label="Stock alerts" detail={`${outOfStock.length} out of stock`} tone="red" />
        </section>

        <div className="mt-7 grid gap-7 lg:grid-cols-[1.2fr_0.8fr]">
          <section>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f28a2e]">Today’s queue</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">Recent reservations</h2>
              </div>
              <button type="button" onClick={() => navigate("/ShopkeeperReservations")} className="flex items-center gap-1 text-sm font-bold text-[#b75d17]">View all <ArrowUpRight size={16} /></button>
            </div>
            <div className="mt-4 space-y-3">
              {shopkeeperReservations.map((reservation) => (
                <article key={reservation.id} className="border border-[#e3e1d9] bg-[#fffdfa] p-4 sm:p-5">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#edf5f2] text-[#113b52]"><Users size={18} /></div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold">{reservation.customerName}</h3>
                          <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${statusStyle[reservation.status]}`}>{reservation.status}</span>
                        </div>
                        <p className="mt-1 truncate text-sm text-[#7c8583]">{reservation.productName} · Qty {reservation.quantity}</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-bold">₹{reservation.total.toLocaleString("en-IN")}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-[#7c8583] sm:justify-end"><Clock3 size={13} />{reservation.pickupTime}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[#ece9e1] pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#a0aaa5]">{reservation.id}</span>
                    <button type="button" onClick={() => navigate("/ShopkeeperReservations")} className="flex items-center gap-1 text-xs font-bold text-[#b75d17]">Manage request <ChevronRight size={15} /></button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f28a2e]">Inventory health</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">Stock snapshot</h2>
              </div>
              <button type="button" onClick={() => navigate("/ShopkeeperInventory")} className="text-sm font-bold text-[#b75d17]">Manage</button>
            </div>
            <div className="mt-4 border border-[#e3e1d9] bg-[#fffdfa] p-5">
              <div className="flex items-center justify-between border-b border-[#ece9e1] pb-4">
                <span className="text-sm text-[#7c8583]">Products needing attention</span>
                <span className="text-2xl font-semibold text-[#b75d17]">{lowStock.length + outOfStock.length}</span>
              </div>
              <div className="mt-4 space-y-3">
                {[...lowStock, ...outOfStock].map((product) => (
                  <div key={product.id} className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center bg-[#fff1e4] text-lg">{product.emoji}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{product.name}</p>
                        <p className="mt-0.5 text-xs text-[#7c8583]">{product.quantity} units left</p>
                      </div>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold uppercase ${product.stockStatus === "Out of stock" ? "text-[#a45d4c]" : "text-[#b75d17]"}`}>{product.stockStatus}</span>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => navigate("/ShopkeeperInventory")} className="mt-5 flex w-full items-center justify-center gap-2 border-t border-[#ece9e1] pt-4 text-sm font-bold text-[#b75d17]">Update inventory <ArrowUpRight size={15} /></button>
            </div>
          </section>
        </div>

        <section className="mt-7">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f28a2e]">Quick actions</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Keep your shop moving</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <QuickAction icon={<Plus />} title="Add product" text="List new local stock" onClick={() => navigate("/ShopkeeperInventory?add=true")} />
            <QuickAction icon={<Users />} title="Reservations" text="Respond to customers" onClick={() => navigate("/ShopkeeperReservations")} />
            <QuickAction icon={<Settings2 />} title="Shop settings" text="Hours and preferences" onClick={() => navigate("/ShopkeeperProfile")} />
          </div>
        </section>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dfe3de] bg-[#fffdfa]/95 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center justify-around">
          <ShopNav icon={<LayoutDashboard />} label="Dashboard" active onClick={() => navigate("/ShopkeeperDashboard")} />
          <ShopNav icon={<Package />} label="Inventory" onClick={() => navigate("/ShopkeeperInventory")} />
          <ShopNav icon={<Users />} label="Requests" onClick={() => navigate("/ShopkeeperReservations")} badge={shopkeeperReservations.filter((item) => item.status === "Pending").length} />
          <ShopNav icon={<User />} label="Profile" onClick={() => navigate("/ShopkeeperProfile")} />
        </div>
      </nav>
    </main>
  );
}

const Metric = ({ icon, value, label, detail, tone }) => (
  <div className="border-r border-[#ece9e1] p-4 last:border-r-0 sm:p-5">
    <div className={`flex h-9 w-9 items-center justify-center ${tone === "orange" ? "bg-[#fff1e4] text-[#f28a2e]" : tone === "blue" ? "bg-[#e9f1f8] text-[#3e6d91]" : tone === "red" ? "bg-[#f5e8e4] text-[#a45d4c]" : "bg-[#e5f1ec] text-[#3b806a]"}`}>
      {React.cloneElement(icon, { size: 17 })}
    </div>
    <p className="mt-4 text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">{value}</p>
    <p className="mt-1 text-xs font-bold text-[#5e6d75]">{label}</p>
    <p className="mt-1 text-[10px] text-[#87908d]">{detail}</p>
  </div>
);

const QuickAction = ({ icon, title, text, onClick }) => (
  <button type="button" onClick={onClick} className="flex items-center gap-3 border border-[#e3e1d9] bg-[#fffdfa] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#f28a2e]">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#edf5f2] text-[#113b52]">{React.cloneElement(icon, { size: 18 })}</span>
    <span className="min-w-0 flex-1"><b className="block text-sm">{title}</b><small className="mt-1 block text-xs text-[#7c8583]">{text}</small></span>
    <ChevronRight size={16} className="text-[#87908d]" />
  </button>
);

const ShopNav = ({ icon, label, active, onClick, badge }) => (
  <button type="button" onClick={onClick} className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5 ${active ? "text-[#113b52] font-bold" : "text-[#87908d]"}`}>
    <span className="relative">
      {React.cloneElement(icon, { size: 21, strokeWidth: active ? 2.7 : 1.9 })}
      {badge > 0 && <b className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f28a2e] px-1 text-[9px] text-white">{badge}</b>}
    </span>
    <span className="text-[10px] font-bold sm:text-[11px]">{label}</span>
    {active && <span className="absolute -bottom-1 h-0.5 w-8 bg-[#f28a2e]" />}
  </button>
);