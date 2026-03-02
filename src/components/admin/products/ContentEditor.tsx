import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  Link as LinkIcon,
  ImageIcon,
  Code,
} from "lucide-react";
import type { ProductFormData } from "@/types/admin";
import "@/styles/editor.css";

export default function ContentEditor() {
  const { watch, setValue } = useFormContext<ProductFormData>();
  const content = watch("content") ?? "";
  const [isHtml, setIsHtml] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Write product description..." }),
    ],
    content,
    onUpdate: ({ editor }) => {
      setValue("content", editor.getHTML());
    },
  });

  if (!editor) return null;

  const toggleHtml = () => {
    if (isHtml) {
      editor.commands.setContent(content);
    }
    setIsHtml(!isHtml);
  };

  const addLink = () => {
    const url = window.prompt("URL:");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt("Image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const btnCls = (active: boolean) =>
    `rounded p-1.5 transition-colors ${active ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100"}`;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-primary">Content</h2>

      <div className="mb-2 flex flex-wrap items-center gap-1 border-b border-gray-200 pb-2">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnCls(editor.isActive("bold"))}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnCls(editor.isActive("italic"))}>
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnCls(editor.isActive("heading", { level: 2 }))}>
          <Heading2 className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnCls(editor.isActive("heading", { level: 3 }))}>
          <Heading3 className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnCls(editor.isActive("bulletList"))}>
          <List className="h-4 w-4" />
        </button>
        <button type="button" onClick={addLink} className={btnCls(editor.isActive("link"))}>
          <LinkIcon className="h-4 w-4" />
        </button>
        <button type="button" onClick={addImage} className={btnCls(false)}>
          <ImageIcon className="h-4 w-4" />
        </button>
        <div className="ml-auto">
          <button type="button" onClick={toggleHtml} className={btnCls(isHtml)}>
            <Code className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isHtml ? (
        <textarea
          value={content}
          onChange={(e) => setValue("content", e.target.value)}
          rows={12}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
        />
      ) : (
        <EditorContent editor={editor} className="tiptap prose prose-sm max-w-none" />
      )}
    </section>
  );
}
