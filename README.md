# Course Tree Search

A small React app for searching Top Hat course content. The sandbox API returns a **flat list** of folder items; the UI turns that into an indented hierarchy (children immediately after their parent, depth shown with hyphens).

## Requirements

- [Node.js](https://nodejs.org/) (see `.nvmrc`)
- [pnpm](https://pnpm.io/)

## Setup

```bash
nvm use
pnpm install
```

## Run the full stack

The repository now includes a local Node API because the assignment sandbox URL was unavailable. Start the API and client in separate terminals:

```bash
# Terminal 1: http://localhost:3001
pnpm api:watch

# Terminal 2: http://localhost:5173
pnpm dev
```

The browser requests `/api/treesearch/?query=...`. In development, Vite removes the `/api` prefix and proxies the request to `http://localhost:3001/treesearch/?query=...`. This keeps the browser request same-origin and avoids local CORS coupling.

The API uses the assignment's Chemistry fixture as an in-memory database substitute. Search is case-insensitive and returns matching items together with the ancestors and descendants required for a complete hierarchy. It deliberately returns a flat array; ordering that array into display rows remains the client's responsibility.

### API contract

| Request | Response |
| --- | --- |
| `GET /treesearch/?query=Lab` | `200` with a flat `CourseItem[]` |
| Valid query with no matches | `200` with `[]` |
| Missing, blank, repeated, or over-100-character query | `400` with a structured error |
| Unsupported route | `404` with a structured error |
| Unsupported method | `405` and `Allow: GET, OPTIONS` |
| Unexpected server failure | `500` with a safe generic error |
| `GET /health` | `200` with `{ "status": "ok" }` |

The API also restricts CORS to the configured origin, applies JSON/security headers, observes client disconnects through an `AbortSignal`, and shuts down gracefully on `SIGINT` or `SIGTERM`.

### Configuration

Copy `.env.example` to `.env` to override any of these settings locally. Node and Vite both load that file:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | Standalone API port |
| `CORS_ORIGIN` | `http://localhost:5173` | Browser origin allowed by the API |
| `API_PROXY_TARGET` | `http://localhost:3001` | Vite development proxy destination |
| `VITE_COURSE_TREE_SEARCH_URL` | `/api/treesearch/` | Browser-facing API URL baked into the client build |

For production, either reverse-proxy `/api` to the Node service or set `VITE_COURSE_TREE_SEARCH_URL` to its absolute public URL when building the client. If separate origins are used, set `CORS_ORIGIN` to the deployed frontend origin.

## Other run modes

### Local mock (fixtures + scenario picker)

Mock mode still provides an interactive scenario picker without starting the API.

```bash
pnpm dev:mock
```

Open the URL Vite prints (usually `http://localhost:5173`). Use the **Mock** dropdown (top right) to switch datasets (Top Hat sample, biology, deep hierarchy, large result set, empty, network failure).

**Try these queries in mock mode:**

| Query | Expected behavior |
| --- | --- |
| `Lab` | Chemistry-style tree (see assignment example) |
| `error` | **Empty results** (success state, not an error banner) |

- **Network failure** scenario — simulates a failed request (error message in the UI).
- Query **`error`** in any mock scenario — same as the assignment tip: empty list, not a network error.

Search filtering in mock mode is implemented in `src/mocks/filter-course-tree.ts`. The real API filters on the server; the client only **flattens** the response via `flattenCourseTree`.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm api` | Start the local API once |
| `pnpm api:watch` | Start the local API and restart when server files change |
| `pnpm dev` | Start the Vite client and proxy `/api` to the local API |
| `pnpm dev:mock` | Dev server with `VITE_USE_MOCK_API=true` (recommended demo) |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run unit tests once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm lint` | ESLint |

## Tests

Tree ordering and indentation logic are covered in `tests/lib/course-tree.test.ts` (matches the assignment **Lab** example). Client fetch, response validation, and parsing are in `tests/lib/search-course-tree.test.ts`. Component tests in `tests/components/course-search.test.tsx` cover successful rendering, empty results, network errors, and the loading state. Server tests cover search semantics, request validation, response status codes, CORS, safe failures, and client-disconnect cancellation.

## Project layout

- `src/components/course-search.tsx` — search form, loading/error/empty states, results list
- `src/api/course-tree-search.ts` — chooses live API vs mocks (`VITE_USE_MOCK_API`)
- `src/schemas/course-tree/courseTreeSchema.ts` — API boundary schemas and inferred `CourseItem`
- `src/lib/course-tree.ts` — flat list → preorder rows with depth (`CourseTreeRow`)
- `src/lib/search-course-tree.ts` — fetch the configured API and validate its JSON
- `src/mocks/` — mock data, client-side filter, scenario picker (dev only)
- `server/search-course-tree.ts` — server-side hierarchy-preserving search
- `server/course-tree-api.ts` — HTTP routing, validation, errors, CORS, cancellation
- `server/index.ts` — process configuration, listener, graceful shutdown
