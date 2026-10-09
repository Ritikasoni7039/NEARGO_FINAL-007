import React, { useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Check, Clock3, Minus, Package, Plus, User } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { customerProducts } from "../Customer/CustomerData";
import BottomNavigation from "./components/BottomNavigation";

export default function CustomerReservation() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const product = useMemo(() => customerProducts.find((item) => item.id === Number(params.get("productId"))) || customerProducts[0], [params]);
  const [quantity, setQuantity] = useState(1);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("4:30 PM");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const confirmReservation = () => {
    if (!customerName.trim() || !customerPhone.trim() || !pickupDate) { setError("Please add your name, mobile number and pickup date."); return; }
    const oldOrders = JSON.parse(localStorage.getItem("nearGoOrders") || "[]");
    const order = { ...product, quantity, pickupDate, pickupTime, customerName: customerName.trim(), customerPhone: customerPhone.trim(), notes, status: "Pending", reservedAt: new Date().toISOString() };
    localStorage.setItem("nearGoOrders", JSON.stringify([...oldOrders, order]));
    localStorage.setItem("nearGoLastReservation", JSON.stringify(order));
    navigate("/CustomerReservationConfirmation");
  };

  return <main className="min-h-screen bg-[#f6f7f3] pb-28 text-[#173d3b]"><header className="border-b border-[#e1e4de] bg-[#fffdfa]"><div className="mx-auto flex max-w-4xl items-center gap-4 px-5 py-5 sm:px-8"><button type="button" onClick={() => navigate(-1)} className="rounded-full p-2 text-[#65737a]"><ArrowLeft size={19} /></button><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f28a2e]">Reserve for pickup</p><h1 className="text-2xl font-semibold tracking-[-0.05em]">Set aside your find</h1></div></div></header><div className="mx-auto max-w-4xl px-5 py-8 sm:px-8"><section className="flex gap-4 border border-[#e3e1d9] bg-[#fffdfa] p-5"><div className="flex h-24 w-24 shrink-0 items-center justify-center bg-[#edf0eb]"><img src={product.image} alt={product.name} className="h-full w-full object-contain p-3 mix-blend-multiply" /></div><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#f28a2e]">{product.shop}</p><h2 className="mt-1 text-xl font-bold">{product.name}</h2><p className="mt-1 text-sm text-[#7c8583]">₹{product.price.toLocaleString("en-IN")} · {product.distance}</p><div className="mt-4 flex items-center gap-3"><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="border border-[#d7dcd6] p-1.5"><Minus size={15} /></button><span className="min-w-5 text-center font-bold">{quantity}</span><button type="button" onClick={() => setQuantity(quantity + 1)} className="border border-[#d7dcd6] p-1.5"><Plus size={15} /></button></div></div></section><section className="mt-5 border border-[#e3e1d9] bg-[#fffdfa] p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f28a2e]">Pickup plan</p><div className="mt-7 grid gap-6 sm:grid-cols-2"><Field icon={<CalendarDays size={17} />} label="Pickup date" type="date" value={pickupDate} onChange={setPickupDate} /><Field icon={<Clock3 size={17} />} label="Pickup time" type="select" value={pickupTime} onChange={setPickupTime} options={["10:00 AM", "12:30 PM", "4:30 PM", "7:00 PM"]} /><Field icon={<User size={17} />} label="Your name" value={customerName} onChange={setCustomerName} placeholder="Full name" /><Field icon={<User size={17} />} label="Mobile number" value={customerPhone} onChange={setCustomerPhone} placeholder="10-digit mobile number" /></div><label className="mt-6 block"><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8583]">Note for the shop (optional)</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Anything the shopkeeper should know?" className="mt-2 min-h-24 w-full resize-none border border-[#d7dcd6] bg-transparent p-3 text-sm outline-none focus:border-[#f28a2e]" /></label>{error && <p className="mt-5 border border-[#ead0c8] bg-[#fbefeb] px-4 py-3 text-sm font-bold text-[#a45d4c]">{error}</p>}<button type="button" onClick={confirmReservation} className="mt-7 flex w-full items-center justify-center gap-2 bg-[#f28a2e] py-3.5 text-sm font-bold text-white"><Package size={17} /> Confirm reservation · ₹{(product.price * quantity).toLocaleString("en-IN")}</button></section></div><BottomNavigation active="Orders" /></main>;
}

const Field = ({ icon, label, type = "text", value, onChange, placeholder, options = [] }) => <label className="block"><span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#7c8583]">{icon}{label}</span>{type === "select" ? <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full border-b border-[#cfd5d1] bg-transparent py-3 text-sm outline-none focus:border-[#f28a2e]">{options.map((option) => <option key={option}>{option}</option>)}</select> : <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 w-full border-b border-[#cfd5d1] bg-transparent py-3 text-sm outline-none focus:border-[#f28a2e] placeholder:text-[#a4adaa]" />}</label>;
