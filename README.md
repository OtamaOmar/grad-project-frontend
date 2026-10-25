# Grad Project Frontend

Frontend for an AI-powered university course offering and academic planning system.

The application provides interfaces for:

* Students
* Advisors
* Coordinators
* Admins (reference data; mock data only until the API contract adds an admin role)

It supports academic planning, course offerings, recommendations, notifications, and related university workflows.

## Tech Stack

* **React**
* **Vite**
* **JavaScript**
* **Tailwind CSS v4**
* **React Router**
* **TanStack Query** (server state)
* **i18next** (English / Arabic, RTL)
* **ESLint**
* **Prettier**

## Project Structure

```text
grad-project-frontend/
├── Grad_Designs/               # UI designs per role (screen.png + code.html, light & dark)
├── docs/                       # API contract, DB design, forecast I/O, project plan
├── src/
│   ├── assets/                 # Static assets
│   ├── components/
│   │   ├── common/             # App-level pieces (page placeholder, loaders, error boundary)
│   │   └── ui/                 # Reusable design-system components (Button, Card, Table…)
│   ├── config/                 # env, roles, per-role navigation
│   ├── features/               # Feature modules (logic + feature components), e.g. auth, admin/users
│   ├── hooks/                  # Shared hooks (useTheme, useLanguage, useDocumentTitle)
│   ├── i18n/
│   │   ├── index.js            # i18next setup, auto-loads every locale file
│   │   └── locales/{en,ar}/    # One JSON per namespace; same file name in both languages
│   ├── layouts/                # RootLayout, PublicLayout, AppLayout (role shell)
│   ├── mocks/
│   │   ├── server.js           # In-browser mock API used when VITE_USE_MOCKS=true
│   │   ├── data/               # Mock fixtures
│   │   └── handlers/           # { method, path, handler } per resource, auto-registered
│   ├── pages/                  # One file per routed screen
│   │   ├── public/             # Landing, login, sign up, password reset
│   │   ├── shared/             # Notifications, help, profile (any signed-in role)
│   │   ├── admin/ coordinator/ student/ advisor/
│   │   └── errors/             # 404, 403
│   ├── routes/
│   │   ├── paths.js            # Every URL in the app — import from here
│   │   ├── router.jsx          # Route tree
│   │   └── <role>Routes.js     # Lazy-loaded routes per role
│   ├── services/
│   │   ├── http.js             # The only place that talks to the network (or mocks)
│   │   ├── ApiError.js         # Error type every failed call throws
│   │   ├── queryClient.js      # TanStack Query defaults
│   │   └── api/                # One module per backend resource
│   ├── utils/                  # Formatting (numbers/dates per locale), cn()
│   ├── App.jsx                 # Providers + router
│   ├── main.jsx
│   └── index.css               # Tailwind + design tokens (light/dark)
└── …config files
```

### Routing

| Area | Base path | Owner |
|---|---|---|
| Public | `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password` | Hamza |
| Shared | `/notifications`, `/help`, `/profile` | Hamza |
| Student | `/student/*` | Hamza |
| Coordinator | `/coordinator/*` | Abdelrahman |
| Advisor | `/advisor/*` | Abdelrahman |
| Admin | `/admin/*` | Omar |

All paths live in `src/routes/paths.js`. Every page starts as a placeholder that names its owner,
branch, and design folder; replace the file's contents with the real page.

### How a page gets data

```text
Page → feature hook (TanStack Query) → services/api/<resource>.js → services/http.js
                                                                     ├─ VITE_USE_MOCKS=true  → src/mocks
                                                                     └─ VITE_USE_MOCKS=false → Node API
```

Pages never call `fetch` directly. Switching from mocks to the real backend is an `.env` change.

### Language and theme

* Every user-facing string goes through `t()` with a key in `src/i18n/locales/en/*.json` **and**
  the same key in `ar/*.json`.
* Arabic switches the document to `dir="rtl"`. Use logical Tailwind classes (`ms-*`, `me-*`,
  `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`) instead of `ml/mr/pl/pr/left/right`.
* Colors come from design tokens (`bg-surface`, `text-on-surface`, `bg-primary`…), never raw hex,
  so light and dark mode both work.

## Setup

Clone the repository and run:

```bash
npm install
cp .env.example .env
```

## Environment Variables

Create a local `.env` file based on `.env.example`.

Example:

```env
VITE_API_URL=http://localhost:3000/api
VITE_USE_MOCKS=true
```

> **Note:** Vite exposes variables prefixed with `VITE_` to the client. Never store secrets or private credentials in `VITE_*` environment variables.

## Development

Start the development server:

```bash
npm run dev
```

Build the application for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Run ESLint:

```bash
npm run lint
```

Format the project:

```bash
npm run format
```

Check formatting without modifying files:

```bash
npm run format:check
```

## React + Vite

This project is built with React and Vite, providing a fast development environment with Hot Module Replacement (HMR).

The official React Vite plugins include:

* `@vitejs/plugin-react` — uses Oxc
* `@vitejs/plugin-react-swc` — uses SWC

The project currently uses JavaScript rather than TypeScript.

## React Compiler

The React Compiler is **not enabled** at this stage.

It can be introduced later if the project requires it and its development/build performance impact is acceptable.

## Tailwind CSS

The project uses **Tailwind CSS v4** for styling.

Tailwind is integrated with Vite through:

```text
@tailwindcss/vite
```

## Application Architecture

The frontend communicates with the Node.js backend through the configured API URL.

```text
┌─────────────────────────┐
│      React Frontend     │
│                         │
│  Pages / Components     │
│  Features / Services    │
└────────────┬────────────┘
             │
             │ HTTP API
             ▼
┌─────────────────────────┐
│    Node.js Backend      │
│        Express          │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   Python AI / LLM       │
│        FastAPI          │
└─────────────────────────┘
```

## Development Guidelines

* Use JavaScript, not TypeScript.
* Keep reusable components inside `components/`.
* Keep feature-specific logic inside `features/`.
* Keep API communication inside `services/`.
* Keep shared React hooks inside `hooks/`.
* Keep routing configuration inside `routes/`.
* Avoid adding dependencies unless they are actually required.
* Keep secrets and private credentials out of the frontend.

## Status

🚧 **Under Development**

The frontend foundation and project structure are established. Application pages, features, API integration, authentication, academic planning workflows, recommendations, and notifications will be implemented incrementally.

## License

This project is developed as part of a university graduation project.
