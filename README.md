# StockFlow — Inventory & Order Management System

A full-stack inventory and order management system: manage products, customers,
and orders with live inventory tracking and a summary dashboard.

**Stack:** React (Vite + Tailwind v4) · FastAPI (Python) · PostgreSQL · Docker

---

## Run with Docker (recommended)

Requires Docker Desktop. From the project root:

```bash
docker compose up --build
```

- App (frontend): http://localhost:8080
- API docs (Swagger): http://localhost:8000/docs

To stop: `Ctrl + C`, then `docker compose down`.
To wipe the database too: `docker compose down -v`.

---

## Run locally without Docker

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows  (use: source .venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Defaults to a local SQLite database, so no PostgreSQL install is needed for dev.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 (Vite proxies /api to the backend on :8000).

---

## Project structure

```
.
├── backend/            FastAPI app (app/ package) + Dockerfile
├── frontend/           React app (src/) + Dockerfile + nginx.conf
└── docker-compose.yml  db + backend + frontend
```

## API overview

| Resource  | Endpoints                                              |
|-----------|--------------------------------------------------------|
| Products  | `POST/GET /products`, `GET/PUT/DELETE /products/{id}`  |
| Customers | `POST/GET /customers`, `GET/DELETE /customers/{id}`    |
| Orders    | `POST/GET /orders`, `GET/DELETE /orders/{id}`          |
| Dashboard | `GET /dashboard`                                       |

## Business rules

- Unique product SKU and unique customer email (enforced in DB + API).
- Stock can never go negative.
- Orders are rejected if stock is insufficient.
- Creating an order reduces stock atomically (single transaction).
- The order total is always calculated on the server.
