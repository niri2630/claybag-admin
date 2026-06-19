"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, BlogPost } from "@/lib/api";
import BlogPostForm from "../_components/BlogPostForm";

export default function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
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
        Loading post…
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-3">
        <p className="text-error text-sm">{error || "Post not found"}</p>
        <button
          onClick={() => router.push("/dashboard/blog")}
          className="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold"
        >
          Back to blog list
        </button>
      </div>
    );
  }

  return <BlogPostForm existing={post} />;
}
