import React from "react";
import { Package } from "lucide-react";

export default function EmptyState({
  title = "Nothing here yet",
  text = "Your saved items will appear here.",
  actionText,
  onAction,
  icon: Icon = Package,
}) {
  return (
    <section className="border border-dashed border-[#cfd5d1] bg-[#fffdfa] px-5 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#edf5f2] text-[#3b806a]">
        <Icon size={25} />
      </div>
      <h3 className="mt-5 text-xl font-bold text-[#173d3b]">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#7c8583]">{text}</p>
      {onAction && actionText && (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 bg-[#113b52] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1b4b64]"
        >
          {actionText}
        </button>
      )}
    </section>
  );
}
