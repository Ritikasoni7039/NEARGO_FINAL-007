import React, { useEffect, useState, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Mail,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import logo from "../assets/favicon.png";

const CustomerSignup1 = () => {
  const navigate = useNavigate();
  const sentRef = useRef(false);

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);

  const savedSignupData = sessionStorage.getItem("nearGoSignupData");
  const signupData = savedSignupData ? JSON.parse(savedSignupData) : null;
  const email = signupData?.email ? signupData.email.trim().toLowerCase() : "";

  // 1. Send OTP code directly (No Link)
  const sendOtpCode = async () => {
    if (!email) {
      setError("Email address missing. Please go back.");
      return;
    }
    setError("");

    try {
      // Supabase se OTP request bhej rahe hain (Ye email par code bhejega agar template me Token set hai)
      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (authError) {
        console.warn("OTP send warning:", authError.message);
      }
    } catch (err) {
      console.error("Error sending OTP:", err);
    }
  };

  useEffect(() => {
    if (!sentRef.current && email) {
      sentRef.current = true;
      sendOtpCode();
    }
  }, [email]);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(val);
    setError("");
  };

  // 2. Verify the typed OTP code
  const handleVerify = async (e) => {
    e.preventDefault();
    const cleanOtp = otp.trim();

    if (cleanOtp.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Supabase verifyOtp method se email code check hoga
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email,
        token: cleanOtp,
        type: "email",
      });

      if (verifyError) {
        throw new Error("Invalid or expired OTP code.");
      }

      setVerified(true);
      sessionStorage.setItem("nearGoEmailVerified", "true");

      setTimeout(() => {
        navigate("/CustomerSignup2");
      }, 600);
    } catch (err) {
      setError(err.message || "Invalid OTP code. Please check and re-enter.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (timer > 0) return;
    setOtp("");
    setError("");
    setTimer(60);
    sendOtpCode();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7fbfc] via-white to-[#eefafa] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl bg-white rounded-[30px] shadow-[0_20px_70px_rgba(11,41,64,0.12)] overflow-hidden grid lg:grid-cols-2">
        <div className="hidden lg:flex relative bg-[#083b4d] min-h-[650px] overflow-hidden">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#16b8b5]/20" />
          <div className="absolute -bottom-32 -right-24 w-80 h-80 rounded-full bg-[#FF7A18]/20" />

          <div className="relative z-10 w-full flex flex-col justify-between p-12">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl p-2 shadow-lg">
                <img src={logo} alt="NEAR-GO" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-white text-2xl font-extrabold tracking-wide">
                  NEAR<span className="text-[#FF922F]">-GO</span>
                </h1>
                <p className="text-white/60 text-xs">Your local world</p>
              </div>
            </div>

            <div className="text-white max-w-md">
              <div className="w-20 h-20 rounded-3xl bg-white/10 border border-white/10 flex items-center justify-center mb-7 backdrop-blur-sm">
                <Mail size={40} className="text-[#16b8b5]" />
              </div>

              <p className="text-[#16b8b5] font-bold tracking-[3px] text-sm mb-3">
                EMAIL VERIFICATION
              </p>

              <h2 className="text-4xl font-extrabold leading-tight mb-5">
                One small step,
                <br />
                <span className="text-[#FF922F]">you're almost in.</span>
              </h2>

              <p className="text-white/65 leading-7">
                We've sent a 6-digit verification code to your email. Enter the code below to verify your account.
              </p>
            </div>

            <div className="flex items-center gap-3 text-white/60 text-sm">
              <ShieldCheck size={20} className="text-[#16b8b5]" />
              Secure verification
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10 lg:p-14 flex flex-col justify-center">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-[#083b4d] p-2">
              <img src={logo} alt="NEAR-GO" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#083b4d]">
              NEAR<span className="text-[#FF7A18]">-GO</span>
            </h1>
          </div>

          <Link
            to="/CustomerSignup"
            className="flex items-center gap-2 text-sm text-[#496B87] hover:text-[#16aaa8] transition mb-8 w-fit"
          >
            <ArrowLeft size={17} />
            Change details
          </Link>

          <div className="mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#e9fbfa] flex items-center justify-center mb-5">
              <Mail size={27} className="text-[#16aaa8]" />
            </div>

            <p className="text-[#16aaa8] text-xs font-bold tracking-[3px] mb-2">
              STEP 2 OF 3
            </p>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0b2940]">
              Verify your email
            </h2>

            <p className="text-[#6b7c8c] mt-3 leading-6">
              Enter the 6-digit code sent to
            </p>

            <p className="font-bold text-[#0b2940] mt-1 break-all">
              {email || "your email"}
            </p>
          </div>

          <form onSubmit={handleVerify}>
            <label className="block text-sm font-bold text-[#183b50] mb-3">
              Enter OTP Code
            </label>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otp}
              onChange={handleOtpChange}
              placeholder="••••••"
              maxLength={6}
              className={`w-full h-16 rounded-2xl border ${
                error ? "border-red-400 bg-red-50" : "border-[#D7E1E9] bg-[#f8fafb]"
              } text-center tracking-[12px] text-2xl font-bold text-[#0b2940] outline-none focus:border-[#16aaa8] focus:ring-4 focus:ring-[#16aaa8]/10 transition`}
            />

            {error && (
              <p className="text-red-500 text-sm mt-3 text-center font-medium">
                {error}
              </p>
            )}

            <div className="text-center mt-6">
              <p className="text-sm text-[#718392]">Didn't receive the code?</p>

              <button
                type="button"
                onClick={handleResend}
                disabled={timer > 0}
                className={`mt-2 text-sm font-bold transition ${
                  timer > 0
                    ? "text-[#9aaab5] cursor-not-allowed"
                    : "text-[#16aaa8] hover:text-[#0b8f8d]"
                }`}
              >
                {timer > 0 ? `Resend OTP in ${timer}s` : "Resend OTP"}
              </button>
            </div>

            <button
              type="submit"
              disabled={otp.length !== 6 || verified || loading}
              className={`w-full h-14 mt-8 rounded-full font-bold text-white flex items-center justify-center gap-3 transition-all ${
                verified
                  ? "bg-green-500"
                  : otp.length === 6
                  ? "bg-gradient-to-r from-[#16aaa8] to-[#11c7c3] hover:shadow-[0_12px_30px_rgba(22,170,168,0.28)] hover:-translate-y-0.5"
                  : "bg-[#b9c7cf] cursor-not-allowed"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Verifying...
                </>
              ) : verified ? (
                <>
                  <CheckCircle2 size={20} />
                  Email Verified
                </>
              ) : (
                <>
                  Verify & Continue
                  <ArrowRight size={19} />
                </>
              )}
            </button>
          </form>

          <div className="flex items-start gap-3 mt-7 p-4 rounded-2xl bg-[#f6fafb] border border-[#e8f0f3]">
            <ShieldCheck size={20} className="text-[#16aaa8] mt-0.5 shrink-0" />
            <p className="text-xs text-[#718392] leading-5">
              Your verification code confirms ownership of your email address.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSignup1;