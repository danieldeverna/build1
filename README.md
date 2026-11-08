# Jarvis · Build 1

A private, single-user command-center web app for schedule, academic work, recruiting, and personal projects.

## Current slice

- Responsive authenticated app shell and dark mode
- Calendar-first dashboard with live current-time indicator
- Day, week, and month calendar views
- Local event-draft creation in preview mode
- Work tabs with local task create, edit, complete, reopen, and delete interactions
- Dedicated Health, Fitness, Weather, and Settings pages
- Google Calendar, Canvas, and Weather adapter boundaries
- PostgreSQL schema for settings, connections, imported data, tasks, drafts, and activity logs
- Unit, component, end-to-end, and CI foundations

The current UI uses clearly labeled preview data. It does not contact Google Calendar or Canvas and cannot mutate either provider.

## Local development

Requirements: Node.js 24 or later and npm 11 or later.

```bash
npm install
cp .env.example .env.local
```

For the credential-free local preview, set `APP_URL=http://localhost:3000` and `DEV_AUTH_BYPASS=true` in `.env.local`, then run. The bypass requires a loopback `APP_URL` and is restricted to localhost by the request proxy; never configure it in a deployed environment.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Playwright browser binaries are installed separately when end-to-end tests are needed:

```bash
npx playwright install chromium
npm run test:e2e
```

## Environment variables

All supported variables are documented without values in `.env.example`. Never commit `.env.local` or provider credentials.

Production requires:

- `APP_URL`
- `AUTH_SECRET`
- `AUTH_ALLOWED_EMAIL`
- `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`
- `DATABASE_URL`
- `CREDENTIAL_ENCRYPTION_KEY`

Google Calendar and Canvas credentials are only needed when their live adapters are enabled.

## Deployment target

The planned production target is Vercel with Neon PostgreSQL. Deployment begins after the local preview and persistence layer are accepted and the production OAuth callback URLs are known.

See [docs/architecture.md](docs/architecture.md) for service boundaries and security decisions.
