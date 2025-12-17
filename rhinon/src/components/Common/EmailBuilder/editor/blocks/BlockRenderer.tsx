import React from 'react';
import { EmailElement } from '@/types/email-builder';
import { TextBlock } from './TextBlock';
import { ImageBlock } from './ImageBlock';
import { ButtonBlock } from './ButtonBlock';
import { DividerBlock } from './DividerBlock';
import { SpacerBlock } from './SpacerBlock';

import { HtmlBlock } from './HtmlBlock';

import { LayoutBlock } from './LayoutBlock';
import { ColumnBlock } from './ColumnBlock';
import { SocialIconsBlock } from './SocialIconsBlock';
import { VideoBlock } from './VideoBlock';

interface BlockRendererProps {
    element: EmailElement;
}

export const BlockRenderer = ({ element }: BlockRendererProps) => {
    switch (element.type) {
        case 'text':
            return <TextBlock element={element} />;
        case 'image':
            return <ImageBlock element={element} />;
        case 'button':
            return <ButtonBlock element={element} />;
        case 'divider':
            return <DividerBlock element={element} />;
        case 'spacer':
            return <SpacerBlock element={element} />;
        case 'html':
            return <HtmlBlock element={element} />;
        case 'social':
            return <SocialIconsBlock element={element} />;
        case 'video':
            return <VideoBlock element={element} />;
        case 'column':
            return <ColumnBlock element={element} />;
        default:
            if (element.type.startsWith('layout-')) {
                return <LayoutBlock element={element} />;
            }
            return <div>Unknown block type: {element.type}</div>;
    }
};
