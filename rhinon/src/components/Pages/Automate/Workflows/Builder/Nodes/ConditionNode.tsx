"use client";

import { Handle, Position } from "@xyflow/react";
import { GitBranch } from "lucide-react";

export default function ConditionNode({ data }: { data: any }) {
    return (
        <div className="px-4 py-2 shadow-md rounded-md bg-background border-2 border-blue-500 min-w-[150px]">
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 bg-blue-500"
            />
            <div className="flex items-center">
                <div className="rounded-full w-8 h-8 flex items-center justify-center bg-blue-100 mr-2">
                    <GitBranch className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-2">
                    <div className="text-sm font-bold">{data.label}</div>
                    <div className="text-xs text-muted-foreground">
                        {data.expression || "Condition"}
                    </div>
                </div>
            </div>
            {/* True Branch */}
            <div className="absolute -right-3 top-4 flex items-center">
                <span className="absolute right-4 text-[10px] text-green-600 font-bold">T</span>
                <Handle
                    type="source"
                    position={Position.Right}
                    id="true"
                    className="w-3 h-3 bg-green-500"
                    style={{ top: 0, position: 'relative' }}
                />
            </div>
            {/* False Branch */}
            <div className="absolute -right-3 bottom-4 flex items-center">
                <span className="absolute right-4 text-[10px] text-red-600 font-bold">F</span>
                <Handle
                    type="source"
                    position={Position.Right}
                    id="false"
                    className="w-3 h-3 bg-red-500"
                    style={{ top: 0, position: 'relative' }}
                />
            </div>
        </div>
    );
}
