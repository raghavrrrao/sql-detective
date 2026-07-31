# Architecture

The repository uses npm workspaces to keep the browser client and API independently deployable while sharing one installation and development command.

The client is a React single-page application. `src/services/api.js` is the only HTTP client boundary; future features should call it rather than constructing Axios instances in UI components. Routing is owned by `src/router.jsx`, and `RootLayout` provides the persistent application shell.

The server separates HTTP composition (`app.js`), route declarations, controllers, middleware, configuration, and database access. SQLite schema is kept in `database/schema.sql`; the runtime database file is created automatically in the repository-level `database/` directory and is ignored by Git.

No game routes or gameplay behavior are included yet. The health route exists only to verify that the server and database bootstrap correctly.
