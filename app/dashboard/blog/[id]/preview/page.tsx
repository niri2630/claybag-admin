"use client";

/**
 * Admin-side preview of a blog post.
 *
 * Drafts can't be read off the public /blog/<slug> endpoint (it filters
 * status='published'), so editors hit 404 if they Preview before publishing.
 * This page calls /blog/admin/posts/{id} (admin auth required) and renders the
 * same article layout the public site uses. Keep the markup in sync with
 * claybag-web/app/blog/[slug]/page.tsx so what you preview is what ships.
 */

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, BlogPost } from "@/lib/api";

function formatDate(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default function PreviewBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await api.getBlogPostAdmin(Number(id));
        if (alive) setPost(p);
      } catch (e: unknown) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load post");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-on-surface-variant text-sm">
        Loading preview…
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-3">
        <p className="text-error text-sm">{error || "Post not found"}</p>
        <button
          onClick={() => router.push(`/dashboard/blog/${id}`)}
          className="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold"
        >
          Back to editor
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f3f2]">
      {/* Preview banner */}
      <div className="bg-black text-[#fdc003] text-xs px-6 py-3 flex items-center justify-between flex-wrap gap-3 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="font-label uppercase tracking-widest font-bold">Preview</span>
          <span className="opacity-70">
            Status: <span className="font-bold">{post.status}</span>
            {post.status === "draft" && " — not visible to customers"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/blog/${id}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#fdc003] text-black font-bold hover:opacity-90"
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
            Back to editor
          </Link>
        </div>
      </div>

      {/* Header — mirrors the public post page */}
      <section className="bg-black text-white pt-16 pb-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <p className="font-label text-[10px] md:text-xs uppercase tracking-[0.4em] text-gray-400">
            {formatDate(post.published_at || post.created_at)}
            {post.author ? ` · ${post.author}` : ""}
          </p>
          <h1 className="mt-4 text-4xl md:text-6xl font-black tracking-tighter leading-[0.95] uppercase">
            {post.title || "Untitled"}
          </h1>
          {post.excerpt && (
            <p className="mt-6 text-gray-300 text-base md:text-lg leading-relaxed max-w-3xl">{post.excerpt}</p>
          )}
        </div>
      </section>

      {/* Body */}
      <section className="py-16 md:py-20 px-4 md:px-8">
        <article className="max-w-3xl mx-auto bg-white p-6 md:p-14 border-t-[8px] border-black shadow-xl">
          {post.cover_image_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={post.cover_image_url}
              alt={post.cover_image_alt || post.title}
              className="w-full h-auto mb-10"
            />
          )}
          <div
            className={`
              max-w-none text-gray-700
              [&_h1]:font-black [&_h1]:tracking-tighter [&_h1]:uppercase [&_h1]:text-3xl md:[&_h1]:text-4xl [&_h1]:text-black [&_h1]:mt-12 [&_h1]:mb-6
              [&_h2]:font-black [&_h2]:tracking-tighter [&_h2]:uppercase [&_h2]:text-2xl md:[&_h2]:text-3xl [&_h2]:text-black [&_h2]:mt-12 [&_h2]:mb-6 [&_h2]:pb-4 [&_h2]:border-b-2 [&_h2]:border-black/5
              [&_h3]:font-black [&_h3]:tracking-tighter [&_h3]:uppercase [&_h3]:text-xl md:[&_h3]:text-2xl [&_h3]:text-gray-900 [&_h3]:mt-10 [&_h3]:mb-4
              [&_h4]:font-bold [&_h4]:text-black [&_h4]:mt-8 [&_h4]:mb-3
              [&_p]:leading-[1.8] [&_p]:text-[16px] [&_p]:my-5
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-5 [&_ul]:space-y-2
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-5 [&_ol]:space-y-2
              [&_li]:marker:text-[#fdc003] [&_li]:pl-1
              [&_strong]:font-bold [&_strong]:text-black
              [&_em]:italic
              [&_u]:underline
              [&_a]:text-black [&_a]:font-bold [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-[#fdc003]
              [&_blockquote]:border-l-4 [&_blockquote]:border-[#fdc003] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-500 [&_blockquote]:my-6
              [&_hr]:my-10 [&_hr]:border-black/10
              [&_img]:my-8 [&_img]:w-full [&_img]:h-auto
              [&_pre]:bg-black [&_pre]:text-white [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-6
              [&_code]:font-mono [&_code]:text-[14px]
              [&_table]:w-full [&_table]:border-collapse [&_table]:my-6
              [&_th]:bg-[#fdc003] [&_th]:text-black [&_th]:font-bold [&_th]:text-left [&_th]:p-3 [&_th]:border [&_th]:border-black/15
              [&_td]:p-3 [&_td]:border [&_td]:border-black/15 [&_td]:align-top
              [&>:first-child]:mt-0
            `}
            dangerouslySetInnerHTML={{ __html: post.body_html || "<p>(empty body)</p>" }}
          />

          {post.faqs && post.faqs.length > 0 && (
            <section className="mt-14 pt-10 border-t border-black/10">
              <p className="font-label text-[10px] uppercase tracking-[0.3em] text-[#fdc003] font-bold">
                Frequently asked
              </p>
              <h2 className="mt-3 font-black tracking-tighter uppercase text-2xl md:text-3xl text-black">
                Questions, answered
              </h2>
              <div className="mt-8 space-y-3">
                {post.faqs.map((faq, idx) => (
                  <details
                    key={idx}
                    className="group border-t border-black/10 last:border-b py-5"
                  >
                    <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                      <h3 className="font-bold text-black text-[17px] leading-snug">
                        {faq.question}
                      </h3>
                      <span className="material-symbols-outlined text-[24px] text-black/40 group-open:rotate-45 transition-transform shrink-0">
                        add
                      </span>
                    </summary>
                    <p className="mt-3 text-gray-700 leading-[1.8] text-[16px] whitespace-pre-line">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </article>
      </section>
    </div>
  );
}
