"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, SwagConfig, SwagSection, Category, Product } from "@/lib/api";

type Sub = { id: number; name: string; category: string };

export default function SwagBoxAdminPage() {
  const [config, setConfig] = useState<SwagConfig | null>(null);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [sectionProducts, setSectionProducts] = useState<Record<number, Product[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyProduct, setBusyProduct] = useState<number | null>(null);
  const [toast, setToast] = useState<{ kind: "success" | "error"; msg: string } | null>(null);

  function flash(kind: "success" | "error", msg: string) {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function load() {
    setLoading(true);
    setError("");
    try {
      const cats: Category[] = await api.getCategories();
      const flat: Sub[] = [];
      for (const c of cats) for (const s of c.subcategories || []) flat.push({ id: s.id, name: s.name, category: c.name });
      setSubs(flat);

      const configs = await api.getSwagConfigs();
      const cfg = configs[0] || null; // manage the (seeded) Starter Box
      setConfig(cfg);

      if (cfg) {
        const map: Record<number, Product[]> = {};
        await Promise.all(
          (cfg.sections || []).map(async (sec) => {
            try {
              map[sec.subcategory_id] = await api.getProducts(sec.subcategory_id);
            } catch {
              map[sec.subcategory_id] = [];
            }
          })
        );
        setSectionProducts(map);
      }
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

  function patchConfig<K extends keyof SwagConfig>(field: K, value: SwagConfig[K]) {
    setConfig((c) => (c ? { ...c, [field]: value } : c));
  }
  function patchSection(idx: number, field: keyof SwagSection, value: SwagSection[keyof SwagSection]) {
    setConfig((c) => {
      if (!c) return c;
      const sections = c.sections.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
      return { ...c, sections };
    });
  }
  function addSection() {
    if (!config) return;
    const used = new Set(config.sections.map((s) => s.subcategory_id));
    const next = subs.find((s) => !used.has(s.id));
    if (!next) {
      flash("error", "All subcategories are already sections");
      return;
    }
    const sections: SwagSection[] = [
      ...config.sections,
      { subcategory_id: next.id, subcategory_name: next.name, sort_order: config.sections.length, min_picks: 0, max_picks: null },
    ];
    setConfig({ ...config, sections });
  }
  function removeSection(idx: number) {
    if (!config) return;
    setConfig({ ...config, sections: config.sections.filter((_, i) => i !== idx) });
  }
  function move(idx: number, dir: -1 | 1) {
    if (!config) return;
    const j = idx + dir;
    if (j < 0 || j >= config.sections.length) return;
    const sections = [...config.sections];
    [sections[idx], sections[j]] = [sections[j], sections[idx]];
    setConfig({ ...config, sections });
  }

  async function save() {
    if (!config) return;
    setSaving(true);
    try {
      await api.updateSwagConfig(config.id, {
        name: config.name,
        slug: config.slug,
        description: config.description ?? null,
        box_price: config.box_price,
        min_items: config.min_items,
        max_items: config.max_items ?? null,
        min_boxes: config.min_boxes,
        max_boxes: config.max_boxes ?? null,
        is_active: config.is_active,
        sections: config.sections.map((s, i) => ({
          subcategory_id: s.subcategory_id,
          title_override: s.title_override ?? null,
          sort_order: i,
          min_picks: s.min_picks || 0,
          max_picks: s.max_picks ?? null,
        })),
      });
      flash("success", "Saved");
      await load();
    } catch (e) {
      flash("error", e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function toggleSwagOnly(p: Product) {
    setBusyProduct(p.id);
    try {
      await api.updateProduct(p.id, { is_swag_only: !p.is_swag_only });
      setSectionProducts((m) => {
        const copy = { ...m };
        for (const k of Object.keys(copy)) {
          copy[Number(k)] = copy[Number(k)].map((x) => (x.id === p.id ? { ...x, is_swag_only: !p.is_swag_only } : x));
        }
        return copy;
      });
    } catch (e) {
      flash("error", e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyProduct(null);
    }
  }

  const inputCls =
    "bg-surface-container border border-outline-variant/50 rounded-xl px-3 py-2 text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all";

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      <div className="flex items-end justify-between gap-6 mb-6">
        <div>
          <h1 className="font-headline font-bold text-3xl tracking-tight text-on-surface">Swag Box</h1>
          <p className="text-on-surface-variant mt-1.5 text-sm">
            Configure the build-your-own hamper: the flat box fee, the pick rules, and which product
            categories appear as sections. Products come live from each tagged subcategory.
          </p>
        </div>
        {config && (
          <button
            onClick={save}
            disabled={saving}
            className="shrink-0 bg-primary text-on-primary font-label font-bold text-sm uppercase tracking-wider px-6 py-3 rounded-2xl hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        )}
      </div>

      {error && <div className="mb-6 rounded-2xl bg-error-container text-on-error-container px-4 py-3 text-sm font-medium">{error}</div>}

      {loading ? (
        <p className="text-on-surface-variant">Loading…</p>
      ) : !config ? (
        <div className="rounded-3xl border border-outline-variant/40 p-12 text-center text-on-surface-variant">
          No Swag Box config found. Deploy the backend (it seeds a &quot;Starter Box&quot;), then reload.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Config */}
          <section className="rounded-3xl border border-outline-variant/40 bg-surface-container-low p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline font-bold text-lg text-on-surface">Settings</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={config.is_active} onChange={(e) => patchConfig("is_active", e.target.checked)} className="w-5 h-5 accent-secondary-container" />
                <span className="font-label text-xs uppercase tracking-wider text-on-surface-variant">{config.is_active ? "Live" : "Off"}</span>
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="Name"><input value={config.name} onChange={(e) => patchConfig("name", e.target.value)} className={`${inputCls} w-full`} /></Field>
              <Field label="Slug (URL)"><input value={config.slug} onChange={(e) => patchConfig("slug", e.target.value)} className={`${inputCls} w-full`} /></Field>
              <Field label="Box fee (₹)"><input type="number" value={config.box_price} onChange={(e) => patchConfig("box_price", Number(e.target.value) || 0)} className={`${inputCls} w-full`} /></Field>
              <Field label="Min items"><input type="number" value={config.min_items} onChange={(e) => patchConfig("min_items", Number(e.target.value) || 0)} className={`${inputCls} w-full`} /></Field>
              <Field label="Min boxes (MOQ)"><input type="number" value={config.min_boxes} onChange={(e) => patchConfig("min_boxes", Number(e.target.value) || 0)} className={`${inputCls} w-full`} /></Field>
              <Field label="Max boxes (blank = none)"><input type="number" value={config.max_boxes ?? ""} onChange={(e) => patchConfig("max_boxes", e.target.value === "" ? null : Number(e.target.value))} className={`${inputCls} w-full`} /></Field>
            </div>
          </section>

          {/* Sections */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-headline font-bold text-lg text-on-surface">Sections</h2>
              <button onClick={addSection} className="flex items-center gap-1.5 bg-secondary-container text-on-secondary-container font-label font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl hover:opacity-90">
                <span className="material-symbols-outlined text-[18px]">add</span> Add section
              </button>
            </div>
            <p className="text-on-surface-variant text-sm mb-4">
              Each section is a subcategory (e.g. Pens, Apparel). Every eligible product in it shows in the
              builder. Add products by creating them under that subcategory in{" "}
              <Link href="/dashboard/products" className="underline font-medium">Products</Link>; mark a product
              &quot;Swag Box Only&quot; to hide it from the main catalog.
            </p>

            {config.sections.length === 0 && (
              <div className="rounded-2xl border border-dashed border-outline-variant/50 p-8 text-center text-on-surface-variant text-sm">
                No sections yet. Click <b>Add section</b> to tag a subcategory.
              </div>
            )}

            <div className="space-y-4">
              {config.sections.map((sec, idx) => {
                const products = sectionProducts[sec.subcategory_id] || [];
                return (
                  <div key={`${sec.subcategory_id}-${idx}`} className="rounded-2xl border border-outline-variant/40 bg-surface-container-low p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <button onClick={() => move(idx, -1)} disabled={idx === 0} className="text-on-surface-variant disabled:opacity-30 hover:text-on-surface"><span className="material-symbols-outlined text-[18px]">keyboard_arrow_up</span></button>
                        <button onClick={() => move(idx, 1)} disabled={idx === config.sections.length - 1} className="text-on-surface-variant disabled:opacity-30 hover:text-on-surface"><span className="material-symbols-outlined text-[18px]">keyboard_arrow_down</span></button>
                      </div>
                      <div className="flex-1 min-w-[160px]">
                        <label className="block font-label text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">Subcategory</label>
                        <select value={sec.subcategory_id} onChange={(e) => patchSection(idx, "subcategory_id", Number(e.target.value))} className={`${inputCls} w-full`}>
                          {subs.map((s) => <option key={s.id} value={s.id}>{s.category} → {s.name}</option>)}
                        </select>
                      </div>
                      <div className="w-40">
                        <label className="block font-label text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">Title override</label>
                        <input value={sec.title_override ?? ""} onChange={(e) => patchSection(idx, "title_override", e.target.value)} placeholder={sec.subcategory_name || ""} className={`${inputCls} w-full`} />
                      </div>
                      <button onClick={() => removeSection(idx)} className="mt-5 text-error hover:opacity-80" title="Remove section"><span className="material-symbols-outlined">delete</span></button>
                    </div>

                    {/* products preview */}
                    <div className="mt-4 pt-4 border-t border-outline-variant/30">
                      <p className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant mb-2">
                        Products in this section ({products.filter((p) => p.is_active).length})
                      </p>
                      {products.length === 0 ? (
                        <p className="text-on-surface-variant text-xs">No products yet — add some in Products under this subcategory.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {products.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => toggleSwagOnly(p)}
                              disabled={busyProduct === p.id}
                              title={p.is_swag_only ? "Swag-only (hidden from catalog) — click to also show in catalog" : "Also in catalog — click to make swag-only"}
                              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${
                                p.is_swag_only ? "bg-secondary-container text-on-secondary-container border-transparent" : "bg-surface border-outline-variant/50 text-on-surface"
                              }`}
                            >
                              {p.name} · ₹{p.base_price}
                              {p.is_swag_only && <span className="material-symbols-outlined text-[13px] align-middle ml-1">visibility_off</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 rounded-2xl px-5 py-3.5 text-sm font-bold shadow-xl ${toast.kind === "success" ? "bg-secondary-container text-on-secondary-container" : "bg-error-container text-on-error-container"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-label text-[10px] uppercase tracking-wider text-on-surface-variant mb-1">{label}</label>
      {children}
    </div>
  );
}
