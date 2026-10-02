# Grad Project Frontend

Frontend for an AI-powered university course offering and academic planning system.

The application provides interfaces for:

* Students
* Advisors
* Coordinators

It supports academic planning, course offerings, recommendations, notifications, and related university workflows.

## Tech Stack

* **React**
* **Vite**
* **JavaScript**
* **Tailwind CSS v4**
* **React Router**
* **ESLint**
* **Prettier**

## Project Structure

```text
grad-project-frontend/
├── src/
│   ├── assets/                 # Static assets
│   ├── components/
│   │   ├── common/             # Shared application components
│   │   └── ui/                 # Reusable UI components
│   ├── features/               # Feature-specific modules
│   ├── hooks/                  # Custom React hooks
│   ├── layouts/                # Application layouts
│   ├── pages/                  # Application pages
│   ├── routes/                 # React Router configuration
│   ├── services/               # API and external service communication
│   ├── utils/                  # Shared utilities
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── .env.example
├── .prettierignore
├── .prettierrc
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

## Setup

Clone the repository and run:

```bash
cd ~/github/grad/grad-project-frontend && \
npm install && \
npm install react-router-dom && \
npm install tailwindcss @tailwindcss/vite && \
npm install -D eslint prettier && \
mkdir -p src/{assets,components/common,components/ui,features,hooks,layouts,pages,routes,services,utils} && \
printf '%s\n' 'node_modules' 'dist' 'coverage' > .prettierignore && \
printf '%s\n' '{' '  "semi": true,' '  "singleQuote": false,' '  "trailingComma": "all",' '  "printWidth": 100' '}' > .prettierrc && \
printf '%s\n' 'VITE_API_URL=http://localhost:8000' > .env.example
```

## Environment Variables

Create a local `.env` file based on `.env.example`.

Example:

```env
VITE_API_URL=http://localhost:8000
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
