# Implementation Plan - SPEC-002: Authentication & User Profile

This plan details the steps to implement Google OAuth2 authentication and multi-company workspace management using PocketBase.

## Phase 1: Authentication Core (2.1 & 2.5)

1. **PocketBase Setup**:
    - Enable Google Auth Provider in the PocketBase Admin UI (requires manual intervention or documentation).
    - Note: For local development, use `http://127.0.0.1:8090/api/oauth2-redirect` as redirect URL.

2. **Frontend Auth Integration**:
    - Create `src/features/auth/AuthProvider.tsx` to handle `pb` session state.
    - Implement `useAuth` hook for easy access to user data.
    - Update `main.tsx` to wrap the app with `AuthProvider`.

3. **Login Page**:
    - Create `src/features/auth/pages/LoginPage.tsx`.
    - Implement `pb.collection('users').authWithOAuth2({ provider: 'google' })`.
    - Add logic to fetch and sync profile data (name, avatar) if missing.

## Phase 2: Workspace / Company Management (2.2)

1. **Collection Setup**:
    - Create `companies` collection via migration or Admin UI (will use migration).
    - Fields: `name` (text), `user` (relation), `settings` (json).

2. **Company Logic**:
    - Create `src/features/companies/services/companyService.ts` for CRUD.
    - Create `src/features/companies/components/CompanySelector.tsx`.
    - Update `useStore` to keep track of the `activeCompanyId` and persist it.

3. **UI Implementation**:
    - Add a "Manage Companies" view.
    - Integrate the selector into the main layout's Navbar.

## Phase 3: Security & Verification (2.3)

1. **API Rules**:
    - Implement the rules defined in SPEC-002 in PocketBase.
    - Example: `@request.auth.id != "" && user = @request.auth.id`.

2. **Testing**:
    - Create E2E test `e2e/auth.spec.ts` (mocking or using a test account if possible).
    - Unit test for `useStore` and auth state transitions.
