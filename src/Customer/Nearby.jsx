import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  Crosshair,
  Heart,
  Home,
  Layers3,
  MapPin,
  Navigation,
  Package,
  Search,User,
  SlidersHorizontal,
  Sparkles,
  Store,
  X,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  Loader2,
  LocateFixed,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  getNearbyProducts,
  getNearbyShops,
  MANDSAUR_COORDS,
} from "../services/marketplaceService";

// Leaflet default marker icon setup
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

const AVAILABLE_RADII = ["2 km", "3 km", "5 km", "8 km", "10 km"];

const getLocation = () => {
  try {
    return (
      JSON.parse(sessionStorage.getItem("nearGoCustomerLocation") || "null") || {
        city: "Mandsaur",
        radius: "2 km",
        lat: MANDSAUR_COORDS.lat,
        lng: MANDSAUR_COORDS.lng,
      }
    );
  } catch {
    return { city: "Mandsaur", radius: "2 km", lat: MANDSAUR_COORDS.lat, lng: MANDSAUR_COORDS.lng };
  }
};

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const defaultSuggestions = [
  { icon: "💡", title: "LED bulbs", text: "Shops have stock nearby", query: "LED" },
  { icon: "🔌", title: "Charging cables", text: "Best price from ₹199", query: "cable" },
  { icon: "🛠️", title: "Hardware essentials", text: "Popular in your area", query: "hardware" },
];

