import React, { useState } from 'react';
import { useEmailStore } from '@/store/email-store';
import { generateHtml } from '@/lib/html-generator';
import { Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const PreviewView = () => {
    const { template } = useEmailStore();
    const html = generateHtml(template);
    const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

    return (
        <div className="flex-1 flex flex-col h-full bg-muted/30">
            <div className="flex justify-center p-4 gap-2 bg-background border-b border-border">
                <Button
                    variant={device === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDevice('desktop')}
                >
                    <Monitor className="w-4 h-4 mr-2" />
                    Desktop
                </Button>
                <Button
                    variant={device === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDevice('mobile')}
                >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Mobile
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 flex justify-center">
                <div
                    className="bg-white shadow-xl transition-all duration-300"
                    style={{
                        width: device === 'mobile' ? '375px' : '800px', // Mobile width vs Desktop width
                        minHeight: '400px',
                    }}
                >
                    <iframe
                        srcDoc={html}
                        title="Email Preview"
                        className="w-full h-full border-none"
                        style={{ minHeight: '800px' }}
                    />
                </div>
            </div>
        </div>
    );
};
