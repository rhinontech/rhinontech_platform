"use client";

import { Handle, Position } from "@xyflow/react";
import { PlayCircle } from "lucide-react";

export default function InputNode({ data }: { data: any }) {
    return (
        <div className="px-4 py-2 shadow-md rounded-md bg-background border-2 border-green-500 min-w-[150px]">
            <div className="flex items-center">
                <div className="rounded-full w-8 h-8 flex items-center justify-center bg-green-100 mr-2">
                    <PlayCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-2">
                    <div className="text-sm font-bold">{data.label}</div>
                    <div className="text-xs text-muted-foreground">
                        {data.triggerType || "Trigger"}
                    </div>
                </div>
            </div>
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 bg-green-500"
            />
        </div>
    );
}
