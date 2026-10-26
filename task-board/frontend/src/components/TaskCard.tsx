import type { Status, Task } from "../types";
import { STATUS_TRANSITIONS } from "../types";

interface TaskCardProps {
  task: Task;
  assigneeName: string;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: Status) => void;
  onDragStart: (task: Task) => void;
}

function isOverdue(task: Task): boolean {
  if (task.status === "Done") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.due_date);
  return due < today;
}

export function TaskCard({ task, assigneeName, onEdit, onDelete, onStatusChange, onDragStart }: TaskCardProps) {
  const overdue = isOverdue(task);
  const nextStatuses = STATUS_TRANSITIONS[task.status];

  return (
    <div
      className={`task-card priority-${task.priority.toLowerCase()} ${overdue ? "task-overdue" : ""}`}
      draggable
      onDragStart={() => onDragStart(task)}
      data-testid={`task-card-${task.id}`}
    >
      <div className="task-card-header">
        <span className={`priority-badge priority-badge-${task.priority.toLowerCase()}`}>
          {task.priority}
        </span>
        {overdue && <span className="overdue-badge">Overdue</span>}
      </div>

      <h4 className="task-title">{task.title}</h4>
      {task.description && <p className="task-description">{task.description}</p>}

      <div className="task-meta">
        <span className="task-assignee">{assigneeName}</span>
        <span className="task-dates">
          <span className="task-created">Created {task.created_date}</span>
          <span className="task-due">Due {task.due_date}</span>
        </span>
      </div>

      <div className="task-actions">
        <select
          aria-label={`Change status for ${task.title}`}
          value=""
          onChange={(e) => {
            if (e.target.value) {
              onStatusChange(task, e.target.value as Status);
            }
          }}
        >
          <option value="" disabled>
            Move to...
          </option>
          {nextStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn-icon"
          onClick={() => onEdit(task)}
          aria-label="Edit task"
          disabled={task.status === "Done"}
          title={task.status === "Done" ? "Done tasks can only be moved back to In Progress" : undefined}
        >
          Edit
        </button>
        <button type="button" className="btn-icon btn-danger" onClick={() => onDelete(task)} aria-label="Delete task">
          Delete
        </button>
      </div>
    </div>
  );
}
