"use client";
import { useEffect, useRef, useState } from "react";
import { api, Category, Product } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const imageInput = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ name: "", description: "", subcategory_id: 0, base_price: 0, is_active: true, has_variants: false });
  const [editMode, setEditMode] = useState(false);
  const [filterSub, setFilterSub] = useState<number | undefined>();

  // Variant form
  const [vForm, setVForm] = useState({ variant_type: "size", variant_value: "", price_adjustment: 0, stock: 0, sku: "" });
  // Discount form
  const [dForm, setDForm] = useState({ min_quantity: 0, discount_percentage: 0 });

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
    if (!confirm("Delete product?")) return;
    try { await api.deleteProduct(id); setSelected(null); setEditMode(false); load(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selected || !e.target.files?.[0]) return;
    try {
      await api.uploadProductImage(selected.id, e.target.files[0], selected.images.length === 0);
      const p = await api.getProduct(selected.id);
      setSelected(p);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }

  async function deleteImage(imageId: number) {
    if (!selected) return;
    try { await api.deleteProductImage(selected.id, imageId); const p = await api.getProduct(selected.id); setSelected(p); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }

  async function addVariant() {
    if (!selected) return;
    try { await api.addVariant(selected.id, vForm); setVForm({ variant_type: "size", variant_value: "", price_adjustment: 0, stock: 0, sku: "" }); const p = await api.getProduct(selected.id); setSelected(p); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }

  async function deleteVariant(vid: number) {
    if (!selected) return;
    try { await api.deleteVariant(selected.id, vid); const p = await api.getProduct(selected.id); setSelected(p); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }

  async function addDiscount() {
    if (!selected) return;
    try { await api.addDiscountSlab(selected.id, dForm); setDForm({ min_quantity: 0, discount_percentage: 0 }); const p = await api.getProduct(selected.id); setSelected(p); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }

  async function deleteDiscount(sid: number) {
    if (!selected) return;
    try { await api.deleteDiscountSlab(selected.id, sid); const p = await api.getProduct(selected.id); setSelected(p); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }

  function startNew() { setEditMode(false); setSelected(null); setForm({ name: "", description: "", subcategory_id: 0, base_price: 0, is_active: true, has_variants: false }); }
  function startEdit(p: Product) { setSelected(p); setEditMode(true); setForm({ name: p.name, description: p.description || "", subcategory_id: p.subcategory_id, base_price: p.base_price, is_active: p.is_active, has_variants: p.has_variants }); }

  const allSubs = categories.flatMap(c => c.subcategories.map(s => ({ ...s, catName: c.name })));

  return (
    <div className="pb-12 max-w-[1400px] mx-auto h-[calc(100vh-80px)] flex flex-col">
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
        <div className="w-[320px] flex-shrink-0 flex flex-col min-h-0 h-full">
          <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/30 p-4 mb-4 shrink-0">
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
                {products.map((p, idx) => {
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
                      <p className="font-headline font-bold text-on-surface line-clamp-1">{p.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-label font-bold text-sm text-on-surface-variant">₹{p.base_price.toLocaleString()}</span>
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
        <div className="flex-1 flex flex-col min-h-0 h-full overflow-y-auto pr-2 pb-6 space-y-6 hide-scrollbar">
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
                  <label className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant block mb-2">Curatorial Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4}
                    className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-3.5 text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all" placeholder="Craft a compelling narrative..." />
                </div>
                
                <div className="col-span-2 md:col-span-1 flex flex-col justify-end">
                  <label className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant block mb-2">Base Valuation (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-headline font-bold text-on-surface-variant">₹</span>
                    <input type="number" value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: Number(e.target.value) }))}
                      className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl pl-10 pr-4 py-3.5 text-on-surface font-headline font-bold text-lg focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all" />
                  </div>
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
                </div>
              </div>
            </motion.div>
          )}

          {/* Additional Settings (Images, Variants, Discounts) - Only if selected! */}
          {selected && (
            <AnimatePresence>
                <motion.div key="gallery" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container-lowest rounded-[2.5rem] shadow-xl shadow-surface-variant/20 border border-outline-variant/30 p-8">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="font-headline font-bold text-xl text-on-surface flex items-center gap-3"><span className="material-symbols-outlined text-secondary-container bg-secondary-container/20 p-2 rounded-2xl">imagesmode</span> Artifact Gallery</h3>
                     <input ref={imageInput} type="file" accept="image/*" onChange={uploadImage} className="hidden" />
                     <button onClick={() => imageInput.current?.click()} className="flex items-center gap-2 font-label font-bold text-sm bg-surface-container hover:bg-surface-container-high text-on-surface px-5 py-2.5 rounded-xl border border-outline-variant/30 transition-all">
                       <span className="material-symbols-outlined text-[18px]">upload</span> Upload Media
                     </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    {selected.images.length === 0 && <p className="text-on-surface-variant font-medium text-sm italic w-full text-center py-6 bg-surface-container border border-dashed border-outline-variant rounded-2xl">No media present. Add visuals to showcase this artifact.</p>}
                    {selected.images.map(img => (
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} key={img.id} className="relative w-32 h-32 rounded-2xl border-2 border-outline-variant/30 overflow-hidden shadow-sm">
                        <img src={`${BASE_URL}${img.image_url}`} alt="" className="w-full h-full object-cover" />
                        <button onClick={() => deleteImage(img.id)} className="absolute top-1.5 right-1.5 w-7 h-7 bg-error text-on-error rounded-full flex items-center justify-center shadow-md hover:bg-error/80 transition-colors z-10">
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                        {img.is_primary && <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold uppercase tracking-wider bg-secondary-container text-on-secondary-container px-2 py-1 rounded-md shadow-md backdrop-blur-md">Primary</span>}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {form.has_variants && (
                  <motion.div key="variants" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-surface-container-lowest rounded-[2.5rem] shadow-xl shadow-surface-variant/20 border border-outline-variant/30 p-8">
                    <h3 className="font-headline font-bold text-xl text-on-surface flex items-center gap-3 mb-6"><span className="material-symbols-outlined text-secondary-container bg-secondary-container/20 p-2 rounded-2xl">category</span> Variations Matrix</h3>
                    
                    <div className="flex flex-wrap items-center gap-3 mb-8 p-4 bg-surface-container rounded-2xl border border-outline-variant/30">
                      <select value={vForm.variant_type} onChange={e => setVForm(f => ({ ...f, variant_type: e.target.value }))} className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface min-w-[120px] focus:outline-none">
                        <option value="size">Size</option><option value="color">Color</option><option value="material">Material</option>
                      </select>
                      <input placeholder="Trait (e.g. Cobalt, L)" value={vForm.variant_value} onChange={e => setVForm(f => ({ ...f, variant_value: e.target.value }))} className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface flex-1 min-w-[150px] focus:outline-none" />
                      <input type="number" placeholder="Price Offset (₹)" value={vForm.price_adjustment || ""} onChange={e => setVForm(f => ({ ...f, price_adjustment: Number(e.target.value) }))} className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-3 text-sm text-on-surface w-32 focus:outline-none" />
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
                              <td className="px-4 py-3 font-bold text-on-surface text-sm">{v.variant_value}</td>
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
                  <h3 className="font-headline font-bold text-xl text-on-surface flex items-center gap-3 mb-3"><span className="material-symbols-outlined text-secondary-container bg-secondary-container/20 p-2 rounded-2xl">loyalty</span> Scale Mechanics</h3>
                  <p className="text-on-surface-variant text-sm font-medium mb-6">Incentivize bulk curation with algorithmic discounting.</p>
                  
                  <div className="flex items-center gap-3 mb-8 p-4 bg-surface-container rounded-2xl border border-outline-variant/30 max-w-lg">
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider pl-2">Min. Volume</label>
                      <input type="number" value={dForm.min_quantity || ""} onChange={e => setDForm(f => ({ ...f, min_quantity: Number(e.target.value) }))} className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-2.5 text-sm text-on-surface font-medium focus:outline-none" />
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider pl-2">Discount Yield (%)</label>
                      <input type="number" value={dForm.discount_percentage || ""} onChange={e => setDForm(f => ({ ...f, discount_percentage: Number(e.target.value) }))} className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-4 py-2.5 text-sm text-on-surface font-medium focus:outline-none" />
                    </div>
                    <div className="pt-5">
                      <button onClick={addDiscount} className="bg-primary text-on-primary font-label font-bold px-5 py-3 rounded-xl text-sm hover:bg-inverse-surface transition-colors flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">add</span> Forge</button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-outline-variant/30">
                    <table className="w-full text-left">
                      <thead className="bg-surface-container">
                        <tr><th className="px-6 py-3 font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant">Threshold Volume</th><th className="px-6 py-3 font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant">Yield Deficit</th><th className="px-6 py-3"></th></tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {selected.discount_slabs.length === 0 && <tr><td colSpan={3} className="px-6 py-6 text-center text-on-surface-variant font-medium text-sm">No volume mechanics active.</td></tr>}
                        {selected.discount_slabs.sort((a, b) => a.min_quantity - b.min_quantity).map(s => (
                          <tr key={s.id} className="hover:bg-surface-container-low transition-colors">
                            <td className="px-6 py-4 font-headline font-bold text-on-surface">{s.min_quantity}+ Units</td>
                            <td className="px-6 py-4 font-headline font-bold text-primary">{s.discount_percentage}% Offset</td>
                            <td className="px-6 py-4 text-right"><button onClick={() => deleteDiscount(s.id)} className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-error hover:bg-error-container transition-colors"><span className="material-symbols-outlined text-[16px]">delete</span></button></td>
                          </tr>
                        ))}
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
