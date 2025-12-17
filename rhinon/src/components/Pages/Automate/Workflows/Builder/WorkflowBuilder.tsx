"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Connection,
  Edge,
  Node,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import Sidebar from "./Sidebar";
import PropertiesPanel from "./PropertiesPanel";
import ExecutionPanel from "./ExecutionPanel";
import WorkflowManager from "./WorkflowManager";
import TemplateGallery from "./TemplateGallery";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Save,
  Upload,
  Play,
  Network,
  SkipForward,
  FolderOpen,
  Lightbulb,
  ArrowLeft,
  Check,
} from "lucide-react";
import ConditionNode from "./Nodes/ConditionNode";
import InputNode from "./Nodes/InputNode";
import OutputNode from "./Nodes/OutputNode";
import ProcessNode from "./Nodes/ProcessNode";
import LoopNode from "./Nodes/Control/LoopNode";
import SwitchNode from "./Nodes/Control/SwitchNode";
import DelayNode from "./Nodes/Control/DelayNode";
import HttpRequestNode from "./Nodes/Integration/HttpRequestNode";
import { workflowStorage, SavedWorkflow } from "@/lib/workflowStorage";

const nodeTypes = {
  input: InputNode,
  process: ProcessNode,
  condition: ConditionNode,
  output: OutputNode,
  control: LoopNode,
  integration: HttpRequestNode,
  data: ProcessNode, // Using ProcessNode as placeholder for data nodes
};

const initialNodes: Node[] = [
  {
    id: "1",
    type: "input",
    data: { label: "Start" },
    position: { x: 250, y: 5 },
  },
];

let id = 0;
const getId = () => `dndnode_${id++}`;

interface WorkflowBuilderContentProps {
  workflowId?: string;
  initialWorkflow?: SavedWorkflow;
}

