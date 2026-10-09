export const adminStats = {
  totalCustomers: 1284,
  activeShops: 86,
  pendingShopApprovals: 7,
  todayReservations: 42,
  monthlyRevenue: 284650,
  openIssues: 12,
};

export const adminUsers = [
  { id: "CUS-1001", name: "Rahul Sharma", email: "rahul@example.com", phone: "+91 98765 43210", type: "Customer", status: "Active", joined: "Today" },
  { id: "CUS-1002", name: "Priya Verma", email: "priya@example.com", phone: "+91 98270 11223", type: "Customer", status: "Active", joined: "Yesterday" },
  { id: "SHP-2048", name: "Amit Sharma", email: "sharma@example.com", phone: "+91 98270 11223", type: "Shopkeeper", status: "Pending review", joined: "Today" },
  { id: "SHP-2047", name: "Neeraj Gupta", email: "gupta@example.com", phone: "+91 98930 44321", type: "Shopkeeper", status: "Active", joined: "2 days ago" },
];

export const adminShops = [
  { id: "sharma-electricals", name: "Sharma Electricals", owner: "Amit Sharma", category: "Electricals & Lighting", city: "Indore", rating: "4.8", status: "Pending approval", products: 24 },
  { id: "gupta-hardware", name: "Gupta Hardware", owner: "Neeraj Gupta", category: "Hardware & Tools", city: "Indore", rating: "4.5", status: "Active", products: 38 },
  { id: "city-book-store", name: "City Book Store", owner: "Kavita Jain", category: "Stationery & Books", city: "Indore", rating: "4.7", status: "Active", products: 61 },
  { id: "new-mobile-hub", name: "New Mobile Hub", owner: "Rakesh Singh", category: "Mobile & Accessories", city: "Ujjain", rating: "—", status: "Suspended", products: 0 },
];

export const adminReservations = [
  { id: "NG-1048", customer: "Rahul Sharma", shop: "Sharma Electricals", product: "Philips LED Bulb", total: 298, status: "Pending", created: "10 min ago" },
  { id: "NG-1047", customer: "Priya Verma", shop: "Gupta Hardware", product: "Anchor Roma Switch", total: 356, status: "Confirmed", created: "45 min ago" },
  { id: "NG-1046", customer: "Mohit Jain", shop: "City Book Store", product: "Classmate Notebook", total: 65, status: "Completed", created: "Yesterday" },
  { id: "NG-1045", customer: "Anjali Mehta", shop: "New Mobile Hub", product: "USB-C Cable", total: 299, status: "Cancelled", created: "Yesterday" },
];

export const adminActivity = [
  { title: "New shop registration", text: "Sharma Electricals submitted documents", time: "10 min ago", tone: "orange" },
  { title: "Reservation completed", text: "NG-1046 was marked as picked up", time: "32 min ago", tone: "green" },
  { title: "Customer report received", text: "Product availability mismatch reported", time: "1 hr ago", tone: "red" },
];
