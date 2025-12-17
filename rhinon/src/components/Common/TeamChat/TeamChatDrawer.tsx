"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    X,
    Send,
    MoreHorizontal,
    Hash,
    ChevronDown,
    Plus,
    Search,
    MessageSquare,
    Users,
    Sparkles,
} from "lucide-react";
// import { CollaborationIcon } from "@/components/Constants/SvgIcons";
import { RiChat1Line } from "react-icons/ri";
import { useUserStore } from "@/utils/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getSocket } from "@/services/webSocket";
import {
    createTeamChatChannel,
    getTeamChatChannels,
    getTeamChatMessages,
    getTeamChatUsers,
    sendTeamChatMessage,
    TeamChatChannel,
    TeamChatMessage,
    TeamChatUser,
} from "@/services/teamchat/teamChatService";

const MESSAGES_PAGE_SIZE = 50;

const buildDmId = (userA?: number | string, userB?: number | string) => {
    if (userA === undefined || userB === undefined || userA === null || userB === null) return "";

    const a = Number(userA);
    const b = Number(userB);

    if (Number.isNaN(a) || Number.isNaN(b)) return "";

    const [minId, maxId] = [a, b].sort((x, y) => x - y);
    return `dm:${minId}:${maxId}`;
};

type Message = TeamChatMessage & {
    isPending?: boolean;
};

type Channel = TeamChatChannel;
type User = TeamChatUser;

const dedupeMessages = (messages: Message[]) => {
    const seen = new Set<string>();
    const result: Message[] = [];

    messages.forEach((message) => {
        const key = message?.id ?? "";
        if (!key) return;
        if (seen.has(key)) return;
        seen.add(key);
        result.push(message);
    });

    return result;
};

