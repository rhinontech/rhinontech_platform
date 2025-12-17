import React from 'react';
import { EmailElement } from '@/types/email-builder';
import { useEmailStore } from '@/store/email-store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StyleControls } from './StyleControls';
import { TextProperties } from './TextProperties';
import { SocialProperties } from './SocialProperties';
import { VideoProperties } from './VideoProperties';

export const PropertiesForm = ({ element }: { element: EmailElement }) => {
    const { updateElement } = useEmailStore();

    const handlePropChange = (key: string, value: any) => {
        updateElement(element.id, {
            props: {
                ...element.props,
                [key]: value,
            },
        });
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-sm font-medium border-b pb-2">Content</h3>

                {element.type === 'text' && <TextProperties />}

                {element.type === 'social' && <SocialProperties />}

                {element.type === 'video' && <VideoProperties />}

                {element.type === 'image' && (
                    <>
                        <div className="space-y-2">
                            <Label>Image URL</Label>
                            <Input
                                value={element.props.src || ''}
                                onChange={(e) => handlePropChange('src', e.target.value)}
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Alt Text</Label>
                            <Input
                                value={element.props.alt || ''}
                                onChange={(e) => handlePropChange('alt', e.target.value)}
                                placeholder="Image description"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Width</Label>
                            <Input
                                value={element.props.style?.width || '100%'}
                                onChange={(e) => updateElement(element.id, {
                                    props: { ...element.props, style: { ...element.props.style, width: e.target.value } }
                                })}
                                placeholder="100% or 300px"
                            />
                        </div>
                    </>
                )}

                {element.type === 'button' && (
                    <>
                        <div className="space-y-2">
                            <Label>Button Text</Label>
                            <Input
                                value={element.props.text || ''}
                                onChange={(e) => handlePropChange('text', e.target.value)}
                                placeholder="Click Me"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>URL</Label>
                            <Input
                                value={element.props.url || ''}
                                onChange={(e) => handlePropChange('url', e.target.value)}
                                placeholder="https://example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Text Color</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="color"
                                    value={element.props.style?.color || '#ffffff'}
                                    onChange={(e) => updateElement(element.id, {
                                        props: { ...element.props, style: { ...element.props.style, color: e.target.value } }
                                    })}
                                    className="w-12 h-10 p-1 cursor-pointer"
                                />
                                <Input
                                    value={element.props.style?.color || ''}
                                    onChange={(e) => updateElement(element.id, {
                                        props: { ...element.props, style: { ...element.props.style, color: e.target.value } }
                                    })}
                                    placeholder="#ffffff"
                                />
                            </div>
                        </div>
                    </>
                )}

                {element.type === 'spacer' && (
                    <div className="space-y-2">
                        <Label>Height</Label>
                        <Input
                            value={element.props.style?.height || '20px'}
                            onChange={(e) => updateElement(element.id, {
                                props: { ...element.props, style: { ...element.props.style, height: e.target.value } }
                            })}
                            placeholder="20px"
                        />
                    </div>
                )}

                {element.type === 'html' && (
                    <div className="space-y-2">
                        <Label>HTML Content</Label>
                        <Textarea
                            value={element.props.content || ''}
                            onChange={(e) => handlePropChange('content', e.target.value)}
                            placeholder="<div>Your HTML here</div>"
                            rows={6}
                        />
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-medium border-b pb-2">Styles</h3>
                <StyleControls element={element} />
            </div>
        </div>
    );
};
