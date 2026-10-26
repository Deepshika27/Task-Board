from __future__ import annotations

import json
import threading
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
MEMBERS_FILE = DATA_DIR / "members.json"
TASKS_FILE = DATA_DIR / "tasks.json"

_lock = threading.RLock()


def _read(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as f:
        content = f.read().strip()
        if not content:
            return []
        return json.loads(content)


def _write(path: Path, data: list[dict[str, Any]]) -> None:
    tmp_path = path.with_suffix(".tmp")
    with tmp_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, default=str)
    tmp_path.replace(path)


def read_members() -> list[dict[str, Any]]:
    with _lock:
        return _read(MEMBERS_FILE)


def read_tasks() -> list[dict[str, Any]]:
    with _lock:
        return _read(TASKS_FILE)


@contextmanager
def tasks_transaction() -> Iterator[list[dict[str, Any]]]:
    """Acquire the lock for the full duration of a read-modify-write cycle.

    Mutate the yielded list in place; it is persisted to disk once the
    context block exits without raising.
    """
    with _lock:
        tasks = _read(TASKS_FILE)
        yield tasks
        _write(TASKS_FILE, tasks)
