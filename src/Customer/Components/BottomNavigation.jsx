import React from "react";
import { Heart, Home, MapPin, Package, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navigationItems = [
  {
    label: "Home",
    path: "/CustomerDashboard",
    icon: Home,
    matches: ["/CustomerDashboard"],
  },
  {
    label: "Nearby",
    path: "/Nearby",
    icon: MapPin,
    matches: ["/Nearby", "/CustomerLocation", "/CustomerProductDetails", "/CustomerShopDetails"],
  },
  {
    label: "Orders",
    path: "/CustomerOrders",
    icon: Package,
    matches: ["/CustomerOrders", "/CustomerReservation", "/CustomerReservationConfirmation"],
  },
  {
    label: "Saved",
    path: "/CustomerSaved",
    icon: Heart,
    matches: ["/CustomerSaved"],
  },
  {
    label: "Profile",
    path: "/CustomerProfile",
    icon: User,
    matches: ["/CustomerProfile"],
  },
];

export default function BottomNavigation({ active }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (item) => {
    if (active) return active === item.label;
    return item.matches.some((route) => pathname.startsWith(route));
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dfe3de] bg-[#fffdfa]/95 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(25,50,55,0.06)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-xl items-center justify-around px-1 sm:px-3">
        {navigationItems.map(({ label, path, icon: Icon }) => {
          const selected = isActive({ label, matches: navigationItems.find((item) => item.label === label)?.matches });

          return (
            <button
              key={label}
              type="button"
              onClick={() => navigate(path)}
              aria-current={selected ? "page" : undefined}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5 transition-colors ${selected ? "text-[#113b52]" : "text-[#87908d] hover:text-[#526d68]"}`}
            >
              <span className={`flex h-8 w-10 items-center justify-center transition ${selected ? "-translate-y-0.5" : ""}`}>
                <Icon size={21} strokeWidth={selected ? 2.7 : 1.9} fill={selected && label === "Saved" ? "currentColor" : "none"} />
              </span>
              <span className="text-[10px] font-bold tracking-wide sm:text-[11px]">{label}</span>
              {selected && <span className="absolute bottom-0 h-0.5 w-8 bg-[#f28a2e]" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
