---
id: SPEC-004
feature: Dashboard & Reports
status: Done
priority: Medium
---

# Feature 4: Balance Dashboard

## User Story

As a user, I want to visualize my Time Balance (Bank) to know if I'm overworking or have free time, helping me manage my routine.

## Requirements

### 4.1 Global Controls

- [x] **Company Selector**: Dropdown to switch between "CLT Job" and "MEI Project". Dashboard data updates instantly.

### 4.2 Daily Balance

- [x] **Timeline**: Visual bar showing Work vs Breaks.
- [x] **Metric**: "Balance Today" (e.g., +0:30h or -1:00h against strict 8h target).
- [x] **Burnout Warning**: Visual alert if working > 10h/day frequently.

### 4.2 Reports

- [x] **Monthly Heatmap**: Visual grid showing intensity of work days.
- [x] **Net Balance**: Total accumulated hours (+/-) in the period.
- [x] **Export**: Ability to export to simple CSV for personal control.

## Testing

- **Unit**:
    - Validate calculation of "Total Worked Time" per company context.
    - Test break deduction logic (CLT rules).
- **E2E**:
    - **Scenario**: User views own dashboard -> Verifies correct balance calculation.

## Technical Notes

- **Calculations**: Done on frontend for immediate feedback, but validated via SQL functions/Views for reports.
- **Performance**: Pagination for History View (don't load infinite records).
