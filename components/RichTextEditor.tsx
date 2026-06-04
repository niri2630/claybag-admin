"use client";

// WYSIWYG editor for long-form product copy (description, branding info,
// delivery info, etc.). Backed by TipTap (ProseMirror) — the value is HTML
// and the parent owns the state. The storefront sanitises this HTML via
// DOMPurify before rendering.
//
// Constrained to H2 / H3 only (matches the storefront H1=product-name spec)
// plus inline Bold / Italic and bullet/numbered lists. No H1 / H4-H6.

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  rows?: number;
};

// Minimal HTML-stripper for the char counter. Used as a hint, not for security.
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export default function RichTextEditor({ value, onChange, placeholder, rows = 4 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Cap headings at H2 / H3 — H1 is reserved for product name on the page.
        heading: { levels: [2, 3] },
        // Don't ship horizontal rule / code-block buttons; admins don't need them.
        horizontalRule: false,
        codeBlock: false,
      }),
    ],
    content: value || "",
    // Avoid SSR hydration mismatch in Next 16 — render only on client.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[120px] px-4 py-3.5 focus:outline-none " +
          "[&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-2 " +
          "[&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-1 " +
          "[&_strong]:font-bold " +
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 " +
          "[&_p]:my-2",
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML();
      // TipTap returns "<p></p>" when empty — normalise to empty string so
      // the "required" indicator on the parent (char counter) reacts correctly.
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  // Keep editor in sync when parent resets the value (e.g. selecting a
  // different product to edit). Avoid re-setting while the user is typing,
  // since that would clobber the cursor.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "";
    if (next !== current && next !== (current === "<p></p>" ? "" : current)) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    // Pre-mount placeholder — matches the textarea height so the form
    // doesn't jump when the editor hydrates.
    return (
      <div
        className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl"
        style={{ minHeight: `${rows * 28 + 28}px` }}
      />
    );
  }

  const btn = (active: boolean) =>
    `px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
      active
        ? "bg-on-surface text-surface"
        : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-high"
    }`;

  return (
    <div className="w-full bg-surface-container border border-outline-variant/50 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-secondary-container transition-all">
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-outline-variant/30 bg-surface-container-lowest/60 flex-wrap">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btn(editor.isActive("bold"))}
          title="Bold (Ctrl+B)"
        >
          <span className="font-bold">B</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btn(editor.isActive("italic"))}
          title="Italic (Ctrl+I)"
        >
          <span className="italic">I</span>
        </button>
        <span className="w-px h-5 bg-outline-variant/40 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btn(editor.isActive("heading", { level: 2 }))}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={btn(editor.isActive("heading", { level: 3 }))}
          title="Heading 3"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={btn(editor.isActive("paragraph"))}
          title="Paragraph"
        >
          ¶
        </button>
        <span className="w-px h-5 bg-outline-variant/40 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btn(editor.isActive("bulletList"))}
          title="Bulleted list"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btn(editor.isActive("orderedList"))}
          title="Numbered list"
        >
          1. List
        </button>
        <span className="w-px h-5 bg-outline-variant/40 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={`${btn(false)} disabled:opacity-40 disabled:cursor-not-allowed`}
          title="Undo (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={`${btn(false)} disabled:opacity-40 disabled:cursor-not-allowed`}
          title="Redo (Ctrl+Shift+Z)"
        >
          ↷
        </button>
        {placeholder && !editor.getText().trim() && (
          <span className="ml-auto text-[11px] text-on-surface-variant pointer-events-none truncate max-w-[40%]">
            {placeholder}
          </span>
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
