# Progress — feature/student-flow (M5)

## Part 5 — integrity + camera (feature/integrity-camera, Edison-built, 2026-11-03)

- F1: useIntegrityMonitor hook — visibility/blur/mouse-leave/fullscreen-exit
  listeners, 10s batched flush (plus flush before submit and on unmount),
  transient "flagged to your teacher" warning, best-effort fullscreen entry.
- F2: camera gate in the player — an LRN-ATT-004 start response opens the
  CameraCheck screen (live preview, capture/retake, spec notice, denial
  state); the returned token retries the start. useCameraCapture keeps the
  stream open during camera-ON attempts, uploads a frame every ~45s
  (jittered) and on integrity events, and reports CAMERA_LOST once when the
  stream ends or cannot open.
- F3: teacher InstanceAttemptsPage at /instances/:id/attempts (linked from
  instance cards) — score state, flag counts, expandable integrity timeline
  and snapshot viewer (authenticated blob fetches; views are audit-logged
  server-side), two-step invalidate.
- Student DTO types gained integritySignalsOn + cameraMode (backend 8d37eb4).
- Failing tests: none in the targeted run (49 tests across the 8 new/changed
  files); full suite + coverage gate run at feature end.

## Part 4 — student dashboard (2026-11-03)

- Added the student Dashboard tab with topic progress bars, exact strong/developing/focus
  chips, insufficient-data treatment and explicit strong/focus guidance.
- Added aggregate-only batch comparison cards, five recent results, pending-marking state
  and new-student/loading/error handling in a responsive single-column phone layout.
- Full verification: 431 tests across 40 files pass. Coverage is 100% statements
  (1505/1505), branches (1255/1255), functions (580/580) and lines (1225/1225).
  Lint and the production build pass; only the seven pre-existing compiler hints and the
  existing bundle-size warning remain.
- Part 4 is complete and committed before Part 5; no integrity/camera UI has started.

## Part 3 — marking queue and confirmation (2026-11-03)

- Added the staff marking queue grouped by published instance, with the teacher-nav
  pending badge and READY, MARKING, FAILED and manual-marking states.
- Added frozen question/answer review, AI criterion prefill, editable criterion marks,
  live half-up rescaling, feedback and final confirmation. Failed AI jobs can be rerun;
  answers without a suggestion open with intentionally blank manual inputs.
- Full verification: 426 tests across 39 files pass. Coverage is 100% statements
  (1484/1484), branches (1219/1219), functions (570/570) and lines (1209/1209).
  Lint and the production build pass; only the seven previously documented compiler
  hints and the existing bundle-size warning remain.
- Part 3 is complete and committed before Part 4; no dashboard UI has started.

## Checkpoint B — student player, results and practice (2026-11-03)

- Added the student test player with start/resume, one-question navigation, answered-state
  indicators, typed autosave, server-deadline countdown, save-and-next and unanswered review.
- Added submission routing and the result view for objective, pending-marking and confirmed
  states. Answer keys, solutions and feedback render only when the backend release policy
  includes them.
- Added the flashcard practice player with card flipping, Know it / Still learning controls
  and deliberately client-only progress. Tests-home cards now route to start, resume, result
  or practice as appropriate.
- Final verification: 415 tests across 37 files pass. Coverage is 100% statements
  (1401/1401), branches (1132/1132), functions (536/536) and lines (1148/1148).
  Lint and the production build pass; the existing non-blocking compiler hints and bundle
  size warning remain.
- Checkpoint B is complete and committed before Part 3; no Part 3 work has started.

## Checkpoint A — unified student login and Tests home (2026-11-03)

- Removed the PIN join/session UI and storage. The unified login accepts staff email or
  `username@centrecode`, routes by role, and enforces independent staff/student guards.
- Rebuilt roster management around real student accounts: optional contact email,
  suggested/editable usernames with live availability, existing-student selection, bulk
  add, rename, resend invite and membership deactivation, all centre-query scoped.
- Added the student-themed Tests home with assigned test cards, tabs, score/pending states,
  loading/error/empty handling and logout. `/join` now redirects to the unified login.
- Final verification: 399 tests across 34 files pass. Coverage is 100% statements
  (1288/1288), branches (1001/1001), functions (492/492) and lines (1104/1104).
  Production build and lint pass; lint retains seven non-blocking existing/compiler hints.
