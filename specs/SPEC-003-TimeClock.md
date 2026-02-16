---
id: SPEC-003
feature: Time Clock (Core)
status: Draft
priority: Critical
---

# Feature 3: Time Tracker (Trust Focus)

## User Story

As a Trust Position Professional, I want to easily record when I start and stop working, and adjust the times if I forgot, so I can keep track of my true workload.

## Requirements

### 3.1 Tracker Interface

- [ ] Display **Current Time** and **Accumulated Time Today**.
- [ ] Action buttons: "Start Work", "Pause/Break", "Resume", "Finish Day".
- [ ] **Manual Adjustment**: Allow clicking on the time display to manually edit the timestamp (e.g., "I actually started 15 mins ago").

### 3.2 Context & Location

- [ ] Optional: Capture location for personal context (e.g., "Worked from Home" vs "Office").
- [ ] **No blocking**: Never block an action based on location.

### 3.3 Offline Persistence & Sync

- [ ] **Strategy**: Optimistic UI. Save locally, sync when possible.
- [ ] **Conflict Resolution**: Last edit wins (User trusted).

### 3.4 Data Model

**Table: time_records**

- `id`: uuid
- `user_id`: uuid (FK)
- `company_id`: uuid (FK -> companies.id)
- `timestamp`: timestamptz
- `type`: text ('start', 'pause', 'resume', 'finish')
- `is_manual_entry`: boolean
- `notes`: text (optional user notes)

## Testing

- **Unit**:
    - Test duration calculations with manual edits.
- **E2E**:
    - **Scenario**: Start timer -> Manually change start time -> Verify total calculation updates.

## Technical Notes

- **Prevention**: Prevent double clicks (debounce).
- **Time Source**: Trust Server Time (Supabase `now()`) for the official record, but store Device Time as metadata for audit.
