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

## Run

### Recommended: local mock (fixtures + scenario picker)

The assignment sandbox URL (`.../treesearch/?query=...`) was unavailable during development. Use mock mode for an interactive demo and the Chemistry **Lab** example from the write-up.

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

### Live sandbox API

```bash
pnpm dev
```

Searches call the assignment endpoint:

`https://coursetreesearch-service-sandbox.dev.tophat.com/treesearch/?query={SEARCH_TERM}`

Implementation: `src/lib/search-course-tree.ts`. If the sandbox is still down, the UI shows the generic error message (network / non-OK response handling).

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Dev server with live sandbox API |
| `pnpm dev:mock` | Dev server with `VITE_USE_MOCK_API=true` (recommended demo) |
| `pnpm build` | Production build |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run unit tests once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm lint` | ESLint |

## Tests

Tree ordering and indentation logic are covered in `tests/lib/course-tree.test.ts` (matches the assignment **Lab** example). Live API fetch, response validation, and parsing are in `tests/lib/search-course-tree.test.ts`.

## Project layout

- `src/components/course-search.tsx` — search form, loading/error/empty states, results list
- `src/api/course-tree-search.ts` — chooses live API vs mocks (`VITE_USE_MOCK_API`)
- `src/schemas/course-tree/courseTreeSchema.ts` — API boundary schemas and inferred `CourseItem`
- `src/lib/course-tree.ts` — flat list → preorder rows with depth (`CourseTreeRow`)
- `src/lib/search-course-tree.ts` — fetch sandbox API, validate JSON (`parseCourseTreeSearchPayload`)
- `src/mocks/` — mock data, client-side filter, scenario picker (dev only)
