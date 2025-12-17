import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { templates } from '@/lib/templates';
import { useEmailStore } from '@/store/email-store';
import { LayoutTemplate } from 'lucide-react';

export const TemplateModal = () => {
    const { loadTemplate } = useEmailStore();
    const [open, setOpen] = React.useState(false);

    const handleSelect = (template: any) => {
        // Deep clone to avoid mutating the template definition
        const clonedTemplate = JSON.parse(JSON.stringify(template));
        loadTemplate(clonedTemplate);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <LayoutTemplate className="w-4 h-4" />
                    Templates
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Select a Template</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    {templates.map((template) => (
                        <div
                            key={template.id}
                            className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-all hover:shadow-md"
                            onClick={() => handleSelect(template)}
                        >
                            <div className="h-32 bg-gray-100 mb-2 rounded flex items-center justify-center text-gray-400">
                                Preview
                            </div>
                            <h3 className="font-medium">{template.name}</h3>
                            <p className="text-xs text-gray-500">{template.elements.length} elements</p>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
};
