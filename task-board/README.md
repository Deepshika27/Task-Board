Team Task Board
A simple task board for creating, assigning, and tracking team tasks, built with FastAPI (backend), React + TypeScript (frontend), and local JSON files for persistence.

task-board/
├── package.json        Root convenience script to run both servers at once
├── backend/            FastAPI app, business rules, JSON storage, tests
│   ├── app/
│   ├── data/           members.json / tasks.json (seed data + live storage)
│   └── tests/          pytest suite (status-transition & validation tests)
└── frontend/            React + TypeScript (Vite) single-page app
Setup
One-time install
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows (use `source .venv/bin/activate` on macOS/Linux)
pip install -r requirements.txt
cd ../frontend
npm install
cd ..
npm install                   # installs the root dev-runner (concurrently)
Run both servers with one command (Windows)
npm run dev
This starts the backend (http://localhost:8000) and the frontend (http://localhost:5173) together in one terminal, with [backend]/[frontend] labeled, color-coded output. Press Ctrl+C once to stop both. (The root dev:backend script hardcodes a Windows venv path; on macOS/Linux run the two servers from separate terminals as shown below instead.)

Run them separately (any OS)
Backend:

cd backend
.venv\Scripts\activate        # Windows (use `source .venv/bin/activate` on macOS/Linux)
uvicorn app.main:app --reload --port 8000
The API is served at http://localhost:8000. Interactive docs: http://localhost:8000/docs.

Frontend (separate terminal):

cd frontend
npm run dev
The app is served at http://localhost:5173 and expects the backend at http://localhost:8000 (override with a VITE_API_BASE_URL env var — see .env.example). Both servers must be running at the same time for the board to work.

Run the backend test suite:

cd backend
.venv\Scripts\activate
pytest tests/ -v
Data Model
Team Member: id, name, email Task: id, title, description, assignee_id, priority (Low/Medium/High), status (To Do/In Progress/Done), due_date, created_date

API
Method	Path	Purpose
GET	/api/members	List team members
GET	/api/tasks	List tasks (filters: assignee_id, priority, status, search)
GET	/api/tasks/summary	Counts grouped by status
GET	/api/tasks/{id}	Get a single task
POST	/api/tasks	Create a task
PUT	/api/tasks/{id}	Update a task (full replace of editable fields)
PATCH	/api/tasks/{id}/status	Change only the status (drag/drop & board controls use this)
DELETE	/api/tasks/{id}	Delete a task
All endpoints validate input with Pydantic and return 400 for business-rule violations, 404 for missing resources, 409 for a duplicate active title, and 422 for schema/field validation errors (e.g. title length).

Business Rules (enforced server-side, app/business_rules.py)
Unique title per assignee — a title must be unique among that assignee's active (not-Done) tasks. Two different assignees may share a title, and a Done task doesn't block reuse of its title.
Status transitions — To Do → In Progress, In Progress → To Do or Done, Done → In Progress only. Skipping directly from To Do to Done is rejected.
Done tasks are locked — once a task is Done, the only allowed edit is moving it back to In Progress; any other field change is rejected.
Assignee must exist — assignee_id is checked against the members list.
Due date ≥ created date — enforced on both create and update.
These rules are enforced in one place and reused by both the PUT and the PATCH /status endpoints, so the API can never be tricked into an inconsistent state regardless of which client (the bundled UI, a script, curl, etc.) calls it.

Design Decisions
JSON persistence with a single process-wide lock: app/storage.py exposes a tasks_transaction() context manager that holds a lock for the full read-modify-write cycle (not just the read or the write), so concurrent requests can't race past each other (e.g. two requests both checking the "unique title" rule against a stale list and both passing). Writes go to a temp file and are atomically renamed into place, so a crash mid-write can't corrupt the JSON file. This is appropriate for a single-process dev/demo deployment; a multi-process production deployment would need a real database instead.
Status changes use a dedicated PATCH /status endpoint rather than requiring a full task payload, so the board's drag-and-drop and "Move to…" controls can change status with a minimal request, while PUT is reserved for the edit form.
IDs are opaque strings (UUIDs for new tasks, short seed IDs for the shipped data) — the frontend never parses or assumes a format.
Frontend validates client-side for immediate feedback (title length, description length, due-date lower bound) but the backend is the source of truth — every rule is re-checked server-side, and a rejected request surfaces its detail message directly in the UI (form-level for create/edit, a dismissible banner for status changes/deletes).
No global filtering of the summary counts: the four summary tiles always reflect the whole board, while the three columns reflect the active filters. This keeps "how much work is left overall" visible even while you're filtering down to one person's tasks.
Editing a Done task is blocked in the UI (the Edit button is disabled) rather than only being blocked server-side, since the only legal edit for a Done task is the status dropdown, which is already available on the card.
Frontend Features
Three-column board (To Do / In Progress / Done) with per-column counts and empty states.
Create/edit modal with inline field validation.
Status changes via the "Move to…" dropdown on each card, which only lists legal next statuses, and by dragging a card into another column.
Filters by assignee and priority, plus a title search box (optional enhancement), all combined server-side.
Summary tiles (Total / To Do / In Progress / Done).
Created date and due date shown on every card.
Overdue badge on incomplete tasks whose due date has passed.
Loading, empty ("no tasks match the current filters"), success (toast banner), and error (retry banner / inline form errors) states.
Optional Enhancements Implemented
Overdue highlighting (badge + tinted card)
Title search
Drag-and-drop column movement
API tests for status transitions and other business rules (backend/tests/test_tasks.py, 17 tests)
Known Limitations
Local JSON persistence with an in-process lock does not scale beyond a single backend process — intentional given the "local JSON" requirement.
No authentication/authorization - anyone with network access to the API can read/write all tasks.
