import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Search,
  ShieldOff,
  User,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminUsers } from "./adminData";
import {
  AdminMetric,
  AdminMobileNav,
  AdminNavigation,
  AdminStatusBadge,
} from "./components/AdminUI";

export default function AdminUsers() {
  const navigate = useNavigate();

  const [users, setUsers] = useState(adminUsers);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [notice, setNotice] = useState("");

  const visible = useMemo(() => {
    return users.filter((user) => {
      const text = `${user.name} ${user.email} ${user.id}`.toLowerCase();

      return (
        (!query || text.includes(query.toLowerCase())) &&
        (type === "All" || user.type === type)
      );
    });
  }, [users, query, type]);

  const toggle = (id) => {
    const updated = users.map((user) =>
      user.id === id
        ? {
            ...user,
            status:
              user.status === "Suspended" ? "Active" : "Suspended",
          }
        : user
    );

    setUsers(updated);
    setNotice("Account status updated");

    window.setTimeout(() => setNotice(""), 2000);
  };

  return (
    <main className="min-h-screen bg-[#f5f6f2] pb-20 text-[#173d3b] lg:flex lg:pb-0">
      <AdminNavigation active="Users" />

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
                Platform directory
              </p>

              <h1 className="text-2xl font-semibold tracking-[-0.05em]">
                Users
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
              icon={<Users />}
              value={users.length}
              label="Total users"
              detail="All accounts"
            />

            <AdminMetric
              icon={<User />}
              value={
                users.filter((user) => user.type === "Customer").length
              }
              label="Customers"
              detail="Active shoppers"
              tone="green"
            />

            <AdminMetric
              icon={<ShieldOff />}
              value={
                users.filter((user) => user.status === "Suspended").length
              }
              label="Suspended"
              detail="Needs review"
              tone="red"
            />
          </section>

          <section className="mt-7 border border-[#e3e1d9] bg-[#fffdfa] p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-2 border-b border-[#cfd5d1] pb-2 sm:max-w-md">
                <Search size={18} className="text-[#7c8583]" />

                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, email or ID"
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

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setType("All")}
                  className={`px-3 py-2 text-xs font-bold ${
                    type === "All"
                      ? "bg-[#113b52] text-white"
                      : "bg-[#f5f6f2] text-[#7c8583]"
                  }`}
                >
                  All
                </button>

                <button
                  type="button"
                  onClick={() => setType("Customer")}
                  className={`px-3 py-2 text-xs font-bold ${
                    type === "Customer"
                      ? "bg-[#113b52] text-white"
                      : "bg-[#f5f6f2] text-[#7c8583]"
                  }`}
                >
                  Customers
                </button>

                <button
                  type="button"
                  onClick={() => setType("Shopkeeper")}
                  className={`px-3 py-2 text-xs font-bold ${
                    type === "Shopkeeper"
                      ? "bg-[#113b52] text-white"
                      : "bg-[#f5f6f2] text-[#7c8583]"
                  }`}
                >
                  Shopkeepers
                </button>
              </div>
            </div>
          </section>

          <section className="mt-5 space-y-3">
            {visible.map((user) => (
              <article
                key={user.id}
                className="flex flex-col justify-between gap-4 border border-[#e3e1d9] bg-[#fffdfa] p-4 sm:flex-row sm:items-center sm:p-5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center bg-[#edf5f2] text-[#113b52]">
                    <User size={18} />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{user.name}</h3>

                      <AdminStatusBadge status={user.status} />
                    </div>

                    <p className="mt-1 text-sm text-[#7c8583]">
                      {user.type} · {user.email}
                    </p>

                    <p className="mt-1 text-xs text-[#a1aaa5]">
                      {user.id} · Joined {user.joined}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggle(user.id)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold ${
                    user.status === "Suspended"
                      ? "bg-[#3b806a] text-white"
                      : "border border-[#d7dcd6] text-[#a45d4c]"
                  }`}
                >
                  {user.status === "Suspended" ? (
                    <>
                      <Check size={14} />
                      Activate
                    </>
                  ) : (
                    <>
                      <ShieldOff size={14} />
                      Suspend
                    </>
                  )}
                </button>
              </article>
            ))}

            {visible.length === 0 && (
              <p className="border border-dashed border-[#cfd5d1] bg-[#fffdfa] p-12 text-center text-sm text-[#7c8583]">
                No users match this search.
              </p>
            )}
          </section>
        </div>

        <AdminMobileNav active="Users" />
      </div>
    </main>
  );
}