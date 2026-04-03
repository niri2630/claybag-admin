"use client";
import { useEffect, useState } from "react";
import { api, Review } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

type FilterTab = "all" | "pending" | "approved";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");

  async function load() {
    setLoading(true);
    try {
      setReviews(await api.getReviews());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(id: number) {
    try {
      await api.approveReview(id);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  async function handleReject(id: number) {
    try {
      await api.rejectReview(id);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this review permanently?")) return;
    try {
      await api.deleteReview(id);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  const pendingReviews = reviews.filter((r) => !r.is_approved);
  const approvedReviews = reviews.filter((r) => r.is_approved);

  const filtered =
    filter === "pending"
      ? pendingReviews
      : filter === "approved"
        ? approvedReviews
        : reviews;

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: reviews.length },
    { key: "pending", label: "Pending", count: pendingReviews.length },
    { key: "approved", label: "Approved", count: approvedReviews.length },
  ];

  function renderStars(rating: number) {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`material-symbols-outlined text-[18px] ${i <= rating ? "text-[#f59e0b]" : "text-outline-variant/40"}`}
            style={i <= rating ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            star
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="pb-12 max-w-[1400px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">
          Reviews
        </h2>
        <p className="text-on-surface-variant font-medium">
          Manage customer reviews and approvals
        </p>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-error-container border border-error-container text-on-error-container text-sm font-medium rounded-2xl p-4 mb-6 flex items-center gap-3"
          >
            <span className="material-symbols-outlined">error</span>
            {error}
            <button
              onClick={() => setError("")}
              className="ml-auto material-symbols-outlined text-[18px] hover:opacity-70"
            >
              close
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Tabs */}
      <div className="bg-surface-container-lowest rounded-[2rem] shadow-xl shadow-surface-variant/20 border border-outline-variant/30 p-2 mb-6 inline-flex gap-2">
        {tabs.map((tab) => {
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`relative px-5 py-2.5 rounded-3xl text-sm font-label font-bold tracking-wide transition-all flex items-center gap-2 ${
                active
                  ? "bg-secondary-container text-on-secondary-container"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {tab.label}
              <span
                className={`text-[11px] min-w-[20px] h-5 flex items-center justify-center rounded-full px-1.5 font-bold ${
                  active
                    ? "bg-on-secondary-container/15 text-on-secondary-container"
                    : "bg-outline-variant/20 text-on-surface-variant"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Review List */}
      <div className="bg-surface-container-lowest rounded-[2rem] shadow-xl shadow-surface-variant/20 border border-outline-variant/30 p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 opacity-50">
            <span className="material-symbols-outlined animate-spin text-3xl mb-2">
              progress_activity
            </span>
            <span className="text-sm font-medium">Loading reviews...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 opacity-40">
            <span className="material-symbols-outlined text-7xl mb-4">
              rate_review
            </span>
            <p className="font-headline font-bold text-2xl mb-1">
              No reviews found
            </p>
            <p className="font-medium text-sm">
              {filter === "pending"
                ? "No pending reviews to moderate."
                : filter === "approved"
                  ? "No approved reviews yet."
                  : "No customer reviews yet."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((review, idx) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-surface-container rounded-2xl border border-outline-variant/20 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Review Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {renderStars(review.rating)}
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg ${
                            review.is_approved
                              ? "bg-[#b8f3d0] text-[#006b3a]"
                              : "bg-[#fff3cd] text-[#856404]"
                          }`}
                        >
                          {review.is_approved ? "Approved" : "Pending"}
                        </span>
                      </div>

                      <h4 className="font-headline font-bold text-on-surface text-base mb-0.5 truncate">
                        {review.product_name}
                      </h4>

                      <p className="text-sm text-on-surface-variant font-medium flex items-center gap-1.5 mb-2">
                        <span className="material-symbols-outlined text-[14px] opacity-60">
                          person
                        </span>
                        {review.user_name}
                      </p>

                      {review.comment && (
                        <p className="text-sm text-on-surface font-medium leading-relaxed line-clamp-3">
                          &ldquo;{review.comment}&rdquo;
                        </p>
                      )}

                      <p className="text-xs font-label font-bold text-on-surface-variant mt-3 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px] opacity-60">
                          calendar_today
                        </span>
                        {new Date(review.created_at).toLocaleDateString(
                          undefined,
                          {
                            dateStyle: "medium",
                          }
                        )}
                      </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {!review.is_approved && (
                        <button
                          onClick={() => handleApprove(review.id)}
                          title="Approve"
                          className="w-10 h-10 rounded-xl bg-[#b8f3d0] text-[#006b3a] hover:bg-[#90e8b5] flex items-center justify-center transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            check
                          </span>
                        </button>
                      )}
                      {review.is_approved && (
                        <button
                          onClick={() => handleReject(review.id)}
                          title="Reject"
                          className="w-10 h-10 rounded-xl bg-[#fff3cd] text-[#856404] hover:bg-[#ffe69c] flex items-center justify-center transition-colors"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            close
                          </span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(review.id)}
                        title="Delete"
                        className="w-10 h-10 rounded-xl bg-error-container text-error hover:opacity-80 flex items-center justify-center transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
