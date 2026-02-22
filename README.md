# Ponto Livre

Ponto Livre is a modern **Time Balance Tracker** designed for professionals in trust positions (Cargo de Confiança) who need to manage their personal work hours without rigid legal constraints.

## Project Vision

- **Mobile First**: Built for seamless use on any device.
- **PWA Ready**: Works offline with Service Worker caching.
- **Privacy Focused**: Personal data stays with the user.
- **Flexibility**: No strict blocking; edit entries as needed.

## Tech Stack

- **Frontend**: React (Vite), TypeScript, Vanilla CSS.
- **Backend/DB**: PocketBase (Auth, Database, Hosting).
- **State Management**: Zustand.
- **Testing**: Vitest & React Testing Library (Unit), Playwright (E2E).
- **Deployment**: Docker & Docker Compose.

## Project Status

| Spec ID | Feature | Status |
|---------|---------|--------|
| SPEC-001 | Project Foundation & Infrastructure | Done |
| SPEC-002 | Authentication & User Profile | Done |
| [SPEC-003](specs/SPEC-003-TimeClock.md) | Time Clock & Entry Management | Done |
| [SPEC-004](specs/SPEC-004-Dashboard.md) | Dashboard & Balance History | Done |

## Development

### Prerequisites

- Node.js (v20+)
- Docker & Docker Compose

### Configuration

To enable Google OAuth2 login:
1. Copy `.env.example` to `.env`.
2. Fill in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
3. Restart PocketBase (`npm run pb:restart`).

### Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Run tests:
   ```bash
   npm run test:unit
   npm run test:e2e
   ```

### Docker

Build and run the entire stack:
```bash
docker-compose up --build
```

The application will be available at `http://localhost:8080`.
