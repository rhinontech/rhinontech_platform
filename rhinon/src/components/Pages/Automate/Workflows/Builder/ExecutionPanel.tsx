"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, Terminal } from "lucide-react";

interface ExecutionPanelProps {
    logs: string[];
    isOpen: boolean;
    onClose: () => void;
}

export default function ExecutionPanel({
    logs,
    isOpen,
    onClose,
}: ExecutionPanelProps) {
    if (!isOpen) return null;

    return (
        <div className="absolute bottom-0 left-0 right-0 h-[200px] border-t bg-background z-10">
            <div className="p-3 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    <h3 className="font-semibold text-sm">Execution Logs</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="w-4 h-4" />
                </Button>
            </div>
            <ScrollArea className="h-[calc(100%-48px)]">
                <div className="p-3 font-mono text-xs space-y-1">
                    {logs.length === 0 ? (
                        <div className="text-muted-foreground">
                            No execution logs yet. Click "Run" to start.
                        </div>
                    ) : (
                        logs.map((log, index) => (
                            <div key={index} className="text-foreground">
                                <span className="text-muted-foreground mr-2">
                                    [{new Date().toLocaleTimeString()}]
                                </span>
                                {log}
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
