# SQL Detective: Countdown to Justice

Production-oriented project scaffold for a browser game where players solve murder mysteries by writing SQL queries.

## Prerequisites

- Node.js 20 or later
- npm 10 or later

## Installation

```bash
npm install
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
```

On macOS or Linux, replace `Copy-Item` with `cp`.

## Run locally

```bash
# Run the React client and Express API together
npm run dev

# Or run either workspace independently
npm run dev:client
npm run dev:server
```

The client starts at `http://localhost:5173`. The health endpoint is available at `http://localhost:4000/api/health`.

## Investigation data

Seed the three case databases before starting the API:

```bash
npm run seed --workspace server
```

The API exposes `GET /api/case/:difficulty` and `POST /api/query`. Query execution is limited to one read-only `SELECT`, `WITH`, or `EXPLAIN` statement against the selected case database.

## Build and start

```bash
npm run build
npm run start
```

## Structure

- `client/` — Vite/React single-page application.
- `server/` — Express API and SQLite access layer.
- `database/` — local runtime database location and schema source.
- `docs/` — architecture documentation.
- `assets/` — repository-level art and media assets.

Game screens and gameplay are intentionally not implemented in this setup-only commit.
"# sql-detective" 
