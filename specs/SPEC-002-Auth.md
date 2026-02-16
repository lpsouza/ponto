---
id: SPEC-002
feature: Authentication & Multi-Tenancy
status: Draft
priority: Critical
---

# Feature 2: Authentication & Multi-Tenancy

## User Story

As a Company Owner, I want to register my company and invite employees so they can track their time securely.
As an Employee, I want to log in to my specific company's workspace without seeing data from others.

## Requirements

### 2.1 Company Registration (Tenant Creation)

- [ ] Sign Up form for Company Owners.
- [ ] Creates a record in `auth.users` (Supabase).
- [ ] Creates a record in `public.companies` linked to the user.

### 2.2 Employee Login

- [ ] Login screen (Email/Password).
- [ ] Validates credentials via Supabase Auth.
- [ ] Fetches User Profile (`public.profiles`) to determine `company_id`.

### 2.3 Row Level Security (RLS)

- [ ] **Companies Table**: Visible only to the owner (admin).
- [ ] **Profiles Table**: Users can read their own profile. Admins can read/write profiles with same `company_id`.
- [ ] **TimeRecords Table**: Users can insert/read their own records. Admins can read all records with same `company_id`.

### 2.4 Data Model

**Table: companies**

- `id`: uuid (PK)
- `name`: text
- `clt_rules_config`: jsonb (default rules)

**Table: profiles**

- `id`: uuid (PK, refers to auth.users)
- `role`: text ('admin' | 'employee')
- `company_id`: uuid (FK -> companies.id)
- `full_name`: text

## Testing

- **Unit**: Verify `company_id` extraction from profile data.
- **E2E**:
    - **Scenario**: Use sign up flow -> Create Company -> Redirect to Dashboard.
    - **Scenario**: Employee login -> Redirect to Clock Page.
    - **Scenario**: Invalid credentials -> Show error toast.

## Technical Notes

- Use Supabase Auth Helpers.
- **Security**: Never blindly trust `company_id` from the client in Insert/Update operations if possible (use database triggers or RLS defaults where applicable).
