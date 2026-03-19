# Changelog

All notable changes to this project will be documented in this file.

## [2026-03-19]
### Added
- Created `docs/design-specs.md` with Tech/Modern (Linear/Stripe) design guidelines.
- Created `.brain/brain.json` and `.brain/session.json` for persistent project knowledge.

### Changed
- **Global UI Redesign**: Migrated entire application from glassmorphism/warm-tones to a high-contrast Tech/Modern aesthetic.
- Updated `apps/web/app/globals.css` with new design tokens (CSS Variables).
- Refactored `@contract/ui` components: `Card`, `Badge`, `DataTable`, `MetricCard`.
- Redesigned `AppShell`, `LoginPage`, and all internal application screens (Dashboard, Contracts, Partners, etc.).
- Primary buttons changed to solid black with white text.

### Fixed
- Fixed inconsistent spacing and typography scales across components.

### Pending
- 500 Internal Server Error on Login API (`/api/internal/auth/login`).
