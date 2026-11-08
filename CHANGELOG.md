# Changelog

All notable changes to Jarvis are documented in this file.

## [0.1.0.0] - 2026-11-08

### Added

- Open a responsive, authenticated command center with dashboard, calendar, work, health, fitness, weather, and settings areas.
- Explore day, week, and month schedules, create local event drafts, and manage preview tasks from creation through completion.
- Start from provider-safe Google Calendar, Canvas, and weather boundaries with a PostgreSQL-ready data model and encrypted credential storage contract.
- Run linting, type checks, unit and component tests, production builds, Playwright flows, and GitHub Actions CI.

### Changed

- Restricted the credential-free preview bypass to explicitly configured loopback URLs so local production previews remain easy to open without weakening deployed authentication.
