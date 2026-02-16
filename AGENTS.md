# Ponto Livre - Agent Guidelines

> **CRITICAL**: Read this file first before starting any task.

## Project Overview

This project is a **Time Balance Tracker** for professionals in **Trust Positions (Cargo de Confiança)**.
Unlike traditional time clocks, its goal is **not legal compliance**, but **personal time management**.
It helps users track their "real" hours to avoid **overworking (Burnout)** or **underworking**.

**Geographical Scope**: The logic (overtime, night shift) is based on **Brazilian (CLT)** rules. Agents must treat this as the default behavior, but write code that is modular enough to be adapted for other countries if needed in the future.

## Core Rules for Agents

1. **Tech Stack Adherence**:
   - Use **React** (Vite) as the core framework unless otherwise specified.
   - Use **TypeScript** for all code.
   - Styling: Use **Vanilla CSS** with CSS Modules or global CSS variables for theming. Avoid Tailwind unless explicitly requested by the user.
   - Backend/Persistence: Prefer **Supabase** (PostgreSQL) for multi-tenant handling via RLS (Row Level Security).

2. **Code Quality**:
   - **Standards**: Strictly follow **`.editorconfig`** settings for indentation and formatting.
   - Write clean, semantic HTML5.
   - Ensure accessibility (ARIA labels, keyboard navigation).
   - State logic should focus on **flexibility** rather than strict blocking rules.

3. **Trust Position Logic**:
   - **No blocking**: Users can edit past entries freely (it's for their own control).
   - **Focus on Balance**: Metrics should show "Hours Balance" (Bank) rather than "Late/Overtime" penalties.
   - **Flexible Standard**: Allow configuring custom daily hours (e.g., usually 8h, but flexible).
   - **Privacy**: Data is primarily for the user's insight, not for HR policing.

4. **Testing Strategy**:
   - **Unit/Integration**: Use **Vitest** + **React Testing Library**.
   - **E2E**: Use **Playwright** for critical flows (Login, Clock In/Out, Offline Sync).
   - **Requirement**: Every new feature spec must include a "Testing" section.
   - **Coverage**: Business logic (e.g., overtime calc) requires 100% unit test coverage.

5. **UI/UX**:
   - Design must be "Mobile First".
   - Aesthetics: Modern, clean, professional. Dark mode support is highly recommended.

6. **Git & Version Control**:
   - **Commit Messages**: Must be single-line in English.
   - **Spec Reference**: If the commit relates to a spec, MUST include the Spec ID (e.g., `[SPEC-001] Initial setup`).

## Development Methodology: Spec Driven Development (SDD)

**Crucial**: We follow a strict Spec-Driven Development process.

1. **Specs First**: No code is written without a corresponding specification in `/specs`.
2. **Single Source of Truth**: The `SPEC-XXX.md` file is the master document for a feature.
3. **Workflow**:
   - Read the specific SPEC file (e.g., `specs/SPEC-001-Infrastructure.md`).
   - Implement the requirements one by one.
   - **MANDATORY**: Update the SPEC file (change `[ ]` to `[x]`) **IMMEDIATELY** after finishing each item. This is critical for tracking progress.
   - **MANDATORY**: Update the SPEC metadata (`status`) according to the workflow:
     - `Draft`: Planning phase.
     - `Todo`: Ready for development.
     - `Doing`: Currently in development.
     - `Done`: Completed.
4. **Updates**: If technical details change, update the SPEC file to reflect reality.

## Development Workflow

- Update `task.md` frequently.
- Create `implementation_plan.md` before major features.
- Update `walkthrough.md` after successful verification.

## Folder Structure

- `/src/components`: Reusable UI components.
- `/src/features`: Feature-based modules (Auth, TimeClock, Dashboard).
- `/src/lib`: Configuration (Supabase client, Utils).
- `/src/styles`: Global styles and variables.
