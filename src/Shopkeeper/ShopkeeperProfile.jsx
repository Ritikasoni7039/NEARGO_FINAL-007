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
  Edit2,
  Check,
  PlusCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { supabase } from "../supabaseClient";

export default function ShopkeeperProfile() {
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    username: "",
    role: "seller",
  });

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    fullName: "",
    phone: "",
    username: "",
    shopName: "",
    category: "Grocery & Daily Essentials",
    address: "",
    landmark: "",
    currentArea: "",
    openingTime: "08:00 AM",
    closingTime: "09:00 PM",
  });

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

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

        setUserId(user.id);

        // Fetch user profile from profiles table
        const { data: profData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        const userProf = {
          fullName: profData?.full_name || user.user_metadata?.full_name || "Shop Owner",
          email: profData?.email || user.email || "",
          phone: profData?.phone || user.user_metadata?.phone || "",
          username: profData?.username || "",
          role: profData?.role || "seller",
        };
        setProfile(userProf);

        // Fetch shop details for this owner
        const { data: shopData } = await supabase
          .from("shops")
          .select("*")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (shopData) {
          const formattedShop = {
            id: shopData.id,
            name: shopData.shop_name,
            ownerName: userProf.fullName,
            category: shopData.category || "Grocery & Daily Essentials",
            address: shopData.address || "",
            landmark: shopData.landmark || "",
            mobile: userProf.phone || "Not set",
            email: userProf.email || user.email,
            shopType: shopData.shop_type || "permanent",
            openingTime: shopData.opening_time || "08:00 AM",
            closingTime: shopData.closing_time || "09:00 PM",
            shopImage: shopData.shop_image,
            currentArea: shopData.current_area || "",
            latitude: shopData.latitude,
            longitude: shopData.longitude,
          };
          setShop(formattedShop);

          setDraft({
            fullName: userProf.fullName,
            phone: userProf.phone,
            username: userProf.username,
            shopName: formattedShop.name || "",
            category: formattedShop.category || "Grocery & Daily Essentials",
            address: formattedShop.address || "",
            landmark: formattedShop.landmark || "",
            currentArea: formattedShop.currentArea || "",
            openingTime: formattedShop.openingTime || "08:00 AM",
            closingTime: formattedShop.closingTime || "09:00 PM",
          });
        } else {
          // Initialize draft for when no shop exists yet
          setDraft({
            fullName: userProf.fullName,
            phone: userProf.phone,
            username: userProf.username,
            shopName: `${userProf.fullName}'s Store`,
            category: "Grocery & Daily Essentials",
            address: "Main Market, Mandsaur",
            landmark: "Near Gandhi Chowk",
            currentArea: "Gandhi Chowk",
            openingTime: "08:00 AM",
            closingTime: "09:00 PM",
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

  const handleSaveProfileAndShop = async (e) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setSaveMsg("");

    try {
      // 1. Update profiles table
      await supabase
        .from("profiles")
        .update({
          full_name: draft.fullName.trim(),
          phone: draft.phone.trim(),
          username: draft.username.trim(),
        })
        .eq("id", userId);

      setProfile((prev) => ({
        ...prev,
        fullName: draft.fullName.trim(),
        phone: draft.phone.trim(),
        username: draft.username.trim(),
      }));

      // 2. Insert or update shops table
      const shopPayload = {
        owner_id: userId,
        shop_name: draft.shopName.trim() || `${draft.fullName.trim()}'s Store`,
        category: draft.category,
        address: draft.address.trim(),
        landmark: draft.landmark.trim(),
        current_area: draft.currentArea.trim(),
        opening_time: draft.openingTime.trim(),
        closing_time: draft.closingTime.trim(),
        is_live: true,
      };

      if (shop?.id) {
        await supabase
          .from("shops")
          .update(shopPayload)
          .eq("id", shop.id);

        setShop((prev) => ({
          ...prev,
          name: shopPayload.shop_name,
          category: shopPayload.category,
          address: shopPayload.address,
          landmark: shopPayload.landmark,
          currentArea: shopPayload.current_area,
          openingTime: shopPayload.opening_time,
          closingTime: shopPayload.closing_time,
          mobile: draft.phone.trim(),
        }));
      } else {
        const { data: newShop } = await supabase
          .from("shops")
          .insert([{
            ...shopPayload,
            city: "Mandsaur",
            pincode: "458001",
            latitude: 24.0722,
            longitude: 75.0683,
            shop_type: "permanent",
            shop_image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80",
          }])
          .select()
          .single();

        if (newShop) {
          setShop({
            id: newShop.id,
            name: newShop.shop_name,
            category: newShop.category,
            address: newShop.address,
            landmark: newShop.landmark,
            currentArea: newShop.current_area,
            openingTime: newShop.opening_time,
            closingTime: newShop.closing_time,
            mobile: draft.phone.trim(),
            email: profile.email,
            shopType: "permanent",
          });
        }
      }

      setEditing(false);
      setSaveMsg("Shop and profile details updated successfully!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      console.error("Profile update error:", err);
      setSaveMsg(`Update failed: ${err.message || "Please check your details"}`);
    } finally {
      setSaving(false);
    }
  };

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
          <h1 className="text-base font-bold text-[#113b52]">Seller Profile & Shop Settings</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-[#e3e1d9] bg-[#fffdfa] shadow-sm">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#113b52] to-[#167770] p-6 text-white sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-white/20 bg-white/10 shrink-0 flex items-center justify-center text-white">
                {shop?.shopImage ? (
                  <img src={shop.shopImage} alt="Shop" className="h-full w-full object-cover" />
                ) : (
                  <User size={40} />
                )}
              </div>
              <div className="text-center sm:text-left flex-1">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold mb-2">
                  <ShieldCheck size={14} /> Verified {shop?.shopType ? shop.shopType.toUpperCase() : "SELLER"} Vendor
                </div>
                <h2 className="text-2xl font-bold sm:text-3xl">
                  {shop?.name || `${profile.fullName}'s Store`}
                </h2>
                <p className="text-sm text-white/80 mt-0.5">
                  Owner: {profile.fullName || "Store Owner"} · {shop?.category || "Local Business"}
                </p>
              </div>
              {!editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-xl bg-[#f28a2e] px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-orange-600 transition"
                >
                  Edit Profile & Shop
                </button>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6 sm:p-8">
            {saveMsg && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-xs font-bold text-green-700 flex items-center gap-2">
                <Check size={16} /> {saveMsg}
              </div>
            )}

            {/* If shop details missing prompt */}
            {!shop && !editing && (
              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
                <div className="flex items-start gap-3">
                  <PlusCircle size={22} className="text-[#ea580c] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-[#173d3b]">Add your shop details</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      Your store details are not set up yet. Add your shop name, category, and operating hours so customers can find your stock!
                    </p>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="mt-3 rounded-lg bg-[#ea580c] px-4 py-2 text-xs font-bold text-white hover:bg-[#c2410c]"
                    >
                      Setup Shop Now
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Editable Form */}
            {editing ? (
              <form onSubmit={handleSaveProfileAndShop} className="space-y-6">
                <div className="border-b border-gray-200 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#113b52]">
                    1. Owner Personal Details
                  </h3>
                  <p className="text-xs text-gray-500">Your profile information linked to Supabase profiles.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={draft.fullName}
                      onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-[#f28a2e]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Phone Number</label>
                    <input
                      type="text"
                      value={draft.phone}
                      onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-[#f28a2e]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Username</label>
                    <input
                      type="text"
                      value={draft.username}
                      onChange={(e) => setDraft({ ...draft, username: e.target.value })}
                      placeholder="e.g. sharma_store"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-[#f28a2e]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Email (Read-only)</label>
                    <input
                      type="text"
                      disabled
                      value={profile.email}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500"
                    />
                  </div>
                </div>

                <div className="border-b border-gray-200 pb-3 pt-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#113b52]">
                    2. Shop & Store Details
                  </h3>
                  <p className="text-xs text-gray-500">Visible to customers when browsing nearby in Mandsaur.</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Shop Name *</label>
                    <input
                      type="text"
                      required
                      value={draft.shopName}
                      onChange={(e) => setDraft({ ...draft, shopName: e.target.value })}
                      placeholder="e.g. Jain Provision Store"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-[#f28a2e]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Category *</label>
                    <select
                      value={draft.category}
                      onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-[#f28a2e]"
                    >
                      {draft.category && ![
                        "Grocery & Daily Essentials", "Grocery Store", "Stationery & Books", "Stationery & Study Essentials",
                        "Electronics", "Mobile & Accessories", "Fresh Fruits & Vegetables", "Pharmacy", "Pharmacy & Wellness",
                        "Clothing & Footwear", "Clothing & Fashion", "Hardware & Tools", "Sweets, Bakery & Snacks",
                        "Restaurant", "Cafe & Bakery", "Beauty & Cosmetics", "Furniture", "Jewellery", "Other"
                      ].includes(draft.category) && (
                        <option value={draft.category}>{draft.category}</option>
                      )}
                      <option>Grocery & Daily Essentials</option>
                      <option>Grocery Store</option>
                      <option>Stationery & Books</option>
                      <option>Stationery & Study Essentials</option>
                      <option>Electronics</option>
                      <option>Mobile & Accessories</option>
                      <option>Fresh Fruits & Vegetables</option>
                      <option>Pharmacy & Wellness</option>
                      <option>Pharmacy</option>
                      <option>Clothing & Footwear</option>
                      <option>Clothing & Fashion</option>
                      <option>Hardware & Tools</option>
                      <option>Sweets, Bakery & Snacks</option>
                      <option>Restaurant</option>
                      <option>Cafe & Bakery</option>
                      <option>Beauty & Cosmetics</option>
                      <option>Furniture</option>
                      <option>Jewellery</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Registered Address</label>
                    <input
                      type="text"
                      value={draft.address}
                      onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                      placeholder="e.g. Main Market, Gandhi Chowk"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-[#f28a2e]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Landmark</label>
                    <input
                      type="text"
                      value={draft.landmark}
                      onChange={(e) => setDraft({ ...draft, landmark: e.target.value })}
                      placeholder="e.g. Opp. Clock Tower"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-[#f28a2e]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Opening Time</label>
                    <input
                      type="text"
                      value={draft.openingTime}
                      onChange={(e) => setDraft({ ...draft, openingTime: e.target.value })}
                      placeholder="08:00 AM"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-[#f28a2e]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Closing Time</label>
                    <input
                      type="text"
                      value={draft.closingTime}
                      onChange={(e) => setDraft({ ...draft, closingTime: e.target.value })}
                      placeholder="09:30 PM"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-[#f28a2e]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Operating Spot / Area</label>
                    <input
                      type="text"
                      value={draft.currentArea}
                      onChange={(e) => setDraft({ ...draft, currentArea: e.target.value })}
                      placeholder="e.g. Gandhi Chowk, Station Road, Bus Stand"
                      className="mt-1 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none focus:border-[#f28a2e]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="rounded-xl border border-gray-300 px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-[#f28a2e] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-orange-600 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                    {saving ? "Saving..." : "Save All Details"}
                  </button>
                </div>
              </form>
            ) : (
              /* View Mode */
              <div className="space-y-6">
                {/* Account card */}
                <div className="rounded-2xl border border-gray-200 bg-[#fbfcfb] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-[#113b52]">Owner Account Information</h3>
                      <p className="text-xs text-gray-500">Personal identity and credentials.</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 font-bold uppercase text-[10px]">Owner Name</span>
                      <p className="font-bold text-[#113b52] mt-0.5">
                        {profile.fullName || "Add your name"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold uppercase text-[10px]">Username</span>
                      <p className="font-bold text-[#113b52] mt-0.5">
                        {profile.username || "Not set (Click edit to add)"}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold uppercase text-[10px]">Account Role</span>
                      <p className="font-bold text-[#3b806a] mt-0.5">
                        {profile.role ? profile.role.toUpperCase() : "SELLER"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shop Information Cards */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#f8fafb] border border-gray-100">
                    <Store size={20} className="text-[#f28a2e] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase">Category</p>
                      <p className="text-sm font-bold text-[#113b52] mt-0.5">
                        {shop?.category || "Add your shop category"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#f8fafb] border border-gray-100">
                    <Phone size={20} className="text-[#f28a2e] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase">Contact Mobile</p>
                      <p className="text-sm font-bold text-[#113b52] mt-0.5">
                        {profile.phone || shop?.mobile || "Add your phone number"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#f8fafb] border border-gray-100">
                    <Mail size={20} className="text-[#f28a2e] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase">Email Address</p>
                      <p className="text-sm font-bold text-[#113b52] mt-0.5">
                        {profile.email || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#f8fafb] border border-gray-100">
                    <Clock size={20} className="text-[#f28a2e] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase">Operating Hours</p>
                      <p className="text-sm font-bold text-[#113b52] mt-0.5">
                        {shop?.openingTime ? `${shop.openingTime} - ${shop.closingTime}` : "08:00 AM - 09:30 PM"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#f8fafb] border border-gray-100">
                  <MapPin size={20} className="text-[#f28a2e] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase">Registered Address / Landmark</p>
                    <p className="text-sm font-bold text-[#113b52] mt-0.5">
                      {shop?.address ? `${shop.address} ${shop.landmark ? `(${shop.landmark})` : ""}` : "Add your shop landmark / address"}
                    </p>
                  </div>
                </div>

                {/* Location Update Action */}
                <div className="rounded-2xl bg-orange-50 border border-orange-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#0b2940]">Live Operating Spot & GPS Coordinates</h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Current spot: <strong className="text-[#ea580c]">{shop?.currentArea || "Gandhi Chowk, Mandsaur"}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/Update_Location")}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#f28a2e] px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-orange-600 transition"
                  >
                    <MapPin size={15} /> Update Live Spot
                  </button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-600 hover:bg-red-100 transition mt-6"
            >
              <LogOut size={18} /> Logout Workspace
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}