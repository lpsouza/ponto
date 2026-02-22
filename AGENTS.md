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
   - Backend/Persistence: Use **PocketBase** for database, auth, and file storage.
   - Hosting: Unified hosting where PocketBase serves the frontend static files from `pb_public`.

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
   - **Crucial Priority**: Unit tests are the foundation of reliability for this project.
   - **Unit/Integration**: Use **Vitest** + **React Testing Library**.
   - **E2E**: Use **Playwright** for critical flows (Login, Clock In/Out, Offline Sync).
   - **Requirement**: Every new feature spec must include a "Testing" section.
   - **Coverage**: Maintain a minimum of **95% global coverage** and **100% coverage** for business logic (e.g., time calculations).
   - **MANDATORY**: Unit tests must ALWAYS be **100% green** (passing) after any adjustment. No regressions are allowed.

5. **UI/UX**:
   - Design must be "Mobile First".
   - Aesthetics: Modern, clean, professional. Dark mode support is highly recommended.

6. **Git & Version Control**:
   - **Commit Messages**: Must be single-line in English.
   - **Context Requirement**: Every commit message **MUST**:
     - Reference a SPEC ID if related to a feature (e.g., `[SPEC-001] Add Docker configuration`).
     - Use a natural, descriptive sentence for general adjustments or fixes (e.g., `Update documentation for agent guidelines` or `Correct timezone handling in dashboard`).
   - **PROHIBITED**: Do NOT use "Conventional Commits" tags/format (feat:, fix:, [Docs], [Fix], etc.). Always write in natural language.
   - **NO AUTOMATIC COMMITS**: Do NOT run `git commit` commands automatically under any circumstance. ALWAYS wait for the user to explicitly request a commit before doing so.

## Development Methodology: Spec Driven Development (SDD)

**Crucial**: We follow a strict Spec-Driven Development process.

1. **Specs First**: No code is written without a corresponding specification in `/specs`.
2. **Single Source of Truth**: The `SPEC-XXX.md` files are the **ONLY source of truth** for what the code needs to do.
3. **Workflow**:
   - Read the specific SPEC file (e.g., `specs/SPEC-001-Infrastructure.md`).
   - Implement the requirements one by one.
   - **MANDATORY**: Update the SPEC file (change `[ ]` to `[x]`) **IMMEDIATELY** after finishing each item. This is critical for tracking progress.
   - **MANDATORY**: Update the SPEC metadata (`status`) according to the workflow:
     - `Draft`: Planning phase.
     - `Todo`: Ready for development.
     - `Doing`: Currently in development.
     - `Done`: Completed.
   - **MANDATORY**: Update the `README.md` file status table whenever a SPEC is completed or its status changes.
4. **Maintenance & Consistency**: 
   - Whenever any part of the system or its requirements changes, the agent **MUST** review **ALL** existing SPECs.
   - Update any SPEC that is affected by the changed characteristics, ensuring they reflect the current implementation (marking as completed or not as appropriate).
5. **Updates**: If technical details change, update the SPEC file to reflect reality.

## Development Workflow

- Update `task.md` frequently.
- Create `implementation_plan.md` before major features.
- Update `walkthrough.md` after successful verification.

## Folder Structure

- `/src/components`: Reusable UI components.
- `/src/features`: Feature-based modules (Auth, TimeClock, Dashboard).
- `/src/lib`: Configuration (PocketBase client, Utils).
- `/src/styles`: Global styles and variables.
