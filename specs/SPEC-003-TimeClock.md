---
id: SPEC-003
feature: Time Clock (Core)
status: To Do
priority: Critical
---

# Feature 3: Time Tracker (Trust Focus)

## User Story

As a Trust Position Professional, I want to freely register when I enter and leave work throughout the day, forming independent work blocks that are summed to show my true workload. I also want to manually add or adjust entries whenever needed.

## Requirements

### 3.1 Tracker Interface

- [x] Display **Current Time** and **Accumulated Time Today** (sum of all completed blocks + active block).
- [x] **Current Stickiness**: Show **"Registrar Entrada"** when idle, **"Registrar Saída"** when working.
    - **Mapped Types**: `start` (Entrada) and `finish` (Saída).
- [x] **Manual Entry**: Form to add records with specific types.
- [x] **Timeline**: Show today's records in **chronological order** (earliest to latest), clearly displaying work blocks and any open (active) block at the end.
- [x] **Edit Interface**: Editing and manual entry should be presented in a clear, accessible modal with distinct actions (Save, Cancel, Delete).

### 3.2 Work Blocks

- [x] Each `start`/`finish` pair forms a **work block**.
- [x] Multiple blocks per day are **summed** for the daily total.
- [x] A `start` without a matching `finish` is treated as an **active block**.
- [x] **Schema Support**: The database supports `start`, `pause`, `resume`, `finish` to accommodate future features or legacy data, though the current UI focuses on start/finish flows.
- [x] **No blocking**: Users can freely add entries and exits in any order, edit past records, and delete them. The system does not enforce sequential rules.

### 3.3 Context & Location

- [ ] Optional: Capture location for personal context (e.g., "Worked from Home" vs "Office").
- [ ] **No blocking**: Never block an action based on location.

### 3.4 History & Editing

- [x] **Date Navigation**: User can navigate to past dates to view and edit history.
- [x] **Edit Records**: User can edit the timestamp and type of existing records.
- [x] **Delete Records**: User can delete existing records.
- [x] **Manual Entry Context**: Manual entry form defaults to the currently selected date.
- [ ] **Date Format**: Input fields must display dates in **DD/MM/YYYY** format (Brazilian standard).

### 3.5 Offline Persistence & Sync

- [x] **Strategy**: Optimistic UI. Save locally, sync when possible.
- [x] **Conflict Resolution**: Last edit wins (User trusted).

### 3.6 Data Model

**Collection: time_records**

- `id`: string
- `user`: relation -> users
- `company`: relation -> companies
- `timestamp`: date
- `type`: text (`'start'`, `'pause'`, `'resume'`, `'finish'`)
- `is_manual_entry`: boolean
- `notes`: text (optional user notes)

## Testing

- **Unit**:
    - Test work block pairing (entry/exit pairs from chronological records).
    - Test total duration with multiple blocks in a day.
    - Test active block (open entry with no exit).
    - Test duration calculations with manual edits.
- **E2E**:
    - **Scenario**: Register entry -> Register exit -> Verify block duration.
    - **Scenario**: Register multiple entry/exit pairs -> Verify total is the sum of all blocks.
    - **Scenario**: Navigate to past date -> Add manual entry -> Verify total for that date.
    - **Scenario**: Edit existing record time -> Verify block recalculation.

## Technical Notes

- **Prevention**: Prevent double clicks (debounce).
- **Time Source**: Trust Server Time (PocketBase `$autoCreate` or explicit server rules) for the official record, but store Device Time as metadata for audit.
