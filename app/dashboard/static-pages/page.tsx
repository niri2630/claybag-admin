"use client";

import { useEffect, useMemo, useState } from "react";
import { api, StaticPage } from "@/lib/api";
import SeoFieldsEditor from "@/components/SeoFieldsEditor";

const WIDGET_HINTS: Record<string, string> = {
  "contact-us": "Insert {{contact_form}} to render the live enquiry form.",
  "refer-and-earn": "Insert {{referral_widget}} to render the live referral code + share controls.",
};

export default function StaticPagesAdminPage() {
  const [rows, setRows] = useState<StaticPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<StaticPage | null>(null);
  const [draft, setDraft] = useState<StaticPage | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const list = await api.listStaticPages();
      setRows(list);
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
      setError(e instanceof Error ? e.message : "Failed to load pages");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty = useMemo(() => {
    if (!draft || !selected) return false;
    return (
      draft.title !== selected.title ||
      (draft.subtitle || "") !== (selected.subtitle || "") ||
      (draft.sidebar_label || "") !== (selected.sidebar_label || "") ||
      draft.body_markdown !== selected.body_markdown ||
      draft.is_active !== selected.is_active ||
      (draft.seo_title || "") !== (selected.seo_title || "") ||
      (draft.seo_description || "") !== (selected.seo_description || "") ||
      (draft.seo_keywords || "") !== (selected.seo_keywords || "") ||
      (draft.og_image || "") !== (selected.og_image || "") ||
      (draft.seo_canonical || "") !== (selected.seo_canonical || "") ||
      !!draft.seo_noindex !== !!selected.seo_noindex
    );
  }, [draft, selected]);

  async function handleSave() {
    if (!draft || !selected) return;
    setSaving(true);
    setError("");
    try {
      const updated = await api.updateStaticPage(selected.id, {
        title: draft.title,
        subtitle: draft.subtitle || null,
        sidebar_label: draft.sidebar_label || null,
        body_markdown: draft.body_markdown,
        is_active: draft.is_active,
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

  const widgetHint = selected ? WIDGET_HINTS[selected.slug] : undefined;
  const bodyLen = draft?.body_markdown.length || 0;

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <header className="mb-6">
          <h1 className="font-headline font-black text-3xl text-on-surface uppercase tracking-tight">
            Page Content
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Edit copy for the footer-linked pages (Privacy, Refunds, Contact, etc.). Body uses Markdown — headings,
            paragraphs, bold, lists. Edits go live without a rebuild.
          </p>
        </header>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar — page list */}
          <aside className="bg-surface-container rounded-2xl p-4">
            {loading ? (
              <p className="text-sm text-on-surface-variant px-3 py-2">Loading...</p>
            ) : rows.length === 0 ? (
              <p className="text-sm text-on-surface-variant px-3 py-2">No pages found.</p>
            ) : (
              <ul className="space-y-1">
                {rows.map((r) => {
                  const isSelected = selected?.id === r.id;
                  return (
                    <li key={r.id}>
                      <button
                        onClick={() => {
                          setSelected(r);
                          setDraft(r);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                          isSelected ? "bg-primary text-on-primary" : "hover:bg-surface-container-high"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm truncate">{r.title}</span>
                          {!r.is_active && (
                            <span
                              className={`text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded ${
                                isSelected ? "bg-on-primary/20" : "bg-error-container text-on-error-container"
                              }`}
                            >
                              Hidden
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[11px] font-mono mt-0.5 truncate ${
                            isSelected ? "opacity-80" : "text-on-surface-variant"
                          }`}
                        >
                          /{r.slug}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          {/* Detail panel */}
          <main className="bg-surface-container rounded-2xl p-6">
            {!selected || !draft ? (
              <p className="text-on-surface-variant text-sm">Pick a page from the left to edit.</p>
            ) : (
              <>
                <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">
                      Editing
                    </p>
                    <h2 className="font-headline text-2xl font-black mt-0.5">{selected.title}</h2>
                    <code className="text-xs text-on-surface-variant font-mono">/{selected.slug}</code>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draft.is_active}
                      onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                      className="accent-primary cursor-pointer"
                    />
                    <span className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">
                      Active (visible on site)
                    </span>
                  </label>
                </div>

                {/* Title + subtitle + sidebar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold block mb-1.5">
                      Title (large hero text)
                    </label>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface border border-outline-variant focus:border-primary outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold block mb-1.5">
                      Eyebrow / Subtitle
                    </label>
                    <input
                      type="text"
                      value={draft.subtitle || ""}
                      onChange={(e) => setDraft({ ...draft, subtitle: e.target.value || null })}
                      placeholder="e.g. Logistics & Delivery"
                      className="w-full px-3 py-2.5 rounded-xl bg-surface border border-outline-variant focus:border-primary outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold block mb-1.5">
                    Sidebar Label (optional, supports newlines with \n)
                  </label>
                  <input
                    type="text"
                    value={draft.sidebar_label || ""}
                    onChange={(e) => setDraft({ ...draft, sidebar_label: e.target.value || null })}
                    placeholder="Defaults to 'Information & Architecture'"
                    className="w-full px-3 py-2.5 rounded-xl bg-surface border border-outline-variant focus:border-primary outline-none text-sm"
                  />
                </div>

                {/* Body markdown editor */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                      Body (Markdown)
                    </label>
                    <span className="text-[10px] font-mono text-on-surface-variant">{bodyLen} chars</span>
                  </div>
                  <textarea
                    value={draft.body_markdown}
                    onChange={(e) => setDraft({ ...draft, body_markdown: e.target.value })}
                    rows={24}
                    spellCheck
                    className="w-full px-3 py-2.5 rounded-xl bg-surface border border-outline-variant focus:border-primary outline-none text-sm font-mono leading-relaxed"
                  />
                  <div className="mt-2 text-[11px] text-on-surface-variant space-y-1">
                    <p>
                      Use <code className="font-mono">##</code> for sections,{" "}
                      <code className="font-mono">###</code> for subsections,{" "}
                      <code className="font-mono">**bold**</code>, and <code className="font-mono">- </code> for
                      bullet lists. Leave a blank line between paragraphs.
                    </p>
                    {widgetHint && (
                      <p className="text-primary font-bold">{widgetHint}</p>
                    )}
                  </div>
                </div>

                <SeoFieldsEditor
                  value={draft}
                  onChange={(next) => setDraft({ ...draft, ...next })}
                  scopeLabel={`page /${selected.slug}`}
                  defaultTitle={selected.title}
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
