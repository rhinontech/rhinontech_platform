import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatSkeleton } from "@/components/Common/Skeleton/Skeleton";
import Loading from "@/app/loading";
import { type WhatsAppContact, type WhatsAppAccount } from "@/services/settings/whatsappServices";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface WhatsAppSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    contacts: WhatsAppContact[];
    selectedContact: WhatsAppContact | null;
    onSelectContact: (contact: WhatsAppContact) => void;
    loading: boolean;
    accounts: WhatsAppAccount[];
    selectedAccount: number;
    onAccountChange: (accountId: number) => void;
}

export function WhatsAppSidebar({
    isOpen,
    onClose,
    contacts,
    selectedContact,
    onSelectContact,
    loading,
    accounts,
    selectedAccount,
    onAccountChange,
}: WhatsAppSidebarProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const timeAgo = (timestamp: string | number | Date): string => {
        const now = new Date();
        const past = new Date(timestamp);
        let seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

        const isFuture = seconds < 0;
        seconds = Math.abs(seconds);

        const units = [
            { label: "year", seconds: 365 * 24 * 60 * 60 },
            { label: "month", seconds: 30 * 24 * 60 * 60 },
            { label: "week", seconds: 7 * 24 * 60 * 60 },
            { label: "day", seconds: 24 * 60 * 60 },
            { label: "hour", seconds: 60 * 60 },
            { label: "min", seconds: 60 },
            { label: "sec", seconds: 1 },
        ];

        for (const unit of units) {
            const value = Math.floor(seconds / unit.seconds);
            if (value >= 1) {
                return isFuture
                    ? `in ${value} ${unit.label}${value > 1 ? "s" : ""}`
                    : `${value} ${unit.label}${value > 1 ? "s" : ""} ago`;
            }
        }

        return "just now";
    };

    const filteredContacts = contacts.filter((c) => {
        const term = searchQuery.toLowerCase();
        const name = (c.profile_name || c.name || "").toLowerCase();
        const phone = c.phone_number.toLowerCase();
        return name.includes(term) || phone.includes(term);
    });

    return (
        <div
            className={cn(
                "flex flex-col border-r bg-muted/30 transition-all duration-300 ease-in-out",
                isOpen ? "w-72" : "w-0 overflow-hidden"
            )}>
            {isOpen && (
                <>
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loading areaOnly />
                        </div>
                    ) : (
                        <>
                            {/* Sidebar Header */}
                            <div className="flex flex-col border-b">
                                <div className="flex items-center justify-between h-[60px] px-4">
                                    <h2 className="text-lg font-semibold">WhatsApp</h2>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={onClose}
                                        className="h-8 w-8 rounded-full hover:bg-gray-100">
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>

                                {/* Account Selector */}
                                {accounts.length > 1 && (
                                    <div className="px-4 pb-3">
                                        <Select value={selectedAccount.toString()} onValueChange={(v) => onAccountChange(parseInt(v))}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select account" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {accounts.map((acc) => (
                                                    <SelectItem key={acc.id} value={acc.id.toString()}>
                                                        {acc.verified_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            {/* Search Bar */}
                            <div className="px-5 py-4 border-b">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search contacts..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary text-sm shadow-sm transition-all"
                                    />
                                </div>
                            </div>

                            {/* Contact List */}
                            <ScrollArea className="flex-1 h-0">
                                <div className="space-y-1 p-2">
                                    {filteredContacts.length === 0 && contacts.length > 0 && (
                                        <div className="p-4 text-center text-sm text-gray-500">No contacts found</div>
                                    )}

                                    {filteredContacts.map((c) => (
                                        <div
                                            key={c.id}
                                            className={cn(
                                                "flex cursor-pointer relative items-center gap-3 rounded-xl px-3 py-3 transition-all group hover:border-primary/20 hover:bg-primary/5",
                                                selectedContact?.id === c.id && "bg-primary/15"
                                            )}
                                            onClick={() => onSelectContact(c)}>
                                            <div className="relative">
                                                <Avatar className="h-11 w-11 bg-primary/5">
                                                    <AvatarFallback className="font-semibold bg-primary/5">
                                                        {(c.profile_name || c.name || c.phone_number)?.[0]?.toUpperCase() || "C"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {/* Status indicator could be added here if we had online status */}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p
                                                        className="font-medium truncate max-w-[140px] text-sm"
                                                        title={c.phone_number}>
                                                        {c.profile_name || c.name || c.phone_number}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                                    <p className="text-xs text-muted-foreground truncate max-w-[120px] mt-0.5">
                                                        {c.phone_number}
                                                    </p>
                                                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                                        {timeAgo(c.last_message_at)}
                                                    </span>
                                                </div>
                                            </div>

                                            {c.unread_count && c.unread_count > 0 && (
                                                <Badge
                                                    variant="default"
                                                    className="h-5 absolute right-[10px] top-[14px] min-w-5 text-xs">
                                                    {c.unread_count}
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                    {contacts.length === 0 && (
                                        <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
                                            <p>No conversations yet.</p>
                                            <p className="text-xs mt-2">Messages will appear here.</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
