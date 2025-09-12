# Repository Guidelines

## Project Structure & Module Organization
- `pages/` Next.js Pages Router (routes, API, layouts). Primary app surface.
- `app/` App Router/edge-specific routes or experiments.
- `components/` Reusable UI and feature components; `components/ui/` contains shadcn/Tailwind primitives.
- `lib/` Server/client utilities, services (auth, emails, tracking, Tinybird, Redis, etc.).
- `prisma/` Database schema and migrations. Edit `prisma/schema/*.prisma`; migrations live in `prisma/migrations/`.
- `public/` Static assets. `styles/` global styles and Tailwind config.
- `context/`, `ee/` Feature contexts and enterprise modules.

## Build, Test, and Development Commands
- `npm run dev` Start the dev server at `http://localhost:3000`.
- `npm run build` Production build + type-check.
- `npm start` Run the built app.
- `npm run lint` ESLint (Next.js rules). `npm run format` Prettier write.
- `npm run dev:prisma` Generate client and deploy local migrations.
- `npm run email` Email preview server for `components/emails` on `:3001`.
- `npm run stripe:webhook` Forward Stripe events to `/api/stripe/webhook`.
- `npm run trigger:v3:dev` Run Trigger.dev jobs locally.

## Coding Style & Naming Conventions
- Language: TypeScript. Indent 2 spaces; Prettier enforces style and import order.
- Files: kebab-case for files (`components/ui/button.tsx`), PascalCase for React components.
- Hooks/components: prefix hooks with `use*`; colocate simple helpers next to usage or in `lib/*`.
- Lint: Next.js core-web-vitals; disable `no-img-element` project-wide.
- Tailwind: keep classes concise; plugin sorts classes automatically.

## Testing Guidelines
- No dedicated test framework in-repo. Validate by running `npm run lint` and `npm run build`, and smoke-testing flows.
- If adding tests, prefer Playwright (e2e) or Vitest (unit). Name tests `*.test.ts(x)` and colocate or use `__tests__/`.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, etc. in imperative present.
- PRs include: clear description, linked issues, screenshots for UI, steps to verify, and notes on env/migrations.
- Schema changes: edit `prisma/schema/*.prisma`, then add a migration (example):
  `./prisma/add-migration.sh --name add-viewer-index --user <db_user>`; commit the new folder under `prisma/migrations/`.

## Security & Configuration Tips
- Copy `.env.example` to `.env`. Set Postgres URLs: `POSTGRES_PRISMA_URL`, `POSTGRES_PRISMA_URL_NON_POOLING`, `POSTGRES_PRISMA_SHADOW_URL`.
- Configure storage (AWS S3 or Vercel Blob), email (Resend), analytics (Tinybird token), and Stripe secrets.
- Never commit secrets; avoid logging sensitive values; keep server-only keys on the server.

