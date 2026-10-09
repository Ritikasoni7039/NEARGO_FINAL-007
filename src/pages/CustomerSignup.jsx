import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Phone,
  CheckCircle2,
  Mail,
  ArrowRight,
  Check,
  ShieldCheck,
} from "lucide-react";

import login from "../assets/customer_road_shop_hero.png";
import icon1 from "../assets/favicon.png";

const CustomerSignup = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");

  const [errors, setErrors] = useState({});

  const submitHandler = (e) => {
    e.preventDefault();

    const newErrors = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = "Please enter your full name.";
    }

    // Phone validation
    if (!/^[6-9]\d{9}$/.test(phone)) {
      newErrors.phone = "Enter a valid 10-digit mobile number.";
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email address.";
    }

    setErrors(newErrors);

    // Stop if validation fails
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const userData = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
    };

    // Save data for next signup step
    sessionStorage.setItem("nearGoSignupData", JSON.stringify(userData));
navigate("/CustomerSignup1");

    console.log("Form submitted:", userData);

    // Go to password page
    navigate("/CustomerSignup1");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#f6fbfc] via-white to-[#edfafa] px-4 py-5 sm:px-8">

      {/* ================= MAIN CONTAINER ================= */}

      <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-6xl items-center justify-center">

        <div className="grid w-full overflow-hidden rounded-[32px] border border-gray-100 bg-white shadow-[0_25px_80px_rgba(15,23,42,0.10)] lg:grid-cols-2">

          {/* ================================================= */}
          {/* LEFT IMAGE SECTION */}
          {/* ================================================= */}

          <div className="relative hidden min-h-[720px] overflow-hidden lg:block">

            {/* Background Image */}
            <img
              src={login}
              alt="NEAR-GO marketplace"
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#042d43] via-[#07566b]/65 to-[#07566b]/10" />

            {/* Decorative Glow */}
            <div className="absolute -right-24 top-20 h-72 w-72 rounded-full bg-[#16b8b5]/20 blur-3xl" />

            <div className="absolute -left-20 bottom-10 h-72 w-72 rounded-full bg-[#ff922f]/15 blur-3xl" />

            {/* Brand */}
            <div className="absolute left-8 top-8 z-10 flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 p-2 backdrop-blur-md">
                <img
                  src={icon1}
                  alt="NEAR-GO"
                  className="h-full w-full object-contain"
                />
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-wide text-white">
                  NEAR-GO
                </h2>

                <p className="text-xs text-white/65">
                  Your nearby marketplace
                </p>
              </div>

            </div>

            {/* Bottom Content */}
            <div className="absolute bottom-10 left-8 right-8 z-10">

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-md">

                <span className="h-2 w-2 animate-pulse rounded-full bg-[#52e2de]" />

                <span className="text-xs font-semibold text-white">
                  Shop Local. Shop Smart.
                </span>

              </div>

              <h2 className="max-w-xl text-4xl font-extrabold leading-[1.15] text-white">
                Everything you need,
                <br />
                <span className="text-[#52e2de]">
                  right near you.
                </span>
              </h2>

              <p className="mt-4 max-w-md text-sm leading-6 text-white/65">
                Discover local shops, products and services around you with
                NEAR-GO — simple, fast and convenient.
              </p>

            </div>

          </div>

          {/* ================================================= */}
          {/* RIGHT FORM SECTION */}
          {/* ================================================= */}

          <div className="flex w-full flex-col justify-center px-5 py-8 sm:px-10 lg:px-14 lg:py-12">

            {/* Mobile Logo */}
            <div className="mb-7 flex items-center justify-center gap-2 lg:hidden">

              <img
                src={icon1}
                alt="NEAR-GO"
                className="h-10 w-10 object-contain"
              />

              <h2 className="text-xl font-bold text-[#0b2940]">
                NEAR-
                <span className="text-[#16b8b5]">GO</span>
              </h2>

            </div>

            {/* ================================================= */}
            {/* PROGRESS BAR */}
            {/* ================================================= */}

            <div className="mb-8">

              <div className="mb-3 flex items-center justify-between">

                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-gray-400">
                  Account Setup
                </span>

                <span className="text-xs font-bold text-[#16aaa8]">
                  Step 1 of 3
                </span>

              </div>

              <div className="flex items-center gap-2 w-full">

  {/* Step 1 - Completed */}
  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#16b8b5] text-white shadow-md shadow-[#16b8b5]/20">
    <CheckCircle2 size={22} />
  </div>

  {/* Progress */}
  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
    <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#16b8b5] to-[#32c9c5]" />
  </div>

  {/* Step 2 */}
  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#16b8b5] bg-white text-sm font-bold text-[#16b8b5]">
    2
  </div>

  {/* Progress */}
  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
    <div className="h-full w-0 rounded-full bg-gradient-to-r from-[#16b8b5] to-[#32c9c5]" />
  </div>

  {/* Step 3 */}
  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-sm font-bold text-gray-400">
    3
  </div>

