# Implementation Plan - SPEC-002: Authentication & User Profile

## Status
- [ ] Initialize
- [ ] Supabase Client Setup
- [ ] Auth Context & Provider
- [ ] Login Page Implementation
- [ ] Profile Sync Logic
- [ ] Company Management (CRUD)
- [ ] Context Switching Logic

## User Story Refinement
- Removed "Company Owner" and "Employee" distinct roles. The user is the sole owner of their data context ("Company").
- Focus on "Personal Time Management" as per core principles.

## Technical Details

### 1. Supabase Client
- Ensure `src/lib/supabase.ts` is configured with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### 2. Auth Provider (`src/features/auth/AuthProvider.tsx`)
- Context to hold: `user` (Supabase User), `profile` (Public Profile), `loading` state.
- Methods: `signInWithGoogle`, `signOut`.
- Effect: On auth change, fetch profile from `public.profiles`. If not found, create it (or rely on Supabase Trigger if possible, but client-side creation is safer for MVP).

### 3. Login Page (`src/features/auth/LoginPage.tsx`)
- Simple "Sign in with Google" button.
- Redirect to `/dashboard` on success.

### 4. Company Management (`src/features/companies`)
- `useCompanyStore` (Zustand) or Context for active company.
- `CompaniesList` component (CRUD).
- `CompanyForm` component (Add/Edit).
- Persist `active_company_id` in `profiles.preferences`.

### 5. Database Schema (Supabase)
- **profiles**: `id` references `auth.users`, `full_name`, `avatar_url`, `preferences` (jsonb).
- **companies**: `id` (uuid), `user_id` references `auth.users`, `name`, `settings` (jsonb).
- **RLS**: Enable RLS on both. Policies: `auth.uid() = user_id` (or `id` for profiles).

## Proposed Layout Changes
- Add "Profile/Company Switcher" in Sidebar/Navbar.

## Testing Strategy
- Unit test for `AuthProvider` logic.
- E2E test for Login Flow.
