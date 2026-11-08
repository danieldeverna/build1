# Changelog

All notable changes to Jarvis are documented in this file.

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
