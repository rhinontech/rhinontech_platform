"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { workflowStorage, SavedWorkflow, WorkflowMetadata } from "@/lib/workflowStorage";
import { toast } from "sonner";
import { FileDown, FileUp, Copy, Trash2, FolderOpen } from "lucide-react";

interface WorkflowManagerProps {
    isOpen: boolean;
    onClose: () => void;
    onLoad: (workflow: SavedWorkflow) => void;
    currentWorkflow?: { nodes: any[]; edges: any[] };
}

export default function WorkflowManager({
    isOpen,
    onClose,
    onLoad,
    currentWorkflow,
}: WorkflowManagerProps) {
    const [workflows, setWorkflows] = useState<SavedWorkflow[]>(workflowStorage.getAll());
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [workflowName, setWorkflowName] = useState("");
    const [workflowDescription, setWorkflowDescription] = useState("");
    const [workflowCategory, setWorkflowCategory] = useState("General");

    const refreshWorkflows = () => {
        setWorkflows(workflowStorage.getAll());
    };

    const handleSave = () => {
        if (!workflowName.trim()) {
            toast.error("Please enter a workflow name");
            return;
        }

        if (!currentWorkflow) {
            toast.error("No workflow to save");
            return;
        }

        const newWorkflow: SavedWorkflow = {
            metadata: {
                id: `workflow_${Date.now()}`,
                name: workflowName,
                description: workflowDescription,
                version: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                category: workflowCategory,
                isTemplate: false,
                status: "draft"
            },
            flow: {
                nodes: currentWorkflow.nodes,
                edges: currentWorkflow.edges,
            },
        };

        workflowStorage.save(newWorkflow);
        refreshWorkflows();
        setShowSaveDialog(false);
        setWorkflowName("");
        setWorkflowDescription("");
        toast.success("Workflow saved successfully!");
    };

    const handleLoad = (workflow: SavedWorkflow) => {
        onLoad(workflow);
        onClose();
        toast.success(`Loaded: ${workflow.metadata.name}`);
    };

    const handleDuplicate = (id: string) => {
        const duplicated = workflowStorage.duplicate(id);
        if (duplicated) {
            refreshWorkflows();
            toast.success("Workflow duplicated");
        }
    };

    const handleDelete = (id: string) => {
        workflowStorage.delete(id);
        refreshWorkflows();
        toast.success("Workflow deleted");
    };

    const handleExport = (id: string) => {
        const json = workflowStorage.export(id);
        if (json) {
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `workflow_${id}.json`;
            a.click();
            toast.success("Workflow exported");
        }
    };

    const handleImport = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const imported = workflowStorage.import(event.target?.result as string);
                    if (imported) {
                        refreshWorkflows();
                        toast.success("Workflow imported");
                    } else {
                        toast.error("Failed to import workflow");
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-3xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Workflow Manager</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Button onClick={() => setShowSaveDialog(true)} className="flex-1">
                                Save Current Workflow
                            </Button>
                            <Button onClick={handleImport} variant="outline">
                                <FileUp className="w-4 h-4 mr-2" />
                                Import
                            </Button>
                        </div>

                        <ScrollArea className="h-[400px] border rounded-md p-4">
                            {workflows.length === 0 ? (
                                <div className="text-center text-muted-foreground py-8">
                                    No saved workflows yet
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {workflows.map((workflow) => (
                                        <div
                                            key={workflow.metadata.id}
                                            className="border rounded-md p-4 hover:bg-accent transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold">{workflow.metadata.name}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {workflow.metadata.description || "No description"}
                                                    </p>
                                                    <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                                                        <span>v{workflow.metadata.version}</span>
                                                        <span>•</span>
                                                        <span>{workflow.metadata.category}</span>
                                                        <span>•</span>
                                                        <span>{new Date(workflow.metadata.updatedAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleLoad(workflow)}
                                                        title="Load"
                                                    >
                                                        <FolderOpen className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleDuplicate(workflow.metadata.id)}
                                                        title="Duplicate"
                                                    >
                                                        <Copy className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleExport(workflow.metadata.id)}
                                                        title="Export"
                                                    >
                                                        <FileDown className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleDelete(workflow.metadata.id)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Workflow</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Name *</Label>
                            <Input
                                value={workflowName}
                                onChange={(e) => setWorkflowName(e.target.value)}
                                placeholder="My Workflow"
                            />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea
                                value={workflowDescription}
                                onChange={(e) => setWorkflowDescription(e.target.value)}
                                placeholder="Describe what this workflow does..."
                                rows={3}
                            />
                        </div>
                        <div>
                            <Label>Category</Label>
                            <Select value={workflowCategory} onValueChange={setWorkflowCategory}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="General">General</SelectItem>
                                    <SelectItem value="CRM">CRM</SelectItem>
                                    <SelectItem value="Support">Support</SelectItem>
                                    <SelectItem value="Marketing">Marketing</SelectItem>
                                    <SelectItem value="Sales">Sales</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave}>Save</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
