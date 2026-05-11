"use client";

import { SeoFields } from "@/lib/api";

interface Props {
  value: SeoFields;
  onChange: (next: SeoFields) => void;
  defaultTitle?: string;
  defaultDescription?: string;
  scopeLabel?: string; // e.g. "this product"
}

const TITLE_OPTIMAL = [40, 60] as const;
const DESC_OPTIMAL = [120, 160] as const;

function lenColor(len: number, [min, max]: readonly [number, number]) {
  if (len === 0) return "text-gray-400";
  if (len < min) return "text-amber-600";
  if (len > max) return "text-red-600";
  return "text-emerald-600";
}

export default function SeoFieldsEditor({
  value,
  onChange,
  defaultTitle,
  defaultDescription,
  scopeLabel = "this page",
}: Props) {
  const titleLen = (value.seo_title || "").length;
  const descLen = (value.seo_description || "").length;

  const update = (patch: Partial<SeoFields>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4 border-t border-gray-200 pt-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-base uppercase tracking-wider">SEO</h3>
        <p className="text-xs text-gray-500">Leave blank to auto-generate. Edits go live without rebuild.</p>
      </div>

      {/* Title */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <label className="text-xs uppercase tracking-widest text-gray-600 font-bold">SEO Title</label>
          <span className={`text-[11px] font-mono ${lenColor(titleLen, TITLE_OPTIMAL)}`}>
            {titleLen} / 60
          </span>
        </div>
        <input
          type="text"
          value={value.seo_title || ""}
          onChange={(e) => update({ seo_title: e.target.value || null })}
          maxLength={180}
          placeholder={defaultTitle || `Default: auto-generated from ${scopeLabel}`}
          className="w-full px-3 py-2.5 rounded-xl bg-[#fbf9f8] border border-[#eae8e7] focus:border-[#fdc003] focus:bg-white outline-none text-sm"
        />
        <p className="text-[11px] text-gray-400 mt-1">Optimal: 40-60 characters. Shows in Google search results.</p>
      </div>

      {/* Description */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <label className="text-xs uppercase tracking-widest text-gray-600 font-bold">Meta Description</label>
          <span className={`text-[11px] font-mono ${lenColor(descLen, DESC_OPTIMAL)}`}>
            {descLen} / 160
          </span>
        </div>
        <textarea
          value={value.seo_description || ""}
          onChange={(e) => update({ seo_description: e.target.value || null })}
          maxLength={320}
          rows={2}
          placeholder={defaultDescription || `Default: auto-generated from ${scopeLabel}`}
          className="w-full px-3 py-2.5 rounded-xl bg-[#fbf9f8] border border-[#eae8e7] focus:border-[#fdc003] focus:bg-white outline-none text-sm resize-y"
        />
        <p className="text-[11px] text-gray-400 mt-1">Optimal: 120-160 characters. Shows under the title in search results.</p>
      </div>

      {/* Keywords */}
      <div>
        <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1.5">Keywords</label>
        <input
          type="text"
          value={value.seo_keywords || ""}
          onChange={(e) => update({ seo_keywords: e.target.value || null })}
          placeholder="e.g. custom polo shirts, branded merch, startup gifts"
          className="w-full px-3 py-2.5 rounded-xl bg-[#fbf9f8] border border-[#eae8e7] focus:border-[#fdc003] focus:bg-white outline-none text-sm"
        />
        <p className="text-[11px] text-gray-400 mt-1">Comma-separated. Used by some search engines (Google ignores, but harmless).</p>
      </div>

      {/* OG image */}
      <div>
        <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1.5">OG Image URL</label>
        <input
          type="url"
          value={value.og_image || ""}
          onChange={(e) => update({ og_image: e.target.value || null })}
          placeholder="https://claybag-media-prod.s3.../share-image.jpg"
          className="w-full px-3 py-2.5 rounded-xl bg-[#fbf9f8] border border-[#eae8e7] focus:border-[#fdc003] focus:bg-white outline-none text-sm"
        />
        <p className="text-[11px] text-gray-400 mt-1">Used for WhatsApp/Twitter/LinkedIn link previews. Recommended size: 1200×630.</p>
      </div>

      {/* Canonical override */}
      <div>
        <label className="text-xs uppercase tracking-widest text-gray-600 font-bold block mb-1.5">Canonical URL override</label>
        <input
          type="url"
          value={value.seo_canonical || ""}
          onChange={(e) => update({ seo_canonical: e.target.value || null })}
          placeholder="Leave blank to auto-set to this page's URL"
          className="w-full px-3 py-2.5 rounded-xl bg-[#fbf9f8] border border-[#eae8e7] focus:border-[#fdc003] focus:bg-white outline-none text-sm"
        />
        <p className="text-[11px] text-gray-400 mt-1">Only override if this content lives at a different canonical URL.</p>
      </div>

      {/* No-index toggle */}
      <label className="flex items-start gap-3 p-3 rounded-xl bg-[#fef3f3] border border-red-200 cursor-pointer hover:bg-[#fce8e8]">
        <input
          type="checkbox"
          checked={!!value.seo_noindex}
          onChange={(e) => update({ seo_noindex: e.target.checked })}
          className="mt-0.5 accent-red-600 cursor-pointer"
        />
        <div>
          <p className="font-bold text-sm">Hide from search engines (noindex)</p>
          <p className="text-[11px] text-gray-600 mt-0.5">Tells Google to never show this page in results. Use sparingly — only for thin / sensitive pages.</p>
        </div>
      </label>
    </div>
  );
}
