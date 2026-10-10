const fs = require('fs');
const path = require('path');

// Shop template generator
const shopCategories = [
  {
    name: "Grocery & Daily Essentials",
    shopImages: [
      "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&auto=format&fit=crop&q=80"
    ],
    products: [
      { title: "Basmati Rice 5 kg", desc: "Long-grain fragrant rice", price: 340, stock: 45, img: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80" },
      { title: "Toor Dal 1 kg", desc: "Clean polished premium pulses", price: 155, stock: 35, img: "https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=600&auto=format&fit=crop&q=80" },
      { title: "Aashirvaad Shudh Chakki Atta 5 kg", desc: "100% whole wheat flour", price: 245, stock: 50, img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80" },
      { title: "Fortune Sunflower Oil 1 L", desc: "Refined heart-healthy cooking oil", price: 148, stock: 40, img: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80" },
      { title: "Tata Salt 1 kg", desc: "Vacuum evaporated iodized salt", price: 28, stock: 80, img: "https://images.unsplash.com/photo-1518110903419-548c7c9c0b11?w=600&auto=format&fit=crop&q=80" },
      { title: "Red Label Tea 500 g", desc: "Brooke Bond strong blended tea", price: 260, stock: 30, img: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80" },
      { title: "Madhur Pure Sugar 1 kg", desc: "Refined sulfur-free crystals", price: 52, stock: 65, img: "https://images.unsplash.com/photo-1622484214149-14a9058b8d0e?w=600&auto=format&fit=crop&q=80" },
      { title: "Surf Excel Easy Wash 1 kg", desc: "Advanced stain removal detergent", price: 140, stock: 25, img: "https://images.unsplash.com/photo-1585670270608-b4be4fbcf05d?w=600&auto=format&fit=crop&q=80" }
    ]
  },
  {
    name: "Fresh Fruits & Vegetables",
    shopImages: [
      "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1543083477-4f785aeafaa9?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=800&auto=format&fit=crop&q=80"
    ],
    products: [
      { title: "Fresh Red Tomatoes 1 kg", desc: "Farm fresh juicy salad tomatoes", price: 35, stock: 60, img: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80" },
      { title: "Desi Onions 1 kg", desc: "Fresh harvest pungent onions", price: 30, stock: 75, img: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80" },
      { title: "Pahadi Potatoes 1 kg", desc: "Clean starchy fresh potatoes", price: 25, stock: 90, img: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&auto=format&fit=crop&q=80" },
      { title: "Shimla Green Apples 1 kg", desc: "Crisp and sweet fresh apples", price: 160, stock: 30, img: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80" },
      { title: "Robusta Bananas 1 Dozen", desc: "Naturally ripened sweet bananas", price: 50, stock: 40, img: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80" },
      { title: "Spicy Green Chilies 250 g", desc: "Fresh pungent cooking chilies", price: 20, stock: 50, img: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80" },
      { title: "Fresh Ginger 250 g", desc: "Aromatic pungent desi adrak", price: 30, stock: 35, img: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80" }
    ]
  },
  {
    name: "Home & Electrical Essentials",
    shopImages: [
      "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1563770660941-20978e870e26?w=800&auto=format&fit=crop&q=80"
    ],
    products: [
      { title: "Philips 9W LED Bulb B22", desc: "Cool daylight energy saving bulb", price: 85, stock: 50, img: "https://images.unsplash.com/photo-1507668077129-56e32842fceb?w=600&auto=format&fit=crop&q=80" },
      { title: "Havells 4-Way Extension Board", desc: "Surge protected 2m cord strip", price: 380, stock: 20, img: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80" },
      { title: "Anchor Roma 1-Way Switch 6A", desc: "Modular white flame retardant switch", price: 42, stock: 100, img: "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?w=600&auto=format&fit=crop&q=80" },
      { title: "Syska Rechargeable Mosquito Swatter", desc: "Electric insect racket with LED", price: 299, stock: 25, img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80" },
      { title: "Polycab 1.5 sq mm Wire 90m", desc: "FR PVC insulated copper wire coil", price: 1450, stock: 15, img: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80" },
      { title: "Crompton 1200mm Ceiling Fan", desc: "High-speed energy efficient fan", price: 1850, stock: 12, img: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80" }
    ]
  },
  {
    name: "Hardware & Tools",
    shopImages: [
      "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1508873696983-2df5703bc20d?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&auto=format&fit=crop&q=80"
    ],
    products: [
      { title: "Heavy Duty Claw Hammer 500g", desc: "Drop-forged steel with rubber grip", price: 220, stock: 30, img: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&auto=format&fit=crop&q=80" },
      { title: "Godrej Nav-Tal 7 Levers Brass Padlock", desc: "Hardened shackle high-security lock", price: 410, stock: 24, img: "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&auto=format&fit=crop&q=80" },
      { title: "Stanley 5m Steel Measuring Tape", desc: "Polymer-coated corrosion resistant tape", price: 160, stock: 40, img: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop&q=80" },
      { title: "Stainless Steel Screws Assortment Box", desc: "300-piece assorted drywall and wood screws", price: 180, stock: 50, img: "https://images.unsplash.com/photo-1508873696983-2df5703bc20d?w=600&auto=format&fit=crop&q=80" },
      { title: "Teflon Thread Seal Tape (Pack of 5)", desc: "Plumber tape for water leak prevention", price: 75, stock: 70, img: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&auto=format&fit=crop&q=80" },
      { title: "Tap Spindle Brass Replacement 1/2 inch", desc: "Heavy ceramic disc tap valve core", price: 110, stock: 35, img: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=600&auto=format&fit=crop&q=80" }
    ]
  },
  {
    name: "Stationery & Study Essentials",
    shopImages: [
      "https://images.unsplash.com/photo-1507842229451-77b103b47453?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=80"
    ],
    products: [
      { title: "Classmate Spiral Notebook 300 Pages", desc: "Single line ruled notebook with divider", price: 115, stock: 60, img: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=600&auto=format&fit=crop&q=80" },
      { title: "Reynolds 045 Ball Pens Pack of 10", desc: "Smooth smudge-free blue ballpoint pens", price: 80, stock: 70, img: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80" },
      { title: "JK Copier A4 Paper 75 GSM 500 Sheets", desc: "Ultra-white high-speed photocopy ream", price: 340, stock: 30, img: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80" },
      { title: "Camlin 12 Shades Acrylic Colours Set", desc: "Vibrant fast-drying hobby paints with brush", price: 195, stock: 25, img: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=80" },
      { title: "Casio Scientific Calculator FX-82MS", desc: "240 functions 2-line display student calculator", price: 580, stock: 15, img: "https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600&auto=format&fit=crop&q=80" },
      { title: "Fevicol MR Squeezy Glue Bottle 200g", desc: "Strong craft adhesive for paper and wood", price: 55, stock: 45, img: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80" }
    ]
  },
  {
    name: "Sweets, Bakery & Snacks",
    shopImages: [
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1579372786545-d24232daf58c?w=800&auto=format&fit=crop&q=80"
    ],
    products: [
      { title: "Famous Mandsaur Ratlami Sev 500g", desc: "Authentic spicy clove-infused gram flour sev", price: 140, stock: 45, img: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80" },
      { title: "Shudh Mawa Peda 500g", desc: "Traditional milk fudge garnished with cardamom", price: 240, stock: 20, img: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80" },
      { title: "Desi Ghee Kaju Katli 250g", desc: "Rich melt-in-mouth cashew diamond sweets", price: 260, stock: 25, img: "https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=600&auto=format&fit=crop&q=80" },
      { title: "Crispy Maskachaska Khari 400g", desc: "Fresh baked flaky tea-time puff pastry", price: 80, stock: 35, img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80" },
      { title: "Eggless Belgian Chocolate Cake 500g", desc: "Fresh baked creamy dark chocolate celebration cake", price: 380, stock: 10, img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80" }
    ]
  },
  {
    name: "Pharmacy & Wellness",
    shopImages: [
      "https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=800&auto=format&fit=crop&q=80"
    ],
    products: [
      { title: "Dolo 650mg Paracetamol Tablets 15s", desc: "Fever and pain relief medication strip", price: 32, stock: 80, img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80" },
      { title: "Dettol Antiseptic Liquid 250ml", desc: "Trusted disinfectant for cuts and hygiene", price: 125, stock: 40, img: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80" },
      { title: "Volini Joint & Muscle Pain Relief Spray 55g", desc: "Quick absorption micro-gel formulation", price: 155, stock: 30, img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80" },
      { title: "Digene Acidity & Gas Relief Mint Gel 200ml", desc: "Fast cooling soothing antacid syrup", price: 145, stock: 25, img: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=600&auto=format&fit=crop&q=80" },
      { title: "Band-Aid Washproof Strips Box of 20", desc: "Sterile protective wound dressing band", price: 60, stock: 60, img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80" }
    ]
  },
  {
    name: "Handmade Gifts & Flowers",
    shopImages: [
      "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80"
    ],
    products: [
      { title: "Fresh Dutch Rose Bouquet (10 Stems)", desc: "Hand-tied premium red roses with ribbon", price: 299, stock: 15, img: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&auto=format&fit=crop&q=80" },
      { title: "Mogra & Marigold Puja Garland Set", desc: "Fragrant fresh flowers for daily home temple", price: 60, stock: 30, img: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&auto=format&fit=crop&q=80" },
      { title: "Handcrafted Terracotta Diya & Candle Stand", desc: "Artisanal clay home decor and festive lighting", price: 180, stock: 20, img: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80" },
      { title: "Personalized Handmade Wooden Photo Frame", desc: "Rustic tabletop photo frame 5x7 inches", price: 240, stock: 15, img: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80" }
    ]
  },
  {
    name: "Clothing & Footwear",
    shopImages: [
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&auto=format&fit=crop&q=80"
    ],
    products: [
      { title: "Cotton Casual Men's Full Sleeve Shirt", desc: "Breathable 100% cotton regular fit shirt", price: 540, stock: 20, img: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80" },
      { title: "Traditional Chanderi Printed Kurti", desc: "Elegant ethnic daily wear cotton kurti", price: 490, stock: 25, img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80" },
      { title: "Comfort Foam Daily Wear Flip-Flops", desc: "Lightweight water-resistant non-slip slippers", price: 199, stock: 35, img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80" },
      { title: "Classic Stretchable Blue Denim Jeans", desc: "Durable mid-rise slim comfort fit jeans", price: 799, stock: 18, img: "https://images.unsplash.com/photo-1542272604-780c96856592?w=600&auto=format&fit=crop&q=80" }
    ]
  }
];

// 50 Realistic Mandsaur shops across 3 radius bands
// Center: 24.0722, 75.0694
const shopsConfig = [
  // --- BAND 1: 0.5 km to 1.8 km (Radius <= 2 km) [20 Shops] ---
  { name: "MDS Super Kirana", catIdx: 0, area: "Gandhi Chowk", landmark: "Near Gandhi Chauraha", lat: 24.0672, lng: 75.0701, type: "permanent", open: "07:30", close: "21:30" },
  { name: "Shree Balaji Provision Store", catIdx: 0, area: "Dhan Mandi", landmark: "Old Mandi Road", lat: 24.0664, lng: 75.0718, type: "permanent", open: "08:00", close: "21:00" },
  { name: "Kisan Sabzi Mandi Stalls", catIdx: 1, area: "Sarafa Bazaar", landmark: "Vegetable Alley", lat: 24.0625, lng: 75.0712, type: "temporary", open: "06:00", close: "13:00" },
  { name: "Jain Brothers Grocery", catIdx: 0, area: "Jankupura", landmark: "Jankupura Main Gate", lat: 24.0649, lng: 75.0731, type: "permanent", open: "08:00", close: "21:00" },
  { name: "Navneet Pustak & Stationers", catIdx: 4, area: "Kalakhet", landmark: "Near Jain Temple", lat: 24.0735, lng: 75.0740, type: "permanent", open: "09:00", close: "21:00" },
  { name: "Bherulal Ji Namkeen & Poha", catIdx: 5, area: "Tower Chowk", landmark: "Opposite Clock Tower", lat: 24.0689, lng: 75.0687, type: "permanent", open: "06:30", close: "22:00" },
  { name: "Goyal Electricals & Lights", catIdx: 2, area: "Tower Chowk", landmark: "Near Municipal Council", lat: 24.0693, lng: 75.0698, type: "permanent", open: "09:30", close: "20:30" },
  { name: "Station Road Fruit Corner", catIdx: 1, area: "Station Road", landmark: "Outside Railway Reservation", lat: 24.0715, lng: 75.0665, type: "temporary", open: "07:00", close: "21:30" },
  { name: "Mandsaur Hardware House", catIdx: 3, area: "Station Road", landmark: "Railway Station Market", lat: 24.0704, lng: 75.0649, type: "permanent", open: "09:00", close: "20:30" },
  { name: "Sanjivani Medical & General", catIdx: 6, area: "District Hospital Road", landmark: "Opposite Hospital Gate 1", lat: 24.0740, lng: 75.0720, type: "permanent", open: "24 Hours", close: "24 Hours" },
  { name: "Mogra Flowers & Gift Center", catIdx: 7, area: "Gandhi Chowk", landmark: "Flower Market Lane", lat: 24.0677, lng: 75.0708, type: "permanent", open: "06:30", close: "21:30" },
  { name: "Sanwariya Sweets & Dairy", catIdx: 5, area: "Nai Abadi", landmark: "Near Water Tank", lat: 24.0808, lng: 75.0672, type: "permanent", open: "07:00", close: "22:00" },
  { name: "Mahavir Cloth Store", catIdx: 8, area: "Sarafa Bazaar", landmark: "Cloth Market Row", lat: 24.0618, lng: 75.0719, type: "permanent", open: "10:00", close: "20:30" },
  { name: "Patel Sanitary & Hardware", catIdx: 3, area: "Kalakhet", landmark: "Near Old Bus Stand", lat: 24.0725, lng: 75.0735, type: "permanent", open: "09:00", close: "20:00" },
  { name: "Student Corner Xerox & Stationery", catIdx: 4, area: "College Road", landmark: "Opp. Govt PG College", lat: 24.0752, lng: 75.0730, type: "permanent", open: "08:30", close: "20:30" },
  { name: "Shree Annapurna Kirana", catIdx: 0, area: "Bus Stand", landmark: "Main Bus Terminal Row", lat: 24.0736, lng: 75.0693, type: "permanent", open: "07:00", close: "22:00" },
  { name: "Apollo Partner Medicos", catIdx: 6, area: "Nai Abadi", landmark: "Mhow Neemuch Main", lat: 24.0820, lng: 75.0665, type: "permanent", open: "08:00", close: "23:00" },
  { name: "Fresh Basket Veggies (Thela)", catIdx: 1, area: "Bus Stand", landmark: "Near Auto Stand", lat: 24.0745, lng: 75.0699, type: "temporary", open: "07:00", close: "20:00" },
  { name: "Om Sai Electrical & Electronics", catIdx: 2, area: "Station Road", landmark: "Electrical Market", lat: 24.0709, lng: 75.0667, type: "permanent", open: "09:30", close: "20:30" },
  { name: "Royal Footwear & Bags", catIdx: 8, area: "Gandhi Chowk", landmark: "Main Square", lat: 24.0670, lng: 75.0695, type: "permanent", open: "10:30", close: "21:00" },

  // --- BAND 2: 2.2 km to 4.8 km (Radius 3 - 5 km) [18 Shops] ---
  { name: "Kisan Iron Works & Tools", catIdx: 3, area: "New Krishi Upaj Mandi", landmark: "Bhunyakhedi Road", lat: 24.0880, lng: 75.0790, type: "permanent", open: "08:00", close: "19:30" },
  { name: "Mhow-Neemuch Highway Mart", catIdx: 0, area: "Mhow-Neemuch Road", landmark: "Near Toll Gate Old", lat: 24.0980, lng: 75.0560, type: "permanent", open: "07:00", close: "23:00" },
  { name: "Green Valley Nursery & Flowers", catIdx: 7, area: "Yuvraj Club Bypass", landmark: "Bypass Junction", lat: 24.0890, lng: 75.0470, type: "permanent", open: "07:30", close: "19:00" },
  { name: "Rewas Dewda Dairy & Bakery", catIdx: 5, area: "Rewas Dewda Road", landmark: "Near Bridge Point", lat: 24.0920, lng: 75.0930, type: "permanent", open: "06:30", close: "21:30" },
  { name: "Sanjeet Road Agro & Seeds", catIdx: 3, area: "Sanjeet Road", landmark: "Outer Checkpost", lat: 24.0560, lng: 75.0380, type: "permanent", open: "08:30", close: "19:30" },
  { name: "Fresh Orchard Fruits Mobile Cart", catIdx: 1, area: "Overbridge Service Road", landmark: "Overbridge Circle", lat: 24.0810, lng: 75.0840, type: "temporary", open: "08:00", close: "20:00" },
  { name: "Arihant Lights & Home Decor", catIdx: 2, area: "Overbridge Bypass", landmark: "Overbridge Market", lat: 24.0790, lng: 75.0820, type: "permanent", open: "10:00", close: "21:00" },
  { name: "Janta Daily Needs Kirana", catIdx: 0, area: "Bhunyakhedi", landmark: "Village Cross Road", lat: 24.0950, lng: 75.0850, type: "permanent", open: "07:00", close: "21:00" },
  { name: "City Care Chemist & Wellness", catIdx: 6, area: "Sanjeet Road", landmark: "Sanjeet Naka Chowk", lat: 24.0590, lng: 75.0490, type: "permanent", open: "08:00", close: "22:00" },
  { name: "Bypass Fast Fashion Point", catIdx: 8, area: "Yuvraj Club", landmark: "Shopping Arcade", lat: 24.0860, lng: 75.0440, type: "permanent", open: "10:30", close: "21:30" },
  { name: "Mandsaur Book House Extension", catIdx: 4, area: "Mhow Neemuch Bypass", landmark: "Near DPS School", lat: 24.1020, lng: 75.0590, type: "permanent", open: "09:00", close: "20:00" },
  { name: "Kisan Mandi Fresh Veg Stalls", catIdx: 1, area: "Krishi Mandi Gate 2", landmark: "Mandi Gate", lat: 24.0870, lng: 75.0760, type: "temporary", open: "06:00", close: "14:00" },
  { name: "National Highway Hardware", catIdx: 3, area: "Mhow-Neemuch Highway", landmark: "HP Petrol Pump", lat: 24.1040, lng: 75.0520, type: "permanent", open: "08:30", close: "20:30" },
  { name: "Shree Krishna Bakery & Cafe", catIdx: 5, area: "Sanjeet Road", landmark: "Near ITI College", lat: 24.0530, lng: 75.0410, type: "permanent", open: "08:00", close: "22:30" },
  { name: "Shubh Labh General Mart", catIdx: 0, area: "Rewas Dewda Road", landmark: "Housing Board Colony", lat: 24.0860, lng: 75.0990, type: "permanent", open: "07:30", close: "21:30" },
  { name: "Pawan Electrical Spares", catIdx: 2, area: "Krishi Mandi Service Rd", landmark: "Warehouse Lane", lat: 24.0895, lng: 75.0775, type: "permanent", open: "09:00", close: "20:00" },
  { name: "Handicrafts & Mitti Bartan", catIdx: 7, area: "Mhow Road", landmark: "Near Flyover Foot", lat: 24.0930, lng: 75.0620, type: "temporary", open: "09:00", close: "19:00" },
  { name: "LifeLine Pharmacy Express", catIdx: 6, area: "Rewas Dewda Highway", landmark: "Near Shanti Kunj", lat: 24.0880, lng: 75.0960, type: "permanent", open: "08:00", close: "22:00" },

  // --- BAND 3: 5.5 km to 9.8 km (Radius 6 - 10 km) [12 Shops] ---
  { name: "Multanpura Kisan Seva Kendra", catIdx: 3, area: "Multanpura", landmark: "Main Multanpura Chauraha", lat: 24.0200, lng: 75.1050, type: "permanent", open: "08:00", close: "19:00" },
  { name: "Multanpura Village Kirana", catIdx: 0, area: "Multanpura", landmark: "Panchayat Bhawan", lat: 24.0220, lng: 75.1020, type: "permanent", open: "07:00", close: "21:00" },
  { name: "Daloda Mandi Sabzi Depot", catIdx: 1, area: "Daloda", landmark: "Daloda Sub Mandi", lat: 23.9920, lng: 75.0810, type: "temporary", open: "06:30", close: "13:30" },
  { name: "Daloda Mega Provision Store", catIdx: 0, area: "Daloda Center", landmark: "Railway Gate Road", lat: 23.9880, lng: 75.0790, type: "permanent", open: "07:30", close: "21:30" },
  { name: "Sitamau Phata Highway Mart", catIdx: 0, area: "Sitamau Road", landmark: "Phata Junction", lat: 24.1250, lng: 75.1320, type: "permanent", open: "06:00", close: "23:00" },
  { name: "Highway Farmers Fresh Cart", catIdx: 1, area: "Highway Toll Road", landmark: "Near Toll Plaza", lat: 24.1350, lng: 75.0200, type: "temporary", open: "07:00", close: "20:00" },
  { name: "Suwasra Link Agro Supplies", catIdx: 3, area: "Suwasra Link Road", landmark: "Suwasra Turn", lat: 24.0380, lng: 75.1610, type: "permanent", open: "08:30", close: "19:00" },
  { name: "Daloda Health Care & Chemist", catIdx: 6, area: "Daloda", landmark: "Bus Stand Daloda", lat: 23.9910, lng: 75.0830, type: "permanent", open: "08:00", close: "21:30" },
  { name: "Piplia Road Sweets & Snacks", catIdx: 5, area: "Piplia Road", landmark: "Highway Midway", lat: 24.1480, lng: 75.0320, type: "permanent", open: "07:00", close: "22:00" },
  { name: "Guradia Rural Electricals", catIdx: 2, area: "Guradia Deda", landmark: "Main Village Square", lat: 24.0450, lng: 75.0210, type: "permanent", open: "09:00", close: "20:00" },
  { name: "Sitamau Road Stationery & Cyber", catIdx: 4, area: "Sitamau Road", landmark: "Near High School", lat: 24.1200, lng: 75.1280, type: "permanent", open: "08:30", close: "20:00" },
  { name: "Toll Plaza Highway Dhaba & Sweets", catIdx: 5, area: "Fourlane Highway", landmark: "Midway Parking", lat: 24.1380, lng: 75.0180, type: "permanent", open: "06:00", close: "23:30" }
];

console.log(`Generated ${shopsConfig.length} realistic shops.`);

let sql = `-- =========================================================================
-- NearGO Realistic Mandsaur Dataset & Phase 2 Schema Upgrades
-- Run this complete script in Supabase SQL Editor.
-- =========================================================================

-- 1. Create shop_reviews table if it doesn't exist
create table if not exists public.shop_reviews (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on shop_reviews
alter table public.shop_reviews enable row level security;

-- Policies for shop_reviews
drop policy if exists "Allow public read on shop_reviews" on public.shop_reviews;
create policy "Allow public read on shop_reviews" on public.shop_reviews for select using (true);

drop policy if exists "Allow authenticated customer insert review" on public.shop_reviews;
create policy "Allow authenticated customer insert review" on public.shop_reviews
  for insert with check (auth.uid() = customer_id);

drop policy if exists "Allow customer update own review" on public.shop_reviews;
create policy "Allow customer update own review" on public.shop_reviews
  for update using (auth.uid() = customer_id);

drop policy if exists "Allow customer delete own review" on public.shop_reviews;
create policy "Allow customer delete own review" on public.shop_reviews
  for delete using (auth.uid() = customer_id);

-- 2. Add stock freshness columns to products table if missing
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name = 'last_updated_at') then
    alter table public.products add column last_updated_at timestamptz default now();
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'products' and column_name = 'status') then
    alter table public.products add column status text default 'active' check (status in ('active', 'draft'));
  end if;
end $$;

-- 3. Stock Freshness Cron / Stored Procedure
create or replace function public.process_stock_freshness()
returns void
language plpgsql
as $$
begin
  -- Mark products unconfirmed for 5+ days as draft (hidden from discovery)
  update public.products
  set status = 'draft'
  where status = 'active'
    and coalesce(last_updated_at, created_at) < now() - interval '5 days';

  -- Automatically delete products unconfirmed for 10+ days
  delete from public.products
  where coalesce(last_updated_at, created_at) < now() - interval '10 days';
end;
$$;

-- Try scheduling via pg_cron if extension exists
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('daily-stock-freshness');
    perform cron.schedule('daily-stock-freshness', '0 3 * * *', 'select public.process_stock_freshness();');
  end if;
exception when others then
  raise notice 'pg_cron extension not active or permission restricted; function process_stock_freshness can be invoked via webhooks/cron';
end $$;

-- 4. Delete old CSV demo products and demo shops (PRESERVING real authenticated user shops)
-- We identify demo shops as those whose owner_id is either '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90' or not in profiles
delete from public.order_items where product_id in (select id from public.products where shop_id in (select id from public.shops where owner_id = '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90' or owner_id not in (select id from auth.users)));
delete from public.products where shop_id in (select id from public.shops where owner_id = '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90' or owner_id not in (select id from auth.users));
delete from public.shops where owner_id = '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90' or owner_id not in (select id from auth.users);

-- Ensure a demo owner profile exists for foreign key references
do $$
declare
  demo_uuid uuid := '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90';
begin
  if not exists (select 1 from public.profiles where id = demo_uuid) then
    insert into public.profiles (id, full_name, role, username)
    values (demo_uuid, 'Mandsaur Merchant Partner', 'seller', 'mandsaur_demo_merchant');
  end if;
exception when others then
  -- Ignore if profiles has strict auth.users fk
  null;
end $$;

-- 5. Insert 50 Realistic Mandsaur Shops and Products
`;

const demoOwnerId = '7c2e4b7a-2c58-4e64-9d1a-4b5e6f7a8c90';

shopsConfig.forEach((s, idx) => {
  const shopId = `a${String(idx + 1).padStart(2, '0')}00000-0000-0000-0000-0000000000${String(idx + 1).padStart(2, '0')}`;
  const cat = shopCategories[s.catIdx];
  const shopImg = cat.shopImages[idx % cat.shopImages.length];
  const desc = `${s.name} in ${s.area}, Mandsaur. Serving verified ${cat.name} with timely local delivery and counter pickup.`;

  sql += `
-- Shop ${idx + 1}: ${s.name} (${s.area})
insert into public.shops (
  id, owner_id, shop_name, category, shop_type, address, landmark, city, pincode,
  latitude, longitude, shop_image, description, opening_time, closing_time, current_area, is_live
) values (
  '${shopId}', '${demoOwnerId}', '${s.name.replace(/'/g, "''")}', '${cat.name.replace(/'/g, "''")}', '${s.type}',
  '${s.area.replace(/'/g, "''")}, Mandsaur', '${s.landmark.replace(/'/g, "''")}', 'Mandsaur', '458001',
  ${s.lat}, ${s.lng}, '${shopImg}', '${desc.replace(/'/g, "''")}',
  '${s.open}', '${s.close}', '${s.area.replace(/'/g, "''")}', true
) on conflict (id) do update set
  shop_name = excluded.shop_name,
  category = excluded.category,
  shop_type = excluded.shop_type,
  address = excluded.address,
  landmark = excluded.landmark,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  shop_image = excluded.shop_image,
  description = excluded.description,
  opening_time = excluded.opening_time,
  closing_time = excluded.closing_time,
  current_area = excluded.current_area;
`;

  // Insert 6 to 8 unique products for this shop
  cat.products.forEach((p, pIdx) => {
    const prodId = `b${String(idx + 1).padStart(2, '0')}00000-0000-0000-0000-0000000000${String(pIdx + 1).padStart(2, '0')}`;
    // slight price variation by shop so prices look realistic
    const priceVariance = (idx % 5) * 5;
    const finalPrice = Math.max(10, p.price + (priceVariance - 10));

    sql += `insert into public.products (
  id, shop_id, title, description, price, category, stock, image_url, last_updated_at, status
) values (
  '${prodId}', '${shopId}', '${p.title.replace(/'/g, "''")}', '${p.desc.replace(/'/g, "''")}',
  ${finalPrice}, '${cat.name.replace(/'/g, "''")}', ${p.stock}, '${p.img}', now(), 'active'
) on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  price = excluded.price,
  category = excluded.category,
  stock = excluded.stock,
  image_url = excluded.image_url,
  last_updated_at = now(),
  status = 'active';
`;
  });
});

sql += `
-- 6. Updated Nearby Products RPC with Status Filter and Shop Details
create or replace function public.nearby_products(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision default 10.0,
  search_text text default null
)
returns table (
  id uuid,
  shop_id uuid,
  title text,
  description text,
  price numeric,
  category text,
  stock integer,
  image_url text,
  created_at timestamptz,
  last_updated_at timestamptz,
  status text,
  shop_name text,
  shop_category text,
  shop_type text,
  shop_address text,
  current_area text,
  distance_km double precision,
  avg_rating numeric,
  reviews_count bigint
)
language sql
stable
as $$
  select
    p.id,
    p.shop_id,
    p.title,
    p.description,
    p.price,
    p.category,
    p.stock,
    p.image_url,
    p.created_at,
    p.last_updated_at,
    p.status,
    s.shop_name,
    s.category as shop_category,
    s.shop_type,
    s.address as shop_address,
    s.current_area,
    round(
      (6371 * acos(
        least(1.0, greatest(-1.0,
          cos(radians(user_lat)) * cos(radians(coalesce(s.latitude, user_lat))) *
          cos(radians(coalesce(s.longitude, user_lng)) - radians(user_lng)) +
          sin(radians(user_lat)) * sin(radians(coalesce(s.latitude, user_lat)))
        ))
      ))::numeric, 2
    )::double precision as distance_km,
    coalesce(round(avg(r.rating)::numeric, 1), 4.5) as avg_rating,
    count(r.id) as reviews_count
  from public.products p
  join public.shops s on p.shop_id = s.id
  left join public.shop_reviews r on r.shop_id = s.id
  where
    s.latitude is not null
    and s.longitude is not null
    and (p.status is null or p.status = 'active')
    and (6371 * acos(
      least(1.0, greatest(-1.0,
        cos(radians(user_lat)) * cos(radians(s.latitude)) *
        cos(radians(s.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(s.latitude))
      ))
    )) <= radius_km
    and (
      search_text is null 
      or search_text = ''
      or p.title ilike '%' || search_text || '%'
      or p.category ilike '%' || search_text || '%'
      or s.shop_name ilike '%' || search_text || '%'
      or s.current_area ilike '%' || search_text || '%'
    )
  group by p.id, s.id
  order by distance_km asc, p.created_at desc;
$$;

-- 7. Updated Nearby Shops RPC with Avg Rating
create or replace function public.nearby_shops(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision default 10.0
)
returns table (
  id uuid,
  owner_id uuid,
  shop_name text,
  category text,
  shop_type text,
  address text,
  landmark text,
  city text,
  pincode text,
  latitude double precision,
  longitude double precision,
  shop_image text,
  current_area text,
  is_live boolean,
  distance_km double precision,
  avg_rating numeric,
  reviews_count bigint
)
language sql
stable
as $$
  select
    s.id,
    s.owner_id,
    s.shop_name,
    s.category,
    s.shop_type,
    s.address,
    s.landmark,
    s.city,
    s.pincode,
    s.latitude,
    s.longitude,
    s.shop_image,
    s.current_area,
    s.is_live,
    round(
      (6371 * acos(
        least(1.0, greatest(-1.0,
          cos(radians(user_lat)) * cos(radians(coalesce(s.latitude, user_lat))) *
          cos(radians(coalesce(s.longitude, user_lng)) - radians(user_lng)) +
          sin(radians(user_lat)) * sin(radians(coalesce(s.latitude, user_lat)))
        ))
      ))::numeric, 2
    )::double precision as distance_km,
    coalesce(round(avg(r.rating)::numeric, 1), 4.6) as avg_rating,
    count(r.id) as reviews_count
  from public.shops s
  left join public.shop_reviews r on r.shop_id = s.id
  where
    s.latitude is not null
    and s.longitude is not null
    and (6371 * acos(
      least(1.0, greatest(-1.0,
        cos(radians(user_lat)) * cos(radians(s.latitude)) *
        cos(radians(s.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(s.latitude))
      ))
    )) <= radius_km
  group by s.id
  order by distance_km asc;
$$;
`;

const outputPath = path.join(__dirname, 'database', 'seed', 'realistic_mandsaur_seed.sql');
fs.writeFileSync(outputPath, sql, 'utf8');
console.log(`Saved SQL to ${outputPath} (${sql.length} bytes)`);
