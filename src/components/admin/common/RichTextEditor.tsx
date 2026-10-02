import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, Heading2, Link as LinkIcon, Code } from "lucide-react";
import "@/styles/editor.css";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Rows for the raw-HTML textarea. */
  htmlRows?: number;
}

/** A small TipTap editor with a raw-HTML toggle. Shared by the spot form and the newsletter composer. */
export default function RichTextEditor({ value, onChange, placeholder, htmlRows = 8 }: Props) {
  const [isHtml, setIsHtml] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder ?? "Write..." }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
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
    <>
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
          onChange={(e) => onChange(e.target.value)}
          rows={htmlRows}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none"
        />
      ) : (
        <EditorContent editor={editor} className="tiptap prose prose-sm max-w-none" />
      )}
    </>
  );
}
