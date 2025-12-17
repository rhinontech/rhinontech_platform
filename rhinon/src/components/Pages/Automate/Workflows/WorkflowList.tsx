// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { workflowStorage, SavedWorkflow } from "@/lib/workflowStorage";
// import { Button } from "@/components/ui/button";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { Plus, Edit, Trash2, Copy } from "lucide-react";
// import { toast } from "sonner";

// export default function WorkflowList() {
//   const router = useRouter();
//   const [workflows, setWorkflows] = useState<SavedWorkflow[]>([]);

//   useEffect(() => {
//     loadWorkflows();
//   }, []);

//   const loadWorkflows = () => {
//     setWorkflows(workflowStorage.getAll());
//   };

//   const handleNewWorkflow = () => {
//     const newWorkflow = workflowStorage.createDraft();
//     toast.success("New workflow created");
//     router.push(`/superadmin/automate/workflows/${newWorkflow.metadata.id}`);
//   };

//   const handleEdit = (id: string) => {
//     router.push(`/superadmin/automate/workflows/${id}`);
//   };

//   const handleDuplicate = (id: string) => {
//     const duplicated = workflowStorage.duplicate(id);
//     if (duplicated) {
//       loadWorkflows();
//       toast.success("Workflow duplicated");
//     }
//   };

//   const handleDelete = (id: string) => {
//     if (confirm("Are you sure you want to delete this workflow?")) {
//       workflowStorage.delete(id);
//       loadWorkflows();
//       toast.success("Workflow deleted");
//     }
//   };

//   return (
//     <div className="container mx-auto p-6 space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-3xl font-bold">Workflows</h1>
//           <p className="text-muted-foreground">
//             Manage and create automation workflows
//           </p>
//         </div>
//         <Button onClick={handleNewWorkflow}>
//           <Plus className="w-4 h-4 mr-2" />
//           New Workflow
//         </Button>
//       </div>

//       <div className="border rounded-lg">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Name</TableHead>
//               <TableHead>Description</TableHead>
//               <TableHead>Category</TableHead>
//               <TableHead>Status</TableHead>
//               <TableHead>Version</TableHead>
//               <TableHead>Last Updated</TableHead>
//               <TableHead className="text-right">Actions</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {workflows.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
//                   No workflows yet. Click "New Workflow" to get started.
//                 </TableCell>
//               </TableRow>
//             ) : (
//               workflows.map((workflow) => (
//                 <TableRow key={workflow.metadata.id}>
//                   <TableCell className="font-medium">
//                     {workflow.metadata.name}
//                   </TableCell>
//                   <TableCell className="text-muted-foreground">
//                     {workflow.metadata.description || "No description"}
//                   </TableCell>
//                   <TableCell>
//                     <Badge variant="outline">{workflow.metadata.category}</Badge>
//                   </TableCell>
//                   <TableCell>
//                     <Badge variant={workflow.metadata.status === 'active' ? 'default' : 'secondary'}>
//                       {workflow.metadata.status}
//                     </Badge>
//                   </TableCell>
//                   <TableCell>v{workflow.metadata.version}</TableCell>
//                   <TableCell>
//                     {new Date(workflow.metadata.updatedAt).toLocaleDateString()}
//                   </TableCell>
//                   <TableCell className="text-right">
//                     <div className="flex gap-2 justify-end">
//                       <Button
//                         size="icon"
//                         variant="ghost"
//                         onClick={() => handleEdit(workflow.metadata.id)}
//                         title="Edit"
//                       >
//                         <Edit className="w-4 h-4" />
//                       </Button>
//                       <Button
//                         size="icon"
//                         variant="ghost"
//                         onClick={() => handleDuplicate(workflow.metadata.id)}
//                         title="Duplicate"
//                       >
//                         <Copy className="w-4 h-4" />
//                       </Button>
//                       <Button
//                         size="icon"
//                         variant="ghost"
//                         onClick={() => handleDelete(workflow.metadata.id)}
//                         title="Delete"
//                       >
//                         <Trash2 className="w-4 h-4 text-destructive" />
//                       </Button>
//                     </div>
//                   </TableCell>
//                 </TableRow>
//               ))
//             )}
//           </TableBody>
//         </Table>
//       </div>
//     </div>
//   );
// }




import images from "@/components/Constants/Images";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check } from "lucide-react";
import Image from "next/image";

export default function WorkflowList() {
  return (
    <section className="container mx-auto flex flex-col pt-20 pb-5 text-center h-full overflow-auto">
      <ScrollArea className="flex-1 h-0">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          Connect all of your tools and fully
          <br />
          automate manual, routine tasks.
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          No-code setup to streamline tasks you would otherwise do manually
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" className="bg-primary">
            Coming in next version very soon
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="bg-background text-foreground border-border hover:bg-muted"
          >
            Learn more
          </Button>
        </div>

        {/* Feature Points */}
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center text-sm md:text-base pt-8">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Check className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            </div>
            <span>integrated with popular platforms</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Check className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            </div>
            <span>
              easy as drag{"'"}n{"'"}drop
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <Check className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            </div>
            <span>build with ready-made blocks</span>
          </div>
        </div>

        <div className="w-full h-full">
          <Image
            src={images.reactBuilder}
            alt={""}
            width={1000}
            className="rounded-lg shadow-lg mt-8 mx-auto"
          />
        </div>
      </div>
      </ScrollArea>
    </section>
  );
}
