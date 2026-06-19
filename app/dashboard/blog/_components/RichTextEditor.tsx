"use client";

/**
 * Tiptap-based rich-text editor used by the blog editor.
 *
 * Output is HTML — the API sanitizes it on every write via bleach, so the
 * whitelist defined in app/routers/blog.py is the source of truth for what
 * survives. Anything not on that whitelist (script, iframe, on* handlers, etc.)
 * gets stripped before storage.
 *
 * Image insertion uses the admin /blog/admin/upload-image endpoint, which
 * skips the products pipeline's 500x500 crop so editorial images keep their
 * aspect ratio.
 */

import { useEffect, useRef } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
// Tiptap 3.x exports these as named exports — `default` was dropped.
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { api } from "@/lib/api";

type Props = {
  value: string;
  onChange: (html: string) => void;
};

function ToolbarButton({
  active,
  disabled,
  onClick,
  icon,
  label,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`w-8 h-8 inline-flex items-center justify-center rounded-md transition-colors disabled:opacity-40 ${
        active
          ? "bg-secondary-container text-on-secondary-container"
          : "text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface"
      }`}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </button>
  );
}

function ToolbarText({
  active,
  onClick,
  label,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`h-8 px-2 inline-flex items-center justify-center rounded-md font-bold text-xs transition-colors ${
        active
          ? "bg-secondary-container text-on-secondary-container"
          : "text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface"
      }`}
    >
      {label}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-outline-variant/50 mx-1" />;
}

