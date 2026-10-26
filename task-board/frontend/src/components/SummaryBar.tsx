import type { SummaryCounts } from "../types";

interface SummaryBarProps {
  summary: SummaryCounts | null;
}

export function SummaryBar({ summary }: SummaryBarProps) {
  if (!summary) return null;

  return (
    <div className="summary-bar">
      <div className="summary-tile summary-total">
        <span className="summary-count">{summary.total}</span>
        <span className="summary-label">Total</span>
      </div>
      <div className="summary-tile summary-todo">
        <span className="summary-count">{summary.to_do}</span>
        <span className="summary-label">To Do</span>
      </div>
      <div className="summary-tile summary-progress">
        <span className="summary-count">{summary.in_progress}</span>
        <span className="summary-label">In Progress</span>
      </div>
      <div className="summary-tile summary-done">
        <span className="summary-count">{summary.done}</span>
        <span className="summary-label">Done</span>
      </div>
    </div>
  );
}
