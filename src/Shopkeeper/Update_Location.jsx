import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  LocateFixed,
  Search,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Navigation,
} from "lucide-react";

export default function UpdateLocation() {
  const navigate = useNavigate();

  const [mapCenter, setMapCenter] = useState({ lat: 24.0813, lng: 75.0707 });
  const [zoomLevel, setZoomLevel] = useState(15);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [currentAddress, setCurrentAddress] = useState("Main Market Area, Mandsaur");

  // Search location via Nominatim API
  useEffect(() => {
    const fetchLocations = async () => {
      if (!search.trim() || search.length < 3) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&countrycodes=in`
        );
        const data = await response.json();
        setSuggestions(data || []);
      } catch (err) {
        console.error("Search error:", err);
      }
    };
    const timer = setTimeout(fetchLocations, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const selectLocation = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    setMapCenter({ lat, lng: lon });
    setCurrentAddress(item.display_name);
    setSuggestions([]);
    setSearch("");
  };

  const useCurrentGpsLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLoadingGeo(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMapCenter({ lat, lng });
        setZoomLevel(17);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          if (data?.display_name) {
            setCurrentAddress(data.display_name);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingGeo(false);
        }
      },
      () => {
        alert("Unable to retrieve your GPS location. Please check browser permissions.");
        setLoadingGeo(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSaveLocation = () => {
    setSaving(true);
    setTimeout(() => {
      // Save updated spot to local storage/session storage for customers & profile view
      const activeShop = JSON.parse(localStorage.getItem("nearGoActiveShop") || "{}");
      activeShop.address = currentAddress;
      activeShop.latitude = mapCenter.lat;
      activeShop.longitude = mapCenter.lng;
      localStorage.setItem("nearGoActiveShop", JSON.stringify(activeShop));

      setSaving(false);
      setSuccessMsg("Spot updated successfully! Customers can now see your updated approximate area.");
      setTimeout(() => {
        navigate("/ShopkeeperDashboard");
      }, 2000);
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-[#f5f6f2] pb-12 text-[#173d3b]">
      <header className="border-b border-[#dfe4dd] bg-[#fffdfa] px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/ShopkeeperDashboard")}
            className="flex items-center gap-2 text-sm font-bold text-[#113b52]"
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
          <h1 className="text-base font-bold text-[#113b52]">Update Operating Spot</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-7 sm:px-6">
        {successMsg && (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700 shadow-sm">
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-[#e3e1d9] bg-[#fffdfa] shadow-sm p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-[#f28a2e]">
              <Navigation size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#113b52]">"I am here now" Location Update</h2>
              <p className="text-xs text-gray-500 mt-0.5">Pinpoint your exact operating spot so customers nearby can find you.</p>
            </div>
          </div>

          {/* Privacy Notice Card */}
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <span className="font-bold">Privacy & Safety:</span> Exact live location is public only as an approximate area until you accept a visitor request.
            </div>
          </div>

          {/* Search & GPS Action Bar */}
          <div className="space-y-4 mb-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search landmark or area..."
                  className="h-12 w-full rounded-2xl border border-gray-200 bg-[#f8fafb] pl-12 pr-4 text-sm outline-none focus:border-[#f28a2e]"
                />
              </div>
              <button
                type="button"
                onClick={useCurrentGpsLocation}
                disabled={loadingGeo}
                className="flex items-center gap-2 h-12 px-5 rounded-2xl bg-orange-50 border border-orange-200 text-xs font-bold text-[#f28a2e] hover:bg-orange-100 transition shrink-0"
              >
                {loadingGeo ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
                Use GPS
              </button>
            </div>

            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto divide-y">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectLocation(item)}
                    className="w-full text-left px-4 py-3 text-xs text-gray-700 hover:bg-orange-50 truncate"
                  >
                    {item.display_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* LIVE MAP CARD */}
          <div className="mb-6 overflow-hidden rounded-3xl border border-gray-200 shadow-inner relative h-72 sm:h-80 w-full bg-slate-100">
            <iframe
              title="Interactive Shop Map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://maps.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&z=${zoomLevel}&output=embed`}
            />
            <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-md border border-gray-100 flex items-center gap-2">
              <MapPin size={18} className="text-[#f28a2e] shrink-0" />
              <p className="text-xs font-bold text-[#113b52] truncate">Selected Spot: {currentAddress}</p>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleSaveLocation}
            disabled={saving}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#FF7A18] to-[#f28a2e] text-base font-bold text-white shadow-lg transition hover:shadow-xl"
          >
            {saving ? <Loader2 size={20} className="animate-spin" /> : <>Confirm & Update Location <CheckCircle2 size={18} /></>}
          </button>
        </div>
      </div>
    </main>
  );
}