const Nearby = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = getLocation();
  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [selectedRadius, setSelectedRadius] = useState(location.radius || "2 km");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("Recommended");
  const [saved, setSaved] = useState(readJson("nearGoSaved", []));
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [mapMode, setMapMode] = useState("Map");
  const [showFilters, setShowFilters] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  // Live Supabase states
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expansionNotice, setExpansionNotice] = useState(null);

  const coords = useMemo(() => ({
    lat: location.lat || MANDSAUR_COORDS.lat,
    lng: location.lng || MANDSAUR_COORDS.lng,
  }), [location]);

  // Load nearby products and shops from Supabase
  useEffect(() => {
    let active = true;
    const loadNearbyData = async () => {
      setLoading(true);
      try {
        const numRadius = parseInt(selectedRadius, 10) || 2;
        const [prodRes, shopRes] = await Promise.all([
          getNearbyProducts(coords.lat, coords.lng, numRadius, query),
          getNearbyShops(coords.lat, coords.lng, numRadius),
        ]);

        if (active) {
          setProducts(prodRes.products || []);
          setExpansionNotice(prodRes.message);
          setShops(shopRes || []);
          if (shopRes?.length > 0 && !selectedShopId) {
            setSelectedShopId(shopRes[0].id);
          }
        }
      } catch (err) {
        console.error("Nearby fetch error:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadNearbyData();
    return () => {
      active = false;
    };
  }, [selectedRadius, query, coords]);
  const toggleSaved = (productId) => {
    const updated = saved.includes(productId)
      ? saved.filter((id) => id !== productId)
      : [...saved, productId];
    setSaved(updated);
    localStorage.setItem("nearGoSaved", JSON.stringify(updated));
  };

  // Filtered and sorted products
  const results = useMemo(() => {
    const filtered = products.filter((p) => {
      const matchCat = category === "All" || p.category === category;
      return matchCat;
    });

    if (sort === "Cheapest") return [...filtered].sort((a, b) => a.price - b.price);
    if (sort === "Nearest") return [...filtered].sort((a, b) => parseFloat(a.distance || 0) - parseFloat(b.distance || 0));
    return filtered;
  }, [products, category, sort]);

  // Categories dynamically from products
  const availableCategories = useMemo(() => {
    const set = new Set(["All"]);
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Selected shop data
  const selectedShopData = useMemo(() => {
    if (!shops.length) return null;
    return shops.find((s) => s.id === selectedShopId) || shops[0];
  }, [shops, selectedShopId]);

  const selectedShopProducts = useMemo(() => {
    if (!selectedShopData) return [];
    return products.filter((p) => p.shopId === selectedShopData.id || p.shop === selectedShopData.shop_name);
  }, [products, selectedShopData]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f5f1] pb-[calc(5.9rem+env(safe-area-inset-bottom))] text-[#173d3b]">
      <header className="border-b border-[#dfe4dd] bg-[#fffdfa]">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-4 sm:px-7 lg:px-10">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <button onClick={() => navigate(-1)} className="rounded-full p-2 text-[#5e6d75] hover:bg-[#f0f1ed]" aria-label="Go back">
              <ArrowLeft size={19} />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f28a2e]">Live local discovery</p>
              <h1 className="truncate text-xl font-semibold tracking-[-0.04em] sm:text-2xl">Nearby around {location.city}</h1>
            </div>
          </div>
          <button onClick={() => navigate("/CustomerLocation")} className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-[#b75d17]">
            <MapPin size={16} /> <span className="hidden sm:inline">{selectedRadius} radius</span><span className="sm:hidden">Change</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-4 sm:px-7 lg:px-10 lg:py-6">
        <section className="relative overflow-hidden bg-[#113b52] p-5 text-white sm:p-7">
          <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f5b77b]">
                <Sparkles size={15} /> Smart nearby view
              </div>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.05em] sm:text-4xl">
                Find the right shop before you step out.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
                See local stock, compare prices and choose the closest option around {location.city}.
              </p>
            </div>
            <div className="flex flex-col gap-2 items-start lg:items-end">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#4fd0a0]" />
                {shops.length} shops reporting nearby
              </div>
              {/* Radius Chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {AVAILABLE_RADII.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRadius(r)}
                    className={`px-2 py-1 text-xs font-bold rounded transition ${
                      selectedRadius === r
                        ? "bg-[#f28a2e] text-white"
                        : "bg-white/10 text-white/80 hover:bg-white/20"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border-[34px] border-white/5" />
          <div className="absolute -bottom-40 right-32 h-72 w-72 rounded-full border-[24px] border-[#f28a2e]/10" />
        </section>

        {/* Sequential Radius Expansion Notice */}
        {expansionNotice && (
          <div className="mt-4 flex items-center gap-2.5 border border-[#fed7aa] bg-[#fff7ed] px-4 py-3 text-sm font-semibold text-[#c2410c]">
            <AlertCircle size={18} className="shrink-0 text-[#f97316]" />
            <span>{expansionNotice}</span>
          </div>
        )}

        <section className="relative z-20 mx-auto -mt-5 max-w-4xl border border-[#e3e1d9] bg-[#fffdfa] p-2 shadow-[0_14px_32px_rgba(25,50,55,0.12)]">
          <div className="flex items-center gap-3 px-3 py-2">
            <Search size={20} className="shrink-0 text-[#7c8583]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, shops or categories..." className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-[#a4adaa] sm:text-base" />
            {query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={18} className="text-[#7c8583]" /></button>}
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 border-l border-[#e8e6df] pl-3 text-sm font-bold ${showFilters ? "text-[#b75d17]" : "text-[#5e6d75]"}`}><SlidersHorizontal size={18} /><span className="hidden sm:inline">Filters</span></button>
          </div>
          {showFilters && <div className="flex flex-wrap gap-2 border-t border-[#ece9e1] px-3 pb-2 pt-3">{availableCategories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`border px-3 py-1.5 text-xs font-bold ${category === item ? "border-[#f28a2e] bg-[#fff2e7] text-[#b75d17]" : "border-[#d7dcd6] text-[#7c8583]"}`}>{item}</button>)}</div>}
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(370px,0.85fr)]">
          <section className="relative min-h-[470px] overflow-hidden border border-[#d8e0d9] bg-[#dfe9df] shadow-[0_8px_24px_rgba(25,50,55,0.06)] sm:min-h-[610px]">
            {/* Top Overlay Controls */}
            <div className="absolute left-4 top-4 z-[400] flex items-center gap-2 bg-white/95 px-3 py-2 text-xs font-bold shadow-md backdrop-blur sm:left-5 sm:top-5">
              <Navigation size={15} className="text-[#f28a2e]" /> {location.city} · {selectedRadius}
            </div>

            <div className="absolute right-4 top-4 z-[400] flex overflow-hidden border border-[#d7dcd6] bg-white/95 shadow-md backdrop-blur sm:right-5 sm:top-5">
              {["Map", "Satellite"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMapMode(mode)}
                  className={`px-3.5 py-1.5 text-xs font-bold transition ${
                    mapMode === mode ? "bg-[#113b52] text-white" : "text-[#7c8583] hover:bg-gray-100"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Real Interactive Leaflet Map */}
            <div className="h-full w-full min-h-[500px] sm:min-h-[610px]">
              <MapContainer
                center={[coords.lat || 24.0722, coords.lng || 75.0683]}
                zoom={14}
                scrollWheelZoom={false}
                className="h-full w-full"
                style={{ height: "100%", minHeight: "500px", width: "100%" }}
              >
                <MapRecenter center={[coords.lat || 24.0722, coords.lng || 75.0683]} />
                {mapMode === "Satellite" ? (
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution="&copy; Esri World Imagery"
                    maxZoom={19}
                  />
                ) : (
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                    maxZoom={19}
                  />
                )}

                {shops.map((s) => {
                  const lat = Number(s.latitude);
                  const lng = Number(s.longitude);
                  if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

                  return (
                    <Marker
                      key={s.id}
                      position={[lat, lng]}
                      eventHandlers={{
                        click: () => setSelectedShopId(s.id),
                      }}
                    >
                      <Popup>
                        <div className="p-1 min-w-[210px] text-left">
                          {s.shop_image && (
                            <img
                              src={s.shop_image}
                              alt={s.shop_name}
                              className="h-24 w-full object-cover rounded mb-2"
                            />
                          )}
                          <h4 className="font-bold text-sm text-[#113b52]">{s.shop_name}</h4>
                          <p className="text-xs text-[#f28a2e] font-semibold">{s.category}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{s.address || s.current_area || "Mandsaur"}</p>
                          <div className="flex items-center gap-1.5 mt-2 text-xs font-bold text-[#b75d17]">
                            <span>⭐ {s.avg_rating || "4.6"}</span>
                            <span className="text-gray-400 font-normal">({s.reviews_count || 5} reviews)</span>
                          </div>
                          <p className="text-xs font-semibold text-[#3b806a] mt-1">{s.distance || "Nearby"} away</p>
                          <button
                            type="button"
                            onClick={() => navigate(`/CustomerShopDetails/${s.id}`)}
                            className="mt-2.5 w-full bg-[#113b52] text-white py-1.5 text-xs font-bold rounded hover:bg-[#184e6b] transition"
                          >
                            View Shop & Products
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>

            {query && results.length === 0 && (
              <div className="absolute left-1/2 top-1/2 z-[400] w-[min(86%,300px)] -translate-x-1/2 -translate-y-1/2 bg-white/95 p-5 text-center shadow-lg">
                <Search className="mx-auto text-[#7c8583]" size={25} />
                <p className="mt-3 text-sm font-bold text-[#173d3b]">No items found for “{query}”</p>
                <button type="button" onClick={() => { setQuery(""); navigate("/Nearby"); }} className="mt-3 text-xs font-bold text-[#b75d17]">Show all nearby</button>
              </div>
            )}

            <div className="absolute bottom-4 left-4 z-[400] flex flex-col gap-2 sm:bottom-5 sm:left-5">
              <button
                type="button"
                className="flex items-center gap-2 rounded bg-[#113b52] px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#184e6b]"
                onClick={() => navigate("/CustomerLocation")}
                aria-label="Change location"
              >
                <LocateFixed size={15} /> GPS / Change Spot
              </button>
            </div>

            <div className="absolute bottom-4 right-4 z-[400] flex items-center gap-2 bg-white/90 px-3 py-1.5 text-[10px] font-bold text-[#567263] shadow-sm sm:bottom-5 sm:right-5">
              <span className="h-2 w-2 rounded-full bg-[#f28a2e]" /> {mapMode} · {shops.length} shops shown
            </div>
          </section>

          <section className="min-w-0">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f28a2e]">Picked for you</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em]">Smart suggestions</h2>
              </div>
              <span className="text-xs font-bold text-[#7c8583]">{results.length} results</span>
            </div>
            <button type="button" onClick={() => setSuggestionsOpen(true)} className="mt-4 flex w-full items-center justify-between border border-[#e4e1d9] bg-[#fffdfa] p-4 text-left transition hover:border-[#f28a2e]">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center bg-[#fff1e4] text-xl">✨</span>
                <span>
                  <b className="block text-sm">Smart suggestions</b>
                  <small className="mt-1 block text-xs text-[#7c8583]">Tap to see ideas picked for you</small>
                </span>
              </span>
              <ArrowUpRight size={17} className="text-[#b75d17]" />
            </button>

            {selectedShopData && (
              <div className="mt-7 border border-[#d8e0d9] bg-[#edf5f2] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <Sparkles size={19} className="mt-0.5 shrink-0 text-[#f28a2e]" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3b806a]">Near-Go insight</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#315e58]">
                      {selectedShopData.shop_name} ({selectedShopData.distance || "Nearby"}) {selectedShopData.current_area ? `at ${selectedShopData.current_area}` : ""} is active in your chosen {selectedRadius} area.
                    </p>
                    <button onClick={() => navigate(`/CustomerShopDetails/${selectedShopData.id}`)} className="mt-3 text-xs font-bold text-[#b75d17]">
                      Open shop profile <ChevronRight className="inline" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e1d9] pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f28a2e]">Compare stock</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">Available nearby</h2>
              </div>
              <div className="flex gap-1.5">
                {["Recommended", "Cheapest", "Nearest"].map((item) => (
                  <button key={item} onClick={() => setSort(item)} className={`px-2.5 py-1.5 text-[10px] font-bold ${sort === item ? "bg-[#113b52] text-white" : "bg-[#fffdfa] text-[#7c8583]"}`}>
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {results.slice(0, 6).map((product) => {
                const isSaved = saved.includes(product.id);
                return (
                  <article key={product.id} className="flex gap-3 border border-[#e4e1d9] bg-[#fffdfa] p-3 transition hover:border-[#c9d5cd]">
                    <button onClick={() => navigate(`/CustomerProductDetails/${product.id}`)} className="flex min-w-0 flex-1 gap-3 text-left">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-[#f1f2ee]">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-contain p-2 mix-blend-multiply"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                            event.currentTarget.parentElement.innerHTML = `<span style="font-size:28px">${product.emoji}</span>`;
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-bold">{product.name}</h3>
                            <p className="mt-0.5 truncate text-xs text-[#7c8583]">{product.shop} · {product.distance}</p>
                          </div>
                          <ArrowUpRight size={15} className="shrink-0 text-[#7c8583]" />
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <b className="text-base">₹{product.price.toLocaleString("en-IN")}</b>
                          <span className={`text-[10px] font-bold ${product.stock === "Out of stock" ? "text-[#dc2626]" : "text-[#3b806a]"}`}>
                            ● {product.stock}
                          </span>
                        </div>
                      </div>
                    </button>
                    <button onClick={() => toggleSaved(product.id)} className={`h-fit rounded-full p-1.5 ${isSaved ? "text-[#f28a2e]" : "text-[#89928f]"}`} aria-label="Save product">
                      <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {suggestionsOpen && (
        <>
          <div className="fixed inset-0 z-[55] bg-[#102a36]/15" onClick={() => setSuggestionsOpen(false)} />
          <section className="fixed inset-x-3 bottom-[5.4rem] z-[60] mx-auto max-w-2xl overflow-hidden border border-[#d7e5dd] bg-[#fffdfa] shadow-[0_20px_55px_rgba(17,59,82,0.24)] sm:inset-x-auto sm:bottom-24 sm:w-[min(92vw,620px)]">
            <div className="flex items-start justify-between gap-4 bg-[#113b52] px-5 py-4 text-white sm:px-6">
              <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#f28a2e] text-xl">✨</span><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f5b77b]">Near-Go assist</p><h3 className="mt-1 text-lg font-semibold">Smart suggestions for you</h3><p className="mt-1 text-xs text-white/60">Choose an idea and we’ll show every matching shop on the map.</p></div></div>
              <button type="button" onClick={() => setSuggestionsOpen(false)} className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Close smart suggestions"><X size={18} /></button>
            </div>
            <div className="grid gap-2 p-3 sm:grid-cols-3 sm:p-4">
              {suggestions.map((item) => (
                <button type="button" key={item.title} onClick={() => { setQuery(item.query); setSuggestionsOpen(false); }} className="group flex items-center gap-3 border border-[#e7e5de] bg-[#fffdfa] p-3 text-left transition hover:border-[#f28a2e] hover:bg-[#fff7ef]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#fff1e4] text-xl">{item.icon}</span><span className="min-w-0 flex-1"><b className="block truncate text-sm">{item.title}</b><small className="mt-1 block truncate text-xs text-[#7c8583]">{item.text}</small></span><ArrowUpRight size={15} className="shrink-0 text-[#b75d17]" />
                </button>
              ))}
            </div>
          </section>
        </>
      )}
      {!suggestionsOpen && <button type="button" onClick={() => setSuggestionsOpen(true)} className="fixed bottom-[5.6rem] right-4 z-[60] flex items-center gap-2 bg-[#113b52] px-4 py-3 text-xs font-bold text-white shadow-lg sm:bottom-24 sm:right-6"><Sparkles size={15} className="text-[#f5b77b]" /> Suggestions</button>}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dfe3de] bg-[#fffdfa]/95 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl"><div className="mx-auto flex max-w-xl items-center justify-around"><NavItem icon={<Home />} label="Home" onClick={() => navigate("/CustomerDashboard")} /><NavItem icon={<MapPin />} label="Nearby" active onClick={() => navigate("/Nearby")} /><NavItem icon={<Package />} label="Orders" onClick={() => navigate("/CustomerOrders")} /><NavItem icon={<Heart />} label="Saved" onClick={() => navigate("/CustomerSaved")} /><NavItem icon={<User />} label="Profile" onClick={() => navigate("/CustomerProfile")} /></div></nav>
    </main>
  );
};

const NavItem = ({ icon, label, active, onClick }) => <button onClick={onClick} className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5 ${active ? "text-[#113b52]" : "text-[#87908d]"}`}>{React.cloneElement(icon, { size: 21, strokeWidth: active ? 2.7 : 1.9 })}<span className="text-[11px] font-bold">{label}</span>{active && <span className="absolute -bottom-1 h-0.5 w-8 bg-[#f28a2e]" />}</button>;

export default Nearby;
