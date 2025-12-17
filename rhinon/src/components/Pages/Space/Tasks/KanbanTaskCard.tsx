import { Task } from "@/types/task";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskCard } from "./TaskCard";

interface KanbanTaskCardProps {
    task: Task;
    onClick: () => void;
}

export function KanbanTaskCard({ task, onClick }: KanbanTaskCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <TaskCard task={task} onClick={onClick} dragHandleProps={listeners} variant="board" />
        </div>
    );
}
