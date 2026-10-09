export const currentShop = {
  id: "sharma-electricals",
  name: "Sharma Electricals",
  ownerName: "Amit Sharma",
  category: "Electricals & Lighting",
  phone: "+91 98270 11223",
  address: "14 Siyaganj Market, Indore",
  city: "Indore",
  rating: "4.8",
  isOpen: true,
  acceptsReservations: true,
};

export const shopkeeperProducts = [
  { id: 101, name: "Philips LED Bulb", category: "Electrical", price: 149, quantity: 24, stockStatus: "In stock", emoji: "💡" },
  { id: 102, name: "Anchor Roma Switch", category: "Switches", price: 89, quantity: 7, stockStatus: "Low stock", emoji: "🔌" },
  { id: 103, name: "Havells Wire 90m", category: "Wiring", price: 1299, quantity: 0, stockStatus: "Out of stock", emoji: "🧵" },
  { id: 104, name: "LED Panel Light", category: "Lighting", price: 699, quantity: 15, stockStatus: "In stock", emoji: "💡" },
  { id: 105, name: "Modular Plate", category: "Switches", price: 119, quantity: 4, stockStatus: "Low stock", emoji: "▦" },
];

export const shopkeeperReservations = [
  { id: "NG-1048", customerName: "Rahul Sharma", productName: "Philips LED Bulb", quantity: 2, total: 298, pickupTime: "Today · 4:30 PM", status: "Pending" },
  { id: "NG-1047", customerName: "Priya Verma", productName: "Anchor Roma Switch", quantity: 4, total: 356, pickupTime: "Today · 6:00 PM", status: "Confirmed" },
  { id: "NG-1046", customerName: "Mohit Jain", productName: "LED Panel Light", quantity: 1, total: 699, pickupTime: "Tomorrow · 11:00 AM", status: "Ready" },
];
