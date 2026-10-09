import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Store,
  User,
  Phone,
  Mail,
  Clock,
  LogOut,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { supabase } from "../supabaseClient";

export default function ShopkeeperProfile() {
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileFromSupabase = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;

        if (!user) {
          const savedLocal = JSON.parse(
            localStorage.getItem("nearGoActiveShop") ||
            sessionStorage.getItem("nearGoShopkeeperData") ||
            "null"
          );
          if (savedLocal) setShop(savedLocal);
          setLoading(false);
          return;
        }

        const { data: shopData } = await supabase
          .from("shops")
          .select("*")
          .eq("owner_id", user.id)
          .single();

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
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileFromSupabase();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("nearGoActiveShop");
    sessionStorage.clear();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f6f2] flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-[#113b52]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f6f2] pb-12 text-[#173d3b]">
      <header className="border-b border-[#dfe4dd] bg-[#fffdfa] px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/ShopkeeperDashboard")}
            className="flex items-center gap-2 text-sm font-bold text-[#113b52]"
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
          <h1 className="text-base font-bold text-[#113b52]">Shopkeeper Profile</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-[#e3e1d9] bg-[#fffdfa] shadow-sm">
          <div className="bg-gradient-to-r from-[#113b52] to-[#167770] p-6 text-white sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white/20 bg-white/10 shrink-0 flex items-center justify-center text-white">
                {shop?.shopImage ? (
                  <img src={shop.shopImage} alt="Shop" className="h-full w-full object-cover" />
                ) : (
                  <User size={40} />
                )}
              </div>
              <div className="text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold mb-2">
                  <ShieldCheck size={14} /> Verified {shop?.shopType?.toUpperCase()} Vendor
                </div>
                <h2 className="text-2xl font-bold">{shop?.name || "My Shop"}</h2>
                <p className="text-sm text-white/80 mt-0.5">Owner: {shop?.ownerName || "Owner"}</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Update Location Button for Everyone */}
            <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#0b2940]">Manage Shop / Spot Location</h3>
                <p className="text-xs text-gray-600 mt-0.5">Update your current operating coordinates or area details.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/Update_Location")}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#f28a2e] px-5 py-3 text-xs font-bold text-white shadow hover:bg-orange-600 transition"
              >
                <MapPin size={16} /> Update Location Now
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#f8fafb] border border-gray-100">
                <Store size={20} className="text-[#f28a2e] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase">Category</p>
                  <p className="text-sm font-bold text-[#113b52] mt-0.5">{shop?.category || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#f8fafb] border border-gray-100">
                <Phone size={20} className="text-[#f28a2e] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase">Mobile Number</p>
                  <p className="text-sm font-bold text-[#113b52] mt-0.5">{shop?.mobile || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#f8fafb] border border-gray-100">
                <Mail size={20} className="text-[#f28a2e] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase">Email Address</p>
                  <p className="text-sm font-bold text-[#113b52] mt-0.5">{shop?.email || "N/A"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#f8fafb] border border-gray-100">
                <Clock size={20} className="text-[#f28a2e] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase">Operating Hours</p>
                  <p className="text-sm font-bold text-[#113b52] mt-0.5">{shop?.openingTime} - {shop?.closingTime}</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#f8fafb] border border-gray-100">
              <MapPin size={20} className="text-[#f28a2e] shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase">Registered Address / Landmark</p>
                <p className="text-sm font-bold text-[#113b52] mt-0.5">{shop?.address || "N/A"}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600 hover:bg-red-100 transition"
            >
              <LogOut size={18} /> Logout Workspace
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}