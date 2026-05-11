"use client";

import { useEffect, useMemo, useState } from "react";
import { api, PageSeo } from "@/lib/api";
import SeoFieldsEditor from "@/components/SeoFieldsEditor";

export default function PageSeoAdminPage() {
  const [rows, setRows] = useState<PageSeo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<PageSeo | null>(null);
  const [draft, setDraft] = useState<PageSeo | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [onlyWithOverrides, setOnlyWithOverrides] = useState(false);
  const [newRoute, setNewRoute] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const list = await api.listPageSeo();
      setRows(list);
      // Auto-select the previously selected route (or first row)
      if (selected) {
        const refreshed = list.find((r) => r.id === selected.id);
        if (refreshed) {
          setSelected(refreshed);
          setDraft(refreshed);
          return;
        }
      }
      if (list.length > 0) {
        setSelected(list[0]);
        setDraft(list[0]);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load page SEO");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch =
        !q ||
        r.route.toLowerCase().includes(q) ||
        (r.label || "").toLowerCase().includes(q) ||
        (r.seo_title || "").toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (onlyWithOverrides) {
        const hasOverride = !!(
          r.seo_title ||
          r.seo_description ||
          r.seo_keywords ||
          r.og_image ||
          r.seo_canonical ||
          r.seo_noindex
        );
        if (!hasOverride) return false;
      }
      return true;
    });
  }, [rows, search, onlyWithOverrides]);

  const overrideCount = useMemo(() => rows.filter((r) => !!(r.seo_title || r.seo_description || r.og_image)).length, [rows]);

  async function handleSave() {
    if (!draft || !selected) return;
    setSaving(true);
    setError("");
    try {
      const updated = await api.updatePageSeo(selected.id, {
        label: draft.label || null,
        seo_title: draft.seo_title || null,
        seo_description: draft.seo_description || null,
        seo_keywords: draft.seo_keywords || null,
        og_image: draft.og_image || null,
        seo_canonical: draft.seo_canonical || null,
        seo_noindex: !!draft.seo_noindex,
      });
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setSelected(updated);
      setDraft(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    const route = newRoute.trim();
    if (!route) { setError("Route required"); return; }
    setCreating(true);
    setError("");
    try {
      const created = await api.createPageSeo({
        route: route.startsWith("/") ? route : `/${route}`,
        label: newLabel.trim() || null,
      });
      setRows((prev) => [...prev, created].sort((a, b) => a.route.localeCompare(b.route)));
      setSelected(created);
      setDraft(created);
      setNewRoute("");
      setNewLabel("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    if (!confirm(`Delete SEO override for ${selected.route}? The page will fall back to auto-generated metadata.`)) return;
    try {
      await api.deletePageSeo(selected.id);
      setRows((prev) => prev.filter((r) => r.id !== selected.id));
      setSelected(null);
      setDraft(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  const dirty = useMemo(() => {
    if (!draft || !selected) return false;
    return (
      draft.label !== selected.label ||
      draft.seo_title !== selected.seo_title ||
      draft.seo_description !== selected.seo_description ||
      draft.seo_keywords !== selected.seo_keywords ||
      draft.og_image !== selected.og_image ||
      draft.seo_canonical !== selected.seo_canonical ||
      !!draft.seo_noindex !== !!selected.seo_noindex
    );
  }, [draft, selected]);

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <header className="mb-6">
          <h1 className="font-headline font-black text-3xl text-on-surface uppercase tracking-tight">Page SEO</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Override metadata for static pages (FAQs, About Us, etc.). Edits go live without a rebuild — the frontend reads these per request.
          </p>
        </header>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Sidebar — route list */}
          <aside className="bg-surface-container rounded-2xl p-4">
            <div className="mb-3 space-y-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search routes..."
                className="w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant text-sm outline-none focus:border-primary"
              />
              <label className="flex items-center justify-between gap-2 px-2 py-1.5 cursor-pointer hover:bg-surface-container-high rounded-lg">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">With overrides only</span>
                <span className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-on-surface-variant">{overrideCount}/{rows.length}</span>
                  <input
                    type="checkbox"
                    checked={onlyWithOverrides}
                    onChange={(e) => setOnlyWithOverrides(e.target.checked)}
                    className="accent-primary cursor-pointer"
                  />
                </span>
              </label>
            </div>

            {loading ? (
              <p className="text-sm text-on-surface-variant px-3 py-2">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-on-surface-variant px-3 py-2">No routes match.</p>
            ) : (
              <ul className="space-y-1">
                {filtered.map((r) => {
                  const isSelected = selected?.id === r.id;
                  const hasOverride = !!(r.seo_title || r.seo_description || r.og_image);
                  return (
                    <li key={r.id}>
                      <button
                        onClick={() => { setSelected(r); setDraft(r); }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                          isSelected ? "bg-primary text-on-primary" : "hover:bg-surface-container-high"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm truncate">{r.label || r.route}</span>
                          {hasOverride && (
                            <span className={`text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded ${
                              isSelected ? "bg-on-primary/20" : "bg-secondary-container text-on-secondary-container"
                            }`}>SET</span>
                          )}
                        </div>
                        <p className={`text-[11px] font-mono mt-0.5 truncate ${isSelected ? "opacity-80" : "text-on-surface-variant"}`}>{r.route}</p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Create new */}
            <div className="border-t border-outline-variant mt-4 pt-4">
              <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-2">Add Custom Route</p>
              <input
                type="text"
                value={newRoute}
                onChange={(e) => setNewRoute(e.target.value)}
                placeholder="/some-custom-page"
                className="w-full px-3 py-2 mb-2 rounded-lg bg-surface border border-outline-variant text-sm outline-none focus:border-primary"
              />
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Label (e.g. Wedding Stationery)"
                className="w-full px-3 py-2 mb-2 rounded-lg bg-surface border border-outline-variant text-sm outline-none focus:border-primary"
              />
              <button
                onClick={handleCreate}
                disabled={creating || !newRoute.trim()}
                className="w-full px-3 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50"
              >
                {creating ? "Adding..." : "+ Add route"}
              </button>
            </div>
          </aside>

          {/* Detail panel */}
          <main className="bg-surface-container rounded-2xl p-6">
            {!selected || !draft ? (
              <p className="text-on-surface-variant text-sm">Pick a route from the left to edit its SEO.</p>
            ) : (
              <>
                <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Editing</p>
                    <h2 className="font-headline text-2xl font-black mt-0.5">{selected.label || selected.route}</h2>
                    <code className="text-xs text-on-surface-variant font-mono">{selected.route}</code>
                  </div>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-on-error-container bg-error-container rounded-lg hover:bg-error/10"
                  >
                    Delete override
                  </button>
                </div>

                {/* Label field */}
                <div className="mb-6">
                  <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold block mb-1.5">Internal Label (admin only)</label>
                  <input
                    type="text"
                    value={draft.label || ""}
                    onChange={(e) => setDraft({ ...draft, label: e.target.value || null })}
                    placeholder="e.g. Homepage, About Us"
                    className="w-full px-3 py-2.5 rounded-xl bg-surface border border-outline-variant focus:border-primary outline-none text-sm"
                  />
                </div>

                <SeoFieldsEditor
                  value={draft}
                  onChange={(next) => setDraft({ ...draft, ...next })}
                  scopeLabel={`route ${selected.route}`}
                />

                <div className="mt-8 flex items-center justify-end gap-3">
                  {dirty && <span className="text-xs text-on-surface-variant italic">Unsaved changes</span>}
                  <button
                    onClick={() => setDraft(selected)}
                    disabled={!dirty || saving}
                    className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-on-surface-variant bg-surface border border-outline-variant rounded-xl hover:bg-surface-container-high disabled:opacity-50"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!dirty || saving}
                    className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest bg-primary text-on-primary rounded-xl hover:bg-primary/90 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
