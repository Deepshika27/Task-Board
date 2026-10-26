from __future__ import annotations

from datetime import date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class Priority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class Status(str, Enum):
    TODO = "To Do"
    IN_PROGRESS = "In Progress"
    DONE = "Done"


class TeamMember(BaseModel):
    id: str
    name: str
    email: str


class TaskBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=100)
    description: Optional[str] = Field(default="", max_length=500)
    assignee_id: str
    priority: Priority
    status: Status
    due_date: date
    created_date: date

    @field_validator("title")
    @classmethod
    def strip_title(cls, v: str) -> str:
        return v.strip()


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=100)
    description: Optional[str] = Field(default="", max_length=500)
    assignee_id: str
    priority: Priority
    status: Status = Status.TODO
    due_date: date

    @field_validator("title")
    @classmethod
    def strip_title(cls, v: str) -> str:
        return v.strip()


class TaskUpdate(BaseModel):
    title: str = Field(..., min_length=5, max_length=100)
    description: Optional[str] = Field(default="", max_length=500)
    assignee_id: str
    priority: Priority
    status: Status
    due_date: date

    @field_validator("title")
    @classmethod
    def strip_title(cls, v: str) -> str:
        return v.strip()


class StatusUpdate(BaseModel):
    status: Status


class Task(TaskBase):
    id: str


class SummaryCounts(BaseModel):
    to_do: int = 0
    in_progress: int = 0
    done: int = 0
    total: int = 0
