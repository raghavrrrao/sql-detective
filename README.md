# SQL Detective: Countdown to Justice

SQL Detective is a browser-based SQL investigation game where players solve murder mysteries by writing read-only SQL queries against case databases.

## Features

- Interactive case selection and progression flow
- Investigation notebook and evidence tracking
- Read-only SQL execution against SQLite case databases
- Timer, scoring, festival and personal mode progression
- Production-ready Express and Vite deployment setup for Render

## Tech stack

- Frontend: React, Vite, Tailwind CSS, Framer Motion
- Backend: Express, SQLite, Node.js
- Deployment: Render, Node.js web service

## Repository structure

- client/ — Vite/React single-page application
- server/ — Express API and SQLite access layer
- database/ — case databases and schema files
- docs/ — design and API documentation
- assets/ — shared static assets
- render.yaml — Render service configuration

## Local development

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
npm install
cp .env.example .env
cp client/.env.example client/.env
cp server/.env.example server/.env
```

### Run locally

```bash
npm run dev
```

The app is served locally at http://localhost:5173 and the API is available at http://localhost:4000/api/health.

### Seed case databases

```bash
npm run seed --workspace server
```

## Production build

```bash
npm run build
npm start
```

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| PORT | Yes | Web server port (Render sets this automatically) |
| CLIENT_ORIGIN | Yes | Allowed frontend origin for CORS |
| DATABASE_PATH | Yes | Path to the SQLite database file |
| NODE_ENV | No | Set to production for deployment |
| QUERY_TIMEOUT_MS | No | Query execution timeout in milliseconds |
| QUERY_ROW_LIMIT | No | Maximum rows returned per query |
| VITE_API_BASE_URL | No | Browser-side API base URL; defaults to /api |

## Render deployment

1. Push this repository to GitHub.
2. Create a new Web Service on Render and connect the repository.
3. Use the following settings:
   - Build Command: npm install && npm run build
   - Start Command: npm start
   - Health Check Path: /api/health
4. Add the environment variables from the examples as needed.

A render.yaml file is included for Render-based deployment guidance.

## Screenshots

- Placeholder: add screenshots to docs or the repository wiki.

## License

This project is provided as-is for educational and portfolio purposes.

## Future roadmap

- Expand case content and progression systems
- Improve observability and deployment automation
- Add CI checks for build and smoke tests
