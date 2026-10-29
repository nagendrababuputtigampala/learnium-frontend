# Progress — feature/pdf-extraction (frontend, M3 branch 1)

Branched off dev b1362b68 (M2 + both fix rounds merged via PR #8).

- Done F1 (API + types + queries): MaterialDto / MaterialDetailDto /
  MaterialSourceType / ExtractionStatus added to lib/api.ts. New
  lib/materials.ts: API functions (paged list, detail, grade-subjects
  via the existing /master/grade-subjects, multipart PDF upload,
  paste-text create, delete), centre-scoped query keys
  (['materials', centreId, page] and ['materials', centreId, 'detail',
  id]), TanStack hooks whose mutations invalidate the ['materials']
  prefix, and extractionStatusInfo — plain-language chip label +
  explanation for all five extraction statuses. Material fixtures
  added. materials.test.tsx: 15 tests (status info, keys, every API
  function incl. FormData contents, every hook incl. invalidation).
- Done F3 (add material dialog; committed before F2 so the list page
  commit that imports it stays green): components/materials/
  AddMaterialDialog — Upload PDF / Paste text tabs over shared title +
  grade-subject fields, client guards (file required, 20 MB warning
  before submit, title/grade-subject required, pasted text required
  with a live character count), backend envelope messages surfaced
  (LRN-MAT-001 / LRN-MAT-003), submit disabled while in flight, and
  navigation to the material detail on success — with router state
  {deduplicated: true} when the backend reports the chapter already
  existed. 14 dialog tests incl. FormData contents and both create
  flows.
- Next: F2 materials list page + routes + nav.
- Failing tests: none.

---

# Progress — feature/auth-roles (frontend, M2)

## Codex fix round 2 (2026-10-28)

- FIX ROUND 2 COMPLETE: R2-F1 + R2-F2 landed (2 commits on top of
  7d987414). Final gate in one run: build green; 20 test files,
  184 tests, all passing; coverage 100% statements / branches /
  functions / lines. Not pushed — bundle handoff per the working
  agreement. (The backend's two round-2 items are a separate build.)

- R2-F2 done (late /me restores previous identity, P2): AuthProvider
  restore now captures the session generation at start and re-checks
  it after the refresh leg and after the /me leg before applying
  anything; the failure path clears only when the error is not stale
  AND the generation has not moved. A restore superseded by a login
  or logout is abandoned silently — it can neither overwrite the new
  identity with the old /me result nor resurrect a logged-out one,
  and a late /me failure no longer clears the fresher session.
  Tests: four interleavings (late /me vs fresh login, late /me vs
  logout, generation moving during the refresh leg, late /me failure
  vs fresh login). All four verified red against the pre-fix code.

- R2-F1 done (failed stale refresh, P2): refreshAccessToken now
  generation-checks its REJECTION path too — a refresh that fails
  after its session generation was superseded is rethrown as
  StaleSessionError, so the interceptor's stale branch leaves the
  newer session's tokens alone and never fires the expiry handler
  for it. Current-generation failures still propagate unchanged.
  Tests: stale rejection after clear, stale rejection vs a newer
  login's tokens, superseded rejection keeps the newer single-flight
  slot, interceptor-level stale-failure scenario.

## Codex fix round (2026-10-28)

- FIX ROUND COMPLETE: G1–G6 all landed (6 commits on top of
  f0ee3848). Final gate in one run: build green; 20 test files,
  176 tests, all passing; coverage 100% statements / branches /
  functions / lines. Not pushed — bundle handoff per the working
  agreement. Open pairing point: G6 expects `invited` on TeacherDto
  from the backend (see the G6 note below).

- G6 done (resend invite, UX): Teachers page shows a "Resend invite"
  action only for teachers in the invited state (new TeacherDto
  `invited` flag from the backend list DTO; those rows also get an
  "Invited" status badge instead of "Active"). It posts to
  POST /admin/teachers/{id}/resend-invite, confirms with
  "Invitation re-sent to <email>", and surfaces the error envelope
  message on failure. Tests: visibility per state, endpoint call +
  success notice, error surfacing. NOTE for the backend pairing: the
  frontend reads the pending state from a boolean `invited` field on
  TeacherDto — the backend list DTO must expose it under that name.

- G5 done (standard sign-in background, UX): per-centre backgrounds
  were dropped by the product owner — ONE standard backdrop for all.
  New committed asset src/assets/signin-background.svg (deep-indigo
  gradient, dot grid, soft glows, subtle marigold open-book motif),
  imported by the Login and Join pages and applied as a full-page
  cover background behind the white card (small enough that Vite
  inlines it into the bundle as a data URI — verified in dist). No
  configuration or per-centre logic. Background-presence tests on
  both pages.

- G4 done (join back navigation, UX): /join shows a "Back to sign in"
  link (Lucide ArrowLeft) at the top of the card — the join flow is a
  single page, so it is present at every step — navigating to /login.
  Presence + navigation test added.

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
