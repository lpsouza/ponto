# Ponto Livre (PWA)

> 🚧 **Project Under Construction** 🚧
>
> This project is currently in active development and is **not yet functionality complete**.
> Features are being implemented according to the specifications listed below.

## Project Status

| Spec ID | Feature | Status |
| :--- | :--- | :--- |
| **SPEC-001** | Infrastructure | ✅ Done |
| **SPEC-002** | Auth & Companies | 🚧 To Do |
| **SPEC-003** | Time Clock | ✅ Done |
| **SPEC-004** | Dashboard | ✅ Done |
| **SPEC-005** | Migrations | ✅ Done |

## About the Project

A **Time Balance Tracker** designed for professionals in strictly **Trust Positions (Cargo de Confiança)** who do not officially clock in. The system serves as a personal tool to manage work-life balance, helping to prevent burnout (overworking) or under-delivery.

> **Note**: This project is built around **Brazilian Labor Laws (CLT)** concepts (e.g., 8h workday, Night Shift bonus). While it can serve as a base for other regions, logic adaptations may be required for non-Brazilian contexts.

## Main Features

- **Personal Balance**: Tracks "Real Hours" vs "Expected Hours" to show a running balance.
- **Flexibility**: Allows manual editing and adjustments (trust-based system).
- **Multi-Company Context**: Supports multiple professional contexts (e.g., CLT job and Freelance projects) under a single profile.
- **PWA**: Works offline and installs on devices for quick access.
- **Reports**: Focus on "Healthy Routine" stats rather than legal timesheets.

## Tech Stack

- **Frontend**: React + Vite + TypeScript.
- **Styling**: Modern CSS (Vanilla).
- **Backend/Database**: PocketBase (SQLite + Auth + File Storage).
- **Testing**: Vitest (Unit) + Playwright (E2E).
- **Hosting**: Self-hosted (Docker).

## Development Methodology

This project follows **Spec-Driven Development (SDD)**.

- Detailed feature requirements are located in the `specs/` directory.
- Each major feature has a corresponding `SPEC-XXX.md` file.

## How to Run

1. Install dependencies: `npm install`
2. Configure environment variables (`.env`).
3. Run development server: `npm run dev`

## Running Tests

- **Unit Tests**: `npm run test`
- **E2E Tests**: `npm run test:e2e`
    - To run full authentication flows (Dashboard, TimeClock):
        1. Run `npm run test:e2e:auth` (Opens a browser window).
        2. Login manually with your Google account.
        3. Wait until you see the Dashboard.
        4. Close the window. This saves your session for subsequent test runs.

## Database Migrations

With PocketBase in development mode (`--automigrate`), schema changes made via the Admin UI are automatically recorded as JS migration files in `pb_migrations`. On production deployment, simply start the PocketBase binary, and pending migrations apply automatically.

## Project Structure

Documented in the `AGENTS.md` file.
