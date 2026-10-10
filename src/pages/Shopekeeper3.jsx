import React, { useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  User,
  Camera,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import { supabase } from "../supabaseClient";

const Shopekeeper3 = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile Picture States
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requirements = useMemo(
    () => [
      { label: "At least 8 characters", valid: password.length >= 8 },
      { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
      { label: "One lowercase letter", valid: /[a-z]/.test(password) },
      { label: "One number", valid: /\d/.test(password) },
      { label: "One special character", valid: /[^A-Za-z0-9]/.test(password) },
    ],
    [password]
  );

  const validRequirements = requirements.filter((item) => item.valid).length;
  const passwordStrength = validRequirements <= 2 ? "Weak" : validRequirements <= 4 ? "Medium" : "Strong";
  const strengthWidth = validRequirements <= 2 ? "w-1/3" : validRequirements <= 4 ? "w-2/3" : "w-full";

  // Camera Handlers
  const startCamera = async () => {
    setCameraModalOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Camera permission denied or not available.");
      setCameraModalOpen(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      canvas.width = video.videoWidth || 400;
      canvas.height = video.videoHeight || 400;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "profile-pic.jpg", { type: "image/jpeg" });
          setProfileImageFile(file);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    if (validRequirements < 5) {
      setError("Please complete all password requirements.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const savedShopData = JSON.parse(sessionStorage.getItem("nearGoShopkeeperData"));
      if (!savedShopData) throw new Error("Shop registration data missing. Please start again.");

      const cleanEmail = savedShopData.email.trim().toLowerCase();

      // OTP verify hone ke baad user already logged in hai — us session ko use karo
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session?.user?.id) {
        throw new Error("Session expired. Please go back and verify OTP again.");
      }

      const userId = sessionData.session.user.id;

      const specificRole = savedShopData.shopType === "temporary" ? "shopkeeper_temporary" : "shopkeeper_permanent";

      // Password set karo via updateUser (user already authenticated hai OTP se)
      const { error: updateErr } = await supabase.auth.updateUser({
        password: password,
        data: {
          full_name: savedShopData.ownerName || "",
          phone: savedShopData.mobile || "",
          username: username.trim(),
          role: specificRole
        }
      });

      if (updateErr) {
        // "New password should be different" = password already set hai, proceed karo
        if (updateErr.message?.toLowerCase().includes("same") || 
            updateErr.message?.toLowerCase().includes("different")) {
          console.warn("Password already set, proceeding...");
        } else {
          throw updateErr;
        }
      }

      // Profile picture upload (agar file hai toh)
      let avatarUrl = imagePreview; 
      if (profileImageFile) {
        const fileExt = profileImageFile.name.split(".").pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage.from("avatars").upload(fileName, profileImageFile);
        if (!uploadErr) {
          const { data: publicURL } = supabase.storage.from("avatars").getPublicUrl(fileName);
          avatarUrl = publicURL.publicUrl;
        }
      }

      // 1. Pehle profiles table mein upsert karo (Foreign key requirement ke liye)
      const { error: profileErr } = await supabase.from("profiles").upsert([
        {
          id: userId,
          email: cleanEmail,
          full_name: savedShopData.ownerName || "",
          phone: savedShopData.mobile || "",
          role: specificRole,
          username: username.trim(),
          avatar_url: avatarUrl,
        },
      ]);

      if (profileErr) {
        console.error("Profile upsert error:", profileErr);
        throw profileErr;
      }

      // 2. Uske baad shops table mein insert/update karo
      const shopPayload = {
        owner_id: userId,
        shop_name: savedShopData.shopName || "My Shop",
        category: savedShopData.category || "General Store",
        shop_type: savedShopData.shopType || "permanent",
        sub_type: savedShopData.subType || null,
        address: savedShopData.address || savedShopData.approximateArea || "Mandsaur",
        landmark: savedShopData.landmark || "",
        city: savedShopData.city || "Mandsaur",
        pincode: savedShopData.pincode || "458001",
        latitude: savedShopData.latitude || 24.0722,
        longitude: savedShopData.longitude || 75.0683,
        shop_image: savedShopData.shopImage || avatarUrl || "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80",
        opening_time: savedShopData.openingTime || "09:00 AM",
        closing_time: savedShopData.closingTime || "09:00 PM",
        temporary_duration: savedShopData.temporaryDuration || null,
        description: savedShopData.description || null,
        is_live: true,
      };

      let finalShopId = null;
      const { data: existingShop } = await supabase
        .from("shops")
        .select("id")
        .eq("owner_id", userId)
        .maybeSingle();

      if (existingShop?.id) {
        const { error: updateShopErr } = await supabase
          .from("shops")
          .update(shopPayload)
          .eq("id", existingShop.id);
        if (updateShopErr) throw updateShopErr;
        finalShopId = existingShop.id;
      } else {
        const { data: newShop, error: insertShopErr } = await supabase
          .from("shops")
          .insert([shopPayload])
          .select("id")
          .single();
        if (insertShopErr) throw insertShopErr;
        finalShopId = newShop?.id;
      }

      // 3. Cache active shop in localStorage with real shop ID for immediate inventory sync
      const activeShopObj = {
        id: finalShopId,
        shopName: savedShopData.shopName,
        name: savedShopData.shopName,
        ownerName: savedShopData.ownerName,
        category: savedShopData.category,
        address: savedShopData.address || savedShopData.landmark || "Mandsaur",
        mobile: savedShopData.mobile,
        email: cleanEmail,
        shopType: savedShopData.shopType || "permanent",
        subType: savedShopData.subType || "",
        latitude: savedShopData.latitude || 24.0722,
        longitude: savedShopData.longitude || 75.0683,
        openingTime: savedShopData.openingTime || "09:00 AM",
        closingTime: savedShopData.closingTime || "09:00 PM",
        shopImage: savedShopData.shopImage || avatarUrl || null,
      };
      localStorage.setItem("nearGoActiveShop", JSON.stringify(activeShopObj));

      // Session storage clear karo
      sessionStorage.removeItem("nearGoShopkeeperData");
      sessionStorage.removeItem("nearGoShopkeeperVerified");

      // Dashboard par redirect karo
      navigate("/shopkeeperdashboard");
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message || "Failed to complete registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FBFD] px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-100">
        <div className="mb-7 text-center">
          <p className="text-xs font-bold text-[#16aaa8] mb-1">STEP 3 OF 3</p>
          <h2 className="text-2xl font-extrabold text-[#0b2940]">Credentials & Profile Setup</h2>
          <p className="text-xs text-gray-400 mt-1">Set your username, password and profile picture.</p>
        </div>

        <form onSubmit={handleCompleteRegistration} className="space-y-5">
          {/* Username */}
          <div>
            <label className="mb-2 block text-sm font-bold text-[#0b2940]">Username</label>
            <div className="relative">
              <User size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#496B87]" />
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter unique username" className="h-14 w-full rounded-2xl border border-gray-200 bg-[#F8FAFB] pl-12 pr-4 text-sm font-medium text-[#0b2940] outline-none focus:border-[#16b8b5]" />
            </div>
          </div>

          {/* Profile Picture Upload Section */}
          <div>
            <label className="mb-2 block text-sm font-bold text-[#0b2940]">Profile Picture</label>
            <div className="p-4 rounded-2xl border border-gray-200 bg-[#f8fafb]">
              {imagePreview ? (
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative h-20 w-20 rounded-full overflow-hidden border shadow-sm">
                    <img src={imagePreview} alt="Profile Preview" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => { setImagePreview(null); setProfileImageFile(null); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow"><X size={12} /></button>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#123B63]">Photo attached successfully!</p>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={startCamera} className="flex items-center justify-center gap-2 h-12 w-full rounded-xl bg-white border border-gray-200 text-xs font-bold text-[#123B63] shadow-sm hover:bg-gray-50">
                  <Camera size={16} className="text-[#ffae00]" /> Open Camera
                </button>
                <div>
                  <input type="file" accept="image/*" id="profileFileInput" onChange={handleFileChange} className="hidden" />
                  <label htmlFor="profileFileInput" className="cursor-pointer flex items-center justify-center gap-2 h-12 w-full rounded-xl bg-white border border-gray-200 text-xs font-bold text-[#123B63] shadow-sm hover:bg-gray-50">
                    <Upload size={16} className="text-[#16aaa8]" /> Choose File
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-sm font-bold text-[#0b2940]">Password</label>
            <div className="relative">
              <LockKeyhole size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#496B87]" />
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="h-14 w-full rounded-2xl border border-gray-200 bg-[#F8FAFB] pl-12 pr-12 text-sm font-medium text-[#0b2940] outline-none" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#496B87]">
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          {password.length > 0 && (
            <div className="rounded-2xl bg-[#F8FAFB] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-[#496B87]">Strength</span>
                <span className={`text-xs font-extrabold ${passwordStrength === "Strong" ? "text-green-600" : "text-orange-500"}`}>{passwordStrength}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200">
                <div className={`h-full rounded-full transition-all duration-300 ${strengthWidth} ${passwordStrength === "Strong" ? "bg-green-500" : "bg-orange-400"}`} />
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-bold text-[#0b2940]">Confirm Password</label>
            <div className="relative">
              <LockKeyhole size={19} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#496B87]" />
              <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter password" className="h-14 w-full rounded-2xl border border-gray-200 bg-[#F8FAFB] pl-12 pr-12 text-sm font-medium text-[#0b2940] outline-none" />
            </div>
          </div>

          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

          <button type="submit" disabled={loading} className="group flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#FF7A18] to-[#ffae00] text-sm font-extrabold text-white shadow-lg transition hover:shadow-xl">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <>Complete Registration <ArrowRight size={19} /></>}
          </button>
        </form>

        {/* Camera Modal */}
        {cameraModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-4">
                <h3 className="text-base font-bold text-[#0b2940]">Take Profile Selfie</h3>
                <button type="button" onClick={stopCamera} className="h-9 w-9 flex items-center justify-center rounded-full bg-gray-100"><X size={18} /></button>
              </div>
              <div className="relative w-full h-72 bg-black rounded-2xl overflow-hidden mb-4">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <button type="button" onClick={capturePhoto} className="flex items-center justify-center gap-2 h-14 w-full rounded-full bg-[#ffae00] text-white font-bold">
                <Camera size={20} /> Capture Photo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shopekeeper3;