import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, Loader2, Store } from "lucide-react";
import { supabase } from "../supabaseClient";

const ShopkeeperLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Authenticate with Supabase Auth
      const { data: authData, error: loginErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (loginErr) {
        throw new Error(loginErr.message || "Invalid email or password.");
      }

      const user = authData?.user;
      if (!user) {
        throw new Error("Login failed. No active session found.");
      }

      // 1.5 Verify that user profile actually exists in 'profiles' table
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!profileData) {
        await supabase.auth.signOut();
        throw new Error("This seller profile has been deleted or deactivated. You cannot log in.");
      }

      // Check role - Customer should not access seller workspace
      if (profileData.role === "customer") {
        await supabase.auth.signOut();
        throw new Error("This account is registered as a Customer. Please log in from the Customer Login page.");
      }

      // 2. Fetch shop details for this owner from 'shops' table
      const { data: shopData, error: shopErr } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (shopErr) {
        console.warn("Shop fetch warning:", shopErr.message);
      }

      // 3. Save active shop details into localStorage
      const activeShopInfo = {
        id: shopData?.id || null,
        shopName: shopData?.shop_name || user.user_metadata?.shop_name || "My Shop",
        ownerName: user.user_metadata?.full_name || shopData?.owner_name || "Shop Owner",
        category: shopData?.category || "General Store",
        address: shopData?.address || shopData?.landmark || "Mandsaur",
        landmark: shopData?.landmark || "",
        city: shopData?.city || "Mandsaur",
        pincode: shopData?.pincode || "458001",
        shopType: shopData?.shop_type || "permanent",
        subType: shopData?.sub_type || "",
        mobile: user.user_metadata?.phone || shopData?.phone || "",
        email: user.email,
        latitude: shopData?.latitude,
        longitude: shopData?.longitude,
        currentArea: shopData?.current_area || "",
        isLive: shopData?.is_live !== false,
        shopImage: shopData?.shop_image || null,
        openingTime: shopData?.opening_time || "09:00 AM",
        closingTime: shopData?.closing_time || "09:00 PM",
      };

      localStorage.setItem("nearGoActiveShop", JSON.stringify(activeShopInfo));

      // 4. Role redirect:
      // If shop_type is temporary or permanent, redirect to seller dashboard (dashboard will show Live Location card for temporary)
      navigate("/ShopkeeperDashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Invalid login credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafb] flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-3xl font-extrabold text-[#0b2940]">
          NEAR<span className="text-[#FF922F]">-GO</span>
        </h1>
        <h2 className="mt-2 text-xl font-bold text-[#183b50]">Shopkeeper Login</h2>
        <p className="text-xs text-gray-500 mt-1">Apne local shop workspace ko access karein</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-[0_10px_40px_rgba(11,41,64,0.07)] rounded-3xl border border-gray-100 sm:px-10">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#183b50]">Email Address</label>
              <div className="relative">
                <Mail size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  required
                  className="h-14 w-full rounded-2xl border border-gray-200 bg-[#f8fafb] pl-12 pr-4 text-sm outline-none focus:border-[#FF922F]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#183b50]">Password</label>
              <div className="relative">
                <Lock size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="h-14 w-full rounded-2xl border border-gray-200 bg-[#f8fafb] pl-12 pr-4 text-sm outline-none focus:border-[#FF922F]"
                />
              </div>
            </div>

            {error && <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 font-medium">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF7A18] to-[#FF922F] text-base font-bold text-white shadow-lg transition hover:shadow-xl"
            >
              {loading ? <Loader2 className="animate-spin" /> : <>Login to Workspace <ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Account nahi hai?{" "}
              <Link to="/ShopkeeperSignup" className="font-bold text-[#FF922F] hover:underline">
                Register your shop
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopkeeperLogin;