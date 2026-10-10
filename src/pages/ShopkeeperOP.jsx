import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { supabase } from "../supabaseClient";

const ShopkeeperOP = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  const savedData = JSON.parse(sessionStorage.getItem("nearGoShopkeeperData") || "{}");
  const email = savedData?.email ? savedData.email.trim().toLowerCase() : "";

  const [notice, setNotice] = useState("");

  // Resend countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (!email) {
      setError("Email missing. Please restart registration.");
      return;
    }
    if (timer > 0) return;

    setLoading(true);
    setError("");
    setNotice("");
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true,
        },
      });
      if (otpError) {
        setError(otpError.message || "Failed to resend OTP.");
      } else {
        setNotice("OTP has been resent! Please check your Inbox and Spam/Junk folder.");
      }
      setTimer(60);
      setOtp("");
    } catch (err) {
      setError(err.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Verify Real OTP with Supabase
  const handleVerify = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email,
        token: cleanOtp,
        type: "email",
      });

      if (verifyError) throw verifyError;

      sessionStorage.setItem("nearGoShopkeeperVerified", "true");
      navigate("/Shopkeeper3rd"); // Move to Step 3 (Password, Username, Profile Picture)
    } catch (err) {
      setError(err.message || "Invalid or expired OTP code. Please enter the valid code received on your email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FBFD] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-xl bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-[#0b2940]">
            NEAR<span className="text-[#16b8b5]">-GO</span>
          </h1>
          <div className="flex items-center gap-1.5 bg-teal-50 px-3 py-1.5 rounded-full text-xs font-bold text-[#16b8b5]">
            <ShieldCheck size={16} /> Email Verification
          </div>
        </div>

        <Link
          to="/ShopkeeperSignup"
          className="flex items-center gap-2 text-xs font-semibold text-[#496B87] hover:text-[#16aaa8] transition mb-6 w-fit"
        >
          <ArrowLeft size={16} /> Edit Shop Details
        </Link>

        <div className="mb-7">
          <p className="text-xs font-bold text-[#16aaa8] mb-1">STEP 2 OF 3</p>
          <h2 className="text-2xl font-extrabold text-[#0b2940]">Verify Your Email</h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            We've sent a 6-digit verification code to:{" "}
            <span className="font-bold text-[#0b2940] break-all">{email || "your email"}</span>
          </p>

          {notice && (
            <div className="mt-4 p-3 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs leading-5">
              <p className="font-semibold">{notice}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-[#0b2940]">
              Enter 6-Digit OTP Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                if (error) setError("");
              }}
              placeholder="000000"
              className="h-16 w-full rounded-2xl border border-gray-200 bg-[#F8FAFB] text-center text-xl sm:text-2xl font-extrabold tracking-[6px] sm:tracking-[10px] text-[#0b2940] outline-none focus:border-[#16b8b5] focus:ring-4 focus:ring-[#16b8b5]/10"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">Didn't receive the OTP code?</p>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={timer > 0 || loading}
              className={`mt-1.5 text-xs font-bold transition ${
                timer > 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-[#16aaa8] hover:text-[#0b8f8d] hover:underline"
              }`}
            >
              {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP Now"}
            </button>
          </div>

          <button
            type="submit"
            disabled={otp.length !== 6 || loading}
            className={`group flex h-14 w-full items-center justify-center gap-2 rounded-full text-sm font-extrabold text-white shadow-lg transition hover:shadow-xl ${
              otp.length === 6
                ? "bg-gradient-to-r from-[#FF7A18] to-[#ffae00]"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Verify & Continue <ArrowRight size={19} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShopkeeperOP;