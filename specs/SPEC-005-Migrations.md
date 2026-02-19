---
id: SPEC-005
feature: Database Migrations
status: Done
priority: High
---

# Feature 5: Database Migrations

## User Story

As a developer, I want a structured way to evolve the database schema (migrations) so that I can apply changes to production safely and reliably without manually running SQL commands or losing data.

## Context

Currently, we use a single `schema.sql` file. This works for a new setup but fails for:
1.  **Evolution**: Adding columns/tables to an existing DB.
2.  **Data Integrity**: Modifying constraints (like `start` -> `entry`) requires careful data handling.
3.  **Teamwork**: Tracking who changed what and in which order.

## Requirements

### 5.1 Migration System

- [x] **Tooling**: Adopt **Supabase CLI** (or a lightweight alternative if CLI is too heavy) for managing migrations.
- [x] **Structure**: Use a `supabase/migrations/` directory with timestamped SQL files (e.g., `20240219150000_update_time_types.sql`).
- [x] **Workflow**:
    - `npm run db:diff`: Generate a new migration based on changes.
    - `npm run db:push`: Apply pending migrations to the local/remote DB.
- [x] **Versioning**: The state of the database should be strictly versioned.

### 5.2 CI/CD Integration

- [x] **Automated Apply**: When deploying (e.g., via Docker), the system should check and apply pending migrations automatically.
    - Implemented via `npm run db:deploy`.

## Technical Notes

- Since we are self-hosting (Docker), we might need a container that runs the migrations on startup, or a manual script.
- The `schema.sql` file should eventually be generated *from* the migrations (snapshot), not manually edited.
