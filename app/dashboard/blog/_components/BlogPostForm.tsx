"use client";

/**
 * Shared form for both /dashboard/blog/new and /dashboard/blog/[id].
 *
 * Behaviour:
 *  - `Save draft` / `Update` always writes whatever the editor currently has.
 *  - `Publish` and `Unpublish` are status-only flips; backend stamps
 *    published_at on first publish and never overwrites it on re-publish so
 *    the public URL stays stable in Search Console.
 *  - SEO title / description show live X/N counters with Google's hard cutoffs
 *    plus a mini SERP preview that mirrors how the snippet renders.
 *  - Slug is auto-generated from the title until the user touches it.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, BlogPost, BlogPostCreate } from "@/lib/api";
import RichTextEditor from "./RichTextEditor";

const SITE_URL = "https://claybag.com";
const SEO_TITLE_MAX = 60;
const SEO_DESC_MAX = 155;
const SLUG_MAX = 200;

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-surface border border-outline-variant text-sm outline-none focus:border-primary";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, SLUG_MAX);
}

type Draft = {
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string;
  cover_image_alt: string;
  body_html: string;
  author: string;
  status: "draft" | "published";
  seo_title: string;
  seo_description: string;
};

function emptyDraft(): Draft {
  return {
    title: "",
    slug: "",
    excerpt: "",
    cover_image_url: "",
    cover_image_alt: "",
    body_html: "",
    author: "",
    status: "draft",
    seo_title: "",
    seo_description: "",
  };
}

function fromPost(p: BlogPost): Draft {
  return {
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt || "",
    cover_image_url: p.cover_image_url || "",
    cover_image_alt: p.cover_image_alt || "",
    body_html: p.body_html,
    author: p.author || "",
    status: p.status,
    seo_title: p.seo_title || "",
    seo_description: p.seo_description || "",
  };
}

function toPayload(d: Draft): BlogPostCreate {
  return {
    title: d.title.trim(),
    slug: d.slug.trim(),
    excerpt: d.excerpt.trim() || null,
    cover_image_url: d.cover_image_url.trim() || null,
    cover_image_alt: d.cover_image_alt.trim() || null,
    body_html: d.body_html,
    author: d.author.trim() || null,
    status: d.status,
    seo_title: d.seo_title.trim() || null,
    seo_description: d.seo_description.trim() || null,
  };
}

export default function BlogPostForm({ existing }: { existing?: BlogPost }) {
  const router = useRouter();
  const isEdit = !!existing;
  const [draft, setDraft] = useState<Draft>(existing ? fromPost(existing) : emptyDraft());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  // Track whether the user has manually edited the slug — if not, we keep
  // it in sync with the title so the URL evolves while the post is shaped.
  const slugTouched = useRef(isEdit);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  useEffect(() => {
    if (slugTouched.current) return;
    update("slug", slugify(draft.title));
  }, [draft.title]);

  async function save(nextStatus?: "draft" | "published") {
    setError("");
    const status = nextStatus ?? draft.status;
    if (!draft.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!draft.slug.trim()) {
      setError("Slug is required.");
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug)) {
      setError("Slug must be lowercase letters, numbers and hyphens (no leading/trailing hyphen).");
      return;
    }

    setSaving(true);
    try {
      const payload = toPayload({ ...draft, status });
      if (isEdit && existing) {
        const updated = await api.updateBlogPost(existing.id, payload);
        setDraft(fromPost(updated));
      } else {
        const created = await api.createBlogPost(payload);
        router.replace(`/dashboard/blog/${created.id}`);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setCoverUploading(true);
    setError("");
    try {
      const { url } = await api.uploadBlogImage(file);
      update("cover_image_url", url);
      if (!draft.cover_image_alt) update("cover_image_alt", file.name.replace(/\.[^.]+$/, ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cover upload failed");
    } finally {
      setCoverUploading(false);
    }
  }

  const titleCount = draft.title.length;
  const seoTitleCount = draft.seo_title.length;
  const seoDescCount = draft.seo_description.length;
  const seoTitleOver = seoTitleCount > SEO_TITLE_MAX;
  const seoDescOver = seoDescCount > SEO_DESC_MAX;

  const serp = useMemo(() => {
    const t = (draft.seo_title || draft.title || "Post title").trim();
    const d = (draft.seo_description || draft.excerpt || "").trim();
    return {
      title: t.length > 60 ? t.slice(0, 57) + "…" : t,
      url: `${SITE_URL}/blog/${draft.slug || "post-slug"}`,
      desc: d.length > 158 ? d.slice(0, 155) + "…" : d || "ClayBag journal — branding insights, gifting playbooks and small-batch stories.",
    };
  }, [draft.seo_title, draft.title, draft.seo_description, draft.excerpt, draft.slug]);

  const previewHref = isEdit && existing ? `/blog/${existing.slug}` : null;

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-screen-2xl mx-auto px-6 py-8">
        <header className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <Link
              href="/dashboard/blog"
              className="inline-flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-xs font-label uppercase tracking-widest mb-2"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span>
              All posts
            </Link>
            <h1 className="font-headline font-black text-3xl text-on-surface uppercase tracking-tight">
              {isEdit ? "Edit post" : "New post"}
            </h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Body, cover and SEO all live here. Drafts stay private until you hit Publish.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {previewHref && (
              <a
                href={previewHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-outline-variant text-on-surface text-sm font-bold hover:bg-surface-container-highest"
              >
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                Preview
              </a>
            )}
            {draft.status === "published" ? (
              <button
                type="button"
                onClick={() => save("draft")}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-outline-variant text-on-surface text-sm font-bold hover:bg-surface-container-highest disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">unpublished</span>
                Unpublish
              </button>
            ) : (
              <button
                type="button"
                onClick={() => save("draft")}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-outline-variant text-on-surface text-sm font-bold hover:bg-surface-container-highest disabled:opacity-50"
              >
                Save draft
              </button>
            )}
            <button
              type="button"
              onClick={() => save(draft.status === "published" ? "published" : "published")}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-on-primary text-sm font-bold hover:opacity-90 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">
                {draft.status === "published" ? "save" : "publish"}
              </span>
              {draft.status === "published" ? "Update" : "Publish"}
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm">{error}</div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
          {/* Main column */}
          <div className="space-y-6">
            <section className="bg-surface-container rounded-2xl p-5 space-y-4">
              <Field label="Title" hint={`${titleCount} chars`}>
                <input
                  className={inputClass}
                  value={draft.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="The Small-Batch Revolution in B2B Gifting"
                />
              </Field>

              <Field label="URL slug" hint={`claybag.com/blog/${draft.slug || "..."}`}>
                <input
                  className={inputClass}
                  value={draft.slug}
                  onChange={(e) => {
                    slugTouched.current = true;
                    update("slug", e.target.value.toLowerCase());
                  }}
                  placeholder="small-batch-gifting"
                  maxLength={SLUG_MAX}
                />
              </Field>

              <Field label="Excerpt" hint="Shown in the index card and as fallback SEO description.">
                <textarea
                  className={`${inputClass} min-h-[80px]`}
                  value={draft.excerpt}
                  onChange={(e) => update("excerpt", e.target.value)}
                  placeholder="One or two sentences that set up the post."
                  maxLength={500}
                />
              </Field>
            </section>

            <section className="bg-surface-container rounded-2xl p-5 space-y-3">
              <div className="flex items-baseline justify-between">
                <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                  Body
                </label>
                <span className="text-xs text-on-surface-variant">
                  Headings, lists, links and inline images supported.
                </span>
              </div>
              <RichTextEditor
                value={draft.body_html}
                onChange={(html) => update("body_html", html)}
              />
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <section className="bg-surface-container rounded-2xl p-5 space-y-4">
              <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                Featured image
              </h3>
              {draft.cover_image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={draft.cover_image_url}
                  alt={draft.cover_image_alt || "Cover"}
                  className="w-full aspect-[16/10] object-cover rounded-xl border border-outline-variant"
                />
              ) : (
                <div className="w-full aspect-[16/10] rounded-xl border border-dashed border-outline-variant bg-surface flex items-center justify-center text-on-surface-variant text-xs">
                  No image yet
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary-container text-on-secondary-container text-sm font-bold cursor-pointer hover:opacity-90">
                  <span className="material-symbols-outlined text-[18px]">upload</span>
                  {coverUploading ? "Uploading…" : draft.cover_image_url ? "Replace" : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverUpload}
                    disabled={coverUploading}
                  />
                </label>
                {draft.cover_image_url && (
                  <button
                    type="button"
                    onClick={() => {
                      update("cover_image_url", "");
                      update("cover_image_alt", "");
                    }}
                    className="text-error text-sm font-bold hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <Field label="Alt text" hint="Describes the image for screen readers and SEO.">
                <input
                  className={inputClass}
                  value={draft.cover_image_alt}
                  onChange={(e) => update("cover_image_alt", e.target.value)}
                  placeholder="Branded welcome kit on a desk"
                />
              </Field>
            </section>

            <section className="bg-surface-container rounded-2xl p-5 space-y-4">
              <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                Byline
              </h3>
              <Field label="Author" hint="Defaults to your admin name if left blank.">
                <input
                  className={inputClass}
                  value={draft.author}
                  onChange={(e) => update("author", e.target.value)}
                  placeholder="ClayBag team"
                />
              </Field>
            </section>

            <section className="bg-surface-container rounded-2xl p-5 space-y-4">
              <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                SEO
              </h3>

              <Field
                label="SEO title"
                hint={
                  <span className={seoTitleOver ? "text-error" : ""}>
                    {seoTitleCount}/{SEO_TITLE_MAX}
                  </span>
                }
              >
                <input
                  className={inputClass}
                  value={draft.seo_title}
                  onChange={(e) => update("seo_title", e.target.value)}
                  placeholder={draft.title || "Custom Title — ClayBag Blog"}
                />
              </Field>

              <Field
                label="SEO description"
                hint={
                  <span className={seoDescOver ? "text-error" : ""}>
                    {seoDescCount}/{SEO_DESC_MAX}
                  </span>
                }
              >
                <textarea
                  className={`${inputClass} min-h-[90px]`}
                  value={draft.seo_description}
                  onChange={(e) => update("seo_description", e.target.value)}
                  placeholder={draft.excerpt || "A short snippet shown under the title in Google."}
                />
              </Field>

              {/* SERP preview */}
              <div className="rounded-xl border border-outline-variant bg-surface p-4">
                <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant mb-2">
                  Google preview
                </p>
                <div className="font-mono text-[12px] text-emerald-700">{serp.url}</div>
                <div className="text-[18px] leading-snug text-[#1a0dab] mt-1 truncate">{serp.title}</div>
                <div className="text-[13px] text-[#4d5156] mt-1 line-clamp-2">{serp.desc}</div>
              </div>
            </section>

            <section className="bg-surface-container rounded-2xl p-5 space-y-2">
              <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">
                Status
              </h3>
              <p className="text-sm text-on-surface">
                Current status:{" "}
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full font-label text-[10px] uppercase tracking-widest font-bold ${
                    draft.status === "published"
                      ? "bg-tertiary-container text-on-tertiary-container"
                      : "bg-surface-container-highest text-on-surface-variant"
                  }`}
                >
                  {draft.status}
                </span>
              </p>
              {isEdit && existing?.published_at && (
                <p className="text-xs text-on-surface-variant">
                  First published:{" "}
                  {new Date(existing.published_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">
          {label}
        </label>
        {hint && <span className="text-xs text-on-surface-variant">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
