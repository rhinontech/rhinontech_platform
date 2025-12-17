"use client";
import { EditorContent } from "@tiptap/react";
import { TipTapFloatingMenu } from "@/components/Common/tiptap/extensions/floating-menu";
import { FloatingToolbar } from "@/components/Common/tiptap/extensions/floating-toolbar";
import type { Editor } from "@tiptap/core";

export function RichTextEditorDemo({ editor }: { editor: Editor | null }) {

  if (!editor) return null;

  return (
    <div>
      <FloatingToolbar editor={editor} />
      <TipTapFloatingMenu editor={editor} />
      <EditorContent
        editor={editor}
        className=" min-h-[600px] w-full min-w-full cursor-text sm:p-6"
      />
    </div>
  );
}
