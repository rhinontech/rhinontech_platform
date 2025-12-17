"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SavedWorkflow } from "@/lib/workflowStorage";
import { toast } from "sonner";
import { Zap, Users, Headphones, TrendingUp, Mail, ShoppingCart, FileText, Bell, Globe, Calendar } from "lucide-react";

interface TemplateGalleryProps {
    isOpen: boolean;
    onClose: () => void;
    onUseTemplate: (template: SavedWorkflow) => void;
}

const TEMPLATES: SavedWorkflow[] = [
    // CRM Templates
    {
        metadata: {
            id: "template_lead_nurture",
            name: "Lead Nurturing Campaign",
            description: "Automatically nurture new leads with a series of personalized emails",
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            category: "CRM",
            isTemplate: true,
            status: "draft"
        },
        flow: {
            nodes: [
                {
                    id: "1",
                    type: "input",
                    position: { x: 100, y: 100 },
                    data: { label: "New Lead Created", triggerType: "form_submit" },
                },
                {
                    id: "2",
                    type: "process",
                    position: { x: 300, y: 100 },
                    data: { label: "Create Lead in CRM", subType: "create_lead" },
                },
                {
                    id: "3",
                    type: "control",
                    position: { x: 500, y: 100 },
                    data: { label: "Wait 1 Day", subType: "delay", duration: "1 day" },
                },
                {
                    id: "4",
                    type: "process",
                    position: { x: 700, y: 100 },
                    data: { label: "Send Welcome Email", subType: "send_email" },
                },
                {
                    id: "5",
                    type: "control",
                    position: { x: 900, y: 100 },
                    data: { label: "Wait 3 Days", subType: "delay", duration: "3 days" },
                },
                {
                    id: "6",
                    type: "process",
                    position: { x: 1100, y: 100 },
                    data: { label: "Send Follow-up Email", subType: "send_email" },
                },
                {
                    id: "7",
                    type: "output",
                    position: { x: 1300, y: 100 },
                    data: { label: "Campaign Complete" },
                },
            ],
            edges: [
                { id: "e1-2", source: "1", target: "2" },
                { id: "e2-3", source: "2", target: "3" },
                { id: "e3-4", source: "3", target: "4" },
                { id: "e4-5", source: "4", target: "5" },
                { id: "e5-6", source: "5", target: "6" },
                { id: "e6-7", source: "6", target: "7" },
            ],
        },
    },
    {
        metadata: {
            id: "template_contact_enrichment",
            name: "Contact Data Enrichment",
            description: "Automatically enrich and sync contact data across platforms",
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            category: "CRM",
            isTemplate: true,
            status: "draft"
        },
        flow: {
            nodes: [
                {
                    id: "1",
                    type: "input",
                    position: { x: 100, y: 150 },
                    data: { label: "Contact Updated", triggerType: "form_submit" },
                },
                {
                    id: "2",
                    type: "integration",
                    position: { x: 300, y: 150 },
                    data: { label: "Fetch Enrichment Data", subType: "http_request", method: "POST" },
                },
                {
                    id: "3",
                    type: "data",
                    position: { x: 500, y: 150 },
                    data: { label: "Transform Data", subType: "json_transform" },
                },
                {
                    id: "4",
                    type: "process",
                    position: { x: 700, y: 150 },
                    data: { label: "Update Contact in CRM", subType: "update_contact" },
                },
                {
                    id: "5",
                    type: "output",
                    position: { x: 900, y: 150 },
                    data: { label: "Sync Complete" },
                },
            ],
            edges: [
                { id: "e1-2", source: "1", target: "2" },
                { id: "e2-3", source: "2", target: "3" },
                { id: "e3-4", source: "3", target: "4" },
                { id: "e4-5", source: "4", target: "5" },
            ],
        },
    },
    // Support Templates
    {
        metadata: {
            id: "template_ticket_routing",
            name: "Smart Ticket Routing",
            description: "Automatically route support tickets based on priority and type",
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            category: "Support",
            isTemplate: true,
            status: "draft"
        },
        flow: {
            nodes: [
                {
                    id: "1",
                    type: "input",
                    position: { x: 100, y: 200 },
                    data: { label: "New Ticket", triggerType: "webhook" },
                },
                {
                    id: "2",
                    type: "process",
                    position: { x: 300, y: 200 },
                    data: { label: "Create Ticket", subType: "create_ticket" },
                },
                {
                    id: "3",
                    type: "condition",
                    position: { x: 500, y: 200 },
                    data: { label: "Is High Priority?", expression: "priority === 'high'" },
                },
                {
                    id: "4",
                    type: "process",
                    position: { x: 700, y: 100 },
                    data: { label: "Notify Senior Agent", subType: "send_email" },
                },
                {
                    id: "5",
                    type: "process",
                    position: { x: 700, y: 300 },
                    data: { label: "Add to Team Queue", subType: "update_contact" },
                },
                {
                    id: "6",
                    type: "output",
                    position: { x: 900, y: 200 },
                    data: { label: "Routing Complete" },
                },
            ],
            edges: [
                { id: "e1-2", source: "1", target: "2" },
                { id: "e2-3", source: "2", target: "3" },
                { id: "e3-4", source: "3", target: "4", sourceHandle: "true" },
                { id: "e3-5", source: "3", target: "5", sourceHandle: "false" },
                { id: "e4-6", source: "4", target: "6" },
                { id: "e5-6", source: "5", target: "6" },
            ],
        },
    },
    {
        metadata: {
            id: "template_escalation",
            name: "Ticket Escalation Flow",
            description: "Automatically escalate unresolved tickets after a time period",
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            category: "Support",
            isTemplate: true,
            status: "draft"
        },
        flow: {
            nodes: [
                {
                    id: "1",
                    type: "input",
                    position: { x: 100, y: 100 },
                    data: { label: "Ticket Created", triggerType: "webhook" },
                },
                {
                    id: "2",
                    type: "control",
                    position: { x: 300, y: 100 },
                    data: { label: "Wait 24 Hours", subType: "delay", duration: "24 hours" },
                },
                {
                    id: "3",
                    type: "condition",
                    position: { x: 500, y: 100 },
                    data: { label: "Is Resolved?", expression: "status === 'resolved'" },
                },
                {
                    id: "4",
                    type: "process",
                    position: { x: 700, y: 50 },
                    data: { label: "Send Survey", subType: "send_email" },
                },
                {
                    id: "5",
                    type: "process",
                    position: { x: 700, y: 150 },
                    data: { label: "Escalate to Manager", subType: "send_email" },
                },
                {
                    id: "6",
                    type: "output",
                    position: { x: 900, y: 100 },
                    data: { label: "End" },
                },
            ],
            edges: [
                { id: "e1-2", source: "1", target: "2" },
                { id: "e2-3", source: "2", target: "3" },
                { id: "e3-4", source: "3", target: "4", sourceHandle: "true" },
                { id: "e3-5", source: "3", target: "5", sourceHandle: "false" },
                { id: "e4-6", source: "4", target: "6" },
                { id: "e5-6", source: "5", target: "6" },
            ],
        },
    },
    // Marketing Templates
    {
        metadata: {
            id: "template_abandoned_cart",
            name: "Abandoned Cart Recovery",
            description: "Win back customers who abandoned their shopping carts",
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            category: "Marketing",
            isTemplate: true,
            status: "draft"
        },
        flow: {
            nodes: [
                {
                    id: "1",
                    type: "input",
                    position: { x: 100, y: 100 },
                    data: { label: "Cart Abandoned", triggerType: "webhook" },
                },
                {
                    id: "2",
                    type: "control",
                    position: { x: 300, y: 100 },
                    data: { label: "Wait 1 Hour", subType: "delay", duration: "1 hour" },
                },
                {
                    id: "3",
                    type: "process",
                    position: { x: 500, y: 100 },
                    data: { label: "Send Reminder Email", subType: "send_email" },
                },
                {
                    id: "4",
                    type: "control",
                    position: { x: 700, y: 100 },
                    data: { label: "Wait 24 Hours", subType: "delay", duration: "24 hours" },
                },
                {
                    id: "5",
                    type: "condition",
                    position: { x: 900, y: 100 },
                    data: { label: "Cart Still Abandoned?", expression: "status === 'abandoned'" },
                },
                {
                    id: "6",
                    type: "process",
                    position: { x: 1100, y: 150 },
                    data: { label: "Send Discount Code", subType: "send_email" },
                },
                {
                    id: "7",
                    type: "output",
                    position: { x: 1100, y: 50 },
                    data: { label: "Purchased" },
                },
                {
                    id: "8",
                    type: "output",
                    position: { x: 1300, y: 150 },
                    data: { label: "End Campaign" },
                },
            ],
            edges: [
                { id: "e1-2", source: "1", target: "2" },
                { id: "e2-3", source: "2", target: "3" },
                { id: "e3-4", source: "3", target: "4" },
                { id: "e4-5", source: "4", target: "5" },
                { id: "e5-6", source: "5", target: "6", sourceHandle: "true" },
                { id: "e5-7", source: "5", target: "7", sourceHandle: "false" },
                { id: "e6-8", source: "6", target: "8" },
            ],
        },
    },
    {
        metadata: {
            id: "template_welcome_series",
            name: "Welcome Email Series",
            description: "Onboard new subscribers with a multi-touch welcome series",
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            category: "Marketing",
            isTemplate: true,
            status: "draft"
        },
        flow: {
            nodes: [
                {
                    id: "1",
                    type: "input",
                    position: { x: 100, y: 100 },
                    data: { label: "New Subscriber", triggerType: "form_submit" },
                },
                {
                    id: "2",
                    type: "process",
                    position: { x: 300, y: 100 },
                    data: { label: "Send Welcome Email", subType: "send_email" },
                },
                {
                    id: "3",
                    type: "control",
                    position: { x: 500, y: 100 },
                    data: { label: "Wait 2 Days", subType: "delay", duration: "2 days" },
                },
                {
                    id: "4",
                    type: "process",
                    position: { x: 700, y: 100 },
                    data: { label: "Send Product Guide", subType: "send_email" },
                },
                {
                    id: "5",
                    type: "control",
                    position: { x: 900, y: 100 },
                    data: { label: "Wait 5 Days", subType: "delay", duration: "5 days" },
                },
                {
                    id: "6",
                    type: "process",
                    position: { x: 1100, y: 100 },
                    data: { label: "Send Success Stories", subType: "send_email" },
                },
                {
                    id: "7",
                    type: "output",
                    position: { x: 1300, y: 100 },
                    data: { label: "Series Complete" },
                },
            ],
            edges: [
                { id: "e1-2", source: "1", target: "2" },
                { id: "e2-3", source: "2", target: "3" },
                { id: "e3-4", source: "3", target: "4" },
                { id: "e4-5", source: "4", target: "5" },
                { id: "e5-6", source: "5", target: "6" },
                { id: "e6-7", source: "6", target: "7" },
            ],
        },
    },
    // Sales Templates
    {
        metadata: {
            id: "template_demo_followup",
            name: "Demo Follow-up Sequence",
            description: "Automated follow-up after product demos to increase conversion",
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            category: "Sales",
            isTemplate: true,
            status: "draft"
        },
        flow: {
            nodes: [
                {
                    id: "1",
                    type: "input",
                    position: { x: 100, y: 100 },
                    data: { label: "Demo Completed", triggerType: "webhook" },
                },
                {
                    id: "2",
                    type: "process",
                    position: { x: 300, y: 100 },
                    data: { label: "Send Thank You Email", subType: "send_email" },
                },
                {
                    id: "3",
                    type: "control",
                    position: { x: 500, y: 100 },
                    data: { label: "Wait 2 Days", subType: "delay", duration: "2 days" },
                },
                {
                    id: "4",
                    type: "process",
                    position: { x: 700, y: 100 },
                    data: { label: "Send Case Study", subType: "send_email" },
                },
                {
                    id: "5",
                    type: "control",
                    position: { x: 900, y: 100 },
                    data: { label: "Wait 3 Days", subType: "delay", duration: "3 days" },
                },
                {
                    id: "6",
                    type: "condition",
                    position: { x: 1100, y: 100 },
                    data: { label: "Converted?", expression: "status === 'customer'" },
                },
                {
                    id: "7",
                    type: "output",
                    position: { x: 1300, y: 50 },
                    data: { label: "Won" },
                },
                {
                    id: "8",
                    type: "process",
                    position: { x: 1300, y: 150 },
                    data: { label: "Schedule Call", subType: "send_email" },
                },
            ],
            edges: [
                { id: "e1-2", source: "1", target: "2" },
                { id: "e2-3", source: "2", target: "3" },
                { id: "e3-4", source: "3", target: "4" },
                { id: "e4-5", source: "4", target: "5" },
                { id: "e5-6", source: "5", target: "6" },
                { id: "e6-7", source: "6", target: "7", sourceHandle: "true" },
                { id: "e6-8", source: "6", target: "8", sourceHandle: "false" },
            ],
        },
    },
    {
        metadata: {
            id: "template_proposal_tracking",
            name: "Proposal Tracking & Follow-up",
            description: "Track proposal opens and automate follow-ups",
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            category: "Sales",
            isTemplate: true,
            status: "draft"
        },
        flow: {
            nodes: [
                {
                    id: "1",
                    type: "input",
                    position: { x: 100, y: 100 },
                    data: { label: "Proposal Sent", triggerType: "webhook" },
                },
                {
                    id: "2",
                    type: "control",
                    position: { x: 300, y: 100 },
                    data: { label: "Wait 3 Days", subType: "delay", duration: "3 days" },
                },
                {
                    id: "3",
                    type: "condition",
                    position: { x: 500, y: 100 },
                    data: { label: "Proposal Opened?", expression: "opened === true" },
                },
                {
                    id: "4",
                    type: "process",
                    position: { x: 700, y: 50 },
                    data: { label: "Send Follow-up", subType: "send_email" },
                },
                {
                    id: "5",
                    type: "process",
                    position: { x: 700, y: 150 },
                    data: { label: "Send Reminder", subType: "send_email" },
                },
                {
                    id: "6",
                    type: "output",
                    position: { x: 900, y: 100 },
                    data: { label: "End" },
                },
            ],
            edges: [
                { id: "e1-2", source: "1", target: "2" },
                { id: "e2-3", source: "2", target: "3" },
                { id: "e3-4", source: "3", target: "4", sourceHandle: "true" },
                { id: "e3-5", source: "3", target: "5", sourceHandle: "false" },
                { id: "e4-6", source: "4", target: "6" },
                { id: "e5-6", source: "5", target: "6" },
            ],
        },
    },
    // E-commerce Templates
    {
        metadata: {
            id: "template_order_confirmation",
            name: "Order Confirmation & Tracking",
            description: "Send order confirmations and shipping updates automatically",
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            category: "E-commerce",
            isTemplate: true,
            status: "draft"
        },
        flow: {
            nodes: [
                {
                    id: "1",
                    type: "input",
                    position: { x: 100, y: 100 },
                    data: { label: "Order Placed", triggerType: "webhook" },
                },
                {
                    id: "2",
                    type: "process",
                    position: { x: 300, y: 100 },
                    data: { label: "Send Confirmation Email", subType: "send_email" },
                },
                {
                    id: "3",
                    type: "process",
                    position: { x: 500, y: 100 },
                    data: { label: "Send WhatsApp Confirmation", subType: "send_whatsapp" },
                },
                {
                    id: "4",
                    type: "input",
                    position: { x: 300, y: 250 },
                    data: { label: "Order Shipped", triggerType: "webhook" },
                },
                {
                    id: "5",
                    type: "process",
                    position: { x: 500, y: 250 },
                    data: { label: "Send Tracking Info", subType: "send_email" },
                },
                {
                    id: "6",
                    type: "output",
                    position: { x: 700, y: 100 },
                    data: { label: "Confirmed" },
                },
                {
                    id: "7",
                    type: "output",
                    position: { x: 700, y: 250 },
                    data: { label: "Shipped" },
                },
            ],
            edges: [
                { id: "e1-2", source: "1", target: "2" },
                { id: "e2-3", source: "2", target: "3" },
                { id: "e3-6", source: "3", target: "6" },
                { id: "e4-5", source: "4", target: "5" },
                { id: "e5-7", source: "5", target: "7" },
            ],
        },
    },
    // Automation Templates
    {
        metadata: {
            id: "template_daily_report",
            name: "Daily Performance Report",
            description: "Generate and send daily performance reports automatically",
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            category: "Automation",
            isTemplate: true,
            status: "draft"
        },
        flow: {
            nodes: [
                {
                    id: "1",
                    type: "input",
                    position: { x: 100, y: 100 },
                    data: { label: "Daily at 9 AM", triggerType: "schedule", schedule: "daily" },
                },
                {
                    id: "2",
                    type: "data",
                    position: { x: 300, y: 100 },
                    data: { label: "Query Database", subType: "db_query" },
                },
                {
                    id: "3",
                    type: "data",
                    position: { x: 500, y: 100 },
                    data: { label: "Transform Data", subType: "json_transform" },
                },
                {
                    id: "4",
                    type: "control",
                    position: { x: 700, y: 100 },
                    data: { label: "Loop Through Teams", subType: "loop" },
                },
                {
                    id: "5",
                    type: "process",
                    position: { x: 900, y: 100 },
                    data: { label: "Send Report Email", subType: "send_email" },
                },
                {
                    id: "6",
                    type: "output",
                    position: { x: 1100, y: 100 },
                    data: { label: "Reports Sent" },
                },
            ],
            edges: [
                { id: "e1-2", source: "1", target: "2" },
                { id: "e2-3", source: "2", target: "3" },
                { id: "e3-4", source: "3", target: "4" },
                { id: "e4-5", source: "4", target: "5" },
                { id: "e5-6", source: "5", target: "6" },
            ],
        },
    },
];

