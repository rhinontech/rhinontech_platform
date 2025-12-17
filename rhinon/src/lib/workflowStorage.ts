import { Node, Edge } from "@xyflow/react";

export interface WorkflowMetadata {
    id: string;
    name: string;
    description: string;
    version: number;
    createdAt: string;
    updatedAt: string;
    category: string;
    isTemplate: boolean;
    status: 'draft' | 'active';
}

export interface SavedWorkflow {
    metadata: WorkflowMetadata;
    flow: {
        nodes: Node[];
        edges: Edge[];
        viewport?: { x: number; y: number; zoom: number };
    };
}

const STORAGE_KEY = "rhinon-workflows";

export const workflowStorage = {
    // Get all workflows
    getAll(): SavedWorkflow[] {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    },

    // Get workflow by ID
    getById(id: string): SavedWorkflow | null {
        const workflows = this.getAll();
        return workflows.find((w) => w.metadata.id === id) || null;
    },

    // Get next available workflow ID
    getNextId(): number {
        const workflows = this.getAll();
        const ids = workflows
            .map((w) => {
                const match = w.metadata.id.match(/^workflow-(\d+)$/);
                return match ? parseInt(match[1]) : 0;
            })
            .filter((id) => id > 0);
        return ids.length > 0 ? Math.max(...ids) + 1 : 1;
    },

    // Create a new draft workflow
    createDraft(): SavedWorkflow {
        const id = this.getNextId();
        const workflow: SavedWorkflow = {
            metadata: {
                id: `workflow-${id}`,
                name: `Untitled Workflow ${id}`,
                description: "",
                version: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                category: "General",
                isTemplate: false,
                status: 'draft',
            },
            flow: {
                nodes: [],
                edges: [],
            },
        };
        this.save(workflow);
        return workflow;
    },

    // Save new workflow or update existing
    save(workflow: SavedWorkflow): void {
        const workflows = this.getAll();
        const existingIndex = workflows.findIndex(
            (w) => w.metadata.id === workflow.metadata.id
        );

        if (existingIndex >= 0) {
            // Update existing
            workflows[existingIndex] = {
                ...workflow,
                metadata: {
                    ...workflow.metadata,
                    version: workflow.metadata.version + 1,
                    updatedAt: new Date().toISOString(),
                },
            };
        } else {
            // Add new
            workflows.push(workflow);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
    },

    // Delete workflow
    delete(id: string): void {
        const workflows = this.getAll().filter((w) => w.metadata.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
    },

    // Duplicate workflow
    duplicate(id: string): SavedWorkflow | null {
        const original = this.getById(id);
        if (!original) return null;

        const newId = this.getNextId();
        const duplicate: SavedWorkflow = {
            metadata: {
                ...original.metadata,
                id: `workflow-${newId}`,
                name: `${original.metadata.name} (Copy)`,
                version: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isTemplate: false,
                status: 'draft',
            },
            flow: { ...original.flow },
        };

        this.save(duplicate);
        return duplicate;
    },

    // Export workflow as JSON
    export(id: string): string | null {
        const workflow = this.getById(id);
        return workflow ? JSON.stringify(workflow, null, 2) : null;
    },

    // Import workflow from JSON
    import(jsonString: string): SavedWorkflow | null {
        try {
            const workflow: SavedWorkflow = JSON.parse(jsonString);
            const newId = this.getNextId();
            workflow.metadata.id = `workflow-${newId}`;
            workflow.metadata.createdAt = new Date().toISOString();
            workflow.metadata.updatedAt = new Date().toISOString();
            workflow.metadata.status = 'draft';
            this.save(workflow);
            return workflow;
        } catch (error) {
            console.error("Failed to import workflow:", error);
            return null;
        }
    },

    // Get templates only
    getTemplates(): SavedWorkflow[] {
        return this.getAll().filter((w) => w.metadata.isTemplate);
    },

    // Get workflows by category
    getByCategory(category: string): SavedWorkflow[] {
        return this.getAll().filter((w) => w.metadata.category === category);
    },
};
