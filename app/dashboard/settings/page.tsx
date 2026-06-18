"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export default function SettingsPage() {
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
      setSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant text-sm outline-none focus:border-primary";

  return (
    <div>
      <h1 className="font-headline font-black text-3xl text-on-surface uppercase tracking-tight">
        Settings
      </h1>
      <p className="text-on-surface-variant text-sm mt-2">
        Change the password for your admin account.
      </p>

      <form
        onSubmit={submit}
        className="mt-8 max-w-md bg-surface-container-low border border-outline-variant/40 rounded-2xl p-6"
      >
        <h2 className="font-label font-bold text-sm uppercase tracking-widest text-on-surface mb-5">
          Change Password
        </h2>

        <div className="mb-4">
          <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold block mb-1.5">
            Current password
          </label>
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div className="mb-4">
          <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold block mb-1.5">
            New password
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div className="mb-5">
          <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold block mb-1.5">
            Confirm new password
          </label>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
            required
          />
        </div>

        {error && (
          <p className="text-error text-sm mb-4">{error}</p>
        )}
        {success && (
          <p className="text-sm mb-4" style={{ color: "#1b8a4b" }}>{success}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-on-primary font-label font-bold px-6 py-2.5 rounded-xl text-sm transition-colors hover:bg-inverse-surface disabled:opacity-50"
        >
          {saving ? "Saving..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
