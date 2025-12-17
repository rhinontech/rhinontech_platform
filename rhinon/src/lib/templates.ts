import { EmailTemplate } from '@/types/email-builder';
import { nanoid } from 'nanoid';

export const templates: EmailTemplate[] = [
    {
        id: 'welcome-email',
        name: 'Welcome Email - Modern',
        version: '1.0',
        elements: [
            {
                id: nanoid(),
                type: 'image',
                props: {
                    src: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=400&fit=crop',
                    alt: 'Welcome to our team',
                    style: { width: '100%', height: 'auto', display: 'block' },
                },
            },
            {
                id: nanoid(),
                type: 'spacer',
                props: { style: { height: '40px' } },
            },
            {
                id: nanoid(),
                type: 'text',
                props: {
                    content: '<h1 style="color: #2c3e50; font-size: 36px; margin: 0; font-weight: 700;">Welcome Aboard! 🎉</h1>',
                    style: { textAlign: 'center', padding: '0 20px' },
                },
            },
            {
                id: nanoid(),
                type: 'spacer',
                props: { style: { height: '20px' } },
            },
            {
                id: nanoid(),
                type: 'text',
                props: {
                    content: '<p style="color: #555; font-size: 18px; line-height: 1.6; margin: 0;">We\'re thrilled to have you join our community. Get ready for an amazing journey filled with innovation, collaboration, and success.</p>',
                    style: { textAlign: 'center', padding: '0 40px' },
                },
            },
            {
                id: nanoid(),
                type: 'spacer',
                props: { style: { height: '40px' } },
            },
            {
                id: nanoid(),
                type: 'button',
                props: {
                    text: 'Complete Your Profile',
                    url: '#',
                    style: {
                        backgroundColor: '#3498db',
                        color: '#ffffff',
                        padding: '16px 48px',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        display: 'inline-block',
                    },
                },
            },
            {
                id: nanoid(),
                type: 'spacer',
                props: { style: { height: '50px' } },
            },
            {
                id: nanoid(),
                type: 'layout-3',
                props: { style: { padding: '20px' } },
                children: [
                    {
                        id: nanoid(),
                        type: 'column' as any,
                        props: { style: { padding: '15px', textAlign: 'center' } },
                        children: [
                            {
                                id: nanoid(),
                                type: 'text',
                                props: {
                                    content: '<div style="font-size: 40px; margin-bottom: 10px;">📚</div><h3 style="color: #2c3e50; margin: 10px 0;">Learn</h3><p style="color: #666; font-size: 14px;">Access our extensive knowledge base</p>',
                                },
                            },
                        ],
                    },
                    {
                        id: nanoid(),
                        type: 'column' as any,
                        props: { style: { padding: '15px', textAlign: 'center' } },
                        children: [
                            {
                                id: nanoid(),
                                type: 'text',
                                props: {
                                    content: '<div style="font-size: 40px; margin-bottom: 10px;">💬</div><h3 style="color: #2c3e50; margin: 10px 0;">Connect</h3><p style="color: #666; font-size: 14px;">Join our vibrant community</p>',
                                },
                            },
                        ],
                    },
                    {
                        id: nanoid(),
                        type: 'column' as any,
                        props: { style: { padding: '15px', textAlign: 'center' } },
                        children: [
                            {
                                id: nanoid(),
                                type: 'text',
                                props: {
                                    content: '<div style="font-size: 40px; margin-bottom: 10px;">🚀</div><h3 style="color: #2c3e50; margin: 10px 0;">Grow</h3><p style="color: #666; font-size: 14px;">Achieve your goals with us</p>',
                                },
                            },
                        ],
                    },
                ],
            },
            {
                id: nanoid(),
                type: 'spacer',
                props: { style: { height: '40px' } },
            },
            {
                id: nanoid(),
                type: 'divider',
                props: { style: { color: '#e0e0e0', padding: '20px 0' } },
            },
            {
                id: nanoid(),
                type: 'text',
                props: {
                    content: '<p style="color: #999; font-size: 12px; margin: 0;">© 2024 Your Company. All rights reserved.<br>123 Business St, Suite 100, City, State 12345</p>',
                    style: { textAlign: 'center', padding: '20px' },
                },
            },
        ],
    },
    {
        id: 'newsletter',
        name: 'Monthly Newsletter - Professional',
        version: '1.0',
        elements: [
            {
                id: nanoid(),
                type: 'text',
                props: {
                    content: '<h1 style="color: #ffffff; font-size: 32px; margin: 0; font-weight: 700;">Monthly Insights</h1><p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">December 2024 Edition</p>',
                    style: {
                        textAlign: 'center',
                        padding: '50px 20px',
                        backgroundColor: '#1a1a2e',
                    },
                },
            },
            {
                id: nanoid(),
                type: 'spacer',
                props: { style: { height: '40px' } },
            },
            {
                id: nanoid(),
                type: 'text',
                props: {
                    content: '<h2 style="color: #2c3e50; font-size: 24px; margin: 0 0 15px 0;">Featured Story</h2>',
                    style: { padding: '0 30px' },
                },
            },
            {
                id: nanoid(),
                type: 'image',
                props: {
                    src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop',
                    alt: 'Featured article',
                    style: { width: '100%', borderRadius: '12px', display: 'block' },
                },
            },
            {
                id: nanoid(),
                type: 'spacer',
                props: { style: { height: '20px' } },
            },
            {
                id: nanoid(),
                type: 'text',
                props: {
                    content: '<h3 style="color: #2c3e50; font-size: 22px; margin: 0 0 10px 0;">The Future of Digital Innovation</h3><p style="color: #555; font-size: 16px; line-height: 1.6;">Discover how emerging technologies are reshaping industries and creating new opportunities for growth and innovation in the digital age.</p>',
                    style: { padding: '0 30px' },
                },
            },
            {
                id: nanoid(),
                type: 'spacer',
                props: { style: { height: '30px' } },
            },
            {
                id: nanoid(),
                type: 'button',
                props: {
                    text: 'Read Full Article',
                    url: '#',
                    style: {
                        backgroundColor: '#e74c3c',
                        color: '#ffffff',
                        padding: '14px 32px',
                        borderRadius: '6px',
                        fontSize: '15px',
                        fontWeight: '600',
                    },
                },
            },
            {
                id: nanoid(),
                type: 'spacer',
                props: { style: { height: '50px' } },
            },
            {
                id: nanoid(),
                type: 'divider',
                props: { style: { color: '#e0e0e0', padding: '0' } },
            },
            {
                id: nanoid(),
                type: 'spacer',
                props: { style: { height: '40px' } },
            },
            {
                id: nanoid(),
                type: 'text',
                props: {
                    content: '<h2 style="color: #2c3e50; font-size: 24px; margin: 0 0 30px 0;">Latest Updates</h2>',
                    style: { padding: '0 30px' },
                },
            },
            {
                id: nanoid(),
                type: 'layout-2',
                props: { style: { padding: '0 20px' } },
                children: [
                    {
                        id: nanoid(),
                        type: 'column' as any,
                        props: { style: { padding: '10px' } },
                        children: [
                            {
                                id: nanoid(),
                                type: 'image',
                                props: {
                                    src: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop',
                                    alt: 'Team collaboration',
                                    style: { width: '100%', borderRadius: '8px', display: 'block' },
                                },
                            },
                            {
                                id: nanoid(),
                                type: 'spacer',
                                props: { style: { height: '15px' } },
                            },
                            {
                                id: nanoid(),
                                type: 'text',
                                props: {
                                    content: '<h4 style="color: #2c3e50; font-size: 18px; margin: 0 0 8px 0;">Team Success Stories</h4><p style="color: #666; font-size: 14px; line-height: 1.5;">See how our teams are achieving remarkable results through collaboration and innovation.</p>',
                                },
                            },
                        ],
                    },
                    {
                        id: nanoid(),
                        type: 'column' as any,
                        props: { style: { padding: '10px' } },
                        children: [
                            {
                                id: nanoid(),
                                type: 'image',
                                props: {
                                    src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop',
                                    alt: 'Product development',
                                    style: { width: '100%', borderRadius: '8px', display: 'block' },
                                },
                            },
                            {
                                id: nanoid(),
                                type: 'spacer',
                                props: { style: { height: '15px' } },
                            },
                            {
                                id: nanoid(),
                                type: 'text',
                                props: {
                                    content: '<h4 style="color: #2c3e50; font-size: 18px; margin: 0 0 8px 0;">Product Roadmap 2025</h4><p style="color: #666; font-size: 14px; line-height: 1.5;">Get an exclusive preview of exciting features and improvements coming next year.</p>',
                                },
                            },
                        ],
                    },
                ],
            },
            {
                id: nanoid(),
                type: 'spacer',
                props: { style: { height: '50px' } },
            },
            {
                id: nanoid(),
                type: 'text',
                props: {
                    content: '<p style="color: #999; font-size: 12px; margin: 0;">You\'re receiving this because you subscribed to our newsletter.<br><a href="#" style="color: #3498db;">Unsubscribe</a> | <a href="#" style="color: #3498db;">Update Preferences</a></p>',
                    style: { textAlign: 'center', padding: '20px' },
                },
            },
        ],
    },
    {
        id: 'product-launch',
        name: 'Product Launch - Premium',
        version: '1.0',
        elements: [
            {
                id: nanoid(),
                type: 'spacer',
                props: { style: { height: '30px' } },
            },
            {
                id: nanoid(),
                type: 'text',
                props: {
                    content: '<p style="color: #3498db; font-size: 14px; font-weight: 600; margin: 0; text-transform: uppercase; letter-spacing: 2px;">Introducing</p>',
                    style: { textAlign: 'center' },
                },
            },
            {
                id: nanoid(),
                type: 'spacer',
                props: { style: { height: '15px' } },
            },
            {
                id: nanoid(),
                type: 'text',
                props: {
                    content: '<h1 style="color: #2c3e50; font-size: 42px; margin: 0; font-weight: 800; line-height: 1.2;">The Next Generation<br>Product</h1>',
                    style: { textAlign: 'center', padding: '0 20px' },
                },
            },
            {
                id: nanoid(),
                type: 'spacer',
                props: { style: { height: '20px' } },
            },
            {
                id: nanoid(),
                type: 'text',
                props: {
                    content: '<p style="color: #666; font-size: 18px; line-height: 1.6; margin: 0;">Reimagined from the ground up. More powerful. More intuitive. More you.</p>',
                    style: { textAlign: 'center', padding: '0 40px' },
                },
            },
            {
                id: nanoid(),
                type: 'spacer',
                props: { style: { height: '40px' } },
            },
            {
                id: nanoid(),
                type: 'image',
                props: {
                    src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=700&fit=crop',
                    alt: 'Product showcase',
                    style: { width: '100%', borderRadius: '16px', display: 'block' },
                },
            },
            {
                id: nanoid(),
                type: 'spacer',
                props: { style: { height: '50px' } },
            },
            {
                id: nanoid(),
                type: 'button',
                props: {
                    text: 'Pre-Order Now - Limited Time',
                    url: '#',
                    style: {
                        backgroundColor: '#2ecc71',
                        color: '#ffffff',
                        padding: '18px 50px',
                        borderRadius: '50px',
                        fontSize: '18px',
                        fontWeight: '700',
                        boxShadow: '0 10px 30px rgba(46, 204, 113, 0.3)',
                    },
                },
            },
            {
                id: nanoid(),
                type: 'spacer',
                props: { style: { height: '60px' } },
            },
            {
                id: nanoid(),
                type: 'text',
                props: {
                    content: '<h2 style="color: #2c3e50; font-size: 32px; margin: 0; font-weight: 700;">Revolutionary Features</h2>',
                    style: { textAlign: 'center', padding: '0 20px' },
                },
            },
            {
                id: nanoid(),
                type: 'spacer',
                props: { style: { height: '40px' } },
            },
            {
                id: nanoid(),
                type: 'layout-3',
                props: { style: { padding: '0 20px' } },
                children: [
                    {
                        id: nanoid(),
                        type: 'column' as any,
                        props: { style: { padding: '15px' } },
                        children: [
                            {
                                id: nanoid(),
                                type: 'image',
                                props: {
                                    src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
                                    alt: 'Smart technology',
                                    style: { width: '100%', borderRadius: '12px', display: 'block' },
                                },
                            },
                            {
                                id: nanoid(),
                                type: 'spacer',
                                props: { style: { height: '20px' } },
                            },
                            {
                                id: nanoid(),
                                type: 'text',
                                props: {
                                    content: '<h3 style="color: #2c3e50; font-size: 20px; margin: 0 0 10px 0; font-weight: 700;">AI-Powered</h3><p style="color: #666; font-size: 15px; line-height: 1.6;">Smart algorithms that adapt to your workflow and boost productivity.</p>',
                                },
                            },
                        ],
                    },
                    {
                        id: nanoid(),
                        type: 'column' as any,
                        props: { style: { padding: '15px' } },
                        children: [
                            {
                                id: nanoid(),
                                type: 'image',
                                props: {
                                    src: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&h=300&fit=crop',
                                    alt: 'Lightning fast',
                                    style: { width: '100%', borderRadius: '12px', display: 'block' },
                                },
                            },
                            {
                                id: nanoid(),
                                type: 'spacer',
                                props: { style: { height: '20px' } },
                            },
                            {
                                id: nanoid(),
                                type: 'text',
                                props: {
                                    content: '<h3 style="color: #2c3e50; font-size: 20px; margin: 0 0 10px 0; font-weight: 700;">Lightning Fast</h3><p style="color: #666; font-size: 15px; line-height: 1.6;">Experience unprecedented speed with our optimized architecture.</p>',
                                },
                            },
                        ],
                    },
                    {
                        id: nanoid(),
                        type: 'column' as any,
                        props: { style: { padding: '15px' } },
                        children: [
                            {
                                id: nanoid(),
                                type: 'image',
                                props: {
                                    src: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop',
                                    alt: 'Secure platform',
                                    style: { width: '100%', borderRadius: '12px', display: 'block' },
                                },
                            },
                            {
                                id: nanoid(),
                                type: 'spacer',
                                props: { style: { height: '20px' } },
                            },
                            {
                                id: nanoid(),
                                type: 'text',
                                props: {
                                    content: '<h3 style="color: #2c3e50; font-size: 20px; margin: 0 0 10px 0; font-weight: 700;">Fort Knox Secure</h3><p style="color: #666; font-size: 15px; line-height: 1.6;">Enterprise-grade security protecting your data at every level.</p>',
                                },
                            },
                        ],
                    },
                ],
            },
            {
                id: nanoid(),
                type: 'spacer',
                props: { style: { height: '60px' } },
            },
            {
                id: nanoid(),
                type: 'text',
                props: {
                    content: '<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 30px; border-radius: 16px; color: white;"><h2 style="color: white; font-size: 28px; margin: 0 0 15px 0; font-weight: 700;">Early Bird Special</h2><p style="color: rgba(255,255,255,0.9); font-size: 18px; margin: 0 0 25px 0;">Save 30% when you pre-order before launch day</p><p style="color: white; font-size: 42px; font-weight: 800; margin: 0;">$699 <span style="font-size: 24px; text-decoration: line-through; opacity: 0.7;">$999</span></p></div>',
                    style: { padding: '0 30px' },
                },
            },
            {
                id: nanoid(),
                type: 'spacer',
                props: { style: { height: '40px' } },
            },
            {
                id: nanoid(),
                type: 'button',
                props: {
                    text: 'Claim Your Discount',
                    url: '#',
                    style: {
                        backgroundColor: '#2c3e50',
                        color: '#ffffff',
                        padding: '18px 50px',
                        borderRadius: '50px',
                        fontSize: '18px',
                        fontWeight: '700',
                    },
                },
            },
            {
                id: nanoid(),
                type: 'spacer',
                props: { style: { height: '60px' } },
            },
            {
                id: nanoid(),
                type: 'divider',
                props: { style: { color: '#e0e0e0' } },
            },
            {
                id: nanoid(),
                type: 'text',
                props: {
                    content: '<p style="color: #999; font-size: 12px; margin: 0;">© 2024 Your Company | <a href="#" style="color: #3498db;">Terms</a> | <a href="#" style="color: #3498db;">Privacy</a></p>',
                    style: { textAlign: 'center', padding: '30px 20px' },
                },
            },
        ],
    },
]