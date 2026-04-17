"use client";
import { Fragment, useEffect, useState } from "react";
import { api, User, CompanyProfile, WalletInfo } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  private_limited: "Private Limited",
  partnership: "Partnership",
  sole_proprietor: "Sole Proprietor",
  llp: "LLP",
  other: "Other",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Company profile expansion
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [companyProfiles, setCompanyProfiles] = useState<Record<number, CompanyProfile | null>>({});
  const [profileLoading, setProfileLoading] = useState<number | null>(null);

  // Wallet data
  const [wallets, setWallets] = useState<Record<number, number>>({});
  const [creditUserId, setCreditUserId] = useState<number | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDesc, setCreditDesc] = useState("");
  const [creditLoading, setCreditLoading] = useState(false);

  useEffect(() => {
    api.getUsers()
      .then(setUsers)
      .catch(e => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
    // Fetch all wallet balances
    api.getAllWallets()
      .then((ws: WalletInfo[]) => {
        const map: Record<number, number> = {};
        ws.forEach(w => { map[w.user_id] = w.balance; });
        setWallets(map);
      })
      .catch(() => {});
  }, []);

  async function toggleExpand(userId: number) {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);
    // Fetch company profile if not already cached
    if (companyProfiles[userId] === undefined) {
      setProfileLoading(userId);
      try {
        const profile = await api.getUserCompanyProfile(userId);
        setCompanyProfiles(prev => ({ ...prev, [userId]: profile }));
      } catch {
        setCompanyProfiles(prev => ({ ...prev, [userId]: null }));
      } finally {
        setProfileLoading(null);
      }
    }
  }

  async function handleCreditCoins(userId: number) {
    if (!creditAmount || Number(creditAmount) <= 0) return;
    setCreditLoading(true);
    try {
      const res = await api.creditWallet(userId, Number(creditAmount), creditDesc || "Admin credit");
      setWallets(prev => ({ ...prev, [userId]: res.balance }));
      setCreditUserId(null);
      setCreditAmount("");
      setCreditDesc("");
    } catch {
      // error handling
    } finally {
      setCreditLoading(false);
    }
  }

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
                  <th className="px-6 py-5 font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, idx) => (
                  <Fragment key={u.id}>
                    <motion.tr
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-surface-container-low transition-colors group cursor-pointer border-b border-outline-variant/20"
                      onClick={() => toggleExpand(u.id)}
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
                      <td className="px-6 py-5">
                        <span className={`material-symbols-outlined text-on-surface-variant text-lg transition-transform duration-200 ${expandedUserId === u.id ? "rotate-180" : ""}`}>
                          expand_more
                        </span>
                      </td>
                    </motion.tr>
                    <AnimatePresence>
                      {expandedUserId === u.id && (
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="bg-surface-container-low border-b border-outline-variant/20"
                        >
                          <td colSpan={6} className="px-6 py-6">
                            {profileLoading === u.id ? (
                              <div className="flex items-center gap-3 py-4">
                                <span className="material-symbols-outlined animate-spin text-on-surface-variant">progress_activity</span>
                                <span className="text-sm text-on-surface-variant font-medium">Loading company profile...</span>
                              </div>
                            ) : companyProfiles[u.id] ? (
                              <div>
                                <div className="flex items-center gap-2 mb-4">
                                  <span className="material-symbols-outlined text-primary">business</span>
                                  <h3 className="font-headline font-bold text-on-surface text-lg">{companyProfiles[u.id]!.company_name}</h3>
                                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-primary/10 text-primary ml-2">
                                    {BUSINESS_TYPE_LABELS[companyProfiles[u.id]!.business_type] || companyProfiles[u.id]!.business_type}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant mb-1">GST Number</p>
                                    <p className="text-sm font-medium text-on-surface font-mono">{companyProfiles[u.id]!.gst_number || "Not provided"}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant mb-1">Contact Person</p>
                                    <p className="text-sm font-medium text-on-surface">{companyProfiles[u.id]!.contact_person || "Not provided"}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant mb-1">Registered Address</p>
                                    <p className="text-sm font-medium text-on-surface">{companyProfiles[u.id]!.registered_address || "Not provided"}</p>
                                  </div>
                                  {companyProfiles[u.id]!.description && (
                                    <div className="md:col-span-3">
                                      <p className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant mb-1">Business Description</p>
                                      <p className="text-sm text-on-surface-variant leading-relaxed">{companyProfiles[u.id]!.description}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 py-2">
                                <span className="material-symbols-outlined text-on-surface-variant opacity-50">business</span>
                                <span className="text-sm text-on-surface-variant font-medium">No company profile submitted by this user.</span>
                              </div>
                            )}

                            {/* Wallet & Referral Info */}
                            <div className="mt-6 pt-4 border-t border-outline-variant/20">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-primary">toll</span>
                                <h3 className="font-headline font-bold text-on-surface text-sm uppercase tracking-wider">Clay Coins</h3>
                              </div>
                              <div className="flex items-center gap-6 flex-wrap">
                                <div>
                                  <p className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant mb-1">Balance</p>
                                  <p className="text-xl font-bold text-on-surface">{(wallets[u.id] || 0).toFixed(0)} coins</p>
                                </div>
                                {creditUserId === u.id ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      placeholder="Amount"
                                      value={creditAmount}
                                      onChange={(e) => setCreditAmount(e.target.value)}
                                      className="w-24 border border-outline-variant/30 px-2 py-1.5 text-sm rounded focus:border-primary focus:ring-0"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Reason"
                                      value={creditDesc}
                                      onChange={(e) => setCreditDesc(e.target.value)}
                                      className="w-40 border border-outline-variant/30 px-2 py-1.5 text-sm rounded focus:border-primary focus:ring-0"
                                    />
                                    <button
                                      onClick={() => handleCreditCoins(u.id)}
                                      disabled={creditLoading}
                                      className="px-3 py-1.5 bg-primary text-on-primary text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 disabled:opacity-50"
                                    >
                                      {creditLoading ? "..." : "Credit"}
                                    </button>
                                    <button
                                      onClick={() => { setCreditUserId(null); setCreditAmount(""); setCreditDesc(""); }}
                                      className="px-2 py-1.5 text-xs text-on-surface-variant hover:text-on-surface"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setCreditUserId(u.id)}
                                    className="px-3 py-1.5 bg-secondary text-on-secondary text-[10px] font-bold uppercase tracking-wider rounded hover:opacity-90 flex items-center gap-1"
                                  >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                    Credit Coins
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </Fragment>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant font-medium text-sm">No identities match the query parameters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
