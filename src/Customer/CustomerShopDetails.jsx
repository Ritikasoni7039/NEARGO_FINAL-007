import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  Heart,
  Home,
  MapPin,
  Navigation,
  Package,
  Phone,
  Store,
  Star,
  User,
  Send,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { customerProducts, customerShops } from "../Customer/CustomerData";

const CustomerShopDetails = () => {
  const navigate = useNavigate();
  const { shopId } = useParams();

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Review submission state
  const [userRating, setUserRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewNotice, setReviewNotice] = useState("");
  const [editingReviewId, setEditingReviewId] = useState(null);

  // 1. Fetch current session, shop, products, and reviews
  useEffect(() => {
    let isMounted = true;

    const loadShopData = async () => {
      setLoading(true);
      try {
        // Current user
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user || null;
        if (isMounted) setCurrentUser(user);

        // Fetch shop
        let fetchedShop = null;
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shopId);

        if (isUuid) {
          const { data: dbShop } = await supabase
            .from("shops")
            .select("*")
            .eq("id", shopId)
            .maybeSingle();

          if (dbShop) {
            fetchedShop = {
              id: dbShop.id,
              name: dbShop.shop_name,
              category: dbShop.category,
              address: dbShop.address || `${dbShop.landmark || ""}, Mandsaur`,
              distance: "1.2 km away",
              phone: "+91 98260 12345",
              open: true,
              openingTime: dbShop.opening_time || "08:00 AM",
              closingTime: dbShop.closing_time || "09:00 PM",
              shopImage: dbShop.shop_image,
              description: dbShop.description || "Local merchant in Mandsaur offering verified stock.",
              shopType: dbShop.shop_type || "permanent",
              currentArea: dbShop.current_area,
            };
          }
        }

        // Fallback to mock shop
        if (!fetchedShop) {
          fetchedShop = customerShops[shopId] || customerShops["sharma-electricals"] || {
            id: shopId,
            name: "Local Shop",
            category: "General",
            address: "Mandsaur, MP",
            distance: "1.5 km",
            phone: "+91 98260 12345",
            open: true,
            openingTime: "08:00 AM",
            closingTime: "09:00 PM",
            description: "Authentic local store in Mandsaur.",
          };
        }
        if (isMounted) setShop(fetchedShop);

        // Fetch products for this shop
        if (isUuid) {
          const { data: dbProds } = await supabase
            .from("products")
            .select("*")
            .eq("shop_id", shopId)
            .order("created_at", { ascending: false });

          if (dbProds && dbProds.length > 0) {
            if (isMounted) {
              setProducts(
                dbProds.map((p) => ({
                  id: p.id,
                  name: p.title,
                  category: p.category,
                  details: p.description,
                  price: Number(p.price),
                  stock: Number(p.stock) > 0 ? "In stock" : "Out of stock",
                  image: p.image_url || "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=700&q=85",
                  emoji: "📦",
                }))
              );
            }
          } else {
            // fallback mock products matching shop category
            if (isMounted) setProducts(customerProducts.slice(0, 6));
          }
        } else {
          if (isMounted) setProducts(customerProducts.filter((p) => p.shopId === fetchedShop.id) || customerProducts.slice(0, 5));
        }

        // Fetch reviews from shop_reviews table
        if (isUuid) {
          const { data: dbReviews, error: revErr } = await supabase
            .from("shop_reviews")
            .select("id, shop_id, customer_id, rating, comment, created_at, profiles(full_name, avatar_url, username)")
            .eq("shop_id", shopId)
            .order("created_at", { ascending: false });

          if (!revErr && dbReviews) {
            if (isMounted) setReviews(dbReviews);
          }
        }
      } catch (err) {
        console.error("Shop details error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadShopData();
    return () => {
      isMounted = false;
    };
  }, [shopId]);

  // Compute average rating
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0) / reviews.length).toFixed(1)
    : "4.7";

  // Check if current user already reviewed
  const userExistingReview = currentUser
    ? reviews.find((r) => r.customer_id === currentUser.id)
    : null;

  // Handle review submit
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please login first to submit a review.");
      navigate("/CustomerLogin");
      return;
    }

    if (!reviewComment.trim()) {
      setReviewNotice("Please write a short comment about your experience.");
      return;
    }

    setSubmittingReview(true);
    setReviewNotice("");

    try {
      if (editingReviewId) {
        // Update existing review
        const { error } = await supabase
          .from("shop_reviews")
          .update({
            rating: userRating,
            comment: reviewComment.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingReviewId);

        if (error) throw error;

        setReviews((prev) =>
          prev.map((r) =>
            r.id === editingReviewId
              ? { ...r, rating: userRating, comment: reviewComment.trim() }
              : r
          )
        );
        setReviewNotice("Your review has been updated!");
      } else {
        // Insert new review
        const { data, error } = await supabase
          .from("shop_reviews")
          .insert([
            {
              shop_id: shop.id,
              customer_id: currentUser.id,
              rating: userRating,
              comment: reviewComment.trim(),
            },
          ])
          .select("*, profiles(full_name, avatar_url, username)")
          .single();

        if (error) throw error;

        const newReview = data || {
          id: Date.now().toString(),
          shop_id: shop.id,
          customer_id: currentUser.id,
          rating: userRating,
          comment: reviewComment.trim(),
          created_at: new Date().toISOString(),
          profiles: { full_name: currentUser.user_metadata?.full_name || "Customer" },
        };

        setReviews((prev) => [newReview, ...prev]);
        setReviewNotice("Thank you! Your review was submitted successfully.");
      }

      setReviewComment("");
      setEditingReviewId(null);
      setTimeout(() => setReviewNotice(""), 3500);
    } catch (err) {
      console.error("Submit review error:", err);
      setReviewNotice(`Could not save review: ${err.message || "Please check connection"}`);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditReview = (r) => {
    setEditingReviewId(r.id);
    setUserRating(r.rating);
    setReviewComment(r.comment);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete your review?")) return;
    try {
      await supabase.from("shop_reviews").delete().eq("id", reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      setReviewNotice("Review deleted.");
      setTimeout(() => setReviewNotice(""), 2500);
    } catch (err) {
      console.error("Delete review error:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f4] flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-[#113b52]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f4] pb-[calc(5.8rem+env(safe-area-inset-bottom))] text-[#173d3b]">
      <header className="border-b border-[#e3e2dc] bg-[#fffdfa]">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-5 sm:px-8 lg:px-12">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full p-2 text-[#5e6d75] hover:bg-[#f0f1ed]"
            aria-label="Go back"
          >
            <ArrowLeft size={19} />
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f28a2e]">
              Verified Local Shop
            </p>
            <h1 className="text-2xl font-semibold tracking-[-0.04em]">
              {shop?.name}
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-12">
        {/* Hero Section */}
        <section className="bg-[#113b52] p-7 text-white sm:p-10 rounded-2xl shadow-sm">
          <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#f28a2e] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                  {shop?.category}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-[#f5b77b]">
                  <Star size={14} fill="currentColor" /> {avgRating} ({reviews.length} reviews)
                </span>
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em] sm:text-5xl">
                {shop?.name}
              </h2>
              <p className="mt-4 flex items-center gap-2 text-sm text-white/70">
                <MapPin size={16} className="text-[#f28a2e]" />
                {shop?.address} {shop?.currentArea ? `(${shop.currentArea})` : ""} · {shop?.distance}
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => window.open(`tel:${shop?.phone}`)}
                className="flex items-center gap-2 bg-[#f28a2e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#df751c]"
              >
                <Phone size={16} /> Call shop
              </button>
              <button
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${shop?.name} ${shop?.address}`
                    )}`
                  )
                }
                className="flex items-center gap-2 border border-white/30 px-5 py-3 text-sm font-bold text-white hover:bg-white/10 transition"
              >
                <Navigation size={16} /> Directions
              </button>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Left Column: Details & Reviews */}
          <section className="space-y-6">
            <div className="border border-[#e4e1d9] bg-[#fffdfa] p-5 sm:p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f28a2e]">
                About this shop
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em]">
                {shop?.open ? "Open today" : "Closed now"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#7c8583]">
                {shop?.description}
              </p>

              <div className="mt-5 space-y-3 border-t border-[#ece9e1] pt-4 text-sm text-[#5e6d75]">
                <div className="flex items-center gap-3">
                  <Clock3 size={18} className="text-[#f28a2e]" />
                  Operating Hours: {shop?.openingTime} - {shop?.closingTime}
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-[#f28a2e]" />
                  {shop?.phone}
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-[#f28a2e]" />
                  {shop?.address}
                </div>
              </div>
            </div>

            {/* Customer Reviews Section */}
            <div className="border border-[#e4e1d9] bg-[#fffdfa] p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#ece9e1] pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f28a2e]">
                    Customer Feedback
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold tracking-[-0.05em]">
                    Reviews & Ratings
                  </h3>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xl font-bold text-[#b75d17]">
                    <Star size={20} fill="currentColor" /> {avgRating}
                  </div>
                  <p className="text-[11px] text-[#7c8583]">{reviews.length} total reviews</p>
                </div>
              </div>

              {reviewNotice && (
                <div className="mt-4 flex items-center gap-2 border border-green-200 bg-green-50 p-3 text-xs font-bold text-green-700">
                  <Check size={16} /> {reviewNotice}
                </div>
              )}

              {/* Add / Edit Review Form */}
              <form onSubmit={handleReviewSubmit} className="mt-5 rounded-xl border border-[#e4e1d9] bg-[#fafaf7] p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-[#173d3b]">
                  {editingReviewId ? "Edit your review" : "Rate your experience"}
                </p>

                {/* Star Picker */}
                <div className="my-3 flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-xl text-[#f28a2e] transition hover:scale-110"
                      aria-label={`${star} star`}
                    >
                      <Star
                        size={24}
                        fill={(hoverRating || userRating) >= star ? "currentColor" : "none"}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-[#7c8583]">
                    {userRating} / 5 Stars
                  </span>
                </div>

                <textarea
                  required
                  rows={2}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details about product freshness, price, or shopkeeper behavior..."
                  className="w-full border border-[#cfd5d1] bg-white p-2.5 text-xs text-[#173d3b] outline-none focus:border-[#f28a2e]"
                />

                <div className="mt-3 flex items-center justify-between">
                  {editingReviewId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReviewId(null);
                        setReviewComment("");
                      }}
                      className="text-xs text-gray-500 hover:underline"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="ml-auto flex items-center gap-1.5 bg-[#f28a2e] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#df751c] disabled:opacity-50"
                  >
                    {submittingReview ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    {editingReviewId ? "Update Review" : "Submit Review"}
                  </button>
                </div>
              </form>

              {/* Reviews List */}
              <div className="mt-6 space-y-4">
                {reviews.map((r) => {
                  const isAuthor = currentUser && r.customer_id === currentUser.id;
                  const authorName = r.profiles?.full_name || r.profiles?.username || "Local Shopper";

                  return (
                    <article key={r.id} className="border-b border-[#ece9e1] pb-4 last:border-b-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#113b52] text-xs font-bold text-white">
                            {authorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#173d3b]">
                              {authorName}
                              {isAuthor && <span className="ml-1 text-[10px] text-[#f28a2e]">(You)</span>}
                            </p>
                            <p className="text-[10px] text-[#7c8583]">
                              {new Date(r.created_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex text-[#f28a2e]">
                            {[...Array(r.rating || 5)].map((_, i) => (
                              <Star key={i} size={13} fill="currentColor" />
                            ))}
                          </div>
                          {isAuthor && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditReview(r)}
                                className="p-1 text-gray-400 hover:text-[#113b52]"
                                aria-label="Edit review"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteReview(r.id)}
                                className="p-1 text-gray-400 hover:text-red-600"
                                aria-label="Delete review"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-xs leading-5 text-[#556360]">{r.comment}</p>
                    </article>
                  );
                })}

                {reviews.length === 0 && (
                  <p className="py-4 text-center text-xs text-[#7c8583]">
                    No reviews yet. Be the first local customer to review this shop!
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Right Column: Products Catalogue */}
          <section>
            <div className="flex items-end justify-between gap-4 border-b border-[#e4e1d9] pb-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f28a2e]">
                  Available here
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.05em]">
                  Products in stock ({products.length})
                </h2>
              </div>
              <button
                onClick={() => navigate("/Nearby")}
                className="hidden text-sm font-bold text-[#b75d17] sm:block hover:underline"
              >
                See nearby <ArrowUpRight className="inline" size={16} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="flex gap-4 border border-[#e4e1d9] bg-[#fffdfa] p-4 sm:p-5 transition hover:border-[#f28a2e]"
                >
                  <button
                    onClick={() => navigate(`/CustomerReservation?productId=${product.id}`)}
                    className="flex min-w-0 flex-1 gap-4 text-left"
                  >
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center bg-[#edf0eb] rounded overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                          event.currentTarget.parentElement.innerHTML = `<span style="font-size:36px">${product.emoji || "📦"}</span>`;
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#f28a2e]">
                        {product.category}
                      </p>
                      <h3 className="mt-1 truncate text-lg font-bold text-[#173d3b]">
                        {product.name}
                      </h3>
                      <p className="mt-1 text-sm text-[#7c8583] line-clamp-1">
                        {product.details}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xl font-semibold text-[#173d3b]">
                          ₹{Number(product.price).toLocaleString("en-IN")}
                        </p>
                        <span className={`text-[10px] font-bold uppercase ${product.stock === "Out of stock" ? "text-red-600" : "text-[#3b806a]"}`}>
                          {product.stock}
                        </span>
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate(`/CustomerReservation?productId=${product.id}`)}
                    className="h-fit shrink-0 border border-[#d7dcd6] p-2.5 text-[#b75d17] hover:bg-orange-50 transition"
                    aria-label={`Reserve ${product.name}`}
                  >
                    <Package size={18} />
                  </button>
                </article>
              ))}

              {products.length === 0 && (
                <div className="border border-dashed border-[#cfd5d1] bg-[#fffdfa] p-8 text-center text-sm text-[#7c8583]">
                  No products listed by this shop yet.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#dfe3de] bg-[#fffdfa]/95 pb-[calc(0.45rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center justify-around">
          <NavItem icon={<Home />} label="Home" onClick={() => navigate("/CustomerDashboard")} />
          <NavItem icon={<MapPin />} label="Nearby" onClick={() => navigate("/Nearby")} />
          <NavItem icon={<Package />} label="Orders" onClick={() => navigate("/CustomerOrders")} />
          <NavItem icon={<Heart />} label="Saved" onClick={() => navigate("/CustomerSaved")} />
        </div>
      </nav>
    </main>
  );
};

const NavItem = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="relative flex min-w-0 flex-1 flex-col items-center gap-1 py-1.5 text-[#87908d]"
  >
    {React.cloneElement(icon, { size: 21, strokeWidth: 1.9 })}
    <span className="text-[11px] font-bold">{label}</span>
  </button>
);

export default CustomerShopDetails;
