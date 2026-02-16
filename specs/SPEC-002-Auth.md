---
id: SPEC-002
feature: Authentication & User Profile
status: Draft
priority: Critical
---

# Feature 2: Authentication & User Profile

## User Story

As a Professional, I want to register and log in so I can track my work hours.
As a Freelancer/Multi-job professional, I want to create multiple "Companies" (e.g., one for CLT, one for MEI) to keep my records separated.

## Requirements

### 2.1 User Registration & Login

- [ ] **Google OAuth Only**: Users log in using their Google account (Personal or Workspace).
- [ ] **Auto-Registration**: First-time login automatically creates `auth.users` record.
- [ ] **Profile Sync**: Automatically fetch `full_name` and `avatar_url` from Google metadata on first login.
- [ ] Creates a record in `public.profiles` linked to the user if not exists.

### 2.2 Workspace / Company Management (Multi-Context)

This feature allows the user to manage multiple professional "contexts" or "companies" under a single login.

- [ ] **Manage Companies (CRUD)**:
    - **Create**: Add a new workspace (e.g., "Google (CLT)", "Freelance Client A").
    - **Edit**: Update settings like "Daily Hours Target" (e.g., 8h for CLT, 4h for Part-time) or "Timezone".
    - **Delete**: Archive or remove a workspace (and its associated records, or keep them archived).
- [ ] **Context Switching**:
    - Global selector (in Navbar/Sidebar) to switch the "Active Company".
    - Storing the `active_company_id` in the user's `profile` preferences ensures the app remembers the last context on reload.
    - All dashboard metrics and time records are filtered by the currently Active Company.

### 2.3 Row Level Security (RLS)

- [ ] **Profiles Table**: Users can read/update their own profile.
- [ ] **Companies Table**: Users can CRUD companies where `user_id` matches their ID.
- [ ] **TimeRecords Table**: Users can CRUD records where `user_id` matches their ID (and implicitly linked to their companies).

### 2.4 Data Model

**Table: profiles**

- `id`: uuid (PK, refers to auth.users)
- `full_name`: text
- `avatar_url`: text
- `preferences`: jsonb (active_company_id, theme)

**Table: companies**

- `id`: uuid (PK)
- `user_id`: uuid (FK -> auth.users)
- `name`: text
- `settings`: jsonb (default_hours, timezone)

## Testing

- **Unit**: Verify profile creation on `auth.users` insert trigger (if used) or client-side flow.
- **E2E**:
    - **Scenario**: Click "Login with Google" -> Redirect to Dashboard.
    - **Scenario**: Logout -> Redirect to Login Page.

## Technical Notes

- **Supabase Auth**: Enable Google Provider only. Disable Email/Password provider.
- **UX**: Simple "Continue with Google" button. No registration forms needed.
