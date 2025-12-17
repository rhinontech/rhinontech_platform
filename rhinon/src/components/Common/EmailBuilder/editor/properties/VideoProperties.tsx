import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useEmailStore } from '@/store/email-store';

export const VideoProperties = () => {
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

    if (!element || element.type !== 'video') return null;

    const videoUrl = element.props.videoUrl || '';
    const thumbnailUrl = element.props.thumbnailUrl || '';

    const handleUpdate = (field: string, value: string) => {
        updateElement(element.id, {
            props: { ...element.props, [field]: value },
        });
    };

    return (
        <div className="space-y-4">
            <div>
                <Label>Video URL</Label>
                <Input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => handleUpdate('videoUrl', e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Supports YouTube and Vimeo URLs</p>
            </div>

            <div>
                <Label>Thumbnail Image URL</Label>
                <Input
                    type="text"
                    value={thumbnailUrl}
                    onChange={(e) => handleUpdate('thumbnailUrl', e.target.value)}
                    placeholder="https://example.com/thumbnail.jpg"
                    className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Custom thumbnail image (optional)</p>
            </div>

            {thumbnailUrl && (
                <div>
                    <Label>Preview</Label>
                    <img
                        src={thumbnailUrl}
                        alt="Thumbnail preview"
                        className="mt-2 w-full rounded border"
                        style={{ maxHeight: '200px', objectFit: 'cover' }}
                    />
                </div>
            )}
        </div>
    );
};
