"use client";

// Lists customers who started a Cashfree checkout but no Order was materialized for
// them — usually because the Cashfree webhook never arrived (mobile UPI flow where
// the customer never returns to the merchant page). The "Recover" button asks
// Cashfree if the payment succeeded; if so, the Order is created and shows up
// in the regular Orders list immediately.

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

type PendingRow = Awaited<ReturnType<typeof api.getAbandonedCheckouts>>[number];

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const then = new Date(iso).getTime();
  const mins = Math.max(0, Math.round((Date.now() - then) / 60_000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

export default function AbandonedCheckoutsPage() {
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recovering, setRecovering] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ kind: "success" | "info" | "error"; msg: string } | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getAbandonedCheckouts();
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function recover(id: number) {
    setRecovering(id);
    setConfirmId(null);
    try {
      const result = await api.recoverAbandonedCheckout(id);
      if (result.status === "recovered") {
        setToast({
          kind: "success",
          msg: `Recovered as Order #${result.order_id} (₹${result.total_amount}). It's now in the Orders list.`,
        });
      } else if (result.status === "already_materialized") {
        setToast({
          kind: "info",
          msg: `This checkout was already recovered (Order #${result.order_id}).`,
        });
      } else if (result.status === "not_paid") {
        setToast({
          kind: "info",
          msg: "Cashfree says this payment isn't successful yet. Nothing to recover.",
        });
      } else {
        setToast({ kind: "info", msg: `Status: ${result.status}` });
      }
      await load();
    } catch (e) {
      setToast({ kind: "error", msg: e instanceof Error ? e.message : "Recovery failed" });
    } finally {
      setRecovering(null);
      setTimeout(() => setToast(null), 6000);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-on-surface tracking-tight">Abandoned Carts</h1>
          <p className="font-body text-sm text-on-surface-variant mt-2 max-w-2xl">
            Customers who started a Cashfree payment but no order was created (usually a
            silent webhook failure). Click <b>Recover</b> to ask Cashfree if the payment
            succeeded — if it did, the order materialises into the Orders list immediately.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-surface-container-high hover:bg-surface-container-highest text-sm font-label font-bold transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-error-container text-on-error-container px-5 py-4 text-sm font-body">
          {error}
        </div>
      )}

      <div className="rounded-3xl border border-outline-variant bg-surface-container-low overflow-hidden">
        {loading ? (
          <div className="px-6 py-16 text-center text-on-surface-variant font-body text-sm">
            Loading abandoned checkouts…
          </div>
        ) : rows.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/50 block mb-3">
              check_circle
            </span>
            <p className="font-headline text-lg text-on-surface">No abandoned checkouts</p>
            <p className="font-body text-sm text-on-surface-variant mt-1">
              Every recent payment has a matching order. The poller checks every 2 minutes.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container text-on-surface-variant uppercase tracking-widest text-[11px]">
              <tr>
                <th className="px-5 py-3 text-left font-label font-bold">#</th>
                <th className="px-5 py-3 text-left font-label font-bold">Customer</th>
                <th className="px-5 py-3 text-left font-label font-bold">Cashfree Order</th>
                <th className="px-5 py-3 text-left font-label font-bold">Age</th>
                <th className="px-5 py-3 text-right font-label font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.pending_checkout_id} className="border-t border-outline-variant/40 hover:bg-surface-container">
                  <td className="px-5 py-4 font-mono text-xs text-on-surface-variant">{r.pending_checkout_id}</td>
                  <td className="px-5 py-4">
                    <div className="font-body font-medium text-on-surface">{r.user_name || "—"}</div>
                    <div className="text-xs text-on-surface-variant">{r.user_email}</div>
                    {r.user_phone && (
                      <div className="text-xs text-on-surface-variant">{r.user_phone}</div>
                    )}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs">
                    {r.cf_order_id || <span className="text-on-surface-variant">none</span>}
                  </td>
                  <td className="px-5 py-4 text-on-surface-variant">{timeAgo(r.created_at)}</td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => setConfirmId(r.pending_checkout_id)}
                      disabled={recovering === r.pending_checkout_id || !r.cf_order_id}
                      className="px-4 py-2 rounded-full bg-primary text-on-primary text-xs font-label font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                    >
                      {recovering === r.pending_checkout_id ? "Recovering…" : "Recover"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirm dialog */}
      <AnimatePresence>
        {confirmId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmId(null)}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-surface-container-high rounded-3xl p-6 max-w-md w-full"
            >
              <h3 className="font-headline font-bold text-xl text-on-surface mb-2">
                Recover this checkout?
              </h3>
              <p className="font-body text-sm text-on-surface-variant mb-6">
                We&apos;ll ask Cashfree if the payment actually succeeded. If yes, the order
                is created in the database and the customer gets a confirmation email.
                Safe to retry — it&apos;s idempotent.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmId(null)}
                  className="px-5 py-2.5 rounded-2xl text-sm font-label font-bold hover:bg-surface-container-highest"
                >
                  Cancel
                </button>
                <button
                  onClick={() => recover(confirmId)}
                  className="px-5 py-2.5 rounded-2xl bg-primary text-on-primary text-sm font-label font-bold"
                >
                  Yes, recover
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className={`fixed bottom-6 right-6 max-w-md rounded-2xl px-5 py-4 shadow-xl font-body text-sm z-50 ${
              toast.kind === "success"
                ? "bg-[#b8f3d0] text-[#006b3a]"
                : toast.kind === "error"
                ? "bg-error-container text-on-error-container"
                : "bg-surface-container-highest text-on-surface"
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
