import React from "react";
import { Mic, Search, X } from "lucide-react";

export default function SearchBar({
  value = "",
  onChange,
  onClear,
  onVoiceSearch,
  voiceListening = false,
  placeholder = "What are you looking for?",
  hint = "Try “LED bulb” or “mobile cable”",
  resultCount,
  suggestions = [],
  onSuggestionSelect,
  dark = true,
}) {
  const textClass = dark ? "text-white" : "text-[#173d3b]";
  const mutedClass = dark ? "text-white/50" : "text-[#7c8583]";
  const borderClass = dark ? "border-white/30" : "border-[#cfd5d1]";
  const placeholderClass = dark ? "placeholder:text-white/45" : "placeholder:text-[#a4adaa]";

  return (
    <div className="relative w-full">
      <div className={`flex items-center gap-3 border-b ${borderClass} pb-2`}>
        <Search size={20} className={`shrink-0 ${dark ? "text-white/60" : "text-[#7c8583]"}`} />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder={placeholder}
          aria-label="Search products and shops"
          className={`min-w-0 flex-1 bg-transparent py-2 text-base outline-none ${textClass} ${placeholderClass}`}
        />
        {value && (
          <button type="button" onClick={onClear} aria-label="Clear search" className={`${mutedClass} transition hover:text-[#f28a2e]`}>
            <X size={18} />
          </button>
        )}
        {onVoiceSearch && (
          <button
            type="button"
            onClick={onVoiceSearch}
            aria-label="Search by voice"
            className={`rounded-full p-2 transition ${voiceListening ? "bg-[#f28a2e] text-white" : `${mutedClass} hover:text-current`}`}
          >
            <Mic size={19} />
          </button>
        )}
      </div>
      {value && suggestions.length > 0 && onSuggestionSelect && (
        <div className="absolute inset-x-0 top-[calc(100%+0.65rem)] z-[100] overflow-hidden border border-[#dfe4dd] bg-[#fffdfa] text-[#173d3b] shadow-[0_16px_35px_rgba(24,45,61,0.2)]">
          <p className="border-b border-[#ece9e1] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#f28a2e]">Suggested nearby matches</p>
          {suggestions.slice(0, 5).map((item) => (
            <button type="button" key={item.id || item.value} onClick={() => onSuggestionSelect(item)} className="flex w-full items-center gap-3 border-b border-[#f0eee8] px-4 py-3 text-left transition last:border-b-0 hover:bg-[#fff6ed]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#fff1e4] text-lg">{item.icon || "🔎"}</span>
              <span className="min-w-0 flex-1"><b className="block truncate text-sm">{item.title || item.value}</b><small className="mt-0.5 block truncate text-xs text-[#7c8583]">{item.subtitle || "Show nearby shops"}</small></span>
              <span className="text-xs font-bold text-[#b75d17]">Map shops</span>
            </button>
          ))}
        </div>
      )}
      {(hint || typeof resultCount === "number") && (
        <div className={`mt-3 flex items-center justify-between text-xs ${mutedClass}`}>
          <span>{voiceListening ? "Listening…" : hint}</span>
          {typeof resultCount === "number" && <span className="hidden sm:inline">{resultCount} nearby options</span>}
        </div>
      )}
    </div>
  );
}
