import React from 'react';
import { useEmailStore } from '@/store/email-store';
import { PropertiesForm } from './properties/PropertiesForm';

export const PropertiesPanel = () => {
    const { selectedElementId, template } = useEmailStore();

    // Recursive search for selected element
    const findElement = (elements: any[], id: string): any | undefined => {
        for (const el of elements) {
            if (el.id === id) return el;
            if (el.children) {
                const found = findElement(el.children, id);
                if (found) return found;
            }
        }
        return undefined;
    };

    const selectedElement = selectedElementId ? findElement(template.elements, selectedElementId) : undefined;

    return (
        <div className="w-80 bg-background border-l border-border h-full overflow-y-auto px-6 py-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Element Properties</h2>
            {selectedElement ? (
                <div>
                    <p className="text-xs font-medium text-muted-foreground mb-4 uppercase">{selectedElement.type}</p>
                    <PropertiesForm element={selectedElement} />
                </div>
            ) : (
                <div className="text-sm text-muted-foreground text-center mt-10">
                    Select an element to edit its properties
                </div>
            )}
        </div>
    );
};
