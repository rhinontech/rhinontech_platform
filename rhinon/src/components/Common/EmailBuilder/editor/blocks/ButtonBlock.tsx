import React from 'react';
import { EmailElement } from '@/types/email-builder';

export const ButtonBlock = ({ element }: { element: EmailElement }) => {
    const { text, url, style } = element.props;

    return (
        <div style={{ textAlign: style?.textAlign || 'center', padding: '10px' }}>
            <a
                href={url || '#'}
                style={{
                    display: 'inline-block',
                    backgroundColor: style?.backgroundColor || '#000000',
                    color: style?.color || '#ffffff',
                    padding: style?.padding || '10px 20px',
                    borderRadius: style?.borderRadius || '4px',
                    textDecoration: 'none',
                    fontWeight: style?.fontWeight || 'bold',
                    fontSize: style?.fontSize || '16px',
                    ...style,
                }}
                onClick={(e) => e.preventDefault()} // Prevent navigation in editor
            >
                {text || 'Click Me'}
            </a>
        </div>
    );
};
