"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, Product } from "@/lib/api";

// Computed add-on offer price: the product's base price for a full minimum pack.
// e.g. ₹0.99/card × MOQ 100 = ₹99. MOQ null → single unit.
function addonOfferPrice(p: Product): number {
  const qty = p.min_order_qty && p.min_order_qty > 0 ? p.min_order_qty : 1;
  return Math.round(p.base_price * qty * 100) / 100;
}

function primaryImage(p: Product): string | null {
  return p.images?.find((i) => i.is_primary)?.image_url || p.images?.[0]?.image_url || null;
}

export default function AddonsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    try {
      const all = await api.getProducts();
      setProducts(all);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const addons = useMemo(
    () =>
      products
        .filter((p) => p.is_addon)
        .sort((a, b) => (a.addon_sort_order ?? 0) - (b.addon_sort_order ?? 0) || a.name.localeCompare(b.name)),
    [products],
  );

  const available = useMemo(
    () =>
      products
        .filter((p) => !p.is_addon && p.name.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [products, search],
  );

  // Optimistically patch one product in local state, then persist.
  async function patch(id: number, data: Partial<Product>) {
    setBusyId(id);
    setError("");
    try {
      const updated = await api.updateProduct(id, data);
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function addAsAddon(p: Product) {
    const nextOrder = addons.reduce((m, a) => Math.max(m, a.addon_sort_order ?? 0), 0) + 1;
    await patch(p.id, { is_addon: true, addon_sort_order: nextOrder });
    setPickerOpen(false);
    setSearch("");
  }

  async function removeAddon(p: Product) {
    await patch(p.id, { is_addon: false });
  }

  // Swap sort order with the neighbour in the given direction, persist both.
  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= addons.length) return;
    const a = addons[index];
    const b = addons[target];
    const ao = a.addon_sort_order ?? index;
    const bo = b.addon_sort_order ?? target;
    // Persist swapped orders; reload to reflect the new sequence.
    setBusyId(a.id);
    try {
      await Promise.all([
        api.updateProduct(a.id, { addon_sort_order: bo }),
        api.updateProduct(b.id, { addon_sort_order: ao }),
      ]);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === a.id ? { ...p, addon_sort_order: bo } : p.id === b.id ? { ...p, addon_sort_order: ao } : p,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reorder failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="pb-12 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h2 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">Add-ons</h2>
        <p className="text-on-surface-variant font-medium">
          Products offered as an upsell in the cart, before checkout.
        </p>
      </motion.div>

      {/* How it works */}
      <div className="bg-secondary-container/30 border border-outline-variant/30 rounded-2xl p-5 mb-8 text-sm text-on-surface-variant space-y-1.5">
        <p className="flex items-start gap-2"><span className="material-symbols-outlined text-primary text-lg">info</span>
          <span>Any product can be an add-on. It&apos;s shown in the cart as &quot;Add {"{"}product{"}"} for ₹X&quot; whenever the shopper has at least one regular product in their cart.</span></p>
        <p className="pl-7">The offer price is the product&apos;s <strong>own price × its MOQ</strong> — e.g. a ₹0.99/card product with MOQ 100 is offered at ₹99.</p>
        <p className="pl-7">A cart containing <strong>only</strong> add-ons can&apos;t check out — the shopper is asked to add a regular product first.</p>
        <p className="pl-7"><strong>Flagging a product as an add-on hides it from the normal shop</strong> (search, category pages, homepage sections). It appears only here and as a cart add-on.</p>
      </div>

      {error && (
        <div className="bg-error-container border border-error-container text-on-error-container text-sm font-medium rounded-2xl p-4 mb-6 flex items-center gap-3">
          <span className="material-symbols-outlined">error</span> {error}
        </div>
      )}

      {/* Current add-ons */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-headline font-bold text-lg text-on-surface">Current add-ons ({addons.length})</h3>
        <button
          onClick={() => setPickerOpen((v) => !v)}
          className="inline-flex items-center gap-2 bg-primary text-on-primary px-4 py-2.5 rounded-xl font-label font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Add a product
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 opacity-50">
          <span className="material-symbols-outlined animate-spin text-4xl mb-4">progress_activity</span>
          <span className="text-sm font-medium text-on-surface-variant">Loading…</span>
        </div>
      ) : addons.length === 0 ? (
        <div className="text-center py-12 text-on-surface-variant border border-dashed border-outline-variant/50 rounded-2xl">
          <span className="material-symbols-outlined text-4xl opacity-40 mb-2">add_shopping_cart</span>
          <p className="text-sm font-medium">No add-ons yet. Click &quot;Add a product&quot; to offer one.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {addons.map((p, idx) => {
            const img = primaryImage(p);
            return (
              <div key={p.id} className="flex items-center gap-4 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4">
                {/* reorder */}
                <div className="flex flex-col">
                  <button disabled={idx === 0 || busyId === p.id} onClick={() => move(idx, -1)}
                    className="w-7 h-6 flex items-center justify-center text-on-surface-variant hover:text-primary disabled:opacity-30 material-symbols-outlined text-lg">keyboard_arrow_up</button>
                  <button disabled={idx === addons.length - 1 || busyId === p.id} onClick={() => move(idx, 1)}
                    className="w-7 h-6 flex items-center justify-center text-on-surface-variant hover:text-primary disabled:opacity-30 material-symbols-outlined text-lg">keyboard_arrow_down</button>
                </div>
                <div className="w-14 h-14 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0">
                  {img ? <img src={img} alt={p.name} className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-on-surface-variant/40">image</span></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-headline font-bold text-on-surface truncate">{p.name}</p>
                  <p className="text-xs text-on-surface-variant">
                    ₹{p.base_price.toLocaleString("en-IN")} × MOQ {p.min_order_qty || 1} ={" "}
                    <span className="font-bold text-on-surface">₹{addonOfferPrice(p).toLocaleString("en-IN")}</span> offer
                  </p>
                  {!p.is_active && (
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      Product inactive — won&apos;t show until activated
                    </span>
                  )}
                </div>
                <a href={`/dashboard/products?edit=${p.id}`} className="text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-primary px-3 py-2">Edit</a>
                <button
                  onClick={() => removeAddon(p)}
                  disabled={busyId === p.id}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-error hover:bg-error-container/40 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">{busyId === p.id ? "progress_activity" : "remove_circle"}</span>
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add-product picker */}
      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 overflow-hidden"
          >
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-headline font-bold text-on-surface">Pick a product to offer as an add-on</h4>
                <button onClick={() => { setPickerOpen(false); setSearch(""); }} className="material-symbols-outlined text-on-surface-variant hover:text-on-surface">close</button>
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name…"
                className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface mb-3 focus:outline-none focus:ring-2 focus:ring-secondary-container"
              />
              <div className="max-h-72 overflow-y-auto flex flex-col gap-1">
                {available.length === 0 ? (
                  <p className="text-sm text-on-surface-variant py-4 text-center">No matching products.</p>
                ) : (
                  available.slice(0, 50).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addAsAddon(p)}
                      disabled={busyId === p.id}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-highest/60 text-left disabled:opacity-50"
                    >
                      <div className="w-10 h-10 rounded-md bg-surface-container-high overflow-hidden flex-shrink-0">
                        {primaryImage(p) ? <img src={primaryImage(p)!} alt="" className="w-full h-full object-cover" /> : (
                          <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-on-surface-variant/40 text-lg">image</span></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">{p.name}</p>
                        <p className="text-xs text-on-surface-variant">₹{p.base_price.toLocaleString("en-IN")} · MOQ {p.min_order_qty || 1} → ₹{addonOfferPrice(p).toLocaleString("en-IN")} offer</p>
                      </div>
                      <span className="material-symbols-outlined text-primary">add_circle</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
