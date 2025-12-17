"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { workflowStorage, SavedWorkflow } from "@/lib/workflowStorage";
import WorkflowBuilder from "@/components/Pages/Automate/Workflows/Builder/WorkflowBuilder";
import { toast } from "sonner";

export default function WorkflowEditorPage() {
    const params = useParams();
    const router = useRouter();
    const [workflow, setWorkflow] = useState<SavedWorkflow | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const id = params.id as string;
        const loadedWorkflow = workflowStorage.getById(id);

        if (!loadedWorkflow) {
            toast.error("Workflow not found");
            router.push("/superadmin/automate/workflows");
            return;
        }

        setWorkflow(loadedWorkflow);
        setLoading(false);
    }, [params.id, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">Loading workflow...</div>
            </div>
        );
    }

    if (!workflow) {
        return null;
    }

    return (
        <div className="h-full w-full bg-background">
            <WorkflowBuilder workflowId={params.id as string} initialWorkflow={workflow} />
        </div>
    );
}
