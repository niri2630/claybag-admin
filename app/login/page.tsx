"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.adminLogin(email, password);
      localStorage.setItem("admin_token", res.access_token);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary-container/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[50%] bg-tertiary-container/10 rounded-full blur-3xl pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/30 rounded-[2rem] shadow-2xl p-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">ClayBag</h1>
            <p className="text-on-surface-variant font-medium">Workspace Admin</p>
          </div>

          {error && (
             <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-error-container text-on-error-container text-sm font-medium rounded-xl p-4 mb-6 flex items-center gap-3"
            >
              <span className="material-symbols-outlined">error</span>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-label font-bold text-on-surface">Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required
                placeholder="admin@claybag.com"
                className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-3.5 text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-transparent transition-all" 
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-label font-bold text-on-surface">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
                placeholder="••••••••"
                className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-3.5 text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-secondary-container focus:border-transparent transition-all" 
              />
            </div>

            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={loading}
              className="mt-4 bg-primary text-on-primary hover:bg-inverse-surface font-label font-bold py-4 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                   <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                   Authenticating...
                </>
              ) : (
                "Access Workspace"
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
