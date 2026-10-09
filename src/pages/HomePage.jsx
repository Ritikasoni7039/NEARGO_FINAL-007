import React from "react";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import logo from "../assets/nearg0_standalone_logo.png";
import homeimg from "../assets/heroimg.png";
import btm from "../assets/btm.png";

const HomePage = () => {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f7f4] text-[#173d3b]">
      <header className="relative z-10 border-b border-[#e5e3dc] bg-[#fffdfa]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <Link to="/" aria-label="NEAR-GO home">
            <img
              src={logo}
              alt="NEAR-GO"
              className="h-9 w-auto object-contain sm:h-11"
            />
          </Link>

          <div className="flex items-center gap-3">
            <nav className="hidden items-center gap-6 text-xs font-bold text-[#6e7b7b] md:flex">
              <a
                href="#how-it-works"
                className="transition hover:text-[#f28a2e]"
              >
                How it works
              </a>

              <a
                href="#choose-your-way"
                className="transition hover:text-[#f28a2e]"
              >
                For customers & shops
              </a>
            </nav>

            <span className="hidden items-center gap-2 text-xs font-bold text-[#7c8583] xl:flex">
              <span className="h-2 w-2 rounded-full bg-[#3b806a]" />
              Local shopping, made simple
            </span>

            <Link
              to="/AdminLogin"
              className="flex items-center gap-2 border border-[#d7dcd6] px-3 py-2 text-xs font-bold text-[#113b52] transition hover:border-[#f28a2e]"
            >
              <ShieldCheck size={15} />
              Admin
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#113b52] text-white">
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full border-[34px] border-white/5" />

        <div className="absolute -bottom-32 left-[42%] h-72 w-72 rounded-full border-[22px] border-[#f28a2e]/10" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1fr_0.9fr] lg:px-12 lg:py-20">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-[#f5b77b]">
              <MapPin size={15} />
              Around you, right now
            </p>

            <h1 className="mt-5 max-w-2xl text-[clamp(3.1rem,7vw,6.5rem)] font-semibold leading-[0.91] tracking-[-0.08em]">
              Find it nearby.
              <br />
              <span className="text-[#f28a2e]">Reserve it locally.</span>
            </h1>

            <p className="mt-7 max-w-lg text-base leading-7 text-white/65 sm:text-lg">
              Discover real local stock, compare prices and reserve what you
              need before you step out.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/CustomerSignup"
                className="flex items-center justify-center gap-2 bg-[#f28a2e] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#df751c]"
              >
                Start exploring
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/ShopkeeperSignup"
                className="flex items-center justify-center gap-2 border border-white/25 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                List your shop
                <Store size={17} />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-white/55">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#4fd0a0]" />
                Live local stock
              </span>

              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#4fd0a0]" />
                Reserve for pickup
              </span>

              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#4fd0a0]" />
                No guesswork
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:pr-5">
            <div className="absolute inset-4 bg-[#f28a2e]/20 blur-3xl" />

            <div className="relative overflow-hidden border border-white/15 bg-white/10 p-3 shadow-[0_25px_70px_rgba(0,0,0,0.2)] backdrop-blur-sm sm:p-5">
              <img
                src={homeimg}
                alt="Discover nearby products and shops"
                className="h-auto max-h-[430px] w-full object-contain"
              />

              <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3 bg-[#fffdfa] p-3 text-[#173d3b] shadow-xl sm:bottom-9 sm:left-9 sm:right-9">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#fff1e4] text-[#f28a2e]">
                  <MapPin size={20} />
                </span>

                <span className="min-w-0">
                  <b className="block text-sm">Shops around you</b>
                  <small className="block text-xs text-[#7c8583]">
                    Compare before you go.
                  </small>
                </span>

                <span className="ml-auto h-2 w-2 rounded-full bg-[#3b806a]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="choose-your-way"
        className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12 lg:py-16"
      >
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f28a2e]">
              Choose your way in
            </p>

            <h2 className="mt-3 max-w-md text-4xl font-semibold leading-tight tracking-[-0.06em]">
              One neighbourhood. Two useful journeys.
            </h2>

            <p className="mt-4 max-w-md text-sm leading-6 text-[#7c8583]">
              Whether you are finding something or selling what you have,
              NEAR-GO keeps the next step clear.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <RoleCard
              icon={<UserRound />}
              eyebrow="For customers"
              title="Find what you need nearby"
              text="Search products, see live shop options, save favourites and reserve for pickup."
              action="Continue as customer"
              to="/CustomerSignup"
              tone="orange"
            />

            <RoleCard
              icon={<Store />}
              eyebrow="For shopkeepers"
              title="Bring your shop online"
              text="Manage inventory, receive reservations and turn nearby searches into visits."
              action="Continue as shopkeeper"
              to="/ShopkeeperSignup"
              tone="navy"
            />
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-y border-[#e3e1d9] bg-[#fffdfa]"
      >
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12 lg:py-14">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f28a2e]">
                Simple by design
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
                From search to pickup in three clear steps.
              </h2>
            </div>

            <p className="max-w-sm text-sm leading-6 text-[#7c8583]">
              No endless calls. No wasted trips. Just a better way to shop
              locally.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Step
              number="01"
              title="Search nearby"
              text="Type what you need and compare real local products, prices and distance."
            />

            <Step
              number="02"
              title="Choose with confidence"
              text="See matching shop pins on the map, save a favourite or open the shop details."
            />

            <Step
              number="03"
              title="Reserve and collect"
              text="Reserve for pickup, follow the status and visit when your item is ready."
            />
          </div>
        </div>
      </section>

      <section className="border-y border-[#e3e1d9] bg-[#fffdfa]">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:grid-cols-3 sm:px-8 lg:px-12">
          <TrustItem
            title="Real local availability"
            text="See what nearby shops actually have."
          />

          <TrustItem
            title="Simple pickup"
            text="Reserve first, collect when it suits you."
          />

          <TrustItem
            title="Made for local"
            text="Support the shops around your neighbourhood."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24 pt-10 sm:px-8 lg:px-12">
        <div className="flex flex-col justify-between gap-5 bg-[#edf5f2] p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3b806a]">
              Your local shortcut
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
              Less searching. More finding.
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#567263]">
              Start with a product, a category or a nearby shop. NEAR-GO takes
              you from idea to pickup.
            </p>
          </div>

          <Link
            to="/CustomerSignup"
            className="flex shrink-0 items-center justify-center gap-2 bg-[#113b52] px-5 py-3 text-sm font-bold text-white"
          >
            Explore NEAR-GO
            <ArrowRight size={17} />
          </Link>
        </div>

        <img
          src={btm}
          alt=""
          className="mx-auto mt-8 h-auto max-h-24 w-full object-contain opacity-80"
        />
      </section>
    </main>
  );
};

