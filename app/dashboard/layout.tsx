"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    // Validate the token by making a lightweight authenticated request
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/categories/all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          // Token is invalid/expired — clear and redirect to login
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          router.replace("/login");
        } else {
          setAuthChecked(true);
        }
      })
      .catch(() => {
        // Backend unreachable — still show the dashboard but warn
        setAuthChecked(true);
      });
  }, [router]);

  if (!mounted || !authChecked) {
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
      <Sidebar />
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
