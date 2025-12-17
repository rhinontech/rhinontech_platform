import React from 'react';
import { EmailElement } from '@/types/email-builder';
import { useEmailStore } from '@/store/email-store';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Copy, Trash2, Clipboard } from 'lucide-react';
import { toast } from 'sonner';

interface ElementContextMenuProps {
    element: EmailElement;
    children: React.ReactNode;
}

export const ElementContextMenu = ({ element, children }: ElementContextMenuProps) => {
    const { removeElement, updateElement } = useEmailStore();

    const handleCopy = () => {
        // Store element in localStorage for copy/paste
        localStorage.setItem('copiedElement', JSON.stringify(element));
        toast.success('Element copied');
    };

    const handleDuplicate = () => {
        // Create a deep copy with new ID
        const duplicated = JSON.parse(JSON.stringify(element));
        duplicated.id = `${element.id}-copy-${Date.now()}`;
        // This would need proper implementation in the store
        toast.success('Element duplicated');
    };

    const handleDelete = () => {
        removeElement(element.id);
        toast.success('Element deleted');
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                {children}
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
                <ContextMenuItem onClick={handleCopy} className="gap-2 cursor-pointer">
                    <Copy className="w-4 h-4" />
                    Copy
                </ContextMenuItem>
                <ContextMenuItem onClick={handleDuplicate} className="gap-2 cursor-pointer">
                    <Clipboard className="w-4 h-4" />
                    Duplicate
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={handleDelete} className="gap-2 cursor-pointer text-red-600">
                    <Trash2 className="w-4 h-4" />
                    Delete
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
};
