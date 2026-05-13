"use client";
import { useEffect, useRef, useState } from "react";
import { api, Category, SubCategory } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import SeoFieldsEditor from "@/components/SeoFieldsEditor";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

// Robust slugify: lowercase, replace any non-alphanumeric with -, collapse repeats, trim dashes.
// Example: "Hoodies & jackets" -> "hoodies-jackets", "Gifts Under 99" -> "gifts-under-99"
function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CATEGORY_ICONS = [
  "checkroom", "shopping_bag", "business_center", "card_giftcard", "local_drink",
  "badge", "label", "campaign", "forest", "inventory_2", "edit_note", "ads_click",
  "category", "storefront", "redeem", "devices", "headphones", "sports_esports",
  "print", "photo_camera", "palette", "brush", "restaurant", "local_cafe",
  "fitness_center", "pets", "child_care", "school", "science", "build",
  "home_repair_service", "electrical_services", "plumbing", "carpenter",
  "auto_awesome", "diamond", "workspace_premium", "emoji_objects", "lightbulb",
  "recycling", "eco", "water_drop", "local_florist", "spa", "self_improvement",
  "celebration", "cake", "wine_bar", "nightlife", "theater_comedy",
  "sports_soccer", "directions_bike", "hiking", "pool", "surfing",
  "flight", "luggage", "hotel", "apartment", "chair", "bed",
  "style", "dry_cleaning", "iron", "laundry",
  "draw", "architecture", "design_services", "engineering",
  "local_shipping", "conveyor_belt", "package_2", "deployed_code",
  "handyman", "construction", "foundation", "roofing",
  "music_note", "mic", "piano", "guitar",
  "monitor", "laptop", "phone_iphone", "tablet", "watch",
  "shopping_cart", "receipt_long", "qr_code", "barcode",
];

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = CATEGORY_ICONS.filter((i) => i.includes(search.toLowerCase().replace(/\s+/g, "_")));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all min-w-[160px]"
      >
        <span className="material-symbols-outlined text-[22px]">{value || "category"}</span>
        <span className="text-on-surface-variant text-xs font-label font-bold uppercase tracking-wider flex-1 text-left">{(value || "category").replace(/_/g, " ")}</span>
        <span className="material-symbols-outlined text-[16px] text-on-surface-variant">{open ? "expand_less" : "expand_more"}</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-[340px] bg-surface-container-lowest border border-outline-variant/50 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-3 border-b border-outline-variant/30">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span>
              <input
                autoFocus
                placeholder="Search icons..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-surface-container border border-outline-variant/30 rounded-xl pl-10 pr-4 py-2.5 text-sm text-on-surface w-full focus:outline-none"
              />
            </div>
          </div>
          <div className="max-h-[240px] overflow-y-auto p-3 grid grid-cols-6 gap-1.5">
            {filtered.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => { onChange(icon); setOpen(false); setSearch(""); }}
                title={icon.replace(/_/g, " ")}
                className={`w-full aspect-square flex items-center justify-center rounded-xl transition-all ${icon === value ? "bg-primary text-on-primary shadow-md scale-110" : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface"}`}
              >
                <span className="material-symbols-outlined text-[22px]">{icon}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-6 text-center text-sm text-on-surface-variant py-4">No matching icons</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Category form
  const emptyCatSeo = { seo_title: null as string | null, seo_description: null as string | null, seo_keywords: null as string | null, og_image: null as string | null, seo_canonical: null as string | null, seo_noindex: false };
  const [catForm, setCatForm] = useState({ name: "", slug: "", icon: "category", is_active: true, ...emptyCatSeo });
  const [editCat, setEditCat] = useState<Category | null>(null);

  // SubCategory form
  const [subForm, setSubForm] = useState({ name: "", slug: "", category_id: 0, is_active: true, ...emptyCatSeo });
  const [editSub, setEditSub] = useState<SubCategory | null>(null);
  const [showSubForm, setShowSubForm] = useState<number | null>(null);

  const [error, setError] = useState("");

  // Delete confirmation dialog state
  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: "category"; id: number; name: string; subCount: number }
    | { kind: "subcategory"; id: number; name: string; categoryName: string }
    | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try { setCategories(await api.getCategories()); } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function saveCategory() {
    setError("");
    try {
      if (editCat) { await api.updateCategory(editCat.id, catForm); setEditCat(null); }
      else { await api.createCategory({ ...catForm }); }
      setCatForm({ name: "", slug: "", icon: "category", is_active: true, ...emptyCatSeo });
      load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }

  function requestDeleteCategory(cat: Category) {
    setDeleteTarget({ kind: "category", id: cat.id, name: cat.name, subCount: cat.subcategories?.length || 0 });
  }

  function requestDeleteSubCategory(sub: SubCategory, catName: string) {
    setDeleteTarget({ kind: "subcategory", id: sub.id, name: sub.name, categoryName: catName });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      if (deleteTarget.kind === "category") {
        await api.deleteCategory(deleteTarget.id);
      } else {
        await api.deleteSubCategory(deleteTarget.id);
      }
      setDeleteTarget(null);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setDeleting(false);
    }
  }

  async function saveSubCategory() {
    setError("");
    try {
      if (editSub) { await api.updateSubCategory(editSub.id, subForm); setEditSub(null); }
      else { await api.createSubCategory({ ...subForm }); }
      setSubForm({ name: "", slug: "", category_id: 0, is_active: true, ...emptyCatSeo });
      setShowSubForm(null);
      load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }

  // deleteSubCategory replaced by ConfirmDeleteDialog flow above

  function startEditCat(cat: Category) {
    setEditCat(cat);
    setCatForm({
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon || "category",
      is_active: cat.is_active,
      seo_title: cat.seo_title ?? null,
      seo_description: cat.seo_description ?? null,
      seo_keywords: cat.seo_keywords ?? null,
      og_image: cat.og_image ?? null,
      seo_canonical: cat.seo_canonical ?? null,
      seo_noindex: !!cat.seo_noindex,
    });
  }

  function startAddSub(catId: number) {
    setEditSub(null);
    setSubForm({ name: "", slug: "", category_id: catId, is_active: true, ...emptyCatSeo });
    setShowSubForm(catId);
  }

  function startEditSub(sub: SubCategory) {
    setEditSub(sub);
    setSubForm({
      name: sub.name,
      slug: sub.slug,
      category_id: sub.category_id,
      is_active: sub.is_active,
      seo_title: sub.seo_title ?? null,
      seo_description: sub.seo_description ?? null,
      seo_keywords: sub.seo_keywords ?? null,
      og_image: sub.og_image ?? null,
      seo_canonical: sub.seo_canonical ?? null,
      seo_noindex: !!sub.seo_noindex,
    });
    setShowSubForm(sub.category_id);
  }

  return (
    <div className="pb-12 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h2 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">Categories</h2>
        <p className="text-on-surface-variant font-medium">Manage product categories and subcategories.</p>
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
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-container-lowest rounded-[2rem] shadow-xl shadow-surface-variant/20 border border-outline-variant/30 p-8 mb-8"
      >
        <h3 className="font-headline font-bold text-xl mb-6 text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary-container bg-secondary-container/20 p-2 rounded-full">category</span>
          {editCat ? "Edit Category" : "Add New Category"}
        </h3>
        <div className="flex flex-wrap items-center gap-4">
          <IconPicker value={catForm.icon} onChange={(icon) => setCatForm(f => ({ ...f, icon }))} />
          <input placeholder="Name" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value, slug: editCat ? f.slug : (f.slug || slugify(e.target.value)) }))}
            className="bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all" />
          <input placeholder="slug-auto-from-name" value={catForm.slug} onChange={e => setCatForm(f => ({ ...f, slug: slugify(e.target.value) }))}
            className="bg-surface-container border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface font-mono flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all" />
          <label className="flex items-center gap-3 text-sm font-label font-bold cursor-pointer text-on-surface bg-surface-container px-4 py-3 rounded-xl border border-outline-variant/50">
            <input type="checkbox" checked={catForm.is_active} onChange={e => setCatForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-secondary-container" />
            Active
          </label>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={saveCategory} className="bg-primary text-on-primary font-label font-bold px-6 py-3 rounded-xl text-sm transition-colors flex items-center gap-2 shadow-md">
            {editCat ? "Update" : "Add"} <span className="material-symbols-outlined text-[18px]">add</span>
          </motion.button>
          {editCat && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setEditCat(null); setCatForm({ name: "", slug: "", icon: "category", is_active: true, ...emptyCatSeo }); }} className="bg-surface-container border border-outline-variant/50 text-on-surface-variant font-label font-bold px-6 py-3 rounded-xl text-sm">
              Cancel
            </motion.button>
          )}
        </div>

        {/* SEO override — only show when editing an existing category */}
        {editCat && (
          <div className="mt-6">
            <SeoFieldsEditor
              value={{
                seo_title: catForm.seo_title,
                seo_description: catForm.seo_description,
                seo_keywords: catForm.seo_keywords,
                og_image: catForm.og_image,
                seo_canonical: catForm.seo_canonical,
                seo_noindex: catForm.seo_noindex,
              }}
              onChange={(next) => setCatForm((f) => ({ ...f, ...next, seo_noindex: !!next.seo_noindex }))}
              defaultTitle={catForm.name ? `${catForm.name} — ClayBag` : undefined}
              scopeLabel="this category"
            />
          </div>
        )}
      </motion.div>

      {loading ? (
        <div className="flex justify-center p-12">
          <span className="material-symbols-outlined animate-spin text-4xl text-outline-variant">progress_activity</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {categories.map((cat, idx) => (
            <motion.div 
               initial={{ opacity: 0, y: 10 }} 
               animate={{ opacity: 1, y: 0 }} 
               transition={{ delay: idx * 0.05 }}
               key={cat.id} 
               className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/30 overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-5 bg-surface-container-lowest hover:bg-surface-container-low transition-colors group">
                <div className="flex items-center gap-4">
                  <button onClick={() => setExpanded(expanded === cat.id ? null : cat.id)} className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant">
                    <span className="material-symbols-outlined transition-transform duration-300" style={{ transform: expanded === cat.id ? 'rotate(180deg)' : 'rotate(0)' }}>
                      keyboard_arrow_down
                    </span>
                  </button>
                  <span className="material-symbols-outlined text-[24px] text-primary">{cat.icon || "category"}</span>
                  <div>
                    <p className="font-headline font-bold text-lg text-on-surface">{cat.name}</p>
                    <p className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant opacity-80 mt-1">{cat.slug} • {cat.subcategories.length} subcategories</p>
                  </div>
                  {!cat.is_active && <span className="text-[10px] uppercase font-bold tracking-wider bg-error-container text-on-error-container px-3 py-1 rounded-full ml-4">Inactive</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => startAddSub(cat.id)} className="flex items-center gap-1 text-xs font-label font-bold bg-secondary-container/20 text-on-surface hover:bg-secondary-container px-4 py-2 rounded-xl transition-colors">
                    <span className="material-symbols-outlined text-[16px]">add</span> Sub
                  </button>
                  <button onClick={() => startEditCat(cat)} className="flex items-center gap-1 text-xs font-label font-bold bg-surface-container text-on-surface hover:bg-surface-container-high px-4 py-2 rounded-xl transition-colors">
                    <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                  </button>
                  <button onClick={() => requestDeleteCategory(cat)} className="flex items-center gap-1 text-xs font-label font-bold bg-error-container/50 text-error hover:bg-error-container px-4 py-2 rounded-xl transition-colors">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expanded === cat.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-outline-variant/20 px-8 py-6 bg-surface-container-lowest">
                      {showSubForm === cat.id && (
                        <div className="mb-6 p-4 bg-surface-container rounded-2xl border border-outline-variant/30">
                          <div className="flex flex-wrap items-center gap-3">
                            <input placeholder="Sub-category name" value={subForm.name}
                              onChange={e => setSubForm(f => ({ ...f, name: e.target.value, slug: editSub ? f.slug : (f.slug || slugify(e.target.value)) }))}
                              className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-2.5 text-sm text-on-surface flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all" />
                            <input placeholder="slug-auto-from-name" value={subForm.slug} onChange={e => setSubForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                              className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-2.5 text-sm text-on-surface font-mono flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all" />
                            <label className="flex items-center gap-2 text-sm font-label font-bold cursor-pointer text-on-surface bg-surface-container-lowest border border-outline-variant/50 px-4 py-2.5 rounded-xl">
                              <input type="checkbox" checked={subForm.is_active} onChange={e => setSubForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 accent-secondary-container" />
                              Active
                            </label>
                            <button onClick={saveSubCategory} className="bg-primary text-on-primary font-label font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">{editSub ? "Update" : "Add"}</button>
                            <button onClick={() => { setShowSubForm(null); setEditSub(null); }} className="bg-surface border border-outline-variant/50 text-on-surface-variant font-label font-bold px-5 py-2.5 rounded-xl text-sm">Cancel</button>
                          </div>
                          {editSub && (
                            <SeoFieldsEditor
                              value={{
                                seo_title: subForm.seo_title,
                                seo_description: subForm.seo_description,
                                seo_keywords: subForm.seo_keywords,
                                og_image: subForm.og_image,
                                seo_canonical: subForm.seo_canonical,
                                seo_noindex: subForm.seo_noindex,
                              }}
                              onChange={(next) => setSubForm((f) => ({ ...f, ...next, seo_noindex: !!next.seo_noindex }))}
                              defaultTitle={subForm.name ? `${subForm.name} — ${cat.name} — ClayBag` : undefined}
                              scopeLabel="this subcategory"
                            />
                          )}
                        </div>
                      )}
                      
                      {cat.subcategories.length === 0 ? (
                        <p className="text-sm font-medium text-on-surface-variant py-2 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">info</span> No subcategories yet.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {cat.subcategories.map(sub => (
                            <div key={sub.id} className="group flex items-center justify-between bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-3 hover:border-outline-variant transition-colors">
                              <div>
                                <span className="text-sm font-headline font-bold text-on-surface">{sub.name}</span>
                                {!sub.is_active && <span className="text-[9px] uppercase font-bold tracking-wider text-error opacity-80 block mt-0.5">Inactive</span>}
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={async () => {
                                    try { await api.updateSubCategory(sub.id, { is_active: !sub.is_active }); load(); }
                                    catch (e: unknown) { setError(e instanceof Error ? e.message : "Toggle failed"); }
                                  }}
                                  title={sub.is_active ? "Hide subcategory (set inactive)" : "Show subcategory (set active)"}
                                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                                    sub.is_active
                                      ? "hover:bg-surface-container-high text-on-surface"
                                      : "bg-error-container/30 hover:bg-error-container text-error"
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[16px]">{sub.is_active ? "visibility" : "visibility_off"}</span>
                                </button>
                                <button onClick={() => startEditSub(sub)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-high text-on-surface transition-colors">
                                  <span className="material-symbols-outlined text-[16px]">edit</span>
                                </button>
                                <button onClick={() => requestDeleteSubCategory(sub, cat.name)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-error-container text-error transition-colors">
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        busy={deleting}
        title={deleteTarget?.kind === "category" ? "Delete Category" : "Delete Subcategory"}
        confirmText={deleteTarget ? deleteTarget.name : null}
        warning={
          deleteTarget?.kind === "category" ? (
            <span>
              You are about to delete <strong>{deleteTarget.name}</strong>. This is a
              <strong className="text-error"> permanent cascade delete</strong> — every subcategory
              and every product (with its images, variants, and discount slabs) inside this category
              will be wiped from the database.
            </span>
          ) : deleteTarget ? (
            <span>
              You are about to delete <strong>{deleteTarget.name}</strong> (under {deleteTarget.categoryName}).
              All products in this subcategory will also be deleted permanently.
            </span>
          ) : null
        }
        impact={
          deleteTarget?.kind === "category" && deleteTarget.subCount > 0
            ? `${deleteTarget.subCount} subcategor${deleteTarget.subCount === 1 ? "y" : "ies"} + every product inside`
            : undefined
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
