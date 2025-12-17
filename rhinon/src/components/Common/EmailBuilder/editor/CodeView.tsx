import React from 'react';
import Editor from '@monaco-editor/react';
import { useEmailStore } from '@/store/email-store';
import { generateHtml } from '@/lib/html-generator';

export const CodeView = () => {
    const { template } = useEmailStore();
    const html = generateHtml(template);

    return (
        <div className="flex-1 h-full bg-background">
            <Editor
                height="100%"
                defaultLanguage="html"
                value={html}
                theme="vs-dark"
                options={{
                    readOnly: true, // Making it read-only for now as bi-directional sync is complex
                    minimap: { enabled: false },
                    fontSize: 14,
                }}
            />
        </div>
    );
};
