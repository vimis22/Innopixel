# Innopixel frontend

Public website plus **Innopixel Studio**, the internal project management platform (`/login`, `/app`).

## Run

The frontend needs the backend (ASP.NET Core, `../backend`) and its PostgreSQL database.

```bash
npm install
cp .env.example .env   # VITE_API_BASE_URL=/api, VITE_API_PROXY_TARGET=http://localhost:5165
npm run dev            # http://localhost:5173 (start the backend first: dotnet run in backend/src/Innopixel.Main)
npm run build          # type-check + production build
npm run lint
npm test
```

In development Vite forwards `/api` (and uploaded images under `/uploads`) to the backend, so the website and the
API share one address and the login cookie works without CORS.

## Data

Everything comes from the API; the frontend contains no demo or mock data.

- **Public website:** projects and services (`GET /api/public/projects|services?lang=da|en`), contact form
  (`POST /api/contact`).
- **Innopixel Studio** (`/login`, `/app`): login with an HttpOnly session cookie (`/api/auth/*`) and all platform data
  (`/api/workspace/*`). The server checks every permission; `features/auth/permissions.ts` only decides what is shown.

Accounts are created by an administrator under *Team*. A new account gets a temporary password, shown once, which
the employee changes under *Indstillinger → Sikkerhed*. The first administrator (Michael Lundorff Hansen) is created
by `backend/database/003_seed_content.sql`; see the backend for how the first password is set.

### Architecture

```text
src/
  config/        routes, data-source selection (auth.ts, services.ts)
  services/      axios instance (api.ts), public website content (publicContent.ts)
  types/         domain.ts (platform, matches the API), project.ts / service.ts (website)
  features/
    auth/        AuthContext, API auth service, permission rules, route guard, login page
    workspace/   WorkspaceContext (single source of truth), repository interface + API implementation,
                 error translation (apiErrors.ts), progress/schedule calculations (progress.ts), selectors
    app/         app shell: sidebar, topbar (search, user menu), navigation
    dashboard/ projects/ tasks/ gantt/ kanban/ milestones/ team/ settings/
  components/ui/ Modal, toasts/confirm, badges, progress bar, avatars, empty/error states
  i18n/app/      Danish UI text for the platform; the backend sends message keys that are looked up here
  test/          test fixtures (only used by the unit tests)
```

Every change goes through `WorkspaceRepository` and the data is reloaded afterwards, so the dashboard, projects,
Kanban, Gantt and milestones always agree.

How progress is calculated is documented at the top of `features/workspace/progress.ts`.

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
