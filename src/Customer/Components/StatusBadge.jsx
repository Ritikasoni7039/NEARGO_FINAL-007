import React from "react";
import { CheckCircle2, Clock3, ShoppingBag, XCircle } from "lucide-react";

const statusStyles = {
  Pending: {
    label: "Pending",
    className: "bg-[#fff2df] text-[#b75d17]",
    icon: Clock3,
  },
  Reserved: {
    label: "Pending",
    className: "bg-[#fff2df] text-[#b75d17]",
    icon: Clock3,
  },
  Confirmed: {
    label: "Confirmed",
    className: "bg-[#e9f1f8] text-[#3e6d91]",
    icon: CheckCircle2,
  },
  Ready: {
    label: "Ready for pickup",
    className: "bg-[#e5f1ec] text-[#3b806a]",
    icon: ShoppingBag,
  },
  Completed: {
    label: "Completed",
    className: "bg-[#e5f1ec] text-[#3b806a]",
    icon: CheckCircle2,
  },
  Cancelled: {
    label: "Cancelled",
    className: "bg-[#f5e8e4] text-[#a45d4c]",
    icon: XCircle,
  },
};

export default function StatusBadge({ status = "Pending" }) {
  const config = statusStyles[status] || statusStyles.Pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${config.className}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
}
