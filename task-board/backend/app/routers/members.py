from __future__ import annotations

from fastapi import APIRouter

from ..models import TeamMember
from ..storage import read_members

router = APIRouter(prefix="/api/members", tags=["members"])


@router.get("", response_model=list[TeamMember])
def list_members() -> list[TeamMember]:
    return [TeamMember(**m) for m in read_members()]
