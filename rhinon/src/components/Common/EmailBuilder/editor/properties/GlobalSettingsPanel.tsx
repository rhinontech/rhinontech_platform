import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useEmailStore } from '@/store/email-store';

export const GlobalSettingsPanel = () => {
    const { template, updateGlobalStyle } = useEmailStore();
    const globalStyles = template.globalStyles || {};

    const handleChange = (key: string, value: string) => {
        updateGlobalStyle({ [key]: value });
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-sm font-medium border-b pb-2">Background</h3>

                <div className="space-y-2">
                    <Label>Background Color</Label>
                    <div className="flex gap-2">
                        <Input
                            type="color"
                            value={globalStyles.backgroundColor || '#f4f4f4'}
                            onChange={(e) => handleChange('backgroundColor', e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                            value={globalStyles.backgroundColor || ''}
                            onChange={(e) => handleChange('backgroundColor', e.target.value)}
                            placeholder="#f4f4f4"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Background Image URL</Label>
                    <Input
                        value={globalStyles.backgroundImage || ''}
                        onChange={(e) => handleChange('backgroundImage', e.target.value)}
                        placeholder="https://example.com/bg.jpg"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Content Background Color</Label>
                    <div className="flex gap-2">
                        <Input
                            type="color"
                            value={globalStyles.contentBackgroundColor || '#ffffff'}
                            onChange={(e) => handleChange('contentBackgroundColor', e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                            value={globalStyles.contentBackgroundColor || ''}
                            onChange={(e) => handleChange('contentBackgroundColor', e.target.value)}
                            placeholder="#ffffff"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-medium border-b pb-2">Typography</h3>

                <div className="space-y-2">
                    <Label>Font Family</Label>
                    <Input
                        value={globalStyles.fontFamily || ''}
                        onChange={(e) => handleChange('fontFamily', e.target.value)}
                        placeholder="Arial, sans-serif"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Font Size</Label>
                    <Input
                        value={globalStyles.fontSize || ''}
                        onChange={(e) => handleChange('fontSize', e.target.value)}
                        placeholder="14px"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Text Color</Label>
                    <div className="flex gap-2">
                        <Input
                            type="color"
                            value={globalStyles.textColor || '#000000'}
                            onChange={(e) => handleChange('textColor', e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                            value={globalStyles.textColor || ''}
                            onChange={(e) => handleChange('textColor', e.target.value)}
                            placeholder="#000000"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Line Height</Label>
                    <Input
                        value={globalStyles.lineHeight || ''}
                        onChange={(e) => handleChange('lineHeight', e.target.value)}
                        placeholder="1.5"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-medium border-b pb-2">Layout</h3>

                <div className="space-y-2">
                    <Label>Content Width</Label>
                    <Input
                        value={globalStyles.contentWidth || ''}
                        onChange={(e) => handleChange('contentWidth', e.target.value)}
                        placeholder="600px"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Padding Top</Label>
                    <Input
                        value={globalStyles.paddingTop || ''}
                        onChange={(e) => handleChange('paddingTop', e.target.value)}
                        placeholder="20px"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Padding Bottom</Label>
                    <Input
                        value={globalStyles.paddingBottom || ''}
                        onChange={(e) => handleChange('paddingBottom', e.target.value)}
                        placeholder="20px"
                    />
                </div>
            </div>
        </div>
    );
};
