"use client";

import React, { useEffect, useState, useRef } from "react";
import { Bell, Phone, Check, CheckCheck, X } from "lucide-react";
import { useUserStore } from "@/utils/store";
import { useCallContext } from "@/context/CallContext";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import axios from "axios";

// Helper to play sound
const playNotificationSound = () => {
    try {
        const audio = new Audio("/confident-543.mp3");
        audio.play().catch((e) => console.log("Audio play failed", e));
    } catch (e) {
        console.error("Audio error", e);
    }
};

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    data: any;
    created_at: string;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const chatbotId = useUserStore((state) => state.userData.chatbotId);
    const { startCall } = useCallContext();
    const lastCountRef = useRef(0);

    // Poll for notifications
    useEffect(() => {
        if (!chatbotId) return;

        const fetchNotifications = async () => {
            try {
                const res = await axios.get(
                    `${process.env.NEXT_PUBLIC_API_URL}/notifications/unread/${chatbotId}`
                );
                const list = res.data.notifications || [];
                setNotifications(list);

                // Check for new items to play sound
                if (list.length > lastCountRef.current) {
                    playNotificationSound();
                    toast.info(
                        `You have ${list.length - lastCountRef.current} new notifications`
                    );
                }
                lastCountRef.current = list.length;
            } catch (err) {
                console.error("Failed to fetch notifications", err);
            }
        };

        fetchNotifications(); // Initial
        const interval = setInterval(fetchNotifications, 10000); // Poll every 10s

        return () => clearInterval(interval);
    }, [chatbotId]);

    const handleMarkRead = async (id: string) => {
        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/notifications/read`,
                { notification_id: id }
            );
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            lastCountRef.current = Math.max(0, lastCountRef.current - 1);
        } catch (err) {
            toast.error("Failed to mark as read");
        }
    };

    const handleRemove = async (id: string) => {
        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_API_URL}/notifications/${id}`
            );
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            lastCountRef.current = Math.max(0, lastCountRef.current - 1);
        } catch (err) {
            toast.error("Failed to remove notification");
        }
    };

    const handleAction = async (notif: Notification) => {
        if (notif.type === "call") {
            const userId = notif.data?.user_id || notif.data?.email;
            if (userId) {
                setIsOpen(false);
                startCall(userId);
                handleMarkRead(notif.id);
            } else {
                toast.error("Invalid user ID in notification");
            }
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative rounded-full">
                    <Bell className="h-5 w-5" />
                    {notifications.length > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-[10px]">
                            {notifications.length}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">Notifications</h4>
                    {notifications.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                            {notifications.length} Unread
                        </span>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground gap-2">
                            <CheckCheck className="h-8 w-8 opacity-20" />
                            <p className="text-sm">All caught up!</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`p-4 border-b hover:bg-muted/50 transition-colors ${notif.type === "call" ? "bg-red-50 dark:bg-red-950/10" : ""
                                        }`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                {notif.type === "call" && (
                                                    <Phone className="h-3 w-3 text-red-500 animate-pulse" />
                                                )}
                                                <p className="text-sm font-medium leading-none">
                                                    {notif.title}
                                                </p>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {notif.message}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(notif.created_at).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        {notif.type === "call" ? (
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 h-8"
                                                    onClick={() => handleAction(notif)}>
                                                    Call
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-muted-foreground hover:text-red-500"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemove(notif.id);
                                                    }}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => handleMarkRead(notif.id)}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-muted-foreground hover:text-red-500"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemove(notif.id);
                                                    }}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
