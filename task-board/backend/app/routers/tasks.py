from __future__ import annotations

import uuid
from datetime import date
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi import status as http_status

from ..business_rules import (
    validate_assignee_exists,
    validate_done_task_edit,
    validate_due_date,
    validate_status_transition,
    validate_unique_title,
)
from ..models import (
    Priority,
    Status,
    StatusUpdate,
    SummaryCounts,
    Task,
    TaskCreate,
    TaskUpdate,
)
from ..storage import read_members, read_tasks, tasks_transaction

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def _find(tasks: list[dict[str, Any]], task_id: str) -> dict[str, Any]:
    for t in tasks:
        if t["id"] == task_id:
            return t
    raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Task not found.")


@router.get("", response_model=list[Task])
def list_tasks(
    assignee_id: Optional[str] = Query(default=None),
    priority: Optional[Priority] = Query(default=None),
    status: Optional[Status] = Query(default=None),
    search: Optional[str] = Query(default=None, description="Case-insensitive title search"),
) -> list[Task]:
    tasks = read_tasks()

    if assignee_id:
        tasks = [t for t in tasks if t["assignee_id"] == assignee_id]
    if priority:
        tasks = [t for t in tasks if t["priority"] == priority.value]
    if status:
        tasks = [t for t in tasks if t["status"] == status.value]
    if search:
        needle = search.strip().lower()
        tasks = [t for t in tasks if needle in t["title"].lower()]

    return [Task(**t) for t in tasks]


@router.get("/summary", response_model=SummaryCounts)
def get_summary() -> SummaryCounts:
    tasks = read_tasks()
    counts = SummaryCounts(
        to_do=sum(1 for t in tasks if t["status"] == Status.TODO.value),
        in_progress=sum(1 for t in tasks if t["status"] == Status.IN_PROGRESS.value),
        done=sum(1 for t in tasks if t["status"] == Status.DONE.value),
        total=len(tasks),
    )
    return counts


@router.get("/{task_id}", response_model=Task)
def get_task(task_id: str) -> Task:
    tasks = read_tasks()
    return Task(**_find(tasks, task_id))


@router.post("", response_model=Task, status_code=http_status.HTTP_201_CREATED)
def create_task(payload: TaskCreate) -> Task:
    members = read_members()
    validate_assignee_exists(payload.assignee_id, members)

    created_date = date.today()
    validate_due_date(payload.due_date, created_date)

    with tasks_transaction() as tasks:
        validate_unique_title(payload.title, payload.assignee_id, tasks)

        new_task = Task(
            id=str(uuid.uuid4()),
            title=payload.title,
            description=payload.description or "",
            assignee_id=payload.assignee_id,
            priority=payload.priority,
            status=payload.status,
            due_date=payload.due_date,
            created_date=created_date,
        )
        tasks.append(new_task.model_dump(mode="json"))

    return new_task


@router.put("/{task_id}", response_model=Task)
def update_task(task_id: str, payload: TaskUpdate) -> Task:
    members = read_members()
    validate_assignee_exists(payload.assignee_id, members)

    with tasks_transaction() as tasks:
        existing = _find(tasks, task_id)
        created_date = date.fromisoformat(existing["created_date"])
        validate_due_date(payload.due_date, created_date)

        updated_fields = {
            "title": payload.title,
            "description": payload.description or "",
            "assignee_id": payload.assignee_id,
            "priority": payload.priority.value,
            "status": payload.status.value,
            "due_date": payload.due_date.isoformat(),
            "created_date": existing["created_date"],
        }

        validate_done_task_edit(existing, updated_fields)

        if existing["status"] != payload.status.value:
            validate_status_transition(Status(existing["status"]), payload.status)

        validate_unique_title(payload.title, payload.assignee_id, tasks, exclude_task_id=task_id)

        existing.update(updated_fields)
        result = Task(id=task_id, **{**updated_fields, "due_date": payload.due_date, "created_date": created_date})

    return result


@router.patch("/{task_id}/status", response_model=Task)
def change_status(task_id: str, payload: StatusUpdate) -> Task:
    with tasks_transaction() as tasks:
        existing = _find(tasks, task_id)
        current_status = Status(existing["status"])

        validate_status_transition(current_status, payload.status)

        existing["status"] = payload.status.value
        result = Task(**existing)

    return result


@router.delete("/{task_id}", status_code=http_status.HTTP_204_NO_CONTENT, response_model=None)
def delete_task(task_id: str) -> None:
    with tasks_transaction() as tasks:
        existing = _find(tasks, task_id)
        tasks.remove(existing)
