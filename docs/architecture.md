# Jarvis architecture

Jarvis is a single Next.js application. Server-rendered pages, authenticated route handlers, provider adapters, and the relational data layer deploy together. There are no background workers or microservices in Build 1.

## Trust boundaries

- Authentication proves access to the private workspace; Google Calendar authorization is a separate consent flow.
- Google and Canvas tokens are encrypted with AES-256-GCM before database persistence.
- Provider modules are server-only and return normalized domain records to the rest of the application.
- Imported events and assignments are immutable through Jarvis. The Google adapter will expose list and insert operations, never update or delete operations.
- New calendar items enter the `draft` state. Publishing claims the draft with a transaction, uses a stable provider event ID, then records the returned ID and activity entry. A retry reconciles the same external event.

## Data flow

```text
Browser → protected Next.js route → domain service → repository → PostgreSQL
                                      ↓
                              provider interface
                              ↙       ↓       ↘
                         Google    Canvas    Weather
```

The current preview uses deterministic mock adapters. Live adapters can replace them without changing dashboard, calendar, or work components.

## Rendering strategy

- Server components fetch and compose initial page data.
- Client components are limited to interactions such as calendar navigation, theme selection, dialogs, and task state.
- Loading, empty, disconnected, stale, expired-token, and retryable-error states live beside the feature that owns them.

## Database

Drizzle schema definitions are in `src/db/schema.ts`. Production uses PostgreSQL. PGlite is reserved for isolated integration tests so contributors do not need Docker.
