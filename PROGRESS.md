# Progress — feature/auth-roles (frontend, M2)

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
- Next: S6 — Teachers page, Batches page + roster panel, Centre
  Settings page, student Join page + Student Home.
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
