import { useState, useCallback } from "react";
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
  ListOrdered,
  Link as LinkIcon,
  ImageIcon,
  Code,
  Code2,
  Quote,
  Youtube,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";
import ProductSearchModal from "./ProductSearchModal";
import ImagePicker from "@/components/admin/common/ImagePicker";
import type { BlogFormData } from "@/types/admin";
import type { Product } from "@/types";
import "@/styles/editor.css";

function parseVideoUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/
  );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return null;
}

export default function BlogContentEditor() {
  const { watch, setValue } = useFormContext<BlogFormData>();
  const content = watch("content") ?? "";
  const [isHtml, setIsHtml] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: { HTMLAttributes: { class: "blog-code-block" } },
        blockquote: { HTMLAttributes: { class: "blog-blockquote" } },
      }),
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Write your blog post..." }),
    ],
    content,
    onUpdate: ({ editor: e }) => {
      setValue("content", e.getHTML());
    },
  });

  const insertImage = useCallback(
    (url: string) => {
      editor?.chain().focus().setImage({ src: url }).run();
    },
    [editor]
  );

  const handleVideoEmbed = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("YouTube or Vimeo URL:");
    if (!url) return;
    const embedUrl = parseVideoUrl(url);
    if (!embedUrl) {
      toast.error("Invalid YouTube or Vimeo URL");
      return;
    }
    const iframe = `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:1rem 0"><iframe src="${embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" allowfullscreen></iframe></div>`;
    editor.chain().focus().insertContent(iframe).run();
  }, [editor]);

  const handleProductEmbed = useCallback(
    (product: Product) => {
      if (!editor) return;
      const marker = `<div data-product-id="${product.id}"></div>`;
      editor.chain().focus().insertContent(marker).run();
    },
    [editor]
  );

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("URL:");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }, [editor]);

  const toggleHtml = () => {
    if (!editor) return;
    if (isHtml) {
      editor.commands.setContent(content);
    }
    setIsHtml(!isHtml);
  };

  if (!editor) return null;

  const btnCls = (active: boolean) =>
    `rounded p-1.5 transition-colors ${active ? "bg-primary/10 text-primary" : "text-gray-500 hover:bg-gray-100"}`;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-primary">Content</h2>

      <div className="mb-2 flex flex-wrap items-center gap-1 border-b border-gray-200 pb-2">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnCls(editor.isActive("bold"))} title="Bold">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnCls(editor.isActive("italic"))} title="Italic">
          <Italic className="h-4 w-4" />
        </button>

        <span className="mx-1 h-5 w-px bg-gray-200" />

        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnCls(editor.isActive("heading", { level: 2 }))} title="Heading 2">
          <Heading2 className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnCls(editor.isActive("heading", { level: 3 }))} title="Heading 3">
          <Heading3 className="h-4 w-4" />
        </button>

        <span className="mx-1 h-5 w-px bg-gray-200" />

        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnCls(editor.isActive("bulletList"))} title="Bullet List">
          <List className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnCls(editor.isActive("orderedList"))} title="Ordered List">
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnCls(editor.isActive("blockquote"))} title="Blockquote">
          <Quote className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={btnCls(editor.isActive("codeBlock"))} title="Code Block">
          <Code2 className="h-4 w-4" />
        </button>

        <span className="mx-1 h-5 w-px bg-gray-200" />

        <button type="button" onClick={addLink} className={btnCls(editor.isActive("link"))} title="Link">
          <LinkIcon className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setImageModalOpen(true)} className={btnCls(false)} title="Insert image (search or upload)">
          <ImageIcon className="h-4 w-4" />
        </button>
        <button type="button" onClick={handleVideoEmbed} className={btnCls(false)} title="YouTube / Vimeo">
          <Youtube className="h-4 w-4" />
        </button>
        <button type="button" onClick={() => setProductModalOpen(true)} className={btnCls(false)} title="Embed Product">
          <ShoppingBag className="h-4 w-4" />
        </button>

        <div className="ml-auto">
          <button type="button" onClick={toggleHtml} className={btnCls(isHtml)} title="HTML">
            <Code className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isHtml ? (
        <textarea
          value={content}
          onChange={(e) => setValue("content", e.target.value)}
          rows={20}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
        />
      ) : (
        <EditorContent editor={editor} className="tiptap prose prose-sm max-w-none" />
      )}

      <ProductSearchModal
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onSelect={handleProductEmbed}
      />

      <ImagePicker
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        onSelect={insertImage}
        orientation="landscape"
        title="Insert image"
      />
    </section>
  );
}
