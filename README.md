# Learnium — Frontend

Web frontend for **Learnium**, a practice-and-progress platform for tutoring
centres: teachers upload a chapter, AI drafts questions, the teacher approves
them, students take the test, and parents see the progress. This repository is
the new production frontend, styled with the **Indigo Scholar** theme
(deep indigo + marigold; professional for adults, brighter for students).

> Status: **M0 skeleton** — app shell, routing, theme tokens, placeholder
> pages (Teacher Home, Login, 404) and the API client are in place.
> Authentication lands in M2; real data arrives feature by feature.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (default http://localhost:5173).

## Scripts

| Command               | What it does                                   |
| --------------------- | ---------------------------------------------- |
| `npm run dev`         | Start the dev server                           |
| `npm run build`       | Type-check (`tsc -b`) and build to `dist/`    |
| `npm run test`        | Run unit tests (Vitest)                        |
| `npm run test:coverage` | Unit tests with the 100% coverage gate       |
| `npm run preview`     | Preview the production build                   |

Unit-test coverage of authored code is gated at **100%** (lines, functions,
branches, statements) in `vite.config.ts`. Only `src/main.tsx`, test files and
the test setup are excluded.

## Configuration

| Env var             | Default   | Purpose                          |
| ------------------- | --------- | -------------------------------- |
| `VITE_API_BASE_URL` | `/api/v1` | Base URL of the backend API      |

In production the app is served by nginx (see `Dockerfile`), which proxies
`/api/` to the backend service, so the default same-origin base URL works
without extra configuration.

## Branch strategy

Work flows **feature branch → `dev` → `master`**:

- `dev` — integration branch; all feature work is built and reviewed here.
- `master` — release branch. The previous demo frontend was preserved by
  tagging `master` as **`legacy-demo`** before this rewrite began; that tag is
  the old demo, do not build on it.
- Feature branches are cut from `dev` and merged back into `dev` after review.
