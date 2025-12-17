import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmailElement } from '@/types/email-builder';
import { useEmailStore } from '@/store/email-store';

export const StyleControls = ({ element }: { element: EmailElement }) => {
    const { updateElement } = useEmailStore();
    const style = element.props.style || {};

    const handleStyleChange = (key: string, value: string) => {
        updateElement(element.id, {
            props: {
                ...element.props,
                style: {
                    ...style,
                    [key]: value,
                },
            },
        });
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Padding</Label>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <Label className="text-xs text-gray-500">Top</Label>
                        <Input
                            value={style.paddingTop || ''}
                            onChange={(e) => handleStyleChange('paddingTop', e.target.value)}
                            placeholder="0px"
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-gray-500">Bottom</Label>
                        <Input
                            value={style.paddingBottom || ''}
                            onChange={(e) => handleStyleChange('paddingBottom', e.target.value)}
                            placeholder="0px"
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-gray-500">Left</Label>
                        <Input
                            value={style.paddingLeft || ''}
                            onChange={(e) => handleStyleChange('paddingLeft', e.target.value)}
                            placeholder="0px"
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-gray-500">Right</Label>
                        <Input
                            value={style.paddingRight || ''}
                            onChange={(e) => handleStyleChange('paddingRight', e.target.value)}
                            placeholder="0px"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex gap-2">
                    <Input
                        type="color"
                        value={style.backgroundColor || '#ffffff'}
                        onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                        value={style.backgroundColor || ''}
                        onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                        placeholder="#ffffff"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Text Align</Label>
                <Select
                    value={style.textAlign || 'left'}
                    onValueChange={(value) => handleStyleChange('textAlign', value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select alignment" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                        <SelectItem value="justify">Justify</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};
