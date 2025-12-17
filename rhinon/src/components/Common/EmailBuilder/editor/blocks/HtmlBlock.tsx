import React from 'react';
import { EmailElement } from '@/types/email-builder';

export const HtmlBlock = ({ element }: { element: EmailElement }) => {
    const { content } = element.props;

    if (!content) {
        return (
            <div className="p-4 bg-gray-50 text-gray-400 text-sm font-mono border border-dashed border-gray-300">
                &lt;!-- HTML Block --&gt;
            </div>
        );
    }

    return <div dangerouslySetInnerHTML={{ __html: content }} />;
};
