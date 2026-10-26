import { useRef } from "react";
import type { Status, Task, TeamMember } from "../types";
import { STATUSES } from "../types";
import { Column } from "./Column";

interface BoardProps {
  tasks: Task[];
  members: TeamMember[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: Status) => void;
}

export function Board({ tasks, members, onEdit, onDelete, onStatusChange }: BoardProps) {
  const draggedTaskRef = useRef<Task | null>(null);

  const handleDrop = (status: Status) => {
    const draggedTask = draggedTaskRef.current;
    if (draggedTask && draggedTask.status !== status) {
      onStatusChange(draggedTask, status);
    }
    draggedTaskRef.current = null;
  };

  return (
    <div className="board">
      {STATUSES.map((status) => (
        <Column
          key={status}
          status={status}
          tasks={tasks.filter((t) => t.status === status)}
          members={members}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onDragStart={(task) => {
            draggedTaskRef.current = task;
          }}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}
