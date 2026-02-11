import { useState, useEffect } from "react";
import { getSecureViewUrl } from "@/services/fileUploadService";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface SecureImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
}

export const SecureImage = ({ src, alt, className, ...props }: SecureImageProps) => {
    const [imgSrc, setImgSrc] = useState<string>("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let active = true;

        const resolveSrc = async () => {
            if (!src) return;

            // If it's a legacy URL or a data URL (preview), use it directly
            if (src.startsWith("http") || src.startsWith("data:")) {
                setImgSrc(src);
                return;
            }

            // Otherwise, assume it's an S3 Key and fetch a signed URL
            setLoading(true);
            try {
                const url = await getSecureViewUrl(src);
                if (active) setImgSrc(url);
            } catch (err) {
                console.error("Failed to load secure image", err);
            } finally {
                if (active) setLoading(false);
            }
        };

        resolveSrc();

        return () => {
            active = false;
        };
    }, [src]);

    if (!src) return null;
    if (loading) return <div className={cn("animate-pulse bg-muted", className)} />;

    if (!imgSrc) return null; // Don't render empty img tag

    return (
        <img
            src={imgSrc}
            alt={alt}
            className={className}
            {...props}
        />
    );
};
