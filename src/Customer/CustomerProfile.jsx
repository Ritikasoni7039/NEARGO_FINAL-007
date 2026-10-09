import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  ChevronRight,
  Edit3,
  Heart,
  Home,
  LogOut,
  MapPin,
  Package,
  Pencil,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "./components/BottomNavigation";

const readStorage = (storage, key, fallback) => {
  try {
    return JSON.parse(storage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const getInitialProfile = () => {
  const savedProfile = readStorage(sessionStorage, "nearGoCustomerProfile", {});
  const signupData = readStorage(sessionStorage, "nearGoSignupData", {});

  return {
    name: savedProfile.name || signupData.fullName || "Your name",
    phone: savedProfile.phone || signupData.mobile || "",
    email: savedProfile.email || signupData.email || "",
  };
};

const getLocation = () => readStorage(sessionStorage, "nearGoCustomerLocation", { city: "Indore", radius: "2 km" });

const CustomerProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(getInitialProfile);
  const [location, setLocation] = useState(getLocation);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [notifications, setNotifications] = useState(true);
  const [nearbyAlerts, setNearbyAlerts] = useState(true);
  const [saveMessage, setSaveMessage] = useState("");

  const orders = readStorage(localStorage, "nearGoOrders", []);
  const savedItems = readStorage(localStorage, "nearGoSaved", []);
  const activeOrders = orders.filter((order) => order.status !== "Cancelled");

  const initials = useMemo(() => {
    const parts = profile.name.trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "NG";
  }, [profile.name]);

  const completion = [profile.name !== "Your name", Boolean(profile.phone), Boolean(profile.email), Boolean(location.address || location.city)].filter(Boolean).length * 25;

  const saveProfile = () => {
    const updatedProfile = {
      name: draft.name.trim() || "Your name",
      phone: draft.phone.trim(),
      email: draft.email.trim(),
    };

    setProfile(updatedProfile);
    setDraft(updatedProfile);
    sessionStorage.setItem("nearGoCustomerProfile", JSON.stringify(updatedProfile));
    sessionStorage.setItem("nearGoSignupData", JSON.stringify({
      ...readStorage(sessionStorage, "nearGoSignupData", {}),
      fullName: updatedProfile.name,
      mobile: updatedProfile.phone,
      email: updatedProfile.email,
    }));
    setEditing(false);
    setSaveMessage("Profile updated");
    window.setTimeout(() => setSaveMessage(""), 2500);
  };

  const changeLocation = () => {
    navigate("/CustomerLocation");
  };

  return (
    <main className="min-h-screen bg-[#f6f7f3] pb-[calc(5.9rem+env(safe-area-inset-bottom))] text-[#173d3b]">
      <header className="border-b border-[#e1e4de] bg-[#fffdfa]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-12">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="rounded-full p-2 text-[#65737a] hover:bg-[#f0f1ed]" aria-label="Go back">
              <ArrowLeft size={19} />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f28a2e]">Customer account</p>
              <h1 className="text-2xl font-semibold tracking-[-0.05em]">Your profile</h1>
            </div>
          </div>
          <button type="button" onClick={() => (editing ? saveProfile() : (setDraft(profile), setEditing(true)))} className="flex items-center gap-2 text-sm font-bold text-[#b75d17]">
            {editing ? <><Check size={16} /> Save</> : <><Edit3 size={16} /> Edit profile</>}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8 lg:px-12">
        {saveMessage && <div className="mb-5 flex items-center gap-2 border border-[#c9e0d3] bg-[#edf7f0] px-4 py-3 text-sm font-bold text-[#3b806a]"><Check size={17} /> {saveMessage}</div>}

        <section className="relative overflow-hidden bg-[#113b52] p-6 text-white sm:p-9">
          <div className="relative z-10 flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white/20 bg-[#f28a2e] text-2xl font-bold shadow-lg sm:h-24 sm:w-24 sm:text-3xl">{initials}</div>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#f5b77b]"><Sparkles size={14} /> Welcome back</p>
                <h2 className="mt-2 truncate text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">{profile.name}</h2>
                <p className="mt-2 text-sm text-white/65">Your local shopping companion is ready.</p>
              </div>
            </div>
            <div className="max-w-xs sm:text-right">
              <div className="flex items-center justify-between gap-5 text-xs font-bold text-white/70 sm:justify-end"><span>Profile strength</span><span className="text-[#f5b77b]">{completion}%</span></div>
              <div className="mt-2 h-2 overflow-hidden bg-white/15"><div className="h-full bg-[#f28a2e] transition-all" style={{ width: `${completion}%` }} /></div>
              <p className="mt-2 text-xs text-white/50">{completion === 100 ? "Everything looks complete." : "Add a few details to make your account stronger."}</p>
            </div>
          </div>
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[28px] border-white/5" />
          <div className="absolute -bottom-40 left-1/2 h-72 w-72 rounded-full border-[24px] border-[#f28a2e]/10" />
        </section>

        <section className="mt-5 grid grid-cols-3 border border-[#e3e1d9] bg-[#fffdfa]">
          <Stat value={activeOrders.length} label="Orders" />
          <Stat value={savedItems.length} label="Saved" />
          <Stat value={location.city || "—"} label="Shopping area" compact />
        </section>

        <div className="mt-7 grid gap-7 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="border border-[#e3e1d9] bg-[#fffdfa] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f28a2e]">Personal details</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">About you</h2></div>
              {!editing && <button type="button" onClick={() => { setDraft(profile); setEditing(true); }} className="rounded-full bg-[#f5f6f1] p-2 text-[#65737a] hover:text-[#b75d17]" aria-label="Edit personal details"><Pencil size={17} /></button>}
            </div>

            {editing ? <div className="mt-7 space-y-6"><ProfileField label="Full name" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} placeholder="Your full name" /><ProfileField label="Mobile number" value={draft.phone} onChange={(value) => setDraft({ ...draft, phone: value })} placeholder="10-digit mobile number" /><ProfileField label="Email address" value={draft.email} onChange={(value) => setDraft({ ...draft, email: value })} placeholder="you@example.com" type="email" /><div className="flex gap-3"><button onClick={saveProfile} className="flex flex-1 items-center justify-center gap-2 bg-[#f28a2e] px-4 py-3 text-sm font-bold text-white"><Check size={16} /> Save changes</button><button onClick={() => { setDraft(profile); setEditing(false); }} className="border border-[#d7dcd6] px-4 py-3 text-sm font-bold text-[#65737a]">Cancel</button></div></div> : <div className="mt-7 space-y-5"><DetailRow icon={<User size={18} />} label="Full name" value={profile.name} /><DetailRow icon={<Phone size={18} />} label="Mobile number" value={profile.phone || "Add your number"} muted={!profile.phone} /><DetailRow icon={<Search size={18} />} label="Email address" value={profile.email || "Add your email"} muted={!profile.email} /></div>}
          </section>

          <section className="border border-[#e3e1d9] bg-[#fffdfa] p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f28a2e]">Your usual area</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Shopping location</h2>
            <div className="mt-7 flex items-start gap-4 border border-[#d7e5dd] bg-[#edf5f2] p-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#113b52] text-white"><MapPin size={20} /></div><div className="min-w-0"><p className="font-bold">{location.city || "Choose a city"}</p><p className="mt-1 text-sm leading-5 text-[#607b76]">{location.address || `Searching within ${location.radius || "2 km"}`}</p><p className="mt-2 text-xs font-bold text-[#3b806a]">Within {location.radius || "2 km"}</p></div></div>
            <button onClick={changeLocation} className="mt-5 flex w-full items-center justify-between border-t border-[#ece9e1] pt-4 text-sm font-bold text-[#b75d17]">Change shopping area <ChevronRight size={17} /></button>
          </section>
        </div>

        <section className="mt-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f28a2e]">Shortcuts</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Make yourself at home</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><QuickAction icon={<Package />} title="My orders" text="Track reservations" onClick={() => navigate("/CustomerOrders")} /><QuickAction icon={<Heart />} title="Saved items" text="Your saved finds" onClick={() => navigate("/CustomerSaved")} /><QuickAction icon={<MapPin />} title="Explore nearby" text="Find local stock" onClick={() => navigate("/Nearby")} /></div></section>

        <section className="mt-7 grid gap-7 lg:grid-cols-2">
          <section className="border border-[#e3e1d9] bg-[#fffdfa] p-6 sm:p-8"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center bg-[#fff1e4] text-[#f28a2e]"><Bell size={19} /></div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f28a2e]">Preferences</p><h2 className="mt-1 text-xl font-semibold">Stay in the loop</h2></div></div><div className="mt-6 divide-y divide-[#ece9e1]"><ToggleRow label="Reservation updates" text="Know when a shop accepts your request" checked={notifications} onChange={() => setNotifications(!notifications)} /><ToggleRow label="Nearby suggestions" text="Get ideas based on local availability" checked={nearbyAlerts} onChange={() => setNearbyAlerts(!nearbyAlerts)} /></div></section>
          <section className="border border-[#e3e1d9] bg-[#fffdfa] p-6 sm:p-8"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center bg-[#edf5f2] text-[#3b806a]"><ShieldCheck size={19} /></div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3b806a]">Trust & privacy</p><h2 className="mt-1 text-xl font-semibold">Your account is yours</h2></div></div><p className="mt-5 text-sm leading-6 text-[#7c8583]">We only use your area to show nearby products and shops. Your reservation details stay connected to your account.</p><button onClick={() => setSaveMessage("Your account preferences are saved locally") } className="mt-5 flex items-center gap-2 text-sm font-bold text-[#b75d17]">Review account settings <ChevronRight size={16} /></button></section>
        </section>

        <button type="button" onClick={() => navigate("/")} className="mx-auto mt-8 flex items-center gap-2 text-sm font-bold text-[#8a5c50]"><LogOut size={16} /> Sign out</button>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dfe3de] bg-[#fffdfa]/95 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl"><div className="mx-auto flex max-w-xl items-center justify-around"><NavItem icon={<Home />} label="Home" onClick={() => navigate("/CustomerDashboard")} /><NavItem icon={<MapPin />} label="Nearby" onClick={() => navigate("/Nearby")} /><NavItem icon={<Package />} label="Orders" onClick={() => navigate("/CustomerOrders")} /><NavItem icon={<User />} label="Profile" active onClick={() => navigate("/CustomerProfile")} />
      <BottomNavigation
  icon={<Heart />}
  label="Saved"
  active
  onClick={() => navigate("/CustomerSaved")}
/>
</div></nav>
    </main>
  );
};

const Stat = ({ value, label, compact }) => <div className="border-r border-[#ece9e1] p-4 text-center last:border-r-0 sm:p-5"><p className={`${compact ? "truncate text-base sm:text-lg" : "text-2xl sm:text-3xl"} font-semibold tracking-[-0.04em]`}>{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#87908d] sm:text-xs">{label}</p></div>;
const DetailRow = ({ icon, label, value, muted }) => <div className="flex items-center gap-4"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f0f4ef] text-[#567263]">{icon}</div><div className="min-w-0"><p className="text-xs text-[#87908d]">{label}</p><p className={`mt-0.5 truncate text-sm font-bold ${muted ? "text-[#b0b7b2]" : "text-[#173d3b]"}`}>{value}</p></div></div>;
const ProfileField = ({ label, value, onChange, placeholder, type = "text" }) => <label className="block"><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8583]">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full border-b border-[#cfd5d1] bg-transparent px-0 py-3 text-base outline-none transition focus:border-[#f28a2e] placeholder:text-[#a4adaa]" /></label>;
const QuickAction = ({ icon, title, text, onClick }) => <button onClick={onClick} className="flex items-center gap-3 border border-[#e3e1d9] bg-[#fffdfa] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#f28a2e]"><span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#edf5f2] text-[#113b52]">{React.cloneElement(icon, { size: 18 })}</span><span className="min-w-0 flex-1"><b className="block text-sm">{title}</b><small className="mt-1 block text-xs text-[#7c8583]">{text}</small></span><ChevronRight size={16} className="text-[#87908d]" /></button>;
const ToggleRow = ({ label, text, checked, onChange }) => <div className="flex items-center justify-between gap-4 py-4"><div><p className="text-sm font-bold">{label}</p><p className="mt-1 text-xs text-[#7c8583]">{text}</p></div><button onClick={onChange} className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-[#3b806a]" : "bg-[#cbd2cd]"}`} aria-label={`Toggle ${label}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${checked ? "left-6" : "left-1"}`} /></button></div>;
const NavItem = ({ icon, label, active, onClick }) => <button onClick={onClick} className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5 ${active ? "text-[#113b52]" : "text-[#87908d]"}`}>{React.cloneElement(icon, { size: 21, strokeWidth: active ? 2.7 : 1.9 })}<span className="text-[11px] font-bold">{label}</span>{active && <span className="absolute -bottom-1 h-0.5 w-8 bg-[#f28a2e]" />}</button>;

export default CustomerProfile;
