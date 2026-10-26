import type { Priority, TeamMember } from "../types";
import { PRIORITIES } from "../types";

interface FiltersProps {
  members: TeamMember[];
  assigneeId: string;
  priority: string;
  search: string;
  onAssigneeChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onClear: () => void;
}

export function Filters({
  members,
  assigneeId,
  priority,
  search,
  onAssigneeChange,
  onPriorityChange,
  onSearchChange,
  onClear,
}: FiltersProps) {
  const hasActiveFilters = assigneeId !== "" || priority !== "" || search !== "";

  return (
    <div className="filters">
      <div className="filter-field">
        <label htmlFor="filter-assignee">Assignee</label>
        <select
          id="filter-assignee"
          value={assigneeId}
          onChange={(e) => onAssigneeChange(e.target.value)}
        >
          <option value="">All assignees</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-field">
        <label htmlFor="filter-priority">Priority</label>
        <select
          id="filter-priority"
          value={priority}
          onChange={(e) => onPriorityChange(e.target.value)}
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p: Priority) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-field filter-search">
        <label htmlFor="filter-search">Search title</label>
        <input
          id="filter-search"
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {hasActiveFilters && (
        <div className="filter-field filter-clear">
          <span className="filter-clear-spacer" aria-hidden="true" />
          <button type="button" className="btn-clear-filters" onClick={onClear}>
            <span className="btn-clear-icon" aria-hidden="true">
              &times;
            </span>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
