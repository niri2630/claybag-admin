"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { api, AdminUser } from "@/lib/api";

// Routes that scoped Orders-only staff are allowed to visit. Anything else
// redirects them to /dashboard/orders. Keep this in sync with the Sidebar nav
// filter — if a new orders-related route is added (e.g. /dashboard/orders/<id>)
// the startsWith check below already covers nested paths.
const ORDERS_STAFF_ALLOWED_PREFIXES = ["/dashboard/orders", "/dashboard/settings"];

function isOrdersStaffPath(pathname: string): boolean {
  return ORDERS_STAFF_ALLOWED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    api
      .me()
      .then((u) => {
        localStorage.setItem("admin_user", JSON.stringify(u));
        setUser(u);
      })
      .catch(() => {
        // Token invalid/expired or backend unreachable — bounce to login.
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        router.replace("/login");
      });
  }, [router]);

  // Scoped staff (orders_admin) can only see /dashboard/orders*. If they hit
  // any other route directly (typed URL, stale tab) bounce them back.
  useEffect(() => {
    if (!user) return;
    if (user.role === "orders_admin" && !isOrdersStaffPath(pathname)) {
      router.replace("/dashboard/orders");
    }
  }, [user, pathname, router]);

  if (!mounted || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-on-surface-variant text-sm font-label uppercase tracking-widest">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={user} />
      <main className="ml-64 flex-1 overflow-y-auto bg-surface px-12 py-10 relative">
        {/* Subtle background blob */}
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-surface-container-high/30 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
