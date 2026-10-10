import React, { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import icon1 from "../assets/favicon.png";
import icon2 from "../assets/images.svg";

const CustomerSignup2 = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const requirements = [
    { text: "At least 8 characters", valid: password.length >= 8 },
    { text: "One uppercase letter", valid: /[A-Z]/.test(password) },
    { text: "One lowercase letter", valid: /[a-z]/.test(password) },
    { text: "One number", valid: /[0-9]/.test(password) },
  ];

  const handleSignupComplete = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const isPasswordValid =
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password) &&
      password === confirmPassword;

    if (!isPasswordValid) return;

    setLoading(true);

    try {
      const savedSignupData = sessionStorage.getItem("nearGoSignupData");
      const signupData = savedSignupData ? JSON.parse(savedSignupData) : null;

      if (!signupData?.email) {
        throw new Error("Registration details missing. Please restart signup.");
      }

      const cleanEmail = signupData.email.trim().toLowerCase();

      // Check if user has an active session from OTP verification
      const { data: sessionData } = await supabase.auth.getSession();
      let userId = sessionData?.session?.user?.id;

      if (!userId) {
        // Fallback: Create account directly via signUp
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              full_name: signupData.name || "",
              phone: signupData.phone || "",
              role: "customer",
            },
          },
        });

        if (signUpError) {
          if (signUpError.message?.toLowerCase().includes("already registered")) {
            throw new Error("This email is already registered. Please login directly.");
          }
          throw signUpError;
        }
        userId = signUpData?.user?.id;
      } else {
        // Session exists: update password on existing account
        const { data: updateData, error: updateError } = await supabase.auth.updateUser({
          password: password,
          data: {
            full_name: signupData.name || "",
            phone: signupData.phone || "",
            role: "customer",
          },
        });

        if (updateError) throw updateError;
        userId = updateData?.user?.id || userId;
      }

      if (userId) {
        // 2. Direct Profile Table Upsert
        const { error: profileError } = await supabase.from("profiles").upsert([
          {
            id: userId,
            email: cleanEmail,
            full_name: signupData.name || "",
            phone: signupData.phone || "",
            role: "customer",
          },
        ]);

        if (profileError) {
          console.error("Profile insert error:", profileError.message);
        }
      }

      // Cleanup
      sessionStorage.removeItem("nearGoSignupData");
      sessionStorage.removeItem("nearGoEmailVerified");
      sessionStorage.removeItem("nearGoDevBypass");

      // Redirect to Location
      navigate("/Location");
    } catch (err) {
      setErrorMsg(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f7fbfc] via-white to-[#eefafa] px-4 py-6 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[30px] border border-gray-100 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.10)] lg:grid-cols-2">
          
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#063f55] via-[#07566b] to-[#0e8b8b] p-10 lg:flex lg:flex-col lg:justify-between">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
            <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[#16b8b5]/20" />

            <div className="relative z-10 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 p-2 backdrop-blur">
                <img src={icon1} alt="Near-GO" className="h-full w-full object-contain" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-wide text-white">NEAR-GO</h2>
                <p className="text-xs text-white/60">Your nearby marketplace</p>
              </div>
            </div>

            <div className="relative z-10 flex flex-1 items-center justify-center py-10">
              <div className="relative flex h-[320px] w-[320px] items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                <div className="absolute h-[250px] w-[250px] rounded-full bg-white/10" />
                <img src={icon2} alt="Create password" className="relative z-10 h-[220px] w-[220px] object-contain drop-shadow-2xl" />
              </div>
            </div>

            <div className="relative z-10">
              <div className="mb-4 flex items-center gap-2 text-[#9ff8f5]">
                <ShieldCheck size={20} />
                <span className="text-sm font-semibold">Secure & Protected</span>
              </div>
              <h1 className="max-w-md text-3xl font-bold leading-tight text-white">
                Almost there!<br />Create a strong password.
              </h1>
            </div>
          </div>

          <div className="flex w-full flex-col justify-center px-5 py-8 sm:px-10 lg:px-14 lg:py-12">
            <div className="mb-7">
              <p className="mb-2 text-sm font-semibold text-[#16aaa8]">FINAL STEP</p>
              <h1 className="text-3xl font-bold tracking-tight text-[#0b2940] sm:text-4xl">
                Create Password
              </h1>
            </div>

            {errorMsg && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSignupComplete} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#183b50]">
                  Create Password
                </label>
                <div className="relative">
                  <LockKeyhole size={21} strokeWidth={1.8} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#496b87]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-14 w-full rounded-2xl border border-gray-200 bg-[#f8fafb] px-5 pl-14 pr-14 text-[15px] text-gray-700 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-[#16b8b5] focus:bg-white focus:ring-4 focus:ring-[#16b8b5]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#16aaa8]"
                  >
                    {showPassword ? <EyeOff size={21} /> : <Eye size={21} />}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-[#f8fbfc] p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                  Password must contain
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {requirements.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 text-sm transition ${
                        item.valid ? "text-[#129c98]" : "text-gray-500"
                      }`}
                    >
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        item.valid ? "bg-[#16b8b5] text-white" : "bg-gray-200 text-gray-400"
                      }`}>
                        <Check size={12} strokeWidth={3} />
                      </span>
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#183b50]">
                  Confirm Password
                </label>
                <div className="relative">
                  <LockKeyhole size={21} strokeWidth={1.8} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#496b87]" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="h-14 w-full rounded-2xl border border-gray-200 bg-[#f8fafb] px-5 pl-14 pr-14 text-[15px] text-gray-700 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-[#16b8b5] focus:bg-white focus:ring-4 focus:ring-[#16b8b5]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-[#16aaa8]"
                  >
                    {showConfirmPassword ? <EyeOff size={21} /> : <Eye size={21} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  password.length < 8 ||
                  !/[A-Z]/.test(password) ||
                  !/[a-z]/.test(password) ||
                  !/[0-9]/.test(password) ||
                  password !== confirmPassword ||
                  loading
                }
                className="group mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#16b8b5] to-[#0da3a1] text-base font-bold text-white shadow-lg shadow-[#16b8b5]/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#16b8b5]/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Signup
                    <ArrowRight size={20} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSignup2;