const categoryIcons: Record<string, any> = {
    CRM: Users,
    Support: Headphones,
    Marketing: TrendingUp,
    Sales: Mail,
    "E-commerce": ShoppingCart,
    Automation: Zap,
    General: FileText,
    Notifications: Bell,
};

const categories = ["All", "CRM", "Support", "Marketing", "Sales", "E-commerce", "Automation"];

export default function TemplateGallery({
    isOpen,
    onClose,
    onUseTemplate,
}: TemplateGalleryProps) {
    const handleUseTemplate = (template: SavedWorkflow) => {
        onUseTemplate(template);
        onClose();
        toast.success(`Template loaded: ${template.metadata.name}`);
    };

    const getTemplatesByCategory = (category: string) => {
        if (category === "All") return TEMPLATES;
        return TEMPLATES.filter(t => t.metadata.category === category);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Workflow Templates</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Start with a pre-built template and customize it to your needs
                    </p>
                </DialogHeader>

                <Tabs defaultValue="All" className="w-full">
                    <TabsList className="grid w-full grid-cols-7 mb-4">
                        {categories.map((category) => (
                            <TabsTrigger key={category} value={category} className="text-xs">
                                {category}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {categories.map((category) => (
                        <TabsContent key={category} value={category}>
                            <ScrollArea className="h-[520px]">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                                    {getTemplatesByCategory(category).map((template) => {
                                        const Icon = categoryIcons[template.metadata.category] || Zap;

                                        return (
                                            <div
                                                key={template.metadata.id}
                                                className="border rounded-lg p-5 hover:bg-accent transition-all cursor-pointer hover:shadow-md group"
                                                onClick={() => handleUseTemplate(template)}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="rounded-full w-12 h-12 flex items-center justify-center bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                                        <Icon className="w-6 h-6 text-primary" />
                                                    </div>

                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-base mb-1">
                                                            {template.metadata.name}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                                            {template.metadata.description}
                                                        </p>

                                                        <div className="flex gap-2 mt-3">
                                                            <span className="text-xs px-2.5 py-1 bg-secondary rounded-full font-medium">
                                                                {template.metadata.category}
                                                            </span>

                                                            <span className="text-xs px-2 py-1 bg-secondary rounded">
                                                                {template.flow.nodes.length} nodes
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    ))}
                </Tabs>
            </DialogContent>
        </Dialog>
    );

}
