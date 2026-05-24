"use client";

// Admin CRUD for "Curated for Businesses" industries.
// Mirrors the Categories admin page style but flat (no subcategories) and adds
// hero + card image uploads (premium editorial layout depends on both).

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { api, BusinessCategory, BusinessCategoryCreate, BusinessCategoryUpdate } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import SeoFieldsEditor from "@/components/SeoFieldsEditor";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const emptySeo = {
  seo_title: null as string | null,
  seo_description: null as string | null,
  seo_keywords: null as string | null,
  og_image: null as string | null,
  seo_canonical: null as string | null,
  seo_noindex: false,
};

type FormState = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  display_order: number;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  og_image: string | null;
  seo_canonical: string | null;
  seo_noindex: boolean;
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  tagline: "",
  description: "",
  display_order: 0,
  is_active: true,
  ...emptySeo,
};

export default function IndustriesPage() {
  const [items, setItems] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessCategory | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Upload state
  const heroFileRef = useRef<HTMLInputElement>(null);
  const cardFileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"hero" | "card" | null>(null);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<BusinessCategory | null>(null);

  async function load() {
    setLoading(true);
    try {
      setItems(await api.getBusinessCategories());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load industries");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function startCreate() {
    setEditing(null);
    setForm(emptyForm);
    setDrawerOpen(true);
  }

  function startEdit(bc: BusinessCategory) {
    setEditing(bc);
    setForm({
      name: bc.name,
      slug: bc.slug,
      tagline: bc.tagline ?? "",
      description: bc.description ?? "",
      display_order: bc.display_order,
      is_active: bc.is_active,
      seo_title: bc.seo_title ?? null,
      seo_description: bc.seo_description ?? null,
      seo_keywords: bc.seo_keywords ?? null,
      og_image: bc.og_image ?? null,
      seo_canonical: bc.seo_canonical ?? null,
      seo_noindex: bc.seo_noindex ?? false,
    });
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setTimeout(() => {
      setEditing(null);
      setForm(emptyForm);
    }, 200);
  }

  async function save() {
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload: BusinessCategoryCreate | BusinessCategoryUpdate = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        tagline: form.tagline.trim() || null,
        description: form.description.trim() || null,
        display_order: Number(form.display_order) || 0,
        is_active: form.is_active,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        seo_keywords: form.seo_keywords || null,
        og_image: form.og_image || null,
        seo_canonical: form.seo_canonical || null,
        seo_noindex: form.seo_noindex,
      };
      if (editing) {
        await api.updateBusinessCategory(editing.id, payload);
      } else {
        await api.createBusinessCategory(payload as BusinessCategoryCreate);
      }
      await load();
      closeDrawer();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function quickToggle(bc: BusinessCategory) {
    try {
      await api.updateBusinessCategory(bc.id, { is_active: !bc.is_active });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Toggle failed");
    }
  }

  async function uploadImage(kind: "hero" | "card", file: File) {
    if (!editing) {
      setError("Save the industry first, then upload images");
      return;
    }
    setUploading(kind);
    try {
      const res = kind === "hero"
        ? await api.uploadBusinessCategoryHero(editing.id, file)
        : await api.uploadBusinessCategoryCard(editing.id, file);
      // Refresh the row in state so the preview updates
      setItems((prev) =>
        prev.map((bc) =>
          bc.id === editing.id
            ? { ...bc, [kind === "hero" ? "hero_image_url" : "card_image_url"]: res.image_url }
            : bc
        )
      );
      // Also refresh the editing reference so future saves reflect the upload
      setEditing((prev) => prev ? { ...prev, [kind === "hero" ? "hero_image_url" : "card_image_url"]: res.image_url } : prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function doDelete() {
    if (!deleteTarget) return;
    try {
      await api.deleteBusinessCategory(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="font-label text-[10px] uppercase tracking-[0.35em] text-on-surface-variant mb-1">
            Curated for Businesses
          </p>
          <h1 className="font-display text-4xl text-on-surface tracking-tight">Industries</h1>
          <p className="font-body text-sm text-on-surface-variant mt-2 max-w-2xl">
            Industries surface on <code className="font-mono text-xs">/curated-for-businesses</code> as
            editorial cards. A product can belong to multiple industries — tag them from the product edit page.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-on-primary text-sm font-label font-bold uppercase tracking-widest hover:opacity-90"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New industry
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
            Loading industries…
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/50 block mb-3">domain</span>
            <p className="font-headline text-lg text-on-surface">No industries yet</p>
            <p className="font-body text-sm text-on-surface-variant mt-1">
              Create your first industry to start curating products by vertical.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container text-on-surface-variant uppercase tracking-widest text-[11px]">
              <tr>
                <th className="px-5 py-3 text-left font-label font-bold w-20">Order</th>
                <th className="px-5 py-3 text-left font-label font-bold">Industry</th>
                <th className="px-5 py-3 text-left font-label font-bold">Slug</th>
                <th className="px-5 py-3 text-right font-label font-bold">Products</th>
                <th className="px-5 py-3 text-center font-label font-bold">Active</th>
                <th className="px-5 py-3 text-right font-label font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((bc) => (
                <tr key={bc.id} className="border-t border-outline-variant/40 hover:bg-surface-container">
                  <td className="px-5 py-4 font-mono text-xs text-on-surface-variant">{bc.display_order}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {bc.card_image_url || bc.hero_image_url ? (
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-container-high shrink-0">
                          <Image src={bc.card_image_url || bc.hero_image_url || ""} alt="" width={48} height={48} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-surface-container-high shrink-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[18px] text-on-surface-variant/50">image</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-body font-medium text-on-surface truncate">{bc.name}</div>
                        {bc.tagline && (
                          <div className="text-xs text-on-surface-variant truncate max-w-md">{bc.tagline}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-on-surface-variant">{bc.slug}</td>
                  <td className="px-5 py-4 text-right font-mono text-sm">{bc.product_count}</td>
                  <td className="px-5 py-4 text-center">
                    <button
                      onClick={() => quickToggle(bc)}
                      className={`inline-flex items-center justify-center w-10 h-6 rounded-full transition-colors ${
                        bc.is_active ? "bg-primary" : "bg-surface-container-highest"
                      }`}
                      title={bc.is_active ? "Active" : "Inactive — hidden from public"}
                    >
                      <span
                        className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          bc.is_active ? "translate-x-2" : "-translate-x-2"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => startEdit(bc)}
                        className="px-3 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-xs font-label font-bold uppercase tracking-widest"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteTarget(bc)}
                        className="px-3 py-1.5 rounded-full bg-error-container text-on-error-container text-xs font-label font-bold uppercase tracking-widest hover:opacity-90"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer — create / edit form */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-black/40 z-50 flex justify-end"
          >
            <motion.div
              initial={{ x: 600 }}
              animate={{ x: 0 }}
              exit={{ x: 600 }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-surface-container-lowest h-full overflow-y-auto"
            >
              <div className="sticky top-0 bg-surface-container-lowest/95 backdrop-blur border-b border-outline-variant z-10 px-8 py-5 flex items-center justify-between">
                <div>
                  <p className="font-label text-[10px] uppercase tracking-[0.35em] text-on-surface-variant mb-1">
                    {editing ? "Edit Industry" : "New Industry"}
                  </p>
                  <h2 className="font-headline font-bold text-xl text-on-surface">
                    {editing ? editing.name : "Untitled industry"}
                  </h2>
                </div>
                <button onClick={closeDrawer} className="p-2 rounded-full hover:bg-surface-container">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="px-8 py-6 space-y-6">
                {/* Name + slug */}
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Name">
                    <input
                      value={form.name}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm((f) => ({
                          ...f,
                          name: v,
                          // auto-update slug only when creating and user hasn't overridden it
                          slug: !editing && (!f.slug || f.slug === slugify(f.name)) ? slugify(v) : f.slug,
                        }));
                      }}
                      placeholder="Food, Beverage & Cafés"
                      className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </Field>
                  <Field label="URL Slug">
                    <input
                      value={form.slug}
                      onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                      placeholder="food-beverage-cafes"
                      className="w-full font-mono bg-surface-container border border-outline-variant/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </Field>
                </div>

                <Field label="Tagline" hint="One-line subtitle shown on the industry page (≤ 200 chars)">
                  <input
                    value={form.tagline}
                    onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                    maxLength={200}
                    placeholder="Packaging, uniforms and cups that travel with your brand."
                    className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </Field>

                <Field label="Description" hint="2-3 sentences. Shown in the intro paragraph + used for SEO.">
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={4}
                    className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y"
                  />
                </Field>

                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Display order" hint="Lower numbers come first on the landing page">
                    <input
                      type="number"
                      value={form.display_order}
                      onChange={(e) => setForm((f) => ({ ...f, display_order: Number(e.target.value) || 0 }))}
                      className="w-full bg-surface-container border border-outline-variant/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </Field>
                  <div className="flex items-end">
                    <label className="inline-flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                        className="w-5 h-5 rounded accent-primary"
                      />
                      <span className="font-body text-sm">Active (visible to customers)</span>
                    </label>
                  </div>
                </div>

                {/* Image uploads */}
                <div className="grid md:grid-cols-2 gap-4">
                  <ImageUploadField
                    label="Hero image"
                    hint="Full-bleed image on the industry detail page"
                    currentUrl={editing?.hero_image_url ?? null}
                    inputRef={heroFileRef}
                    uploading={uploading === "hero"}
                    disabled={!editing}
                    onPick={(file) => uploadImage("hero", file)}
                  />
                  <ImageUploadField
                    label="Card image"
                    hint="Compact image on the landing-page mosaic"
                    currentUrl={editing?.card_image_url ?? null}
                    inputRef={cardFileRef}
                    uploading={uploading === "card"}
                    disabled={!editing}
                    onPick={(file) => uploadImage("card", file)}
                  />
                </div>
                {!editing && (
                  <p className="text-xs text-on-surface-variant font-body italic">
                    Image uploads become available after you save the industry once.
                  </p>
                )}

                {/* SEO */}
                <div className="pt-2">
                  <SeoFieldsEditor
                    value={{
                      seo_title: form.seo_title,
                      seo_description: form.seo_description,
                      seo_keywords: form.seo_keywords,
                      og_image: form.og_image,
                      seo_canonical: form.seo_canonical,
                      seo_noindex: form.seo_noindex,
                    }}
                    onChange={(next) => setForm((f) => ({
                      ...f,
                      seo_title: next.seo_title ?? null,
                      seo_description: next.seo_description ?? null,
                      seo_keywords: next.seo_keywords ?? null,
                      og_image: next.og_image ?? null,
                      seo_canonical: next.seo_canonical ?? null,
                      seo_noindex: next.seo_noindex ?? false,
                    }))}
                    defaultTitle={form.name ? `${form.name} | ClayBag` : undefined}
                    defaultDescription={form.tagline || form.description || undefined}
                    scopeLabel="this industry"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-surface-container-lowest/95 backdrop-blur border-t border-outline-variant px-8 py-4 flex justify-between items-center">
                <div className="text-xs text-on-surface-variant font-body">
                  {editing ? `Editing #${editing.id}` : "New industry"}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={closeDrawer}
                    className="px-5 py-2.5 rounded-2xl text-sm font-label font-bold hover:bg-surface-container-highest"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={save}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-2xl bg-primary text-on-primary text-sm font-label font-bold uppercase tracking-widest disabled:opacity-50"
                  >
                    {saving ? "Saving…" : editing ? "Save changes" : "Create industry"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title={deleteTarget ? `Delete "${deleteTarget.name}"?` : ""}
        confirmText={deleteTarget?.name ?? null}
        warning={
          deleteTarget && (
            <p>
              This will permanently remove the industry from the public site. Products
              tagged with it will lose the tag but stay live.
            </p>
          )
        }
        impact={
          deleteTarget && deleteTarget.product_count > 0
            ? `${deleteTarget.product_count} product${deleteTarget.product_count === 1 ? "" : "s"} currently tagged with this industry will be untagged.`
            : undefined
        }
        onConfirm={doDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant block mb-2">
        {label}
      </span>
      {children}
      {hint && <span className="font-body text-xs text-on-surface-variant block mt-1">{hint}</span>}
    </label>
  );
}

function ImageUploadField({
  label,
  hint,
  currentUrl,
  inputRef,
  uploading,
  disabled,
  onPick,
}: {
  label: string;
  hint: string;
  currentUrl: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  uploading: boolean;
  disabled: boolean;
  onPick: (file: File) => void;
}) {
  return (
    <div>
      <span className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant block mb-2">
        {label}
      </span>
      <div
        className={`relative aspect-video rounded-2xl border-2 border-dashed border-outline-variant overflow-hidden bg-surface-container flex items-center justify-center ${
          disabled ? "opacity-40" : "cursor-pointer hover:border-primary"
        }`}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
      >
        {currentUrl ? (
          <Image src={currentUrl} alt="" fill className="object-cover" />
        ) : (
          <div className="text-center">
            <span className="material-symbols-outlined text-[28px] text-on-surface-variant/60 block">
              add_photo_alternate
            </span>
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mt-1">
              {uploading ? "Uploading…" : "Click to upload"}
            </span>
          </div>
        )}
        {currentUrl && (
          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="font-label text-xs uppercase tracking-widest font-bold text-white">
              Replace
            </span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
      </div>
      <span className="font-body text-xs text-on-surface-variant block mt-1">{hint}</span>
    </div>
  );
}
