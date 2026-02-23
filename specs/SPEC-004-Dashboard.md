---
id: SPEC-004: Dashboard de Saldo e Histórico
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
- [x] **Persistent Bank**: Calculate balance cumulatively from the first record, considering absences on work days.
- [x] **Global Balance**: Highlight the current total bank balance (+/-) in the main view.


### 4.2 Reports

- [x] **Monthly Heatmap**: Visual grid showing intensity of work days.
- [x] **Net Balance**: Total accumulated hours (+/-) in the period.
- [x] **Export**: Ability to export to simple CSV for personal control.
- [x] **Bank Statement**: A list or view showing the daily evolution of the bank (Target vs Worked vs Balance).
- [ ] **Work Configuration**: Interface to edit company work days, target hours, and holidays.

## Testing

- **Unit**:
    - Validate calculation of "Total Worked Time" per company context.
    - Test break deduction logic (CLT rules).
- **E2E**:
    - **Scenario**: User views own dashboard -> Verifies correct balance calculation.

## Technical Notes

- **Calculations**: Done on frontend for immediate feedback, but validated via Collection views or Hooks for reports.
- **Absence Logic**: Days marked as `work_days` in settings that have 0 records (and are not marked as `holiday` or `leave`) are counted as negative balance equal to `daily_target_ms`.
- **Special Day logic**:
    - `holiday`: Records of this type set the daily target to 0. Any `start`/`finish` blocks on this day are 100% positive balance (potentially with multipliers).
    - `leave`: Records of type `'Folga (abonada)'` act as "virtual work" covering the meta. Any extra `start`/`finish` blocks are added as positive balance.
    - `compensation`: Records of type `'Folga (compensada)'` marks the day as intentional absence (Uses bank). If work occurs, the bank usage is reduced by the worked amount.
- **Multiplier logic**: Worked intervals that overlap with defined special zones (Night shift, Weekends) have their duration multiplied by the corresponding value before being added to the daily total.
- **Performance**: Pagination for History View (don't load infinite records).
