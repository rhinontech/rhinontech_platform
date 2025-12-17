import React from 'react';
import { EmailElement } from '@/types/email-builder';
import { useEmailStore } from '@/store/email-store';

interface VideoBlockProps {
    element: EmailElement;
}

export const VideoBlock = ({ element }: VideoBlockProps) => {
    const { selectedElementId } = useEmailStore();
    const isSelected = selectedElementId === element.id;
    const style = element.props.style || {};

    const videoUrl = element.props.videoUrl || '';
    const thumbnailUrl = element.props.thumbnailUrl || 'https://via.placeholder.com/600x400?text=Video+Thumbnail';

    // Extract video ID from YouTube or Vimeo URL
    const getVideoId = (url: string) => {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            return match ? match[1] : null;
        }
        if (url.includes('vimeo.com')) {
            const match = url.match(/vimeo\.com\/(\d+)/);
            return match ? match[1] : null;
        }
        return null;
    };

    const videoId = getVideoId(videoUrl);
    const isYouTube = videoUrl.includes('youtube') || videoUrl.includes('youtu.be');
    const embedUrl = videoId
        ? isYouTube
            ? `https://www.youtube.com/embed/${videoId}`
            : `https://player.vimeo.com/video/${videoId}`
        : '';

    return (
        <div
            style={{
                padding: style.padding || '20px',
                backgroundColor: style.backgroundColor,
                textAlign: 'center',
            }}
        >
            {embedUrl ? (
                <a href={videoUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', position: 'relative' }}>
                    <img
                        src={thumbnailUrl}
                        alt="Video thumbnail"
                        style={{
                            width: '100%',
                            maxWidth: style.width || '600px',
                            height: 'auto',
                            borderRadius: style.borderRadius || '8px',
                            display: 'block',
                            margin: '0 auto',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '80px',
                            height: '80px',
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: 0,
                                height: 0,
                                borderLeft: '20px solid white',
                                borderTop: '12px solid transparent',
                                borderBottom: '12px solid transparent',
                                marginLeft: '5px',
                            }}
                        />
                    </div>
                </a>
            ) : (
                <div
                    style={{
                        padding: '40px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '8px',
                        color: '#666',
                    }}
                >
                    {isSelected ? 'Add a YouTube or Vimeo URL in properties' : 'Video'}
                </div>
            )}
        </div>
    );
};
