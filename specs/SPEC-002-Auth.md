---
id: SPEC-002
feature: Authentication & User Profile
status: Done
priority: Critical
---

# Feature 2: Authentication & User Profile

## User Story

As a Professional, I want to register and log in so I can track my work hours.
As a Freelancer/Multi-job professional, I want to create multiple "Companies" (e.g., one for CLT, one for MEI) to keep my records separated.

## Requirements

### 2.1 User Registration & Login

- [x] **OAuth2 Only**: Users log in using their Google account via PocketBase Auth.
- [x] **Auto-Registration**: First-time login automatically creates a `users` record in PocketBase.
- [x] **Profile Sync**: Automatically fetch `name` and `avatarUrl` from Google metadata on first login (Handled by PocketBase OAuth).
- [x] **Record Linking**: Utilize the default `users` collection in PocketBase to store profile data natively.

### 2.2 Workspace / Company Management (Multi-Context)

This feature allows the user to manage multiple professional "contexts" or "companies" under a single login.

- [x] **Manage Companies (CRUD)**:
    - **Create**: Add a new workspace (e.g., "Google (CLT)", "Freelance Client A").
    - [x] **Edit**: Update settings like "Daily Hours Target" (Service ready).
    - [x] **Delete**: Archive or remove a workspace (Service ready).

- [x] **Context Switching**:
    - [x] Global selector (in Navbar/Sidebar) to switch the "Active Company".
    - [x] Storing the `active_company_id` in the user's `profile` preferences ensures the app remembers the last context on reload.
    - [x] All dashboard metrics and time records are filtered by the currently Active Company.

### 2.3 API Rules (Security)

- [x] **Users Collection**: Users can read/update their own profile (`id = @request.auth.id`).
- [x] **Companies Collection**: Users can CRUD companies where `user` matches their ID (`user = @request.auth.id`).
- [x] **TimeRecords Collection**: Users can CRUD records where `user` matches their ID (`user = @request.auth.id`).

### 2.5 Session Handling

- [x] **Expiration Redirect**: If the session expires or is invalidated using `pb.authStore`, the user must be automatically redirected to the Login page.

### 2.4 Data Model

**Collection: users**

- [x] `id`: string (PK)
- [x] `name`: text
- [x] `avatarUrl`: url (Linked to PocketBase `avatar` field)
- [x] `preferences`: json (active_company_id, theme)

**Collection: companies**

- [x] `id`: string (PK)
- [x] `user`: relation -> users
- [x] `name`: text
- [x] `settings`: json (default_hours, timezone)

## Testing

- **Unit**: Verify profile creation logic on client-side flow.
- **E2E**:
    - **Scenario**: Click "Login with Google" -> Redirect to Dashboard.
    - **Scenario**: Logout -> Redirect to Login Page.

## Technical Notes

- **PocketBase Auth**: Enable Google Provider only. Disable Email/Password provider if possible, or hide it from the UI.
- **Automation**: Google OAuth2 configuration is automated via migrations using `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables.
- **UX**: Simple "Continue with Google" button. No registration forms needed.
