import { getPresignedUrl } from "@/services/kbServices";

/**
 * Process HTML content and replace S3 keys in img tags with presigned URLs
 * @param html - The HTML content containing potential S3 keys in img src attributes
 * @returns Promise<string> - HTML with S3 keys replaced by presigned URLs
 */
export async function resolveImagesInHTML(html: string): Promise<string> {
    if (!html) return "";

    // Create a temporary div to parse the HTML
    const div = document.createElement("div");
    div.innerHTML = html;

    // Find all img tags
    const images = div.querySelectorAll("img");

    // Transparent 1x1 pixel placeholder to prevent browser from loading anything
    const placeholder = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

    // Process each image
    const promises = Array.from(images).map(async (img) => {
        const src = img.getAttribute("src");
        if (!src) return;

        // Check if src is an S3 key (not a full URL)
        const isS3KeyValue =
            !src.startsWith("http://") &&
            !src.startsWith("https://") &&
            !src.startsWith("data:") &&
            !src.startsWith("blob:");

        if (isS3KeyValue) {
            // Store original S3 key in data attribute
            img.setAttribute("data-s3-key", src);
            // Remove src temporarily to prevent browser from loading it as relative URL
            img.removeAttribute("src");

            try {
                // Get presigned URL for the S3 key
                const presignedUrl = await getPresignedUrl(src);
                if (presignedUrl) {
                    img.setAttribute("src", presignedUrl);
                } else {
                    // Restore original if resolution fails
                    img.setAttribute("src", src);
                }
                // Clean up data attribute
                img.removeAttribute("data-s3-key");
            } catch (error) {
                console.error(`Failed to resolve S3 key: ${src}`, error);
                // Restore original src on error
                img.setAttribute("src", src);
                img.removeAttribute("data-s3-key");
            }
        }
    });

    // Wait for all images to be processed
    await Promise.all(promises);

    // Return the processed HTML
    return div.innerHTML;
}

/**
 * Check if a URL is an S3 key that needs to be resolved
 */
export function isS3Key(url: string): boolean {
    if (!url) return false;
    return (
        !url.startsWith("http://") &&
        !url.startsWith("https://") &&
        !url.startsWith("data:") &&
        !url.startsWith("blob:") &&
        !url.startsWith("#")
    );
}
