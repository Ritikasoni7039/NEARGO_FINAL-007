import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Check,
  Search,
  Store,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminShops } from "./adminData";
import {
  AdminMetric,
  AdminMobileNav,
  AdminNavigation,
  AdminStatusBadge,
} from "./components/AdminUI";

export default function AdminShops() {
  const navigate = useNavigate();

  const [shops, setShops] = useState(adminShops);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [notice, setNotice] = useState("");

  const visible = useMemo(() => {
    return shops.filter((shop) => {
      const text =
        `${shop.name} ${shop.owner} ${shop.city}`.toLowerCase();

      return (
        (!query || text.includes(query.toLowerCase())) &&
        (filter === "All" || shop.status === filter)
      );
    });
  }, [shops, query, filter]);

  const update = (id, status) => {
    setShops(
      shops.map((shop) =>
        shop.id === id ? { ...shop, status } : shop
      )
    );

    setNotice(`Shop marked ${status}`);

    window.setTimeout(() => setNotice(""), 2000);
  };

  return (
    <main className="min-h-screen bg-[#f5f6f2] pb-20 text-[#173d3b] lg:flex lg:pb-0">
      <AdminNavigation active="Shops" />

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
                Merchant directory
              </p>

              <h1 className="text-2xl font-semibold tracking-[-0.05em]">
                Shops
              </h1>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-10">
          {notice && (
            <div className="mb-5 flex items-center gap-2 border border-[#c9e0d3] bg-[#edf7f0] px-4 py-3 text-sm font-bold text-[#3b806a]">
              <Check size={17} />
              {notice}
            </div>
          )}

          <section className="grid grid-cols-2 border border-[#e3e1d9] bg-[#fffdfa] sm:grid-cols-3">
            <AdminMetric
              icon={<Building2 />}
              value={shops.length}
              label="Registered shops"
              detail="All merchants"
            />

            <AdminMetric
              icon={<Check />}
              value={
                shops.filter((shop) => shop.status === "Active").length
              }
              label="Active"
              detail="Visible to customers"
              tone="green"
            />

            <AdminMetric
              icon={<Store />}
              value={
                shops.filter(
                  (shop) => shop.status === "Pending approval"
                ).length
              }
              label="Pending approval"
              detail="Review documents"
              tone="orange"
            />
          </section>

          <section className="mt-7 flex flex-col gap-4 border border-[#e3e1d9] bg-[#fffdfa] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2 border-b border-[#cfd5d1] pb-2 sm:max-w-md">
              <Search size={18} className="text-[#7c8583]" />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search shop, owner or city"
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
              {["All", "Active", "Pending approval", "Suspended"].map(
                (item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setFilter(item)}
                    className={`shrink-0 px-3 py-2 text-xs font-bold ${
                      filter === item
                        ? "bg-[#113b52] text-white"
                        : "bg-[#f5f6f2] text-[#7c8583]"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
          </section>

          <section className="mt-5 space-y-3">
            {visible.map((shop) => (
              <article
                key={shop.id}
                className="flex flex-col justify-between gap-4 border border-[#e3e1d9] bg-[#fffdfa] p-4 sm:flex-row sm:items-center sm:p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center bg-[#edf5f2] text-[#113b52]">
                    <Store size={20} />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{shop.name}</h3>

                      <AdminStatusBadge status={shop.status} />
                    </div>

                    <p className="mt-1 text-sm text-[#7c8583]">
                      {shop.owner} · {shop.category}
                    </p>

                    <p className="mt-1 text-xs text-[#a1aaa5]">
                      {shop.city} · {shop.products} products · Rating{" "}
                      {shop.rating}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {shop.status === "Pending approval" && (
                    <>
                      <button
                        type="button"
                        onClick={() => update(shop.id, "Active")}
                        className="flex items-center gap-1 bg-[#3b806a] px-3 py-2 text-xs font-bold text-white"
                      >
                        <Check size={14} />
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={() => update(shop.id, "Suspended")}
                        className="border border-[#d7dcd6] px-3 py-2 text-xs font-bold text-[#a45d4c]"
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {shop.status === "Active" && (
                    <button
                      type="button"
                      onClick={() => update(shop.id, "Suspended")}
                      className="border border-[#d7dcd6] px-3 py-2 text-xs font-bold text-[#a45d4c]"
                    >
                      Suspend
                    </button>
                  )}

                  {shop.status === "Suspended" && (
                    <button
                      type="button"
                      onClick={() => update(shop.id, "Active")}
                      className="bg-[#113b52] px-3 py-2 text-xs font-bold text-white"
                    >
                      Reactivate
                    </button>
                  )}
                </div>
              </article>
            ))}

            {visible.length === 0 && (
              <p className="border border-dashed border-[#cfd5d1] bg-[#fffdfa] p-12 text-center text-sm text-[#7c8583]">
                No shops match this filter.
              </p>
            )}
          </section>
        </div>

        <AdminMobileNav active="Shops" />
      </div>
    </main>
  );
}