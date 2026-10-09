import React from "react";
import { ArrowUpRight, Heart, Package } from "lucide-react";

export default function ProductCard({
  product,
  saved = false,
  onOpen,
  onSave,
  onReserve,
}) {
  return (
    <article className="border border-[#e3e1d9] bg-[#fffdfa] p-4 transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(24,45,61,0.08)]">
      <div className="flex gap-4">
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 gap-4 text-left">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center bg-[#edf0eb]">
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-contain p-3 mix-blend-multiply"
              onError={(event) => {
                event.currentTarget.style.display = "none";
                event.currentTarget.parentElement.innerHTML = `<span style="font-size:36px">${product.emoji || "📦"}</span>`;
              }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#f28a2e]">
              {product.category}
            </p>
            <div className="mt-1 flex items-start justify-between gap-2">
              <h3 className="truncate text-lg font-bold">{product.name}</h3>
              <ArrowUpRight size={17} className="shrink-0 text-[#7c8583]" />
            </div>
            <p className="mt-1 truncate text-sm text-[#7c8583]">{product.details}</p>

            <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xl font-semibold">₹{product.price.toLocaleString("en-IN")}</p>
                <p className="mt-1 text-xs text-[#7c8583]">
                  {product.shop} · {product.distance}
                </p>
              </div>
              <span className="text-xs font-bold text-[#3b806a]">● {product.stock}</span>
            </div>
          </div>
        </button>

        {onSave && (
          <button
            type="button"
            onClick={onSave}
            aria-label={saved ? "Remove saved product" : "Save product"}
            className={`h-fit rounded-full p-2 transition ${saved ? "text-[#f28a2e]" : "text-[#89928f] hover:text-[#f28a2e]"}`}
          >
            <Heart size={19} fill={saved ? "currentColor" : "none"} />
          </button>
        )}
      </div>

      {onReserve && (
        <button
          type="button"
          onClick={onReserve}
          className="mt-4 flex w-full items-center justify-center gap-2 bg-[#f28a2e] py-2.5 text-sm font-bold text-white transition hover:bg-[#df751c]"
        >
          <Package size={16} />
          Reserve for pickup
        </button>
      )}
    </article>
  );
}