const WorkflowBuilderContent = ({
  workflowId,
  initialWorkflow,
}: WorkflowBuilderContentProps) => {
  const router = useRouter();
  const params = useParams();
  const role = (params as any).role || "";
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialWorkflow?.flow.nodes || initialNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    initialWorkflow?.flow.edges || []
  );
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [copiedNodes, setCopiedNodes] = useState<Node[]>([]);
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>(
    []
  );
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [executionLogs, setExecutionLogs] = useState<string[]>([]);
  const [isExecutionPanelOpen, setIsExecutionPanelOpen] = useState(false);
  const [isStepByStep, setIsStepByStep] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [executionQueue, setExecutionQueue] = useState<Node[]>([]);
  const [isWorkflowManagerOpen, setIsWorkflowManagerOpen] = useState(false);
  const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const data = event.dataTransfer.getData("application/reactflow");

      // check if the dropped element is valid
      if (typeof data === "undefined" || !data) {
        return;
      }

      const [type, subType] = data.split(":");

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let label = `${type} node`;
      let nodeData: any = { label };

      // Preset logic
      if (subType) {
        switch (subType) {
          case "webhook":
            label = "Webhook";
            nodeData = { label, triggerType: "Webhook" };
            break;
          case "form_submit":
            label = "Form Submission";
            nodeData = { label, triggerType: "Form Submission" };
            break;
          case "schedule":
            label = "Schedule";
            nodeData = { label, triggerType: "Schedule" };
            break;
          case "create_lead":
            label = "Create Lead";
            nodeData = { label, action: "Create Lead" };
            break;
          case "update_contact":
            label = "Update Contact";
            nodeData = { label, action: "Update Contact" };
            break;
          case "send_email":
            label = "Send Email";
            nodeData = { label, action: "Send Email" };
            break;
          case "send_whatsapp":
            label = "Send WhatsApp";
            nodeData = { label, action: "Send WhatsApp" };
            break;
          case "create_ticket":
            label = "Create Ticket";
            nodeData = { label, action: "Create Ticket" };
            break;
          case "loop":
            label = "Loop";
            nodeData = { label, iterations: "10" };
            break;
          case "switch":
            label = "Switch";
            nodeData = { label, cases: "3 cases" };
            break;
          case "delay":
            label = "Wait / Delay";
            nodeData = { label, duration: "5s" };
            break;
          case "http_request":
            label = "HTTP Request";
            nodeData = { label, method: "GET" };
            break;
          case "json_transform":
            label = "JSON Transform";
            nodeData = { label, transform: "Map" };
            break;
          case "db_query":
            label = "DB Query";
            nodeData = { label, query: "SELECT" };
            break;
        }
      } else {
        // Fallback for generic nodes
        if (type === "condition") label = "Condition";
        if (type === "output") label = "End Flow";
        nodeData = { label };
      }

      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: nodeData,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleNodeChange = (nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data };
        }
        return node;
      })
    );
    setSelectedNode((prev) => (prev?.id === nodeId ? { ...prev, data } : prev));
  };

  const onSave = useCallback((): string | undefined => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();

      // If we have an existing workflow (editing), persist via workflowStorage to bump version
      if (workflowId && initialWorkflow) {
        const updatedWorkflow: SavedWorkflow = {
          ...initialWorkflow,
          flow: {
            nodes: flow.nodes || [],
            edges: flow.edges || [],
            viewport: flow.viewport || { x: 0, y: 0, zoom: 1 },
          },
        };
        workflowStorage.save(updatedWorkflow);
        toast.success("Workflow saved successfully!");
        console.log(updatedWorkflow.metadata.id);
        
        return updatedWorkflow.metadata.id;
      }

      // Fallback: save a transient copy to localStorage
      localStorage.setItem("rhinon-workflow", JSON.stringify(flow));
      toast.success("Workflow saved locally!");
    }
    return undefined;
  }, [reactFlowInstance, workflowId, initialWorkflow]);

  const onSaveAndExit = useCallback(() => {
    const savedId = onSave();
    if (savedId) {
      router.push(`/${role}/automate/workflows`);
    }
  }, [onSave, router, role]);

  const onRestore = useCallback(() => {
    const restoreFlow = async () => {
      const flow = JSON.parse(
        localStorage.getItem("rhinon-workflow") || "null"
      );

      if (flow) {
        const { x = 0, y = 0, zoom = 1 } = flow.viewport;
        setNodes(flow.nodes || []);
        setEdges(flow.edges || []);
        // setViewport({ x, y, zoom }); // viewport restoration needs useReactFlow hook or instance method
        toast.success("Workflow loaded successfully!");
      } else {
        toast.error("No saved workflow found.");
      }
    };

    restoreFlow();
  }, [setNodes, setEdges]);

  const onRun = useCallback(() => {
    setIsExecutionPanelOpen(true);
    setExecutionLogs(["Workflow execution started..."]);
    toast.info("Workflow execution simulation started...");

    // Simple BFS traversal for simulation
    const adjacencyList: Record<string, string[]> = {};
    edges.forEach((edge) => {
      if (!adjacencyList[edge.source]) {
        adjacencyList[edge.source] = [];
      }
      adjacencyList[edge.source].push(edge.target);
    });

    const startNodes = nodes.filter((node) => node.type === "input");
    const queue = [...startNodes];
    const visited = new Set<string>();
    const executionOrder: string[] = [];

    setExecutionLogs((prev) => [
      ...prev,
      `Found ${startNodes.length} start node(s)`,
    ]);

    while (queue.length > 0) {
      const currentNode = queue.shift();
      if (!currentNode || visited.has(currentNode.id)) continue;

      visited.add(currentNode.id);
      executionOrder.push(currentNode.id);

      setExecutionLogs((prev) => [
        ...prev,
        `Executing: ${currentNode.data.label} (${currentNode.type})`,
      ]);

      // Highlight node
      setNodes((nds) =>
        nds.map((n) =>
          n.id === currentNode.id
            ? {
                ...n,
                style: {
                  ...n.style,
                  border: "2px solid #22c55e",
                  boxShadow: "0 0 10px #22c55e",
                },
              }
            : n
        )
      );

      const neighbors = adjacencyList[currentNode.id] || [];
      neighbors.forEach((neighborId) => {
        const neighborNode = nodes.find((n) => n.id === neighborId);
        if (neighborNode) {
          queue.push(neighborNode);
        }
      });
    }

    // Reset styles after simulation
    setTimeout(() => {
      setNodes((nds) =>
        nds.map((n) => {
          const { style, ...rest } = n;
          // Remove the specific highlight styles but keep others if any
          const newStyle = { ...style };
          delete newStyle.border;
          delete newStyle.boxShadow;
          return { ...n, style: newStyle };
        })
      );
      setExecutionLogs((prev) => [
        ...prev,
        `Workflow completed! Processed ${executionOrder.length} nodes.`,
      ]);
      toast.success(
        `Workflow executed! Processed ${executionOrder.length} nodes.`
      );
    }, 2000);
  }, [nodes, edges, setNodes]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? event.metaKey : event.ctrlKey;

      // Copy (Ctrl/Cmd + C)
      if (modifier && event.key === "c" && selectedNode) {
        event.preventDefault();
        setCopiedNodes([selectedNode]);
        toast.success("Node copied");
      }

      // Paste (Ctrl/Cmd + V)
      if (modifier && event.key === "v" && copiedNodes.length > 0) {
        event.preventDefault();
        const newNodes = copiedNodes.map((node) => ({
          ...node,
          id: getId(),
          position: {
            x: node.position.x + 50,
            y: node.position.y + 50,
          },
        }));
        setNodes((nds) => [...nds, ...newNodes]);
        toast.success("Node pasted");
      }

      // Delete (Delete/Backspace)
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedNode
      ) {
        event.preventDefault();
        setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
        setEdges((eds) =>
          eds.filter(
            (e) => e.source !== selectedNode.id && e.target !== selectedNode.id
          )
        );
        setSelectedNode(null);
        toast.success("Node deleted");
      }

      // Undo (Ctrl/Cmd + Z)
      if (
        modifier &&
        event.key === "z" &&
        !event.shiftKey &&
        historyIndex > 0
      ) {
        event.preventDefault();
        const prevState = history[historyIndex - 1];
        setNodes(prevState.nodes);
        setEdges(prevState.edges);
        setHistoryIndex(historyIndex - 1);
        toast.success("Undo");
      }

      // Redo (Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y)
      if (
        (modifier && event.shiftKey && event.key === "z") ||
        (modifier && event.key === "y")
      ) {
        if (historyIndex < history.length - 1) {
          event.preventDefault();
          const nextState = history[historyIndex + 1];
          setNodes(nextState.nodes);
          setEdges(nextState.edges);
          setHistoryIndex(historyIndex + 1);
          toast.success("Redo");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNode, copiedNodes, history, historyIndex, setNodes, setEdges]);

  // Save history on changes
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      setHistory((prev) => [
        ...prev.slice(0, historyIndex + 1),
        { nodes, edges },
      ]);
      setHistoryIndex((prev) => prev + 1);
    }
  }, [nodes, edges]);

  // Auto-save workflow
  useEffect(() => {
    if (
      workflowId &&
      initialWorkflow &&
      (nodes.length > 0 || edges.length > 0)
    ) {
      const saveTimeout = setTimeout(() => {
        const updatedWorkflow: SavedWorkflow = {
          ...initialWorkflow,
          flow: {
            nodes,
            edges,
          },
        };
        workflowStorage.save(updatedWorkflow);
      }, 1000); // Debounce auto-save by 1 second

      return () => clearTimeout(saveTimeout);
    }
  }, [nodes, edges, workflowId, initialWorkflow]);

  // Auto-layout function
  const onAutoLayout = useCallback(() => {
    const dagre = require("dagre");
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: "LR", nodesep: 100, ranksep: 150 });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 150, height: 80 });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 75,
          y: nodeWithPosition.y - 40,
        },
      };
    });

    setNodes(layoutedNodes);
    toast.success("Auto-layout applied");
  }, [nodes, edges, setNodes]);

  const handleLoadWorkflow = useCallback(
    (workflow: any) => {
      setNodes(workflow.flow.nodes || []);
      setEdges(workflow.flow.edges || []);
      toast.success(`Loaded: ${workflow.metadata.name}`);
    },
    [setNodes, setEdges]
  );

  const handleUseTemplate = useCallback(
    (template: any) => {
      setNodes(template.flow.nodes || []);
      setEdges(template.flow.edges || []);
      toast.success(`Template loaded: ${template.metadata.name}`);
    },
    [setNodes, setEdges]
  );

  return (
    <div className="flex h-full w-full overflow-hidden rounded-lg border bg-background">
      <Sidebar workflowName={initialWorkflow?.metadata.name} />
      <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background gap={12} size={1} />
          <Panel position="top-right" className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsWorkflowManagerOpen(true)}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Manage
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsTemplateGalleryOpen(true)}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Templates
            </Button>
            <Button size="sm" variant="outline" onClick={onRestore}>
              <Upload className="w-4 h-4 mr-2" />
              Load
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => router.push(`/${role}/automate/workflows`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button size="sm" onClick={onSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button size="sm" onClick={onSaveAndExit}>
              <Check className="w-4 h-4 mr-2" />
              Save & Exit
            </Button>
            <Button size="sm" variant="secondary" onClick={onRun}>
              <Play className="w-4 h-4 mr-2" />
              Run
            </Button>
            <Button size="sm" variant="outline" onClick={onAutoLayout}>
              <Network className="w-4 h-4 mr-2" />
              Auto-Layout
            </Button>
          </Panel>
        </ReactFlow>
      </div>
      {selectedNode && (
        <PropertiesPanel
          selectedNode={selectedNode}
          onClose={() => setSelectedNode(null)}
          onChange={handleNodeChange}
        />
      )}
      <ExecutionPanel
        logs={executionLogs}
        isOpen={isExecutionPanelOpen}
        onClose={() => setIsExecutionPanelOpen(false)}
      />
      <WorkflowManager
        isOpen={isWorkflowManagerOpen}
        onClose={() => setIsWorkflowManagerOpen(false)}
        onLoad={handleLoadWorkflow}
        currentWorkflow={{ nodes, edges }}
      />
      <TemplateGallery
        isOpen={isTemplateGalleryOpen}
        onClose={() => setIsTemplateGalleryOpen(false)}
        onUseTemplate={handleUseTemplate}
      />
    </div>
  );
};

export default function WorkflowBuilder({
  workflowId,
  initialWorkflow,
}: {
  workflowId?: string;
  initialWorkflow?: SavedWorkflow;
}) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent
        workflowId={workflowId}
        initialWorkflow={initialWorkflow}
      />
    </ReactFlowProvider>
  );
}
