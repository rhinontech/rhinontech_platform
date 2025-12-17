import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { EmailElement } from '@/types/email-builder';
import { useEmailStore } from '@/store/email-store';
import { cn } from '@/lib/utils';
import { Trash2, GripVertical } from 'lucide-react';
import { BlockRenderer } from './blocks/BlockRenderer';
import { ElementContextMenu } from './ElementContextMenu';

interface SortableElementProps {
    element: EmailElement;
}

export const SortableElement = ({ element }: SortableElementProps) => {
    const { selectedElementId, setSelectedElement, removeElement } = useEmailStore();
    const isSelected = selectedElementId === element.id;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: element.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <ElementContextMenu element={element}>
            <div
                ref={setNodeRef}
                style={style}
                onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElement(element.id);
                }}
                className={cn(
                    "relative group mb-2 rounded-lg border-2 transition-all duration-200 cursor-pointer",
                    isSelected
                        ? "border-blue-500 shadow-lg ring-2 ring-blue-200"
                        : "border-transparent hover:border-gray-300 hover:shadow-md",
                    isDragging && "opacity-50 scale-95"
                )}
            >
                <div className="relative">
                    <BlockRenderer element={element} />

                    {/* Drag handle */}
                    <div
                        {...attributes}
                        {...listeners}
                        className={cn(
                            "absolute left-2 top-2 p-1 bg-white border border-gray-300 rounded shadow-sm cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                            isSelected && "opacity-100"
                        )}
                        title="Drag to reorder"
                    >
                        <GripVertical className="w-4 h-4 text-gray-600" />
                    </div>

                    {/* Action buttons */}
                    <div
                        className={cn(
                            "absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                            isSelected && "opacity-100"
                        )}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                removeElement(element.id);
                            }}
                            className="p-1.5 bg-white border border-gray-300 rounded shadow-sm hover:bg-red-50 hover:border-red-400 transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </button>
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg"></div>
                    )}
                </div>
            </div>
        </ElementContextMenu>
    );
};
