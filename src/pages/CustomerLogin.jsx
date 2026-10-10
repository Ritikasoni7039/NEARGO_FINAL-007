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
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");

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

        if (!profileData) {
          await supabase.auth.signOut();
          throw new Error("This account profile has been deleted or deactivated. You cannot log in.");
        }

        if (profileData.role && profileData.role.startsWith("shopkeeper")) {
          await supabase.auth.signOut();
          throw new Error("This account is registered as a Shopkeeper. Please log in from the Shopkeeper Login page.");
        }

        navigate("/CustomerDashboard");
      }
    }  catch (err) {
  console.error("Full Login Error Object:", err);
  setAuthError(err.message || "Invalid email or password.");
}
    finally {
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

            {authError && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {authError}
              </div>
            )}

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