import type { SummaryCounts, Task, TaskFormValues, TeamMember } from "../types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new ApiError(0, "Could not reach the server. Is the backend running?");
  }

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail ?? detail;
    } catch {
      // ignore unparsable error body
    }
    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export interface TaskFilters {
  assigneeId?: string;
  priority?: string;
  status?: string;
  search?: string;
}

function buildQuery(filters: TaskFilters): string {
  const params = new URLSearchParams();
  if (filters.assigneeId) params.set("assignee_id", filters.assigneeId);
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.status) params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  getMembers: () => request<TeamMember[]>("/api/members"),

  getTasks: (filters: TaskFilters = {}) => request<Task[]>(`/api/tasks${buildQuery(filters)}`),

  getSummary: () => request<SummaryCounts>("/api/tasks/summary"),

  createTask: (values: TaskFormValues) =>
    request<Task>("/api/tasks", {
      method: "POST",
      body: JSON.stringify(values),
    }),

  updateTask: (taskId: string, values: TaskFormValues) =>
    request<Task>(`/api/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(values),
    }),

  changeStatus: (taskId: string, status: string) =>
    request<Task>(`/api/tasks/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  deleteTask: (taskId: string) =>
    request<void>(`/api/tasks/${taskId}`, {
      method: "DELETE",
    }),
};
