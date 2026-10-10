import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Sparkles,
  Upload,
  Check,
  X,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  Languages,
} from "lucide-react";
import { supabase } from "../supabaseClient";

// Common Hindi to English vocabulary dictionary for shop inventory
const HINDI_TO_ENGLISH = {
  "aalu": "Potato",
  "aalo": "Potato",
  "batata": "Potato",
  "tamatar": "Tomato",
  "pyaz": "Onion",
  "kanda": "Onion",
  "adrak": "Ginger",
  "lehsun": "Garlic",
  "hari mirch": "Green Chili",
  "mirch": "Chili",
  "dhaniya": "Coriander",
  "pudina": "Mint",
  "palak": "Spinach",
  "gobi": "Cauliflower",
  "patta gobi": "Cabbage",
  "shimla mirch": "Capsicum",
  "bhindi": "Okra",
  "kheera": "Cucumber",
  "kela": "Banana",
  "seb": "Apple",
  "aam": "Mango",
  "santara": "Orange",
  "angoor": "Grapes",
  "tarbooz": "Watermelon",
  "doodh": "Fresh Milk",
  "dahi": "Curd",
  "paneer": "Fresh Paneer",
  "makhan": "Butter",
  "ghee": "Desi Ghee",
  "cheeni": "Sugar",
  "shakkar": "Sugar",
  "namak": "Salt",
  "sarson ka tel": "Mustard Oil",
  "tel": "Cooking Oil",
  "chawal": "Rice",
  "basmati chawal": "Basmati Rice",
  "atta": "Wheat Flour",
  "maida": "Refined Flour",
  "besan": "Gram Flour",
  "suji": "Semolina",
  "chai": "Tea",
  "chai patti": "Tea Leaves",
  "coffee": "Coffee",
  "haldi": "Turmeric Powder",
  "lal mirch": "Red Chili Powder",
  "jeera": "Cumin Seeds",
  "masala": "Spices",
  "maggi": "Maggi Noodles",
  "biscuit": "Biscuits",
  "namkeen": "Namkeen",
  "sev": "Ratlami Sev",
  "peda": "Mawa Peda",
  "mithai": "Sweets",
  "sabun": "Bath Soap",
  "shampoo": "Shampoo",
  "surf": "Detergent Powder",
  "bulb": "LED Bulb",
  "pankha": "Ceiling Fan",
  "taar": "Copper Wire",
  "switch": "Modular Switch",
  "board": "Extension Board",
  "plug": "3-Pin Plug",
  "charger": "Mobile Charger",
  "cable": "Data Cable",
  "tala": "Brass Padlock",
  "hathodi": "Claw Hammer",
  "tape": "Measuring Tape",
  "dawa": "Medicine",
  "goli": "Tablets",
  "phool": "Flowers",
  "mala": "Garland",
};

