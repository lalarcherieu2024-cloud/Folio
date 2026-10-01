# Working on Folio as a team of three

Each person owns a slice of the code. Stay inside your slice and you will almost never get merge conflicts.

| Slice | Owner | Routes | Components | Data and actions |
|---|---|---|---|---|
| **Front page** | Person C | `src/app/(marketing)/` (`/`, `/signin`, `/signup`, `/how-it-works`) | `src/components/marketing/` | none |
| **Student interface** | Person B | `src/app/(student)/` (`/home`, `/projects`, `/applications`, `/profile`) | `src/components/student/` | `src/lib/data/student.ts`, `src/app/actions/student.ts` |
| **Startup / SME interface** | Person A | `src/app/(startup)/` (`/company/...`) | `src/components/startup/` | `src/lib/data/startup.ts`, `src/app/actions/startup.ts` |

Route groups like `(student)` are only folders for organising: they do not appear in the URL.

## Shared code (change only through a small, reviewed pull request)
- `src/components/shared/` (Logo, ProjectCard, CredentialCard) and `src/components/shell/` (sidebar, top bar, `nav.ts`)
- `src/components/ui/` (shadcn components): add new ones with `npx shadcn@latest add <name>`
- `src/lib/types.ts`, `src/lib/auth.ts`, `src/lib/data/shared.ts`, `src/lib/data/projects.ts`, `src/app/globals.css`
- `supabase/migrations/`

To add a link to the sidebar, add one line to your role's list in `src/components/shell/nav.ts`.

## Accounts and roles
- Every account has a `role`: `student` or `company` (`profiles.role`).
- Create a company account for testing at `/signup?role=company`.
- Guard every page with `requireUser(path, role)` from `src/lib/auth.ts`. A student who opens a `/company` page is sent to their own home, and the other way round.
- `/` is the public front page. Signed-in people are sent to `homeFor(role)` (see `src/lib/routes.ts`).

## Database changes
- Migrations are numbered files in `supabase/migrations/`. Run them in order in the Supabase SQL Editor.
- **Only the startup owner adds migrations for company features**; the others ask them. This stops two people creating `0006_...` at once.
- Never put secrets in git. Copy `.env.example` to `.env.local` and fill it in.

## Git
1. `git checkout main && git pull`, then `git checkout -b <your-slice>` (for example `startup-side`).
2. Commit small and often. Open a pull request at least every day or two.
3. Run `git pull origin main` at the start of every work session.
4. Before opening a pull request: `npm run lint && npx tsc --noEmit && npm run build`.

## Run it
```bash
npm install
npm run dev
```
