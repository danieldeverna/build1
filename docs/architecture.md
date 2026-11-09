# Jarvis architecture

Jarvis is a single Next.js application. Server-rendered pages, authenticated route handlers, provider adapters, and the relational data layer deploy together. There are no background workers or microservices in Build 1.

## Trust boundaries

- Authentication proves access to the private workspace; Google Calendar authorization is a separate consent flow.
- Google tokens are encrypted with AES-256-GCM in an HttpOnly, SameSite cookie for the local single-user build. Production deployment will move the same encrypted credential payload to PostgreSQL.
- Provider modules are server-only and return normalized domain records to the rest of the application.
- Imported events and assignments are immutable through Jarvis. The Google adapter will expose list and insert operations, never update or delete operations.
- Disconnected calendar items remain local drafts. When connected, explicit publishing uses a stable Jarvis idempotency key and tags the provider event as Jarvis-owned. The adapter never exposes update or delete operations.

## Data flow

```text
Browser → protected Next.js route → domain service → repository → PostgreSQL
                                      ↓
                              provider interface
                              ↙       ↓       ↘
                         Google    Canvas    Weather
```

The calendar uses the live Google adapter when its encrypted connection cookie is present and deterministic preview data otherwise. Canvas remains a mock boundary.

## Rendering strategy

- Server components fetch and compose initial page data.
- Client components are limited to interactions such as calendar navigation, theme selection, dialogs, and task state.
- Loading, empty, disconnected, stale, expired-token, and retryable-error states live beside the feature that owns them.

## Database

Drizzle schema definitions are in `src/db/schema.ts`. Production uses PostgreSQL. PGlite is reserved for isolated integration tests so contributors do not need Docker.