const TeamChatDrawer = () => {
    const [isOpen, setIsOpen] = useState(false);

    // Data State
    const [channels, setChannels] = useState<Channel[]>([]);
    const [channelsLoading, setChannelsLoading] = useState(false);
    const [channelsError, setChannelsError] = useState<string | null>(null);

    const [users, setUsers] = useState<User[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState<string | null>(null);

    // UI State
    const [activeChatId, setActiveChatId] = useState<string>("");
    const [activeChatType, setActiveChatType] = useState<"channel" | "dm">("channel");
    const [messages, setMessages] = useState<Message[]>([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [messagesHasMore, setMessagesHasMore] = useState(false);
    const [messagesOffset, setMessagesOffset] = useState(0);
    const [isFetchingOlder, setIsFetchingOlder] = useState(false);
    const [messagesError, setMessagesError] = useState<string | null>(null);

    const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isTypingRef = useRef(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [input, setInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const { userData } = useUserStore();
    const currentUserId = userData.userId;
    const currentUserName = `${userData.userFirstName} ${userData.userLastName}`.trim() || "User";
    const currentUserIdString = currentUserId ? currentUserId.toString() : "";

    const currentScopeId = useMemo(() => {
        if (!activeChatId) return "";
        if (activeChatType === "channel") return activeChatId;
        return buildDmId(currentUserId, activeChatId);
    }, [activeChatId, activeChatType, currentUserId]);

    const channelIdsForUser = useMemo(() => {
        if (!currentUserIdString) return [];
        return channels
            .filter((channel) => channel.members?.map(String).includes(currentUserIdString))
            .map((channel) => channel.id);
    }, [channels, currentUserIdString]);

    const loadMessages = useCallback(async ({ offset = 0, append = false }: { offset?: number; append?: boolean } = {}) => {
        if (!currentScopeId) return;

        if (append) {
            setIsFetchingOlder(true);
        } else {
            setMessagesLoading(true);
            setMessagesError(null);
        }

        try {
            const { messages: fetchedMessages, hasMore } = await getTeamChatMessages({
                scopeType: activeChatType,
                scopeId: currentScopeId,
                limit: MESSAGES_PAGE_SIZE,
                offset,
            });

            const normalized = fetchedMessages.map((message) => ({
                ...message,
                timestamp: message.timestamp ?? new Date().toISOString(),
            }));

            setMessages((prev) =>
                dedupeMessages(append ? [...normalized, ...prev] : normalized)
            );
            setMessagesHasMore(hasMore);
            setMessagesOffset(offset);
        } catch (error) {
            console.error("Failed to load messages", error);
            setMessagesError("Unable to load messages.");
        } finally {
            if (append) {
                setIsFetchingOlder(false);
            } else {
                setMessagesLoading(false);
            }
        }
    }, [activeChatType, currentScopeId]);

    const emitTypingStatus = useCallback((isTyping: boolean) => {
        const socket = socketRef.current ?? getSocket();
        socketRef.current = socket;

        if (!socket || !currentScopeId || !currentUserId) return;

        socket.emit("typing_indicator", {
            scopeType: activeChatType,
            scopeId: currentScopeId,
            userId: currentUserId,
            isTyping,
        });
    }, [activeChatType, currentScopeId, currentUserId]);

    const activeItem = activeChatType === "channel"
        ? channels.find(c => c.id === activeChatId)
        : users.find(u => u.id === activeChatId);

    const activeChannelMemberCount = activeChatType === "channel" && activeItem
        ? (activeItem as Channel).members.length
        : null;

    const activeItemName = activeItem?.name || (activeChatType === "channel" ? "Channel" : "Direct Message");

    // Hydration fix
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        let ignore = false;

        const fetchInitialData = async () => {
            setChannelsLoading(true);
            setUsersLoading(true);
            setChannelsError(null);
            setUsersError(null);

            try {
                const [channelsResponse, usersResponse] = await Promise.all([
                    getTeamChatChannels(),
                    getTeamChatUsers(),
                ]);

                if (ignore) return;

                setChannels(channelsResponse);
                setUsers(usersResponse);

                if (!activeChatId) {
                    if (channelsResponse.length > 0) {
                        setActiveChatId(channelsResponse[0].id);
                        setActiveChatType("channel");
                    } else if (usersResponse.length > 0) {
                        setActiveChatId(usersResponse[0].id);
                        setActiveChatType("dm");
                    }
                }
            } catch (error) {
                console.error("Failed to load team chat data", error);
                if (!ignore) {
                    setChannelsError("Unable to load channels.");
                    setUsersError("Unable to load team members.");
                }
            } finally {
                if (!ignore) {
                    setChannelsLoading(false);
                    setUsersLoading(false);
                }
            }
        };

        fetchInitialData();

        return () => {
            ignore = true;
        };
    }, []);

    // Clear messages when chat changes 
    // useEffect(() => {
    //     setMessages([]);
    // }, [activeChatId, activeChatType]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input on open
    useEffect(() => {
        if (isOpen && inputRef.current) inputRef.current.focus();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !currentScopeId) return;

        setMessages([]);
        setMessagesHasMore(false);
        setMessagesOffset(0);
        setMessagesError(null);
        loadMessages({ offset: 0, append: false });
    }, [isOpen, currentScopeId, loadMessages]);

    useEffect(() => {
        if (!currentUserId) return;

        const socket = socketRef.current ?? getSocket();
        socketRef.current = socket;

        if (channelIdsForUser.length > 0) {
            socket.emit("join_team_chat", {
                userId: currentUserId,
                channelIds: channelIdsForUser,
            });
        }

        const handleTeamMessage = (payload: { scopeType: "channel" | "dm"; scopeId: string; message: TeamChatMessage; }) => {
            if (!payload.scopeId || payload.scopeId !== currentScopeId || payload.scopeType !== activeChatType) return;

            setMessages((prev) =>
                dedupeMessages([...prev, payload.message])
            );
        };

        const handleUserPresence = (payload: { userId: string | number; status: User["status"]; }) => {
            const userIdString = String(payload.userId);
            setUsers((prev) =>
                prev.map((user) =>
                    user.id === userIdString ? { ...user, status: payload.status } : user
                )
            );
        };

        const handleUserTyping = (payload: { scopeId: string; userId: string | number; isTyping: boolean; }) => {
            if (payload.scopeId !== currentScopeId) return;
            const userIdString = String(payload.userId);
            if (userIdString === currentUserIdString) return;

            setTypingUsers((prev) => {
                if (payload.isTyping) {
                    if (prev.includes(userIdString)) return prev;
                    return [...prev, userIdString];
                }
                return prev.filter((id) => id !== userIdString);
            });
        };

        const handleChannelCreated = (channel: Channel) => {
            if (!channel.members?.map(String).includes(currentUserIdString)) return;
            setChannels((prev) => {
                if (prev.some((existing) => existing.id === channel.id)) return prev;
                return [...prev, channel];
            });
        };

        socket.on("team_message", handleTeamMessage);
        socket.on("user_presence", handleUserPresence);
        socket.on("user_typing", handleUserTyping);
        socket.on("channel_created", handleChannelCreated);

        return () => {
            socket.off("team_message", handleTeamMessage);
            socket.off("user_presence", handleUserPresence);
            socket.off("user_typing", handleUserTyping);
            socket.off("channel_created", handleChannelCreated);
        };
    }, [activeChatType, channelIdsForUser, currentScopeId, currentUserId, currentUserIdString]);

    useEffect(() => {
        if (!isOpen || !currentUserId || !currentScopeId) return;

        const socket = socketRef.current ?? getSocket();
        socketRef.current = socket;

        if (activeChatType === "channel") {
            socket.emit("join_channel", { channelId: currentScopeId, userId: currentUserId });
        } else if (activeChatType === "dm") {
            socket.emit("join_dm", { dmId: currentScopeId, userId: currentUserId });
        }
    }, [activeChatType, currentScopeId, currentUserId, isOpen]);

    useEffect(() => {
        if (!currentUserId) return;

        const socket = socketRef.current ?? getSocket();
        socketRef.current = socket;

        socket.emit("update_presence", { userId: currentUserId, status: "online" });

        return () => {
            socket.emit("update_presence", { userId: currentUserId, status: "offline" });
        };
    }, [currentUserId]);

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (isTypingRef.current) {
                emitTypingStatus(false);
            }
        };
    }, [emitTypingStatus]);

    const stopTyping = useCallback(() => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }

        if (isTypingRef.current) {
            emitTypingStatus(false);
            isTypingRef.current = false;
        }
    }, [emitTypingStatus]);

    const handleInputChange = (value: string) => {
        setInput(value);

        if (!currentScopeId || !currentUserId) return;

        if (!value.trim()) {
            stopTyping();
            return;
        }

        if (!isTypingRef.current) {
            emitTypingStatus(true);
            isTypingRef.current = true;
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            emitTypingStatus(false);
            isTypingRef.current = false;
            typingTimeoutRef.current = null;
        }, 1500);
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !currentScopeId || !currentUserId) return;

        const content = input.trim();

        const optimisticMessage: Message = {
            id: `temp-${Date.now()}`,
            senderId: currentUserIdString || "unknown",
            senderName: currentUserName,
            content,
            timestamp: new Date().toISOString(),
            isPending: true,
        };

        setMessages((prev) => dedupeMessages([...prev, optimisticMessage]));
        setInput("");
        stopTyping();

        try {
            const sentMessage = await sendTeamChatMessage({
                scopeType: activeChatType,
                scopeId: currentScopeId,
                content,
            });

            setMessages((prev) =>
                dedupeMessages(
                    prev.map((message) =>
                        message.id === optimisticMessage.id ? sentMessage : message
                    )
                )
            );
        } catch (error) {
            console.error("Failed to send message", error);
            setMessages((prev) =>
                prev.filter((message) => message.id !== optimisticMessage.id)
            );
        }
    };

    useEffect(() => {
        stopTyping();
        setTypingUsers([]);
    }, [currentScopeId, stopTyping]);

    const [userDetailsOpen, setUserDetailsOpen] = useState(false);

    // Create Group State
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [createGroupError, setCreateGroupError] = useState<string | null>(null);

    const handleCreateGroup = async () => {
        if (!newGroupName.trim() || selectedUserIds.length === 0 || !currentUserIdString) return;

        setCreateGroupError(null);
        setIsCreatingGroup(true);

        try {
            const memberIds = Array.from(new Set([...selectedUserIds, currentUserIdString]));

            const channel = await createTeamChatChannel({
                name: newGroupName.trim(),
                type: "private",
                member_ids: memberIds,
            });

            setChannels((prev) => [...prev, channel]);
            setActiveChatId(channel.id);
            setActiveChatType("channel");

            setNewGroupName("");
            setSelectedUserIds([]);
            setIsCreateGroupOpen(false);
        } catch (error) {
            console.error("Failed to create channel", error);
            setCreateGroupError("Unable to create group. Please try again.");
        } finally {
            setIsCreatingGroup(false);
        }
    };

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleLoadOlder = () => {
        if (isFetchingOlder || !messagesHasMore) return;
        const nextOffset = messagesOffset + MESSAGES_PAGE_SIZE;
        loadMessages({ offset: nextOffset, append: true });
    };

    const filteredUsers = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return users
            .filter((user) => user.id !== currentUserIdString)
            .filter((user) => user.name.toLowerCase().includes(query));
    }, [users, searchQuery, currentUserIdString]);

    const filteredChannels = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return channels.filter((channel) => channel.name.toLowerCase().includes(query));
    }, [channels, searchQuery]);

    const typingText = useMemo(() => {
        if (typingUsers.length === 0) return "";
        const names = typingUsers
            .map((id) => users.find((user) => user.id === id)?.name)
            .filter((name): name is string => Boolean(name));
        if (names.length === 0) return "";
        const verb = names.length > 1 ? "are" : "is";
        return `${names.join(", ")} ${verb} typing...`;
    }, [typingUsers, users]);

    if (!mounted) return null;

    return (
        <>

            <TooltipProvider disableHoverableContent>
                <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                        <div className="relative mr-2" onClick={() => setIsOpen(!isOpen)}>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-md opacity-50" />
                            <div className="relative w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Team Chat</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            {/* User/Group Details Dialog */}
            <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
                <DialogContent className="sm:max-w-[350px]">
                    <DialogHeader>
                        <DialogTitle>{activeChatType === "channel" ? "Group Info" : "User Profile"}</DialogTitle>
                    </DialogHeader>

                    {/* User Profile View */}
                    {activeChatType === "dm" && activeItem && (
                        <div className="flex flex-col items-center py-6 gap-4">
                            <div className="relative">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={(activeItem as User).avatar || undefined} />
                                    <AvatarFallback className="text-2xl">{(activeItem as User).name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className={cn(
                                    "absolute bottom-1 right-1 h-4 w-4 rounded-full ring-2 ring-background",
                                    (activeItem as User).status === "online" ? "bg-green-500" :
                                        (activeItem as User).status === "busy" ? "bg-red-500" : "bg-gray-400"
                                )} />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-semibold">{(activeItem as User).name}</h3>
                                <p className="text-sm text-muted-foreground capitalize">{(activeItem as User).status}</p>
                            </div>
                            <div className="w-full space-y-3 mt-2">
                                <div className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded-md">
                                    <span className="text-muted-foreground">Email</span>
                                    <span className="font-medium">{(activeItem as User).email || "N/A"}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded-md">
                                    <span className="text-muted-foreground">Local Time</span>
                                    <span className="font-medium">
                                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Group Info View */}
                    {activeChatType === "channel" && activeItem && (
                        <div className="flex flex-col py-4 gap-4">
                            <div className="flex items-center gap-3 pb-4 border-b">
                                <div className="relative w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                                    <Hash className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">{(activeItem as Channel).name}</h3>
                                    <p className="text-sm text-muted-foreground">{(activeItem as Channel).members.length} members</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Members</Label>
                                <ScrollArea className="h-[200px] pr-4">
                                    <div className="space-y-2">
                                        {(activeItem as Channel).members.map(memberId => {
                                            const member = users.find(u => u.id === memberId);
                                            if (!member) return null;
                                            return (
                                                <div key={member.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={member.avatar || undefined} />
                                                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium">{member.name}</div>
                                                        <div className="text-xs text-muted-foreground capitalize">{member.status}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button className="w-full" onClick={() => setUserDetailsOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Group Dialog */}
            <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create New Group</DialogTitle>
                        <DialogDescription>
                            Create a new group chat and add members.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Group Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Marketing Team"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Add Members</Label>
                            <ScrollArea className="h-[200px] border rounded-md p-2">
                                <div className="space-y-2">
                                    {users.map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-md cursor-pointer"
                                            onClick={() => toggleUserSelection(user.id)}>
                                            <Checkbox
                                                id={`user-${user.id}`}
                                                checked={selectedUserIds.includes(user.id)}
                                                onCheckedChange={() => toggleUserSelection(user.id)}
                                            />
                                            <label
                                                htmlFor={`user-${user.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={user.avatar || undefined} />
                                                    <AvatarFallback className="text-[10px]">{user.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                {user.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                    {createGroupError && (
                        <p className="text-xs text-destructive px-1">{createGroupError}</p>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateGroupOpen(false)} disabled={isCreatingGroup}>Cancel</Button>
                        <Button
                            onClick={handleCreateGroup}
                            disabled={!newGroupName.trim() || selectedUserIds.length === 0 || isCreatingGroup}>
                            {isCreatingGroup ? "Creating..." : "Create Group"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div
                        className={`fixed top-0 right-0 h-full w-full md:w-[800px] bg-background shadow-2xl z-50 transform transition-transform duration-300 ease-out flex ${isOpen ? "translate-x-0" : "translate-x-full"
                            }`}>

                        {/* Sidebar */}
                        <div className="w-[240px] border-r bg-muted/10 flex flex-col">
                            <div className="p-4 border-b h-[60px] flex items-center justify-between">
                                <h2 className="font-semibold">Team Chat</h2>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setIsCreateGroupOpen(true)}>
                                            <Users className="mr-2 h-4 w-4" />
                                            New Group
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div className="p-3">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search..."
                                        className="pl-8 h-9 bg-background"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <ScrollArea className="flex-1">
                                <div className="p-3 space-y-6">
                                    {/* Channels Section */}
                                    <div className="space-y-1">
                                        <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
                                            Groups
                                            <Plus className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => setIsCreateGroupOpen(true)} />
                                        </div>
                                        {channelsLoading ? (
                                            <p className="px-2 text-xs text-muted-foreground">Loading channels...</p>
                                        ) : channelsError ? (
                                            <p className="px-2 text-xs text-destructive">{channelsError}</p>
                                        ) : filteredChannels.length > 0 ? (
                                            filteredChannels.map(channel => (
                                                <button
                                                    key={channel.id}
                                                    onClick={() => {
                                                        setActiveChatId(channel.id);
                                                        setActiveChatType("channel");
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                                                        activeChatId === channel.id && activeChatType === "channel"
                                                            ? "bg-primary/10 text-primary font-medium"
                                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                                    )}>
                                                    <Hash className="h-4 w-4 opacity-70" />
                                                    {channel.name}
                                                </button>
                                            ))
                                        ) : (
                                            <p className="px-2 text-xs text-muted-foreground">No channels yet.</p>
                                        )}
                                    </div>

                                    {/* DMs Section */}
                                    <div className="space-y-1">
                                        <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                            Direct Messages
                                        </div>
                                        {usersLoading ? (
                                            <p className="px-2 text-xs text-muted-foreground">Loading teammates...</p>
                                        ) : usersError ? (
                                            <p className="px-2 text-xs text-destructive">{usersError}</p>
                                        ) : filteredUsers.length > 0 ? (
                                            filteredUsers.map(user => (
                                                <button
                                                    key={user.id}
                                                    onClick={() => {
                                                        setActiveChatId(user.id);
                                                        setActiveChatType("dm");
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                                                        activeChatId === user.id && activeChatType === "dm"
                                                            ? "bg-primary/10 text-primary font-medium"
                                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                                    )}>
                                                    <div className="relative">
                                                        <Avatar className="h-5 w-5">
                                                            <AvatarImage src={user.avatar || undefined} />
                                                            <AvatarFallback className="text-[10px]">{user.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <span className={cn(
                                                            "absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full ring-1 ring-background",
                                                            user.status === "online" ? "bg-green-500" :
                                                                user.status === "busy" ? "bg-red-500" : "bg-gray-400"
                                                        )} />
                                                    </div>
                                                    {user.name}
                                                </button>
                                            ))
                                        ) : (
                                            <p className="px-2 text-xs text-muted-foreground">No teammates found.</p>
                                        )}
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 flex flex-col min-w-0 bg-background h-full overflow-hidden">
                            {/* Header */}
                            <div className="h-[60px] border-b flex items-center px-6 justify-between bg-background/80 backdrop-blur-xl flex-shrink-0">
                                <div
                                    className={cn("flex items-center gap-3", "cursor-pointer hover:opacity-80")}
                                    onClick={() => setUserDetailsOpen(true)}
                                >
                                    {activeChatType === "channel" ? (
                                        <div className="relative w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <Hash className="w-4 h-4 text-primary" />
                                        </div>
                                    ) : (
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={(activeItem as User)?.avatar || undefined} />
                                            <AvatarFallback>{activeItem?.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div>
                                        <h2 className="font-semibold text-sm flex items-center gap-2">
                                            {activeItemName}
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            {activeChatType === "channel"
                                                ? `${activeChannelMemberCount ?? 0} members`
                                                : "Direct Message"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => setUserDetailsOpen(true)}>
                                        <Users className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsOpen(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Messages */}
                            <ScrollArea className="flex-1 px-6 py-4 min-h-0">
                                <div className="space-y-4">
                                    {messagesLoading && messages.length === 0 ? (
                                        <div className="flex-1 flex items-center justify-center text-center p-6 text-sm text-muted-foreground">
                                            Loading messages...
                                        </div>
                                    ) : messagesError ? (
                                        <div className="flex-1 flex items-center justify-center text-center p-6 text-sm text-destructive">
                                            {messagesError}
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-300">
                                            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6 ring-1 ring-primary/10">
                                                {activeChatType === "channel" ? (
                                                    <Hash className="h-10 w-10 text-primary/40" />
                                                ) : (
                                                    <MessageSquare className="h-10 w-10 text-primary/40" />
                                                )}
                                            </div>
                                            <h3 className="text-xl font-semibold mb-2">Welcome to {activeItemName}!</h3>
                                            <p className="text-muted-foreground max-w-xs mx-auto">
                                                This is the start of your conversation. Send a message to get things going.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {messagesHasMore && (
                                                <div className="flex justify-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleLoadOlder}
                                                        disabled={isFetchingOlder}>
                                                        {isFetchingOlder ? "Loading..." : "Load older messages"}
                                                    </Button>
                                                </div>
                                            )}
                                            <div className="space-y-4">
                                                {messages.map((m) => {
                                                    const isMe = m.senderId === currentUserIdString;
                                                    const timestamp = new Date(m.timestamp);
                                                    const formattedTimestamp = Number.isNaN(timestamp.getTime())
                                                        ? ""
                                                        : timestamp.toLocaleTimeString([], {
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        });

                                                    // Find the sender's user data to get their avatar
                                                    const sender = users.find(u => u.id === m.senderId);
                                                    const senderAvatar = sender?.avatar || null;

                                                    return (
                                                        <div
                                                            key={m.id}
                                                            className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"
                                                                }`}>
                                                            <Avatar className="h-8 w-8 mt-0.5">
                                                                <AvatarImage src={senderAvatar || undefined} />
                                                                <AvatarFallback className="text-xs">
                                                                    {m.senderName.charAt(0)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div
                                                                className={cn(
                                                                    "flex-1 px-4 py-3 rounded-2xl max-w-[80%]",
                                                                    isMe
                                                                        ? "bg-primary text-primary-foreground ml-auto rounded-tr-none"
                                                                        : "bg-muted/50 border mr-auto rounded-tl-none",
                                                                    m.isPending ? "opacity-70" : ""
                                                                )}>
                                                                {!isMe && (
                                                                    <p className="text-xs text-muted-foreground mb-1 font-medium">
                                                                        {m.senderName}
                                                                    </p>
                                                                )}
                                                                <p className="text-sm leading-relaxed">{m.content}</p>
                                                                {formattedTimestamp && (
                                                                    <span
                                                                        className={`text-[10px] mt-1 block opacity-70 ${isMe ? "text-primary-foreground" : "text-muted-foreground"
                                                                            }`}>
                                                                        {formattedTimestamp}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </ScrollArea>
                            {typingText && (
                                <div className="px-6 text-xs text-muted-foreground pb-2">
                                    {typingText}
                                </div>
                            )}

                            {/* Input */}
                            <div className="border-t bg-background/80 backdrop-blur-xl p-4 flex-shrink-0">
                                <div className="flex gap-2">
                                    <div className="flex-1 relative">
                                        <textarea
                                            ref={inputRef}
                                            value={input}
                                            onChange={(e) => handleInputChange(e.target.value)}
                                            placeholder={`Message ${activeItemName}...`}
                                            className="w-full px-4 py-3 pr-12 rounded-xl border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            rows={1}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-2 h-8 w-8 rounded-lg">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!input.trim() || !currentScopeId}
                                        className="h-12 w-12 rounded-xl transition-all hover:scale-105"
                                        size="icon">
                                        <Send className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default TeamChatDrawer;
