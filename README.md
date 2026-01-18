# Agentix

A developer-focused command-line AI agent platform for local development and integrations.

## CLI Preview

![Agentix CLI](https://github.com/Rohit03022006/Agentix/blob/master/CLI.png)


## Tech Stack

### Frontend

* **Next.js** – React framework for building fast, production-ready web applications
* **shadcn/ui** – Accessible, composable UI components built on Radix UI & Tailwind CSS
* **Tailwind CSS** – Utility-first CSS framework for rapid UI development

### Backend & Auth

* **Better Auth** – Authentication and authorization for modern web apps
* **Prisma** – Type-safe ORM for database access and migrations

### AI & Agents

* **ai-sdk/google** – Google Gemini integration via the AI SDK
* **Google Generative AI (Gemini)** – LLM used for agent reasoning and code generation

### CLI & Developer Experience

* **Clack** – Elegant, interactive CLI prompts
* **Node.js** – Runtime for the CLI and backend services

---


### Project structure

* `server/` – backend services, CLI entrypoints, Prisma schema & migrations
* `client/` – Next.js frontend UI
* `react-tailwindcss-todo-app/` – example React + Tailwind integration
* `calculator-app/` – small static frontend example

---

## Requirements

* **Node.js** ≥ 18
* **npm**
* **Database**:

  * Recommended: Neon / PostgreSQL via Prisma
  * Alternative: SQLite (if supported by migrations)
* **API keys** (configured via environment variables):

  * Google Generative AI (Gemini)
  * GitHub OAuth

---

## Quickstart

### 1. Install dependencies

```bash
# Server
cd server
npm install

# Client (in another terminal)
cd ../client
npm install
```

---

### 2. Environment variables

Create a `.env` file inside `server/`:

```env
PORT=3001
DATABASE_URL=""

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3001

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

FRONTEND_URL=http://localhost:3000

GOOGLE_GENERATIVE_AI_API_KEY=
GOOGLE_MODEL=gemini-2.5-flash
```


---

### 3. Database setup (Prisma)

```bash
cd server
npx prisma migrate dev
```

---

### 4. Run the server and client

```bash
# Start backend
cd server
npm run dev

# Start Next.js frontend
cd ../client
npm run dev
```

---

### 5. Run the CLI

From the server directory:

```bash
cd server/src/cli
npm link
agentix
```

> `npm link` registers the `agentix` CLI globally for local development.

---

## Development Notes

* Prisma schema and migrations live in `server/prisma/`
* Configuration files are in `server/config/`

  * `agent.config.js`
  * `google.config.js`
  * `tools.config.js`
* Secrets should always be loaded via environment variables
* Add new CLI commands under:

  ```text
  server/src/cli/commands
  ```

---

## Contributing

1. Open an issue describing the feature or fix
2. Create a new branch
3. Add tests where applicable
4. Submit a pull request

---

