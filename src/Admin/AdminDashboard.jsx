import React from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Package,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  adminActivity,
  adminReservations,
  adminShops,
  adminStats,
} from "./adminData";
import {
  AdminMetric,
  AdminMobileNav,
  AdminNavigation,
  AdminStatusBadge,
} from "./components/AdminUI";

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[#f5f6f2] pb-20 text-[#173d3b] lg:flex lg:pb-0">
      <AdminNavigation active="Dashboard" />

      <div className="min-w-0 flex-1">
        <header className="border-b border-[#dfe4dd] bg-[#fffdfa]">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f28a2e]">
                Operations overview
              </p>

              <h1 className="text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">
                Good morning, Admin
              </h1>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-[#3b806a]">
              <span className="h-2 w-2 rounded-full bg-[#3b806a]" />
              All systems operational
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-10">
          <section className="relative overflow-hidden bg-[#113b52] p-6 text-white sm:p-9">
            <div className="relative z-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f5b77b]">
                  <ShieldCheck size={15} />
                  Platform control centre
                </p>

                <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.05em] sm:text-5xl">
                  Keep local commerce moving.
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
                  Review activity, support your shopkeepers and make sure every
                  customer reservation reaches the right counter.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/AdminShops")}
                className="flex items-center gap-2 bg-[#f28a2e] px-4 py-3 text-sm font-bold text-white"
              >
                Review approvals
                <ArrowUpRight size={16} />
              </button>
            </div>

            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border-[30px] border-white/5" />
          </section>

          <section className="mt-5 grid grid-cols-2 border border-[#e3e1d9] bg-[#fffdfa] sm:grid-cols-3 lg:grid-cols-6">
            <AdminMetric
              icon={<Users />}
              value={adminStats.totalCustomers.toLocaleString("en-IN")}
              label="Customers"
              detail="Registered"
            />

            <AdminMetric
              icon={<Store />}
              value={adminStats.activeShops}
              label="Active shops"
              detail="Across cities"
              tone="green"
            />

            <AdminMetric
              icon={<Building2 />}
              value={adminStats.pendingShopApprovals}
              label="Approvals"
              detail="Needs review"
              tone="orange"
            />

            <AdminMetric
              icon={<ShoppingBag />}
              value={adminStats.todayReservations}
              label="Reservations"
              detail="Today"
              tone="blue"
            />

            <AdminMetric
              icon={<BarChart3 />}
              value={`₹${(adminStats.monthlyRevenue / 1000).toFixed(1)}k`}
              label="This month"
              detail="Gross value"
              tone="green"
            />

            <AdminMetric
              icon={<AlertTriangle />}
              value={adminStats.openIssues}
              label="Open issues"
              detail="Support queue"
              tone="red"
            />
          </section>

          <div className="mt-7 grid gap-7 xl:grid-cols-[1.25fr_0.75fr]">
            <section>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f28a2e]">
                    Needs attention
                  </p>

                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
                    Pending approvals
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/AdminShops")}
                  className="text-sm font-bold text-[#b75d17]"
                >
                  View all
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {adminShops
                  .filter((shop) => shop.status === "Pending approval")
                  .map((shop) => (
                    <article
                      key={shop.id}
                      className="flex flex-col justify-between gap-4 border border-[#e3e1d9] bg-[#fffdfa] p-4 sm:flex-row sm:items-center sm:p-5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center bg-[#fff1e4] text-[#b75d17]">
                          <Store size={19} />
                        </div>

                        <div>
                          <h3 className="font-bold">{shop.name}</h3>

                          <p className="mt-1 text-sm text-[#7c8583]">
                            {shop.owner} · {shop.city}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <AdminStatusBadge status={shop.status} />

                        <button
                          type="button"
                          onClick={() => navigate("/AdminShops")}
                          className="border border-[#d7dcd6] px-3 py-2 text-xs font-bold"
                        >
                          Review
                        </button>
                      </div>
                    </article>
                  ))}
              </div>

              <div className="mt-7 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f28a2e]">
                    Live activity
                  </p>

                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
                    Platform pulse
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/AdminAnalytics")}
                  className="flex items-center gap-1 text-sm font-bold text-[#b75d17]"
                >
                  Analytics
                  <ArrowUpRight size={16} />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {adminActivity.map((item) => (
                  <div
                    key={item.title}
                    className="flex gap-3 border border-[#e3e1d9] bg-[#fffdfa] p-4"
                  >
                    <span
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                        item.tone === "red"
                          ? "bg-[#a45d4c]"
                          : item.tone === "green"
                            ? "bg-[#3b806a]"
                            : "bg-[#f28a2e]"
                      }`}
                    />

                    <div>
                      <p className="text-sm font-bold">{item.title}</p>

                      <p className="mt-1 text-xs text-[#7c8583]">
                        {item.text} · {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <aside>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f28a2e]">
                    Reservation health
                  </p>

                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
                    Today’s flow
                  </h2>
                </div>

                <ShoppingBag className="text-[#f28a2e]" />
              </div>

              <div className="mt-4 border border-[#e3e1d9] bg-[#fffdfa] p-5">
                <FlowRow
                  label="Pending review"
                  value={
                    adminReservations.filter(
                      (item) => item.status === "Pending"
                    ).length
                  }
                  tone="orange"
                />

                <FlowRow
                  label="Confirmed"
                  value={
                    adminReservations.filter(
                      (item) => item.status === "Confirmed"
                    ).length
                  }
                  tone="blue"
                />

                <FlowRow
                  label="Completed"
                  value={
                    adminReservations.filter(
                      (item) => item.status === "Completed"
                    ).length
                  }
                  tone="green"
                />

                <FlowRow
                  label="Cancelled"
                  value={
                    adminReservations.filter(
                      (item) => item.status === "Cancelled"
                    ).length
                  }
                  tone="red"
                />
              </div>

              <div className="mt-4 border border-[#d8e0d9] bg-[#edf5f2] p-5">
                <div className="flex gap-3">
                  <CheckCircle2
                    className="shrink-0 text-[#3b806a]"
                    size={20}
                  />

                  <div>
                    <p className="text-sm font-bold">Trust & safety</p>

                    <p className="mt-1 text-xs leading-5 text-[#567263]">
                      Review reports and shop verification before they affect
                      customer trust.
                    </p>

                    <button
                      type="button"
                      onClick={() => navigate("/AdminSettings")}
                      className="mt-3 text-xs font-bold text-[#b75d17]"
                    >
                      Open controls{" "}
                      <ArrowUpRight className="inline" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <section className="mt-7 grid gap-3 sm:grid-cols-3">
            <Quick
              icon={<Store />}
              title="Manage shops"
              text="Approve and monitor shops"
              onClick={() => navigate("/AdminShops")}
            />

            <Quick
              icon={<Users />}
              title="Manage users"
              text="Review customer accounts"
              onClick={() => navigate("/AdminUsers")}
            />

            <Quick
              icon={<Package />}
              title="Review reservations"
              text="Track the full order flow"
              onClick={() => navigate("/AdminReservations")}
            />
          </section>
        </div>

        <AdminMobileNav active="Dashboard" />
      </div>
    </main>
  );
}

const FlowRow = ({ label, value, tone }) => (
  <div className="flex items-center justify-between border-b border-[#ece9e1] py-4 last:border-b-0">
    <span className="flex items-center gap-2 text-sm text-[#5e6d75]">
      <span
        className={`h-2 w-2 rounded-full ${
          tone === "orange"
            ? "bg-[#f28a2e]"
            : tone === "blue"
              ? "bg-[#3e6d91]"
              : tone === "red"
                ? "bg-[#a45d4c]"
                : "bg-[#3b806a]"
        }`}
      />

      {label}
    </span>

    <b className="text-lg">{value}</b>
  </div>
);

const Quick = ({ icon, title, text, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-3 border border-[#e3e1d9] bg-[#fffdfa] p-4 text-left hover:border-[#f28a2e]"
  >
    <span className="flex h-10 w-10 items-center justify-center bg-[#edf5f2] text-[#113b52]">
      {React.cloneElement(icon, { size: 18 })}
    </span>

    <span>
      <b className="block text-sm">{title}</b>

      <small className="mt-1 block text-xs text-[#7c8583]">
        {text}
      </small>
    </span>
  </button>
);