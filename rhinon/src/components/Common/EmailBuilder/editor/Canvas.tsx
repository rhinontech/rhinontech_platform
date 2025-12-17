import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useEmailStore } from '@/store/email-store';
import { cn } from '@/lib/utils';
import { SortableElement } from './SortableElement';

export const Canvas = () => {
    const { template } = useEmailStore();
    const { setNodeRef, isOver } = useDroppable({
        id: 'canvas-root',
    });

    const globalStyles = template.globalStyles || {};

    return (
        <div
            className="flex-1 p-8 overflow-y-auto flex justify-center"
            style={{
                backgroundColor: globalStyles.backgroundColor || '#f4f4f4',
                backgroundImage: globalStyles.backgroundImage ? `url(${globalStyles.backgroundImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div
                ref={setNodeRef}
                className={cn(
                    "min-h-[800px] h-fit shadow-xl transition-colors mb-8",
                    isOver && "bg-primary/10 ring-2 ring-primary ring-opacity-50"
                )}
                style={{
                    backgroundColor: globalStyles.contentBackgroundColor || '#ffffff',
                    width: globalStyles.contentWidth || '600px',
                    fontFamily: globalStyles.fontFamily || 'Arial, sans-serif',
                    fontSize: globalStyles.fontSize,
                    color: globalStyles.textColor || '#000000',
                    lineHeight: globalStyles.lineHeight,
                    paddingTop: globalStyles.paddingTop,
                    paddingBottom: globalStyles.paddingBottom,
                }}
            >
                {template.elements.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                        <p>Drag components here</p>
                    </div>
                ) : (
                    <div className="p-4">
                        <SortableContext
                            items={template.elements.map(el => el.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {template.elements.map((el) => (
                                <SortableElement key={el.id} element={el} />
                            ))}
                        </SortableContext>
                    </div>
                )}
            </div>
        </div>
    );
};
