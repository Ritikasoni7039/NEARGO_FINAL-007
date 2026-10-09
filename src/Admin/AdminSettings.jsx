import React, { useState } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  LockKeyhole,
  MapPinned,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AdminMobileNav,
  AdminNavigation,
} from "./components/AdminUI";

export default function AdminSettings() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    moderation: true,
    notifications: true,
    discovery: true,
    maintenance: false,
  });

  const [notice, setNotice] = useState("");

  const toggle = (key) => {
    setSettings((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const save = () => {
    localStorage.setItem(
      "nearGoAdminSettings",
      JSON.stringify(settings)
    );

    setNotice("Admin settings saved");

    window.setTimeout(() => setNotice(""), 2200);
  };

  return (
    <main className="min-h-screen bg-[#f5f6f2] pb-20 text-[#173d3b] lg:flex lg:pb-0">
      <AdminNavigation active="Settings" />

      <div className="min-w-0 flex-1">
        <header className="border-b border-[#dfe4dd] bg-[#fffdfa]">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-5 sm:px-8 lg:px-10">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-full p-2 text-[#65737a] lg:hidden"
              aria-label="Go back"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f28a2e]">
                Platform controls
              </p>

              <h1 className="text-2xl font-semibold tracking-[-0.05em]">
                Settings
              </h1>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-5 py-7 sm:px-8 lg:px-10">
          {notice && (
            <div className="mb-5 flex items-center gap-2 border border-[#c9e0d3] bg-[#edf7f0] px-4 py-3 text-sm font-bold text-[#3b806a]">
              <Check size={17} />
              {notice}
            </div>
          )}

          <section className="bg-[#113b52] p-6 text-white sm:p-8">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f5b77b]">
              <ShieldCheck size={15} />
              Admin-only controls
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
              Keep the marketplace trustworthy.
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-white/65">
              These switches affect discovery, moderation and platform
              communication.
            </p>
          </section>

          <section className="mt-5 border border-[#e3e1d9] bg-[#fffdfa] p-5 sm:p-7">
            <SettingRow
              icon={<ShieldCheck />}
              title="Shop moderation"
              text="Require review before a new shop becomes visible."
              value={settings.moderation}
              onClick={() => toggle("moderation")}
            />

            <SettingRow
              icon={<Bell />}
              title="Admin notifications"
              text="Receive alerts for new reports, approvals and system issues."
              value={settings.notifications}
              onClick={() => toggle("notifications")}
            />

            <SettingRow
              icon={<MapPinned />}
              title="Nearby discovery"
              text="Allow approved shops and products to appear on customer maps."
              value={settings.discovery}
              onClick={() => toggle("discovery")}
            />

            <SettingRow
              icon={<LockKeyhole />}
              title="Maintenance mode"
              text="Temporarily pause new reservations while keeping existing orders visible."
              value={settings.maintenance}
              onClick={() => toggle("maintenance")}
            />
          </section>

          <button
            type="button"
            onClick={save}
            className="mt-5 flex w-full items-center justify-center gap-2 bg-[#f28a2e] px-5 py-3 text-sm font-bold text-white"
          >
            <Save size={17} />
            Save platform settings
          </button>
        </div>

        <AdminMobileNav active="Settings" />
      </div>
    </main>
  );
}

const SettingRow = ({ icon, title, text, value, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex w-full items-center gap-4 border-b border-[#ece9e1] py-5 text-left last:border-b-0"
  >
    <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#edf5f2] text-[#113b52]">
      {React.cloneElement(icon, { size: 18 })}
    </span>

    <span className="min-w-0 flex-1">
      <b className="block text-sm">{title}</b>

      <small className="mt-1 block max-w-xl text-xs leading-5 text-[#7c8583]">
        {text}
      </small>
    </span>

    <span
      className={`relative h-6 w-11 shrink-0 rounded-full p-1 transition ${
        value ? "bg-[#3b806a]" : "bg-[#cfd5d1]"
      }`}
    >
      <span
        className={`block h-4 w-4 rounded-full bg-white transition ${
          value ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </span>
  </button>
);