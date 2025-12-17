import React from 'react';
import { EmailElement } from '@/types/email-builder';
import { Image as ImageIcon } from 'lucide-react';

export const ImageBlock = ({ element }: { element: EmailElement }) => {
    const { src, alt, style } = element.props;

    if (!src) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg text-gray-400">
                <ImageIcon className="w-12 h-12 mb-2" />
                <span className="text-sm">Select an image</span>
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt || 'Email image'}
            style={{
                width: style?.width || '100%',
                height: style?.height || 'auto',
                borderRadius: style?.borderRadius || '0',
                ...style,
            }}
            className="max-w-full block"
        />
    );
};
