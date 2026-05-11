"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  title: string;
  /** Required text the admin must type before delete is enabled. Pass null for a simple Yes/No. */
  confirmText?: string | null;
  /** Optional warning body shown above the input. */
  warning?: React.ReactNode;
  /** Optional impact summary (e.g. "12 subcategories, 37 products will be deleted"). */
  impact?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteDialog({
  open,
  title,
  confirmText,
  warning,
  impact,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const [typed, setTyped] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTyped("");
      // Defer focus so animations finish first
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  // Esc to cancel
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, busy, onCancel]);

  const requiresTyping = !!confirmText;
  const canDelete = !busy && (!requiresTyping || typed.trim() === confirmText);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={() => !busy && onCancel()}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-surface-container-lowest rounded-3xl shadow-2xl border border-error/40 w-full max-w-md pointer-events-auto overflow-hidden">
              {/* Header strip */}
              <div className="bg-error-container/60 px-6 py-4 flex items-center gap-3 border-b border-error/20">
                <span className="material-symbols-outlined text-error text-[28px]">warning</span>
                <h3 className="font-headline font-black text-lg uppercase tracking-tight text-on-error-container">
                  {title}
                </h3>
              </div>

              <div className="px-6 py-5 space-y-4">
                {warning && (
                  <div className="text-sm font-body text-on-surface leading-relaxed">{warning}</div>
                )}

                {impact && (
                  <div className="bg-error-container/30 border border-error/30 rounded-xl px-4 py-3">
                    <p className="text-[11px] uppercase font-bold tracking-widest text-error mb-1">Impact</p>
                    <p className="text-sm font-bold text-on-surface">{impact}</p>
                  </div>
                )}

                {requiresTyping && (
                  <div>
                    <label className="text-xs uppercase tracking-widest text-on-surface-variant font-bold block mb-1.5">
                      Type <span className="font-mono text-error bg-error-container/40 px-1.5 py-0.5 rounded text-[11px]">{confirmText}</span> to confirm
                    </label>
                    <input
                      ref={inputRef}
                      type="text"
                      value={typed}
                      onChange={(e) => setTyped(e.target.value)}
                      placeholder={confirmText}
                      disabled={busy}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface border-2 border-outline-variant focus:border-error outline-none text-sm font-mono"
                    />
                    <p className="text-[11px] text-on-surface-variant mt-1.5">
                      This action cannot be undone.
                    </p>
                  </div>
                )}

                {!requiresTyping && (
                  <p className="text-[11px] text-on-surface-variant">
                    This action cannot be undone.
                  </p>
                )}
              </div>

              {/* Footer buttons */}
              <div className="bg-surface-container/30 px-6 py-4 flex items-center justify-end gap-3 border-t border-outline-variant/30">
                <button
                  onClick={onCancel}
                  disabled={busy}
                  className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest bg-surface border border-outline-variant rounded-xl hover:bg-surface-container-high disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={!canDelete}
                  className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest bg-error text-on-error rounded-xl hover:bg-error/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {busy ? "Deleting..." : "Delete"}
                  {!busy && <span className="material-symbols-outlined text-[16px]">delete_forever</span>}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
