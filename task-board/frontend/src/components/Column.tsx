import { useState } from "react";
import type { Status, Task, TeamMember } from "../types";
import { TaskCard } from "./TaskCard";

interface ColumnProps {
  status: Status;
  tasks: Task[];
  members: TeamMember[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: Status) => void;
  onDragStart: (task: Task) => void;
  onDrop: (status: Status) => void;
}

const COLUMN_LABELS: Record<Status, string> = {
  "To Do": "To Do",
  "In Progress": "In Progress",
  Done: "Done",
};

export function Column({ status, tasks, members, onEdit, onDelete, onStatusChange, onDragStart, onDrop }: ColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const memberName = (id: string) => members.find((m) => m.id === id)?.name ?? "Unassigned";

  return (
    <div
      className={`board-column column-${status.toLowerCase().replace(/\s+/g, "-")} ${isDragOver ? "column-drag-over" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={() => {
        setIsDragOver(false);
        onDrop(status);
      }}
    >
      <div className="column-header">
        <h3>{COLUMN_LABELS[status]}</h3>
        <span className="column-count">{tasks.length}</span>
      </div>

      <div className="column-body">
        {tasks.length === 0 ? (
          <p className="column-empty">No tasks here.</p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              assigneeName={memberName(task.assignee_id)}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onDragStart={onDragStart}
            />
          ))
        )}
      </div>
    </div>
  );
}
