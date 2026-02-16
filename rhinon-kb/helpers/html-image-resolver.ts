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
        // Also check if it looks like a relative path that should be an S3 key (contains platform-uploads)
        const isS3KeyValue =
            (!src.startsWith("http://") &&
                !src.startsWith("https://") &&
                !src.startsWith("data:") &&
                !src.startsWith("blob:")) || src.includes("platform-uploads/");

        if (isS3KeyValue) {
            // If it's a full URL but contains platform-uploads (like localhost:3000/platform-uploads...), 
            // extract the key part.
            let s3Key = src;
            if (src.includes("platform-uploads/")) {
                // Extract everything from platform-uploads/ onwards
                const match = src.match(/(platform-uploads\/.*)/);
                if (match && match[1]) {
                    s3Key = match[1];
                }
            }

            // Store original S3 key in data attribute
            img.setAttribute("data-s3-key", s3Key);
            // Remove src temporarily to prevent browser from loading it as relative URL
            img.removeAttribute("src");

            try {
                // Get presigned URL for the S3 key
                const presignedUrl = await getPresignedUrl(s3Key);
                if (presignedUrl) {
                    img.setAttribute("src", presignedUrl);
                } else {
                    // Restore original if resolution fails
                    img.setAttribute("src", src);
                }
                // Clean up data attribute
                img.removeAttribute("data-s3-key");
            } catch (error) {
                console.error(`Failed to resolve S3 key: ${s3Key}`, error);
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
