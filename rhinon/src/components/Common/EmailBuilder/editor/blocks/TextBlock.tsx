import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { EmailElement } from '@/types/email-builder';
import { useEmailStore } from '@/store/email-store';

export const TextBlock = ({ element }: { element: EmailElement }) => {
    const { updateElement, selectedElementId } = useEmailStore();
    const isSelected = selectedElementId === element.id;

    const editor = useEditor({
        extensions: [StarterKit],
        content: element.props.content || '<p>Edit this text...</p>',
        immediatelyRender: false, // Fix SSR hydration mismatch
        onUpdate: ({ editor }) => {
            updateElement(element.id, {
                props: { ...element.props, content: editor.getHTML() },
            });
        },
        editable: isSelected, // Only editable when selected
        editorProps: {
            attributes: {
                class: 'prose prose-sm focus:outline-none max-w-none',
                style: `
          padding-top: ${element.props.style?.paddingTop || '0'};
          padding-bottom: ${element.props.style?.paddingBottom || '0'};
          padding-left: ${element.props.style?.paddingLeft || '0'};
          padding-right: ${element.props.style?.paddingRight || '0'};
          color: ${element.props.style?.color || 'inherit'};
          font-size: ${element.props.style?.fontSize || 'inherit'};
          text-align: ${element.props.style?.textAlign || 'left'};
        `,
            },
        },
    });

    useEffect(() => {
        if (editor && element.props.content && editor.getHTML() !== element.props.content) {
            // Avoid infinite loop if content matches
            // editor.commands.setContent(element.props.content);
        }
    }, [element.props.content, editor]);

    useEffect(() => {
        if (editor) {
            editor.setEditable(isSelected);
        }
    }, [isSelected, editor]);

    return <EditorContent editor={editor} />;
};
