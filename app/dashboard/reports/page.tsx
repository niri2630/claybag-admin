"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, SalesSummary, GstSummary } from "@/lib/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Tab = "sales" | "orders" | "gst" | "products";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "sales", label: "Sales", icon: "trending_up" },
  { id: "orders", label: "Orders", icon: "receipt_long" },
  { id: "gst", label: "GST", icon: "verified" },
  { id: "products", label: "Products", icon: "inventory_2" },
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function formatINR(n: number): string {
  return "\u20B9" + (n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("sales");
  const [start, setStart] = useState(daysAgoISO(30));
  const [end, setEnd] = useState(todayISO());

  return (
    <div className="pb-16">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <h2 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">
          Reports & Exports
        </h2>
        <p className="text-on-surface-variant font-medium">
          Business insights and downloadable data for accounting, GST filing, and backups.
        </p>
      </motion.div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="relative px-5 py-3 rounded-2xl font-label text-sm font-bold transition-colors flex items-center gap-2"
            >
              {active && (
                <motion.div
                  layoutId="reports-active-tab"
                  className="absolute inset-0 bg-primary rounded-2xl"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <span className={`material-symbols-outlined text-[18px] relative z-10 ${active ? "text-on-primary" : "text-on-surface-variant"}`}>
                {t.icon}
              </span>
              <span className={`relative z-10 ${active ? "text-on-primary" : "text-on-surface-variant"}`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Shared date range (not used for products tab) */}
      {tab !== "products" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-surface-container-lowest rounded-[2rem] border border-outline-variant/30 p-6 mb-8 flex flex-wrap items-center gap-6"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-on-surface-variant">date_range</span>
            <div>
              <p className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">From</p>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                max={end}
                className="bg-transparent font-headline font-bold text-on-surface border-b border-outline-variant/40 pb-1 focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <p className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">To</p>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              min={start}
              max={todayISO()}
              className="bg-transparent font-headline font-bold text-on-surface border-b border-outline-variant/40 pb-1 focus:outline-none focus:border-primary"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            {[
              { label: "7D", days: 7 },
              { label: "30D", days: 30 },
              { label: "90D", days: 90 },
              { label: "1Y", days: 365 },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setStart(daysAgoISO(preset.days));
                  setEnd(todayISO());
                }}
                className="px-3 py-1.5 font-label text-[11px] uppercase tracking-wider font-bold text-on-surface-variant bg-surface-container rounded-full hover:bg-surface-container-high hover:text-on-surface transition-colors border border-outline-variant/30"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {tab === "sales" && <SalesTab key="sales" start={start} end={end} />}
        {tab === "orders" && <OrdersTab key="orders" start={start} end={end} />}
        {tab === "gst" && <GstTab key="gst" start={start} end={end} />}
        {tab === "products" && <ProductsTab key="products" />}
      </AnimatePresence>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// SALES TAB
// ──────────────────────────────────────────────────────────────────────────────

function SalesTab({ start, end }: { start: string; end: string }) {
  const [data, setData] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .getSalesSummary(start, end)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [start, end]);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} />;
  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard label="Total Revenue" value={formatINR(data.total_revenue)} icon="payments" tone="primary" />
        <KpiCard label="Orders" value={data.order_count.toLocaleString()} icon="shopping_bag" tone="default" />
        <KpiCard label="Avg Order Value" value={formatINR(data.avg_order_value)} icon="analytics" tone="default" />
      </div>

      {/* Revenue trend chart */}
      <div className="bg-surface-container-lowest rounded-[2rem] border border-outline-variant/30 p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-headline font-bold text-xl text-on-surface mb-1">Daily Revenue</h3>
            <p className="text-on-surface-variant text-sm font-medium">
              {data.daily_revenue.length} days · {start} → {end}
            </p>
          </div>
        </div>
        {data.daily_revenue.length === 0 ? (
          <EmptyInline message="No revenue in this date range" />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.daily_revenue} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  stroke="var(--color-on-surface-variant)"
                  fontSize={11}
                  tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                />
                <YAxis
                  stroke="var(--color-on-surface-variant)"
                  fontSize={11}
                  tickFormatter={(v) => "\u20B9" + (Number(v) / 1000).toFixed(0) + "k"}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface-container-highest)",
                    border: "1px solid var(--color-outline-variant)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  formatter={(value, name) => {
                    const num = typeof value === "number" ? value : parseFloat(String(value ?? 0));
                    return [name === "revenue" ? formatINR(num) : num, name === "revenue" ? "Revenue" : "Orders"] as [string | number, string];
                  }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#fdc003" strokeWidth={3} dot={{ r: 3, fill: "#fdc003" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top products + customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataCard title="Top Products" subtitle="By revenue">
          {data.top_products.length === 0 ? (
            <EmptyInline message="No sales yet" />
          ) : (
            <ol className="space-y-3">
              {data.top_products.map((p, i) => (
                <li key={p.id} className="flex items-center gap-4 py-2 border-b border-outline-variant/20 last:border-0">
                  <span className="font-headline font-black text-2xl text-on-surface-variant/30 w-8">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-headline font-bold text-on-surface truncate">{p.name}</p>
                    <p className="text-xs text-on-surface-variant">{p.units_sold} units sold</p>
                  </div>
                  <span className="font-headline font-bold text-on-surface">{formatINR(p.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </DataCard>

        <DataCard title="Top Customers" subtitle="By spend">
          {data.top_customers.length === 0 ? (
            <EmptyInline message="No customers yet" />
          ) : (
            <ol className="space-y-3">
              {data.top_customers.map((c, i) => (
                <li key={c.id} className="flex items-center gap-4 py-2 border-b border-outline-variant/20 last:border-0">
                  <span className="font-headline font-black text-2xl text-on-surface-variant/30 w-8">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-headline font-bold text-on-surface truncate">{c.name}</p>
                    <p className="text-xs text-on-surface-variant truncate">{c.email} · {c.orders} order{c.orders !== 1 ? "s" : ""}</p>
                  </div>
                  <span className="font-headline font-bold text-on-surface">{formatINR(c.spent)}</span>
                </li>
              ))}
            </ol>
          )}
        </DataCard>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// ORDERS TAB
// ──────────────────────────────────────────────────────────────────────────────

function OrdersTab({ start, end }: { start: string; end: string }) {
  const [status, setStatus] = useState<string>("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const onDownload = useCallback(async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      await api.downloadOrdersCsv(start, end, status || undefined);
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }, [start, end, status]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="bg-surface-container-lowest rounded-[2rem] border border-outline-variant/30 p-8">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h3 className="font-headline font-bold text-2xl text-on-surface mb-1">Orders Export</h3>
            <p className="text-on-surface-variant text-sm font-medium">
              Full order list with customer details, GST split, and line items.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant">filter_list</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-surface-container rounded-xl border border-outline-variant/30 px-4 py-2.5 font-medium text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="bg-surface-container rounded-2xl p-6 mb-6 border border-outline-variant/20">
          <p className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-3">CSV columns</p>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            order_number, order_id, created_at, status, customer_name, customer_email, customer_phone, shipping address fields, subtotal, referral_discount, coins_applied, taxable_amount, cgst, sgst, igst, total_amount, payment_status, cf_order_id, items
          </p>
        </div>

        <button
          onClick={onDownload}
          disabled={downloading}
          className="w-full md:w-auto inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-on-primary font-label font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined">
            {downloading ? "progress_activity" : "download"}
          </span>
          {downloading ? "Preparing CSV..." : "Download Orders CSV"}
        </button>

        {downloadError && (
          <p className="mt-4 text-sm text-error bg-error-container/50 px-4 py-2 rounded-xl">
            {downloadError}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// GST TAB
// ──────────────────────────────────────────────────────────────────────────────

function GstTab({ start, end }: { start: string; end: string }) {
  const [data, setData] = useState<GstSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .getGstSummary(start, end)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [start, end]);

  const onDownload = useCallback(async () => {
    setDownloading(true);
    try {
      await api.downloadGstCsv(start, end);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }, [start, end]);

  const stateChartData = useMemo(
    () =>
      (data?.by_state || []).slice(0, 8).map((s) => ({
        state: s.state.length > 12 ? s.state.slice(0, 10) + "…" : s.state,
        CGST: s.cgst,
        SGST: s.sgst,
        IGST: s.igst,
      })),
    [data]
  );

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} />;
  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Taxable Value" value={formatINR(data.total_taxable)} icon="account_balance_wallet" tone="default" />
        <KpiCard label="CGST" value={formatINR(data.total_cgst)} icon="pie_chart" tone="default" />
        <KpiCard label="SGST" value={formatINR(data.total_sgst)} icon="pie_chart" tone="default" />
        <KpiCard label="IGST" value={formatINR(data.total_igst)} icon="public" tone="default" />
      </div>

      {/* Chart + download */}
      <div className="bg-surface-container-lowest rounded-[2rem] border border-outline-variant/30 p-8">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div>
            <h3 className="font-headline font-bold text-xl text-on-surface mb-1">GST by State</h3>
            <p className="text-on-surface-variant text-sm font-medium">Top 8 states by taxable value</p>
          </div>
          <button
            onClick={onDownload}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-on-surface text-surface font-label font-bold text-xs uppercase tracking-wider hover:bg-on-surface-variant transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">
              {downloading ? "progress_activity" : "download"}
            </span>
            {downloading ? "Preparing..." : "Download GST CSV"}
          </button>
        </div>
        {stateChartData.length === 0 ? (
          <EmptyInline message="No GST data in this range" />
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" opacity={0.3} />
                <XAxis dataKey="state" stroke="var(--color-on-surface-variant)" fontSize={11} />
                <YAxis stroke="var(--color-on-surface-variant)" fontSize={11} tickFormatter={(v) => "\u20B9" + (Number(v) / 1000).toFixed(0) + "k"} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-surface-container-highest)",
                    border: "1px solid var(--color-outline-variant)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                  formatter={(v) => {
                    const num = typeof v === "number" ? v : parseFloat(String(v ?? 0));
                    return formatINR(num);
                  }}
                />
                <Bar dataKey="CGST" fill="#fdc003" stackId="a" />
                <Bar dataKey="SGST" fill="#b4881a" stackId="a" />
                <Bar dataKey="IGST" fill="#1a1a1a" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* HSN breakdown */}
      <DataCard title="HSN-wise Breakdown" subtitle="Taxable and tax amounts grouped by HSN code">
        {data.by_hsn.length === 0 ? (
          <EmptyInline message="No line items in this range" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/40">
                  <th className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant pb-3">HSN</th>
                  <th className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant pb-3">Rate</th>
                  <th className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant pb-3 text-right">Units</th>
                  <th className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant pb-3 text-right">Taxable</th>
                  <th className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant pb-3 text-right">Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {data.by_hsn.map((h) => (
                  <tr key={h.hsn} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="py-4 font-mono text-sm font-bold text-on-surface">{h.hsn}</td>
                    <td className="py-4 text-on-surface-variant">{h.rate}%</td>
                    <td className="py-4 text-right text-on-surface-variant">{h.units}</td>
                    <td className="py-4 text-right font-headline font-bold text-on-surface">{formatINR(h.taxable)}</td>
                    <td className="py-4 text-right font-headline font-bold text-on-surface">{formatINR(h.tax)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DataCard>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// PRODUCTS TAB
// ──────────────────────────────────────────────────────────────────────────────

function ProductsTab() {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const onDownload = useCallback(async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      await api.downloadProductsCsv();
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-surface-container-lowest rounded-[2rem] border border-outline-variant/30 p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-secondary-container flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-on-secondary-container text-3xl">inventory_2</span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-2xl text-on-surface mb-1">Product Catalog Export</h3>
            <p className="text-on-surface-variant text-sm font-medium">
              Full product listing with categories, prices, GST config, variants, and primary image URL.
              Useful for backup and bulk editing.
            </p>
          </div>
        </div>

        <div className="bg-surface-container rounded-2xl p-6 mb-6 border border-outline-variant/20">
          <p className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-3">CSV columns</p>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            id, name, slug, category, subcategory, base_price, compare_price, hsn_code, gst_rate, min_order_qty, is_active, is_featured, has_variants, variant_count, image_count, primary_image_url, branding_methods, created_at, updated_at
          </p>
        </div>

        <button
          onClick={onDownload}
          disabled={downloading}
          className="w-full md:w-auto inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-on-primary font-label font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined">
            {downloading ? "progress_activity" : "download"}
          </span>
          {downloading ? "Preparing CSV..." : "Download Products CSV"}
        </button>

        {downloadError && (
          <p className="mt-4 text-sm text-error bg-error-container/50 px-4 py-2 rounded-xl">
            {downloadError}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Shared UI primitives
// ──────────────────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, tone }: { label: string; value: string; icon: string; tone: "primary" | "default" }) {
  const classes = tone === "primary"
    ? "bg-primary text-on-primary"
    : "bg-surface-container-lowest text-on-surface border border-outline-variant/30";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${classes} rounded-[2rem] p-6 relative overflow-hidden group`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-20 translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform">
        <span className="material-symbols-outlined text-6xl">{icon}</span>
      </div>
      <p className="font-label text-[10px] uppercase tracking-widest font-bold opacity-80 mb-2 relative z-10">{label}</p>
      <p className="font-headline font-bold text-3xl relative z-10 tracking-tight">{value}</p>
    </motion.div>
  );
}

function DataCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-surface-container-lowest rounded-[2rem] border border-outline-variant/30 p-8">
      <div className="mb-6">
        <h3 className="font-headline font-bold text-xl text-on-surface mb-1">{title}</h3>
        {subtitle && <p className="text-on-surface-variant text-sm font-medium">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="flex items-center justify-center py-20">
      <span className="material-symbols-outlined animate-spin text-4xl text-on-surface-variant">progress_activity</span>
    </div>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="bg-error-container/40 rounded-[2rem] p-8 flex items-center gap-4">
      <span className="material-symbols-outlined text-error text-3xl">error</span>
      <p className="font-medium text-on-error-container">{message}</p>
    </div>
  );
}

function EmptyInline({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center py-12 text-on-surface-variant">
      <span className="material-symbols-outlined text-4xl mb-2 opacity-40">inbox</span>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
