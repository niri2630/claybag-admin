"use client";

import { useEffect, useState } from "react";
import { api, DesignKitItem } from "@/lib/api";

type Row = DesignKitItem;

export default function DesignKitAdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<{ kind: "success" | "error"; msg: string } | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRows(await api.getDesignKitItems());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Design Kit items");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function flash(kind: "success" | "error", msg: string) {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3500);
  }

  function patch<K extends keyof Row>(id: number, field: K, value: Row[K]) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function save(row: Row) {
    setBusyId(row.id);
    try {
      await api.updateDesignKitItem(row.id, {
        title: row.title,
        price: row.price,
        price_note: row.price_note,
        description: row.description,
        sort_order: row.sort_order,
        is_active: row.is_active,
      });
      flash("success", `Saved "${row.title}"`);
      await load();
    } catch (e) {
      flash("error", e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(row: Row) {
    if (!window.confirm(`Delete "${row.title}"? This removes it from the website.`)) return;
    setBusyId(row.id);
    try {
      await api.deleteDesignKitItem(row.id);
      flash("success", "Deleted");
      await load();
    } catch (e) {
      flash("error", e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  async function addItem() {
    setAdding(true);
    try {
      const nextOrder = rows.length ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 1;
      await api.createDesignKitItem({
        title: "New service",
        price: "₹0",
        price_note: "",
        description: "",
        sort_order: nextOrder,
        is_active: true,
      });
      flash("success", "Item added — edit and save it below");
      await load();
    } catch (e) {
      flash("error", e instanceof Error ? e.message : "Add failed");
    } finally {
      setAdding(false);
    }
  }

  const inputCls =
    "w-full bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-3 text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all";

  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="flex items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="font-headline font-bold text-3xl tracking-tight text-on-surface">
            Design Kit
          </h1>
          <p className="text-on-surface-variant mt-1.5 text-sm">
            The creative-services offerings shown on the public <code>/design-kit</code> page.
            Reorder with the sort number; hide from the site with the toggle.
          </p>
        </div>
        <button
          onClick={addItem}
          disabled={adding}
          className="shrink-0 flex items-center gap-2 bg-secondary-container text-on-secondary-container font-label font-bold text-sm uppercase tracking-wider px-5 py-3 rounded-2xl hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          {adding ? "Adding…" : "Add item"}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl bg-error-container text-on-error-container px-4 py-3 text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-on-surface-variant">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-outline-variant/40 p-12 text-center text-on-surface-variant">
          No Design Kit items yet. Click <b>Add item</b> to create one.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {rows.map((row) => (
            <div
              key={row.id}
              className={`rounded-3xl border p-6 transition-colors ${
                row.is_active
                  ? "border-outline-variant/40 bg-surface-container-low"
                  : "border-outline-variant/30 bg-surface-container-low/50 opacity-70"
              }`}
            >
              {/* Row 1: sort + title + active */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="w-20">
                  <label className="block font-label text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={row.sort_order}
                    onChange={(e) => patch(row.id, "sort_order", Number(e.target.value) || 0)}
                    className={inputCls}
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block font-label text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
                    Title
                  </label>
                  <input
                    value={row.title}
                    onChange={(e) => patch(row.id, "title", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none mt-5">
                  <input
                    type="checkbox"
                    checked={row.is_active}
                    onChange={(e) => patch(row.id, "is_active", e.target.checked)}
                    className="w-5 h-5 accent-secondary-container"
                  />
                  <span className="font-label text-xs uppercase tracking-wider text-on-surface-variant">
                    {row.is_active ? "Live" : "Hidden"}
                  </span>
                </label>
              </div>

              {/* Row 2: price + price note */}
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3 mb-4">
                <div>
                  <label className="block font-label text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
                    Price
                  </label>
                  <input
                    value={row.price}
                    onChange={(e) => patch(row.id, "price", e.target.value)}
                    placeholder="₹4,999"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block font-label text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
                    Price note
                  </label>
                  <input
                    value={row.price_note ?? ""}
                    onChange={(e) => patch(row.id, "price_note", e.target.value)}
                    placeholder="per page · 2-page ₹1,000"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Row 3: description */}
              <div className="mb-5">
                <label className="block font-label text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
                  Description
                </label>
                <textarea
                  value={row.description}
                  onChange={(e) => patch(row.id, "description", e.target.value)}
                  rows={2}
                  className={`${inputCls} resize-y`}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => remove(row)}
                  disabled={busyId === row.id}
                  className="flex items-center gap-1.5 font-label text-xs uppercase tracking-wider font-bold text-error hover:opacity-80 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  Delete
                </button>
                <button
                  onClick={() => save(row)}
                  disabled={busyId === row.id}
                  className="bg-primary text-on-primary font-label font-bold text-sm uppercase tracking-wider px-6 py-3 rounded-2xl hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {busyId === row.id ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-2xl px-5 py-3.5 text-sm font-bold shadow-xl ${
            toast.kind === "success"
              ? "bg-secondary-container text-on-secondary-container"
              : "bg-error-container text-on-error-container"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
