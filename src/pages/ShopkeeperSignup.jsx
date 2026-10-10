import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User,
  Phone,
  CheckCircle2,
  Mail,
  ArrowRight,
  MapPin,
  Store,
  Map,
  Navigation,
  Clock3,
  Search,
  LocateFixed,
  Camera,
  Upload,
  Plus,
  Minus,
  X,
  Loader2,
} from "lucide-react";
import { supabase } from "../supabaseClient";

const ShopkeeperSignup = () => {
  const navigate = useNavigate();

  const categories = [
    "Grocery Store",
    "Clothing & Fashion",
    "Electronics",
    "Mobile & Accessories",
    "Pharmacy",
    "Restaurant",
    "Cafe & Bakery",
    "Footwear",
    "Beauty & Cosmetics",
    "Hardware & Tools",
    "Furniture",
    "Stationery & Books",
    "Sports & Fitness",
    "Jewellery",
    "Automobile",
    "Other",
  ];

  const [shopType, setShopType] = useState("permanent");
  const [formData, setFormData] = useState({
    shopName: "",
    ownerName: "",
    mobile: "",
    email: "",
    category: "",
    address: "",
    landmark: "",
    city: "",
    pincode: "",
    openingTime: "",
    closingTime: "",
    description: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Map & Location States
  const [mapCenter, setMapCenter] = useState({ lat: 24.0813, lng: 75.0707 });
  const [zoomLevel, setZoomLevel] = useState(15);
  const [locationPanelOpen, setLocationPanelOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loadingGeo, setLoadingGeo] = useState(false);

  // Shop Picture & Camera Modal States
  const [imagePreview, setImagePreview] = useState(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);

  const startCamera = async () => {
    setCameraModalOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Camera permission denied.");
      setCameraModalOpen(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          setImagePreview(URL.createObjectURL(blob));
        }
      }, "image/jpeg");

      stopCamera();
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setCameraModalOpen(false);
  };

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

  const selectLocationFromSearch = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    setMapCenter({ lat, lng: lon });
    setZoomLevel(15);
    setFormData((prev) => ({
      ...prev,
      address: item.display_name,
      city: item.address?.city || item.address?.town || prev.city,
      pincode: item.address?.postcode || prev.pincode,
    }));
    setLocationPanelOpen(false);
    setSearch("");
    setSuggestions([]);
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
        setMapCenter({ lat, lng });
        setZoomLevel(16);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await res.json();
          setFormData((prev) => ({
            ...prev,
            address: data?.display_name || "Current Location",
            city: data?.address?.city || data?.address?.town || prev.city,
            pincode: data?.address?.postcode || prev.pincode,
          }));
        } catch (err) {
          console.error("Reverse geocoding error:", err);
        } finally {
          setLoadingGeo(false);
          setLocationPanelOpen(false);
        }
      },
      () => {
        alert("Unable to retrieve location.");
        setLoadingGeo(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.shopName.trim()) newErrors.shopName = "Shop name is required.";
    if (!formData.ownerName.trim()) newErrors.ownerName = "Owner name is required.";
    
    // 10-digit Indian mobile number starting with 6-9
    const cleanMobile = formData.mobile ? formData.mobile.trim() : "";
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      newErrors.mobile = "Enter a valid 10-digit mobile number.";
    }
    
    // Email validation
    const cleanEmail = formData.email ? formData.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!formData.category) newErrors.category = "Please select a category.";
    if (!formData.address.trim()) newErrors.address = "Address is required.";
    if (!formData.landmark.trim()) newErrors.landmark = "Landmark is required.";
    if (!formData.city.trim()) newErrors.city = "City is required.";
    if (!formData.openingTime) newErrors.openingTime = "Opening time required.";
    if (!formData.closingTime) newErrors.closingTime = "Closing time required.";
    
    const cleanPin = formData.pincode ? formData.pincode.trim() : "";
    if (cleanPin.length !== 6 || isNaN(cleanPin)) {
      newErrors.pincode = "Enter a valid 6-digit pincode.";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = formData.email.trim().toLowerCase();
      const cleanMobile = formData.mobile.trim();

      // Send OTP to email via Supabase Auth
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      });

      if (otpError) {
        console.warn("OTP send warning:", otpError.message);
        sessionStorage.setItem("nearGoOtpWarning", otpError.message);
      } else {
        sessionStorage.removeItem("nearGoOtpWarning");
      }

      const shopkeeperData = {
        ...formData,
        mobile: cleanMobile,
        email: cleanEmail,
        shopType: "permanent",
        latitude: mapCenter.lat,
        longitude: mapCenter.lng,
        shopImage: imagePreview || null,
      };

      sessionStorage.setItem("nearGoShopkeeperData", JSON.stringify(shopkeeperData));
      sessionStorage.setItem("nearGoShopkeeperOtpSent", "true");
      navigate("/ShopkeeperOTP");
    } catch (err) {
      console.error("Signup error:", err);
      setErrors({ email: err.message || "Failed to process registration." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafb] overflow-x-hidden pb-10">
      <header className="w-full bg-white border-b border-gray-100">
        <div className="flex items-center justify-between px-4 sm:px-7 py-3">
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0b2940]">
              NEAR<span className="text-[#FF922F]">-GO</span>
            </h1>
            <p className="text-[9px] sm:text-[10px] tracking-[1.5px] text-gray-500 font-medium">
              LOCAL SHOPS • REAL PEOPLE
            </p>
          </div>
          <Link to="/ShopkeeperLogin" className="text-xs font-bold text-[#FF922F] hover:underline">
            Already registered? Login
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="flex items-center gap-2 w-full mb-7">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffae00] text-white shadow-md">
            <CheckCircle2 size={22} />
          </div>
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200">
            <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-[#ffae00] to-[#ffca28]" />
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-zinc-200 bg-white text-sm font-bold text-gray-400">2</div>
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200" />
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-zinc-200 bg-white text-sm font-bold text-gray-400">3</div>
        </div>

        <div className="mb-7">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0b2940]">Register Permanent Shop</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Provide your shop details to get started on NEAR-GO.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-[0_10px_40px_rgba(11,41,64,0.07)] p-5 sm:p-8">
          
          <div className="mb-7">
            <label className="mb-3 block text-sm font-bold text-[#183b50]">What type of shop are you registering?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className="p-4 rounded-2xl border-2 text-left border-[#ffae00] bg-orange-50 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[#ffae00] text-white">
                    <Store size={21} />
                  </div>
                  <div>
                    <p className="font-bold text-[#183b50]">Permanent</p>
                    <p className="text-[11px] text-gray-500">Regular shop</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate("/TemporaryShopSignup")}
                className="p-4 rounded-2xl border-2 text-left border-gray-200 bg-white hover:border-orange-200"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-gray-100 text-gray-500">
                    <Clock3 size={21} />
                  </div>
                  <div>
                    <p className="font-bold text-[#183b50]">Temporary</p>
                    <p className="text-[11px] text-gray-500">Semi-fixed / Moving</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-bold text-[#183b50]">Shop Name</label>
            <input type="text" name="shopName" value={formData.shopName} onChange={handleChange} placeholder="Enter your shop name" className="h-14 w-full rounded-2xl border border-[#D7E1E9] bg-[#f8fafb] px-5 text-[15px] text-[#123B63] outline-none focus:bg-white focus:border-[#ffae00]" />
            {errors.shopName && <p className="mt-1.5 px-1 text-xs text-red-500">{errors.shopName}</p>}
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-bold text-[#183b50]">Owner Name</label>
            <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange} placeholder="Enter owner's full name" className="h-14 w-full rounded-2xl border border-[#D7E1E9] bg-[#f8fafb] px-5 text-[15px] text-[#123B63] outline-none focus:bg-white focus:border-[#ffae00]" />
            {errors.ownerName && <p className="mt-1.5 px-1 text-xs text-red-500">{errors.ownerName}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#183b50]">Mobile Number</label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setFormData((p) => ({ ...p, mobile: val }));
                    if (errors.mobile) setErrors((p) => ({ ...p, mobile: "" }));
                  }}
                  placeholder="10-digit mobile"
                  maxLength={10}
                  className="h-14 w-full rounded-2xl border border-[#D7E1E9] bg-[#f8fafb] px-5 text-[15px] text-[#123B63] outline-none focus:bg-white focus:border-[#ffae00]"
                />
              {errors.mobile && <p className="mt-1.5 px-1 text-xs text-red-500">{errors.mobile}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-[#183b50]">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" className="h-14 w-full rounded-2xl border border-[#D7E1E9] bg-[#f8fafb] px-5 text-[15px] text-[#123B63] outline-none focus:bg-white focus:border-[#ffae00]" />
              {errors.email && <p className="mt-1.5 px-1 text-xs text-red-500">{errors.email}</p>}
            </div>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-bold text-[#183b50]">Shop Category</label>
            <select name="category" value={formData.category} onChange={handleChange} className="h-14 w-full rounded-2xl border border-[#D7E1E9] bg-[#f8fafb] px-5 text-[15px] text-[#123B63] outline-none focus:bg-white focus:border-[#ffae00]">
              <option value="">Select shop category</option>
              {categories.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
            </select>
            {errors.category && <p className="mt-1.5 px-1 text-xs text-red-500">{errors.category}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#183b50]">Opening Time</label>
              <input type="time" name="openingTime" value={formData.openingTime} onChange={handleChange} className="h-14 w-full rounded-2xl border border-[#D7E1E9] bg-[#f8fafb] px-5 text-[15px] text-[#123B63] outline-none focus:bg-white focus:border-[#ffae00]" />
              {errors.openingTime && <p className="mt-1.5 px-1 text-xs text-red-500">{errors.openingTime}</p>}
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-[#183b50]">Closing Time</label>
              <input type="time" name="closingTime" value={formData.closingTime} onChange={handleChange} className="h-14 w-full rounded-2xl border border-[#D7E1E9] bg-[#f8fafb] px-5 text-[15px] text-[#123B63] outline-none focus:bg-white focus:border-[#ffae00]" />
              {errors.closingTime && <p className="mt-1.5 px-1 text-xs text-red-500">{errors.closingTime}</p>}
            </div>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-bold text-[#183b50]">Shop Address & Location</label>
            <div className="flex gap-2 mb-3">
              <button type="button" onClick={() => setLocationPanelOpen(true)} className="flex-1 flex items-center gap-2 h-12 px-4 rounded-xl border border-gray-200 bg-[#f8fafb] text-xs font-semibold text-gray-700 hover:border-[#ffae00]">
                <Search size={16} /> Search Address
              </button>
              <button type="button" onClick={useCurrentLocation} className="flex items-center gap-2 h-12 px-4 rounded-xl bg-orange-50 border border-orange-200 text-xs font-semibold text-[#ffae00]">
                <LocateFixed size={16} /> Use GPS
              </button>
            </div>

            <div className="mb-3 h-40 w-full overflow-hidden rounded-2xl border border-gray-200 relative">
              <iframe title="Map" width="100%" height="100%" style={{ border: 0 }} src={`https://maps.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&z=${zoomLevel}&output=embed`}></iframe>
            </div>

            <textarea name="address" value={formData.address} onChange={handleChange} rows={3} placeholder="Complete address" className="w-full rounded-2xl border border-[#D7E1E9] bg-[#f8fafb] px-5 py-4 text-[15px] text-[#123B63] outline-none" />
            {errors.address && <p className="mt-1.5 px-1 text-xs text-red-500">{errors.address}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-[#183b50]">Landmark</label>
              <input type="text" name="landmark" value={formData.landmark} onChange={handleChange} placeholder="Near..." className="h-14 w-full rounded-2xl border border-[#D7E1E9] bg-[#f8fafb] px-5 text-[15px] text-[#123B63] outline-none" />
              {errors.landmark && <p className="mt-1.5 px-1 text-xs text-red-500">{errors.landmark}</p>}
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-[#183b50]">City</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" className="h-14 w-full rounded-2xl border border-[#D7E1E9] bg-[#f8fafb] px-5 text-[15px] text-[#123B63] outline-none" />
              {errors.city && <p className="mt-1.5 px-1 text-xs text-red-500">{errors.city}</p>}
            </div>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-bold text-[#183b50]">Pincode</label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                setFormData((p) => ({ ...p, pincode: val }));
                if (errors.pincode) setErrors((p) => ({ ...p, pincode: "" }));
              }}
              placeholder="6-digit pincode"
              maxLength={6}
              className="h-14 w-full rounded-2xl border border-[#D7E1E9] bg-[#f8fafb] px-5 text-[15px] text-[#123B63] outline-none focus:bg-white focus:border-[#ffae00]"
            />
            {errors.pincode && <p className="mt-1.5 px-1 text-xs text-red-500">{errors.pincode}</p>}
          </div>

          <button type="submit" disabled={loading} className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF7A18] to-[#FF922F] text-base font-bold text-white shadow-lg">
            {loading ? <Loader2 className="animate-spin" /> : <>Continue to Email OTP <ArrowRight size={20} /></>}
          </button>
        </form>

        {cameraModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md bg-white p-5 rounded-3xl flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-4">
                <h3 className="text-base font-bold text-[#0b2940]">Take Shop Photo</h3>
                <button type="button" onClick={stopCamera} className="h-9 w-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200">
                  <X size={18} />
                </button>
              </div>
              <video ref={videoRef} autoPlay playsInline className="w-full h-72 bg-black rounded-2xl object-cover mb-4" />
              <canvas ref={canvasRef} className="hidden" />
              <button type="button" onClick={capturePhoto} className="h-14 w-full rounded-full bg-[#ffae00] text-white font-bold">Capture Photo</button>
            </div>
          </div>
        )}

        {/* Location Search Modal */}
        {locationPanelOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-[#0b2940]">Search Shop Address</h3>
                <button type="button" onClick={() => setLocationPanelOpen(false)} className="rounded-full bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200">
                  <X size={18} />
                </button>
              </div>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type street, landmark or area..."
                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-[#ffae00] mb-3"
              />
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => selectLocationFromSearch(item)}
                    className="w-full text-left py-2.5 px-2 text-xs text-gray-700 hover:bg-orange-50 hover:text-[#ffae00] truncate transition"
                  >
                    {item.display_name}
                  </button>
                ))}
                {search.length >= 3 && suggestions.length === 0 && (
                  <p className="py-4 text-center text-xs text-gray-400">No matching locations found.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ShopkeeperSignup;