"use client";

import { Handle, Position } from "@xyflow/react";
import { StopCircle } from "lucide-react";

export default function OutputNode({ data }: { data: any }) {
    return (
        <div className="px-4 py-2 shadow-md rounded-md bg-background border-2 border-red-500 min-w-[150px]">
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 bg-red-500"
            />
            <div className="flex items-center">
                <div className="rounded-full w-8 h-8 flex items-center justify-center bg-red-100 mr-2">
                    <StopCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="ml-2">
                    <div className="text-sm font-bold">{data.label}</div>
                    <div className="text-xs text-muted-foreground">End</div>
                </div>
            </div>
        </div>
    );
}
