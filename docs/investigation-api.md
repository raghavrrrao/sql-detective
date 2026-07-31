# Investigation Query API

Run `npm run seed --workspace server` to build `database/easy.db`, `database/medium.db`, and `database/expert.db`. All three share the same 16-table investigation schema and all three are hand-authored — there is no generated data left in the project. Each case lives in its own module (`seedEasyDatabase.js`, `seedMediumDatabase.js`, `seedExpertDatabase.js`) over the shared helpers in `seedHelpers.js`, and each module's header comment records the solution.

Difficulty is carried by the SQL, not by the plot. Easy (5 suspects, 79 rows) is solvable with `SELECT`, `WHERE`, `ORDER BY`, `LIMIT` and `COUNT` alone. Medium (7 suspects, 103 rows) needs `JOIN`, `LEFT JOIN`, `GROUP BY`, `HAVING`, `LIKE` and `BETWEEN`. Expert (9 suspects, 136 rows) needs multi-table joins, subqueries, CTEs and `datetime()` arithmetic.

## Routes

- `GET /api/case/:difficulty` returns the case metadata, evidence notebook, suspect list, inventory summary, and placeholder timer.
- `POST /api/query` accepts `{ "difficulty": "easy|medium|expert", "sql": "SELECT ..." }` and returns `columns`, `rows`, `executionTime`, and `rowCount`.

## Query policy

`validateReadOnlySql` blanks out comments and the contents of string literals and quoted identifiers before it inspects anything, so policy decisions are made against SQL structure and never against player-supplied text. A query is accepted when it is a single statement (a trailing `;` is fine), it begins with `SELECT`, `WITH`, or a read-only `EXPLAIN`, and no mutation, DDL, or transaction keyword appears outside a literal. `CASE … END` and `replace()` are legal; `--` and `/* */` comments are allowed and stripped.

Rejections are `403` for blocked statements (`DELETE`, `UPDATE`, `DROP`, `INSERT`, `ALTER`, `CREATE`, `ATTACH`, `DETACH`, `PRAGMA`, …) and `400` for malformed SQL, with the SQLite error surfaced so players can correct it.

Accepted statements are executed verbatim — never wrapped in an outer `SELECT` — so JOIN result columns keep the names SQLite produced. The service steps the prepared statement and stops at `QUERY_ROW_LIMIT` rows (200 by default), interrupts after `QUERY_TIMEOUT_MS` (2 seconds by default), and opens every case database with SQLite's `OPEN_READONLY` mode as an independent second enforcement layer.