- Checkpoint A is complete. No player, autosave, submission, result or practice UI from
  Part 2 has started.

# Earlier progress — feature/publish (M4 branch 2)

## S1 — definition, publish and instance UI (2026-11-02)

- Updated feature/publish to the latest merged branch-1 frontend dev before editing.
- Added My Tests, grade/subject-locked compatible bank selection, ordered decimal-mark
  builder, save/delete controls and published-definition deletion explanations.
- Added independent final publish review, managed-batch selection, browser timezone
  labels, open/close window, optional minutes limit, retakes/release/integrity/camera
  settings, join-code copying and instance navigation.
- Added manageable instance lists/filtering, frozen-question/student details, active
  unassigned late-joiner selection and confirmable code regeneration/early close.
- Existing session/centre query scoping, shared API client and route guards are reused.
  No student player, marking queue UI or capture features were introduced.
- Form handlers independently reject invalid and duplicate implicit submissions while save
  or publish requests are pending; disabled controls are not the only safety boundary.
- Final production build and all 412 tests across 34 files passed. Coverage gates remain
  100% statements (1314/1314), branches (980/980), functions (491/491), lines (1166/1166).
- Lint passed with the same seven pre-existing warnings. Fresh production-container
  acceptance passed migrations, nginx routing, authenticated M2 onboarding, M4 review/bank
  and the complete publish/instance lifecycle.
- Next: none on this branch — frontend branch 2 is ready for review.

## Invalid-draft resilience and final validation (2026-11-02)

- Malformed rubric entries and missing MCQ options can be opened and rejected without
  crashing the editor or enabling approval.
- Final production build passed. `npm run test:coverage -- --maxWorkers=2` passed all
  374 tests across 32 files, with 100% statements (1104/1104), branches (792/792),
  functions (379/379), and lines (1028/1028). Limiting workers avoids local CPU contention
  with Java/Docker builds; no test timeouts or coverage thresholds were relaxed.
- Lint passed with seven warnings. The isolated full-stack HTTP/SMTP acceptance passed
  the review/bank integration, private source-material access checks and tenant isolation.

# Contract completion slice — M4 review and bank (2026-11-02)

- Review now consumes summary-only list responses; full payloads remain in staff detail views.
- Added Draft/Approved/Rejected filter chips, material topic/type/status page counts,
  correct-answer radio controls, inline accessible server field errors, validation hints,
  approval gating, rubric totals and scoped topic creation through the existing M3 hooks.
- Bank cards can fork directly into the new editable draft. Rejection remains available
  for invalid or unsaved content and uses a confirmation dialog.
- Green slice: production build passed; 373 tests across 32 files passed, with 100%
  statements (1102/1102), branches (786/786), functions (378/378), lines (1027/1027).
- Browser automation runtime is unavailable in this session; UI verification uses
  Testing Library interaction tests. Existing bundle size warning remains.

# Progress — feature/review-and-bank (frontend, 2026-11-02)

- Implemented private review queues, independent grade/subject filters, material grouping,
  all five type editors, field errors, save/approve/reject, revision-conflict reload,
  shared bank previews and immutable-question forks with lineage.
- Generated material questions display review status and link to the review queue.
- Verified: production build and 350 tests pass; statements, branches, functions and
  lines all reach 100% coverage. Backend Compose acceptance covers the API contracts.
- Next: review/merge branch 1, then implement definitions and publishing on `feature/publish`.

---

# Progress — feature/ai-generation (frontend, M3 branch 2)

