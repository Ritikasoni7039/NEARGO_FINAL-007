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
  Loader2,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import SearchBar from "../Customer/Components/SearchBar";
import {
  getNearbyProducts,
  getNearbyShops,
  createReservation,
  MANDSAUR_COORDS,
} from "../services/marketplaceService";

const AVAILABLE_RADII = ["2 km", "3 km", "5 km", "8 km", "10 km"];

const quickCities = [
  ["Mandsaur", "2 km"],
  ["Indore", "3 km"],
  ["Ujjain", "5 km"],
  ["Neemuch", "2 km"],
];

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [locationOpen, setLocationOpen] = useState(false);
  const [location, setLocation] = useState("Mandsaur");
  const [radius, setRadius] = useState("2 km");
  const [coords, setCoords] = useState(MANDSAUR_COORDS);
  const [reserved, setReserved] = useState([]);
  const [saved, setSaved] = useState([]);
  const [voiceListening, setVoiceListening] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [sort, setSort] = useState("Recommended");
  const [locating, setLocating] = useState(false);

  // Supabase real-time states
  const [productsList, setProductsList] = useState([]);
  const [outOfRadiusList, setOutOfRadiusList] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [expansionMessage, setExpansionMessage] = useState(null);
  const [reservingId, setReservingId] = useState(null);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });
        setLocation("My Location (GPS)");
        sessionStorage.setItem(
          "nearGoCustomerLocation",
          JSON.stringify({ city: "My Location (GPS)", radius, lat, lng })
        );
        setLocating(false);
        setLocationOpen(false);
      },
      (error) => {
        console.warn("Geolocation error:", error);
        alert("Could not fetch your GPS location. Please check browser permissions.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

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
      if (parsed?.lat && parsed?.lng) {
        setCoords({ lat: parsed.lat, lng: parsed.lng });
      }
    } catch {
      setLocation(storedLocation);
    }
  }, []);

  // Fetch live products from Supabase with sequential radius search + Realtime listener
  useEffect(() => {
    let isCancelled = false;
    const fetchLiveProducts = async () => {
      setLoadingProducts(true);
      try {
        const numRadius = parseInt(radius, 10) || 2;
        const res = await getNearbyProducts(coords.lat, coords.lng, numRadius, search);
        if (!isCancelled) {
          setProductsList(res.products || []);
          setOutOfRadiusList(res.outOfRadiusProducts || []);
          setExpansionMessage(res.message);
        }
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        if (!isCancelled) setLoadingProducts(false);
      }
    };

    fetchLiveProducts();

    // Realtime updates: when shopkeeper inserts, updates or confirms stock
    const channel = supabase
      .channel("customer-dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        fetchLiveProducts();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "shops" }, () => {
        fetchLiveProducts();
      })
      .subscribe();

    return () => {
      isCancelled = true;
      supabase.removeChannel(channel);
    };
  }, [radius, search, coords]);

  // Dynamically extract categories from real products
  const dynamicCategories = useMemo(() => {
    const set = new Set();
    productsList.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).map((cat) => ({
      name: cat,
      icon: "▣",
    }));
  }, [productsList]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const result = productsList.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query) ||
        product.shop?.toLowerCase().includes(query);
      const matchesCategory =
        activeCategory === "All" || product.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    if (sort === "Cheapest") result.sort((a, b) => a.price - b.price);
    if (sort === "Nearest") result.sort((a, b) => parseFloat(a.distance || 0) - parseFloat(b.distance || 0));

    return showAllProducts ? result : result.slice(0, 6);
  }, [search, activeCategory, showAllProducts, sort, productsList]);

  const searchSuggestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return productsList
      .filter((product) => `${product.name} ${product.category} ${product.shop}`.toLowerCase().includes(query))
      .slice(0, 5)
      .map((product) => ({
        id: product.id,
        value: product.name,
        title: product.name,
        subtitle: `${product.shop} · ${product.distance} · ${product.stock}`,
        icon: product.emoji || "📦",
      }));
  }, [search, productsList]);

  const reserveProduct = async (product) => {
    if (product.stock === "Out of stock" || product.stockQuantity === 0) {
      alert("This item is currently out of stock.");
      return;
    }

    setReservingId(product.id);
    try {
      const order = await createReservation({
        product,
        quantity: 1,
        pickupDate: "Today",
        pickupTime: "4:30 PM",
        customerName: "Customer",
        customerPhone: "",
        notes: "Quick reservation from dashboard",
        customerLat: coords.lat,
        customerLng: coords.lng,
      });

      setReserved((prev) => [...prev, product.id]);
      navigate("/CustomerReservationConfirmation");
    } catch (err) {
      console.error("Reservation error:", err);
      alert("Could not complete reservation. Please try again.");
    } finally {
      setReservingId(null);
    }
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
      JSON.stringify({ city, radius: selectedRadius, lat: coords.lat, lng: coords.lng })
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
          <header className="flex items-center justify-between gap-2 sm:gap-4">
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
              className="flex max-w-[150px] sm:max-w-none items-center gap-1.5 sm:gap-2 border-b border-white/35 pb-1.5 text-left text-xs sm:text-sm font-semibold"
            >
              <MapPin size={16} className="shrink-0 text-[#f28a2e]" />
              <span className="truncate">{location}</span>
              <span className="text-white/55">· {radius}</span>
              <ChevronDown size={15} className="shrink-0 text-white/65" />
            </button>
          </header>

          <div className="mt-10 sm:mt-14 grid gap-8 lg:grid-cols-[1fr_390px] lg:items-end">
            <div>
              <p className="mb-3 sm:mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#f5b77b]">
                Around you, right now
              </p>
              <h1 className="max-w-2xl text-[clamp(2.1rem,6.5vw,5.8rem)] font-semibold leading-[0.95] tracking-[-0.05em]">
                Find it nearby.
                <br />
                <span className="text-[#f28a2e]">Go with confidence.</span>
              </h1>
              <p className="mt-4 sm:mt-6 max-w-lg text-sm sm:text-base leading-6 sm:leading-7 text-white/70">
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
            {dynamicCategories.map((category) => (
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
              <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#173d3b]">{location}</p>
              
              {/* Radius Selector: 2 km, 3 km, 5 km, 8 km, 10 km */}
              <div className="mt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#7c8583] mb-2">Discovery Radius</p>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_RADII.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRadius(r)}
                      className={`px-2.5 py-1 text-xs font-bold border transition ${
                        radius === r
                          ? "bg-[#113b52] text-white border-[#113b52]"
                          : "bg-white text-[#5e6d75] border-[#dcded8] hover:border-[#113b52]"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={locating}
                onClick={handleUseCurrentLocation}
                className="mt-4 flex w-full items-center justify-center gap-2 border border-[#113b52] bg-[#edf5f2] px-3 py-2.5 text-xs font-bold text-[#113b52] transition hover:bg-[#dbeae3] disabled:opacity-50"
              >
                {locating ? <Loader2 size={15} className="animate-spin" /> : <LocateFixed size={15} />}
                {locating ? "Detecting GPS location..." : "Use My Current Location"}
              </button>
            </div>
            <button
              onClick={() => setLocationOpen(true)}
              className="mt-6 flex items-center justify-between border-t border-[#ece9e1] pt-4 text-sm font-bold text-[#b75d17]"
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

          {/* Sequential expansion message banner */}
          {expansionMessage && (
            <div className="mt-4 flex items-center gap-2.5 border border-[#fed7aa] bg-[#fff7ed] px-4 py-3 text-sm font-semibold text-[#c2410c]">
              <AlertCircle size={18} className="shrink-0 text-[#f97316]" />
              <span>{expansionMessage}</span>
            </div>
          )}

          {loadingProducts ? (
            <div className="mt-12 flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-[#113b52]" />
              <p className="mt-3 text-sm text-[#7c8583]">Scanning local shops around {location} ({radius})...</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => {
                  const isReserved = reserved.includes(product.id);
                  const isSaved = saved.includes(product.id);
                  const isOutOfStock = product.stock === "Out of stock" || product.stockQuantity === 0;

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
                            <p className="mt-1 truncate text-xs text-[#7c8583]">
                              {product.shop} · {product.distance}
                              <span className="ml-1.5 font-bold text-[#b75d17]">⭐ {product.avg_rating || "4.6"}</span>
                              <span className="text-gray-400 font-normal"> ({product.reviews_count || 5})</span>
                            </p>
                          </div>
                          <span className={`flex items-center gap-1 text-[11px] font-bold ${isOutOfStock ? "text-[#dc2626]" : "text-[#3b806a]"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isOutOfStock ? "bg-[#dc2626]" : "bg-[#3b806a]"}`} />
                            {isOutOfStock ? "Out of stock" : product.stock}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center gap-1 text-xs text-[#8b9490]">
                          <Clock3 size={13} /> Updated {product.fresh || "Today"}
                        </div>

                        <button
                          onClick={() => reserveProduct(product)}
                          disabled={isReserved || isOutOfStock || reservingId === product.id}
                          className={`mt-5 flex h-11 w-full items-center justify-center gap-2 text-sm font-bold transition ${
                            isOutOfStock
                              ? "bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed"
                              : isReserved
                              ? "bg-[#e5f1ec] text-[#3b806a]"
                              : "bg-[#f28a2e] text-white hover:bg-[#df751c]"
                          }`}
                        >
                          {reservingId === product.id ? (
                            <><Loader2 size={17} className="animate-spin" /> Reserving...</>
                          ) : isOutOfStock ? (
                            "Out of stock"
                          ) : isReserved ? (
                            <><Check size={17} /> Reserved</>
                          ) : (
                            <><Store size={17} /> Reserve for pickup</>
                          )}
                        </button>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="mt-6 border border-dashed border-[#cfd5d1] bg-[#fffdfa] px-5 py-14 text-center">
              <Search className="mx-auto text-[#7c8583]" size={30} />
              <h3 className="mt-4 text-xl font-bold text-[#173d3b]">Nothing matched within {radius}</h3>
              <p className="mt-2 text-sm text-[#7c8583]">Check available items in the extended area below or try another search.</p>
              <button onClick={resetFilters} className="mt-5 border border-[#173d3b] px-5 py-2.5 text-sm font-bold text-[#173d3b]">Clear search</button>
            </div>
          )}

          {/* Out of Radius Products Section */}
          {outOfRadiusList.length > 0 && (
            <div className="mt-14 border-t border-[#e2e0d8] pt-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#ea580c]">
                    <MapPin size={15} /> Beyond {radius} Radius
                  </div>
                  <h3 className="mt-1 text-2xl font-bold text-[#173d3b]">Available in Wider Area</h3>
                  <p className="mt-1 text-sm text-[#7c8583]">These items are located just outside your chosen radius with exact distance.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {outOfRadiusList.slice(0, 6).map((product) => (
                  <article
                    key={product.id}
                    className="group border border-[#e5e2db] bg-[#fffdfa] p-3 transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="relative flex h-48 items-center justify-center overflow-hidden bg-[#f1f2ee]">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-contain p-6 mix-blend-multiply transition duration-500 group-hover:scale-105"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                          event.currentTarget.parentElement.innerHTML = `<span style="font-size:56px">${product.emoji}</span>`;
                        }}
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-[#113b52] px-2.5 py-1 text-[11px] font-bold text-white shadow">
                        {product.distance} away
                      </span>
                    </div>

                    <div className="px-2 pb-1 pt-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#f28a2e]">{product.category}</p>
                      <h4 className="mt-1 truncate text-base font-bold text-[#173d3b]">{product.name}</h4>
                      <p className="mt-0.5 truncate text-xs text-[#7c8583]">{product.shop} · {product.shopAddress || "Mandsaur"}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xl font-bold text-[#173d3b]">₹{product.price.toLocaleString("en-IN")}</span>
                        <button
                          onClick={() => reserveProduct(product)}
                          className="rounded bg-[#113b52] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#1b4b66]"
                        >
                          Reserve
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
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
              className="fixed bottom-0 left-0 right-0 z-[90] max-h-[88vh] overflow-y-auto bg-[#fffdfa] p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl sm:bottom-5 sm:left-1/2 sm:max-w-md sm:-translate-x-1/2 sm:p-7"
            >
              <div className="mx-auto mb-6 h-1 w-12 bg-[#d8dcd7] sm:hidden" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f28a2e]">Shopping area</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#173d3b]">Where should we look?</h3>
                  <p className="mt-1 text-sm text-[#7c8583]">Choose a nearby area or set it precisely on a map.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLocationOpen(false)}
                  className="rounded-full bg-[#f0f1ed] p-2 text-[#5e6d75] hover:bg-[#e4e8e3]"
                  aria-label="Close location picker"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-6 space-y-2.5">
                <button
                  type="button"
                  disabled={locating}
                  onClick={handleUseCurrentLocation}
                  className="flex w-full items-center gap-3 border border-[#113b52] bg-[#113b52] p-4 text-left text-white transition hover:bg-[#184e6b] disabled:opacity-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center bg-white/20 text-white">
                    {locating ? <Loader2 size={19} className="animate-spin" /> : <LocateFixed size={19} />}
                  </div>
                  <div>
                    <p className="font-bold">{locating ? "Acquiring GPS..." : "Use My Current Location"}</p>
                    <p className="mt-0.5 text-xs text-white/70">Automatic GPS browser detection</p>
                  </div>
                  <ChevronRight className="ml-auto text-white/70" size={19} />
                </button>

                <button
                  onClick={() => {
                    setLocationOpen(false);
                    navigate("/CustomerLocation");
                  }}
                  className="flex w-full items-center gap-3 border border-[#d7e4e4] bg-[#edf5f2] p-4 text-left"
                >
                  <div className="flex h-10 w-10 items-center justify-center bg-[#113b52] text-white"><MapPin size={19} /></div>
                  <div>
                    <p className="font-bold text-[#173d3b]">Choose on map</p>
                    <p className="mt-0.5 text-xs text-[#7c8583]">Set precise pin or search area</p>
                  </div>
                  <ChevronRight className="ml-auto text-[#7c8583]" size={19} />
                </button>
              </div>

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
