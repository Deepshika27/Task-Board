from __future__ import annotations

from typing import Any, Optional

from fastapi import HTTPException, status as http_status

from .models import Status

# Allowed status transitions. A status mapping to itself is not listed here;
# "no-op" updates (same status) are allowed separately by the callers.
ALLOWED_TRANSITIONS: dict[Status, set[Status]] = {
    Status.TODO: {Status.IN_PROGRESS},
    Status.IN_PROGRESS: {Status.TODO, Status.DONE},
    Status.DONE: {Status.IN_PROGRESS},
}


def validate_assignee_exists(assignee_id: str, members: list[dict[str, Any]]) -> None:
    if not any(m["id"] == assignee_id for m in members):
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Assignee '{assignee_id}' does not reference an existing team member.",
        )


def validate_due_date(due_date, created_date) -> None:
    if due_date < created_date:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="Due date cannot be earlier than created date.",
        )


def validate_unique_title(
    title: str,
    assignee_id: str,
    tasks: list[dict[str, Any]],
    exclude_task_id: Optional[str] = None,
) -> None:
    normalized = title.strip().lower()
    for t in tasks:
        if exclude_task_id is not None and t["id"] == exclude_task_id:
            continue
        if t["status"] == Status.DONE.value:
            continue  # only active (not-Done) tasks must be unique
        if t["assignee_id"] == assignee_id and t["title"].strip().lower() == normalized:
            raise HTTPException(
                status_code=http_status.HTTP_409_CONFLICT,
                detail="Title must be unique among active tasks assigned to the same person.",
            )


def validate_status_transition(current: Status, new: Status) -> None:
    if current == new:
        return
    allowed = ALLOWED_TRANSITIONS.get(current, set())
    if new not in allowed:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot move task from '{current.value}' to '{new.value}'.",
        )


def validate_done_task_edit(existing: dict[str, Any], updated_fields: dict[str, Any]) -> None:
    """A task marked Done cannot be edited, except to move it back to In Progress."""
    if existing["status"] != Status.DONE.value:
        return

    new_status = updated_fields.get("status")
    if new_status != Status.IN_PROGRESS.value:
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail="A task marked Done cannot be edited, except to move it back to In Progress.",
        )

    immutable_fields = ["title", "description", "assignee_id", "priority", "due_date", "created_date"]
    for field in immutable_fields:
        existing_value = str(existing.get(field))
        new_value = str(updated_fields.get(field))
        if existing_value != new_value:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="A task marked Done cannot be edited, except to move it back to In Progress.",
            )
