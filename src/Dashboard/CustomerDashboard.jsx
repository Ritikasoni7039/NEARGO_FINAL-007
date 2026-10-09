import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Mic,
  MapPin,
  ChevronDown,
  ChevronRight,
  Store,
  Bookmark,
  Home,
  ClipboardList,
  Heart,
  Navigation,
  X,
  Check,
  SlidersHorizontal,
  ArrowUpRight,
  Clock3,
  LocateFixed,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SearchBar from "../Customer/Components/SearchBar";
const products = [
  {
    id: 1,
    name: "iQOO Z9 5G",
    category: "Mobile",
    details: "8GB + 128GB · Ocean Blue",
    price: 17999,
    shop: "Sharma Mobiles",
    distance: "1.2 km",
    stock: "In stock",
    fresh: "2h ago",
    emoji: "📱",
    image:
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 2,
    name: "Philips LED Bulb",
    category: "Electrical",
    details: "9W · Cool Day Light",
    price: 149,
    shop: "Sharma Electricals",
    distance: "0.8 km",
    stock: "In stock",
    fresh: "1h ago",
    emoji: "💡",
    image:
      "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 3,
    name: "Taparia Screwdriver Set",
    category: "Hardware",
    details: "6 pcs · Multi-purpose",
    price: 349,
    shop: "Gupta Hardware",
    distance: "1.6 km",
    stock: "In stock",
    fresh: "3h ago",
    emoji: "🛠️",
    image:
      "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 4,
    name: "Classmate Notebook",
    category: "Stationery",
    details: "200 pages · Single line",
    price: 65,
    shop: "City Book Store",
    distance: "0.6 km",
    stock: "In stock",
    fresh: "30m ago",
    emoji: "📓",
    image:
      "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 5,
    name: "boAt Type-C Cable",
    category: "Mobile",
    details: "1.5m · Fast charging",
    price: 299,
    shop: "Gupta Mobile Store",
    distance: "1.1 km",
    stock: "In stock",
    fresh: "2h ago",
    emoji: "🔌",
    image:
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: 6,
    name: "Drill Bit Set",
    category: "Hardware",
    details: "10 pcs · Heavy duty",
    price: 499,
    shop: "Gupta Hardware",
    distance: "1.6 km",
    stock: "In stock",
    fresh: "4h ago",
    emoji: "🔧",
    image:
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=700&q=85",
  },
];

const categories = [
  { name: "Mobile", icon: "▣", note: "Phones & cables" },
  { name: "Electrical", icon: "◒", note: "Lights & switches" },
  { name: "Hardware", icon: "⌁", note: "Tools & supplies" },
  { name: "Stationery", icon: "▤", note: "Books & paper" },
];

