# Time-Off Management Implementation Plan

## Scope
Track monthly accruals and manual adjustments for sick, vacation, and other leave categories. Deliver admin tooling and user visibility backed by the new Prisma schema.

## Milestones
- [x] **Data Layer**: implement a `TimeOffRepository` with helpers to:
  - [x] fetch balances and transaction history per user/leave type
  - [x] compute outstanding accrual months per user
  - [x] create transactions and adjust balances atomically
- [x] **Admin APIs**:
  - [x] `POST /api/admin/time-off/accrual` to credit one month of sick/vacation for all users
  - [x] `POST /api/admin/time-off/transactions` to record usage or adjustments (supports positive/negative days, notes)
  - [x] `GET /api/admin/time-off/transactions` for recent ledger entries (filter by user/leave type/month)
- [x] **User API**:
  - [x] `GET /api/time-off/me` returning balances and recent transactions (read-only)
- [x] **Admin UI** (`/admin/time-off`):
  - [x] monthly accrual trigger with feedback
  - [x] form to adjust leave (select user, leave type, days ±, note)
  - [x] transaction history table with filters and stored/requested type display
- [x] **User UI**:
  - [x] read-only widget summarizing personal balances and recent transactions (e.g., dashboard/profile section)
- [ ] **Testing & Docs**:
  - [ ] capture manual QA checklist (monthly accrual, admin adjustments, user read-only view)
  - [ ] document runbook in `AGENTS.md` (accrual trigger steps, requested type mapping)
  - [ ] confirm seed data stays in sync with schema changes (LeaveRequestType mapping)

## Notes
- Monthly accrual job affects sick and vacation leave types only.
- Manual adjustments accept positive values (credit) or negative values (debit) and are restricted to admins.
- Transactions capture `recordedBy`, `periodStart/End`, and optional notes for auditing.
