import React from 'react';
import { EmailElement } from '@/types/email-builder';
import { useEmailStore } from '@/store/email-store';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail, Globe } from 'lucide-react';

interface SocialIconsBlockProps {
    element: EmailElement;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    facebook: Facebook,
    twitter: Twitter,
    instagram: Instagram,
    linkedin: Linkedin,
    youtube: Youtube,
    email: Mail,
    website: Globe,
};

export const SocialIconsBlock = ({ element }: SocialIconsBlockProps) => {
    const { selectedElementId } = useEmailStore();
    const isSelected = selectedElementId === element.id;
    const style = element.props.style || {};

    const icons = element.props.icons || [
        { type: 'facebook', url: 'https://facebook.com' },
        { type: 'twitter', url: 'https://twitter.com' },
        { type: 'instagram', url: 'https://instagram.com' },
    ];

    const iconSize = style.iconSize || '32px';
    const iconColor = style.iconColor || '#666666';
    const iconSpacing = style.iconSpacing || '12px';

    return (
        <div
            style={{
                textAlign: style.textAlign || 'center',
                padding: style.padding || '20px',
                backgroundColor: style.backgroundColor,
            }}
        >
            <div style={{ display: 'inline-flex', gap: iconSpacing, alignItems: 'center' }}>
                {icons.map((icon: any, index: number) => {
                    const IconComponent = iconMap[icon.type];
                    if (!IconComponent) return null;

                    return (
                        <a
                            key={index}
                            href={icon.url || '#'}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: iconSize,
                                height: iconSize,
                                borderRadius: style.borderRadius || '50%',
                                backgroundColor: icon.backgroundColor || 'transparent',
                                border: style.border || 'none',
                                textDecoration: 'none',
                                transition: 'all 0.2s',
                            }}
                        >
                            <div style={{ width: '100%', height: '100%', padding: '6px', color: icon.color || iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconComponent />
                            </div>
                        </a>
                    );
                })}
            </div>
        </div>
    );
};
