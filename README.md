# Jarvis · Build 1

A private, single-user command-center web app for schedule, academic work, recruiting, and personal projects.

## Current slice

- Responsive authenticated app shell and dark mode
- Calendar-first dashboard with live current-time indicator
- Day, week, and month calendar views
- Live Google Calendar connection with secure OAuth, automatic refresh, read-only event sync, and explicit event publishing
- Local event-draft creation when Google Calendar is disconnected
- Work tabs with local task create, edit, complete, reopen, and delete interactions
- Dedicated Health, Fitness, Weather, and Settings pages
- Google Calendar, Canvas, and Weather adapter boundaries
- PostgreSQL schema for settings, connections, imported data, tasks, drafts, and activity logs
- Unit, component, end-to-end, and CI foundations

Calendar preview data is replaced by live Google events after connection. Canvas remains in setup-pending preview mode.

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

## Connect Google Calendar

1. In Google Cloud, enable the Google Calendar API and create an OAuth 2.0 Web application client.
2. Add `http://localhost:3000/api/integrations/google-calendar/callback` as an authorized redirect URI.
3. Add the client ID and secret to `GOOGLE_CALENDAR_CLIENT_ID` and `GOOGLE_CALENDAR_CLIENT_SECRET` in `.env.local`.
4. Generate `CREDENTIAL_ENCRYPTION_KEY` with `openssl rand -base64 32` and add it to `.env.local`.
5. Restart `npm run dev`, open Jarvis Settings, and select **Connect Google Calendar**.

Jarvis requests email identity, read-only access to calendar events, and event access for calendars you own. Imported events cannot be edited or deleted in Jarvis. Only events explicitly created through Jarvis are published. Local OAuth credentials are encrypted in an HttpOnly cookie; production database persistence remains a separate deployment step.

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

Google Calendar credentials are required for its Connect button. Canvas credentials remain optional.

## Deployment target

The planned production target is Vercel with Neon PostgreSQL. Deployment begins after the local preview and persistence layer are accepted and the production OAuth callback URLs are known.

See [docs/architecture.md](docs/architecture.md) for service boundaries and security decisions.
