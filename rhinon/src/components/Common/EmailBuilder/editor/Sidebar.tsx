import React from 'react';
import { Type, Image, MousePointerClick, Minus, Square, Code, Share2, Video } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GlobalSettingsPanel } from './properties/GlobalSettingsPanel';

interface DraggableBlockProps {
    type: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
}

const DraggableBlock = ({ type, icon: Icon, label }: DraggableBlockProps) => {
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: `sidebar-${type}`,
        data: { type, isSidebar: true },
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg cursor-grab active:cursor-grabbing hover:border-primary hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
        >
            <Icon className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
    );
};

export const Sidebar = () => {
    const blocks = [
        { type: "text", icon: Type, label: "Text" },
        { type: "image", icon: Image, label: "Image" },
        { type: "button", icon: MousePointerClick, label: "Button" },
        { type: "divider", icon: Minus, label: "Divider" },
        { type: "spacer", icon: Square, label: "Spacer" },
        { type: "social", icon: Share2, label: "Social Icons" },
        { type: "video", icon: Video, label: "Video" },
        { type: "html", icon: Code, label: "HTML" },
    ];

    const layouts = [
        { type: "layout-1", icon: Square, label: "1 Col" },
        { type: "layout-2", icon: Square, label: "2 Cols" },
        { type: "layout-3", icon: Square, label: "3 Cols" },
        { type: "layout-4", icon: Square, label: "4 Cols" },
    ];

    return (
        <div className="w-80 bg-muted/30 border-r border-border h-full overflow-y-auto">
            <Accordion type="single" collapsible defaultValue="components" className="w-full">
                <AccordionItem value="components">
                    <AccordionTrigger className="px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground hover:no-underline">
                        COMPONENTS
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase">Basic Blocks</h3>
                                <div className="space-y-1">
                                    {blocks.map((block) => (
                                        <DraggableBlock
                                            key={block.type}
                                            type={block.type}
                                            icon={block.icon}
                                            label={block.label}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase">Layouts</h3>
                                <div className="space-y-1">
                                    {layouts.map((layout) => (
                                        <DraggableBlock
                                            key={layout.type}
                                            type={layout.type}
                                            icon={layout.icon}
                                            label={layout.label}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="styles">
                    <AccordionTrigger className="px-4 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground hover:no-underline">
                        GLOBAL STYLES
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                        <GlobalSettingsPanel />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
};
