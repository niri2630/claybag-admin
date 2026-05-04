"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, Coupon, CouponCreate, User } from "@/lib/api";

type StatusFilter = "all" | "active" | "scheduled" | "expired" | "used" | "exhausted" | "disabled";

const STATUS_BADGE: Record<Coupon["status"], string> = {
  active: "bg-secondary-container/30 text-on-secondary-container border-secondary-container",
  scheduled: "bg-surface-container-high text-on-surface-variant border-outline-variant",
  expired: "bg-amber-100 text-amber-900 border-amber-300",
  used: "bg-purple-100 text-purple-900 border-purple-300",
  exhausted: "bg-purple-100 text-purple-900 border-purple-300",
  disabled: "bg-error-container text-on-error-container border-error",
};

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string): string {
  if (!local) return new Date().toISOString();
  return new Date(local).toISOString();
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
  const [form, setForm] = useState<CouponCreate>({
    code: "",
    discount_type: "flat",
    discount_value: 0,
    min_order_amount: null,
    valid_from: toLocalInput(now.toISOString()),
    valid_until: toLocalInput(inOneHour.toISOString()),
    usage_limit: null,
    usage_limit_per_user: null,
    first_n_orders_only: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Multi-user picker state (for the create form)
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [pickedUserIds, setPickedUserIds] = useState<number[]>([]);

  // Per-card "manage assignees" inline editor — keyed by coupon id
  const [editingAssignees, setEditingAssignees] = useState<number | null>(null);
  const [editAssigneeQuery, setEditAssigneeQuery] = useState("");
  const [editPickedIds, setEditPickedIds] = useState<number[]>([]);
  const [savingAssignees, setSavingAssignees] = useState(false);

  async function loadUsersOnce() {
    if (usersLoaded) return;
    try {
      const list = await api.getUsers();
      setUsers(list);
      setUsersLoaded(true);
    } catch {
      // Non-fatal — picker just stays empty.
    }
  }
  useEffect(() => { loadUsersOnce(); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users.slice(0, 8);
    return users.filter((u) =>
      u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [users, userQuery]);

  const filteredEditUsers = useMemo(() => {
    const q = editAssigneeQuery.trim().toLowerCase();
    if (!q) return users.slice(0, 8);
    return users.filter((u) =>
      u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [users, editAssigneeQuery]);

  async function load() {
    try {
      setLoading(true);
      const list = await api.listCoupons();
      setCoupons(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load coupons");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return coupons.filter((c) => {
      if (filter !== "all" && c.status !== filter) return false;
      if (search && !c.code.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [coupons, filter, search]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.code.trim()) { setError("Code is required"); return; }
    if (form.discount_value <= 0) { setError("Discount value must be > 0"); return; }
    if (form.discount_type === "percent" && form.discount_value > 100) {
      setError("Percent discount cannot exceed 100");
      return;
    }
    setSubmitting(true);
    try {
      await api.createCoupon({
        code: form.code.trim().toUpperCase(),
        discount_type: form.discount_type,
        discount_value: form.discount_value,
        min_order_amount: form.min_order_amount,
        valid_from: fromLocalInput(form.valid_from),
        valid_until: fromLocalInput(form.valid_until),
        usage_limit: form.usage_limit,
        usage_limit_per_user: form.usage_limit_per_user,
        first_n_orders_only: form.first_n_orders_only,
        assigned_user_ids: pickedUserIds,
      });
      setForm((f) => ({ ...f, code: "", discount_value: 0, min_order_amount: null, usage_limit: null, usage_limit_per_user: null, first_n_orders_only: null }));
      setPickedUserIds([]);
      setUserQuery("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not create coupon");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(c: Coupon) {
    try {
      await api.updateCoupon(c.id, { is_active: !c.is_active });
      await load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }

  async function onDelete(c: Coupon) {
    if (!confirm(`Delete coupon ${c.code}? This can't be undone.`)) return;
    try {
      await api.deleteCoupon(c.id);
      await load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error"); }
  }

  async function saveAssignees(c: Coupon) {
    setSavingAssignees(true);
    try {
      await api.updateCoupon(c.id, { assigned_user_ids: editPickedIds });
      setEditingAssignees(null);
      setEditAssigneeQuery("");
      setEditPickedIds([]);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not update assignees");
    } finally {
      setSavingAssignees(false);
    }
  }

  function startEditingAssignees(c: Coupon) {
    setEditingAssignees(c.id);
    setEditPickedIds(c.assigned_user_ids || []);
    setEditAssigneeQuery("");
  }

  function copyCode(c: Coupon) {
    navigator.clipboard?.writeText(c.code);
    setCopiedId(c.id);
    setTimeout(() => setCopiedId((v) => (v === c.id ? null : v)), 1500);
  }

  return (
    <div className="pb-12 max-w-[1400px] mx-auto min-h-[calc(100vh-80px)] flex flex-col">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h2 className="text-4xl font-headline font-bold text-on-surface tracking-tight mb-2">Promo Codes</h2>
          <p className="text-on-surface-variant font-medium">One-time codes for clients and large orders.</p>
        </div>
      </div>

      {error && (
        <div className="bg-error-container border border-error-container text-on-error-container text-sm font-medium rounded-2xl p-4 mb-6 flex items-center gap-3 shrink-0">
          <span className="material-symbols-outlined">error</span> {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
        {/* Form */}
        <form onSubmit={onSubmit} className="lg:w-[380px] shrink-0 bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/30 p-6 self-start lg:sticky lg:top-4">
          <h3 className="font-headline font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary-container bg-secondary-container/20 p-2 rounded-2xl">add_circle</span>
            Forge a code
          </h3>

          <label className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant block mb-2">Code</label>
          <input
            type="text"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            maxLength={64}
            placeholder="e.g. CLIENT-ACME-2026"
            className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-3 mb-4 font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-secondary-container"
          />

          <label className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant block mb-2">Discount Type</label>
          <div className="flex gap-2 mb-4">
            <button type="button" onClick={() => setForm((f) => ({ ...f, discount_type: "flat" }))}
              className={`flex-1 px-4 py-3 rounded-2xl font-label text-xs uppercase tracking-wider transition-all ${form.discount_type === "flat" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface/70"}`}>
              Flat ₹
            </button>
            <button type="button" onClick={() => setForm((f) => ({ ...f, discount_type: "percent" }))}
              className={`flex-1 px-4 py-3 rounded-2xl font-label text-xs uppercase tracking-wider transition-all ${form.discount_type === "percent" ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface/70"}`}>
              Percent %
            </button>
          </div>

          <label className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant block mb-2">
            Discount Value {form.discount_type === "percent" ? "(%)" : "(₹)"}
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.discount_value || ""}
            onChange={(e) => setForm((f) => ({ ...f, discount_value: Number(e.target.value) }))}
            placeholder={form.discount_type === "percent" ? "e.g. 15" : "e.g. 500"}
            className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-secondary-container"
          />

          <label className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant block mb-2">
            Min Order ₹ <span className="text-outline normal-case font-normal">optional</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.min_order_amount ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, min_order_amount: e.target.value === "" ? null : Number(e.target.value) }))}
            placeholder="e.g. 5000"
            className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-secondary-container"
          />

          <div className="border-t border-outline-variant/30 pt-4 mb-4">
            <p className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-3">Usage Caps <span className="text-outline normal-case font-normal">all optional</span></p>

            <label className="font-label text-[10px] uppercase tracking-wider font-bold text-on-surface-variant block mb-1">Global usage limit</label>
            <input
              type="number"
              min="1"
              value={form.usage_limit ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value === "" ? null : Number(e.target.value) }))}
              placeholder="Unlimited"
              className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-2.5 mb-1 focus:outline-none focus:ring-2 focus:ring-secondary-container"
            />
            <p className="text-[10px] text-on-surface/50 mb-3">Total redemptions across all customers. Blank = no global cap (otherwise one-time).</p>

            <label className="font-label text-[10px] uppercase tracking-wider font-bold text-on-surface-variant block mb-1">Per-customer limit</label>
            <input
              type="number"
              min="1"
              value={form.usage_limit_per_user ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, usage_limit_per_user: e.target.value === "" ? null : Number(e.target.value) }))}
              placeholder="Unlimited"
              className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-2.5 mb-1 focus:outline-none focus:ring-2 focus:ring-secondary-container"
            />
            <p className="text-[10px] text-on-surface/50 mb-3">Max times each customer can redeem this code.</p>

            <label className="font-label text-[10px] uppercase tracking-wider font-bold text-on-surface-variant block mb-1">New customers only</label>
            <input
              type="number"
              min="1"
              value={form.first_n_orders_only ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, first_n_orders_only: e.target.value === "" ? null : Number(e.target.value) }))}
              placeholder="Anyone"
              className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-2.5 mb-1 focus:outline-none focus:ring-2 focus:ring-secondary-container"
            />
            <p className="text-[10px] text-on-surface/50 mb-2">Valid only on customer&apos;s first N orders. e.g. <strong>3</strong> = first 3 orders.</p>
          </div>

          <div className="border-t border-outline-variant/30 pt-4 mb-4">
            <p className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-2">
              Who can use this <span className="text-outline normal-case font-normal">leave empty for anyone with the code</span>
            </p>
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-2.5 mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
            />
            {filteredUsers.length > 0 && (
              <div className="max-h-40 overflow-y-auto border border-outline-variant/30 rounded-xl divide-y divide-outline-variant/30 mb-2">
                {filteredUsers.map((u) => {
                  const picked = pickedUserIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() =>
                        setPickedUserIds((ids) =>
                          ids.includes(u.id) ? ids.filter((x) => x !== u.id) : [...ids, u.id],
                        )
                      }
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 transition-colors ${picked ? "bg-secondary-container/30" : "hover:bg-surface-container"}`}
                    >
                      <span className="truncate">
                        <span className="font-bold">{u.name}</span>
                        <span className="text-on-surface-variant"> · {u.email}</span>
                      </span>
                      <span className={`material-symbols-outlined text-[16px] ${picked ? "text-primary" : "text-outline"}`}>
                        {picked ? "check_circle" : "radio_button_unchecked"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {pickedUserIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {pickedUserIds.map((id) => {
                  const u = users.find((x) => x.id === id);
                  if (!u) return null;
                  return (
                    <span key={id} className="inline-flex items-center gap-1 bg-secondary-container/40 text-on-secondary-container text-[11px] px-2 py-1 rounded-full">
                      {u.name}
                      <button type="button" onClick={() => setPickedUserIds((ids) => ids.filter((x) => x !== id))} className="hover:text-error">
                        <span className="material-symbols-outlined text-[12px] leading-none">close</span>
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-on-surface/50">{pickedUserIds.length === 0 ? "Open: anyone who knows the code can redeem it." : `Pinned to ${pickedUserIds.length} customer${pickedUserIds.length === 1 ? "" : "s"}.`}</p>
          </div>

          <label className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant block mb-2">Valid From</label>
          <input
            type="datetime-local"
            value={form.valid_from}
            onChange={(e) => setForm((f) => ({ ...f, valid_from: e.target.value }))}
            className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-secondary-container"
          />

          <label className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant block mb-2">Valid Until</label>
          <input
            type="datetime-local"
            value={form.valid_until}
            onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))}
            className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-secondary-container"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-on-primary font-label font-bold px-6 py-3.5 rounded-2xl shadow-md hover:bg-inverse-surface transition-colors disabled:opacity-50"
          >
            {submitting ? "Forging…" : "Forge Code"}
          </button>
        </form>

        {/* List */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/30 p-4 mb-4 flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="Search codes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] bg-surface-container border border-outline-variant/50 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary-container"
            />
            {(["all", "active", "scheduled", "expired", "used", "exhausted", "disabled"] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full font-label text-[10px] uppercase tracking-widest font-bold transition-all ${filter === f ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`}
              >
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-on-surface-variant font-medium">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-on-surface-variant font-medium italic">No coupons match these filters.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {filtered.map((c) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-5"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="font-mono font-bold text-xl tracking-wider text-on-surface break-all">{c.code}</div>
                      <span className={`shrink-0 inline-block border px-2.5 py-1 rounded-full font-label text-[9px] uppercase tracking-widest font-bold ${STATUS_BADGE[c.status]}`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="font-headline font-bold text-2xl text-primary mb-2">
                      {c.discount_type === "percent" ? `−${c.discount_value}%` : `−₹${c.discount_value.toLocaleString("en-IN")}`}
                    </div>
                    <div className="font-body text-xs text-on-surface-variant mb-3 space-y-0.5">
                      {c.min_order_amount != null && (
                        <div>Min order: ₹{c.min_order_amount.toLocaleString("en-IN")}</div>
                      )}
                      <div>From: {new Date(c.valid_from).toLocaleString("en-IN")}</div>
                      <div>Until: {new Date(c.valid_until).toLocaleString("en-IN")}</div>
                      <div className="pt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]">
                        <span className="font-bold">
                          Used: {c.usage_count}{c.usage_limit != null ? ` / ${c.usage_limit}` : ""}
                        </span>
                        {c.usage_limit_per_user != null && (
                          <span>· max <strong>{c.usage_limit_per_user}</strong>/user</span>
                        )}
                        {c.first_n_orders_only != null && (
                          <span>· first <strong>{c.first_n_orders_only}</strong> orders only</span>
                        )}
                      </div>
                      {c.used_at && c.usage_limit == null && (
                        <div className="mt-1 text-purple-700">Used on order #{c.used_by_order_id} at {new Date(c.used_at).toLocaleString("en-IN")}</div>
                      )}
                      <div className="pt-1 text-[11px]">
                        {c.assigned_users && c.assigned_users.length > 0 ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full">
                            <span className="material-symbols-outlined text-[12px] leading-none">lock</span>
                            Pinned to {c.assigned_users.length} customer{c.assigned_users.length === 1 ? "" : "s"}
                          </span>
                        ) : (
                          <span className="text-on-surface-variant italic">Open · anyone with code</span>
                        )}
                      </div>
                    </div>
                    {editingAssignees === c.id && (
                      <div className="mb-3 p-3 bg-surface-container rounded-2xl border border-outline-variant/40">
                        <p className="font-label text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-2">Pin to customers</p>
                        <input
                          type="text"
                          value={editAssigneeQuery}
                          onChange={(e) => setEditAssigneeQuery(e.target.value)}
                          placeholder="Search by name or email…"
                          className="w-full bg-surface-container-lowest border border-outline-variant/50 rounded-xl px-3 py-2 mb-2 text-xs focus:outline-none focus:ring-2 focus:ring-secondary-container"
                        />
                        {filteredEditUsers.length > 0 && (
                          <div className="max-h-32 overflow-y-auto border border-outline-variant/30 rounded-lg divide-y divide-outline-variant/30 mb-2">
                            {filteredEditUsers.map((u) => {
                              const picked = editPickedIds.includes(u.id);
                              return (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() =>
                                    setEditPickedIds((ids) =>
                                      ids.includes(u.id) ? ids.filter((x) => x !== u.id) : [...ids, u.id],
                                    )
                                  }
                                  className={`w-full text-left px-2 py-1.5 text-[11px] flex items-center justify-between gap-2 transition-colors ${picked ? "bg-secondary-container/30" : "hover:bg-surface-container-high"}`}
                                >
                                  <span className="truncate">
                                    <span className="font-bold">{u.name}</span>
                                    <span className="text-on-surface-variant"> · {u.email}</span>
                                  </span>
                                  <span className={`material-symbols-outlined text-[14px] ${picked ? "text-primary" : "text-outline"}`}>
                                    {picked ? "check_circle" : "radio_button_unchecked"}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                        {editPickedIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {editPickedIds.map((id) => {
                              const u = users.find((x) => x.id === id);
                              if (!u) return null;
                              return (
                                <span key={id} className="inline-flex items-center gap-1 bg-secondary-container/40 text-on-secondary-container text-[10px] px-2 py-0.5 rounded-full">
                                  {u.name}
                                  <button type="button" onClick={() => setEditPickedIds((ids) => ids.filter((x) => x !== id))} className="hover:text-error">
                                    <span className="material-symbols-outlined text-[11px] leading-none">close</span>
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => saveAssignees(c)}
                            disabled={savingAssignees}
                            className="bg-primary text-on-primary text-[11px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full hover:bg-inverse-surface transition-colors disabled:opacity-50"
                          >
                            {savingAssignees ? "Saving…" : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditingAssignees(null); setEditAssigneeQuery(""); setEditPickedIds([]); }}
                            className="text-on-surface-variant hover:text-on-surface text-[11px] uppercase tracking-widest font-bold px-3 py-1.5"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3 flex-wrap">
                      <button onClick={() => copyCode(c)} className={`flex items-center gap-1 text-[11px] uppercase tracking-widest font-bold transition-colors ${copiedId === c.id ? "text-emerald-700" : "text-on-surface-variant hover:text-on-surface"}`}>
                        <span className="material-symbols-outlined text-[14px]">{copiedId === c.id ? "check" : "content_copy"}</span>
                        {copiedId === c.id ? "Copied!" : "Copy"}
                      </button>
                      {c.status !== "used" && (
                        <>
                          <button onClick={() => startEditingAssignees(c)} className="flex items-center gap-1 text-[11px] uppercase tracking-widest font-bold text-on-surface-variant hover:text-on-surface transition-colors">
                            <span className="material-symbols-outlined text-[14px]">group</span>
                            Manage who
                          </button>
                          <button onClick={() => toggleActive(c)} className="flex items-center gap-1 text-[11px] uppercase tracking-widest font-bold text-on-surface-variant hover:text-on-surface transition-colors">
                            <span className="material-symbols-outlined text-[14px]">{c.is_active ? "toggle_on" : "toggle_off"}</span>
                            {c.is_active ? "Disable" : "Enable"}
                          </button>
                          <button onClick={() => onDelete(c)} className="flex items-center gap-1 text-[11px] uppercase tracking-widest font-bold text-error hover:text-on-error-container transition-colors">
                            <span className="material-symbols-outlined text-[14px]">delete</span> Delete
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
