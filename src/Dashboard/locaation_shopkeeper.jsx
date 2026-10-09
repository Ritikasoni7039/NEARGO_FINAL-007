import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  LocateFixed,
  MapPin,
  Search,
  Store,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const ShopkeeperLocation = () => {
  const navigate = useNavigate();

  const [shopData, setShopData] = useState(null);

  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  const [locationSelected, setLocationSelected] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");

  const locations = [
    {
      city: "Mandsaur",
      state: "Madhya Pradesh",
      pincode: "458001",
    },
    {
      city: "Indore",
      state: "Madhya Pradesh",
      pincode: "452001",
    },
    {
      city: "Ujjain",
      state: "Madhya Pradesh",
      pincode: "456001",
    },
    {
      city: "Neemuch",
      state: "Madhya Pradesh",
      pincode: "458441",
    },
  ];

  /* ==========================================
     LOAD SHOPKEEPER REGISTRATION DATA
  ========================================== */

  useEffect(() => {
    const savedData = sessionStorage.getItem(
      "nearGoShopkeeperData"
    );

    if (!savedData) return;

    try {
      const parsed = JSON.parse(savedData);

      setShopData(parsed);

      setAddress(parsed.address || "");
      setLandmark(parsed.landmark || "");
      setCity(parsed.city || "");
      setPincode(parsed.pincode || "");

      if (parsed.address && parsed.city) {
        setLocationSelected(true);
      }
    } catch (error) {
      console.error(
        "Unable to read shopkeeper data:",
        error
      );
    }
  }, []);

  /* ==========================================
     SEARCH LOCATION
  ========================================== */

  const filteredLocations = locations.filter((location) =>
    `${location.city} ${location.state}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const selectLocation = (location) => {
    setCity(location.city);
    setPincode(location.pincode);

    setLocationSelected(true);
    setSearch("");
    setSearchOpen(false);
  };

  /* ==========================================
     CURRENT LOCATION
  ========================================== */

  const useCurrentLocation = () => {
    /*
      Demo behaviour.

      Later replace this with:
      navigator.geolocation.getCurrentPosition(...)
      + reverse geocoding API.
    */

    setLocationSelected(true);

    if (!city) {
      setCity("Your Current City");
    }

    setAddress(
      address || "Current location selected"
    );
  };

  /* ==========================================
     SAVE LOCATION
  ========================================== */

  const handleContinue = () => {
    if (!address.trim()) {
      alert("Please enter your shop address.");
      return;
    }

    if (!city.trim()) {
      alert("Please select your city.");
      return;
    }

    if (!pincode.trim()) {
      alert("Please enter your pincode.");
      return;
    }

    const updatedData = {
      ...(shopData || {}),
      address: address.trim(),
      landmark: landmark.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
      locationConfirmed: true,
    };

    sessionStorage.setItem(
      "nearGoShopkeeperData",
      JSON.stringify(updatedData)
    );

    /*
      Change this route if your next step
      has a different name.
    */

    navigate("/Shopkeeperdashboard");
  };

  return (
    <div className="min-h-screen bg-[#F5F8FA] text-[#123B63]">

      <div className="mx-auto min-h-screen w-full max-w-md overflow-hidden bg-white shadow-2xl">

        {/* ==========================================
            TOP LOCATION VISUAL
        ========================================== */}

        <section className="relative overflow-hidden bg-[#123B63] px-5 pb-28 pt-7 text-white">

          {/* Decorative circles */}

          <motion.div
            animate={{
              scale: [1, 1.08, 1],
              opacity: [0.3, 0.45, 0.3],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#16B8B5]/10"
          />

          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-[#FF7A18]/10"
          />

          {/* Header */}

          <div className="relative z-10 flex items-center justify-between">

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/45">
                Shopkeeper setup
              </p>

              <h1 className="mt-1 text-2xl font-black">
                NEAR<span className="text-[#16B8B5]">-</span>GO
              </h1>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
              <Store size={20} />
            </div>

          </div>

          {/* Heading */}

          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="relative z-10 mt-8"
          >

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#16B8B5]/15">
              <MapPin
                size={27}
                className="text-[#32C9C5]"
              />
            </div>

            <h2 className="mt-5 text-[29px] font-black leading-[1.08]">
              Where is your
              <br />
              <span className="text-[#32C9C5]">
                shop located?
              </span>
            </h2>

            <p className="mt-3 max-w-[320px] text-xs leading-5 text-white/55">
              Add your shop location so nearby customers can
              discover your products and compare your prices.
            </p>

          </motion.div>

        </section>

        {/* ==========================================
            MAIN FORM
        ========================================== */}

        <main className="relative z-20 -mt-14 px-4 pb-10">

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.1,
            }}
            className="rounded-[28px] bg-white p-4 shadow-[0_15px_45px_rgba(18,59,99,0.13)]"
          >

            {/* =====================================
                LOCATION SEARCH
            ====================================== */}

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex w-full items-center gap-3 rounded-2xl border border-[#D7E1E9] bg-[#F8FAFB] p-4 text-left transition active:scale-[0.99]"
            >

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#123B63]/5">
                <Search
                  size={19}
                  className="text-[#496B87]"
                />
              </div>

              <div className="min-w-0 flex-1">

                <p className="text-[9px] font-bold uppercase tracking-wide text-[#9AA9B7]">
                  Shop city
                </p>

                <p
                  className={`mt-1 truncate text-sm font-bold ${
                    city
                      ? "text-[#123B63]"
                      : "text-[#8CA0B3]"
                  }`}
                >
                  {city || "Search your city"}
                </p>

              </div>

              <ArrowRight
                size={18}
                className="text-[#9AA9B7]"
              />

            </button>

            {/* =====================================
                CURRENT LOCATION
            ====================================== */}

            <button
              type="button"
              onClick={useCurrentLocation}
              className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-[#16B8B5]/20 bg-[#16B8B5]/5 p-4 text-left transition active:scale-[0.99]"
            >

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#16B8B5]/15">
                <LocateFixed
                  size={19}
                  className="text-[#16AAA8]"
                />
              </div>

              <div className="flex-1">

                <p className="text-sm font-bold text-[#123B63]">
                  Use current location
                </p>

                <p className="mt-0.5 text-[10px] text-[#71859B]">
                  Automatically detect your shop area
                </p>

              </div>

            </button>

            {/* =====================================
                ADDRESS
            ====================================== */}

            <div className="mt-5">

              <label className="mb-2 block text-[11px] font-bold text-[#496B87]">
                Shop address
              </label>

              <textarea
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  setLocationSelected(false);
                }}
                rows={3}
                placeholder="Enter complete shop address"
                className="w-full resize-none rounded-2xl border border-[#D7E1E9] bg-[#F8FAFB] px-4 py-3 text-sm font-medium text-[#123B63] outline-none transition placeholder:text-[#9AA9B7] focus:border-[#16B8B5] focus:ring-4 focus:ring-[#16B8B5]/10"
              />

            </div>

            {/* =====================================
                LANDMARK
            ====================================== */}

            <div className="mt-4">

              <label className="mb-2 block text-[11px] font-bold text-[#496B87]">
                Landmark
                <span className="ml-1 font-normal text-[#9AA9B7]">
                  (optional)
                </span>
              </label>

              <input
                value={landmark}
                onChange={(e) =>
                  setLandmark(e.target.value)
                }
                placeholder="Near bus stand, school, market..."
                className="h-12 w-full rounded-2xl border border-[#D7E1E9] bg-[#F8FAFB] px-4 text-sm font-medium text-[#123B63] outline-none transition placeholder:text-[#9AA9B7] focus:border-[#16B8B5] focus:ring-4 focus:ring-[#16B8B5]/10"
              />

            </div>

            {/* =====================================
                CITY + PINCODE
            ====================================== */}

            <div className="mt-4 grid grid-cols-2 gap-3">

              <div>

                <label className="mb-2 block text-[11px] font-bold text-[#496B87]">
                  City
                </label>

                <input
                  value={city}
                  onChange={(e) =>
                    setCity(e.target.value)
                  }
                  placeholder="City"
                  className="h-12 w-full rounded-2xl border border-[#D7E1E9] bg-[#F8FAFB] px-3 text-sm font-medium text-[#123B63] outline-none transition placeholder:text-[#9AA9B7] focus:border-[#16B8B5] focus:ring-4 focus:ring-[#16B8B5]/10"
                />

              </div>

              <div>

                <label className="mb-2 block text-[11px] font-bold text-[#496B87]">
                  Pincode
                </label>

                <input
                  value={pincode}
                  onChange={(e) =>
                    setPincode(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    )
                  }
                  inputMode="numeric"
                  placeholder="458001"
                  className="h-12 w-full rounded-2xl border border-[#D7E1E9] bg-[#F8FAFB] px-3 text-sm font-medium text-[#123B63] outline-none transition placeholder:text-[#9AA9B7] focus:border-[#16B8B5] focus:ring-4 focus:ring-[#16B8B5]/10"
                />

              </div>

            </div>

            {/* =====================================
                CONFIRMATION
            ====================================== */}

            {locationSelected && (
              <motion.div
                initial={{
                  opacity: 0,
                  height: 0,
                }}
                animate={{
                  opacity: 1,
                  height: "auto",
                }}
                className="mt-4 overflow-hidden"
              >

                <div className="flex items-center gap-3 rounded-2xl border border-[#16B8B5]/20 bg-[#16B8B5]/5 p-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#16B8B5] text-white">
                    <Check size={17} strokeWidth={3} />
                  </div>

                  <div>
                    <p className="text-xs font-extrabold text-[#123B63]">
                      Location selected
                    </p>

                    <p className="mt-0.5 text-[10px] text-[#71859B]">
                      Customers will find your shop around this area.
                    </p>
                  </div>

                </div>

              </motion.div>
            )}

            {/* =====================================
                CONTINUE
            ====================================== */}

            <motion.button
              whileTap={{
                scale: 0.98,
              }}
              type="button"
              onClick={handleContinue}
              className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-[#FF7A18] text-sm font-extrabold text-white shadow-lg shadow-orange-200 transition hover:bg-[#F56E0D]"
            >
              Confirm shop location
              <ArrowRight size={18} />
            </motion.button>

          </motion.div>

          {/* INFO */}

          <div className="mt-5 flex items-start gap-3 px-2">

            <MapPin
              size={17}
              className="mt-0.5 shrink-0 text-[#16AAA8]"
            />

            <p className="text-[10px] leading-4 text-[#8CA0B3]">
              Your location helps NEAR-GO show your shop to
              customers searching for products in your area.
            </p>

          </div>

        </main>

        {/* ==========================================
            LOCATION SELECTOR
        =========================================== */}

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              className="fixed inset-0 z-50 flex items-end justify-center bg-[#123B63]/50 backdrop-blur-sm"
            >

              <motion.div
                initial={{
                  y: "100%",
                }}
                animate={{
                  y: 0,
                }}
                exit={{
                  y: "100%",
                }}
                transition={{
                  type: "spring",
                  damping: 26,
                }}
                className="w-full max-w-md rounded-t-[30px] bg-white p-5"
              >

                {/* Handle */}

                <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-slate-200" />

                {/* Header */}

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#16AAA8]">
                      Shop location
                    </p>

                    <h3 className="mt-1 text-xl font-black text-[#123B63]">
                      Select your city
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSearchOpen(false)
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100"
                  >
                    <X size={18} />
                  </button>

                </div>

                {/* Search */}

                <div className="mt-5 flex h-12 items-center gap-3 rounded-xl border border-[#D7E1E9] bg-[#F8FAFB] px-4">

                  <Search
                    size={18}
                    className="text-[#71859B]"
                  />

                  <input
                    autoFocus
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search city..."
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9AA9B7]"
                  />

                </div>

                {/* Current location */}

                <button
                  type="button"
                  onClick={() => {
                    useCurrentLocation();
                    setSearchOpen(false);
                  }}
                  className="mt-4 flex w-full items-center gap-3 rounded-xl bg-[#16B8B5]/10 p-4 text-left"
                >

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#16B8B5] text-white">
                    <LocateFixed size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-bold">
                      Use current location
                    </p>

                    <p className="mt-0.5 text-[10px] text-[#71859B]">
                      Automatically detect your shop
                    </p>
                  </div>

                </button>

                {/* Cities */}

                <div className="mt-3 max-h-[38vh] overflow-y-auto">

                  {filteredLocations.map(
                    (location) => (
                      <button
                        key={location.city}
                        type="button"
                        onClick={() =>
                          selectLocation(location)
                        }
                        className="flex w-full items-center gap-3 border-b border-slate-100 py-4 text-left last:border-0"
                      >

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2F6F8]">
                          <MapPin
                            size={18}
                            className="text-[#496B87]"
                          />
                        </div>

                        <div className="min-w-0 flex-1">

                          <p className="text-sm font-bold">
                            {location.city}
                          </p>

                          <p className="mt-0.5 text-[10px] text-[#8CA0B3]">
                            {location.state}
                          </p>

                        </div>

                        {city === location.city && (
                          <Check
                            size={18}
                            className="text-[#16AAA8]"
                          />
                        )}

                      </button>
                    )
                  )}

                  {filteredLocations.length === 0 && (
                    <div className="py-10 text-center">

                      <MapPin
                        size={27}
                        className="mx-auto text-[#CBD5DD]"
                      />

                      <p className="mt-3 text-sm font-bold">
                        City not found
                      </p>

                      <p className="mt-1 text-[10px] text-[#8CA0B3]">
                        Try another city name.
                      </p>

                    </div>
                  )}

                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default ShopkeeperLocation;