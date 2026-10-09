import React from "react";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  CalendarDays,
  IndianRupee,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminShops, adminStats } from "./adminData";
import {
  AdminMobileNav,
  AdminNavigation,
  AdminMetric,
} from "./components/AdminUI";

const months = [
  { label: "Apr", value: 42 },
  { label: "May", value: 58 },
  { label: "Jun", value: 51 },
  { label: "Jul", value: 72 },
  { label: "Aug", value: 68 },
  { label: "Sep", value: 86 },
];

export default function AdminAnalytics() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[#f5f6f2] pb-20 text-[#173d3b] lg:flex lg:pb-0">
      <AdminNavigation active="Analytics" />

      <div className="min-w-0 flex-1">
        <header className="border-b border-[#dfe4dd] bg-[#fffdfa]">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-5 sm:px-8 lg:px-10">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-full p-2 text-[#65737a] lg:hidden"
              aria-label="Go back"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f28a2e]">
                Platform intelligence
              </p>

              <h1 className="text-2xl font-semibold tracking-[-0.05em]">
                Analytics
              </h1>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-10">
          <section className="grid grid-cols-2 border border-[#e3e1d9] bg-[#fffdfa] sm:grid-cols-4">
            <AdminMetric
              icon={<IndianRupee />}
              value="₹2.85L"
              label="Gross value"
              detail="This month"
              tone="green"
            />

            <AdminMetric
              icon={<TrendingUp />}
              value="18.4%"
              label="Growth"
              detail="Compared to last month"
              tone="orange"
            />

            <AdminMetric
              icon={<BarChart3 />}
              value={adminStats.todayReservations}
              label="Reservations"
              detail="Today"
            />

            <AdminMetric
              icon={<Building2 />}
              value={adminStats.activeShops}
              label="Active shops"
              detail="Contributing merchants"
              tone="green"
            />
          </section>

          <div className="mt-7 grid gap-7 lg:grid-cols-[1.25fr_0.75fr]">
            <section className="border border-[#e3e1d9] bg-[#fffdfa] p-5 sm:p-7">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f28a2e]">
                    Marketplace trend
                  </p>

                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
                    Reservation volume
                  </h2>
                </div>

                <CalendarDays className="text-[#f28a2e]" />
              </div>

              <div className="mt-8 flex h-64 items-end gap-3 border-b border-l border-[#dfe4dd] px-3 pb-0 sm:gap-7 sm:px-6">
                {months.map((month) => (
                  <div
                    key={month.label}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="text-[10px] font-bold text-[#5e6d75]">
                      {month.value}
                    </span>

                    <div
                      className="w-full max-w-12 bg-[#113b52] transition hover:bg-[#f28a2e]"
                      style={{
                        height: `${month.value}%`,
                      }}
                    />

                    <span className="pb-2 text-[10px] font-bold text-[#87908d]">
                      {month.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="border border-[#e3e1d9] bg-[#fffdfa] p-5 sm:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f28a2e]">
                Merchant performance
              </p>

              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
                Top shops
              </h2>

              <div className="mt-6 space-y-4">
                {adminShops.slice(0, 4).map((shop, index) => (
                  <div
                    key={shop.id}
                    className="flex items-center gap-3"
                  >
                    <span className="flex h-7 w-7 items-center justify-center bg-[#edf5f2] text-xs font-bold text-[#113b52]">
                      {index + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {shop.name}
                      </p>

                      <p className="mt-1 text-xs text-[#7c8583]">
                        {shop.products} listed products
                      </p>
                    </div>

                    <span className="text-sm font-bold text-[#3b806a]">
                      {shop.rating}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <AdminMobileNav active="Analytics" />
      </div>
    </main>
  );
}