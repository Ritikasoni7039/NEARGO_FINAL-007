import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, Loader2, Store } from "lucide-react";
import { supabase } from "../supabaseClient";

const ShopkeeperLogin = () => {
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState("otp"); // 'otp' or 'password'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP Login states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [timer, setTimer] = useState(60);
  const [statusNotice, setStatusNotice] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Countdown timer
  React.useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Helper to load shop data and redirect
  const handleShopRedirect = async (userId, userEmail, userMeta) => {
    // 1.5 Verify that user profile exists in 'profiles' table, auto-heal if missing
    let { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!profileData) {
      const { data: createdProfile } = await supabase
        .from("profiles")
        .upsert([
          {
            id: userId,
            email: userEmail,
            full_name: userMeta?.full_name || "Shopkeeper",
            role: userMeta?.role || "shopkeeper_permanent",
          },
        ])
        .select()
        .maybeSingle();
      profileData = createdProfile || { role: "shopkeeper_permanent" };
    }

    // Check role - Customer should not access seller workspace
    if (profileData.role === "customer") {
      await supabase.auth.signOut();
      throw new Error("This account is registered as a Customer. Please log in from the Customer Login page.");
    }

    // 2. Fetch shop details for this owner from 'shops' table
    let { data: shopData } = await supabase
      .from("shops")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();

    if (!shopData) {
      // Auto-heal shop record if missing
      const { data: newShop } = await supabase
        .from("shops")
        .insert([
          {
            owner_id: userId,
            shop_name: userMeta?.shop_name || "My Local Store",
            category: "General Store",
            shop_type: "permanent",
            address: "Mandsaur",
            city: "Mandsaur",
            pincode: "458001",
            latitude: 24.0722,
            longitude: 75.0683,
            is_live: true,
          },
        ])
        .select()
        .maybeSingle();
      shopData = newShop;
    }

    // 3. Save active shop details into localStorage
    const activeShopInfo = {
      id: shopData?.id || null,
      shopName: shopData?.shop_name || userMeta?.shop_name || "My Shop",
      ownerName: userMeta?.full_name || shopData?.owner_name || "Shop Owner",
      category: shopData?.category || "General Store",
      address: shopData?.address || shopData?.landmark || "Mandsaur",
      landmark: shopData?.landmark || "",
      city: shopData?.city || "Mandsaur",
      pincode: shopData?.pincode || "458001",
      shopType: shopData?.shop_type || "permanent",
      subType: shopData?.sub_type || "",
      mobile: userMeta?.phone || shopData?.phone || "",
      email: userEmail,
      latitude: shopData?.latitude,
      longitude: shopData?.longitude,
      currentArea: shopData?.current_area || "",
      isLive: shopData?.is_live !== false,
      shopImage: shopData?.shop_image || null,
      openingTime: shopData?.opening_time || "09:00 AM",
      closingTime: shopData?.closing_time || "09:00 PM",
    };

    localStorage.setItem("nearGoActiveShop", JSON.stringify(activeShopInfo));
    navigate("/ShopkeeperDashboard");
  };

  // 1. Send Shopkeeper Login OTP
  const handleSendOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");
    setStatusNotice("");
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (otpErr) {
        console.warn("OTP Warning:", otpErr.message);
        setError(otpErr.message || "Failed to send login code.");
      } else {
        setStatusNotice("Login OTP has been sent! Check your Inbox and Spam/Junk folder.");
        setOtpSent(true);
        setTimer(60);
      }
    } catch (err) {
      console.error("Error sending OTP:", err);
      setError("Failed to send login code. Please check your email and retry.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify Shopkeeper Login OTP with Supabase
  const handleVerifyOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    if (cleanOtp.length !== 6) {
      setError("Please enter complete 6-digit OTP code.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: verifyErr } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtp,
        type: "email",
      });

      if (verifyErr) throw verifyErr;
      const user = data?.user || data?.session?.user;

      if (!user) {
        throw new Error("Could not authenticate user. Please try again.");
      }

      await handleShopRedirect(user.id, cleanEmail, user.user_metadata);
    } catch (err) {
      console.error("OTP Verification Error:", err);
      setError(err.message || "Invalid or expired OTP code. Please enter the valid code received on your email.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Password Login
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

      await handleShopRedirect(user.id, cleanEmail, user.user_metadata);
    } catch (err) {
      console.error("Login error:", err);
      let msg = err.message || "Invalid login credentials. Please try again.";
      if (msg.toLowerCase().includes("email not confirmed")) {
        msg = "Email confirmation is pending in Supabase. Please turn off 'Confirm email' in Supabase Dashboard (Auth -> Providers -> Email -> Confirm email: OFF) or use 'Login with Email OTP' tab.";
      }
      setError(msg);
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
          
          {/* Method Tabs */}
          <div className="mb-6 flex rounded-2xl bg-[#F0F5F8] p-1.5 border border-gray-100">
            <button
              type="button"
              onClick={() => {
                setLoginMethod("otp");
                setError("");
              }}
              className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition sm:text-sm ${
                loginMethod === "otp"
                  ? "bg-white text-[#0b2940] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Login with Email OTP
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod("password");
                setError("");
              }}
              className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition sm:text-sm ${
                loginMethod === "password"
                  ? "bg-white text-[#0b2940] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Login with Password
            </button>
          </div>

          {error && <div className="mb-5 rounded-xl bg-red-50 p-3 text-xs text-red-600 font-medium">{error}</div>}

          {/* METHOD 1: EMAIL OTP LOGIN */}
          {loginMethod === "otp" ? (
            <div className="space-y-5">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-[#183b50]">
                      Registered Shopkeeper Email
                    </label>
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF7A18] to-[#FF922F] text-base font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        Send Login OTP <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="rounded-2xl bg-orange-50/70 border border-orange-100 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 font-medium">OTP sent to:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode("");
                          setError("");
                        }}
                        className="text-xs font-bold text-[#FF7A18] hover:underline"
                      >
                        Change Email
                      </button>
                    </div>
                    <p className="text-sm font-extrabold text-[#0b2940] mt-1 break-all">
                      {email}
                    </p>
                  </div>

                  {statusNotice && (
                    <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs leading-5">
                      <p className="font-semibold">{statusNotice}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-[#183b50] mb-2">
                      Enter 6-Digit OTP Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                        if (error) setError("");
                      }}
                      placeholder="000000"
                      className="h-16 w-full rounded-2xl border border-gray-200 bg-[#F8FAFB] text-center text-2xl font-extrabold tracking-[10px] text-[#0b2940] outline-none focus:border-[#FF7A18] focus:ring-4 focus:ring-[#FF7A18]/10"
                    />
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={timer > 0 || loading}
                      className={`text-xs font-bold transition ${
                        timer > 0
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-[#FF7A18] hover:underline"
                      }`}
                    >
                      {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP Now"}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={otpCode.length !== 6 || loading}
                    className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF7A18] to-[#FF922F] text-base font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <>
                        Verify & Login <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* METHOD 2: PASSWORD LOGIN */
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

              <button
                type="submit"
                disabled={loading}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF7A18] to-[#FF922F] text-base font-bold text-white shadow-lg transition hover:shadow-xl"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>Login to Workspace <ArrowRight size={18} /></>}
              </button>
            </form>
          )}

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