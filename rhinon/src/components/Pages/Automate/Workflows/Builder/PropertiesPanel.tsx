"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

interface PropertiesPanelProps {
    selectedNode: any; // Using any for now, will type properly with React Flow types
    onClose: () => void;
    onChange: (nodeId: string, data: any) => void;
}

const TRIGGER_TYPES = [
    "Webhook",
    "Form Submission",
    "Schedule",
    "New Lead Created",
    "Deal Stage Changed",
    "Ticket Created",
];

const ACTION_TYPES = [
    "Create Lead",
    "Update Contact",
    "Send Email",
    "Send WhatsApp",
    "Create Ticket",
    "Assign to Agent",
    "Add Tag",
    "Remove Tag",
];

export default function PropertiesPanel({
    selectedNode,
    onClose,
    onChange,
}: PropertiesPanelProps) {
    if (!selectedNode) {
        return (
            <aside className="w-[300px] border-l bg-background flex flex-col h-full items-center justify-center text-muted-foreground p-4 text-center">
                <p>Select a node to view its properties.</p>
            </aside>
        );
    }

    const handleChange = (key: string, value: string) => {
        onChange(selectedNode.id, {
            ...selectedNode.data,
            [key]: value,
        });
    };

    return (
        <aside className="w-[300px] border-l bg-background flex flex-col h-full">
            <div className="p-4 border-b flex items-center justify-between">
                <div>
                    <h2 className="font-semibold">Properties</h2>
                    <p className="text-xs text-muted-foreground">
                        ID: {selectedNode.id}
                    </p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-4 h-4" />
                </Button>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">
                    <div className="space-y-2">
                        <Label>Label</Label>
                        <Input
                            value={selectedNode.data?.label || ""}
                            onChange={(e) => handleChange("label", e.target.value)}
                            placeholder="Node Label"
                        />
                    </div>

                    <Separator />

                    {/* Dynamic properties based on node type */}
                    {selectedNode.type === "input" && (
                        <div className="space-y-2">
                            <Label>Trigger Type</Label>
                            <Select
                                value={selectedNode.data?.triggerType || ""}
                                onValueChange={(value) => handleChange("triggerType", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select trigger" />
                                </SelectTrigger>
                                <SelectContent>
                                    {TRIGGER_TYPES.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {selectedNode.type === "condition" && (
                        <div className="space-y-2">
                            <Label>Expression</Label>
                            <Input
                                value={selectedNode.data?.expression || ""}
                                onChange={(e) => handleChange("expression", e.target.value)}
                                placeholder="e.g. data.value > 10"
                            />
                        </div>
                    )}

                    {selectedNode.type === "process" && (
                        <div className="space-y-2">
                            <Label>Action</Label>
                            <Select
                                value={selectedNode.data?.action || ""}
                                onValueChange={(value) => handleChange("action", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select action" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ACTION_TYPES.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </aside>
    );
}
