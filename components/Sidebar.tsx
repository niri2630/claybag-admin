"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/dashboard/categories", label: "Categories", icon: "category" },
  { href: "/dashboard/products", label: "Products", icon: "inventory_2" },
  { href: "/dashboard/orders", label: "Orders", icon: "shopping_cart" },
  { href: "/dashboard/reviews", label: "Reviews", icon: "rate_review" },
  { href: "/dashboard/users", label: "Users", icon: "group" },
  { href: "/dashboard/reports", label: "Reports", icon: "analytics" },
  { href: "/dashboard/coupons", label: "Promo Codes", icon: "local_offer" },
  { href: "/dashboard/page-seo", label: "Page SEO", icon: "travel_explore" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    localStorage.removeItem("admin_token");
    router.push("/login");
  }

  return (
    <aside className="w-64 bg-surface-container-low border-r border-outline-variant/30 flex flex-col h-screen fixed left-0 top-0">
      <div className="px-8 py-8">
        <h1 className="font-headline font-bold text-2xl tracking-tight text-on-surface">ClayBag</h1>
        <p className="text-on-surface-variant font-medium text-sm mt-1">Workspace Admin</p>
      </div>
      
      <nav className="flex flex-col gap-2 px-4 flex-1 overflow-y-auto mt-4">
        {nav.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className="relative group">
              {active && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-secondary-container rounded-2xl z-0"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
                />
              )}
              <div className={`relative z-10 flex items-center gap-4 px-4 py-3.5 rounded-2xl font-label font-bold text-sm transition-colors ${
                active 
                  ? "text-on-secondary-container" 
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50"
              }`}>
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
                {label}
              </div>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 mb-4">
        <button 
          onClick={logout} 
          className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-label font-bold text-sm text-error hover:bg-error-container transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span> 
          Logout
        </button>
      </div>
    </aside>
  );
}
