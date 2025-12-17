import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { TemplateMedia } from "../TemplateSelection/templates";
import { ButtonElement } from "../store/useCampaignStore";

interface ChatbotPreviewCardProps {
    heading: string;
    subheading: string;
    media: TemplateMedia | null;
    buttons: ButtonElement[];
    hasImage: boolean;
    layout: string;
}

export const ChatbotPreviewCard = ({
    heading,
    subheading,
    media,
    buttons,
    hasImage,
    layout,
}: ChatbotPreviewCardProps) => {
    return (
        <div className="bg-white dark:bg-card shadow-xl rounded-2xl overflow-hidden border-0 mx-auto w-[300px]">
            {/* Image Section */}
            {hasImage && (
                <div className="relative w-full">
                    {media ? (
                        <img
                            src={media.src}
                            alt={media.alt || "Campaign image"}
                            className="object-cover w-full h-48"
                        />
                    ) : (
                        <div className="bg-gray-100 dark:bg-gray-800 h-48 flex flex-col items-center justify-center text-gray-400 border-b">
                            <div className="bg-gray-200 dark:bg-gray-700 rounded-full p-3 mb-2">
                                <Upload className="w-6 h-6" />
                            </div>
                            <span className="text-xs">No image uploaded</span>
                        </div>
                    )}
                </div>
            )}

            {/* Content Section */}
            <div className="p-5 space-y-3">
                <div className="space-y-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 break-words whitespace-pre-wrap">
                        {heading || "Add a heading..."}
                    </h3>
                    {(layout.includes("subheading") || subheading) && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 break-words whitespace-pre-wrap">
                            {subheading || "Add a subheading..."}
                        </p>
                    )}
                </div>

                {/* Buttons */}
                <div className="space-y-2 pt-2">
                    {buttons.map((btn) => (
                        <Button
                            key={btn.id}
                            variant={btn.style === "primary" ? "default" : btn.style === "danger" ? "destructive" : "secondary"}
                            className={`w-full text-sm py-2 ${btn.style === "primary"
                                ? "bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900"
                                : btn.style === "danger"
                                    ? "bg-red-600 hover:bg-red-700 text-white"
                                    : "bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                                }`}
                        >
                            {btn.text}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
};