export function parseVoiceInput(transcript) {
  let text = transcript.toLowerCase();

  // 1. Strip conversational filler prefixes & suffixes
  text = text.replace(/^(mere pass|mere paas|hamare pass|hamare paas|i have|add|bhai|bhaiya|suno|likh|likho)\s+/gi, "");
  text = text.replace(/\s+(hai|hein|h|rakh lo|rakho|daal do|likho|bhai|please)\.?$/gi, "");

  let quantity = 1;
  let unit = "Piece";
  let price = "";

  // 2. Extract Price
  // Patterns like: "50 each", "50 rupaye", "50 rs", "50 per piece", "rate 50", "price 50"
  const priceRegexes = [
    /(?:price|rate|kimat|daam|bhav)\s*(?:of|is|hai)?\s*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*(?:each|per piece|per pc|per packet|prati|rupaye|rupay|rupees|rs|inr)/i,
    /(?:rupaye|rupay|rupees|rs)\s*(\d+(?:\.\d+)?)/i,
  ];

  for (const regex of priceRegexes) {
    const match = text.match(regex);
    if (match) {
      price = parseFloat(match[1]);
      text = text.replace(match[0], " ").trim();
      break;
    }
  }

  // 3. Extract Quantity and Unit
  // Units mapping
  const unitPatterns = [
    { regex: /(\d+)\s*(?:piece|pieces|pc|pcs|nag)/i, unit: "Piece" },
    { regex: /(\d+)\s*(?:packet|packets|pkt|pkts|pudiya)/i, unit: "Packet" },
    { regex: /(\d+)\s*(?:kilo|kg|kilogram)/i, unit: "Kg" },
    { regex: /(\d+)\s*(?:gram|gm|g)\b/i, unit: "Gram" },
    { regex: /(\d+)\s*(?:litre|liter|ltr|l)\b/i, unit: "Litre" },
    { regex: /(\d+)\s*(?:darjan|dozen)/i, unit: "Dozen" },
    { regex: /(\d+)\s*(?:box|boxes|dabba|dappe)/i, unit: "Box" },
    { regex: /(\d+)\s*(?:bottle|bottles|shishi)/i, unit: "Bottle" },
  ];

  let unitMatched = false;
  for (const item of unitPatterns) {
    const match = text.match(item.regex);
    if (match) {
      quantity = parseInt(match[1], 10);
      unit = item.unit;
      text = text.replace(match[0], " ").trim();
      unitMatched = true;
      break;
    }
  }

  // If unit wasn't matched with number, check for standalone quantity keyword
  if (!unitMatched) {
    const qtyKeywordRegex = /(?:quantity|stock|matra|ginti)\s*(?:is|hai)?\s*(\d+)/i;
    const matchKw = text.match(qtyKeywordRegex);
    if (matchKw) {
      quantity = parseInt(matchKw[1], 10);
      text = text.replace(matchKw[0], " ").trim();
    } else {
      // Check for leading standalone number (e.g. "12 bulb 50 watt")
      const leadingNumMatch = text.match(/^(\d+)\s+/);
      if (leadingNumMatch) {
        quantity = parseInt(leadingNumMatch[1], 10);
        text = text.replace(leadingNumMatch[0], " ").trim();
      }
    }
  } else {
    // If unit was already matched from e.g. "12 piece", check if an extra leading number remains
    // (e.g. "12 bulb 50 watt" -> remove the first "12")
    const leadingRepeat = new RegExp(`^${quantity}\\s+`, "i");
    text = text.replace(leadingRepeat, "");
  }

  // 4. Clean filler words like 'ka', 'ki', 'ke', 'watt'
  text = text
    .replace(/^(ka|ki|ke)\s+/gi, "")
    .replace(/\s+(ka|ki|ke)\s+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  // 5. Automatic Hindi to English word replacement
  let cleanTitle = text;
  for (const [hindiTerm, englishTerm] of Object.entries(HINDI_TO_ENGLISH)) {
    const termRegex = new RegExp(`\\b${hindiTerm}\\b`, "gi");
    if (termRegex.test(cleanTitle)) {
      cleanTitle = cleanTitle.replace(termRegex, englishTerm);
      break;
    }
  }

  // 6. Title formatting & capitalization
  cleanTitle = cleanTitle
    .split(" ")
    .filter((w) => w.length > 0)
    .map((w) => {
      // Keep "LED", "USB", "Watt", "Kg" properly cased
      if (/^\d+w$/i.test(w)) return w.toUpperCase();
      if (/^(led|usb|ac|dc|watt|kg|gm|ml|fr)$/i.test(w)) return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");

  // 7. Auto Category detection
  let category = "General";
  const lower = cleanTitle.toLowerCase();
  if (
    lower.includes("bulb") ||
    lower.includes("light") ||
    lower.includes("wire") ||
    lower.includes("switch") ||
    lower.includes("plug") ||
    lower.includes("fan") ||
    lower.includes("watt")
  ) {
    category = "Home & Electrical Essentials";
  } else if (
    lower.includes("tomato") ||
    lower.includes("potato") ||
    lower.includes("onion") ||
    lower.includes("banana") ||
    lower.includes("apple") ||
    lower.includes("chili") ||
    lower.includes("fruit") ||
    lower.includes("vegetable")
  ) {
    category = "Fresh Fruits & Vegetables";
  } else if (
    lower.includes("rice") ||
    lower.includes("dal") ||
    lower.includes("atta") ||
    lower.includes("flour") ||
    lower.includes("oil") ||
    lower.includes("sugar") ||
    lower.includes("salt") ||
    lower.includes("tea") ||
    lower.includes("soap") ||
    lower.includes("biscuit") ||
    lower.includes("detergent")
  ) {
    category = "Grocery & Daily Essentials";
  } else if (
    lower.includes("hammer") ||
    lower.includes("lock") ||
    lower.includes("padlock") ||
    lower.includes("screw") ||
    lower.includes("tool") ||
    lower.includes("pipe")
  ) {
    category = "Hardware & Tools";
  } else if (
    lower.includes("notebook") ||
    lower.includes("pen") ||
    lower.includes("book") ||
    lower.includes("paper")
  ) {
    category = "Stationery & Study Essentials";
  } else if (
    lower.includes("sev") ||
    lower.includes("sweets") ||
    lower.includes("peda") ||
    lower.includes("cake") ||
    lower.includes("snack")
  ) {
    category = "Sweets, Bakery & Snacks";
  } else if (
    lower.includes("medicine") ||
    lower.includes("tablet") ||
    lower.includes("syrup") ||
    lower.includes("spray")
  ) {
    category = "Pharmacy & Wellness";
  }

  return {
    title: cleanTitle || "New Product",
    quantity: quantity || 1,
    unit: unit || "Piece",
    price: price !== "" ? price : "",
    category,
  };
}

export default function VoiceProductModal({ isOpen, onClose, shopId, onProductAdded }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [language, setLanguage] = useState("hi-IN"); // hi-IN or en-IN
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorNotice, setErrorNotice] = useState("");

  const [form, setForm] = useState({
    title: "",
    category: "Grocery & Daily Essentials",
    price: "",
    quantity: "1",
    unit: "Piece",
    description: "",
    imageUrl: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language;
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorNotice("");
      };

      recognition.onresult = (event) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        if (event.results[0].isFinal) {
          const parsed = parseVoiceInput(currentTranscript);
          setForm((prev) => ({
            ...prev,
            title: parsed.title,
            price: parsed.price !== "" ? parsed.price : prev.price,
            quantity: String(parsed.quantity),
            unit: parsed.unit,
            category: parsed.category,
            description: `Voice input: "${currentTranscript}"`,
          }));
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error === "not-allowed") {
          setErrorNotice("Microphone permission denied. Please allow mic access or type manually.");
        } else if (event.error === "no-speech") {
          setErrorNotice("No speech detected. Please speak clearly into the microphone.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Speech initialization error:", err);
      setIsListening(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setErrorNotice("Product title is required.");
      return;
    }
    if (form.price === "" || isNaN(form.price) || Number(form.price) < 0) {
      setErrorNotice("Valid product price is required.");
      return;
    }
    if (form.quantity === "" || isNaN(form.quantity) || Number(form.quantity) < 0) {
      setErrorNotice("Valid stock quantity is required.");
      return;
    }

    setSaving(true);
    setErrorNotice("");

    let finalImageUrl = form.imageUrl || "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=700&q=85";

    // Supabase Storage upload
    if (imageFile) {
      setUploadingImage(true);
      try {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, imageFile, { cacheControl: "3600", upsert: false });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(filePath);

          if (urlData?.publicUrl) finalImageUrl = urlData.publicUrl;
        }
      } catch (uploadErr) {
        console.warn("Storage upload warning:", uploadErr);
      } finally {
        setUploadingImage(false);
      }
    }

    try {
      const fullDesc = form.description
        ? `${form.description.trim()} (${form.quantity} ${form.unit})`
        : `Pack of ${form.quantity} ${form.unit}`;

      const productPayload = {
        shop_id: shopId,
        title: form.title.trim(),
        category: form.category,
        price: Number(form.price),
        stock: Number(form.quantity),
        description: fullDesc,
        image_url: finalImageUrl,
        last_updated_at: new Date().toISOString(),
        status: "active",
      };

      if (shopId) {
        const { data, error } = await supabase
          .from("products")
          .insert([productPayload])
          .select()
          .single();

        if (error) {
          console.error("Database insert error:", error);
          setErrorNotice(`Failed to save product: ${error.message}`);
          setSaving(false);
          return;
        }

        if (data && onProductAdded) {
          onProductAdded({
            id: data.id,
            name: data.title,
            category: data.category,
            price: Number(data.price),
            quantity: Number(data.stock),
            stockStatus: Number(data.stock) === 0 ? "Out of stock" : Number(data.stock) <= 7 ? "Low stock" : "In stock",
            details: data.description,
            imageUrl: data.image_url,
            lastUpdatedAt: data.last_updated_at || new Date().toISOString(),
            status: "active",
            emoji: "📦",
          });
        }
      } else {
        if (onProductAdded) {
          onProductAdded({
            id: Date.now().toString(),
            name: productPayload.title,
            category: productPayload.category,
            price: productPayload.price,
            quantity: productPayload.stock,
            stockStatus: productPayload.stock === 0 ? "Out of stock" : "In stock",
            details: productPayload.description,
            imageUrl: finalImageUrl,
            lastUpdatedAt: new Date().toISOString(),
            status: "active",
            emoji: "📦",
          });
        }
      }

      onClose();
    } catch (err) {
      console.error("Save product error:", err);
      setErrorNotice("An error occurred while saving product.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#102a36]/50 p-3 backdrop-blur-sm sm:p-5">
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto border border-[#e3e1d9] bg-[#fffdfa] p-5 shadow-2xl sm:p-8 rounded-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#ece9e1] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ffefe0] text-[#f28a2e]">
                <Sparkles size={16} />
              </span>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f28a2e]">
                AI Voice Inventory
              </p>
            </div>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#173d3b]">
              Voice Product Add
            </h2>
            <p className="mt-1 text-xs text-[#7c8583]">
              Speak in Hindi or English (e.g. &quot;Mere pass 12 bulb 50 watt 12 piece 50 each&quot;)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#f0f1ed] p-2 text-[#5e6d75] hover:bg-[#e4e7e2]"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Voice Recognition Section */}
        {speechSupported ? (
          <div className="mt-5 rounded-xl border border-[#f5d7b5] bg-[#fffaf5] p-4 text-center sm:p-5">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-[#874b1e] flex items-center gap-1.5">
                <Languages size={15} /> Speaking Language:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLanguage("hi-IN")}
                  className={`rounded px-2.5 py-1 text-xs font-bold transition ${
                    language === "hi-IN" ? "bg-[#f28a2e] text-white" : "bg-[#f0ece5] text-[#65737a]"
                  }`}
                >
                  हिन्दी (Hindi)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("en-IN")}
                  className={`rounded px-2.5 py-1 text-xs font-bold transition ${
                    language === "en-IN" ? "bg-[#f28a2e] text-white" : "bg-[#f0ece5] text-[#65737a]"
                  }`}
                >
                  English (India)
                </button>
              </div>
            </div>

            <div className="my-5 flex flex-col items-center">
              <button
                type="button"
                onClick={toggleListening}
                className={`flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300 shadow-md ${
                  isListening
                    ? "animate-pulse bg-[#e0533c] text-white ring-8 ring-[#e0533c]/25"
                    : "bg-[#f28a2e] text-white hover:bg-[#df751c]"
                }`}
                aria-label={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? <MicOff size={32} /> : <Mic size={32} />}
              </button>
              <p className="mt-3 text-sm font-bold text-[#173d3b]">
                {isListening ? "Listening... Speak your product now!" : "Click microphone to speak"}
              </p>
              {transcript && (
                <div className="mt-2.5 rounded bg-white p-2.5 text-xs italic text-[#556360] shadow-sm max-w-lg border border-[#e8e4dc]">
                  &ldquo;{transcript}&rdquo;
                </div>
              )}
            </div>

            <div className="text-[11px] text-[#8c9491]">
              <strong>Tip:</strong> Bolte waqt item, quantity aur price bolein (e.g. &quot;10 packet Parle-G 10 rupaye&quot; ya &quot;12 bulb 50 watt 12 piece 50 each&quot;)
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 rounded border border-[#f5c6cb] bg-[#fdf2f2] p-3 text-xs text-[#721c24]">
            <AlertCircle size={16} className="shrink-0" />
            <span>
              Web Speech API is not supported in this browser. Please fill in the product form manually below.
            </span>
          </div>
        )}

        {errorNotice && (
          <div className="mt-3 flex items-center gap-2 border border-[#f5c6cb] bg-[#fdf2f2] px-4 py-2 text-xs font-semibold text-[#721c24]">
            <AlertCircle size={15} /> {errorNotice}
          </div>
        )}

        {/* Confirmation & Review Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#ece9e1] pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#173d3b]">
              Verify & Edit Extracted Fields
            </h3>
            <span className="text-[11px] text-[#7c8583]">Review before confirming stock</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7c8583]">
                Product Title / Name *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Bulb 50 Watt"
                className="mt-1 w-full border border-[#cfd5d1] bg-white px-3 py-2.5 text-sm text-[#173d3b] outline-none focus:border-[#f28a2e]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7c8583]">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1 w-full border border-[#cfd5d1] bg-white px-3 py-2.5 text-sm text-[#173d3b] outline-none focus:border-[#f28a2e]"
              >
                <option>Grocery & Daily Essentials</option>
                <option>Fresh Fruits & Vegetables</option>
                <option>Home & Electrical Essentials</option>
                <option>Hardware & Tools</option>
                <option>Stationery & Study Essentials</option>
                <option>Clothing & Footwear</option>
                <option>Sweets, Bakery & Snacks</option>
                <option>Pharmacy & Wellness</option>
                <option>Handmade Gifts & Flowers</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7c8583]">
                Price (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="50"
                className="mt-1 w-full border border-[#cfd5d1] bg-white px-3 py-2.5 text-sm text-[#173d3b] outline-none focus:border-[#f28a2e]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7c8583]">
                Stock / Quantity *
              </label>
              <input
                type="number"
                min="0"
                required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="12"
                className="mt-1 w-full border border-[#cfd5d1] bg-white px-3 py-2.5 text-sm text-[#173d3b] outline-none focus:border-[#f28a2e]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7c8583]">
                Unit (Measurement) *
              </label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="mt-1 w-full border border-[#cfd5d1] bg-white px-3 py-2.5 text-sm text-[#173d3b] outline-none focus:border-[#f28a2e]"
              >
                <option value="Piece">Piece (pc / nag)</option>
                <option value="Packet">Packet (pkt)</option>
                <option value="Kg">Kilogram (kg)</option>
                <option value="Gram">Gram (g)</option>
                <option value="Litre">Litre (L)</option>
                <option value="Dozen">Dozen (12 pcs)</option>
                <option value="Box">Box / Dabba</option>
                <option value="Bottle">Bottle</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7c8583]">
                Details / Specifications
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. 50 Watt cool daylight · 1 year warranty"
                className="mt-1 w-full border border-[#cfd5d1] bg-white px-3 py-2.5 text-sm text-[#173d3b] outline-none focus:border-[#f28a2e]"
              />
            </div>

            {/* Product Image Upload */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7c8583]">
                Product Image (Supabase Storage: product-images)
              </label>
              <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center">
                {imagePreview ? (
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded border border-[#cfd5d1]">
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                      }}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded border border-dashed border-[#cfd5d1] bg-[#f9faf7] text-[#a0aaa7]">
                    <ImageIcon size={24} />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-xs text-[#5e6d75] file:mr-3 file:border-0 file:bg-[#113b52] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-[#184e6b]"
                  />
                  <p className="mt-1 text-[11px] text-[#7c8583]">
                    Upload a product photo. If skipped, standard category image will be assigned.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#ece9e1] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="border border-[#cfd5d1] px-5 py-2.5 text-xs font-semibold text-[#5e6d75] hover:bg-[#f0f1ed]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-[#f28a2e] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-[#df751c] disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Saving Stock...
                </>
              ) : (
                <>
                  <Check size={15} /> Confirm & Save to Inventory
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
