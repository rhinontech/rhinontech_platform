import React from 'react';
import { EmailElement } from '@/types/email-builder';
import { useEmailStore } from '@/store/email-store';
import { ColumnBlock } from './ColumnBlock';

interface LayoutBlockProps {
    element: EmailElement;
}

export const LayoutBlock = ({ element }: LayoutBlockProps) => {
    const { selectedElementId } = useEmailStore();
    const isSelected = selectedElementId === element.id;
    const style = element.props.style || {};

    // Determine column widths based on layout type
    const getColumnWidths = () => {
        switch (element.type) {
            case 'layout-70-30':
                return ['70%', '30%'];
            case 'layout-30-70':
                return ['30%', '70%'];
            case 'layout-60-40':
                return ['60%', '40%'];
            case 'layout-40-60':
                return ['40%', '60%'];
            case 'layout-3':
                return ['33.33%', '33.33%', '33.33%'];
            case 'layout-4':
                return ['25%', '25%', '25%', '25%'];
            default:
                // layout-1 or layout-2
                const colCount = element.children?.length || 1;
                const width = `${100 / colCount}%`;
                return Array(colCount).fill(width);
        }
    };

    const columnWidths = getColumnWidths();

    return (
        <div
            style={{
                display: 'flex',
                width: '100%',
                gap: '8px',
                padding: style.padding || '10px',
                backgroundColor: style.backgroundColor,
            }}
        >
            {element.children?.map((child, index) => (
                <div key={child.id} style={{ width: columnWidths[index], flex: '0 0 auto' }}>
                    <ColumnBlock element={child} />
                </div>
            ))}
        </div>
    );
};
