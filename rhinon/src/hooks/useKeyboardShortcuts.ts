import { useEffect } from 'react';
import { useEmailStore } from '@/store/email-store';
import { toast } from 'sonner';

export const useKeyboardShortcuts = () => {
    const { selectedElementId, removeElement, undo, redo, canUndo, canRedo } = useEmailStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if user is typing in an input, textarea, or contenteditable element
            const target = e.target as HTMLElement;
            const isTyping =
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable ||
                target.getAttribute('contenteditable') === 'true';

            // Undo: Ctrl+Z or Cmd+Z
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (canUndo) {
                    undo();
                    toast.success('Undone');
                }
                return;
            }

            // Redo: Ctrl+Y or Cmd+Shift+Z
            if (((e.ctrlKey || e.metaKey) && e.key === 'y') ||
                ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
                e.preventDefault();
                if (canRedo) {
                    redo();
                    toast.success('Redone');
                }
                return;
            }

            // Delete: Delete or Backspace (only if not typing)
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId && !isTyping) {
                e.preventDefault();
                removeElement(selectedElementId);
                toast.success('Element deleted');
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedElementId, removeElement, undo, redo, canUndo, canRedo]);
};
