import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Code, Eye, Layout, Undo2, Redo2 } from 'lucide-react';
import { useEmailStore } from '@/store/email-store';
import { generateHtml } from '@/lib/html-generator';
import { TemplateModal } from './TemplateModal';

interface HeaderProps {
    viewMode: 'editor' | 'code' | 'preview';
    setViewMode: (mode: 'editor' | 'code' | 'preview') => void;
    isWizardMode?: boolean;
}

export const Header = ({ viewMode, setViewMode, isWizardMode = false }: HeaderProps) => {
    const { template, undo, redo, canUndo, canRedo } = useEmailStore();

    const handleExport = () => {
        const html = generateHtml(template);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'email-template.html';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className={`h-16 border-b border-border bg-background flex items-center justify-between px-4 ${isWizardMode ? 'border-t' : ''}`}>
            <div className="flex items-center gap-2">
                {!isWizardMode && (
                    <>
                        <h1 className="text-xl font-bold text-foreground">Email Builder</h1>
                        <span className="text-sm text-muted-foreground ml-2">{template.name}</span>
                    </>
                )}
            </div>

            <div className="flex items-center gap-2 w-full justify-end">
                <div className="flex gap-1 mr-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={undo}
                        disabled={!canUndo}
                        className="gap-1"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo2 className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={redo}
                        disabled={!canRedo}
                        className="gap-1"
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo2 className="w-4 h-4" />
                    </Button>
                </div>

                <TemplateModal />

                <div className="flex bg-muted rounded-lg p-1 mr-4">
                    <Button
                        variant={viewMode === 'editor' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('editor')}
                        className="gap-2"
                    >
                        <Layout className="w-4 h-4" />
                        Editor
                    </Button>
                    <Button
                        variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('preview')}
                        className="gap-2"
                    >
                        <Eye className="w-4 h-4" />
                        Preview
                    </Button>
                    <Button
                        variant={viewMode === 'code' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('code')}
                        className="gap-2"
                    >
                        <Code className="w-4 h-4" />
                        Code
                    </Button>
                </div>

                {!isWizardMode && (
                    <Button onClick={handleExport} className="gap-2">
                        <Download className="w-4 h-4" />
                        Export HTML
                    </Button>
                )}
            </div>
        </div>
    );
};
