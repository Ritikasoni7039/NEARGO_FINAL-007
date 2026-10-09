import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock3,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminReservations } from "./adminData";
import {
  AdminMobileNav,
  AdminNavigation,
  AdminStatusBadge,
} from "./components/AdminUI";

const tabs = ["All", "Pending", "Confirmed", "Completed", "Cancelled"];

export default function AdminReservations() {
  const navigate = useNavigate();

  const [reservations, setReservations] = useState(adminReservations);
  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    return reservations.filter((item) => {
      const text =
        `${item.id} ${item.customer} ${item.shop} ${item.product}`.toLowerCase();

      return (
        (tab === "All" || item.status === tab) &&
        (!query || text.includes(query.toLowerCase()))
      );
    });
  }, [reservations, tab, query]);

  const update = (id, status) => {
    setReservations(
      reservations.map((item) =>
        item.id === id ? { ...item, status } : item
      )
    );
  };

  return (
    <main className="min-h-screen bg-[#f5f6f2] pb-20 text-[#173d3b] lg:flex lg:pb-0">
      <AdminNavigation active="Reservations" />

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
                Platform operations
              </p>

              <h1 className="text-2xl font-semibold tracking-[-0.05em]">
                Reservations
              </h1>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-10">
          <section className="bg-[#113b52] p-6 text-white sm:p-8">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f5b77b]">
              <ShoppingBag size={15} />
              All customer pickups
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
              Make every handoff visible.
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
              Monitor the reservation journey across customers and local
              shops.
            </p>
          </section>

          <section className="mt-5 flex flex-col gap-4 border border-[#e3e1d9] bg-[#fffdfa] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2 border-b border-[#cfd5d1] pb-2 sm:max-w-md">
              <Search size={18} className="text-[#7c8583]" />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ID, customer or shop"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />

              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto">
              {tabs.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => setTab(item)}
                  className={`flex shrink-0 items-center gap-1 px-3 py-2 text-xs font-bold ${
                    tab === item
                      ? "bg-[#113b52] text-white"
                      : "bg-[#f5f6f2] text-[#7c8583]"
                  }`}
                >
                  {item}

                  <span className="opacity-60">
                    {item === "All"
                      ? reservations.length
                      : reservations.filter((r) => r.status === item).length}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="mt-5 space-y-3">
            {visible.map((item) => (
              <article
                key={item.id}
                className="flex flex-col justify-between gap-4 border border-[#e3e1d9] bg-[#fffdfa] p-4 sm:flex-row sm:items-center sm:p-5"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-[#87908d]">
                      {item.id}
                    </span>

                    <AdminStatusBadge status={item.status} />
                  </div>

                  <h3 className="mt-2 font-bold">{item.product}</h3>

                  <p className="mt-1 text-sm text-[#7c8583]">
                    {item.customer} → {item.shop}
                  </p>

                  <p className="mt-2 flex items-center gap-1 text-xs text-[#a1aaa5]">
                    <Clock3 size={13} />
                    {item.created} · ₹
                    {item.total.toLocaleString("en-IN")}
                  </p>
                </div>

                <div className="flex gap-2">
                  {item.status === "Pending" && (
                    <button
                      type="button"
                      onClick={() => update(item.id, "Confirmed")}
                      className="flex items-center gap-1 bg-[#3b806a] px-3 py-2 text-xs font-bold text-white"
                    >
                      <Check size={14} />
                      Confirm
                    </button>
                  )}

                  {item.status === "Confirmed" && (
                    <button
                      type="button"
                      onClick={() => update(item.id, "Completed")}
                      className="bg-[#113b52] px-3 py-2 text-xs font-bold text-white"
                    >
                      Mark complete
                    </button>
                  )}

                  {item.status !== "Completed" &&
                    item.status !== "Cancelled" && (
                      <button
                        type="button"
                        onClick={() => update(item.id, "Cancelled")}
                        className="border border-[#d7dcd6] px-3 py-2 text-xs font-bold text-[#a45d4c]"
                      >
                        Cancel
                      </button>
                    )}
                </div>
              </article>
            ))}

            {visible.length === 0 && (
              <p className="border border-dashed border-[#cfd5d1] bg-[#fffdfa] p-12 text-center text-sm text-[#7c8583]">
                No reservations match this filter.
              </p>
            )}
          </section>
        </div>

        <AdminMobileNav active="Reservations" />
      </div>
    </main>
  );
}