Branched off dev 8cdb42ef (M2 + branch 1 merged via PR #9).

- Done H1 (API + types + hooks): generation types in lib/api.ts
  (QuestionTypeCode, GenerationDifficulty, GenerationJobStatus,
  GenerationFailureKind, Topic, GenerateJobRequest, GenerationJobDto,
  GenerationJobDetailDto, GenerationTypeResult, GeneratedQuestionDto
  with payload: unknown so renderers must defend). New lib/generation.ts:
  API functions (create job, poll job, paged material questions, topics
  of a grade-subject), centre-scoped keys (['generation-jobs', centreId,
  jobId] and ['materials', centreId, 'questions', materialId, page];
  topics keyed by gradeSubjectId as master data), hooks — useTopics
  (gated on a non-empty id), useGenerationJob (refetchInterval 2s while
  status is unknown/PENDING/RUNNING, stops at a terminal state),
  useCreateGenerationJob, useMaterialQuestions — and presentation
  helpers: questionTypeInfo (theme chips per type; NUMERIC uses the
  palette's bright indigo since the theme has no numeric colour),
  dropReasonLabel (plain words + fallback), failureKindInfo (headline,
  explanation, retryable flag mirroring the backend's transient kinds),
  generationJobPhase (queued/running/retrying/succeeded/failed — a
  PENDING/RUNNING job carrying a failureKind is mid-retry). Payload
  shapes confirmed from the backend DraftQuestionFactory: MCQ
  {stem, options[{id a–d, text}]} + correctRef = option id;
  FILL_BLANK {stemWithBlank, answer}; FLASHCARD {front, back};
  NUMERIC {stem, answerValue, tolerance, unit, workedSolution} +
  correctRef a JSON string; WRITTEN {stem, modelAnswer, rubric[{id
  crit-N, criterion, maxScore}]}. Retry semantics confirmed from
  GenerationWorker: MAX_ATTEMPTS 2; MODEL_ERROR / MALFORMED_RESPONSE /
  TRUNCATED reschedule to PENDING with the kind recorded; SAFETY_
  REFUSAL / ZERO_VALID / MATERIAL_DELETED are terminal. NOTE: the
  topics endpoint (GET /master/grade-subjects/{id}/topics) is NOT yet
  in the backend clone's CatalogController — built against the agreed
  spec [{topicId, name}]; flagged for the branch report. 17 lib tests
  incl. fake-timer polling transitions (PENDING→RUNNING→SUCCEEDED and
  stop-at-FAILED) verified stable across repeated runs.
- Done H2/H3 (generate dialog + job view): components/generation/
  QuestionTypeChip; GenerateQuestionsDialog (mirrors the AddMaterial
  dialog shell) — topic select from the material's grade-subject,
  difficulty select (Medium default), five per-type count inputs
  clamped 0–40 with a live total; validation in priority order (topic
  → at least one → total ≤ 40) disables Generate with the reason
  shown; topics loading/error/empty states handled; create errors
  surface the backend envelope message (LRN-GEN-*); on 202 the dialog
  transitions to GenerationJobView (footer action renamed "Done" so
  it never duplicates the header's Close label). GenerationJobView —
  queued/running (with "Attempt N of 2")/retrying/succeeded/failed
  phases from generationJobPhase; retrying distinguishes "will retry
  automatically" (back to PENDING) from "Retrying now" (RUNNING
  again); per-type results table (rows for types with requested > 0
  or received > 0) with drop counts and plain-word reasons; token
  usage line rendering only the recorded parts; on SUCCEEDED it
  invalidates ['materials', centreId, 'questions', materialId] and
  offers "View drafts". Small H1 amendment folded in: failureKindInfo
  now accepts null and returns a generic failure, so the view needs
  no unreachable null guards. 27 component tests (11 dialog + 16 job
  view) incl. polling-driven transitions and the invalidation key.
- Done H4 (draft preview + detail-page integration): components/
  generation/DraftQuestionCard — defensive per-type renderers over
  the persisted payload contract (every field type-checked; any
  mismatch, a non-object payload, or an unknown type code renders a
  generic fallback card with a neutral "Question" chip — the
  branch-1 legacy-null lesson); MCQ marks the option whose id equals
  correctRef; NUMERIC shows value ± tolerance + unit + worked
  solution; WRITTEN shows the model answer and rubric criteria with
  max scores (mark/marks wording); every card carries a provenance
  footer (provider · model · prompt version · date). Generated
  DraftsSection (id="generated-drafts") — paged read-only preview on
  the material detail page with the branch-1 pagination pattern and
  an honest empty state; NO edit/approve actions (M4). Detail page:
  "Generate questions" button enabled only when extractionStatus is
  OK, otherwise disabled with the one-line reason; lib gained
  isQuestionTypeCode + scrollToDrafts helpers (the job view's success
  invalidation refreshes the section; "View drafts" closes the
  dialog and scrolls to it). Existing detail/routes tests updated to
  serve the new questions endpoint. 40 new tests across card,
  section and page files incl. ~25 malformed-payload cases and the
  end-to-end generate → succeed → view-drafts flow.
- Branch complete: 317 tests (was 244 at branch 1), 100% statements/
  branches/functions/lines, build green — full gate run twice from a
  clean state. NOT pushed.
- Follow-up (add-a-topic in the generate dialog): the topic picker no
  longer dead-ends on a grade-subject with no topics. lib/generation
  gained createTopic + useCreateTopic (POST /master/grade-subjects/
  {id}/topics {name}; 201-created and 200-existing treated alike; the
  mutation invalidates the topics query) and MAX_TOPIC_NAME_LENGTH.
  The dialog preselects the topic when the list holds exactly one
  (a ref guards against overriding a teacher's explicit choice on
  refetch), offers a "+ New topic" inline form (name input + Add;
  Enter adds without submitting the generate form; blank or
  >200-char names blocked with a hint; a failed add keeps the typed
  name and shows the backend message), and renders the empty state
  as an invitation with the add form already open. A successful add
  selects the created/existing topic and collapses the form.
- Failing tests: none.

---

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
- Done F2 (materials list page): pages/MaterialsPage — paged cards
  with title link, grade · subject, source chip (PDF/Paste),
  ExtractionStatusChip with the honest plain-language labels,
  extracted character count (or "No extracted text"), added date;
  Teachers-style Previous/Next pagination; empty state with an
  "Add your first material" call to action; header "Add material"
  button opens the F3 dialog. Route /materials inside the protected
  layout (teacher + admin; signed-out visitors redirect to /login).
  Sidebar nav label settled as "Materials" (was the skeleton's
  "My Materials" — for an admin the list is the whole centre's).
  8 page tests + 3 AppRoutes tests.
- Done F4 (material detail page): pages/MaterialDetailPage at
  /materials/:materialId — metadata header (title, grade · subject,
  source chip, status chip, character count, added date), the
  status explanation with what-to-do-next wording, the extracted
  text in a scrollable preformatted block (or an honest "no
  extracted text" note), the deduplicated banner when arriving with
  router state {deduplicated: true} ("You already had this chapter —
  opened your existing copy"), and a two-step "Remove from your
  materials" delete that returns to the list. No generation UI —
  that arrives in branch 2. 10 detail tests + 2 route tests.
- Done F5 (final gate): from a clean state — 24 test files, 237
  tests, all passing; coverage 100% statements / branches /
  functions / lines (thresholds enforced); npm run build (tsc +
  vite) green. M3 branch 1 frontend COMPLETE. Not pushed — bundle
  handoff per the working agreement.
- Contract notes: DELETE /materials/{id} is treated as success on
  any 2xx (the frontend never inspects the body); the sidebar nav
  label for /materials is "Materials" (renamed from the skeleton's
  "My Materials"); create responses are read from the DTO's
  `deduplicated` flag (HTTP 200 vs 201 is not distinguished).
- Failing tests: none.
- Fix (manual-test bug, 2026-10-28): PDF upload returned 415 —
  createApiClient pinned an instance-wide Content-Type:
  application/json, which also made axios JSON-serialize FormData
  bodies. Pin removed (axios sets application/json itself for
  plain-object bodies); wire-level regression tests added in
  api.test.ts (capturing adapter: FormData stays FormData and never
  application/json; plain objects still send application/json),
  verified red against the pinned code.
- Fix (Codex review F-2, 2026-10-28): nginx.conf set no
  client_max_body_size, so nginx's 1 MB default would reject
  material PDFs in deployment well below the app's 20 MB limit.
  Added `client_max_body_size 21m;` at server level (20 MB product
  limit + multipart overhead). Config-only.
- Fix (Codex review F-4, 2026-10-28): legacy (pre-V10) materials
  have a null extractionStatus, but the frontend type was
  non-nullable and extractionStatusInfo did a bare record lookup —
  null came back undefined and the status chip threw (detail page
  had the same assumption). MaterialDto/MaterialDetailDto now type
  the status as ExtractionStatus | null; extractionStatusInfo
  accepts null and returns a "Not extracted" fallback (neutral chip
  + explanation that the material predates extraction and the
  chapter should be added again so its text can be read); the chip
  prop is nullable too. New fixtures (materialLegacy,
  materialDetailLegacy) and tests: null status info, chip render
  for null, list row and detail page for a legacy material — chip
  and info tests verified red against the old lookup.

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
