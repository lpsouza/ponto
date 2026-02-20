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

- [x] **Tooling**: Adopt **PocketBase** built-in JS schema migrations.
- [x] **Structure**: Use a `pb_migrations/` directory with timestamped JS files (e.g., `1708354800_update_time_types.js`).
- [x] **Workflow**:
    - Manage via PocketBase Admin UI (locally) with `--automigrate` enabled to auto-generate migrations.
    - Apply pending migrations to the remote DB automatically on restart.
- [x] **Versioning**: The state of the database should be strictly versioned.

### 5.2 CI/CD Integration

- [x] **Automated Apply**: When deploying (e.g., via Docker), the PocketBase container automatically applies pending JS migrations on startup.
- [x] **Frontend Servido Embutido**: O Docker copia o frontend (`dist/`) para `pb_public/`, de modo que o Pocketbase roda *backend* e *frontend* no mesmo container.

## Technical Notes

- Since we are self-hosting (Docker), the PocketBase executable automatically handles migrations in `pb_migrations` when starting the server.
- The `pb_schema.json` (if used explicitly for tracking) should ideally be version controlled, though auto-generated JS files are preferred for step-by-step history.
