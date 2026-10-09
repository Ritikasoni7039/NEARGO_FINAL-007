import React, { useMemo, useState, useEffect } from "react";
import {
  ArrowRight,
  Check,
  LocateFixed,
  MapPin,
  Search,
  Store,
  X,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import logo from "../assets/nearg0_standalone_logo.png";

// Leaflet marker fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 15, { animate: true });
    }
  }, [center, map]);
  return null;
}

const Location = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationPanelOpen, setLocationPanelOpen] = useState(false);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [mapCenter, setMapCenter] = useState([24.0813, 75.0707]);
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);

  const popularLocations = [
    { id: 1, city: "Mandsaur", area: "Mandsaur, Madhya Pradesh", lat: 24.0813, lng: 75.0707 },
    { id: 2, city: "Indore", area: "Indore, Madhya Pradesh", lat: 22.7196, lng: 75.8577 },
    { id: 3, city: "Ujjain", area: "Ujjain, Madhya Pradesh", lat: 23.1793, lng: 75.7849 },
    { id: 4, city: "Neemuch", area: "Neemuch, Madhya Pradesh", lat: 24.4708, lng: 74.8730 },
  ];

  // Search suggestions handler
  useEffect(() => {
    const fetchLocations = async () => {
      if (!search.trim() || search.length < 3) {
        setSuggestions([]);
        return;
      }

      setSearching(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&countrycodes=in`
        );
        const data = await response.json();
        setSuggestions(data || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    };

    const timer = setTimeout(fetchLocations, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const selectLocationFromSearch = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const newLoc = {
      id: item.place_id || Date.now(),
      city: item.name || item.display_name.split(",")[0],
      area: item.display_name,
      lat: lat,
      lng: lon,
    };

    setSelectedLocation(newLoc);
    setMapCenter([lat, lon]);
    setLocationPanelOpen(false);
    setSearch("");
    setSuggestions([]);
  };

  const selectPopularLocation = (location) => {
    setSelectedLocation(location);
    if (location.lat && location.lng) {
      setMapCenter([location.lat, location.lng]);
    }
    setLocationPanelOpen(false);
    setSearch("");
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLoadingGeo(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMapCenter([lat, lng]);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          const addressName = data?.display_name || "Current Location Area";
          const cityName = data?.address?.city || data?.address?.town || data?.address?.village || "My Location";

          setSelectedLocation({
            id: "current",
            city: cityName,
            area: addressName,
            lat: lat,
            lng: lng,
          });
        } catch (err) {
          setSelectedLocation({
            id: "current",
            city: "Current Location",
            area: `Lat: ${lat.toFixed(2)}, Lng: ${lng.toFixed(2)}`,
            lat: lat,
            lng: lng,
          });
        } finally {
          setLoadingGeo(false);
          setLocationPanelOpen(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Unable to retrieve your location. Please check browser permissions.");
        setLoadingGeo(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const continueToDashboard = () => {
    if (!selectedLocation) return;
    sessionStorage.setItem("nearGoCustomerLocation", JSON.stringify(selectedLocation));
    navigate("/Customerdashboard");
  };

  return (
    <div className="min-h-screen bg-[#F6FAFC] text-[#123B63]">
      <div className="mx-auto min-h-screen w-full max-w-md overflow-hidden bg-white shadow-2xl shadow-slate-300/30">

        {/* TOP AREA */}
        <section className="relative overflow-hidden bg-[#123B63] px-5 pb-24 pt-8">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#16B8B5]/10" />
          <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-[#FF7A18]/10" />

          <div className="relative z-10 flex items-center justify-center">
            <div className="rounded-2xl bg-white/95 px-5 py-3 shadow-lg">
              <img src={logo} alt="NEAR-GO" className="h-9 w-auto object-contain" />
            </div>
          </div>

          <div className="relative z-10 mt-9 text-center text-white">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#16B8B5]/20 ring-1 ring-white/10">
              <MapPin size={30} strokeWidth={2} className="text-[#32C9C5]" />
            </div>
            <h1 className="text-[28px] font-extrabold leading-tight tracking-tight">
              Where do you shop?
            </h1>
            <p className="mx-auto mt-3 max-w-[310px] text-sm leading-6 text-white/75">
              Set your area to find nearby products, local shops and the best prices around you.
            </p>
          </div>
        </section>

        {/* MAIN CONTENT */}
        <section className="-mt-12 relative z-20 px-4 pb-8">
          <div className="rounded-[28px] bg-white p-4 shadow-[0_15px_45px_rgba(18,59,99,0.13)]">

            {/* Search Location trigger */}
            <button
              type="button"
              onClick={() => setLocationPanelOpen(true)}
              className="flex w-full items-center gap-3 rounded-2xl border border-[#D7E1E9] bg-[#F8FAFB] px-4 py-4 text-left transition active:scale-[0.99]"
            >
              <Search size={20} className="shrink-0 text-[#496B87]" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#8CA0B3]">Your shopping area</p>
                <p className={`mt-1 truncate text-sm font-bold ${selectedLocation ? "text-[#123B63]" : "text-[#8CA0B3]"}`}>
                  {selectedLocation ? selectedLocation.area : "Search city or area"}
                </p>
              </div>
              <ArrowRight size={19} className="shrink-0 text-[#8CA0B3]" />
            </button>

            {/* Current location button */}
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={loadingGeo}
              className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-[#16B8B5]/20 bg-[#16B8B5]/5 px-4 py-4 text-left transition hover:bg-[#16B8B5]/10 active:scale-[0.99] disabled:opacity-60"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#16B8B5]/15 text-[#16AAA8]">
                {loadingGeo ? <Loader2 size={18} className="animate-spin" /> : <LocateFixed size={20} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#123B63]">
                  {loadingGeo ? "Detecting location..." : "Use my current location"}
                </p>
                <p className="mt-0.5 text-xs text-[#71859B]">Find shops and products around me</p>
              </div>
            </button>
          </div>

          {/* MAP PREVIEW */}
          <div className="mt-5 overflow-hidden rounded-2xl border border-[#D7E1E9] shadow-md">
            <div className="h-44 w-full">
              <MapContainer center={mapCenter} zoom={15} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap'
                />
                <Marker position={mapCenter} />
                <MapRecenter center={mapCenter} />
              </MapContainer>
            </div>
          </div>

          {/* FEATURE CARDS */}
          <div className="mt-7">
            <p className="px-1 text-sm font-extrabold text-[#123B63]">What you'll find on NEAR-GO</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <FeatureCard icon={<Store size={19} />} title="Nearby Shops" description="Find local sellers" />
              <FeatureCard icon={<Search size={19} />} title="Product Availability" description="Know who has it" />
              <FeatureCard icon={<ArrowRight size={19} />} title="Price Comparison" description="Compare local prices" />
              <FeatureCard icon={<MapPin size={19} />} title="Shop Distance" description="See what's closer" />
            </div>
          </div>

          {/* POPULAR LOCATIONS */}
          <div className="mt-7">
            <div className="flex items-center justify-between">
              <p className="px-1 text-sm font-extrabold text-[#123B63]">Popular areas</p>
              <span className="text-xs font-semibold text-[#8CA0B3]">Select one</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {popularLocations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => selectPopularLocation(loc)}
                  className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                    selectedLocation?.id === loc.id
                      ? "border-[#16B8B5] bg-[#16B8B5]/10 text-[#129A97]"
                      : "border-[#D7E1E9] bg-white text-[#496B87] hover:border-[#16B8B5]"
                  }`}
                >
                  {loc.city}
                </button>
              ))}
            </div>
          </div>

          {/* SELECTED LOCATION CONFIRMATION */}
          {selectedLocation && (
            <div className="mt-6 rounded-2xl border border-[#16B8B5]/20 bg-[#16B8B5]/5 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#16B8B5] text-white">
                  <Check size={20} strokeWidth={3} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#129A97]">Shopping location selected</p>
                  <p className="mt-1 font-bold text-[#123B63]">{selectedLocation.city}</p>
                  <p className="mt-0.5 text-xs text-[#71859B] truncate">{selectedLocation.area}</p>
                </div>
              </div>
            </div>
          )}

          {/* CONTINUE BUTTON */}
          <button
            type="button"
            disabled={!selectedLocation}
            onClick={continueToDashboard}
            className={`mt-7 flex h-14 w-full items-center justify-center gap-2 rounded-full text-sm font-extrabold text-white shadow-lg transition ${
              selectedLocation
                ? "bg-[#FF7A18] shadow-orange-200 hover:bg-[#f56e0d] active:scale-[0.98]"
                : "cursor-not-allowed bg-[#CBD5DD] shadow-none"
            }`}
          >
            Continue to NEAR-GO
            <ArrowRight size={19} />
          </button>
        </section>

        {/* SEARCH MODAL PANEL */}
        {locationPanelOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#123B63]/45 backdrop-blur-[2px]">
            <div className="w-full max-w-md rounded-t-[30px] bg-white p-5 shadow-2xl max-h-[85vh] flex flex-col">
              
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-[#123B63]">Select your area</h2>
                  <p className="mt-1 text-xs text-[#8CA0B3]">Type your area name to find exact location.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLocationPanelOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F6F8] text-[#496B87]"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="mt-5 flex h-12 items-center gap-3 rounded-xl border border-[#D7E1E9] bg-[#F8FAFB] px-4 shrink-0">
                <Search size={19} className="text-[#71859B]" />
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search city, area or landmark..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#123B63] outline-none placeholder:text-[#8CA0B3]"
                />
                {searching && <Loader2 size={18} className="animate-spin text-gray-400" />}
                {search && !searching && (
                  <button type="button" onClick={() => setSearch("")}>
                    <X size={17} className="text-[#8CA0B3]" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={useCurrentLocation}
                className="mt-3 flex w-full items-center gap-3 rounded-xl bg-[#16B8B5]/10 p-3.5 text-left shrink-0"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#16B8B5] text-white">
                  <LocateFixed size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#123B63]">Use current location</p>
                  <p className="text-[11px] text-[#71859B]">Detect via GPS</p>
                </div>
              </button>

              <div className="mt-3 flex-1 overflow-y-auto">
                {suggestions.length > 0 ? (
                  suggestions.map((item, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectLocationFromSearch(item)}
                      className="flex w-full items-center gap-3 border-b border-slate-100 py-3 text-left last:border-0 hover:bg-slate-50 px-2 rounded-lg"
                    >
                      <MapPin size={17} className="shrink-0 text-[#16B8B5]" />
                      <p className="text-xs font-semibold text-[#123B63] truncate">{item.display_name}</p>
                    </button>
                  ))
                ) : search.length >= 3 ? (
                  <div className="py-8 text-center text-xs text-gray-400">No matching locations found</div>
                ) : (
                  <div className="py-4 text-center text-xs text-gray-400">Type at least 3 letters to search...</div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="rounded-2xl border border-[#E4EBF0] bg-white p-4 shadow-sm">
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#123B63]/5 text-[#123B63]">{icon}</div>
    <p className="mt-3 text-sm font-bold text-[#123B63]">{title}</p>
    <p className="mt-1 text-[11px] leading-4 text-[#8CA0B3]">{description}</p>
  </div>
);

export default Location;