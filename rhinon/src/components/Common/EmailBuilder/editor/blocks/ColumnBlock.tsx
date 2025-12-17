import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { EmailElement } from '@/types/email-builder';
import { cn } from '@/lib/utils';
import { SortableElement } from '../SortableElement';

export const ColumnBlock = ({ element }: { element: EmailElement }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: element.id,
        data: {
            isColumn: true,
        },
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex-1 min-h-[50px] p-2 border border-dashed border-gray-200 transition-colors",
                isOver && "bg-blue-50 border-blue-300"
            )}
            style={{
                padding: element.props.style?.padding || '10px',
            }}
        >
            {element.children && element.children.length > 0 ? (
                <SortableContext
                    items={element.children.map((child) => child.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {element.children.map((child) => (
                        <SortableElement key={child.id} element={child} />
                    ))}
                </SortableContext>
            ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-400 min-h-[40px]">
                    Drop here
                </div>
            )}
        </div>
    );
};
