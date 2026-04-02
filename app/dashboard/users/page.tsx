"use client";
import { useEffect, useState } from "react";
import { api, User } from "@/lib/api";
import { motion } from "framer-motion";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.getUsers()
      .then(setUsers)
      .catch(e => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-12 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h2 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">Patron Registry</h2>
        <p className="text-on-surface-variant font-medium">Manage clientele and administrative access.</p>
      </motion.div>

      {error && (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-error-container border border-error-container text-on-error-container text-sm font-medium rounded-2xl p-4 mb-6 flex items-center gap-3">
           <span className="material-symbols-outlined">error</span> {error}
         </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-container-lowest rounded-[2rem] shadow-xl shadow-surface-variant/20 border border-outline-variant/30 overflow-hidden"
      >
        <div className="p-6 border-b border-outline-variant/20 bg-surface-container-low flex items-center justify-between">
           <div className="relative max-w-sm w-full">
             <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
             <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Query by patron identity or address..."
               className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all shadow-sm" />
           </div>
           
           <div className="flex items-center gap-2">
             <span className="text-sm font-label font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container-highest px-3 py-1.5 rounded-lg">{filtered.length} Entities</span>
           </div>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 opacity-50">
            <span className="material-symbols-outlined animate-spin text-4xl mb-4">progress_activity</span>
            <span className="text-sm font-medium text-on-surface-variant">Loading records...</span>
          </div>
        ) : (
          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container">
                <tr>
                  <th className="px-6 py-5 font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant">Identity</th>
                  <th className="px-6 py-5 font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant">Contact Vector</th>
                  <th className="px-6 py-5 font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant">Clearance</th>
                  <th className="px-6 py-5 font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant">Status</th>
                  <th className="px-6 py-5 font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant">Inscription Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filtered.map((u, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: idx * 0.05 }}
                    key={u.id} 
                    className="hover:bg-surface-container-low transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-secondary-container/20 text-secondary-container flex items-center justify-center font-headline font-bold text-lg">
                           {u.name.charAt(0).toUpperCase()}
                         </div>
                         <div>
                           <p className="font-headline font-bold text-on-surface text-base group-hover:text-primary transition-colors">{u.name}</p>
                           <p className="font-label font-bold text-[10px] text-on-surface-variant opacity-70 uppercase tracking-widest">ID: #{u.id}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-medium text-on-surface text-sm mb-0.5">{u.email}</p>
                      <p className="text-xs text-on-surface-variant font-medium">{u.phone || "No transmission link"}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-md text-[10px] uppercase font-bold tracking-wider ${u.is_admin ? "bg-primary text-on-primary shadow-sm" : "bg-surface-container-highest text-on-surface-variant"}`}>
                        {u.is_admin ? "Sysadmin" : "Patron"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`flex w-fit items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${u.is_active ? "bg-[#b8f3d0]/30 text-[#006b3a]" : "bg-error-container text-on-error-container"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-[#006b3a]" : "bg-error"}`} />
                        {u.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-on-surface-variant font-label font-bold text-xs uppercase tracking-wider">
                      {new Date(u.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant font-medium text-sm">No identities match the query parameters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
