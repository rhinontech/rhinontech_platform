"use client";

import { Handle, Position } from "@xyflow/react";
import { Split } from "lucide-react";

export default function SwitchNode({ data }: { data: any }) {
    return (
        <div className="px-4 py-2 shadow-md rounded-md bg-background border-2 border-orange-500 min-w-[150px] relative">
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 bg-orange-500"
            />
            <div className="flex items-center">
                <div className="rounded-full w-8 h-8 flex items-center justify-center bg-orange-100 mr-2">
                    <Split className="w-5 h-5 text-orange-600" />
                </div>
                <div className="ml-2">
                    <div className="text-sm font-bold">{data.label}</div>
                    <div className="text-xs text-muted-foreground">
                        {data.cases || "Switch"}
                    </div>
                </div>
            </div>
            {/* Multiple output handles for switch cases */}
            <Handle
                type="source"
                position={Position.Right}
                id="case1"
                className="w-3 h-3 bg-orange-500"
                style={{ top: '30%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="case2"
                className="w-3 h-3 bg-orange-500"
                style={{ top: '50%' }}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="default"
                className="w-3 h-3 bg-gray-500"
                style={{ top: '70%' }}
            />
        </div>
    );
}
