"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelLeft } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";

import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { useEmailStore } from '@/store/email-store';
import { ElementType } from '@/types/email-builder';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Toaster } from 'sonner';
import { Sidebar } from './editor/Sidebar';
import { Canvas } from './editor/Canvas';
import { Header } from './editor/Header';
import { CodeView } from './editor/CodeView';
import { PreviewView } from './editor/PreviewView';
import { PropertiesPanel } from './editor/PropertiesPanel';

interface EmailBuilderProps {
    isWizardMode?: boolean;
}

export default function EmailBuilder({ isWizardMode = false }: EmailBuilderProps) {
    const { toggleAutomateSidebar } = useSidebar();
    const { addElement, moveElement } = useEmailStore();
    const [viewMode, setViewMode] = useState<'editor' | 'code' | 'preview'>('editor');
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeType, setActiveType] = useState<ElementType | null>(null);

    // Enable keyboard shortcuts
    useKeyboardShortcuts();

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        if (event.active.data.current?.isSidebar) {
            setActiveType(event.active.data.current?.type as ElementType);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveId(null);
        setActiveType(null);

        if (!over) return;

        // If dropping sidebar item
        if (active.data.current?.isSidebar) {
            const type = active.data.current?.type as ElementType;
            if (type) {
                // If dropped over a column, add to that column
                if (over.data.current?.isColumn) {
                    addElement(type, over.id as string);
                } else {
                    // Default to root (canvas-root or anywhere else)
                    addElement(type);
                }
            }
            return;
        }

        // If sorting items
        if (active.id !== over.id) {
            moveElement(active.id as string, over.id as string);
        }
    };

    const renderDragOverlay = () => {
        if (!activeType) return null;

        const overlayStyles: Record<string, { icon: string; label: string }> = {
            text: { icon: '📝', label: 'Text' },
            image: { icon: '🖼️', label: 'Image' },
            button: { icon: '🔘', label: 'Button' },
            divider: { icon: '➖', label: 'Divider' },
            spacer: { icon: '⬜', label: 'Spacer' },
            html: { icon: '💻', label: 'HTML' },
            'layout-1': { icon: '▭', label: '1 Column' },
            'layout-2': { icon: '▯', label: '2 Columns' },
            'layout-3': { icon: '☰', label: '3 Columns' },
        };

        const item = overlayStyles[activeType] || { icon: '📦', label: 'Block' };

        return (
            <div className="bg-popover border-2 border-primary rounded-lg shadow-2xl p-4 opacity-90 cursor-grabbing">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-medium text-foreground">{item.label}</span>
                </div>
            </div>
        );
    };
    return (
        <div className={`flex h-full w-full overflow-hidden bg-background ${!isWizardMode ? 'rounded-lg border' : ''}`}>
            <Toaster position="bottom-right" richColors />
            <div className="flex flex-1 flex-col w-full">
                <Header viewMode={viewMode} setViewMode={setViewMode} isWizardMode={isWizardMode} />

                <div className="flex-1 flex overflow-hidden h-full w-full">
                    {viewMode === 'editor' && (
                        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                            <Sidebar />
                            <Canvas />
                            <PropertiesPanel />
                            <DragOverlay dropAnimation={null}>
                                {renderDragOverlay()}
                            </DragOverlay>
                        </DndContext>
                    )}

                    {viewMode === 'code' && <CodeView />}

                    {viewMode === 'preview' && <PreviewView />}
                </div>
            </div>
        </div>
    );
}
