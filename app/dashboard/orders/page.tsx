"use client";
import { useEffect, useState } from "react";
import { api, Order } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-surface-container-highest text-on-surface-variant",
  confirmed: "bg-surface-container-highest text-on-surface-variant",
  processing: "bg-[#e0e8ff] text-[#0039b5]",
  shipped: "bg-[#e8def8] text-[#4a0099]",
  delivered: "bg-[#b8f3d0] text-[#006b3a]",
  cancelled: "bg-error-container text-on-error-container",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    setLoading(true);
    try { setOrders(await api.getOrders()); } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(status: string) {
    if (!selected) return;
    try {
      const updated = await api.updateOrderStatus(selected.id, status, note || undefined);
      setSelected(updated as unknown as Order);
      setNote("");
      load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }

  const filtered = statusFilter ? orders.filter(o => o.status === statusFilter) : orders;

  return (
    <div className="pb-12 max-w-[1400px] mx-auto h-[calc(100vh-80px)] flex flex-col">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 shrink-0">
        <h2 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">Order Command</h2>
        <p className="text-on-surface-variant font-medium">Process, fulfill, and track transactions.</p>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0 }}
            className="bg-error-container border border-error-container text-on-error-container text-sm font-medium rounded-2xl p-4 mb-6 flex items-center gap-3 shrink-0"
          >
            <span className="material-symbols-outlined">error</span>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-8 flex-1 min-h-0">
        {/* Order List */}
        <div className="w-[380px] flex-shrink-0 flex flex-col min-h-0 h-full">
          <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/30 p-4 mb-4 shrink-0">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">filter_list</span>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all">
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>
          
          <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/30 p-2 flex-1 overflow-y-auto hide-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-40 opacity-50">
                <span className="material-symbols-outlined animate-spin text-3xl mb-2">progress_activity</span>
                <span className="text-sm font-medium">Fetching Registry...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 p-2">
                {filtered.map((o, idx) => {
                  const isSelected = selected?.id === o.id;
                  return (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: idx * 0.05 }}
                    key={o.id} 
                    onClick={() => setSelected(o)}
                    className={`relative overflow-hidden rounded-2xl p-5 cursor-pointer transition-all border ${isSelected ? "bg-secondary-container/10 border-secondary-container/50 shadow-md" : "bg-surface hover:bg-surface-container-high border-transparent"}`}
                  >
                    {isSelected && <motion.div layoutId="order-selector" className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary-container" />}
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-headline font-bold text-on-surface text-lg">{o.order_number ?? `#${o.id}`}</span>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${STATUS_COLOR[o.status] || ""}`}>{o.status}</span>
                    </div>
                    <p className="text-sm font-medium text-on-surface-variant mb-1 flex items-center gap-2"><span className="material-symbols-outlined text-[16px] opacity-70">person</span> {o.shipping_name}</p>
                    <div className="flex items-center justify-between mt-4 border-t border-outline-variant/20 pt-3">
                      <p className="text-xs font-label font-bold text-on-surface-variant">{new Date(o.created_at).toLocaleDateString()}</p>
                      <p className="font-headline font-bold text-primary">₹{o.total_amount.toLocaleString()}</p>
                    </div>
                  </motion.div>
                )})}
                {filtered.length === 0 && <div className="text-center py-10 text-on-surface-variant text-sm font-medium">No transactions visible.</div>}
              </div>
            )}
          </div>
        </div>

        {/* Order Detail */}
        <div className="flex-1 flex flex-col min-h-0 h-full overflow-y-auto pr-2 pb-6 space-y-6 hide-scrollbar">
          {!selected ? (
             <div className="h-full flex flex-col items-center justify-center opacity-40">
               <span className="material-symbols-outlined text-7xl mb-4">point_of_sale</span>
               <p className="font-headline font-bold text-2xl">Select an Order</p>
               <p className="font-medium mt-1">Review details and orchestrate fulfillment.</p>
             </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={selected.id} className="space-y-6">
              
              <div className="bg-surface-container-lowest rounded-[2.5rem] shadow-xl shadow-surface-variant/20 border border-outline-variant/30 p-8">
                <div className="flex items-start justify-between mb-8 pb-8 border-b border-outline-variant/30">
                  <div>
                    <h3 className="font-headline font-bold text-3xl text-on-surface mb-2">Transaction {selected.order_number ?? `#${selected.id}`}</h3>
                    <p className="text-sm font-medium text-on-surface-variant flex items-center gap-2">
                       <span className="material-symbols-outlined text-[18px]">calendar_today</span> 
                       {new Date(selected.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-xl text-sm uppercase tracking-wider font-bold ${STATUS_COLOR[selected.status] || ""}`}>{selected.status}</span>
                    <button
                      onClick={async () => {
                        try {
                          const blob = await api.downloadInvoice(selected.id);
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          link.download = `ClayBag-Invoice-${selected.order_number ?? selected.id}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                          URL.revokeObjectURL(url);
                        } catch (e: unknown) {
                          alert(e instanceof Error ? e.message : "Failed to download invoice");
                        }
                      }}
                      className="px-4 h-10 flex items-center gap-2 rounded-xl bg-secondary-container text-on-secondary-container hover:bg-[#fdc003] hover:text-black transition-colors text-xs font-bold uppercase tracking-wider"
                      title="Download GST invoice PDF"
                    >
                      <span className="material-symbols-outlined text-[18px]">download</span>
                      Invoice
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Resend the invoice email to the customer?")) return;
                        try {
                          const r = await api.resendInvoiceEmail(selected.id);
                          alert(r.detail || "Email queued");
                        } catch (e: unknown) {
                          alert(e instanceof Error ? e.message : "Failed to resend email");
                        }
                      }}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container text-on-surface-variant hover:bg-tertiary-container hover:text-on-tertiary-container transition-colors"
                      title="Resend invoice email to customer"
                    >
                      <span className="material-symbols-outlined text-[20px]">forward_to_inbox</span>
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("Are you sure you want to permanently delete this order? This cannot be undone.")) return;
                        try {
                          await api.deleteOrder(selected.id);
                          setSelected(null);
                          load();
                        } catch (e: unknown) {
                          alert(e instanceof Error ? e.message : "Failed to delete order");
                        }
                      }}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-error-container text-on-error-container hover:bg-error hover:text-white transition-colors"
                      title="Delete order"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/20">
                    <p className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">person</span> Patron Identity</p>
                    <p className="font-headline font-bold text-on-surface text-lg mb-1">{selected.shipping_name}</p>
                    <p className="text-on-surface-variant font-medium">{selected.shipping_phone}</p>
                  </div>
                  <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant/20">
                    <p className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">local_shipping</span> Fulfillment Vector</p>
                    <p className="text-on-surface font-medium leading-relaxed">{selected.shipping_address}<br/>{selected.shipping_city} — {selected.shipping_pincode}</p>
                  </div>
                </div>

                {selected.notes && (
                  <div className="bg-secondary-container/10 border border-secondary-container/30 rounded-2xl p-5 mb-8">
                    <p className="font-label font-bold text-xs uppercase tracking-wider text-secondary mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-[18px]">note</span> Appended Directives</p>
                    <p className="text-on-surface font-medium italic">{selected.notes}</p>
                  </div>
                )}

                <h4 className="font-headline font-bold text-xl text-on-surface mb-4 flex items-center gap-2"><span className="material-symbols-outlined text-secondary-container bg-secondary-container/20 p-2 rounded-xl">inventory_2</span> Items in Order</h4>
                <div className="overflow-hidden rounded-2xl border border-outline-variant/30">
                  <table className="w-full text-left">
                    <thead className="bg-surface-container">
                      <tr>
                        <th className="px-5 py-4 font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant">Product</th>
                        <th className="px-5 py-4 font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant text-center">Qty</th>
                        <th className="px-5 py-4 font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant">Unit Price</th>
                        <th className="px-5 py-4 font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant">Discount</th>
                        <th className="px-5 py-4 font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20">
                      {selected.items.map(item => (
                        <tr key={item.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {item.product_image ? (
                                <img
                                  src={item.product_image.startsWith("http") ? item.product_image : `${process.env.NEXT_PUBLIC_API_URL || ""}${item.product_image}`}
                                  alt={item.product_name || `#${item.product_id}`}
                                  className="w-14 h-14 object-cover rounded-lg bg-surface-container border border-outline-variant/30 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                                  <span className="material-symbols-outlined text-on-surface-variant text-xl">image</span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-on-surface text-sm leading-tight">
                                  {item.product_name || `Product #${item.product_id}`}
                                </p>
                                {item.variant_label && (
                                  <p className="text-xs text-on-surface-variant mt-0.5">{item.variant_label}</p>
                                )}
                                <p className="text-[10px] text-on-surface-variant/70 font-mono mt-1">ID: {item.product_id}{item.variant_id ? ` · V${item.variant_id}` : ""}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-on-surface font-bold text-center">{item.quantity}</td>
                          <td className="px-5 py-4 text-on-surface-variant font-medium">₹{item.unit_price.toFixed(2)}</td>
                          <td className="px-5 py-4 text-primary font-bold">{item.discount_applied > 0 ? `-${item.discount_applied}%` : "—"}</td>
                          <td className="px-5 py-4 font-headline font-bold text-right">₹{item.total_price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="bg-surface-container-lowest px-6 py-5 border-t border-outline-variant/30 flex justify-end items-center gap-6">
                    <span className="font-label font-bold text-sm uppercase tracking-wider text-on-surface-variant">Net Aggregate</span>
                    <span className="font-headline font-bold text-3xl text-primary">₹{selected.total_amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Status Update Engine */}
              <div className="bg-surface-container-lowest rounded-[2.5rem] shadow-xl shadow-surface-variant/20 border border-outline-variant/30 p-8">
                <h4 className="font-headline font-bold text-xl text-on-surface mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-secondary-container bg-secondary-container/20 p-2 rounded-xl">update</span> Progression Matrix</h4>
                <div className="flex flex-wrap gap-3 mb-6">
                  {STATUSES.map(s => {
                    const isCurrent = selected.status === s;
                    return (
                    <button key={s} onClick={() => updateStatus(s)} disabled={isCurrent}
                      className={`px-5 py-3 rounded-xl text-sm font-label font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isCurrent ? `ring-2 ring-offset-2 ring-offset-surface-container-lowest ring-secondary-container ${STATUS_COLOR[s]}` : "bg-surface-container hover:bg-surface-container-high text-on-surface"}`}>
                      {s}
                    </button>
                    )
                  })}
                </div>
                <div className="flex items-center gap-4">
                   <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">edit_document</span>
                      <input value={note} onChange={e => setNote(e.target.value)} placeholder="Append a progression note (optional)..." 
                         className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl pl-12 pr-4 py-3.5 text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all" />
                   </div>
                </div>
              </div>

              {/* Lifecycle Trace */}
              <div className="bg-surface-container-lowest rounded-[2.5rem] shadow-xl shadow-surface-variant/20 border border-outline-variant/30 p-8">
                <h4 className="font-headline font-bold text-xl text-on-surface mb-8 flex items-center gap-2"><span className="material-symbols-outlined text-secondary-container bg-secondary-container/20 p-2 rounded-xl">history</span> Lifecycle Trace</h4>
                <div className="flex flex-col relative before:absolute before:inset-0 before:ml-4 before:w-0.5 before:bg-outline-variant/30 pl-2">
                  {[...selected.tracking].reverse().map((t, i) => (
                    <div key={t.id} className="relative pl-10 mb-8 last:mb-0">
                      <div className={`absolute left-0 w-3 h-3 rounded-full mt-1.5 ml-[11px] ${i === 0 ? "bg-secondary-container ring-4 ring-secondary-container/30" : "bg-outline-variant"}`} />
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className={`inline-block px-3 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider mb-2 ${STATUS_COLOR[t.status] || ""}`}>{t.status}</span>
                          {t.note && <p className="text-on-surface font-medium mb-1">{t.note}</p>}
                          <p className="text-xs font-label font-bold text-on-surface-variant">{new Date(t.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
