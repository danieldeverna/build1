# Changelog

All notable changes to Jarvis are documented in this file.

## [0.7.0.0] - 2026-11-10

### Added

- Added private, user-scoped task persistence with lifecycle activity logs for creation, edits, completion, reopening, and archival.
- Added a local on-device database fallback for the single-user preview, while deployed environments continue to require an explicit PostgreSQL connection.
- Added a shared live calendar data source used by Calendar, Dashboard daily agenda, and Fitness preview.

### Changed

- Archived tasks are now hidden from Work and Dashboard instead of being permanently deleted.
- Daily agenda now renders the shared calendar, and Calendar shows the current-time line and opens near the current hour.
- Calendar drag-and-drop changes are saved immediately without opening the edit dialog.

### Fixed

- Kept calendar overlays in sync across same-tab views and prevented duplicate polling by consolidating calendar ownership in the app shell.
- Made browser tests deterministic for the single-user local database and added lifecycle, ownership, shared-agenda, current-time, drag, and overlay notification coverage.

## [0.6.0.0] - 2026-11-10

### Added

- Added a dedicated Gmail OAuth connection in Settings with encrypted credentials, refresh support, account validation, and disconnect/revocation handling.
- Added a read-only Gmail adapter and protected message-list and message-read endpoints for future private briefing features.
- Added a recent-mail preview after Gmail connection and setup documentation for the Gmail API and OAuth redirect URI.

### Security

- Requested only Gmail's `gmail.readonly` scope. Jarvis contains no send, archive, trash, delete, draft, or other email-modifying route.
- Added tests asserting the Gmail OAuth scope and that the Gmail adapter makes read-only requests.

## [0.5.0.0] - 2026-11-09

### Added

- Expanded the calendar and daily agenda to a complete midnight-to-midnight timeline, including all-day events.
- Made calendar items selectable, editable, deletable, and draggable between days. Google-sourced event details, notes, links, and recurrence metadata are now visible in Jarvis.
- Added Jarvis-only calendar overlays for private event creation, editing, moving, and permanent local deletion of imported events.
- Added app-wide workout reconciliation that schedules workouts around the live calendar, moves conflicting workouts, favors available slots after EFG, JCIV, Macro, and Philosophy classes, and keeps manual workout adjustments until a real conflict occurs.
- Added a functional Fitness calendar preview with workout sessions highlighted and Open-Meteo air-quality data in Weather details.

### Changed

- Removed every Google Calendar write path and write OAuth scope. Google Calendar is now a strictly read-only source; all calendar mutations stay in Jarvis.
- Made the hourly Weather tiles responsive so the complete daily sequence fits without horizontal scrolling.
- Added coverage for calendar overlays, all-day date spans, quarter-hour post-class workout placement, current-time scheduling bounds, and read-only Google adapter behavior.

## [0.4.0.0] - 2026-11-09

### Added

- Connect a Google account from Settings and replace calendar preview data with live Google Calendar events.
- Publish explicitly created Jarvis events to Google Calendar with automatic duplicate protection.
- Refresh expired Google access automatically and disconnect by revoking Google access and removing local credentials.
- Added tests for OAuth permissions, configuration validation, Calendar API pagination and publishing, and live calendar rendering.

### Changed

- Encrypt Google credentials in a secure HttpOnly cookie for the local single-user build and restrict provider writes to Jarvis-created events.
- Validate OAuth state, account identity, callback configuration, sync windows, and event fields before sending data to Google.

## [0.3.0.0] - 2026-11-09

### Added

- Added live Georgetown, D.C. conditions from Open-Meteo with a 15-minute server cache and a provider-outage state.
- Added a 12-hour forecast with temperature, apparent temperature, precipitation probability, and UV index.
- Added a seven-day forecast plus current humidity, UV risk, wind, gusts, pressure, cloud cover, sunrise, and sunset details.
- Added weather-domain and browser coverage for condition mapping, provider response transformation, and responsive forecast rendering.

### Changed

- Updated the dashboard and settings weather location from Washington, D.C. to Georgetown, D.C.

## [0.2.0.0] - 2026-11-09

### Added

- Added an adaptive fitness workspace with a four-week intermediate return-to-consistency program, weekly workout cards, exercise prescriptions, and completion or skip controls.
- Added a deterministic scheduler that protects three weekly lifts, offers a fourth only when capacity exists, chooses 60- or 75-minute variants, and respects conflicts, recovery spacing, travel time, and evening curfews.
- Added Jarvis-owned workout events to the preview calendar plus persistence models for fitness profiles, programs, templates, planned workouts, and scheduling decisions.
- Added unit and desktop/mobile browser coverage for fitness scheduling and planner interactions.

### Changed

- Made the dashboard greeting adapt to the current time of day with wider letter spacing.
- Made the daily agenda open near the current time and report the live number of events scheduled today.

### Deferred

- Live Google Calendar writes, Canvas workload-based deferrals, and Hevy progression data remain behind their future connection and permission flows.

## [0.1.0.1] - 2026-11-08

### Changed

- Fit the complete desktop command center into a 1440×900 viewport by turning the top area into three balanced tiles and reducing spacing throughout the dashboard.
- Condensed the Daily agenda timeline so it occupies less width and height while retaining scrollable access to the full day.

### Fixed

- Added a browser regression check that prevents dashboard tiles from falling below the desktop fold.

## [0.1.0.0] - 2026-11-08

### Added

- Open a responsive, authenticated command center with dashboard, calendar, work, health, fitness, weather, and settings areas.
- Explore day, week, and month schedules, create local event drafts, and manage preview tasks from creation through completion.
- Start from provider-safe Google Calendar, Canvas, and weather boundaries with a PostgreSQL-ready data model and encrypted credential storage contract.
- Run linting, type checks, unit and component tests, production builds, Playwright flows, and GitHub Actions CI.

### Changed

- Restricted the credential-free preview bypass to explicitly configured loopback URLs so local production previews remain easy to open without weakening deployed authentication.