export default function RichTextEditor({ value, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    // The editor is mounted client-side only — Tiptap reads `window` on init,
    // so we tell React it's fine for SSR by disabling immediate render.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
      Table.configure({ resizable: true, HTMLAttributes: { class: "tiptap-table" } }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "prose-tiptap min-h-[420px] px-5 py-4 outline-none text-on-surface text-[15px] leading-relaxed",
      },
      // Intercept pasted image files (e.g. copy from Figma / Excel screenshot)
      // and upload them rather than dropping a base64 blob that bleach strips.
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.kind === "file" && item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (!file) continue;
            event.preventDefault();
            (async () => {
              try {
                const { url } = await api.uploadBlogImage(file);
                view.dispatch(
                  view.state.tr.replaceSelectionWith(
                    view.state.schema.nodes.image.create({ src: url, alt: file.name }),
                  ),
                );
              } catch (err) {
                alert(err instanceof Error ? err.message : "Paste upload failed");
              }
            })();
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync external value changes (e.g. when loading an existing post) into the
  // editor without retriggering onUpdate -> infinite loop.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  async function handleImagePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-uploading the same filename later
    if (!file || !editor) return;
    try {
      const { url } = await api.uploadBlogImage(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Image upload failed");
    }
  }

  function promptLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = prompt("URL (leave empty to remove link):", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  if (!editor) {
    return (
      <div className="border border-outline-variant rounded-2xl overflow-hidden bg-surface">
        <div className="px-5 py-4 text-on-surface-variant text-sm">Loading editor…</div>
      </div>
    );
  }

  return (
    <div className="border border-outline-variant rounded-2xl overflow-hidden bg-surface">
      {/* Toolbar */}
      <div className="flex items-center gap-1 flex-wrap px-3 py-2 border-b border-outline-variant/50 bg-surface-container-low">
        <Toolbar editor={editor} onPickImage={() => fileInputRef.current?.click()} onLink={promptLink} />
      </div>

      <EditorContent editor={editor} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImagePicked}
      />

      {/* Scoped styles so the editor surface matches the live blog typography. */}
      <style jsx global>{`
        .prose-tiptap h1 {
          font-weight: 900;
          font-size: 1.875rem;
          line-height: 1.1;
          letter-spacing: -0.025em;
          text-transform: uppercase;
          margin: 1.5rem 0 0.75rem;
        }
        .prose-tiptap h2 {
          font-weight: 900;
          font-size: 1.5rem;
          line-height: 1.15;
          letter-spacing: -0.025em;
          text-transform: uppercase;
          margin: 1.25rem 0 0.5rem;
        }
        .prose-tiptap h3 {
          font-weight: 800;
          font-size: 1.25rem;
          text-transform: uppercase;
          margin: 1rem 0 0.5rem;
        }
        .prose-tiptap h4 {
          font-weight: 700;
          font-size: 1rem;
          margin: 0.75rem 0 0.25rem;
        }
        .prose-tiptap p { margin: 0.5rem 0; }
        .prose-tiptap ul { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .prose-tiptap ol { list-style: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .prose-tiptap li { margin: 0.25rem 0; }
        .prose-tiptap strong { font-weight: 700; }
        .prose-tiptap em { font-style: italic; }
        .prose-tiptap u { text-decoration: underline; }
        .prose-tiptap a { color: #0066cc; text-decoration: underline; }
        .prose-tiptap blockquote {
          border-left: 3px solid #fdc003;
          padding-left: 1rem;
          margin: 1rem 0;
          color: rgba(0,0,0,0.6);
          font-style: italic;
        }
        .prose-tiptap img { max-width: 100%; height: auto; margin: 1rem 0; border-radius: 6px; }
        .prose-tiptap pre {
          background: #0a0a0a;
          color: #fff;
          padding: 1rem;
          border-radius: 6px;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .prose-tiptap code { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 0.875rem; }
        .prose-tiptap hr { border: 0; border-top: 1px solid rgba(0,0,0,0.1); margin: 1.5rem 0; }
        .prose-tiptap table {
          border-collapse: collapse;
          margin: 1rem 0;
          table-layout: fixed;
          width: 100%;
          overflow: hidden;
        }
        .prose-tiptap table td,
        .prose-tiptap table th {
          border: 1px solid rgba(0,0,0,0.15);
          padding: 0.5rem 0.75rem;
          vertical-align: top;
          min-width: 1em;
          position: relative;
        }
        .prose-tiptap table th {
          background: #fdc003;
          font-weight: 700;
          text-align: left;
        }
        .prose-tiptap table .selectedCell:after {
          background: rgba(253,192,3,0.25);
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }
        .prose-tiptap table .column-resize-handle {
          background: #fdc003;
          bottom: -2px;
          pointer-events: none;
          position: absolute;
          right: -2px;
          top: 0;
          width: 4px;
        }
        .prose-tiptap .tableWrapper { overflow-x: auto; }
      `}</style>
    </div>
  );
}

function Toolbar({
  editor,
  onPickImage,
  onLink,
}: {
  editor: Editor;
  onPickImage: () => void;
  onLink: () => void;
}) {
  return (
    <>
      <ToolbarText
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        label="H1"
      />
      <ToolbarText
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        label="H2"
      />
      <ToolbarText
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        label="H3"
      />
      <ToolbarText
        active={editor.isActive("heading", { level: 4 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        label="H4"
      />
      <ToolbarText
        active={editor.isActive("paragraph")}
        onClick={() => editor.chain().focus().setParagraph().run()}
        label="P"
      />

      <Divider />

      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        icon="format_bold"
        label="Bold"
      />
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        icon="format_italic"
        label="Italic"
      />
      <ToolbarButton
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        icon="format_underlined"
        label="Underline"
      />
      <ToolbarButton
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        icon="strikethrough_s"
        label="Strikethrough"
      />

      <Divider />

      <ToolbarButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        icon="format_list_bulleted"
        label="Bulleted list"
      />
      <ToolbarButton
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        icon="format_list_numbered"
        label="Numbered list"
      />
      <ToolbarButton
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        icon="format_quote"
        label="Quote"
      />

      <Divider />

      <ToolbarButton
        active={editor.isActive("link")}
        onClick={onLink}
        icon="link"
        label="Link"
      />
      <ToolbarButton onClick={onPickImage} icon="image" label="Insert image" />
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        icon="horizontal_rule"
        label="Divider"
      />

      <Divider />

      <ToolbarButton
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        icon="grid_on"
        label="Insert table"
      />
      <ToolbarButton
        disabled={!editor.can().addRowAfter()}
        onClick={() => editor.chain().focus().addRowAfter().run()}
        icon="add_row_below"
        label="Add row below"
      />
      <ToolbarButton
        disabled={!editor.can().addColumnAfter()}
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        icon="add_column_right"
        label="Add column right"
      />
      <ToolbarButton
        disabled={!editor.can().deleteRow()}
        onClick={() => editor.chain().focus().deleteRow().run()}
        icon="delete_sweep"
        label="Delete row"
      />
      <ToolbarButton
        disabled={!editor.can().deleteColumn()}
        onClick={() => editor.chain().focus().deleteColumn().run()}
        icon="splitscreen_vertical_add"
        label="Delete column"
      />
      <ToolbarButton
        disabled={!editor.can().deleteTable()}
        onClick={() => editor.chain().focus().deleteTable().run()}
        icon="grid_off"
        label="Delete table"
      />

      <Divider />

      <ToolbarButton
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
        icon="undo"
        label="Undo"
      />
      <ToolbarButton
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
        icon="redo"
        label="Redo"
      />
    </>
  );
}
