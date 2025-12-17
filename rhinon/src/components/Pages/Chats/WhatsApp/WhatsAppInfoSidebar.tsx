"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { X, Phone, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { type WhatsAppContact } from "@/services/settings/whatsappServices";

interface WhatsAppInfoSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    selectedContact: WhatsAppContact | null;
    messages: any[];
}

export function WhatsAppInfoSidebar({
    isOpen,
    onClose,
    selectedContact,
    messages,
}: WhatsAppInfoSidebarProps) {
    const [isViewAll, setIsViewAll] = useState(false);

    const getFileType = (fileName: string, fileUrl: string): "image" | "pdf" => {
        const ext = fileName.toLowerCase().split(".").pop();
        if (ext && ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext))
            return "image";
        if (ext === "pdf" || fileUrl.includes(".pdf")) return "pdf";
        return "image";
    };

    const getSharedMedia = () =>
        messages
            .filter((msg) => msg.message_type === "image" && msg.media_url)
            .map((msg) => ({
                url: msg.media_url,
                name: msg.caption || "Image",
                isImage: true,
            }));

    return (
        <div
            className={cn(
                "flex flex-col border-l bg-muted/30 transition-all duration-300 ease-in-out",
                isOpen ? "w-96" : "w-0 overflow-hidden"
            )}>
            {isOpen && selectedContact && (
                <>
                    <div className="flex items-center justify-between border-b h-[60px] p-4">
                        <h2 className="text-lg font-semibold">Contact Info</h2>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 h-0 p-4 space-y-6">
                        {/* Contact Profile */}
                        <div className="text-center">
                            <Avatar className="h-20 w-20 mx-auto mb-3">
                                <AvatarFallback className="text-lg bg-primary/10">
                                    {(selectedContact.profile_name || selectedContact.name || selectedContact.phone_number)?.[0]?.toUpperCase() || "C"}
                                </AvatarFallback>
                            </Avatar>
                            <h3 className="font-semibold text-lg">
                                {selectedContact.profile_name || selectedContact.name || selectedContact.phone_number}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                WhatsApp Contact
                            </p>
                        </div>

                        <Separator />

                        {/* Contact Information */}
                        <div className="space-y-3 p-2">
                            <h4 className="font-medium text-sm text-muted-foreground">Contact Information</h4>

                            <div className="space-y-2">
                                <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                                    <Phone className="h-4 w-4 text-primary" />
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">Phone Number</p>
                                        <p className="text-sm font-medium">{selectedContact.phone_number}</p>
                                    </div>
                                </div>

                                {selectedContact.name && (
                                    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                                        <div className="h-4 w-4 flex items-center justify-center text-primary">👤</div>
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground">Name</p>
                                            <p className="text-sm font-medium">{selectedContact.name}</p>
                                        </div>
                                    </div>
                                )}

                                {selectedContact.profile_name && (
                                    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                                        <div className="h-4 w-4 flex items-center justify-center text-primary">✨</div>
                                        <div className="flex-1">
                                            <p className="text-xs text-muted-foreground">WhatsApp Name</p>
                                            <p className="text-sm font-medium">{selectedContact.profile_name}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Shared Media */}
                        <div className="space-y-3 p-4">
                            <h4 className="font-medium text-sm">Shared Media</h4>
                            <div className="grid grid-cols-3 gap-2">
                                {getSharedMedia()
                                    .slice(0, !isViewAll ? 6 : undefined)
                                    .map((file: any, i) =>
                                        file.isImage ? (
                                            <div
                                                key={i}
                                                className="aspect-square rounded-md border overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                                                <img
                                                    src={file.url}
                                                    alt={file.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div
                                                key={i}
                                                className="cursor-pointer flex flex-col items-center justify-center aspect-square rounded-md border bg-white p-2 text-center hover:bg-gray-50">
                                                <span className="text-2xl">📎</span>
                                                <p className="text-xs truncate w-full">{file.name}</p>
                                            </div>
                                        )
                                    )}

                                {getSharedMedia().length === 0 && (
                                    <p className="text-xs text-muted-foreground col-span-3">
                                        No media shared yet.
                                    </p>
                                )}
                            </div>

                            {getSharedMedia().length > 6 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => setIsViewAll(!isViewAll)}>
                                    {isViewAll ? "View Less" : "View All Media"}
                                </Button>
                            )}
                        </div>

                        <Separator />

                        {/* Additional Info */}
                        <div className="space-y-2 p-2">
                            <h4 className="font-medium text-sm text-muted-foreground">About</h4>
                            <p className="text-sm text-muted-foreground">
                                Last message: {new Date(selectedContact.last_message_at).toLocaleString()}
                            </p>
                        </div>
                    </ScrollArea>
                </>
            )}
        </div>
    );
}
