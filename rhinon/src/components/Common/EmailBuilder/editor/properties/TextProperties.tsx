import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useEmailStore } from '@/store/email-store';
import { Textarea } from '@/components/ui/textarea';

export const TextProperties = () => {
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

    if (!element || element.type !== 'text') return null;

    const style = element.props.style || {};
    const content = element.props.content || '';

    const handleUpdate = (field: string, value: any) => {
        if (field === 'content') {
            updateElement(element.id, {
                props: { ...element.props, content: value },
            });
        } else {
            updateElement(element.id, {
                props: {
                    ...element.props,
                    style: { ...style, [field]: value },
                },
            });
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <Label>Text Content</Label>
                <Textarea
                    value={content}
                    onChange={(e) => handleUpdate('content', e.target.value)}
                    placeholder="Enter your text here..."
                    className="mt-1"
                    rows={4}
                />
            </div>

            <div>
                <Label>Font Size</Label>
                <Input
                    type="text"
                    value={style.fontSize || '16px'}
                    onChange={(e) => handleUpdate('fontSize', e.target.value)}
                    placeholder="16px"
                    className="mt-1"
                />
            </div>

            <div>
                <Label>Text Color</Label>
                <div className="flex gap-2 mt-1">
                    <Input
                        type="color"
                        value={style.color || '#000000'}
                        onChange={(e) => handleUpdate('color', e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                        type="text"
                        value={style.color || '#000000'}
                        onChange={(e) => handleUpdate('color', e.target.value)}
                        placeholder="#000000"
                    />
                </div>
            </div>

            <div>
                <Label>Text Align</Label>
                <select
                    value={style.textAlign || 'left'}
                    onChange={(e) => handleUpdate('textAlign', e.target.value)}
                    className="w-full mt-1 p-2 border rounded"
                >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                    <option value="justify">Justify</option>
                </select>
            </div>

            <div>
                <Label>Line Height</Label>
                <Input
                    type="text"
                    value={style.lineHeight || '1.5'}
                    onChange={(e) => handleUpdate('lineHeight', e.target.value)}
                    placeholder="1.5"
                    className="mt-1"
                />
            </div>
        </div>
    );
};
