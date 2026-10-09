import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Heart,
  Home,
  MapPin,
  Package,
  Phone,
  Store,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { customerProducts, customerShops } from "../Customer/CustomerData";

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const CustomerProductDetails = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const product =
    customerProducts.find((item) => item.id === Number(productId)) ||
    customerProducts[0];
  const shop = customerShops[product.shopId];
  const [saved, setSaved] = useState(
    readJson("nearGoSaved", []).includes(product.id)
  );

  const toggleSave = () => {
    const current = readJson("nearGoSaved", []);
    const updated = current.includes(product.id)
      ? current.filter((id) => id !== product.id)
      : [...current, product.id];

    localStorage.setItem("nearGoSaved", JSON.stringify(updated));
    setSaved(!saved);
  };

  return (
    <main className="min-h-screen bg-[#f7f7f4] pb-[calc(5.8rem+env(safe-area-inset-bottom))] text-[#173d3b]">
      <header className="border-b border-[#e3e2dc] bg-[#fffdfa]">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-5 sm:px-8 lg:px-12">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full p-2 text-[#5e6d75] hover:bg-[#f0f1ed]"
            aria-label="Go back"
          >
            <ArrowLeft size={19} />
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f28a2e]">
              {product.category}
            </p>
            <h1 className="text-2xl font-semibold tracking-[-0.04em]">
              Product details
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative flex min-h-[360px] items-center justify-center bg-[#edf0eb] sm:min-h-[500px]">
            <img
              src={product.image}
              alt={product.name}
              className="h-full max-h-[440px] w-full object-contain p-12 mix-blend-multiply"
              onError={(event) => {
                event.currentTarget.style.display = "none";
                event.currentTarget.parentElement.innerHTML = `<span style="font-size:80px">${product.emoji}</span>`;
              }}
            />
            <button
              onClick={toggleSave}
              className={`absolute right-5 top-5 rounded-full bg-white p-3 shadow-sm ${
                saved ? "text-[#f28a2e]" : "text-[#7c8583]"
              }`}
              aria-label={saved ? "Remove from saved" : "Save product"}
            >
              <Heart size={20} fill={saved ? "currentColor" : "none"} />
            </button>
          </div>

          <section className="border border-[#e4e1d9] bg-[#fffdfa] p-6 sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f28a2e]">
              {product.category} · {product.stock}
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em]">
              {product.name}
            </h2>
            <p className="mt-3 text-base text-[#7c8583]">{product.details}</p>

            <div className="mt-8 flex items-end justify-between border-b border-[#ece9e1] pb-6">
              <p className="text-4xl font-semibold">
                ₹{product.price.toLocaleString("en-IN")}
              </p>
              <span className="text-sm font-bold text-[#3b806a]">
                Updated {product.fresh}
              </span>
            </div>

            <div className="mt-6 flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center bg-[#edf5f2] text-[#113b52]">
                <Store size={20} />
              </div>
              <div className="min-w-0">
                <button
                  onClick={() => navigate(`/CustomerShopDetails/${product.shopId}`)}
                  className="font-bold hover:text-[#b75d17]"
                >
                  {shop?.name || product.shop} <ArrowUpRight className="inline" size={15} />
                </button>
                <p className="mt-1 text-sm text-[#7c8583]">
                  {shop?.address || "Nearby local shop"} · {product.distance}
                </p>
                <p className="mt-1 text-sm text-[#3b806a]">
                  {shop?.open ? "Open now" : "Closed now"} · ★ {product.rating}
                </p>
              </div>
            </div>

            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => navigate(`/CustomerReservation?productId=${product.id}`)}
                className="flex items-center justify-center gap-2 bg-[#f28a2e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#df751c]"
              >
                <Package size={17} /> Reserve for pickup
              </button>
              <button
                onClick={() => navigate(`/CustomerShopDetails/${product.shopId}`)}
                className="flex items-center justify-center gap-2 border border-[#d7dcd6] bg-[#fffdfa] px-5 py-3 text-sm font-bold text-[#173d3b] transition hover:border-[#173d3b]"
              >
                <Store size={17} /> View shop
              </button>
            </div>

            {shop?.phone && (
              <button
                onClick={() => window.open(`tel:${shop.phone}`)}
                className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-bold text-[#b75d17]"
              >
                <Phone size={16} /> Call {shop.name}
              </button>
            )}
          </section>
        </div>
      </div>

      <CustomerNav navigate={navigate} />
    </main>
  );
};

const CustomerNav = ({ navigate }) => (
  <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dfe3de] bg-[#fffdfa]/95 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
    <div className="mx-auto flex max-w-xl items-center justify-around">
      <NavItem icon={<Home />} label="Home" onClick={() => navigate("/CustomerDashboard")} />
      <NavItem icon={<MapPin />} label="Nearby" onClick={() => navigate("/Nearby")} />
      <NavItem icon={<Package />} label="Orders" onClick={() => navigate("/CustomerOrders")} />
      <NavItem icon={<Heart />} label="Saved" onClick={() => navigate("/CustomerSaved")} />
    </div>
  </nav>
);

const NavItem = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="relative flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5 text-[#87908d]"
  >
    {React.cloneElement(icon, { size: 21, strokeWidth: 1.9 })}
    <span className="text-[11px] font-bold">{label}</span>
  </button>
);

export default CustomerProductDetails;
