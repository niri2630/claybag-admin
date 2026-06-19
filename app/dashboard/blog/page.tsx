"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, BlogPostListItem } from "@/lib/api";

function formatDate(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function BlogListPage() {
  const [rows, setRows] = useState<BlogPostListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const list = await api.listBlogPostsAdmin();
      setRows(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Delete this post permanently? This can't be undone.")) return;
    setDeletingId(id);
    try {
      await api.deleteBlogPost(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <header className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-headline font-black text-3xl text-on-surface uppercase tracking-tight">Blog</h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Long-form posts that appear at <code className="px-1 py-0.5 rounded bg-surface-container text-xs">/blog</code> on the customer site. Drafts stay
              private until you publish.
            </p>
          </div>
          <Link
            href="/dashboard/blog/new"
            className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-2xl font-label font-bold text-sm hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New post
          </Link>
        </header>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>
        )}

        <div className="bg-surface-container rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-on-surface-variant text-sm">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center">
              <p className="font-label uppercase tracking-widest text-xs text-on-surface-variant mb-2">No posts yet</p>
              <p className="text-on-surface-variant text-sm mb-6">Write your first post to start the journal.</p>
              <Link
                href="/dashboard/blog/new"
                className="inline-flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-2xl font-label font-bold text-sm hover:opacity-90"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Create post
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-surface-container-high text-on-surface-variant text-left text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-label font-bold">Title</th>
                  <th className="px-5 py-3 font-label font-bold">Slug</th>
                  <th className="px-5 py-3 font-label font-bold">Status</th>
                  <th className="px-5 py-3 font-label font-bold">Updated</th>
                  <th className="px-5 py-3 font-label font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-t border-outline-variant/30">
                    <td className="px-5 py-4 align-top">
                      <Link href={`/dashboard/blog/${p.id}`} className="font-bold text-on-surface hover:text-primary">
                        {p.title}
                      </Link>
                      {p.excerpt && (
                        <p className="text-on-surface-variant text-xs mt-1 line-clamp-2 max-w-xl">{p.excerpt}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 align-top text-on-surface-variant font-mono text-xs">/{p.slug}</td>
                    <td className="px-5 py-4 align-top">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full font-label text-[10px] uppercase tracking-widest font-bold ${
                          p.status === "published"
                            ? "bg-tertiary-container text-on-tertiary-container"
                            : "bg-surface-container-highest text-on-surface-variant"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-top text-on-surface-variant text-xs">
                      {formatDate(p.updated_at || p.published_at || p.created_at)}
                    </td>
                    <td className="px-5 py-4 align-top text-right">
                      <div className="inline-flex items-center gap-2">
                        {p.status === "published" && (
                          <a
                            href={`/blog/${p.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-lg hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface"
                            title="View live"
                          >
                            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                          </a>
                        )}
                        <Link
                          href={`/dashboard/blog/${p.id}`}
                          className="p-2 rounded-lg hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          className="p-2 rounded-lg hover:bg-error-container text-error disabled:opacity-50"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
