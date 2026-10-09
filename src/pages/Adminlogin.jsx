import React, { useState } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DEMO_ADMIN = {
  email: "admin@neargo.com",
  password: "admin123",
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    setLoading(true);
    window.setTimeout(() => {
      if (email.trim().toLowerCase() !== DEMO_ADMIN.email || password !== DEMO_ADMIN.password) {
        setLoading(false);
        setError("Those details do not match an admin account.");
        return;
      }
      sessionStorage.setItem("nearGoAdminSession", JSON.stringify({ email: DEMO_ADMIN.email, role: "admin", loggedInAt: new Date().toISOString() }));
      navigate("/AdminDashboard", { replace: true });
    }, 450);
  };

  return <main className="flex min-h-screen bg-[#f5f6f2] text-[#173d3b]"><section className="hidden w-[46%] flex-col justify-between bg-[#113b52] p-10 text-white lg:flex"><div><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center bg-[#f28a2e]"><ShieldCheck size={23} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f5b77b]">NEAR-GO</p><p className="font-bold">Admin console</p></div></div><div className="mt-28 max-w-md"><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#f5b77b]">Platform control centre</p><h1 className="mt-5 text-6xl font-semibold leading-[0.95] tracking-[-0.07em]">Keep local commerce moving.</h1><p className="mt-7 text-base leading-7 text-white/60">Review shops, protect customer trust and keep every local pickup journey on track.</p></div></div><div className="flex items-center gap-2 text-xs text-white/50"><span className="h-2 w-2 rounded-full bg-[#4fd0a0]" /> Secure admin workspace</div></section><section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8"><div className="w-full max-w-md"><div className="mb-10 lg:hidden"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center bg-[#113b52] text-white"><ShieldCheck size={21} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f28a2e]">NEAR-GO</p><p className="font-bold">Admin console</p></div></div></div><div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f28a2e]">Welcome back</p><h2 className="mt-3 text-4xl font-semibold tracking-[-0.06em]">Sign in to admin.</h2><p className="mt-3 text-sm leading-6 text-[#7c8583]">Use your administrator account to access platform controls.</p></div><form onSubmit={submit} className="border border-[#e3e1d9] bg-[#fffdfa] p-6 shadow-[0_14px_40px_rgba(24,45,61,0.06)] sm:p-8"><label className="block"><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8583]">Admin email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@neargo.com" autoComplete="email" className="mt-2 w-full border-b border-[#cfd5d1] bg-transparent py-3 text-sm outline-none focus:border-[#f28a2e]" /></label><label className="mt-7 block"><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8583]">Password</span><div className="mt-2 flex items-center border-b border-[#cfd5d1] focus-within:border-[#f28a2e]"><LockKeyhole size={17} className="mr-2 text-[#87908d]" /><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="p-2 text-[#87908d]" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>{error && <p className="mt-5 border border-[#ead4cd] bg-[#fff4f1] px-3 py-2.5 text-xs font-semibold text-[#a45d4c]">{error}</p>}<button type="submit" disabled={loading} className="mt-7 flex w-full items-center justify-center gap-2 bg-[#f28a2e] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#df751c] disabled:cursor-wait disabled:opacity-70">{loading ? "Checking access..." : "Continue to dashboard"} {!loading && <ArrowRight size={17} />}</button></form><div className="mt-5 border border-[#d8e0d9] bg-[#edf5f2] p-4 text-xs text-[#567263]"><p className="font-bold text-[#315e58]">Demo access</p><p className="mt-1">Email: <b>admin@neargo.com</b></p><p className="mt-1">Password: <b>admin123</b></p><p className="mt-2 text-[#7c8583]">Replace this demo check with your backend authentication before production.</p></div></div></section></main>;
}