</div>

            </div>

            {/* ================================================= */}
            {/* HEADING */}
            {/* ================================================= */}

            <div className="mb-7">

              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#16aaa8]">
                Get Started
              </p>

              <h1 className="text-3xl font-extrabold tracking-tight text-[#0b2940] sm:text-[36px]">

                Create your{" "}

                <span className="text-[#16b8b5]">
                  NEAR
                </span>

                <span className="text-[#f7831e]">
                  GO
                </span>

                {" "}account

              </h1>

              <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                Enter your basic details to create your account and continue
                to the next step.
              </p>

            </div>

            {/* ================================================= */}
            {/* FORM */}
            {/* ================================================= */}

            <form
              onSubmit={submitHandler}
              className="space-y-5"
            >

              {/* ================= FULL NAME ================= */}

              <div>

                <label className="mb-2 block text-sm font-bold text-[#183b50]">
                  Full Name
                </label>

                <div className="relative">

                  <User
                    size={21}
                    strokeWidth={1.8}
                    className={`pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 ${
                      errors.name
                        ? "text-red-400"
                        : "text-[#496B87]"
                    }`}
                  />

                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);

                      if (errors.name) {
                        setErrors((prev) => ({
                          ...prev,
                          name: "",
                        }));
                      }
                    }}
                    className={`h-14 w-full rounded-2xl border bg-[#f8fafb] px-5 pl-14 text-[15px] text-[#123B63] outline-none transition-all duration-200 placeholder:text-[#8CA0B3] focus:bg-white focus:ring-4 ${
                      errors.name
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-[#D7E1E9] focus:border-[#16B8A6] focus:ring-[#16B8A6]/10"
                    }`}
                  />

                </div>

                {errors.name && (
                  <p className="mt-1.5 px-1 text-xs font-medium text-red-500">
                    {errors.name}
                  </p>
                )}

              </div>

              {/* ================= PHONE ================= */}

              <div>

                <label className="mb-2 block text-sm font-bold text-[#183b50]">
                  Mobile Number
                </label>

                <div className="relative">

                  <Phone
                    size={21}
                    strokeWidth={1.8}
                    className={`pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 ${
                      errors.phone
                        ? "text-red-400"
                        : "text-[#496B87]"
                    }`}
                  />

                  <input
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={phone}
                    maxLength={10}
                    inputMode="numeric"
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");

                      setPhone(value);

                      if (errors.phone) {
                        setErrors((prev) => ({
                          ...prev,
                          phone: "",
                        }));
                      }
                    }}
                    className={`h-14 w-full rounded-2xl border bg-[#f8fafb] px-5 pl-14 text-[15px] text-[#123B63] outline-none transition-all duration-200 placeholder:text-[#8CA0B3] focus:bg-white focus:ring-4 ${
                      errors.phone
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-[#D7E1E9] focus:border-[#16B8A6] focus:ring-[#16B8A6]/10"
                    }`}
                  />

                </div>

                {errors.phone && (
                  <p className="mt-1.5 px-1 text-xs font-medium text-red-500">
                    {errors.phone}
                  </p>
                )}

              </div>

              {/* ================= EMAIL ================= */}

              <div>

                <label className="mb-2 block text-sm font-bold text-[#183b50]">
                  Email Address
                </label>

                <div className="relative">

                  <Mail
                    size={21}
                    strokeWidth={1.8}
                    className={`pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 ${
                      errors.email
                        ? "text-red-400"
                        : "text-[#496B87]"
                    }`}
                  />

                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);

                      if (errors.email) {
                        setErrors((prev) => ({
                          ...prev,
                          email: "",
                        }));
                      }
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

              {/* ================= CONTINUE BUTTON ================= */}

              <button
                type="submit"
                className="group mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF7A18] to-[#FF922F] text-base font-bold text-white shadow-lg shadow-orange-200 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-200 active:translate-y-0"
              >

                Continue

                <ArrowRight
                  size={20}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />

              </button>

            </form>

            {/* ================================================= */}
            {/* LOGIN */}
            {/* ================================================= */}

            <p className="mt-7 text-center text-sm text-gray-500">

              Already have an account?{" "}

              <Link
                to="/CustomerLogin"
                className="font-bold text-[#16aaa8] transition hover:text-[#0d8987] hover:underline"
              >
                Login
              </Link>

            </p>

            {/* ================================================= */}
            {/* SECURITY */}
            {/* ================================================= */}

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">

              <ShieldCheck
                size={15}
                className="text-[#16aaa8]"
              />

              <span>
                Your information is safe and secure
              </span>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default CustomerSignup;