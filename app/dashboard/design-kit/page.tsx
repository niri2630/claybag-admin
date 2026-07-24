"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, Product } from "@/lib/api";

// The Design Kit offerings are real catalogue products under this subcategory.
const SUB_SLUG = "design-kit-services";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const imgSrc = (u: string) => (u.startsWith("http") ? u : `${BASE_URL}${u}`);

export default function DesignKitAdminPage() {
  const [rows, setRows] = useState<Product[]>([]);
  const [subId, setSubId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<{ kind: "success" | "error"; msg: string } | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const cats = await api.getCategories();
      let sid: number | null = null;
      for (const c of cats) {
        const s = (c.subcategories || []).find((sc) => sc.slug === SUB_SLUG);
        if (s) {
          sid = s.id;
          break;
        }
      }
      if (!sid) {
        setSubId(null);
        setRows([]);
        setError(
          "Design Kit category not found yet. Deploy the backend (it runs the migration that creates the category + the 4 products), then reload."
        );
        return;
      }
      setSubId(sid);
      setRows(await api.getProducts(sid));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
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

  function patch<K extends keyof Product>(id: number, field: K, value: Product[K]) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function save(row: Product) {
    setBusyId(row.id);
    try {
      await api.updateProduct(row.id, {
        name: row.name,
        base_price: row.base_price,
        short_description: row.short_description ?? "",
        description: row.description ?? "",
        is_active: row.is_active,
      });
      flash("success", `Saved "${row.name}"`);
      await load();
    } catch (e) {
      flash("error", e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(row: Product) {
    if (!window.confirm(`Delete "${row.name}"? This removes it from the website.`)) return;
    setBusyId(row.id);
    try {
      await api.deleteProduct(row.id);
      flash("success", "Deleted");
      await load();
    } catch (e) {
      flash("error", e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  async function addItem() {
    if (!subId) return;
    setAdding(true);
    try {
      await api.createProduct({
        name: "New design service",
        base_price: 999,
        subcategory_id: subId,
        is_active: true,
        short_description: "",
        description: "",
      });
      flash("success", "Added — edit and save it below");
      await load();
    } catch (e) {
      flash("error", e instanceof Error ? e.message : "Add failed");
    } finally {
      setAdding(false);
    }
  }

  async function uploadImg(row: Product, file: File) {
    setBusyId(row.id);
    try {
      await api.uploadProductImage(row.id, file, (row.images?.length ?? 0) === 0);
      flash("success", "Image uploaded");
      await load();
    } catch (e) {
      flash("error", e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusyId(null);
    }
  }

  async function removeImg(row: Product, imageId: number) {
    setBusyId(row.id);
    try {
      await api.deleteProductImage(row.id, imageId);
      await load();
    } catch (e) {
      flash("error", e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  const inputCls =
    "w-full bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-3 text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all";

  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      <div className="flex items-end justify-between gap-6 mb-3">
        <div>
          <h1 className="font-headline font-bold text-3xl tracking-tight text-on-surface">Design Kit</h1>
          <p className="text-on-surface-variant mt-1.5 text-sm">
            The creative-services on the public <code>/design-kit</code> page — real products, so they
            add-to-cart and check out like anything else. Edit the essentials here; for images &amp;
            advanced options open the full editor in{" "}
            <Link href="/dashboard/products" className="underline font-medium">
              Products
            </Link>
            .
          </p>
        </div>
        <button
          onClick={addItem}
          disabled={adding || !subId}
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
      ) : rows.length === 0 && !error ? (
        <div className="rounded-3xl border border-outline-variant/40 p-12 text-center text-on-surface-variant">
          No Design Kit products yet. Click <b>Add item</b> to create one.
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
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex-1 min-w-[220px]">
                  <label className="block font-label text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
                    Name
                  </label>
                  <input
                    value={row.name}
                    onChange={(e) => patch(row.id, "name", e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="w-32">
                  <label className="block font-label text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    value={row.base_price}
                    onChange={(e) => patch(row.id, "base_price", Number(e.target.value) || 0)}
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

              <div className="mb-4">
                <label className="block font-label text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
                  Price note <span className="normal-case tracking-normal opacity-70">(shown under the price)</span>
                </label>
                <input
                  value={row.short_description ?? ""}
                  onChange={(e) => patch(row.id, "short_description", e.target.value)}
                  placeholder="per page · 2-page ₹1,000"
                  className={inputCls}
                />
              </div>

              <div className="mb-5">
                <label className="block font-label text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">
                  Description
                </label>
                <textarea
                  value={row.description ?? ""}
                  onChange={(e) => patch(row.id, "description", e.target.value)}
                  rows={2}
                  className={`${inputCls} resize-y`}
                />
              </div>

              {/* Images — same as any other product */}
              <div className="mb-5">
                <label className="block font-label text-[10px] uppercase tracking-wider text-on-surface-variant mb-2">
                  Images
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {(row.images ?? []).map((img) => (
                    <div
                      key={img.id}
                      className="relative w-20 h-20 rounded-xl overflow-hidden border border-outline-variant/40 bg-surface-container"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgSrc(img.image_url)} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImg(row, img.id)}
                        disabled={busyId === row.id}
                        title="Remove image"
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-outline-variant/50 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container transition-colors text-on-surface-variant">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void uploadImg(row, f);
                        e.currentTarget.value = "";
                      }}
                    />
                    <span className="material-symbols-outlined text-[22px]">add_photo_alternate</span>
                    <span className="text-[9px] font-label uppercase tracking-wide mt-0.5">Add</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => remove(row)}
                    disabled={busyId === row.id}
                    className="flex items-center gap-1.5 font-label text-xs uppercase tracking-wider font-bold text-error hover:opacity-80 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    Delete
                  </button>
                </div>
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
