import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, Link as LinkIcon, Code } from "lucide-react";
import type { SpotFormData } from "@/types/admin";
import "@/styles/editor.css";

interface Props {
  name: "description" | "tips";
  label: string;
  placeholder?: string;
}

/** A small TipTap field shared by the spot form's "Why we love it" and "Tips from a local" sections. */
export default function RichTextField({ name, label, placeholder }: Props) {
  const { watch, setValue } = useFormContext<SpotFormData>();
  const value = watch(name) ?? "";
  const [isHtml, setIsHtml] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder ?? `Write ${label.toLowerCase()}...` }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      setValue(name, editor.getHTML());
    },
  });

  if (!editor) return null;

  const toggleHtml = () => {
    if (isHtml) editor.commands.setContent(value);
    setIsHtml(!isHtml);
  };

  const addLink = () => {
    const url = window.prompt("URL:");
    if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const btnCls = (active: boolean) =>
    `rounded p-1.5 transition-colors ${active ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100"}`;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-primary">{label}</h2>

      <div className="mb-2 flex flex-wrap items-center gap-1 border-b border-gray-200 pb-2">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnCls(editor.isActive("bold"))}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnCls(editor.isActive("italic"))}>
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnCls(editor.isActive("bulletList"))}>
          <List className="h-4 w-4" />
        </button>
        <button type="button" onClick={addLink} className={btnCls(editor.isActive("link"))}>
          <LinkIcon className="h-4 w-4" />
        </button>
        <div className="ml-auto">
          <button type="button" onClick={toggleHtml} className={btnCls(isHtml)}>
            <Code className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isHtml ? (
        <textarea
          value={value}
          onChange={(e) => setValue(name, e.target.value)}
          rows={8}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
        />
      ) : (
        <EditorContent editor={editor} className="tiptap prose prose-sm max-w-none" />
      )}
    </section>
  );
}
