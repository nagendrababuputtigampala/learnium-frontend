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

Unit-test coverage is gated at **100%** (lines, functions, branches,
statements) in `vite.config.ts` for every authored source file in the
coverage set. The only exclusions are `src/main.tsx` (bootstrap wiring that
only mounts the app), test files and the test setup.

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

## M4 review and bank

Lists use bounded summaries; open a question for its complete content and answer key.
Review supports status chips, material page counts, inline field errors, topic creation
and approval of saved valid drafts. Bank cards can fork directly into review.

Staff routes: `/review`, `/question-bank`, `/questions/:questionId`. Review is creator/admin
scoped; the approved bank is shared within the centre. Approval requires saved, valid content;
changing an approved question forks a new draft. Material previews link to their review queue.

For an isolated backend on another port:

```sh
VITE_API_PROXY_TARGET=http://localhost:8081 npm run dev -- --port 5174
```

The default proxy remains `http://localhost:8080`. The backend's
`docs/m4-review-api.md` and `docs/m4-requirements.md` describe the API and settled M4 policies.

## M4 definitions and publishing

Use **My Tests** to create a scored test or an unscored flashcard practice set from the
approved bank. The selected grade/subject locks the bank filter; saved items keep their
order and decimal marks. Published definitions remain editable, and their Delete control
explains why an already published definition cannot be removed.

**Publish saved definition** opens a final review. Its question/order/mark changes affect
only that publish. Select a managed batch, an opening/closing window (labelled with the
browser timezone), optional time limit and attempt/release/integrity/camera settings.
A successful publish shows a copyable join code and an instance link.

**Instances** shows currently manageable batches, derived statuses, windows and codes.
Code regeneration and early close require confirmation. Instance details show frozen
questions and assigned students; eligible late joiners come from the current active
batch roster and cannot be added after closing.

The marking engine is backend-only in M4. The student player, marking queue, reports,
submission trigger and camera/integrity capture remain later work.
