import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEmailStore } from '@/store/email-store';
import { Plus, Trash2 } from 'lucide-react';

export const SocialProperties = () => {
    const { selectedElementId, template, updateElement } = useEmailStore();

    const element = template.elements.find((el: any) => {
        const findElement = (elements: any[]): any => {
            for (const e of elements) {
                if (e.id === selectedElementId) return e;
                if (e.children) {
                    const found = findElement(e.children);
                    if (found) return found;
                }
            }
            return null;
        };
        return findElement([el]);
    });

    if (!element || element.type !== 'social') return null;

    const icons = element.props.icons || [
        { type: 'facebook', url: 'https://facebook.com', color: '#1877F2' },
        { type: 'twitter', url: 'https://twitter.com', color: '#1DA1F2' },
        { type: 'instagram', url: 'https://instagram.com', color: '#E4405F' },
    ];

    const handleIconUpdate = (index: number, field: string, value: string) => {
        const newIcons = [...icons];
        newIcons[index] = { ...newIcons[index], [field]: value };
        updateElement(element.id, {
            props: { ...element.props, icons: newIcons },
        });
    };

    const handleAddIcon = () => {
        const newIcons = [...icons, { type: 'facebook', url: 'https://facebook.com', color: '#1877F2' }];
        updateElement(element.id, {
            props: { ...element.props, icons: newIcons },
        });
    };

    const handleRemoveIcon = (index: number) => {
        const newIcons = icons.filter((_: any, i: number) => i !== index);
        updateElement(element.id, {
            props: { ...element.props, icons: newIcons },
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label>Social Icons</Label>
                <Button onClick={handleAddIcon} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Icon
                </Button>
            </div>

            {icons.map((icon: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Icon {index + 1}</Label>
                        <Button
                            onClick={() => handleRemoveIcon(index)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                        >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </Button>
                    </div>

                    <div>
                        <Label className="text-xs">Platform</Label>
                        <select
                            value={icon.type}
                            onChange={(e) => handleIconUpdate(index, 'type', e.target.value)}
                            className="w-full mt-1 p-2 border rounded text-sm"
                        >
                            <option value="facebook">Facebook</option>
                            <option value="twitter">Twitter</option>
                            <option value="instagram">Instagram</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="youtube">YouTube</option>
                            <option value="email">Email</option>
                            <option value="website">Website</option>
                        </select>
                    </div>

                    <div>
                        <Label className="text-xs">URL</Label>
                        <Input
                            type="text"
                            value={icon.url || ''}
                            onChange={(e) => handleIconUpdate(index, 'url', e.target.value)}
                            placeholder="https://..."
                            className="mt-1 text-sm"
                        />
                    </div>

                    <div>
                        <Label className="text-xs">Icon Color</Label>
                        <div className="flex gap-2 mt-1">
                            <Input
                                type="color"
                                value={icon.color || '#000000'}
                                onChange={(e) => handleIconUpdate(index, 'color', e.target.value)}
                                className="w-10 h-8 p-1 cursor-pointer"
                            />
                            <Input
                                type="text"
                                value={icon.color || '#000000'}
                                onChange={(e) => handleIconUpdate(index, 'color', e.target.value)}
                                placeholder="#000000"
                                className="text-sm"
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
