---
id: SPEC-001
feature: Project Foundation & Infrastructure
status: Done
priority: High
---

# Feature 1: Project Foundation & Infrastructure

## User Story

As a developer, I need a solid foundation with configured tools so that I can build features efficiently and ensure the app works as a PWA.

## Requirements

### 1.1 Project Initialization

- [x] Initialize **Vite** project with **React** and **TypeScript**.
- [x] Clean up default Vite boilerplate.

### 1.2 PWA Configuration

- [x] Install `vite-plugin-pwa`.
- [x] Configure `manifest.webmanifest`:
    - Name: "Ponto Livre"
    - Short Name: "Ponto"
    - Theme Color: `#000000` (Dark mode compliant)
    - Icons: Standard set (192, 512).
- [x] Enable Service Worker for offline caching of static assets.

### 1.3 Database & Backend

- [x] Install `@supabase/supabase-js`.
- [x] Create `src/lib/supabase.ts` client.
- [x] Define global TypeScript types for Database entities.

### 1.4 Global Styling

- [x] Reset CSS (Modern reset).
- [x] Define **CSS Variables** for the Design System:
    - Colors (Primary, Secondary, Background, Surface, Error).
    - Spacing.
    - Typography.
- [x] Install **Lucide React** for icons.

### 1.5 State Management

- [x] Install `zustand`.
- [x] Create `useStore` hook with `persist` middleware enabled.

### 1.6 Testing Infrastructure

- [x] Install **Vitest** and **React Testing Library**.
- [x] Configure `setupTests.ts`.
- [x] Install **Playwright** and init E2E project structure.
- [x] Configure GitHub Actions CI to run tests on PR.

### 1.7 Hosting & Deployment

- [x] Create `Dockerfile` for production build (Multi-stage).
- [x] Create `docker-compose.yml` for easy orchestration.
- [x] Configure `nginx.conf` as a reverse proxy for the container.
- [x] Ensure the container handles `SPA` routing (Client-side routing fallback).

## Technical Notes

- **Stack**: React, Vite, TS, Supabase, Zustand.
- **Hosting**: Self-hosted (Docker + Nginx).
- **Offline Strategy**: Service Worker for assets; LocalStorage for data (initially).
