"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { api, Category, Product } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

const VARIANT_CLASS_OPTIONS = [
  "size", "color", "material", "paper", "finish", "capacity", "width", "pages",
  "fold", "feature", "attachment", "thickness", "clip", "nib", "tip", "ink",
  "engraving", "screen", "frame", "led", "pockets", "window", "box", "power",
  "style", "shape", "closure", "diameter", "length", "format", "ink_color",
  "accessory", "cap",
];

function VariantClassPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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

  const filtered = VARIANT_CLASS_OPTIONS.filter((o) =>
    o.includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative min-w-[160px]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface w-full focus:outline-none flex items-center justify-between gap-2 text-left"
      >
        <span className={value ? "capitalize" : "text-on-surface/50"}>{value || "Class (e.g. size)"}</span>
        <span className="material-symbols-outlined text-[18px]">{open ? "expand_less" : "expand_more"}</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-2 border-b border-outline-variant/30">
            <input
              autoFocus
              placeholder="Search or type custom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && search.trim()) {
                  onChange(search.trim().toLowerCase());
                  setSearch("");
                  setOpen(false);
                }
              }}
              className="bg-surface-container border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface w-full focus:outline-none"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setSearch(""); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm capitalize hover:bg-secondary-container/30 transition-colors ${opt === value ? "bg-secondary-container/20 font-bold text-primary" : "text-on-surface"}`}
              >
                {opt}
              </button>
            ))}
            {filtered.length === 0 && search.trim() && (
              <button
                type="button"
                onClick={() => { onChange(search.trim().toLowerCase()); setSearch(""); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-secondary-container/30 transition-colors"
              >
                + Add &quot;{search.trim().toLowerCase()}&quot;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Material Symbols icon options for Shipping & Use Cases cards
const SHIPPING_ICONS = [
  "local_shipping", "schedule", "verified", "undo", "inventory_2", "route",
  "package_2", "bolt", "palette", "support_agent", "lock", "payments",
  "shield", "eco", "public", "airport_shuttle", "forklift", "cached",
];
const USECASE_ICONS = [
  "rocket_launch", "groups", "storefront", "card_giftcard", "campaign", "school",
  "celebration", "workspaces", "business_center", "sports_esports", "handshake",
  "diversity_3", "emoji_events", "stars", "flag", "menu_book", "cake", "theater_comedy",
];

// Default shipping & use case points — can be loaded into editor per product
const DEFAULT_SHIPPING_POINTS = [
  { icon: "local_shipping", title: "Pan-India Delivery", description: "Delivered across India. Free shipping on every order — the price you see is the price you pay." },
  { icon: "undo", title: "Returns & Refunds", description: "Easy returns within 7 days of delivery. Customized products are non-returnable." },
];
const DEFAULT_USE_CASE_POINTS = [
  { icon: "rocket_launch", title: "Startup Launches", description: "Brand your launch events with custom merchandise" },
  { icon: "groups", title: "Team Building", description: "Create matching branded gear for your team" },
  { icon: "storefront", title: "Trade Shows & Expos", description: "Stand out at events with branded displays and giveaways" },
  { icon: "card_giftcard", title: "Corporate Gifting", description: "Premium branded gifts for clients and partners" },
  { icon: "campaign", title: "Marketing Campaigns", description: "Physical branded touchpoints for your marketing" },
  { icon: "school", title: "College Fests & Events", description: "Affordable branded merch for student organizations" },
];

// Suggested chips — predefined options the admin can quick-add per product
const SHIPPING_SUGGESTIONS: Point[] = [
  { icon: "local_shipping", title: "Pan-India Delivery", description: "Delivered across India. Free shipping on every order." },
  { icon: "payments", title: "Free Shipping", description: "No hidden charges. The price you see is the price you pay." },
  { icon: "bolt", title: "Express Dispatch", description: "Available to metro cities on request — talk to us for timelines." },
  { icon: "schedule", title: "Custom Branding Time", description: "Branded products dispatch within 7-14 business days after artwork approval." },
  { icon: "inventory_2", title: "Bulk Order Discounts", description: "Per-piece prices drop as quantity increases. See the pricing slabs above." },
  { icon: "route", title: "Trackable Shipping", description: "Tracking link sent via email & SMS once your order ships." },
  { icon: "verified", title: "Quality Checked", description: "Every order goes through a 3-stage QC before dispatch." },
  { icon: "undo", title: "Returns & Refunds", description: "Easy returns within 7 days of delivery. Customized products are non-returnable." },
  { icon: "support_agent", title: "Dedicated Support", description: "Our team is available Mon-Sat, 10 AM to 7 PM IST for any questions." },
  { icon: "shield", title: "Secure Packaging", description: "Each item is bubble-wrapped and shipped in tamper-proof packaging." },
];

const USECASE_SUGGESTIONS: Point[] = [
  { icon: "rocket_launch", title: "Startup Launches", description: "Brand your launch events with custom merchandise" },
  { icon: "groups", title: "Team Building", description: "Create matching branded gear for your team" },
  { icon: "card_giftcard", title: "Corporate Gifting", description: "Premium branded gifts for clients and partners" },
  { icon: "storefront", title: "Trade Shows & Expos", description: "Stand out at events with branded displays and giveaways" },
  { icon: "campaign", title: "Marketing Campaigns", description: "Physical branded touchpoints for your marketing" },
  { icon: "school", title: "College Fests & Events", description: "Affordable branded merch for student organizations" },
  { icon: "business_center", title: "Employee Onboarding", description: "Welcome new hires with a curated branded kit" },
  { icon: "celebration", title: "Festival Celebrations", description: "Custom merchandise for Diwali, Holi, and other festivities" },
  { icon: "handshake", title: "Customer Appreciation", description: "Thank loyal customers with branded keepsakes" },
  { icon: "emoji_events", title: "Sports Events", description: "Team kits, jerseys, and trophies for sporting events" },
  { icon: "stars", title: "Anniversaries & Milestones", description: "Commemorate company milestones with custom merch" },
  { icon: "menu_book", title: "Conferences & Seminars", description: "Branded conference kits for attendees and speakers" },
  { icon: "diversity_3", title: "Community Events", description: "Custom merch for community programs and outreach" },
  { icon: "workspaces", title: "Office Welcome Kits", description: "Set up new office spaces with branded essentials" },
];

type Point = { icon: string; title: string; description: string };

function parsePoints(raw: string): Point[] {
  if (!raw || !raw.trim()) return [];
  return raw.split(/\r?\n/).map((line) => line.trim()).filter((l) => l.length > 0).map((line) => {
    const parts = line.split("|").map((p) => p.trim());
    if (parts.length >= 3) return { icon: parts[0], title: parts[1], description: parts.slice(2).join("|").trim() };
    if (line.includes(":")) {
      const title = line.split(":")[0].trim();
      const description = line.split(":").slice(1).join(":").trim();
      return { icon: "", title, description };
    }
    return { icon: "", title: "", description: line };
  });
}

function stringifyPoints(points: Point[]): string {
  return points
    .map((p) => `${p.icon || ""}|${p.title || ""}|${p.description || ""}`)
    .join("\n");
}

function IconPicker({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl w-11 h-11 flex items-center justify-center hover:bg-surface-container transition-colors">
        <span className="material-symbols-outlined text-[#fdc003]">{value || "add"}</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-2xl z-50 p-2 grid grid-cols-6 gap-1 max-h-64 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              title={opt}
              className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${value === opt ? "bg-[#fdc003]/20" : "hover:bg-surface-container"}`}
            >
              <span className="material-symbols-outlined text-[#785900]" style={{ fontSize: "20px" }}>{opt}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PointEditor({ label, value, onChange, icons, placeholder, defaults, suggestions }: { label: string; value: string; onChange: (v: string) => void; icons: string[]; placeholder: string; defaults?: Point[]; suggestions?: Point[] }) {
  const [points, setPoints] = useState<Point[]>(() => parsePoints(value));
  const lastExternalRef = useRef<string>(value);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  // Sync from external value ONLY when it changes from outside (e.g. editing a different product)
  useEffect(() => {
    if (value !== lastExternalRef.current && value !== stringifyPoints(points)) {
      setPoints(parsePoints(value));
      lastExternalRef.current = value;
    }
  }, [value, points]);

  const commit = (next: Point[]) => {
    setPoints(next);
    const s = stringifyPoints(next);
    lastExternalRef.current = s;
    onChange(s);
  };

  const update = (i: number, patch: Partial<Point>) => {
    const next = [...points];
    next[i] = { ...next[i], ...patch };
    commit(next);
  };
  const add = () => commit([...points, { icon: icons[0], title: "", description: "" }]);
  const remove = (i: number) => commit(points.filter((_, idx) => idx !== i));
  const loadDefaults = () => defaults && commit([...points, ...defaults]);

  // Suggestions filter — exclude already-added titles (case-insensitive)
  const usedTitles = new Set(points.map((p) => p.title.trim().toLowerCase()).filter(Boolean));
  const availableSuggestions = (suggestions || []).filter(
    (s) => !usedTitles.has(s.title.trim().toLowerCase())
  );
  const visibleSuggestions = showAllSuggestions ? availableSuggestions : availableSuggestions.slice(0, 6);

  const addSuggestion = (s: Point) => commit([...points, { ...s }]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant">{label}</label>
        <div className="flex items-center gap-3">
          {defaults && defaults.length > 0 && (
            <button type="button" onClick={loadDefaults} className="text-[11px] font-bold uppercase tracking-wider text-[#785900] hover:text-[#fdc003] transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>download</span>
              Load defaults
            </button>
          )}
          <button type="button" onClick={add} className="text-[11px] font-bold uppercase tracking-wider text-[#785900] hover:text-[#fdc003] transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>add_circle</span>
            Add custom
          </button>
        </div>
      </div>

      {/* Quick-add suggestion chips */}
      {availableSuggestions.length > 0 && (
        <div className="mb-3 p-3 bg-secondary-container/20 rounded-xl border border-secondary-container/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Quick add — click to insert</span>
            {availableSuggestions.length > 6 && (
              <button
                type="button"
                onClick={() => setShowAllSuggestions(!showAllSuggestions)}
                className="text-[10px] font-bold uppercase tracking-wider text-[#785900] hover:text-[#fdc003] transition-colors"
              >
                {showAllSuggestions ? "Show less" : `Show all (${availableSuggestions.length})`}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {visibleSuggestions.map((s) => (
              <button
                key={s.title}
                type="button"
                onClick={() => addSuggestion(s)}
                title={s.description}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-container-lowest hover:bg-[#fdc003] hover:text-black rounded-full border border-outline-variant/30 text-[11px] font-medium transition-all"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>{s.icon}</span>
                {s.title}
                <span className="material-symbols-outlined opacity-50" style={{ fontSize: "12px" }}>add</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {points.length === 0 ? (
        <p className="text-xs text-on-surface/40 italic p-3 bg-surface-container/30 rounded-xl">{placeholder}</p>
      ) : (
        <div className="space-y-2">
          {points.map((p, i) => (
            <div key={i} className="flex items-start gap-2 bg-surface-container/30 p-2 rounded-xl">
              <IconPicker value={p.icon} options={icons} onChange={(v) => update(i, { icon: v })} />
              <div className="flex-1 space-y-1">
                <input
                  placeholder="Title (optional)"
                  value={p.title}
                  onChange={(e) => update(i, { title: e.target.value })}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary-container"
                />
                <input
                  placeholder="Description"
                  value={p.description}
                  onChange={(e) => update(i, { description: e.target.value })}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary-container"
                />
              </div>
              <button type="button" onClick={() => remove(i)} className="w-9 h-9 flex items-center justify-center text-error hover:bg-error-container/30 rounded-lg transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>delete</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const imageInput = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ name: "", description: "", specifications: "", use_cases: "", materials: "", delivery_info: "", min_order_qty: null as number | null, moq_unit: "pcs", pricing_mode: "per_unit" as "per_unit" | "per_area", branding_info: "", branding_methods: [] as string[], size_chart_url: "", hsn_code: "", gst_rate: null as number | null, subcategory_id: 0, base_price: 0, compare_price: null as number | null, is_active: true, has_variants: false, is_featured: false });
  const ALL_BRANDING_METHODS = ["Embroidery", "Screen Printing", "Sublimation Print", "Digital Printing", "Embossing", "UV Printing", "UV DTF Printing", "Laser Engraving", "Vinyl Heat Press"];
  const [editMode, setEditMode] = useState(false);
  const [filterSub, setFilterSub] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  // Pre-tag uploaded images with this color variant id (null = no tag)
  const [uploadColorVariantId, setUploadColorVariantId] = useState<number | null>(null);

  // Variant form
  const [vForm, setVForm] = useState({ variant_type: "size", variant_value: "", variant_unit: "", price_adjustment: 0, stock: 0, sku: "" });
  // Discount form — new model: flat price per unit above min_quantity, optionally per-variant
  const [dForm, setDForm] = useState({ variant_id: null as number | null, min_quantity: 0, price_per_unit: 0 });
  // Inline editing state for discount slabs
  const [editingSlabs, setEditingSlabs] = useState<Record<number, { variant_id: number | null; min_quantity: number; price_per_unit: number }>>({});

  async function load() {
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([api.getCategories(), api.getProducts(filterSub)]);
      setCategories(cats);
      setProducts(prods);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [filterSub]);

  async function saveProduct() {
    setError("");
    if (!form.subcategory_id) { setError("Please select a sub-category"); return; }
    try {
      if (editMode && selected) {
        const updated = await api.updateProduct(selected.id, form);
        setSelected(updated);
      } else {
        const created = await api.createProduct(form);
        setSelected(created);
        setEditMode(true);
      }
      load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }

  async function deleteProduct(id: number) {
    if (!confirm("Are you sure you want to delete this product? This cannot be undone.")) return;
    try {
      const res = await api.deleteProduct(id) as { detail?: string };
      if (res?.detail?.includes("deactivated")) {
        alert("This product has existing orders and was deactivated (hidden) instead of permanently deleted.");
      }
      setSelected(null); setEditMode(false); load();
    }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to delete product"); }
  }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selected || !e.target.files?.length) return;
    const files = Array.from(e.target.files);
    const tagVariant = uploadColorVariantId;
    try {
      if (files.length === 1) {
        // Single upload, optionally pre-tagged with the selected color
        await api.uploadProductImage(selected.id, files[0], selected.images.length === 0, tagVariant ?? undefined);
      } else {
        // Batch upload — first becomes primary if none exists
        const uploaded = await api.uploadProductImagesBatch(selected.id, files);
        // If a color was pre-selected, tag every uploaded image to that variant
        if (tagVariant && Array.isArray(uploaded)) {
          await Promise.all(uploaded.map(img => api.setImageVariant(selected.id, img.id, tagVariant).catch(() => null)));
        }
      }
      const p = await api.getProduct(selected.id);
      setSelected(p);
      // Reset input so re-uploading the same file triggers onChange
      e.target.value = "";
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }

  async function deleteImage(imageId: number) {
    if (!selected) return;
    try { await api.deleteProductImage(selected.id, imageId); const p = await api.getProduct(selected.id); setSelected(p); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }

  async function addVariant() {
    if (!selected) return;
    try {
      // Send variant_unit only if non-empty (otherwise pass null)
      const payload = { ...vForm, variant_unit: vForm.variant_unit.trim() || undefined };
      await api.addVariant(selected.id, payload);
      setVForm({ variant_type: "size", variant_value: "", variant_unit: "", price_adjustment: 0, stock: 0, sku: "" });
      const p = await api.getProduct(selected.id);
      setSelected(p);
    }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }

  async function deleteVariant(vid: number) {
    if (!selected) return;
    try { await api.deleteVariant(selected.id, vid); const p = await api.getProduct(selected.id); setSelected(p); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }

  async function addDiscount() {
    if (!selected) return;
    try {
      await api.addDiscountSlab(selected.id, {
        variant_id: dForm.variant_id || undefined,
        min_quantity: dForm.min_quantity,
        price_per_unit: dForm.price_per_unit,
      });
      setDForm({ variant_id: null, min_quantity: 0, price_per_unit: 0 });
      const p = await api.getProduct(selected.id);
      setSelected(p);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  async function deleteDiscount(sid: number) {
    if (!selected) return;
    try { await api.deleteDiscountSlab(selected.id, sid); const p = await api.getProduct(selected.id); setSelected(p); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }

  function startEditSlab(s: { id: number; variant_id?: number | null; min_quantity: number; price_per_unit?: number | null }) {
    setEditingSlabs(prev => ({ ...prev, [s.id]: { variant_id: s.variant_id ?? null, min_quantity: s.min_quantity, price_per_unit: s.price_per_unit ?? 0 } }));
  }

  function cancelEditSlab(sid: number) {
    setEditingSlabs(prev => { const n = { ...prev }; delete n[sid]; return n; });
  }

  async function saveEditSlab(sid: number) {
    if (!selected) return;
    const data = editingSlabs[sid];
    if (!data) return;
    try {
      await api.updateDiscountSlab(selected.id, sid, {
        variant_id: data.variant_id,
        min_quantity: data.min_quantity,
        price_per_unit: data.price_per_unit,
      });
      cancelEditSlab(sid);
      const p = await api.getProduct(selected.id);
      setSelected(p);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }

  function startNew() { setEditMode(false); setSelected(null); setForm({ name: "", description: "", specifications: "", use_cases: "", materials: "", delivery_info: "", min_order_qty: null, moq_unit: "pcs", pricing_mode: "per_unit", branding_info: "", branding_methods: [], size_chart_url: "", hsn_code: "", gst_rate: null, subcategory_id: 0, base_price: 0, compare_price: null, is_active: true, has_variants: false, is_featured: false }); }
  function startEdit(p: Product) {
    setSelected(p);
    setEditMode(true);
    setForm({
      name: p.name,
      description: p.description || "",
      specifications: p.specifications || "",
      use_cases: p.use_cases || "",
      materials: p.materials || "",
      delivery_info: p.delivery_info || "",
      min_order_qty: p.min_order_qty ?? null,
      moq_unit: p.moq_unit || "pcs",
      pricing_mode: (p.pricing_mode === "per_area" ? "per_area" : "per_unit") as "per_unit" | "per_area",
      branding_info: p.branding_info || "",
      branding_methods: p.branding_methods || [],
      size_chart_url: p.size_chart_url || "",
      hsn_code: p.hsn_code || "",
      gst_rate: p.gst_rate ?? null,
      subcategory_id: p.subcategory_id,
      base_price: p.base_price,
      compare_price: p.compare_price ?? null,
      is_active: p.is_active,
      has_variants: p.has_variants,
      is_featured: p.is_featured || false,
    });
  }

  const allSubs = categories.flatMap(c => c.subcategories.map(s => ({ ...s, catName: c.name })));

  return (
    <div className="pb-12 max-w-[1400px] mx-auto min-h-[calc(100vh-80px)] flex flex-col">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
           <h2 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">Inventory HQ</h2>
           <p className="text-on-surface-variant font-medium">Create, manage and curate products.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }} 
          onClick={startNew} 
          className="bg-primary text-on-primary font-label font-bold px-6 py-3.5 rounded-2xl shadow-lg flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          Create Artifact
        </motion.button>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-error-container border border-error-container text-on-error-container text-sm font-medium rounded-2xl p-4 mb-6 flex items-center gap-3 shrink-0">
          <span className="material-symbols-outlined">error</span> {error}
        </motion.div>
      )}

      <div className="flex gap-8 flex-1 min-h-0">
        {/* Product List Sidebar */}
        <div className="w-[320px] flex-shrink-0 flex flex-col min-h-0 max-h-[calc(100vh-200px)] sticky top-4 self-start">
          <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/30 p-4 mb-4 shrink-0 space-y-3">
            {/* Search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl pl-11 pr-10 py-3 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>
            {/* Category filter */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">filter_list</span>
              <select
                value={filterSub || ""}
                onChange={e => setFilterSub(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all"
              >
                <option value="">All Categories</option>
                {allSubs.map(s => <option key={s.id} value={s.id}>{s.catName} → {s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/30 p-2 flex-1 overflow-y-auto hide-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40 opacity-50">
                <span className="material-symbols-outlined animate-spin text-3xl mb-2">progress_activity</span>
                <span className="text-sm font-medium">Fetching Catalog...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 p-2">
                {products.filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((p, idx) => {
                  const isSelected = selected?.id === p.id;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: idx * 0.05 }}
                      key={p.id} 
                      onClick={() => startEdit(p)}
                      className={`relative overflow-hidden rounded-2xl p-4 cursor-pointer transition-all ${
                        isSelected 
                          ? "bg-secondary-container/20 border-secondary-container/50 shadow-md" 
                          : "bg-surface hover:bg-surface-container-high border-transparent"
                      } border`}
                    >
                      {isSelected && (
                         <motion.div layoutId="product-selector" className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary-container" />
                      )}
                      <div className="flex items-center justify-between">
                        <p className="font-headline font-bold text-on-surface line-clamp-1 flex-1">{p.name}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteProduct(p.id); }}
                          className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg hover:bg-error-container text-error/40 hover:text-error transition-colors ml-2"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-label font-bold text-sm text-on-surface-variant">
                          ₹{p.base_price.toLocaleString()}
                          {p.compare_price && p.compare_price > p.base_price && (
                            <span className="ml-1.5 text-xs font-normal line-through text-outline">₹{p.compare_price.toLocaleString()}</span>
                          )}
                        </span>
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${p.is_active ? "bg-surface-container-low text-on-surface" : "bg-error-container/50 text-error"}`}>
                          {p.is_active ? "Active" : "Hidden"}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Product Editor Space */}
        <div className="flex-1 flex flex-col pb-6 space-y-6">
          {(editMode || !selected) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container-lowest rounded-[2.5rem] shadow-xl shadow-surface-variant/20 border border-outline-variant/30 overflow-hidden">
              <div className="px-8 py-6 border-b border-outline-variant/20 bg-surface-container-low flex items-center gap-3">
                 <span className="material-symbols-outlined text-secondary-container bg-secondary-container/20 p-2.5 rounded-2xl">{editMode ? "edit_note" : "add_box"}</span>
                 <h3 className="font-headline font-bold text-xl text-on-surface">{editMode ? "Architecting Product" : "New Artifact"}</h3>
                 <div className="ml-auto flex gap-3">
                    {editMode && selected && <button onClick={() => deleteProduct(selected.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-error-container text-on-error-container hover:bg-error transition-colors text-white"><span className="material-symbols-outlined text-[20px]">delete</span></button>}
                    <button onClick={saveProduct} className="bg-primary text-on-primary font-label font-bold px-6 py-2 rounded-xl text-sm transition-colors shadow-md">{editMode ? "Save Changes" : "Forge Artifact"}</button>
                 </div>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <label className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant block mb-2">Artifact Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-3.5 text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all" placeholder="E.g., The Architect Notebook" />
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <label className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant block mb-2">Sub-category</label>
                  <select value={form.subcategory_id} onChange={e => setForm(f => ({ ...f, subcategory_id: Number(e.target.value) }))}
                    className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-3.5 text-on-surface font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all">
                    <option value={0}>Select Designation...</option>
                    {allSubs.map(s => <option key={s.id} value={s.id}>{s.catName} → {s.name}</option>)}
                  </select>
                </div>
                
                <div className="col-span-2">
                  <label className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant block mb-2">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4}
                    className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-3.5 text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all" placeholder="Product description for customers..." />
                </div>

                <div className="col-span-2">
                  <label className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant block mb-2">Specifications</label>
                  <textarea value={form.specifications} onChange={e => setForm(f => ({ ...f, specifications: e.target.value }))} rows={3}
                    className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-3.5 text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all" placeholder="Material: 100% Cotton&#10;Weight: 180 GSM&#10;Print: Screen/DTG" />
                </div>

                <div className="col-span-2">
                  <PointEditor
                    label="Use Cases (shown on USE CASES tab)"
                    value={form.use_cases}
                    onChange={(v) => setForm(f => ({ ...f, use_cases: v }))}
                    icons={USECASE_ICONS}
                    placeholder="No use cases added. Click a chip above to quick-add, or Add custom for a blank one."
                    defaults={DEFAULT_USE_CASE_POINTS}
                    suggestions={USECASE_SUGGESTIONS}
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant block mb-2">Materials & Build</label>
                  <textarea value={form.materials} onChange={e => setForm(f => ({ ...f, materials: e.target.value }))} rows={3}
                    className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-3.5 text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all" placeholder="Cotton, polyester, bio-wash..." />
                </div>

                <div className="col-span-2">
                  <PointEditor
                    label="Shipping Info (shown on SHIPPING tab)"
                    value={form.delivery_info}
                    onChange={(v) => setForm(f => ({ ...f, delivery_info: v }))}
                    icons={SHIPPING_ICONS}
                    placeholder="No shipping points added. Click a chip above to quick-add, or Add custom for a blank one."
                    defaults={DEFAULT_SHIPPING_POINTS}
                    suggestions={SHIPPING_SUGGESTIONS}
                  />
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant block mb-2">Minimum Order Qty</label>
                  <div className="flex gap-2">
                    <input type="number" min="1" value={form.min_order_qty ?? ""} onChange={e => setForm(f => ({ ...f, min_order_qty: e.target.value === "" ? null : Number(e.target.value) }))}
                      className="flex-1 min-w-0 bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-3.5 text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all" placeholder="e.g. 10" />
                    <input type="text" value={form.moq_unit} onChange={e => setForm(f => ({ ...f, moq_unit: e.target.value }))}
                      list="moq-unit-suggestions"
                      className="w-28 bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-3.5 text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all"
                      placeholder="pcs" />
                    <datalist id="moq-unit-suggestions">
                      <option value="pcs" />
                      <option value="sq.in" />
                      <option value="sq.ft" />
                      <option value="kg" />
                      <option value="gm" />
                      <option value="ml" />
                      <option value="litre" />
                      <option value="meter" />
                      <option value="pair" />
                      <option value="set" />
                    </datalist>
                  </div>
                  <p className="text-[10px] text-on-surface/40 mt-1">Number + unit (e.g. <strong>10 pcs</strong>, <strong>50 sq.in</strong> for stickers)</p>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant block mb-2">
                    <span className="material-symbols-outlined text-[14px] align-middle mr-1">calculate</span>
                    Pricing Mode
                  </label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setForm(f => ({
                      ...f,
                      pricing_mode: "per_unit",
                      // Revert area unit back to pieces when switching back
                      moq_unit: (f.moq_unit === "sq.in" || f.moq_unit === "sq.ft") ? "pcs" : f.moq_unit,
                    }))}
                      className={`flex-1 px-4 py-3.5 rounded-2xl font-label text-xs uppercase tracking-wider transition-all ${form.pricing_mode === "per_unit" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface/70 hover:bg-surface-container-high"}`}>
                      Per Piece
                    </button>
                    <button type="button" onClick={() => setForm(f => ({ ...f, pricing_mode: "per_area", moq_unit: f.moq_unit === "pcs" ? "sq.in" : f.moq_unit }))}
                      className={`flex-1 px-4 py-3.5 rounded-2xl font-label text-xs uppercase tracking-wider transition-all ${form.pricing_mode === "per_area" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface/70 hover:bg-surface-container-high"}`}>
                      Per Area
                    </button>
                  </div>
                  <p className="text-[10px] text-on-surface/40 mt-1">
                    {form.pricing_mode === "per_area"
                      ? "Customer enters length × breadth × quantity. Slabs match total sq.in. Base price is ₹/sq.in."
                      : "Standard per-unit pricing. MOQ in pieces."}
                  </p>
                </div>

                {/* GST + HSN compliance fields */}
                <div className="col-span-2 md:col-span-1">
                  <label className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant block mb-2">
                    <span className="material-symbols-outlined text-[14px] align-middle mr-1">receipt_long</span>
                    HSN Code
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={form.hsn_code}
                    onChange={e => setForm(f => ({ ...f, hsn_code: e.target.value.replace(/\s/g, "") }))}
                    className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-3.5 text-on-surface font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all"
                    placeholder="e.g. 6109 (for cotton tees)"
                  />
                  <p className="text-[10px] text-on-surface/40 mt-1">Required on GST invoices. Common: 6109 (cotton tees), 6505 (caps), 6911 (mugs), 4820 (notebooks)</p>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant block mb-2">
                    <span className="material-symbols-outlined text-[14px] align-middle mr-1">percent</span>
                    GST Rate
                  </label>
                  <select
                    value={form.gst_rate ?? ""}
                    onChange={e => setForm(f => ({ ...f, gst_rate: e.target.value === "" ? null : Number(e.target.value) }))}
                    className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-3.5 text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all"
                  >
                    <option value="">Default (18%)</option>
                    <option value="0">0% — Exempt</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                  <p className="text-[10px] text-on-surface/40 mt-1">Prices are GST-inclusive — this controls the tax split on invoice</p>
                </div>

                <div className="col-span-2 md:col-span-1">
                  <label className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant block mb-2">
                    <span className="material-symbols-outlined text-[14px] align-middle mr-1">straighten</span>
                    Size Chart (Apparel)
                  </label>
                  {form.size_chart_url ? (
                    <div className="relative group w-full">
                      <img src={form.size_chart_url} alt="Size Chart" className="w-full max-h-48 object-contain rounded-2xl border border-outline-variant/50 bg-surface-container" />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, size_chart_url: "" }))}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-error text-on-error flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-outline-variant/50 rounded-2xl cursor-pointer hover:border-secondary-container hover:bg-secondary-container/5 transition-all">
                        <span className="material-symbols-outlined text-xl text-on-surface-variant mb-1">upload</span>
                        <span className="text-[11px] text-on-surface-variant font-medium">Upload Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !selected) return;
                            try {
                              const fd = new FormData();
                              fd.append("file", file);
                              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/uploads/size-chart/${selected.id}`, {
                                method: "POST",
                                headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
                                body: fd,
                              });
                              if (!res.ok) throw new Error("Upload failed");
                              const data = await res.json();
                              setForm(f => ({ ...f, size_chart_url: data.url }));
                            } catch (err) {
                              alert("Failed to upload size chart");
                            }
                          }}
                        />
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider">or paste URL</span>
                        <input
                          type="text"
                          placeholder="https://..."
                          className="flex-1 bg-surface-container border border-outline-variant/50 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const val = (e.target as HTMLInputElement).value.trim();
                              if (val) setForm(f => ({ ...f, size_chart_url: val }));
                            }
                          }}
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val) setForm(f => ({ ...f, size_chart_url: val }));
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-span-2">
                  <label className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant block mb-2">BRANDING METHODS</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {ALL_BRANDING_METHODS.map(method => {
                      const isActive = form.branding_methods.includes(method);
                      return (
                        <button key={method} type="button"
                          onClick={() => setForm(f => ({ ...f, branding_methods: isActive ? f.branding_methods.filter(m => m !== method) : [...f.branding_methods, method] }))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${isActive ? "bg-primary text-on-primary border-primary shadow-sm" : "bg-surface-container border-outline-variant/50 text-on-surface-variant hover:border-primary/50"}`}
                        >{method}</button>
                      );
                    })}
                  </div>
                  <label className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant block mb-2">BRANDING NOTES (optional)</label>
                  <textarea value={form.branding_info} onChange={e => setForm(f => ({ ...f, branding_info: e.target.value }))} rows={2}
                    className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-3.5 text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all" placeholder="Additional branding notes..." />
                </div>

                <div className="col-span-2 md:col-span-1 flex flex-col justify-end">
                  <label className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant block mb-2">Selling Price (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-headline font-bold text-on-surface-variant">₹</span>
                    <input type="number" value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: Number(e.target.value) }))}
                      className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl pl-10 pr-4 py-3.5 text-on-surface font-headline font-bold text-lg focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all" />
                  </div>
                </div>
                <div className="col-span-2 md:col-span-1 flex flex-col justify-end">
                  <label className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant block mb-2">MRP / Compare Price (₹) <span className="text-outline font-normal normal-case">optional</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-headline font-bold text-on-surface-variant">₹</span>
                    <input type="number" value={form.compare_price ?? ""} onChange={e => setForm(f => ({ ...f, compare_price: e.target.value ? Number(e.target.value) : null }))}
                      placeholder="Original price (shown as strikethrough)"
                      className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl pl-10 pr-4 py-3.5 text-on-surface font-headline font-bold text-lg focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all placeholder:font-body placeholder:font-normal placeholder:text-sm" />
                  </div>
                  {form.compare_price && form.base_price > 0 && form.compare_price > form.base_price && (
                    <p className="text-xs text-tertiary mt-1.5 font-label">
                      {Math.round(((form.compare_price - form.base_price) / form.compare_price) * 100)}% off
                    </p>
                  )}
                </div>

                <div className="col-span-2 md:col-span-1 flex flex-col justify-center gap-4 bg-surface-container-low rounded-2xl p-5 border border-outline-variant/30">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="font-label font-bold text-sm text-on-surface group-hover:text-primary transition-colors">Visible on platform (Active)</span>
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-5 h-5 accent-secondary-container rounded" />
                  </label>
                  <div className="h-px bg-outline-variant/20 w-full" />
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="font-label font-bold text-sm text-on-surface group-hover:text-primary transition-colors">Contains Variations (Size/Color)</span>
                    <input type="checkbox" checked={form.has_variants} onChange={e => setForm(f => ({ ...f, has_variants: e.target.checked }))} className="w-5 h-5 accent-secondary-container rounded" />
                  </label>
                  <div className="h-px bg-outline-variant/20 w-full" />
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="font-label font-bold text-sm text-on-surface group-hover:text-primary transition-colors">Hot Seller (Featured on Homepage)</span>
                    <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="w-5 h-5 accent-secondary-container rounded" />
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {/* Helpful hint when creating new product */}
          {!selected && !editMode && (
            <div className="bg-secondary-container/10 border border-secondary-container/30 rounded-2xl p-5 flex items-start gap-3">
              <span className="material-symbols-outlined text-secondary-container">info</span>
              <div>
                <p className="font-headline font-bold text-sm text-on-surface mb-1">After saving the product, you can:</p>
                <p className="font-body text-xs text-on-surface-variant">Upload images, add variants (size/color), and configure bulk discount slabs. Click <strong>Forge Artifact</strong> first to save the basic info.</p>
              </div>
            </div>
          )}

          {/* Additional Settings (Images, Variants, Discounts) - Only if selected! */}
          {selected && (
            <AnimatePresence>
                <motion.div key="gallery" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container-lowest rounded-[2.5rem] shadow-xl shadow-surface-variant/20 border border-outline-variant/30 p-8">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                     <h3 className="font-headline font-bold text-xl text-on-surface flex items-center gap-3"><span className="material-symbols-outlined text-secondary-container bg-secondary-container/20 p-2 rounded-2xl">imagesmode</span> Artifact Gallery</h3>
                     <input ref={imageInput} type="file" accept="image/*" multiple onChange={uploadImage} className="hidden" />
                     <div className="flex items-center gap-2 flex-wrap">
                       {(selected.variants || []).filter(v => v.variant_type.toLowerCase() === "color").length > 0 && (
                         <select
                           value={uploadColorVariantId || ""}
                           onChange={e => setUploadColorVariantId(e.target.value ? Number(e.target.value) : null)}
                           className="bg-surface-container border border-outline-variant/30 rounded-xl px-3 py-2.5 text-xs font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-container max-w-[180px]"
                           title="Tag the next upload(s) to this color"
                         >
                           <option value="">No color tag</option>
                           {(selected.variants || []).filter(v => v.variant_type.toLowerCase() === "color").map(v => (
                             <option key={v.id} value={v.id}>Tag as: {v.variant_value}</option>
                           ))}
                         </select>
                       )}
                       <button onClick={() => imageInput.current?.click()} className="flex items-center gap-2 font-label font-bold text-sm bg-surface-container hover:bg-surface-container-high text-on-surface px-5 py-2.5 rounded-xl border border-outline-variant/30 transition-all">
                         <span className="material-symbols-outlined text-[18px]">upload</span> Upload Media
                       </button>
                     </div>
                  </div>
                  
                  {(selected.variants || []).filter(v => v.variant_type.toLowerCase() === "color").length > 0 && (
                    <p className="text-xs text-on-surface-variant mb-3 italic">Tip: tag images to a color so the website swaps the gallery when shoppers click that color.</p>
                  )}

                  <div className="flex flex-wrap gap-4">
                    {selected.images.length === 0 && <p className="text-on-surface-variant font-medium text-sm italic w-full text-center py-6 bg-surface-container border border-dashed border-outline-variant rounded-2xl">No media present. Add visuals to showcase this artifact.</p>}
                    {selected.images.map(img => {
                      const colorVariants = (selected.variants || []).filter(v => v.variant_type.toLowerCase() === "color");
                      return (
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} key={img.id} className="relative w-36 rounded-2xl border-2 border-outline-variant/30 overflow-hidden shadow-sm bg-surface-container-lowest">
                          <div className="relative w-full h-32">
                            <img src={img.image_url.startsWith("http") ? img.image_url : `${BASE_URL}${img.image_url}`} alt="" className="w-full h-full object-cover" />
                            <button onClick={() => deleteImage(img.id)} className="absolute top-1.5 right-1.5 w-7 h-7 bg-error text-on-error rounded-full flex items-center justify-center shadow-md hover:bg-error/80 transition-colors z-10">
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                            {img.is_primary ? (
                              <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wider bg-secondary-container text-on-secondary-container px-2 py-1 rounded-md shadow-md backdrop-blur-md">Primary</span>
                            ) : (
                              <button
                                onClick={async () => {
                                  try {
                                    await api.setPrimaryImage(selected.id, img.id);
                                    const p = await api.getProduct(selected.id);
                                    setSelected(p);
                                  } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
                                }}
                                className="absolute bottom-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wider bg-surface-container/80 text-on-surface px-2 py-1 rounded-md shadow-md backdrop-blur-md hover:bg-primary hover:text-on-primary transition-colors"
                              >Set as Primary</button>
                            )}
                          </div>
                          {colorVariants.length > 0 && (
                            <select
                              value={img.variant_id || ""}
                              onChange={async e => {
                                const v = e.target.value ? Number(e.target.value) : null;
                                try {
                                  await api.setImageVariant(selected.id, img.id, v);
                                  const p = await api.getProduct(selected.id);
                                  setSelected(p);
                                } catch (err: unknown) { setError(err instanceof Error ? err.message : "Error"); }
                              }}
                              className="w-full px-2 py-2 text-[11px] font-medium bg-surface-container border-t border-outline-variant/30 text-on-surface focus:outline-none cursor-pointer hover:bg-surface-container-high transition-colors"
                            >
                              <option value="">— No color —</option>
                              {colorVariants.map(v => (
                                <option key={v.id} value={v.id}>{v.variant_value}</option>
                              ))}
                            </select>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>

                {form.has_variants && (
                  <motion.div key="variants" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-surface-container-lowest rounded-[2.5rem] shadow-xl shadow-surface-variant/20 border border-outline-variant/30 p-8">
                    <h3 className="font-headline font-bold text-xl text-on-surface flex items-center gap-3 mb-6"><span className="material-symbols-outlined text-secondary-container bg-secondary-container/20 p-2 rounded-2xl">category</span> Variations Matrix</h3>
                    
                    <div className="flex flex-wrap items-center gap-3 mb-8 p-4 bg-surface-container rounded-2xl border border-outline-variant/30">
                      <VariantClassPicker value={vForm.variant_type} onChange={(v) => setVForm(f => ({ ...f, variant_type: v }))} />
                      <input placeholder={selected.pricing_mode === "per_area" ? "Value (e.g. 9 or 3×3)" : "Trait (e.g. Cobalt, L)"} value={vForm.variant_value} onChange={e => setVForm(f => ({ ...f, variant_value: e.target.value }))} className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface flex-1 min-w-[150px] focus:outline-none" />
                      <input placeholder={selected.pricing_mode === "per_area" ? "sq.in" : "Unit (optional)"} list="variant-unit-suggestions" value={vForm.variant_unit} onChange={e => setVForm(f => ({ ...f, variant_unit: e.target.value }))} className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface w-28 focus:outline-none" />
                      <datalist id="variant-unit-suggestions">
                        <option value="sq.in" />
                        <option value="sq.ft" />
                        <option value="inch" />
                        <option value="cm" />
                        <option value="ml" />
                        <option value="kg" />
                      </datalist>
                      <input type="number" placeholder={selected.pricing_mode === "per_area" ? "Price/pc (₹)" : "Price Offset (₹)"} value={vForm.price_adjustment || ""} onChange={e => setVForm(f => ({ ...f, price_adjustment: Number(e.target.value) }))} className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface w-32 focus:outline-none" />
                      <input type="number" placeholder="Inventory" value={vForm.stock || ""} onChange={e => setVForm(f => ({ ...f, stock: Number(e.target.value) }))} className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface w-24 focus:outline-none" />
                      <input placeholder="SKU/ID" value={vForm.sku} onChange={e => setVForm(f => ({ ...f, sku: e.target.value }))} className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface w-32 focus:outline-none" />
                      <button onClick={addVariant} className="bg-primary text-on-primary font-label font-bold px-5 py-3 rounded-xl text-sm hover:bg-inverse-surface transition-colors">Append</button>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-outline-variant/30">
                      <table className="w-full text-left">
                        <thead className="bg-surface-container">
                          <tr><th className="px-4 py-3 font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant">Class</th><th className="px-4 py-3 font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant">Trait</th><th className="px-4 py-3 font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant">Offset</th><th className="px-4 py-3 font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant">Inv</th><th className="px-4 py-3 font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant">SKU</th><th className="px-4 py-3"></th></tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                          {selected.variants.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant font-medium text-sm">No variations deployed.</td></tr>}
                          {selected.variants.map(v => (
                            <tr key={v.id} className="hover:bg-surface-container-low transition-colors">
                              <td className="px-4 py-3 font-medium capitalize text-on-surface text-sm">{v.variant_type}</td>
                              <td className="px-4 py-3 font-bold text-on-surface text-sm">{v.variant_value}{v.variant_unit ? <span className="ml-1 text-on-surface-variant font-medium text-xs">{v.variant_unit}</span> : null}</td>
                              <td className="px-4 py-3 text-on-surface font-medium text-sm">{v.price_adjustment >= 0 ? "+" : ""}₹{v.price_adjustment}</td>
                              <td className="px-4 py-3 text-on-surface font-medium text-sm">{v.stock}</td>
                              <td className="px-4 py-3 text-outline font-medium text-sm">{v.sku || "-"}</td>
                              <td className="px-4 py-3 text-right"><button onClick={() => deleteVariant(v.id)} className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-error hover:bg-error-container transition-colors"><span className="material-symbols-outlined text-[16px]">delete</span></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                <motion.div key="discounts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container-lowest rounded-[2.5rem] shadow-xl shadow-surface-variant/20 border border-outline-variant/30 p-8">
                  <h3 className="font-headline font-bold text-xl text-on-surface flex items-center gap-3 mb-3"><span className="material-symbols-outlined text-secondary-container bg-secondary-container/20 p-2 rounded-2xl">loyalty</span> Bulk Pricing Slabs</h3>
                  <p className="text-on-surface-variant text-sm font-medium mb-2">{selected.pricing_mode === "per_area" ? "Set a flat per-sq.in rate that kicks in once total order area reaches a threshold." : "Set a flat per-piece price that kicks in once the order quantity reaches a threshold."}</p>
                  <p className="text-on-surface-variant text-xs font-medium mb-6 italic">{selected.pricing_mode === "per_area" ? "Example: Min Area = 100 (sq.in) and Rate = ₹1.25 means \"orders totalling 100+ sq.in pay ₹1.25 per sq.in\"." : "Example: Min Qty = 25 and Price = ₹340 means \"orders of 25 or more units pay ₹340 per piece\"."}</p>

                  <div className="flex flex-wrap items-end gap-3 mb-8 p-4 bg-surface-container rounded-2xl border border-outline-variant/30">
                    {/* Variant filter — only show if product has variants */}
                    {selected.has_variants && selected.variants && selected.variants.length > 0 && (
                      <div className="flex-1 min-w-[140px] flex flex-col gap-1">
                        <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider pl-2">Applies To</label>
                        <select
                          value={dForm.variant_id ?? ""}
                          onChange={e => setDForm(f => ({ ...f, variant_id: e.target.value === "" ? null : Number(e.target.value) }))}
                          className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-2.5 text-sm text-on-surface font-medium focus:outline-none"
                        >
                          <option value="">All Variants</option>
                          {selected.variants.map(v => (
                            <option key={v.id} value={v.id}>{v.variant_type}: {v.variant_value}{v.variant_unit ? ` ${v.variant_unit}` : ""}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex-1 min-w-[100px] flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider pl-2">{selected.pricing_mode === "per_area" ? "Min Area (sq.in)" : "Min Quantity"}</label>
                      <input type="number" min="1" value={dForm.min_quantity || ""} onChange={e => setDForm(f => ({ ...f, min_quantity: Number(e.target.value) }))} placeholder={selected.pricing_mode === "per_area" ? "e.g. 100" : "e.g. 25"} className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-2.5 text-sm text-on-surface font-medium focus:outline-none" />
                    </div>
                    <div className="flex-1 min-w-[100px] flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider pl-2">{selected.pricing_mode === "per_area" ? "Price Per Sq.In (₹)" : "Price Per Unit (₹)"}</label>
                      <input type="number" min="0" step="0.01" value={dForm.price_per_unit || ""} onChange={e => setDForm(f => ({ ...f, price_per_unit: Number(e.target.value) }))} placeholder={selected.pricing_mode === "per_area" ? "e.g. 1.25" : "e.g. 340"} className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-2.5 text-sm text-on-surface font-medium focus:outline-none" />
                    </div>
                    <div>
                      <button onClick={addDiscount} disabled={!dForm.min_quantity || !dForm.price_per_unit} className="bg-primary text-on-primary font-label font-bold px-5 py-3 rounded-xl text-sm hover:bg-inverse-surface transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"><span className="material-symbols-outlined text-[18px]">add</span> Add Slab</button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-outline-variant/30">
                    <table className="w-full text-left">
                      <thead className="bg-surface-container">
                        <tr>
                          <th className="px-6 py-3 font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant">Applies To</th>
                          <th className="px-6 py-3 font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant">{selected.pricing_mode === "per_area" ? "Min Area" : "Threshold"}</th>
                          <th className="px-6 py-3 font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant">{selected.pricing_mode === "per_area" ? "Rate / Sq.In" : "Price Per Unit"}</th>
                          <th className="px-6 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {selected.discount_slabs.length === 0 && <tr><td colSpan={4} className="px-6 py-6 text-center text-on-surface-variant font-medium text-sm">No bulk pricing slabs set. Orders use the base price.</td></tr>}
                        {selected.discount_slabs.sort((a, b) => a.min_quantity - b.min_quantity).map(s => {
                          const isEditing = !!editingSlabs[s.id];
                          const editData = editingSlabs[s.id];
                          const variantLabel = (vid: number | null | undefined) => {
                            if (!vid) return "All Variants";
                            const v = selected.variants?.find(v => v.id === vid);
                            return v ? `${v.variant_type}: ${v.variant_value}${v.variant_unit ? ` ${v.variant_unit}` : ""}` : `#${vid}`;
                          };
                          return (
                          <tr key={s.id} className="hover:bg-surface-container-low transition-colors">
                            <td className="px-6 py-4 text-sm text-on-surface-variant">
                              {isEditing && selected.has_variants && selected.variants && selected.variants.length > 0 ? (
                                <select
                                  value={editData.variant_id ?? ""}
                                  onChange={e => setEditingSlabs(prev => ({ ...prev, [s.id]: { ...prev[s.id], variant_id: e.target.value === "" ? null : Number(e.target.value) } }))}
                                  className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-2 py-1.5 text-xs font-medium focus:outline-none w-full"
                                >
                                  <option value="">All Variants</option>
                                  {selected.variants.map(v => (
                                    <option key={v.id} value={v.id}>{v.variant_type}: {v.variant_value}{v.variant_unit ? ` ${v.variant_unit}` : ""}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${s.variant_id ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container text-on-surface-variant"}`}>
                                  {variantLabel(s.variant_id)}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {isEditing ? (
                                <input type="number" min="1" value={editData.min_quantity || ""} onChange={e => setEditingSlabs(prev => ({ ...prev, [s.id]: { ...prev[s.id], min_quantity: Number(e.target.value) } }))} className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-3 py-1.5 text-sm font-bold w-24 focus:outline-none" />
                              ) : (
                                <span className="font-headline font-bold text-on-surface">{s.min_quantity}+ {selected.pricing_mode === "per_area" ? "sq.in" : "units"}</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {isEditing ? (
                                <input type="number" min="0" step="0.01" value={editData.price_per_unit || ""} onChange={e => setEditingSlabs(prev => ({ ...prev, [s.id]: { ...prev[s.id], price_per_unit: Number(e.target.value) } }))} className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg px-3 py-1.5 text-sm font-bold w-28 focus:outline-none" />
                              ) : (
                                <span className="font-headline font-bold text-primary">
                                  {s.price_per_unit != null
                                    ? `₹${s.price_per_unit.toLocaleString("en-IN")} / ${selected.pricing_mode === "per_area" ? "sq.in" : "pc"}`
                                    : s.discount_percentage != null
                                      ? `${s.discount_percentage}% off (legacy)`
                                      : "—"}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right flex items-center justify-end gap-1.5">
                              {isEditing ? (
                                <>
                                  <button onClick={() => saveEditSlab(s.id)} className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-700 hover:bg-green-200 transition-colors" title="Save"><span className="material-symbols-outlined text-[16px]">check</span></button>
                                  <button onClick={() => cancelEditSlab(s.id)} className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors" title="Cancel"><span className="material-symbols-outlined text-[16px]">close</span></button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEditSlab(s)} className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-secondary-container transition-colors" title="Edit"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                                  <button onClick={() => deleteDiscount(s.id)} className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-error hover:bg-error-container transition-colors" title="Delete"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                                </>
                              )}
                            </td>
                          </tr>
                        );})}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
