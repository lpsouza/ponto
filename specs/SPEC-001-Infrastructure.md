---
id: SPEC-001
feature: Project Foundation & Infrastructure
status: Draft
priority: High
---

# Feature 1: Project Foundation & Infrastructure

## User Story

As a developer, I need a solid foundation with configured tools so that I can build features efficiently and ensure the app works as a PWA.

## Requirements

### 1.1 Project Initialization

- [ ] Initialize **Vite** project with **React** and **TypeScript**.
- [ ] Clean up default Vite boilerplate.

### 1.2 PWA Configuration

- [ ] Install `vite-plugin-pwa`.
- [ ] Configure `manifest.webmanifest`:
    - Name: "Ponto Virtual"
    - Short Name: "Ponto"
    - Theme Color: `#000000` (Dark mode compliant)
    - Icons: Standard set (192, 512).
- [ ] Enable Service Worker for offline caching of static assets.

### 1.3 Database & Backend

- [ ] Install `@supabase/supabase-js`.
- [ ] Create `src/lib/supabase.ts` client.
- [ ] Define global TypeScript types for Database entities.

### 1.4 Global Styling

- [ ] Reset CSS (Modern reset).
- [ ] Define **CSS Variables** for the Design System:
    - Colors (Primary, Secondary, Background, Surface, Error).
    - Spacing.
    - Typography.
- [ ] Install **Lucide React** for icons.

### 1.5 State Management

- [ ] Install `zustand`.
- [ ] Create `useStore` hook with `persist` middleware enabled.

### 1.6 Testing Infrastructure

- [ ] Install **Vitest** and **React Testing Library**.
- [ ] Configure `setupTests.ts`.
- [ ] Install **Playwright** and init E2E project structure.
- [ ] Configure GitHub Actions CI to run tests on PR.

### 1.7 Hosting & Deployment

- [ ] Create `Dockerfile` for production build (Multi-stage).
- [ ] Create `docker-compose.yml` for easy orchestration.
- [ ] Configure `nginx.conf` as a reverse proxy for the container.
- [ ] Ensure the container handles `SPA` routing (Client-side routing fallback).

## Technical Notes

- **Stack**: React, Vite, TS, Supabase, Zustand.
- **Hosting**: Self-hosted (Docker + Nginx).
- **Offline Strategy**: Service Worker for assets; LocalStorage for data (initially).
