"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

interface Stats {
  total_users: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  confirmed_orders: number;
  total_categories: number;
  recent_orders: { id: number; status: string; total_amount: number; created_at: string }[];
}

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-surface-container-highest text-on-surface-variant border-none",
  confirmed: "bg-surface-container-highest text-on-surface-variant border-none",
  processing: "bg-[#e0e8ff] text-[#0039b5] border-none",
  shipped: "bg-[#e8def8] text-[#4a0099] border-none",
  delivered: "bg-[#b8f3d0] text-[#006b3a] border-none",
  cancelled: "bg-error-container text-on-error-container border-none",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getStats()
      .then(s => setStats(s as unknown as Stats))
      .catch(e => setError(e instanceof Error ? e.message : "Failed to load stats"));
  }, []);

  if (error) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <span className="material-symbols-outlined text-5xl text-error">error</span>
        <p className="font-medium text-on-surface-variant">{error}</p>
        <button onClick={() => { setError(null); api.getStats().then(s => setStats(s as unknown as Stats)).catch(e => setError(e instanceof Error ? e.message : "Failed to load stats")); }} className="text-sm font-label font-bold bg-surface-container px-5 py-2.5 rounded-xl border border-outline-variant/30 hover:bg-surface-container-high transition-colors">
          Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="h-full w-full flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined animate-spin text-4xl text-outline">progress_activity</span>
      </div>
    );
  }

  const cards = [
    { label: "Total Revenue", value: `₹${stats.total_revenue.toLocaleString()}`, color: "bg-primary text-on-primary", icon: "payments" },
    { label: "Total Orders", value: stats.total_orders, color: "bg-secondary-container text-on-secondary-container", icon: "shopping_bag" },
    { label: "Pending Orders", value: stats.pending_orders, color: "bg-surface-container text-on-surface", icon: "pending_actions" },
    { label: "Total Products", value: stats.total_products, color: "bg-surface-container text-on-surface", icon: "inventory" },
    { label: "Total Users", value: stats.total_users, color: "bg-surface-container text-on-surface", icon: "group" },
    { label: "Categories", value: stats.total_categories, color: "bg-surface-container text-on-surface", icon: "category" },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="pb-12">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h2 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">Welcome Back</h2>
        <p className="text-on-surface-variant font-medium">Here's a quick overview of your store's performance today.</p>
      </motion.div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
      >
        {cards.map((c, i) => (
          <motion.div key={i} variants={item} className={`${c.color} rounded-[2rem] p-8 shadow-sm border border-outline-variant/20 relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 p-6 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 group-hover:opacity-30 transition-all duration-500">
              <span className="material-symbols-outlined text-8xl">{c.icon}</span>
            </div>
            <div className="relative z-10">
              <p className="text-sm font-label font-bold uppercase tracking-wider mb-2 opacity-80">{c.label}</p>
              <p className="text-5xl font-headline font-bold">{c.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-surface-container-lowest rounded-[2rem] shadow-xl shadow-surface-variant/20 border border-outline-variant/30 p-8"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-headline font-bold text-2xl text-on-surface mb-1">Recent Transactions</h3>
            <p className="text-on-surface-variant text-sm font-medium">Latest incoming orders</p>
          </div>
          <Link href="/dashboard/orders" className="flex items-center gap-2 text-sm font-label font-bold text-on-surface hover:text-on-surface-variant transition-colors bg-surface-container py-2.5 px-5 rounded-full hover:bg-surface-container-high border border-outline-variant/30">
            View All <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/40">
                <th className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant pb-4 pl-4">Order ID</th>
                <th className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant pb-4">Amount</th>
                <th className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant pb-4">Status</th>
                <th className="font-label text-xs font-bold uppercase tracking-wider text-on-surface-variant pb-4 text-right pr-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {stats.recent_orders.map((o, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: 0.5 + idx * 0.05 }}
                  key={o.id} 
                  className="hover:bg-surface-container-low/50 transition-colors group"
                >
                  <td className="py-5 pl-4">
                    <span className="font-headline font-bold text-on-surface group-hover:text-primary transition-colors">#{o.id}</span>
                  </td>
                  <td className="py-5 font-headline font-bold text-on-surface">
                    ₹{o.total_amount.toLocaleString()}
                  </td>
                  <td className="py-5">
                    <span className={`px-3 py-1.5 rounded-full font-label text-[11px] uppercase tracking-wider font-bold ${STATUS_COLOR[o.status] || "bg-surface-container-high text-on-surface"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="py-5 text-right pr-4 text-on-surface-variant font-medium text-sm">
                    {new Date(o.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {stats.recent_orders.length === 0 && (
             <div className="text-center py-12 text-on-surface-variant flex flex-col items-center">
               <span className="material-symbols-outlined text-5xl mb-3 opacity-50">inbox</span>
               <p className="font-medium">No recent orders found</p>
             </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
