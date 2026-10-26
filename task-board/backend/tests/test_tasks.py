from __future__ import annotations

from datetime import date, timedelta

TODAY = date.today().isoformat()
TOMORROW = (date.today() + timedelta(days=1)).isoformat()
YESTERDAY = (date.today() - timedelta(days=1)).isoformat()


def make_task_payload(**overrides):
    payload = {
        "title": "Write release notes",
        "description": "Summarize the changes for the upcoming release.",
        "assignee_id": "mem-1",
        "priority": "Medium",
        "status": "To Do",
        "due_date": TOMORROW,
    }
    payload.update(overrides)
    return payload


def test_list_members(client):
    resp = client.get("/api/members")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_create_task_success(client):
    resp = client.post("/api/tasks", json=make_task_payload())
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "Write release notes"
    assert body["status"] == "To Do"
    assert body["created_date"] == TODAY


def test_create_task_invalid_assignee(client):
    resp = client.post("/api/tasks", json=make_task_payload(assignee_id="does-not-exist"))
    assert resp.status_code == 400


def test_create_task_title_too_short(client):
    resp = client.post("/api/tasks", json=make_task_payload(title="Hi"))
    assert resp.status_code == 422


def test_create_task_due_before_created(client):
    resp = client.post("/api/tasks", json=make_task_payload(due_date=YESTERDAY))
    assert resp.status_code == 400


def test_duplicate_title_same_assignee_rejected(client):
    client.post("/api/tasks", json=make_task_payload(title="Unique task title"))
    resp = client.post("/api/tasks", json=make_task_payload(title="Unique task title"))
    assert resp.status_code == 409


def test_duplicate_title_different_assignee_allowed(client):
    client.post("/api/tasks", json=make_task_payload(title="Shared title here", assignee_id="mem-1"))
    resp = client.post("/api/tasks", json=make_task_payload(title="Shared title here", assignee_id="mem-2"))
    assert resp.status_code == 201


def test_status_transition_todo_to_in_progress(client):
    created = client.post("/api/tasks", json=make_task_payload()).json()
    resp = client.patch(f"/api/tasks/{created['id']}/status", json={"status": "In Progress"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "In Progress"


def test_status_transition_todo_to_done_rejected(client):
    created = client.post("/api/tasks", json=make_task_payload()).json()
    resp = client.patch(f"/api/tasks/{created['id']}/status", json={"status": "Done"})
    assert resp.status_code == 400


def test_status_transition_in_progress_to_done(client):
    created = client.post("/api/tasks", json=make_task_payload()).json()
    client.patch(f"/api/tasks/{created['id']}/status", json={"status": "In Progress"})
    resp = client.patch(f"/api/tasks/{created['id']}/status", json={"status": "Done"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "Done"


def test_status_transition_done_to_todo_rejected(client):
    created = client.post("/api/tasks", json=make_task_payload()).json()
    client.patch(f"/api/tasks/{created['id']}/status", json={"status": "In Progress"})
    client.patch(f"/api/tasks/{created['id']}/status", json={"status": "Done"})
    resp = client.patch(f"/api/tasks/{created['id']}/status", json={"status": "To Do"})
    assert resp.status_code == 400


def test_status_transition_done_to_in_progress_allowed(client):
    created = client.post("/api/tasks", json=make_task_payload()).json()
    client.patch(f"/api/tasks/{created['id']}/status", json={"status": "In Progress"})
    client.patch(f"/api/tasks/{created['id']}/status", json={"status": "Done"})
    resp = client.patch(f"/api/tasks/{created['id']}/status", json={"status": "In Progress"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "In Progress"


def test_done_task_cannot_be_edited(client):
    created = client.post("/api/tasks", json=make_task_payload()).json()
    client.patch(f"/api/tasks/{created['id']}/status", json={"status": "In Progress"})
    client.patch(f"/api/tasks/{created['id']}/status", json={"status": "Done"})

    update_payload = make_task_payload(title="Changed title now", status="Done")
    resp = client.put(f"/api/tasks/{created['id']}", json=update_payload)
    assert resp.status_code == 400


def test_done_task_can_move_back_to_in_progress_via_put(client):
    created = client.post("/api/tasks", json=make_task_payload()).json()
    client.patch(f"/api/tasks/{created['id']}/status", json={"status": "In Progress"})
    client.patch(f"/api/tasks/{created['id']}/status", json={"status": "Done"})

    update_payload = make_task_payload(status="In Progress")
    resp = client.put(f"/api/tasks/{created['id']}", json=update_payload)
    assert resp.status_code == 200
    assert resp.json()["status"] == "In Progress"


def test_delete_task(client):
    created = client.post("/api/tasks", json=make_task_payload()).json()
    resp = client.delete(f"/api/tasks/{created['id']}")
    assert resp.status_code == 204
    resp = client.get(f"/api/tasks/{created['id']}")
    assert resp.status_code == 404


def test_summary_counts(client):
    client.post("/api/tasks", json=make_task_payload(title="Task number one"))
    created = client.post("/api/tasks", json=make_task_payload(title="Task number two")).json()
    client.patch(f"/api/tasks/{created['id']}/status", json={"status": "In Progress"})

    resp = client.get("/api/tasks/summary")
    assert resp.status_code == 200
    body = resp.json()
    assert body["to_do"] == 1
    assert body["in_progress"] == 1
    assert body["total"] == 2


def test_filter_by_status_and_assignee(client):
    client.post("/api/tasks", json=make_task_payload(title="Filter task alpha", assignee_id="mem-1"))
    client.post("/api/tasks", json=make_task_payload(title="Filter task beta", assignee_id="mem-2"))

    resp = client.get("/api/tasks", params={"assignee_id": "mem-1"})
    assert resp.status_code == 200
    assert all(t["assignee_id"] == "mem-1" for t in resp.json())
