import React from 'react';
import { EmailElement } from '@/types/email-builder';

export const SpacerBlock = ({ element }: { element: EmailElement }) => {
    const { style } = element.props;

    return (
        <div
            style={{
                height: style?.height || '20px',
                backgroundColor: style?.backgroundColor || 'transparent',
            }}
        />
    );
};
