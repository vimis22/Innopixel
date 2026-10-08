# Innopixel frontend

Public website plus **Innopixel Studio**, the internal project management platform (`/login`, `/app`).

## Run

```bash
npm install
cp .env.example .env   # optional; mock mode is the default
npm run dev            # http://localhost:5173
npm run build          # type-check + production build
npm run lint
```

## Internal platform (development mode)

There is no backend yet. The platform runs on a **development-only mock**: login and all data live in the
browser's `localStorage` (seeded with realistic demo projects on first use). It offers **no real security** –
role checks in the browser only control what is shown.

Demo accounts (password for all: `innopixel-demo`, also listed on the login page):

| E-mail | Role | Note |
|---|---|---|
| mette@innopixel.dk | Administrator | Full access, project manager on two projects |
| mikkel@innopixel.dk | Administrator | |
| ahmad@innopixel.dk | Employee | Project manager of "AR-produktvisualisering" (can plan that project) |
| jonas@innopixel.dk | Employee | Assigned to tasks in several projects |
| sofie@, laura@, emil@innopixel.dk | Employee | |

*Indstillinger → Nulstil demo-data* restores the seed data.

### Architecture

```text
src/
  config/        routes, data-source selection (auth.ts, services.ts)
  types/domain.ts  domain models (User, Project, ProjectMember, Task, TaskDependency, Milestone, …)
  features/
    auth/        AuthContext, mock auth service, permission rules, route guard, login page
    workspace/   WorkspaceContext (single source of truth), repository interface + mock, seed data,
                 progress/schedule calculations (progress.ts), selectors
    app/         app shell: sidebar, topbar (search, user menu), navigation
    dashboard/ projects/ tasks/ gantt/ kanban/ milestones/ team/ settings/
  components/ui/ Modal, toasts/confirm, badges, progress bar, avatars, empty/error states
  i18n/app/      Danish UI text for the platform (typed, ready for an English dictionary)
  styles/app.css platform styles (built on the variables in style.css)
```

Every change goes through `WorkspaceRepository` and the data is reloaded afterwards, so the dashboard, projects,
Kanban, Gantt and milestones always agree. To connect the ASP.NET Core API, implement `AuthService` and
`WorkspaceRepository` with axios (`services/api.ts`) and select them in `src/config/auth.ts` / `services.ts`.
The server must enforce the same rules as `features/auth/permissions.ts`.

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
