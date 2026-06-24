"use client";
import { useEffect, useState } from "react";
import { api, StartStrongApplication } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

type FilterTab = "all" | "submitted" | "approved" | "rejected";

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-[#fff3cd] text-[#856404]",
  approved: "bg-[#b8f3d0] text-[#006b3a]",
  rejected: "bg-error-container text-error",
};

export default function StartStrongPage() {
  const [apps, setApps] = useState<StartStrongApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterTab>("submitted");
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      setApps(await api.getStartStrongApplications());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(id: number) {
    if (!confirm("Approve this application? Remember to issue the Cashfree refund manually.")) return;
    setBusyId(id);
    try {
      await api.approveStartStrong(id);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
    setBusyId(null);
  }

  async function handleReject(id: number) {
    const reason = prompt("Reason for rejection (shown to the applicant):");
    if (!reason || !reason.trim()) return;
    setBusyId(id);
    try {
      await api.rejectStartStrong(id, reason.trim());
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
    setBusyId(null);
  }

  const counts = {
    all: apps.length,
    submitted: apps.filter((a) => a.status === "submitted").length,
    approved: apps.filter((a) => a.status === "approved").length,
    rejected: apps.filter((a) => a.status === "rejected").length,
  };

  const filtered = filter === "all" ? apps : apps.filter((a) => a.status === filter);

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "submitted", label: "Pending", count: counts.submitted },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "rejected", label: "Rejected", count: counts.rejected },
    { key: "all", label: "All", count: counts.all },
  ];

  return (
    <div className="pb-12 max-w-[1400px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h2 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">
          Start Strong
        </h2>
        <p className="text-on-surface-variant font-medium">
          Verify new-startup applications. Refunds are issued manually in Cashfree after approval.
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
            <button onClick={() => setError("")} className="ml-auto material-symbols-outlined text-[18px] hover:opacity-70">
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

      {/* List */}
      <div className="bg-surface-container-lowest rounded-[2rem] shadow-xl shadow-surface-variant/20 border border-outline-variant/30 p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 opacity-50">
            <span className="material-symbols-outlined animate-spin text-3xl mb-2">progress_activity</span>
            <span className="text-sm font-medium">Loading applications...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 opacity-40">
            <span className="material-symbols-outlined text-7xl mb-4">rocket_launch</span>
            <p className="font-headline font-bold text-2xl mb-1">No applications</p>
            <p className="font-medium text-sm">Nothing to review in this view.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((app, idx) => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-surface-container rounded-2xl border border-outline-variant/20 p-5"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[260px]">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-headline font-bold text-on-surface text-base truncate">
                          {app.company_name}
                        </h4>
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-lg ${
                            STATUS_STYLES[app.status] ?? "bg-outline-variant/20 text-on-surface-variant"
                          }`}
                        >
                          {app.status === "submitted" ? "Pending" : app.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-on-surface-variant font-medium mt-3">
                        <Field icon="person" label="Applicant" value={app.user_email ?? `User #${app.user_id}`} />
                        <Field icon="badge" label="Type" value={app.business_type} />
                        <Field icon="receipt_long" label="GST" value={app.gst_number || "—"} />
                        <Field
                          icon="event"
                          label="Incorporated"
                          value={new Date(app.incorporation_date).toLocaleDateString(undefined, { dateStyle: "medium" })}
                        />
                        <Field
                          icon="shopping_cart"
                          label="Linked order"
                          value={app.order_id ? `#${app.order_id}${app.cf_order_id ? ` (${app.cf_order_id})` : ""}` : "Not yet paid"}
                        />
                        <Field icon="payments" label="Refund value" value={`₹${app.eligible_amount.toFixed(2)}`} />
                      </div>

                      <div className="flex items-center gap-3 mt-3">
                        {app.document_url ? (
                          <a
                            href={app.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                          >
                            <span className="material-symbols-outlined text-[18px]">description</span>
                            View {app.document_type === "gst" ? "GST" : "Incorporation"} certificate
                          </a>
                        ) : (
                          <span className="text-sm text-on-surface-variant/60 italic">Document unavailable</span>
                        )}
                      </div>

                      {app.status === "rejected" && app.rejection_reason && (
                        <p className="text-sm text-error font-medium mt-3">
                          Rejection reason: {app.rejection_reason}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    {app.status === "submitted" && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleApprove(app.id)}
                          disabled={busyId === app.id}
                          className="px-4 h-10 rounded-xl bg-[#b8f3d0] text-[#006b3a] hover:bg-[#90e8b5] flex items-center gap-1.5 font-label font-bold text-sm transition-colors disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[18px]">check</span>
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          disabled={busyId === app.id}
                          className="px-4 h-10 rounded-xl bg-error-container text-error hover:opacity-80 flex items-center gap-1.5 font-label font-bold text-sm transition-colors disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                          Reject
                        </button>
                      </div>
                    )}
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

function Field({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <p className="flex items-center gap-1.5 min-w-0">
      <span className="material-symbols-outlined text-[14px] opacity-60">{icon}</span>
      <span className="opacity-60">{label}:</span>
      <span className="text-on-surface truncate">{value}</span>
    </p>
  );
}
