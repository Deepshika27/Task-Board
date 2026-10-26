import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { api, ApiError } from "./api/client";
import { Board } from "./components/Board";
import { Filters } from "./components/Filters";
import { SummaryBar } from "./components/SummaryBar";
import { TaskFormModal } from "./components/TaskFormModal";
import type { Status, SummaryCounts, Task, TaskFormValues, TeamMember } from "./types";

function App() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<SummaryCounts | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const loadData = useCallback(async () => {
    setLoadError(null);
    try {
      const [membersData, tasksData, summaryData] = await Promise.all([
        api.getMembers(),
        api.getTasks({ assigneeId: assigneeFilter, priority: priorityFilter, search: searchFilter }),
        api.getSummary(),
      ]);
      setMembers(membersData);
      setTasks(tasksData);
      setSummary(summaryData);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Failed to load the task board.");
    } finally {
      setIsLoading(false);
    }
  }, [assigneeFilter, priorityFilter, searchFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setSuccessMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  function openCreateModal() {
    setEditingTask(null);
    setIsModalOpen(true);
  }

  function openEditModal(task: Task) {
    setEditingTask(task);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingTask(null);
  }

  async function handleFormSubmit(values: TaskFormValues) {
    if (editingTask) {
      await api.updateTask(editingTask.id, values);
      setSuccessMessage("Task updated successfully.");
    } else {
      await api.createTask(values);
      setSuccessMessage("Task created successfully.");
    }
    closeModal();
    await loadData();
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    setActionError(null);
    try {
      await api.deleteTask(task.id);
      setSuccessMessage("Task deleted.");
      await loadData();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to delete task.");
    }
  }

  async function handleStatusChange(task: Task, status: Status) {
    setActionError(null);
    try {
      await api.changeStatus(task.id, status);
      setSuccessMessage(`Moved "${task.title}" to ${status}.`);
      await loadData();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to update status.");
    }
  }

  function clearFilters() {
    setAssigneeFilter("");
    setPriorityFilter("");
    setSearchFilter("");
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Team Task Board</h1>
        <button type="button" className="btn-primary" onClick={openCreateModal}>
          + New Task
        </button>
      </header>

      {actionError && (
        <div className="banner banner-error" role="alert">
          {actionError}
          <button type="button" className="banner-dismiss" onClick={() => setActionError(null)}>
            &times;
          </button>
        </div>
      )}
      {successMessage && (
        <div className="banner banner-success" role="status">
          {successMessage}
        </div>
      )}

      <SummaryBar summary={summary} />

      <Filters
        members={members}
        assigneeId={assigneeFilter}
        priority={priorityFilter}
        search={searchFilter}
        onAssigneeChange={setAssigneeFilter}
        onPriorityChange={setPriorityFilter}
        onSearchChange={setSearchFilter}
        onClear={clearFilters}
      />

      {isLoading && <div className="state-message">Loading tasks...</div>}

      {!isLoading && loadError && (
        <div className="state-message state-error">
          <p>{loadError}</p>
          <button type="button" className="btn-secondary" onClick={loadData}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !loadError && tasks.length === 0 && (
        <div className="state-message">
          <p>No tasks match the current filters.</p>
          {(assigneeFilter || priorityFilter || searchFilter) && (
            <button type="button" className="btn-secondary" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      )}

      {!isLoading && !loadError && tasks.length > 0 && (
        <Board
          tasks={tasks}
          members={members}
          onEdit={openEditModal}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}

      {isModalOpen && (
        <TaskFormModal task={editingTask} members={members} onSubmit={handleFormSubmit} onClose={closeModal} />
      )}
    </div>
  );
}

export default App;
