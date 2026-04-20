"use client";
import { Fragment, useEffect, useState, useCallback } from "react";
import { api, User, CompanyProfile, WalletInfo, Address } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  private_limited: "Private Limited",
  partnership: "Partnership",
  sole_proprietor: "Sole Proprietor",
  llp: "LLP",
  other: "Other",
};

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

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

  // Edit user modal
  const [editingUser, setEditingUser] = useState<User | null>(null);

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
                  <th className="px-6 py-5 font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant text-right">Actions</th>
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
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingUser(u); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors border border-outline-variant/30"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          Edit
                        </button>
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
                          <td colSpan={7} className="px-6 py-6">
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

                            {/* Delete User */}
                            <div className="mt-4 pt-4 border-t border-outline-variant/20 flex justify-end">
                              <button
                                onClick={async () => {
                                  if (!confirm(`Delete user "${u.name}" (${u.email})? This cannot be undone.`)) return;
                                  try {
                                    await api.deleteUser(u.id);
                                    setUsers(prev => prev.filter(usr => usr.id !== u.id));
                                    setExpandedUserId(null);
                                  } catch {
                                    alert("Failed to delete user. They may have existing orders.");
                                  }
                                }}
                                className="px-4 py-2 bg-error text-on-error text-[10px] font-bold uppercase tracking-wider rounded hover:opacity-90 flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                                Delete User
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </Fragment>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant font-medium text-sm">No identities match the query parameters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onUserUpdated={(updated) => {
              setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
              setEditingUser(updated);
            }}
            onCompanyUpdated={(updated) => {
              setCompanyProfiles((prev) => ({ ...prev, [updated.user_id]: updated }));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Edit User Modal — tabs: Basic Info, Addresses, Company Profile
// ──────────────────────────────────────────────────────────────────────────────

type EditTab = "basic" | "addresses" | "company";

function EditUserModal({
  user,
  onClose,
  onUserUpdated,
  onCompanyUpdated,
}: {
  user: User;
  onClose: () => void;
  onUserUpdated: (u: User) => void;
  onCompanyUpdated: (p: CompanyProfile) => void;
}) {
  const [tab, setTab] = useState<EditTab>("basic");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-surface-container-lowest rounded-[2rem] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-outline-variant/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-outline-variant/30 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-headline font-bold text-xl">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-headline font-bold text-xl text-on-surface">{user.name}</h3>
              <p className="text-xs text-on-surface-variant font-medium">{user.email} · ID #{user.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-surface-container-highest flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 border-b border-outline-variant/20 flex gap-1">
          {[
            { id: "basic" as EditTab, label: "Basic Info", icon: "person" },
            { id: "addresses" as EditTab, label: "Addresses", icon: "location_on" },
            { id: "company" as EditTab, label: "Company Profile", icon: "business" },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative py-4 px-5 font-label font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors ${
                  active ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-base">{t.icon}</span>
                {t.label}
                {active && (
                  <motion.div
                    layoutId="edit-user-tab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {tab === "basic" && (
            <BasicInfoTab user={user} onUpdated={onUserUpdated} />
          )}
          {tab === "addresses" && <AddressesTab userId={user.id} />}
          {tab === "company" && <CompanyProfileTab userId={user.id} onUpdated={onCompanyUpdated} />}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Basic Info tab ──────────────────────────────────────────────────────────

function BasicInfoTab({ user, onUpdated }: { user: User; onUpdated: (u: User) => void }) {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    is_active: user.is_active,
    is_admin: user.is_admin,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const dirty =
    form.name !== user.name ||
    form.email !== user.email ||
    (form.phone || "") !== (user.phone || "") ||
    form.is_active !== user.is_active ||
    form.is_admin !== user.is_admin;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateUser(user.id, {
        name: form.name,
        email: form.email,
        phone: form.phone,
        is_active: form.is_active,
        is_admin: form.is_admin,
      });
      onUpdated(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Field label="Name">
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full bg-surface-container rounded-xl border border-outline-variant/30 px-4 py-3 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </Field>
      <Field label="Email">
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="w-full bg-surface-container rounded-xl border border-outline-variant/30 px-4 py-3 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </Field>
      <Field label="Phone">
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="w-full bg-surface-container rounded-xl border border-outline-variant/30 px-4 py-3 text-sm font-medium text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Toggle
          label="Active account"
          checked={form.is_active}
          onChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
          description="Inactive users can't log in or place orders"
        />
        <Toggle
          label="Admin access"
          checked={form.is_admin}
          onChange={(v) => setForm((f) => ({ ...f, is_admin: v }))}
          description="Grants full admin panel access"
        />
      </div>

      {error && (
        <div className="text-sm text-error bg-error-container/40 px-4 py-3 rounded-xl">{error}</div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
        {saved && <span className="text-xs text-[#006b3a] font-medium">Saved</span>}
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="px-6 py-3 rounded-xl bg-primary text-on-primary font-label font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-base">check</span>
          )}
          Save changes
        </button>
      </div>
    </div>
  );
}

// ── Addresses tab ───────────────────────────────────────────────────────────

function AddressesTab({ userId }: { userId: number }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.getUserAddresses(userId)
      .then(setAddresses)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: number) {
    if (!confirm("Delete this address?")) return;
    try {
      await api.deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  }

  if (loading) return <div className="flex justify-center py-12"><span className="material-symbols-outlined animate-spin text-on-surface-variant">progress_activity</span></div>;

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-error bg-error-container/40 px-4 py-3 rounded-xl">{error}</div>}

      {addresses.length === 0 && editingId !== "new" ? (
        <div className="text-center py-10 text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl opacity-40 mb-2">location_off</span>
          <p className="text-sm font-medium">No addresses yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((a) =>
            editingId === a.id ? (
              <AddressForm
                key={a.id}
                initial={a}
                onCancel={() => setEditingId(null)}
                onSave={async (data) => {
                  const updated = await api.updateAddress(a.id, data);
                  setAddresses((prev) => {
                    // If this one became default, remove default from others
                    const next = prev.map((x) => (x.id === a.id ? updated : data.is_default ? { ...x, is_default: false } : x));
                    return next;
                  });
                  setEditingId(null);
                }}
              />
            ) : (
              <div key={a.id} className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-headline font-bold text-on-surface text-sm">{a.label}</span>
                    {a.is_default && (
                      <span className="px-2 py-0.5 bg-primary/20 text-primary text-[9px] font-bold uppercase tracking-wider rounded">Default</span>
                    )}
                  </div>
                  <p className="text-sm text-on-surface font-medium">{a.name} · {a.phone}</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    {a.address}, {a.city}
                    {a.state ? `, ${a.state}` : ""} – {a.pincode}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEditingId(a.id)}
                    className="w-9 h-9 rounded-lg hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="w-9 h-9 rounded-lg hover:bg-error-container/40 flex items-center justify-center text-error transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {editingId === "new" ? (
        <AddressForm
          onCancel={() => setEditingId(null)}
          onSave={async (data) => {
            const created = await api.createUserAddress(userId, data);
            setAddresses((prev) => {
              if (data.is_default) return [created, ...prev.map((p) => ({ ...p, is_default: false }))];
              return [...prev, created];
            });
            setEditingId(null);
          }}
        />
      ) : (
        <button
          onClick={() => setEditingId("new")}
          className="w-full py-3 border-2 border-dashed border-outline-variant/40 rounded-2xl text-on-surface-variant hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 font-label font-bold text-xs uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Add Address
        </button>
      )}
    </div>
  );
}

function AddressForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Address>;
  onSave: (data: Partial<Address>) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    label: initial?.label || "Home",
    name: initial?.name || "",
    phone: initial?.phone || "",
    address: initial?.address || "",
    city: initial?.city || "",
    state: initial?.state || "",
    pincode: initial?.pincode || "",
    is_default: initial?.is_default || false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      // Send state: null (not undefined) when empty so backend actually clears it.
      // undefined would be omitted from JSON entirely and exclude_unset on backend
      // would treat it as "not provided" — leaving old value intact.
      const payload: Partial<Address> = {
        label: form.label,
        name: form.name,
        phone: form.phone,
        address: form.address,
        city: form.city,
        pincode: form.pincode,
        is_default: form.is_default,
        state: form.state && form.state.length > 0 ? form.state : null,
      };
      await onSave(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-surface-container rounded-2xl p-5 border-2 border-primary/30 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="Label (Home, Office...)"
          value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm"
        />
        <input
          placeholder="Recipient name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <input
        placeholder="Phone"
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm"
      />
      <textarea
        placeholder="Street address"
        value={form.address}
        onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
        rows={2}
        className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm resize-none"
      />
      <div className="grid grid-cols-3 gap-3">
        <input
          placeholder="City"
          value={form.city}
          onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={form.state || ""}
          onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">State...</option>
          {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          placeholder="Pincode"
          value={form.pincode}
          onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
          className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-on-surface-variant">
        <input
          type="checkbox"
          checked={form.is_default}
          onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
          className="w-4 h-4 accent-primary"
        />
        Set as default address
      </label>

      {error && <p className="text-xs text-error">{error}</p>}

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-on-surface-variant hover:text-on-surface text-xs font-bold uppercase tracking-wider"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={saving || !form.name || !form.phone || !form.address || !form.city || !form.pincode}
          className="px-5 py-2 rounded-lg bg-primary text-on-primary font-label font-bold text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-40 flex items-center gap-1.5"
        >
          {saving && <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>}
          Save
        </button>
      </div>
    </div>
  );
}

// ── Company Profile tab ─────────────────────────────────────────────────────

function CompanyProfileTab({ userId, onUpdated }: { userId: number; onUpdated: (p: CompanyProfile) => void }) {
  const [form, setForm] = useState({
    company_name: "",
    business_type: "private_limited",
    gst_number: "",
    registered_address: "",
    contact_person: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [exists, setExists] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getUserCompanyProfile(userId)
      .then((p) => {
        setExists(true);
        setForm({
          company_name: p.company_name || "",
          business_type: p.business_type || "private_limited",
          gst_number: p.gst_number || "",
          registered_address: p.registered_address || "",
          contact_person: p.contact_person || "",
          description: p.description || "",
        });
      })
      .catch(() => setExists(false))
      .finally(() => setLoading(false));
  }, [userId]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateUserCompanyProfile(userId, form);
      onUpdated(updated);
      setExists(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-12"><span className="material-symbols-outlined animate-spin text-on-surface-variant">progress_activity</span></div>;

  return (
    <div className="space-y-5">
      {!exists && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 text-sm text-on-surface">
          <span className="font-bold">No company profile yet.</span> Fill required fields to create one.
        </div>
      )}

      <Field label="Company Name *">
        <input
          value={form.company_name}
          onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
          className="w-full bg-surface-container rounded-xl border border-outline-variant/30 px-4 py-3 text-sm font-medium"
        />
      </Field>

      <Field label="Business Type *">
        <select
          value={form.business_type}
          onChange={(e) => setForm((f) => ({ ...f, business_type: e.target.value }))}
          className="w-full bg-surface-container rounded-xl border border-outline-variant/30 px-4 py-3 text-sm font-medium"
        >
          {Object.entries(BUSINESS_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </Field>

      <Field label="GST Number">
        <input
          value={form.gst_number}
          onChange={(e) => setForm((f) => ({ ...f, gst_number: e.target.value.toUpperCase() }))}
          placeholder="15-char GSTIN"
          className="w-full bg-surface-container rounded-xl border border-outline-variant/30 px-4 py-3 text-sm font-mono"
        />
      </Field>

      <Field label="Contact Person">
        <input
          value={form.contact_person}
          onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))}
          className="w-full bg-surface-container rounded-xl border border-outline-variant/30 px-4 py-3 text-sm font-medium"
        />
      </Field>

      <Field label="Registered Address">
        <textarea
          value={form.registered_address}
          onChange={(e) => setForm((f) => ({ ...f, registered_address: e.target.value }))}
          rows={2}
          className="w-full bg-surface-container rounded-xl border border-outline-variant/30 px-4 py-3 text-sm font-medium resize-none"
        />
      </Field>

      <Field label="Business Description">
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          className="w-full bg-surface-container rounded-xl border border-outline-variant/30 px-4 py-3 text-sm font-medium resize-none"
        />
      </Field>

      {error && <div className="text-sm text-error bg-error-container/40 px-4 py-3 rounded-xl">{error}</div>}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/20">
        {saved && <span className="text-xs text-[#006b3a] font-medium">Saved</span>}
        <button
          onClick={save}
          disabled={saving || !form.company_name || !form.business_type}
          className="px-6 py-3 rounded-xl bg-primary text-on-primary font-label font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2"
        >
          {saving ? (
            <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-base">check</span>
          )}
          {exists ? "Save changes" : "Create profile"}
        </button>
      </div>
    </div>
  );
}

// ── Shared primitives ───────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface-variant mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`text-left p-4 rounded-xl border-2 transition-all ${
        checked
          ? "bg-primary/10 border-primary"
          : "bg-surface-container border-outline-variant/30 hover:border-outline-variant"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-headline font-bold text-sm text-on-surface">{label}</span>
        <div className={`w-10 h-6 rounded-full relative transition-colors ${checked ? "bg-primary" : "bg-outline-variant"}`}>
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
        </div>
      </div>
      {description && <p className="text-xs text-on-surface-variant">{description}</p>}
    </button>
  );
}
