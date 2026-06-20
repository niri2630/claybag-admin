"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, AdminUser, User } from "@/lib/api";

/**
 * Settings page.
 *
 * Two sections, gated by role:
 *  - "Change my password" — visible to everyone signed into the admin panel
 *    (full admin AND scoped staff like orders_admin). Uses the standard
 *    /auth/change-password flow which requires the current password.
 *  - "Reset another user's password" — visible only to full admins. Picks any
 *    user, sets a new password directly (no OTP). Used to onboard staff whose
 *    mailbox can't receive the OTP and to recover any locked-out user. The
 *    target user is force-logged-out via password_changed_at server-side.
 */
export default function SettingsPage() {
  const router = useRouter();
  const [me, setMe] = useState<AdminUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin_user");
      if (raw) setMe(JSON.parse(raw) as AdminUser);
    } catch {}
  }, []);

  const isFullAdmin = me?.is_admin === true || me?.role === "admin";

  return (
    <div>
      <h1 className="font-headline font-black text-3xl text-on-surface uppercase tracking-tight">
        Settings
      </h1>
      <p className="text-on-surface-variant text-sm mt-2">
        {isFullAdmin
          ? "Manage your account and reset passwords for other users."
          : "Change the password for your account."}
      </p>

      <div className="mt-8 flex flex-col gap-8 max-w-2xl">
        <ChangeMyPasswordCard onLoggedOut={() => router.replace("/login")} />
        {isFullAdmin && <ResetOtherUserPasswordCard />}
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant text-sm outline-none focus:border-primary";

function ChangeMyPasswordCard({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password cannot be the same as your current password.");
      return;
    }

    setSaving(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setSuccess("Password changed. Logging you out…");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // The old token is now invalid server-side — clear it and re-login.
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      setTimeout(onLoggedOut, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password.");
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-6"
    >
      <h2 className="font-label font-bold text-sm uppercase tracking-widest text-on-surface mb-5">
        Change My Password
      </h2>

      <Field label="Current password">
        <input
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={inputClass}
          required
        />
      </Field>
      <Field label="New password">
        <input
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={inputClass}
          required
        />
      </Field>
      <Field label="Confirm new password">
        <input
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
          required
        />
      </Field>

      {error && <p className="text-error text-sm mb-4">{error}</p>}
      {success && (
        <p className="text-sm mb-4" style={{ color: "#1b8a4b" }}>
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="bg-primary text-on-primary font-label font-bold px-6 py-2.5 rounded-xl text-sm transition-colors hover:bg-inverse-surface disabled:opacity-50"
      >
        {saving ? "Saving..." : "Update Password"}
      </button>
    </form>
  );
}

function ResetOtherUserPasswordCard() {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api
      .getUsers()
      .then((u) => setUsers(u))
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? users.filter(
          (u) =>
            u.email.toLowerCase().includes(q) ||
            (u.name || "").toLowerCase().includes(q)
        )
      : users;
    return list.slice(0, 8);
  }, [users, search]);

  const selected = users.find((u) => u.id === selectedId) || null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selected) {
      setError("Pick a user first.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    try {
      await api.adminResetUserPassword(selected.id, newPassword);
      setSuccess(
        `Password reset for ${selected.email}. They've been logged out of every existing session.`
      );
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-6"
    >
      <h2 className="font-label font-bold text-sm uppercase tracking-widest text-on-surface mb-1">
        Reset Another User&apos;s Password
      </h2>
      <p className="text-on-surface-variant text-xs mb-5">
        Use this to onboard staff or recover a locked-out account. The user is
        signed out of every existing session immediately.
      </p>

      <Field label="Find user (email or name)">
        <input
          type="text"
          value={search}
          placeholder={loadingUsers ? "Loading users..." : "Search by email or name"}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedId(null);
          }}
          className={inputClass}
          disabled={loadingUsers}
        />
      </Field>

      {search && !selected && (
        <div className="mb-4 border border-outline-variant/30 rounded-lg overflow-hidden">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-sm text-on-surface-variant">No matches.</p>
          ) : (
            filtered.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  setSelectedId(u.id);
                  setSearch(u.email);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-surface-container-high border-b border-outline-variant/20 last:border-b-0"
              >
                <div className="font-medium text-on-surface">{u.email}</div>
                <div className="text-xs text-on-surface-variant">
                  {u.name}
                  {u.role ? ` · ${u.role}` : u.is_admin ? " · admin" : ""}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {selected && (
        <div className="mb-4 px-3 py-2 bg-surface-container border border-outline-variant/40 rounded-lg flex items-center justify-between">
          <div>
            <div className="font-medium text-on-surface text-sm">{selected.email}</div>
            <div className="text-xs text-on-surface-variant">
              {selected.name}
              {selected.role ? ` · ${selected.role}` : selected.is_admin ? " · admin" : ""}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedId(null);
              setSearch("");
            }}
            className="text-xs text-on-surface-variant hover:text-on-surface underline"
          >
            change
          </button>
        </div>
      )}

      <Field label="New password (min 8 chars)">
        <input
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={inputClass}
          required
        />
      </Field>
      <Field label="Confirm new password">
        <input
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
          required
        />
      </Field>

      {error && <p className="text-error text-sm mb-4">{error}</p>}
      {success && (
        <p className="text-sm mb-4" style={{ color: "#1b8a4b" }}>
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={saving || !selected}
        className="bg-primary text-on-primary font-label font-bold px-6 py-2.5 rounded-xl text-sm transition-colors hover:bg-inverse-surface disabled:opacity-50"
      >
        {saving ? "Saving..." : "Reset Password"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
