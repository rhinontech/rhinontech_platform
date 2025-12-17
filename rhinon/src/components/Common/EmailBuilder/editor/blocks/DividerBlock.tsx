import React from 'react';
import { EmailElement } from '@/types/email-builder';

export const DividerBlock = ({ element }: { element: EmailElement }) => {
    const { style } = element.props;

    return (
        <div style={{ padding: '10px 0' }}>
            <hr
                style={{
                    borderTop: `1px solid ${style?.color || '#cccccc'}`,
                    margin: 0,
                    ...style,
                }}
            />
        </div>
    );
};
