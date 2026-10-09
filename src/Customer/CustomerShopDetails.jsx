import React from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  Heart,
  Home,
  MapPin,
  Navigation,
  Package,
  Phone,
  Store,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { customerProducts, customerShops } from "../Customer/CustomerData";

const CustomerShopDetails = () => {
  const navigate = useNavigate();
  const { shopId } = useParams();
  const shop = customerShops[shopId] || customerShops["sharma-electricals"];
  const products = customerProducts.filter((product) => product.shopId === shop.id);

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
              Local shop
            </p>
            <h1 className="text-2xl font-semibold tracking-[-0.04em]">
              Shop details
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12">
        <section className="bg-[#113b52] p-7 text-white sm:p-10">
          <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f5b77b]">
                {shop.category}
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em]">
                {shop.name}
              </h2>
              <p className="mt-4 flex items-center gap-2 text-sm text-white/70">
                <MapPin size={16} className="text-[#f28a2e]" />
                {shop.address} · {shop.distance}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => window.open(`tel:${shop.phone}`)}
                className="flex items-center gap-2 bg-[#f28a2e] px-5 py-3 text-sm font-bold text-white"
              >
                <Phone size={16} /> Call shop
              </button>
              <button
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`)}
                className="flex items-center gap-2 border border-white/30 px-5 py-3 text-sm font-bold text-white"
              >
                <Navigation size={16} /> Directions
              </button>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
          <section>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f28a2e]">
              About this shop
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
              {shop.open ? "Open today" : "Closed now"}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-[#7c8583]">
              Rated {shop.rating} by local customers. Stock and pricing are updated by the shopkeeper.
            </p>

            <div className="mt-6 border border-[#e4e1d9] bg-[#fffdfa] p-5 text-sm text-[#5e6d75]">
              <div className="flex items-center gap-3">
                <Clock3 size={18} className="text-[#f28a2e]" />
                Usually open until 8:30 PM
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Phone size={18} className="text-[#f28a2e]" />
                {shop.phone}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <MapPin size={18} className="text-[#f28a2e]" />
                {shop.address}
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f28a2e]">
                  Available here
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">
                  Products in stock
                </h2>
              </div>
              <button
                onClick={() => navigate("/Nearby")}
                className="hidden text-sm font-bold sm:block"
              >
                See nearby <ArrowUpRight className="inline" size={16} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="flex gap-4 border border-[#e4e1d9] bg-[#fffdfa] p-4 sm:p-5"
                >
                  <button
                    onClick={() => navigate(`/CustomerProductDetails/${product.id}`)}
                    className="flex min-w-0 flex-1 gap-4 text-left"
                  >
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center bg-[#edf0eb]">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-contain p-3 mix-blend-multiply"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                          event.currentTarget.parentElement.innerHTML = `<span style="font-size:36px">${product.emoji}</span>`;
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#f28a2e]">
                        {product.category}
                      </p>
                      <h3 className="mt-1 truncate text-lg font-bold">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-sm text-[#7c8583]">
                        {product.details}
                      </p>
                      <p className="mt-4 text-xl font-semibold">
                        ₹{product.price.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate(`/CustomerReservation?productId=${product.id}`)}
                    className="h-fit shrink-0 border border-[#d7dcd6] p-2.5 text-[#b75d17]"
                    aria-label={`Reserve ${product.name}`}
                  >
                    <Package size={18} />
                  </button>
                </article>
              ))}
            </div>

            <button
              onClick={() => navigate("/Nearby")}
              className="mt-5 flex w-full items-center justify-center gap-2 border border-[#d7dcd6] bg-[#fffdfa] py-3 text-sm font-bold sm:hidden"
            >
              See more nearby <ArrowUpRight size={16} />
            </button>
          </section>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dfe3de] bg-[#fffdfa]/95 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center justify-around">
          <NavItem icon={<Home />} label="Home" onClick={() => navigate("/CustomerDashboard")} />
          <NavItem icon={<MapPin />} label="Nearby" onClick={() => navigate("/Nearby")} />
          <NavItem icon={<Package />} label="Orders" onClick={() => navigate("/CustomerOrders")} />
          <NavItem icon={<Heart />} label="Saved" onClick={() => navigate("/CustomerSaved")} />
        </div>
      </nav>
    </main>
  );
};

const NavItem = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="relative flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5 text-[#87908d]"
  >
    {React.cloneElement(icon, { size: 21, strokeWidth: 1.9 })}
    <span className="text-[11px] font-bold">{label}</span>
  </button>
);

export default CustomerShopDetails;
