# Progress — feature/auth-roles (frontend, M2)

## Codex fix round (2026-10-28)

- G3 done (password visibility toggle, UX): new shared PasswordInput
  component (Lucide Eye/EyeOff, aria-label swaps Show/Hide password,
  type=button) wired into the Login page password field and both
  Set Password fields; adds the lucide-react dependency. Component
  test + toggle tests on both pages.

- G1 done (cache isolation, P1): AuthProvider cancels + clears the
  whole React Query cache (queries AND mutations) on every session
  transition — login, logout, session expiry, restore failure and
  student-session start — before the new identity drives rendering.
  Centre-owned keys are scoped by centreId: ['batches', centreId],
  ['teachers', centreId, page], ['teachers-count', centreId],
  ['teachers-all', centreId], ['centre', centreId]; roster stays
  batch-scoped and the ['batches']/['teachers'] prefix invalidations
  still match. Dismissing the one-time PIN notice now also clears the
  mutation cache (observer reset() alone leaves data in the cache in
  this React Query version). One BatchesPage test assertion was scoped
  to the batch card: with the centreId key, the list settles after
  restore, when the grade-subject <option> with the same label text
  also exists (in production the route guard mounts pages only with a
  restored user, so the transient undefined-centreId key is test-only).
  auth.test.ts +6 cache-isolation tests, RosterPanel +1 PIN-cache test.

- G2 done (refresh generation guard, P2): api.ts gains a session
  generation counter — clearTokens() and advanceSessionGeneration()
  advance it; refreshAccessToken captures the generation and discards
  its result with StaleSessionError if the generation moved (logout or
  newer login), never writing stale tokens; a superseded refresh no
  longer clears the single-flight slot of a newer one. The 401
  interceptor leaves a newer session's tokens and the session-expired
  handler untouched when its refresh goes stale. mockApi mirrors the
  new exports. api.test.ts: +5 tests (33 total) incl. deferred-refresh
  races across logout and re-login.

- Done S5 (auth wiring & landing): api client with in-memory access token,
  localStorage refresh token, single-flight 401 refresh + retry (auth
  endpoints excluded), session-expired hook; AuthProvider (restore via
  refresh + /me, login/logout/studentSession); route guards
  (ProtectedRoute/AdminRoute); Login wired with RHF+Zod and role landing
  (admin → /admin, teacher → /); ForgotPassword and SetPassword
  (invite/reset) pages; Teacher Home greets the user and lists live
  batches; Centre Overview at /admin with counts + quick links; sidebar
  hides admin-only entries (Teachers, Centre Settings) from teachers and
  gained user footer + sign out; Vite dev proxy /api → localhost:8080.
  Build green; 100% coverage on all files.
- Design decisions: M0 skeleton tests that encoded pre-auth behaviour
  (unguarded routes, static Teacher Home content, placeholder login
  submit) were rewritten to the M2 behaviour with equal or better
  coverage. Deactivate confirmations use an inline two-step button
  (no window.confirm) — deterministic in tests and better UX.
- Done S6 (admin & roster UI + student join): TeachersPage (paged table,
  invite form → invite-sent notice, inline-confirm deactivate); BatchesPage
  (batch list, admin create form with grade-subject select, assign/remove
  teacher, roster expand); RosterPanel (list with status + PIN-locked
  badges, add single, bulk add one-per-line, reset-PIN, deactivate; PINs
  from create/reset shown once in a dismissible panel with copy button,
  never re-fetched); CentreSettingsPage (GET /centre prefilled form, PUT
  save with success feedback); JoinPage (public, centre → batch selects,
  name + PIN student session; ?batch=<uuid> preselects the batch and its
  centre via a lookup across centres); StudentHomePage (greets the student
  from the real session store, redirects to /join without one). Routes:
  /batches in the layout, /admin/teachers + /admin/settings behind
  AdminRoute, /join + /student outside the layout. Final state: build
  green; 153 tests, 19 files; 100% statements/branches/functions/lines.
- S6 notes: one timing flake in the full suite (auth logout test, 1s
  default waitFor under parallel load) fixed by widening that test's
  waitFor timeouts to 5s; JoinPage lookup reads the loaded centre list
  via the query's `enabled` gate (no dead fallback branch).
- Next: none on this branch — M2 frontend complete, awaiting review/merge.
- Failing tests: none.

---

# Progress — feature/port-domain-model (frontend)

- Done: M0 skeleton — Vite + React + TS, Indigo Scholar tokens, sidebar shell,
  routes (home/login/404), Axios client for /api/v1, Dockerfile + CI.
  Build green; 21 tests; 100% statements/branches/functions/lines on authored
  files, thresholds enforced.
- Done: branch restructure per Nagendra (2026-10-28) — skeleton commits moved
  from `dev` onto this branch; `dev` reset to a clean root commit. This repo
  has no M1 code (M1 is backend domain only); its MR goes up with the
  backend's M0+M1 MR.
- Failing tests: none.

- PR fix (2026-10-28): dev root merged into this branch (--allow-unrelated-histories) so GitHub accepts the PR; dev tree was empty, no content change.
