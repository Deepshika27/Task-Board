export type Priority = "Low" | "Medium" | "High";
export type Status = "To Do" | "In Progress" | "Done";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee_id: string;
  priority: Priority;
  status: Status;
  due_date: string;
  created_date: string;
}

export interface TaskFormValues {
  title: string;
  description: string;
  assignee_id: string;
  priority: Priority;
  status: Status;
  due_date: string;
}

export interface SummaryCounts {
  to_do: number;
  in_progress: number;
  done: number;
  total: number;
}

export const STATUSES: Status[] = ["To Do", "In Progress", "Done"];
export const PRIORITIES: Priority[] = ["Low", "Medium", "High"];

export const STATUS_TRANSITIONS: Record<Status, Status[]> = {
  "To Do": ["In Progress"],
  "In Progress": ["To Do", "Done"],
  Done: ["In Progress"],
};
