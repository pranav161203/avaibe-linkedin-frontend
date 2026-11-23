# AVAIBE LinkedIn app: frontend

The screens of the AVAIBE LinkedIn marketing app (React, Vite, Tailwind, shadcn/ui).
The API is the separate **avaibe-linkedin-backend** repository (Django).

## Run locally

```powershell
npm install
npm run dev            # http://localhost:5173 with sample data: no backend or database needed
npm run dev:api        # http://localhost:5173 with the backend: forwards /api to http://127.0.0.1:8000
```

To point at another backend (for example the Test2 copy on port 8002):

```powershell
$env:API_TARGET = 'http://127.0.0.1:8002'; $env:VITE_COPY_LABEL = 'Test2'
npm run dev:api -- --port 5175 --strictPort
```

### Sample data (`npm run dev`)

The api functions read sample data kept in the browser (`src/sample-data/`) instead of calling the backend,
so every screen can be built and clicked through: demo sign-in, Dashboard, Data, Suggestions, Calendar,
Publishing and Create post (approve → publish), Leads & sales, LinkedIn connect, Settings and Team.

- Changes (new drafts, leads, settings…) stay in this browser and survive a reload. **Reset sample data** in the
  yellow banner starts over.
- Nothing is sent anywhere; the AI and LinkedIn features return ready-made answers. Imported files are not read.
- `npm run build:sample` builds the same thing for hosting without a backend. `npm run build` (production) uses
  the backend and leaves the sample data out entirely.
- When an endpoint changes, update it in `src/lib/apiConfig.ts` / `src/lib/api.ts` (and `src/types/api.ts`) and in `src/sample-data/api.ts`;
  the type checker points at anything that no longer matches.

## How the code is organised

Same layout and API flow as the Kutubi admin panel:

```
src/
  lib/axios.ts         axios instance: session cookie, CSRF header, 401 → sign-in, readable errors
  lib/apiConfig.ts     API_ENDPOINTS: every backend address
  lib/api.ts           one async function per endpoint (getPosts, createLead, plannedPostAction…)
  types/api.ts         what the API sends and receives
  providers/           queryClient and AppProvider (React Query, theme, auth, account)
  pages/<page>/        one folder per page:
    <Name>Page.tsx       the page
    components/          its parts
    queries/index.ts     its React Query hooks: useGetX (reads), useCreateX / useSaveX / useDeleteX (writes)
    constants/ utils/ hooks/ types.ts   when the page needs them
  components/layout/   sidebar, top bar, page frame
  components/ui/       shadcn/ui building blocks
  routes/              every address; pages load on demand
  sample-data/api.ts   the same functions as lib/api.ts, answered from sample data (npm run dev)
```

The flow is always: component → `pages/<page>/queries` hook → `lib/api.ts` function → `lib/axios.ts`.
A hook used by several pages lives with the page that owns the data (posts and numbers in `pages/data/queries`,
the publishing queue in `pages/publishing/queries`…) and other pages import it from there.

With `npm run dev` (and `build:sample`) Vite points `@/lib/api` at `src/sample-data/api.ts`, so components and
hooks are identical in both modes. `src/sample-data/matches-api.ts` makes the type check fail if the sample
functions ever stop matching the real ones.

## Host on Vercel

1. vercel.com → **Add New → Project** → choose this repository (framework: Vite, detected; no root directory needed).
2. Environment variable `VITE_DEMO_BANNER` = `1` shows "Demo data" across the top.
3. `vercel.json` forwards `/api/...` to the backend on Render. If the Render service has another address,
   change it there, commit and push.

A production build (`npm run build`) loads all data from `/api`; for a hosted copy without a backend use `npm run build:sample`.
Hosting steps for the backend and database are in the backend repository's `DEPLOY.md`.

## Checks

```powershell
npx tsc -b             # type check
npm run build          # production build into dist/
```
