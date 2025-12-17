"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
    MessageSquare,
    PlayCircle,
    StopCircle,
    GitBranch,
    Code,
    Zap,
    Users,
    Mail,
    Ticket,
    Globe,
    FileText,
    Search,
    Repeat,
    Split,
    Clock,
    Link,
    Database,
    Braces,
} from "lucide-react";

const NODE_CATEGORIES: Array<{
    title: string;
    items: Array<{
        type: string;
        subType?: string;
        label: string;
        icon: any;
        color: string;
    }>;
}> = [
        {
            title: "Triggers",
            items: [
                { type: "input", subType: "webhook", label: "Webhook", icon: Globe, color: "text-green-500" },
                { type: "input", subType: "form_submit", label: "Form Submission", icon: FileText, color: "text-green-500" },
                { type: "input", subType: "schedule", label: "Schedule", icon: PlayCircle, color: "text-green-500" },
            ],
        },
        {
            title: "Control Flow",
            items: [
                { type: "control", subType: "loop", label: "Loop", icon: Repeat, color: "text-orange-500" },
                { type: "control", subType: "switch", label: "Switch", icon: Split, color: "text-orange-500" },
                { type: "control", subType: "delay", label: "Wait / Delay", icon: Clock, color: "text-orange-500" },
            ],
        },
        {
            title: "CRM",
            items: [
                { type: "process", subType: "create_lead", label: "Create Lead", icon: Users, color: "text-blue-500" },
                { type: "process", subType: "update_contact", label: "Update Contact", icon: Users, color: "text-blue-500" },
            ],
        },
        {
            title: "Messaging",
            items: [
                { type: "process", subType: "send_email", label: "Send Email", icon: Mail, color: "text-orange-500" },
                { type: "process", subType: "send_whatsapp", label: "Send WhatsApp", icon: MessageSquare, color: "text-green-600" },
            ],
        },
        {
            title: "Support",
            items: [
                { type: "process", subType: "create_ticket", label: "Create Ticket", icon: Ticket, color: "text-purple-500" },
            ],
        },
        {
            title: "Integration",
            items: [
                { type: "integration", subType: "http_request", label: "HTTP Request", icon: Link, color: "text-indigo-500" },
            ],
        },
        {
            title: "Data",
            items: [
                { type: "data", subType: "json_transform", label: "JSON Transform", icon: Braces, color: "text-gray-500" },
                { type: "data", subType: "db_query", label: "DB Query", icon: Database, color: "text-gray-500" },
            ],
        },
        {
            title: "Logic",
            items: [
                { type: "condition", label: "Condition", icon: GitBranch, color: "text-gray-500" },
                { type: "output", label: "End Flow", icon: StopCircle, color: "text-red-500" },
            ],
        },
    ];

export default function Sidebar({ workflowName }: { workflowName?: string }) {
    const [searchTerm, setSearchTerm] = useState("");

    const onDragStart = (event: React.DragEvent, nodeType: string, subType?: string) => {
        const data = subType ? `${nodeType}:${subType}` : nodeType;
        event.dataTransfer.setData("application/reactflow", data);
        event.dataTransfer.effectAllowed = "move";
    };

    const filteredCategories = NODE_CATEGORIES.map((category) => ({
        ...category,
        items: category.items.filter((item) =>
            item.label.toLowerCase().includes(searchTerm.toLowerCase())
        ),
    })).filter((category) => category.items.length > 0);

    return (
        <aside className="w-[250px] border-r bg-background flex flex-col h-full">
            <div className="p-4 border-b space-y-4">
                <div>
                    <h2 className="font-semibold">{workflowName}</h2>
                    <p className="text-xs text-muted-foreground">Drag nodes to the canvas</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search nodes..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <ScrollArea className="flex-1 h-0">
                <div className="p-4 space-y-6">
                    {filteredCategories.map((category) => (
                        <div key={category.title} className="space-y-2">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {category.title}
                            </h3>
                            {category.items.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex items-center gap-2 p-3 border rounded-md cursor-grab hover:bg-accent transition-colors"
                                    onDragStart={(event) => onDragStart(event, item.type, item.subType)}
                                    draggable
                                >
                                    <item.icon className={`w-4 h-4 ${item.color}`} />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                    {filteredCategories.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-4">
                            No nodes found
                        </div>
                    )}
                </div>
            </ScrollArea>
        </aside>
    );
}
