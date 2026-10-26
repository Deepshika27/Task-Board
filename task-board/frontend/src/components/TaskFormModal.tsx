import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Priority, Task, TaskFormValues, TeamMember } from "../types";
import { PRIORITIES } from "../types";

interface TaskFormModalProps {
  task: Task | null;
  members: TeamMember[];
  onSubmit: (values: TaskFormValues) => Promise<void>;
  onClose: () => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TaskFormModal({ task, members, onSubmit, onClose }: TaskFormModalProps) {
  const isEditing = task !== null;
  const minDueDate = task ? task.created_date : today();

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [assigneeId, setAssigneeId] = useState(task?.assignee_id ?? members[0]?.id ?? "");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "Medium");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 5 || trimmedTitle.length > 100) {
      next.title = "Title must be between 5 and 100 characters.";
    }
    if (description.length > 500) {
      next.description = "Description must not exceed 500 characters.";
    }
    if (!assigneeId) {
      next.assigneeId = "Assignee is required.";
    }
    if (!priority) {
      next.priority = "Priority is required.";
    }
    if (!dueDate) {
      next.dueDate = "Due date is required.";
    } else if (dueDate < minDueDate) {
      next.dueDate = `Due date cannot be earlier than ${minDueDate}.`;
    }
    return next;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        assignee_id: assigneeId,
        priority,
        status: task?.status ?? "To Do",
        due_date: dueDate,
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{isEditing ? "Edit Task" : "New Task"}</h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="task-title">Title</label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <span className="field-hint">{description.length}/500</span>
            {errors.description && <span className="field-error">{errors.description}</span>}
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="task-assignee">Assignee</label>
              <select id="task-assignee" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
                <option value="" disabled>
                  Select assignee
                </option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {errors.assigneeId && <span className="field-error">{errors.assigneeId}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              {errors.priority && <span className="field-error">{errors.priority}</span>}
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="task-due-date">Due date</label>
            <input
              id="task-due-date"
              type="date"
              value={dueDate}
              min={minDueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            {errors.dueDate && <span className="field-error">{errors.dueDate}</span>}
          </div>

          {submitError && <div className="form-submit-error">{submitError}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : isEditing ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