const RoleCard = ({
  icon,
  eyebrow,
  title,
  text,
  action,
  to,
  tone,
}) => (
  <article className="group border border-[#e3e1d9] bg-[#fdfcf9] p-5 transition hover:-translate-y-1 hover:border-[#f28a2e] hover:shadow-[0_14px_35px_rgba(24,45,61,0.08)]">
    <div
      className={`flex h-11 w-11 items-center justify-center ${
        tone === "orange"
          ? "bg-[#fff1e4] text-[#f28a2e]"
          : "bg-[#edf5f2] text-[#113b52]"
      }`}
    >
      {React.cloneElement(icon, { size: 21 })}
    </div>

    <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-[#f28a2e]">
      {eyebrow}
    </p>

    <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em]">
      {title}
    </h3>

    <p className="mt-2 text-sm leading-6 text-[#7c8583]">{text}</p>

    <Link
      to={to}
      className="mt-6 flex items-center gap-1 text-sm font-bold text-[#173d3b]"
    >
      {action}
      <ArrowRight
        size={15}
        className="transition group-hover:translate-x-1"
      />
    </Link>
  </article>
);

const TrustItem = ({ title, text }) => (
  <div className="flex items-start gap-3">
    <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#edf5f2] text-[#3b806a]">
      <CheckCircle2 size={16} />
    </span>

    <div>
      <p className="text-sm font-bold">{title}</p>

      <p className="mt-1 text-xs leading-5 text-[#7c8583]">{text}</p>
    </div>
  </div>
);

const Step = ({ number, title, text }) => (
  <article className="relative border border-[#e3e1d9] bg-[#fdfcf9] p-5">
    <span className="text-3xl font-semibold tracking-[-0.06em] text-[#f28a2e]/35">
      {number}
    </span>

    <h3 className="mt-5 text-xl font-semibold tracking-[-0.04em]">
      {title}
    </h3>

    <p className="mt-2 text-sm leading-6 text-[#7c8583]">{text}</p>
  </article>
);

export default HomePage;