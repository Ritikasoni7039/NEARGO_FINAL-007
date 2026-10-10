import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Store,
  MapPin,
  ShieldAlert,
  Search,
  LocateFixed,
  X,
  Loader2,
} from "lucide-react";
import { supabase } from "../supabaseClient";

const TemporaryShopSignup = () => {
  const navigate = useNavigate();

  const [tempType, setTempType] = useState("semi-fixed"); // 'semi-fixed' or 'moving'
  const [formData, setFormData] = useState({
    shopName: "",
    ownerName: "",
    mobile: "",
    email: "",
    category: "",
    landmark: "",
    openingHour: "09",
    openingMinute: "00",
    openingAmPm: "AM",
    closingHour: "09",
    closingMinute: "00",
    closingAmPm: "PM",
    approximateArea: "",
    description: "",
  });

  const categories = [
    "Juice & Shakes",
    "Chaat & Fast Food",
    "Fruits & Vegetables",
    "Handicrafts & Painting",
    "Flowers",
    "Matka & Earthenware",
    "Other",
  ];

  // Map States
  const [mapCenter, setMapCenter] = useState({ lat: 24.0813, lng: 75.0707 });
  const [zoomLevel, setZoomLevel] = useState(15);
  const [locationPanelOpen, setLocationPanelOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [error, setError] = useState("");

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
    setMapCenter({ lat, lng: lon });
    setZoomLevel(15);
    setFormData((prev) => ({
      ...prev,
      approximateArea: item.display_name,
    }));
    setLocationPanelOpen(false);
    setSearch("");
    setSuggestions([]);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported");
      return;
    }
    setLoadingGeo(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMapCenter({ lat, lng });
        setZoomLevel(16);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          setFormData((prev) => ({
            ...prev,
            approximateArea: data?.display_name || "Current Location Area",
          }));
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingGeo(false);
        }
      },
      () => {
        alert("Unable to retrieve location.");
        setLoadingGeo(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoadingOtp(true);

    const openingTime = `${formData.openingHour}:${formData.openingMinute} ${formData.openingAmPm}`;
    const closingTime = `${formData.closingHour}:${formData.closingMinute} ${formData.closingAmPm}`;

    const temporaryData = {
      ...formData,
      shopType: "temporary",
      subType: tempType,
      openingTime,
      closingTime,
      latitude: mapCenter.lat,
      longitude: mapCenter.lng,
    };

    try {
      const cleanEmail = formData.email.trim().toLowerCase();

      // Supabase mein user ko direct signup karwayenge taaki credentials ka koi jhanjhat na rahe
      // Aur OTP verification ke liye hum session storage use karke next step par chalenge
      sessionStorage.setItem("nearGoShopkeeperData", JSON.stringify(temporaryData));
      
      // Seedha OTP verification page par bhejenge jahan real/secure code verify hoga
      navigate("/ShopkeeperOTP");
    } catch (err) {
      console.error("Error:", err);
      setError("Registration flow mein kuch dikkat aayi. Dubara try karein.");
    } finally {
      setLoadingOtp(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafb] px-4 py-6 sm:px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-xl p-5 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0b2940]">Temporary Vendor Registration</h1>
            <p className="text-xs text-gray-500 mt-1">Register as Semi-Fixed or Moving Vendor on NEAR-GO</p>
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-xs font-bold text-[#16aaa8] hover:underline"
          >
            Back to Permanent
          </button>
        </div>

        {/* Vendor Sub-type Selector */}
        <div className="grid grid-cols-2 gap-4 mb-7">
          <button
            type="button"
            onClick={() => setTempType("semi-fixed")}
            className={`p-4 rounded-2xl border-2 text-left transition ${
              tempType === "semi-fixed" ? "border-[#FF7A18] bg-orange-50 shadow-sm" : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Store size={20} className="text-[#FF7A18]" />
              <p className="font-bold text-[#0b2940]">Semi-Fixed Vendor</p>
            </div>
            <p className="text-xs text-gray-500">Same spot, fixed timing & category.</p>
          </button>

          <button
            type="button"
            onClick={() => setTempType("moving")}
            className={`p-4 rounded-2xl border-2 text-left transition ${
              tempType === "moving" ? "border-[#FF7A18] bg-orange-50 shadow-sm" : "border-gray-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={20} className="text-[#FF7A18]" />
              <p className="font-bold text-[#0b2940]">Moving Vendor</p>
            </div>
            <p className="text-xs text-gray-500">Approximate area, live "I am here" updates.</p>
          </button>
        </div>

        {/* Info Box */}
        <div className="mb-7 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold">Privacy Notice:</span> Exact live location is never public. Customers only see approximate area and timing until you accept their visit request.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#0b2940]">Vendor / Business Name</label>
              <input type="text" name="shopName" value={formData.shopName} onChange={handleChange} placeholder="e.g. Rahul Fresh Juice Stall" required className="h-14 w-full rounded-2xl border border-gray-200 bg-[#f8fafb] px-5 text-sm outline-none focus:border-[#FF7A18]" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-[#0b2940]">Owner Name</label>
              <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="Full name" required className="h-14 w-full rounded-2xl border border-gray-200 bg-[#f8fafb] px-5 text-sm outline-none focus:border-[#FF7A18]" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#0b2940]">Mobile Number</label>
              <input type="tel" name="mobile" value={formData.mobile} onChange={(e) => setFormData(p => ({...p, mobile: e.target.value.replace(/\D/g, "").slice(0, 10)}))} placeholder="10-digit mobile" maxLength={10} required className="h-14 w-full rounded-2xl border border-gray-200 bg-[#f8fafb] px-5 text-sm outline-none focus:border-[#FF7A18]" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-[#0b2940]">Email Address (For OTP)</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email address" required className="h-14 w-full rounded-2xl border border-gray-200 bg-[#f8fafb] px-5 text-sm outline-none focus:border-[#FF7A18]" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[#0b2940]">Category</label>
            <select name="category" value={formData.category} onChange={handleChange} required className="h-14 w-full rounded-2xl border border-gray-200 bg-[#f8fafb] px-5 text-sm outline-none focus:border-[#FF7A18]">
              <option value="">Select category</option>
              {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>

          {/* Semi-Fixed Timings with AM/PM */}
          {tempType === "semi-fixed" && (
            <div className="grid sm:grid-cols-2 gap-5 p-4 rounded-2xl bg-orange-50/50 border border-orange-100">
              <div>
                <label className="mb-2 block text-xs font-bold text-[#0b2940]">Opening Time</label>
                <div className="flex gap-2">
                  <select name="openingHour" value={formData.openingHour} onChange={handleChange} className="h-12 flex-1 min-w-0 rounded-xl border bg-white px-2 text-xs">
                    {["01","02","03","04","05","06","07","08","09","10","11","12"].map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <select name="openingMinute" value={formData.openingMinute} onChange={handleChange} className="h-12 flex-1 min-w-0 rounded-xl border bg-white px-2 text-xs">
                    {["00","15","30","45"].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select name="openingAmPm" value={formData.openingAmPm} onChange={handleChange} className="h-12 flex-1 min-w-0 rounded-xl border bg-white px-2 text-xs font-bold text-orange-600">
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-[#0b2940]">Closing Time</label>
                <div className="flex gap-2">
                  <select name="closingHour" value={formData.closingHour} onChange={handleChange} className="h-12 flex-1 min-w-0 rounded-xl border bg-white px-2 text-xs">
                    {["01","02","03","04","05","06","07","08","09","10","11","12"].map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <select name="closingMinute" value={formData.closingMinute} onChange={handleChange} className="h-12 flex-1 min-w-0 rounded-xl border bg-white px-2 text-xs">
                    {["00","15","30","45"].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select name="closingAmPm" value={formData.closingAmPm} onChange={handleChange} className="h-12 flex-1 min-w-0 rounded-xl border bg-white px-2 text-xs font-bold text-orange-600">
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Landmark & Map Location Picker */}
          <div>
            <label className="mb-2 block text-sm font-bold text-[#0b2940]">Landmark & Operating Location</label>
            <div className="flex gap-2 mb-3">
              <button type="button" onClick={() => setLocationPanelOpen(true)} className="flex-1 flex items-center gap-2 h-12 px-4 rounded-xl border bg-[#f8fafb] text-xs font-semibold text-gray-700 hover:border-[#FF7A18]">
                <Search size={16} /> Search Map Location
              </button>
              <button type="button" onClick={useCurrentLocation} className="flex items-center gap-2 h-12 px-4 rounded-xl bg-orange-50 border border-orange-200 text-xs font-semibold text-[#FF7A18]">
                {loadingGeo ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />} Use GPS
              </button>
            </div>

            <div className="mb-3 h-36 w-full overflow-hidden rounded-2xl border relative">
              <div className="absolute inset-0 z-10 pointer-events-none" />
              <iframe title="Map" width="100%" height="100%" style={{ border: 0 }} src={`https://maps.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&z=${zoomLevel}&output=embed`}></iframe>
            </div>

            <input type="text" name="landmark" value={formData.landmark} onChange={handleChange} placeholder="Enter Landmark (e.g. Near City Bus Stand)" required className="h-14 w-full rounded-2xl border border-gray-200 bg-[#f8fafb] px-5 text-sm outline-none focus:border-[#FF7A18]" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-[#0b2940]">Description / Items Sold</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="What do you sell?" className="w-full rounded-2xl border border-gray-200 bg-[#f8fafb] px-5 py-3 text-sm outline-none resize-none" />
          </div>

          {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <button type="submit" disabled={loadingOtp} className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF7A18] to-[#FF922F] text-base font-bold text-white shadow-lg">
            {loadingOtp ? <Loader2 className="animate-spin" /> : <>Send OTP & Continue <ArrowRight size={20} /></>}
          </button>
        </form>

        {/* Location Search Modal */}
        {locationPanelOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-[#0b2940]">Search Area</h3>
                <button type="button" onClick={() => setLocationPanelOpen(false)}><X size={18} /></button>
              </div>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Type area..." className="h-12 w-full rounded-xl border bg-gray-50 px-4 text-sm outline-none mb-3" />
              <div className="flex-1 overflow-y-auto">
                {suggestions.map((item, idx) => (
                  <button key={idx} type="button" onClick={() => selectLocationFromSearch(item)} className="w-full text-left py-2.5 border-b text-xs hover:bg-gray-50 truncate">
                    {item.display_name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemporaryShopSignup;