from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

BACKEND_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_ROOT))

SEED_MEMBERS = [
    {"id": "mem-1", "name": "Ava Patel", "email": "ava.patel@example.com"},
    {"id": "mem-2", "name": "Liam Chen", "email": "liam.chen@example.com"},
]
SEED_TASKS: list[dict] = []


@pytest.fixture()
def client(tmp_path, monkeypatch):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    members_file = data_dir / "members.json"
    tasks_file = data_dir / "tasks.json"
    members_file.write_text(json.dumps(SEED_MEMBERS), encoding="utf-8")
    tasks_file.write_text(json.dumps(SEED_TASKS), encoding="utf-8")

    from app import storage

    monkeypatch.setattr(storage, "DATA_DIR", data_dir)
    monkeypatch.setattr(storage, "MEMBERS_FILE", members_file)
    monkeypatch.setattr(storage, "TASKS_FILE", tasks_file)

    from app.main import app

    with TestClient(app) as test_client:
        yield test_client