const quickCities = [
  ["Indore", "2 km"],
  ["Mandsaur", "3 km"],
  ["Ujjain", "3 km"],
  ["Neemuch", "2 km"],
];

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [locationOpen, setLocationOpen] = useState(false);
  const [location, setLocation] = useState("Indore");
  const [radius, setRadius] = useState("2 km");
  const [reserved, setReserved] = useState([]);
  const [saved, setSaved] = useState([]);
  const [voiceListening, setVoiceListening] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [sort, setSort] = useState("Recommended");

  useEffect(() => {
    const storedOrders = JSON.parse(localStorage.getItem("nearGoOrders") || "[]");
    const storedSaved = JSON.parse(localStorage.getItem("nearGoSaved") || "[]");
    setReserved(storedOrders.map((item) => item.id));
    setSaved(storedSaved);
  }, []);

  useEffect(() => {
    const storedLocation = sessionStorage.getItem("nearGoCustomerLocation");
    if (!storedLocation) return;

    try {
      const parsed = JSON.parse(storedLocation);
      if (parsed?.city) setLocation(parsed.city);
      if (parsed?.radius) setRadius(parsed.radius);
    } catch {
      setLocation(storedLocation);
    }
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.shop.toLowerCase().includes(query);
      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    if (sort === "Cheapest") result.sort((a, b) => a.price - b.price);
    if (sort === "Nearest") result.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    return showAllProducts ? result : result.slice(0, 3);
  }, [search, activeCategory, showAllProducts, sort]);

  const searchSuggestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return products
      .filter((product) => `${product.name} ${product.category} ${product.shop}`.toLowerCase().includes(query))
      .slice(0, 5)
      .map((product) => ({
        id: product.id,
        value: product.name,
        title: product.name,
        subtitle: `${product.shop} · ${product.distance} · ${product.stock}`,
        icon: product.emoji,
      }));
  }, [search]);

  const reserveProduct = (product) => {
    const existingOrders = JSON.parse(localStorage.getItem("nearGoOrders") || "[]");
    if (existingOrders.some((item) => item.id === product.id)) return;

    const updated = [
      ...existingOrders,
      { ...product, reservedAt: new Date().toISOString(), status: "Reserved" },
    ];
    localStorage.setItem("nearGoOrders", JSON.stringify(updated));
    setReserved(updated.map((item) => item.id));
  };

  const toggleSaved = (product) => {
    const updated = saved.includes(product.id)
      ? saved.filter((id) => id !== product.id)
      : [...saved, product.id];
    setSaved(updated);
    localStorage.setItem("nearGoSaved", JSON.stringify(updated));
  };

  const startVoiceSearch = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setVoiceListening(true);

    recognition.onresult = (event) => {
      setSearch(event.results[0][0].transcript);
      setVoiceListening(false);
    };
    recognition.onerror = () => setVoiceListening(false);
    recognition.onend = () => setVoiceListening(false);
    recognition.start();
  };

  const selectLocation = (city, selectedRadius) => {
    setLocation(city);
    setRadius(selectedRadius);
    setLocationOpen(false);
    sessionStorage.setItem(
      "nearGoCustomerLocation",
      JSON.stringify({ city, radius: selectedRadius })
    );
  };

  const resetFilters = () => {
    setSearch("");
    setActiveCategory("All");
    setShowAllProducts(false);
    setSort("Recommended");
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f7f4] pb-[calc(5.9rem+env(safe-area-inset-bottom))] text-[#172d3d]">
      <section className="bg-[#113b52] text-white">
        <div className="mx-auto max-w-7xl px-5 pb-10 pt-5 sm:px-8 lg:px-12 lg:pb-14">
          <header className="flex items-center justify-between gap-4">
            <button
              onClick={() => navigate("/CustomerDashboard")}
              className="text-left"
              aria-label="Go to customer dashboard"
            >
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#f28a2e]" />
                <span className="text-xl font-extrabold tracking-[0.18em] sm:text-2xl">
                  NEAR<span className="text-[#f28a2e]">GO</span>
                </span>
              </div>
              <span className="ml-5 text-[10px] font-medium uppercase tracking-[0.22em] text-white/55">
                local shopping, made simple
              </span>
            </button>

            <button
              onClick={() => setLocationOpen(true)}
              className="flex max-w-[170px] items-center gap-2 border-b border-white/35 pb-1.5 text-left text-sm font-semibold sm:max-w-none"
            >
              <MapPin size={17} className="shrink-0 text-[#f28a2e]" />
              <span className="truncate">{location}</span>
              <span className="text-white/55">· {radius}</span>
              <ChevronDown size={16} className="shrink-0 text-white/65" />
            </button>
          </header>

          <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_390px] lg:items-end">
            <div>
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#f5b77b]">
                Around you, right now
              </p>
              <h1 className="max-w-2xl text-[clamp(2.7rem,7vw,5.8rem)] font-semibold leading-[0.94] tracking-[-0.06em]">
                Find it nearby.
                <br />
                <span className="text-[#f28a2e]">Go with confidence.</span>
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-white/70 sm:text-lg">
                Compare real local stock, prices and distance before you leave home.
              </p>
            </div>

            <SearchBar
              value={search}
              onChange={setSearch}
              onClear={() => setSearch("")}
              onVoiceSearch={startVoiceSearch}
              voiceListening={voiceListening}
              resultCount={filteredProducts.length}
              suggestions={searchSuggestions}
              onSuggestionSelect={(suggestion) => {
                setSearch(suggestion.value);
                navigate(`/Nearby?query=${encodeURIComponent(suggestion.value)}`);
              }}
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <section className="-mt-5 border border-[#e8e6df] bg-[#fffdfa] px-4 py-4 shadow-[0_12px_30px_rgba(24,45,61,0.06)] sm:px-6">
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            <button
              onClick={() => {
                setActiveCategory("All");
                setShowAllProducts(false);
              }}
              className={`shrink-0 border px-4 py-2 text-sm font-bold transition ${activeCategory === "All" ? "border-[#113b52] bg-[#113b52] text-white" : "border-[#dcded8] text-[#5e6d75] hover:border-[#113b52]"}`}
            >
              All products
            </button>
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => {
                  setActiveCategory(category.name);
                  setSearch("");
                  setShowAllProducts(false);
                }}
                className={`flex shrink-0 items-center gap-2 border px-4 py-2 text-sm font-bold transition ${activeCategory === category.name ? "border-[#f28a2e] bg-[#fff2e7] text-[#b75d17]" : "border-transparent text-[#5e6d75] hover:border-[#dcded8]"}`}
              >
                <span className="text-base">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-9 grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <button
            onClick={() => navigate("/Nearby")}
            className="group relative min-h-[215px] overflow-hidden bg-[#e8eee9] p-6 text-left transition hover:-translate-y-0.5 sm:p-8"
          >
            <div className="relative z-10 max-w-[65%]">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#567263]">
                <LocateFixed size={16} />
                Explore locally
              </div>
              <h2 className="mt-8 text-3xl font-semibold tracking-[-0.04em] text-[#173d3b] sm:text-4xl">
                Shops around {location}
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-[#55706d]">
                See what is open, available and worth the short trip.
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#173d3b]">
                Browse nearby <ArrowUpRight size={17} />
              </span>
            </div>
            <div className="absolute -right-10 -top-12 h-64 w-64 rounded-full border-[22px] border-[#c9dacf]" />
            <div className="absolute -bottom-28 right-12 h-64 w-64 rounded-full border-[20px] border-[#d8e5dc]" />
            <MapPin className="absolute right-[22%] top-[34%] text-[#f28a2e]" size={45} fill="currentColor" />
            <MapPin className="absolute right-[9%] top-[19%] text-[#567263]" size={22} />
          </button>

          <div className="flex flex-col justify-between border border-[#e4e1d9] bg-[#fffdfa] p-6 sm:p-8">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#7c8583]">Your area</p>
                <SlidersHorizontal size={18} className="text-[#7c8583]" />
              </div>
              <p className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[#173d3b]">{location}</p>
              <p className="mt-1 text-sm text-[#7c8583]">Searching within {radius}</p>
            </div>
            <button
              onClick={() => setLocationOpen(true)}
              className="mt-8 flex items-center justify-between border-t border-[#ece9e1] pt-4 text-sm font-bold text-[#b75d17]"
            >
              Change shopping area <ChevronRight size={17} />
            </button>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f28a2e]">{search ? `Search results for “${search}”` : "Live local stock"}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[#173d3b] sm:text-4xl">
                {search || activeCategory !== "All" ? "Matching products" : "Fresh nearby"}
              </h2>
              <p className="mt-2 text-sm text-[#7c8583]">{filteredProducts.length} options available from shops close to you.</p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              {(search || activeCategory !== "All") && <button type="button" onClick={resetFilters} className="text-xs font-bold text-[#b75d17]">Clear filters</button>}
              <button type="button" onClick={() => { setShowAllProducts(true); navigate("/Nearby"); }} className="items-center gap-1 text-sm font-bold text-[#173d3b]">View all <ArrowUpRight className="inline" size={16} /></button>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-y border-[#e4e1d9] py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#7c8583]"><SlidersHorizontal size={15} /> Refine your search <span className="font-normal text-[#a4adaa]">{activeCategory !== "All" ? `· ${activeCategory}` : "· all categories"}</span></div>
            <div className="flex gap-1.5">
              {["Recommended", "Cheapest", "Nearest"].map((item) => <button type="button" key={item} onClick={() => setSort(item)} className={`border px-2.5 py-1.5 text-[10px] font-bold ${sort === item ? "border-[#113b52] bg-[#113b52] text-white" : "border-[#d7dcd6] bg-[#fffdfa] text-[#7c8583]"}`}>{item}</button>)}
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => {
                const isReserved = reserved.includes(product.id);
                const isSaved = saved.includes(product.id);

                return (
                  <motion.article
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    key={product.id}
                    className="group border border-[#e5e2db] bg-[#fffdfa] p-3 transition hover:-translate-y-1 hover:shadow-[0_14px_35px_rgba(24,45,61,0.09)]"
                  >
                    <div className="relative flex h-52 items-center justify-center overflow-hidden bg-[#f1f2ee]">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-contain p-7 mix-blend-multiply transition duration-500 group-hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                          event.currentTarget.parentElement.innerHTML = `<span style="font-size:64px">${product.emoji}</span>`;
                        }}
                      />
                      <button
                        onClick={() => toggleSaved(product)}
                        aria-label={isSaved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
                        className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm transition ${isSaved ? "text-[#f28a2e]" : "text-[#65737a] hover:text-[#f28a2e]"}`}
                      >
                        <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
                      </button>
                    </div>

                    <div className="px-2 pb-1 pt-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#f28a2e]">{product.category}</p>
                          <h3 className="mt-2 truncate text-lg font-bold text-[#173d3b]">{product.name}</h3>
                          <p className="mt-1 truncate text-sm text-[#7c8583]">{product.details}</p>
                        </div>
                        <Navigation size={17} className="mt-1 shrink-0 text-[#7c8583]" />
                      </div>

                      <div className="mt-5 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-2xl font-semibold tracking-[-0.04em] text-[#173d3b]">₹{product.price.toLocaleString("en-IN")}</p>
                          <p className="mt-1 truncate text-xs text-[#7c8583]">{product.shop} · {product.distance}</p>
                        </div>
                        <span className="flex items-center gap-1 text-[11px] font-bold text-[#3b806a]">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#3b806a]" />
                          {product.stock}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-1 text-xs text-[#8b9490]">
                        <Clock3 size={13} /> Updated {product.fresh}
                      </div>

                      <button
                        onClick={() => reserveProduct(product)}
                        disabled={isReserved}
                        className={`mt-5 flex h-11 w-full items-center justify-center gap-2 text-sm font-bold transition ${isReserved ? "bg-[#e5f1ec] text-[#3b806a]" : "bg-[#f28a2e] text-white hover:bg-[#df751c]"}`}
                      >
                        {isReserved ? <><Check size={17} /> Reserved</> : <><Store size={17} /> Reserve for pickup</>}
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>

          {filteredProducts.length === 0 && (
            <div className="mt-6 border border-dashed border-[#cfd5d1] bg-[#fffdfa] px-5 py-14 text-center">
              <Search className="mx-auto text-[#7c8583]" size={30} />
              <h3 className="mt-4 text-xl font-bold text-[#173d3b]">Nothing matched that search</h3>
              <p className="mt-2 text-sm text-[#7c8583]">Try a different product, shop or category.</p>
              <button onClick={resetFilters} className="mt-5 border border-[#173d3b] px-5 py-2.5 text-sm font-bold text-[#173d3b]">Clear search</button>
            </div>
          )}
        </section>

        <div className="pt-7 sm:hidden">
          <button
            onClick={() => {
              setShowAllProducts(true);
              navigate("/Nearby");
            }}
            className="flex w-full items-center justify-center gap-2 border border-[#d8dcd7] bg-[#fffdfa] py-3 text-sm font-bold text-[#173d3b]"
          >
            View all products <ArrowUpRight size={17} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {locationOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLocationOpen(false)}
              className="fixed inset-0 z-[80] bg-[#102a36]/55 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 26 }}
              className="fixed bottom-0 left-0 right-0 z-[90] bg-[#fffdfa] p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl sm:bottom-5 sm:left-1/2 sm:max-w-md sm:-translate-x-1/2 sm:p-7"
            >
              <div className="mx-auto mb-6 h-1 w-12 bg-[#d8dcd7] sm:hidden" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f28a2e]">Shopping area</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#173d3b]">Where should we look?</h3>
                  <p className="mt-1 text-sm text-[#7c8583]">Choose a nearby area or set it precisely on a map.</p>
                </div>
                <button onClick={() => setLocationOpen(false)} className="rounded-full bg-[#f0f1ed] p-2 text-[#5e6d75]" aria-label="Close location selector"><X size={18} /></button>
              </div>

              <button
                onClick={() => {
                  setLocationOpen(false);
                  navigate("/CustomerLocation");
                }}
                className="mt-6 flex w-full items-center gap-3 border border-[#d7e4e4] bg-[#edf5f2] p-4 text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center bg-[#113b52] text-white"><LocateFixed size={19} /></div>
                <div>
                  <p className="font-bold text-[#173d3b]">Choose on map</p>
                  <p className="mt-0.5 text-xs text-[#7c8583]">Use your exact shopping area</p>
                </div>
                <ChevronRight className="ml-auto text-[#7c8583]" size={19} />
              </button>

              <div className="mt-5 divide-y divide-[#ece9e1] border-y border-[#ece9e1]">
                {quickCities.map(([city, cityRadius]) => (
                  <button
                    key={city}
                    onClick={() => selectLocation(city, cityRadius)}
                    className="flex w-full items-center gap-3 py-4 text-left"
                  >
                    <MapPin size={18} className="text-[#f28a2e]" />
                    <span className="font-semibold text-[#173d3b]">{city}</span>
                    <span className="ml-auto text-sm text-[#7c8583]">{cityRadius}</span>
                    {location === city && <Check size={18} className="text-[#3b806a]" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dfe3de] bg-[#fffdfa]/95 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-xl items-center justify-around">
          <BottomItem icon={<Home />} label="Home" active onClick={() => navigate("/CustomerDashboard")} />
          <BottomItem icon={<MapPin />} label="Nearby" onClick={() => navigate("/Nearby")} />
          <BottomItem icon={<ClipboardList />} label="Orders" onClick={() => navigate("/CustomerOrders")} badge={reserved.length} />
          <BottomItem icon={<Bookmark />} label="Saved" onClick={() => navigate("/CustomerSaved")} badge={saved.length} />
          <BottomItem icon={<User />} label="Profile" onClick={() => navigate("/CustomerProfile")} />
        </div>
      </nav>
    </main>
  );
};

const BottomItem = ({ icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5 ${active ? "text-[#113b52]" : "text-[#87908d]"}`}
  >
    <div className="relative">
      {React.cloneElement(icon, { size: 21, strokeWidth: active ? 2.7 : 1.9 })}
      {badge > 0 && <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f28a2e] px-1 text-[9px] font-bold text-white">{badge}</span>}
    </div>
    <span className="text-[11px] font-bold sm:text-xs">{label}</span>
    {active && <span className="absolute -bottom-1 h-0.5 w-8 bg-[#f28a2e]" />}
  </button>
);

export default CustomerDashboard;
