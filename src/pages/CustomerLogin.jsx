import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  LogIn,
  Loader2,
} from "lucide-react";
import { supabase } from "../supabaseClient";

import login from "../assets/customer_road_shop_hero.png";
import icon1 from "../assets/favicon.png";

const CustomerLogin = () => {
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState("otp"); // 'otp' or 'password'
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP Login states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [timer, setTimer] = useState(60);
  const [statusNotice, setStatusNotice] = useState("");

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Countdown timer for OTP
  React.useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // 1. Send Login OTP
  const handleSendOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setAuthError("");
    setStatusNotice("");
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrors({ email: "Please enter your email address." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrors({ email: "Please enter a valid email address." });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        console.warn("OTP Warning:", error.message);
        setAuthError(error.message || "Failed to send login code.");
      } else {
        setStatusNotice("Login OTP has been sent! Check your Inbox and Spam/Junk folder.");
        setOtpSent(true);
        setTimer(60);
      }
    } catch (err) {
      console.error("Error sending OTP:", err);
      setAuthError("Failed to send login code. Please check your email and try again.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify Login OTP with Supabase
  const handleVerifyOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setAuthError("");
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    if (cleanOtp.length !== 6) {
      setAuthError("Please enter the complete 6-digit OTP code.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtp,
        type: "email",
      });

      if (error) throw error;
      const user = data?.user || data?.session?.user;

      if (user?.id) {
        let { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (!profileData) {
          const { data: createdProfile } = await supabase
            .from("profiles")
            .upsert([
              {
                id: user.id,
                email: cleanEmail,
                full_name: cleanEmail.split("@")[0],
                role: "customer",
              },
            ])
            .select()
            .maybeSingle();
          profileData = createdProfile || { role: "customer" };
        }

        if (profileData.role && profileData.role.startsWith("shopkeeper")) {
          await supabase.auth.signOut();
          throw new Error("This account is registered as a Shopkeeper. Please log in from the Shopkeeper Login page.");
        }
      }

      navigate("/CustomerDashboard");
    } catch (err) {
      console.error("OTP verification error:", err);
      setAuthError(err.message || "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Password Login
  const submitHandler = async (e) => {
    e.preventDefault();
    setAuthError("");

    const newErrors = {};
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      newErrors.email = "Please enter your email address.";
    }
    if (!password) {
      newErrors.password = "Please enter your password.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (error) throw error;

      if (data?.session) {
        const user = data.session.user;
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        let activeProfile = profileData;
        if (!activeProfile) {
          // Auto-heal missing profile row
          const { data: createdProfile } = await supabase
            .from("profiles")
            .upsert([
              {
                id: user.id,
                email: user.email,
                full_name: user.user_metadata?.full_name || user.email.split("@")[0],
                phone: user.user_metadata?.phone || "",
                role: "customer",
              },
            ])
            .select()
            .maybeSingle();
          activeProfile = createdProfile || { role: "customer" };
        }

        if (activeProfile.role && activeProfile.role.startsWith("shopkeeper")) {
          await supabase.auth.signOut();
          throw new Error("This account is registered as a Shopkeeper. Please log in from the Shopkeeper Login page.");
        }

        navigate("/CustomerDashboard");
      }
    } catch (err) {
      console.error("Full Login Error Object:", err);
      let msg = err.message || "Invalid email or password.";
      if (msg.toLowerCase().includes("email not confirmed")) {
        msg = "Email confirmation is pending in Supabase. Please turn off 'Confirm email' in Supabase Dashboard (Auth -> Providers -> Email -> Confirm email: OFF) or use 'Login with Email OTP' tab.";
      }
      setAuthError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f6fbfc] via-white to-[#edfafa] px-4 py-5 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.10)] lg:grid-cols-2">
          
          {/* Left Image Section */}
          <div className="relative hidden min-h-[700px] overflow-hidden lg:block">
            <img
              src={login}
              alt="NEAR-GO marketplace"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#042d43] via-[#07566b]/65 to-[#07566b]/10" />
            <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-[#16b8b5]/20 blur-3xl" />
            <div className="absolute -left-20 bottom-20 h-72 w-72 rounded-full bg-[#ff922f]/15 blur-3xl" />

            <div className="absolute left-8 top-8 z-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 p-2 backdrop-blur-md">
                <img src={icon1} alt="NEAR-GO" className="h-full w-full object-contain" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-wide text-white">NEAR-GO</h2>
                <p className="text-xs text-white/65">Your nearby marketplace</p>
              </div>
            </div>

            <div className="absolute bottom-10 left-8 right-8 z-10">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-md">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#52e2de]" />
                <span className="text-xs font-semibold text-white">Welcome Back</span>
              </div>
              <h2 className="max-w-xl text-4xl font-extrabold leading-[1.15] text-white">
                Your local world,<br />
                <span className="text-[#52e2de]">just a login away.</span>
              </h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/65">
                Sign in to discover nearby shops, products and services available around you.
              </p>
            </div>
          </div>

          {/* Right Login Section */}
          <div className="flex w-full flex-col justify-center px-5 py-8 sm:px-10 lg:px-14 lg:py-12">
            <div className="mb-8 flex items-center justify-center gap-2 lg:hidden">
              <img src={icon1} alt="NEAR-GO" className="h-10 w-10 object-contain" />
              <h2 className="text-xl font-bold text-[#0b2940]">
                NEAR-<span className="text-[#16b8b5]">GO</span>
              </h2>
            </div>

            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8fafa] text-[#16aaa8]">
              <LogIn size={27} strokeWidth={1.8} />
            </div>

            <div className="mb-8">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#16aaa8]">
                Welcome Back
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#0b2940] sm:text-[38px]">
                Login to <span className="text-[#16b8b5]">NEAR</span><span className="text-[#f7831e]">GO</span>
              </h1>
              <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                Enter your account details to continue exploring NEAR-GO.
              </p>
            </div>

            {/* Login Method Tabs */}
            <div className="mb-6 flex rounded-2xl bg-[#F0F5F8] p-1.5 border border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("otp");
                  setAuthError("");
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
                  setAuthError("");
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

            {authError && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {authError}
              </div>
            )}

            {/* METHOD 1: LOGIN WITH EMAIL OTP */}
            {loginMethod === "otp" ? (
              <div className="space-y-5">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-bold text-[#183b50]">
                        Enter Your Registered Email
                      </label>
                      <div className="relative">
                        <Mail
                          size={21}
                          strokeWidth={1.8}
                          className={`pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 ${
                            errors.email ? "text-red-400" : "text-[#496B87]"
                          }`}
                        />
                        <input
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                          }}
                          className={`h-14 w-full rounded-2xl border bg-[#f8fafb] px-5 pl-14 text-[15px] text-[#123B63] outline-none transition-all duration-200 placeholder:text-[#8CA0B3] focus:bg-white focus:ring-4 ${
                            errors.email
                              ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                              : "border-[#D7E1E9] focus:border-[#16B8A6] focus:ring-[#16B8A6]/10"
                          }`}
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-1.5 px-1 text-xs font-medium text-red-500">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="group flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#16b8b5] to-[#11a7a5] text-base font-bold text-white shadow-lg shadow-[#16b8b5]/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#16b8b5]/30 active:translate-y-0 disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        <>
                          Send Login OTP
                          <ArrowRight size={20} className="transition-transform duration-200 group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div className="rounded-2xl bg-teal-50/70 border border-teal-100 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium">OTP sent to:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setOtpCode("");
                            setAuthError("");
                          }}
                          className="text-xs font-bold text-[#16b8b5] hover:underline"
                        >
                          Change Email
                        </button>
                      </div>
                      <p className="text-sm font-extrabold text-[#0b2940] mt-1 break-all">
                        {email}
                      </p>
                    </div>

                    {statusNotice && (
                      <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs leading-5">
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
                          if (authError) setAuthError("");
                        }}
                        placeholder="000000"
                        className="h-16 w-full rounded-2xl border border-gray-200 bg-[#F8FAFB] text-center text-xl sm:text-2xl font-extrabold tracking-[6px] sm:tracking-[10px] text-[#0b2940] outline-none focus:border-[#16b8b5] focus:ring-4 focus:ring-[#16b8b5]/10"
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
                            : "text-[#16b8b5] hover:underline"
                        }`}
                      >
                        {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP Now"}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={otpCode.length !== 6 || loading}
                      className="group flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#16b8b5] to-[#11a7a5] text-base font-bold text-white shadow-lg shadow-[#16b8b5]/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#16b8b5]/30 active:translate-y-0 disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        <>
                          Verify & Login
                          <ArrowRight size={20} className="transition-transform duration-200 group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* METHOD 2: LOGIN WITH PASSWORD */
              <form onSubmit={submitHandler} className="space-y-5">
                {/* Email */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-[#183b50]">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={21}
                      strokeWidth={1.8}
                      className={`pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 ${
                        errors.email ? "text-red-400" : "text-[#496B87]"
                      }`}
                    />
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                      }}
                      className={`h-14 w-full rounded-2xl border bg-[#f8fafb] px-5 pl-14 text-[15px] text-[#123B63] outline-none transition-all duration-200 placeholder:text-[#8CA0B3] focus:bg-white focus:ring-4 ${
                        errors.email
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-[#D7E1E9] focus:border-[#16B8A6] focus:ring-[#16B8A6]/10"
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1.5 px-1 text-xs font-medium text-red-500">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-bold text-[#183b50]">Password</label>
                    <Link
                      to="/ForgotPassword"
                      className="text-xs font-semibold text-[#16aaa8] transition hover:text-[#0d8987] hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <LockKeyhole
                      size={21}
                      strokeWidth={1.8}
                      className={`pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 ${
                        errors.password ? "text-red-400" : "text-[#496B87]"
                      }`}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                      }}
                      className={`h-14 w-full rounded-2xl border bg-[#f8fafb] px-5 pl-14 pr-14 text-[15px] text-[#123B63] outline-none transition-all duration-200 placeholder:text-[#8CA0B3] focus:bg-white focus:ring-4 ${
                        errors.password
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-[#D7E1E9] focus:border-[#16B8A6] focus:ring-[#16B8A6]/10"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#16aaa8]"
                    >
                      {showPassword ? <EyeOff size={21} /> : <Eye size={21} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 px-1 text-xs font-medium text-red-500">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#16b8b5] to-[#11a7a5] text-base font-bold text-white shadow-lg shadow-[#16b8b5]/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#16b8b5]/30 active:translate-y-0 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      Login
                      <ArrowRight size={20} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>
            )}

            <p className="mt-7 text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <Link to="/CustomerSignup" className="font-bold text-[#16aaa8] transition hover:text-[#0d8987] hover:underline">
                Sign Up
              </Link>
            </p>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
              <ShieldCheck size={15} className="text-[#16aaa8]" />
              <span>Your account is protected with secure login</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;