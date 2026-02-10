"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  List,
  ListOrdered,
  LinkIcon,
  ImageIcon,
  Code,
  Palette,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import "./tiptap-editor.css";

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export default function TipTapEditor({ content, onChange }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Color,
      TextStyle,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const { url } = await response.json();
      editor.chain().focus().setImage({ src: url }).run();
    } catch (error) {
      alert("Failed to upload image: " + (error as Error).message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="border-b border-border p-3 bg-card overflow-x-auto">
        <div className="flex gap-1 flex-wrap">
          <Button
            size="sm"
            variant={editor.isActive("bold") ? "default" : "ghost"}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant={editor.isActive("italic") ? "default" : "ghost"}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant={editor.isActive("underline") ? "default" : "ghost"}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <Underline className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant={editor.isActive("strike") ? "default" : "ghost"}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="w-4 h-4" />
          </Button>

          <div className="w-px bg-border mx-1" />

          <Button
            size="sm"
            variant={
              editor.isActive("heading", { level: 2 }) ? "default" : "ghost"
            }
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2 className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant={editor.isActive("bulletList") ? "default" : "ghost"}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant={editor.isActive("orderedList") ? "default" : "ghost"}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>

          <div className="w-px bg-border mx-1" />

          <Button
            size="sm"
            variant={editor.isActive("link") ? "default" : "ghost"}
            onClick={() => {
              const url = prompt("Enter URL:");
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
          >
            <LinkIcon className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.onchange = (e) => {
                handleImageUpload(e as any);
              };
              input.click();
            }}
          >
            <ImageIcon className="w-4 h-4" />
          </Button>

          <input
            type="color"
            onChange={(e) => {
              editor.chain().focus().setColor(e.target.value).run();
            }}
            className="w-8 h-8 rounded cursor-pointer border border-border"
            title="Text color"
          />

          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().clearNodes().run()}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto p-4">
        <div className="prose prose-invert max-w-7xl mx-auto">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
