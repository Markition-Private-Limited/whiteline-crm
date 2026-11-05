# BRD Audit Inventory — Markition CRM
**Source spec:** Technical Specification: Prospect & Pipeline Tracker (CRM), 2 November 2026  
**Audited on:** 2026-11-04  
**Method:** Every top-level module, feature folder, and file group classified against the BRD (Sections 2, 5, 7, 14).  
**No files were deleted, renamed, or modified. This is a read-only classification.**

---

## Classification Key

| Category | Meaning |
|---|---|
| **BRD-Core** | Explicitly required by Sections 2, 5, or 7 of the BRD |
| **Shared-Infra** | Auth, layout, utilities — used by BRD-core modules; needed to run them |
| **BRD-Explicitly-Excluded** | Named in Section 14 as out of scope |
| **Not-In-BRD-At-All** | Present in codebase; not mentioned in BRD as required OR excluded |
| **Ambiguous** | Imported by both BRD-core and non-BRD modules; cannot be cleanly classified |

---

## 1. App Pages (`app/`)

### 1.1 `app/(auth)/` — **Shared-Infra**
Authentication is required by the BRD (Section 7.1, US-01) and is infrastructure for every other module.

| File | Category |
|---|---|
| `app/(auth)/layout.tsx` | Shared-Infra |
| `app/(auth)/login/page.tsx` | Shared-Infra |

---

### 1.2 `app/(crm)/` — Mixed

| File | Category | Reason |
|---|---|---|
| `app/(crm)/layout.tsx` | Shared-Infra | Shell layout for CRM pages |
| `app/(crm)/loading.tsx` | Shared-Infra | Generic loading state |
| `app/(crm)/prospects/page.tsx` | **BRD-Core** | BRD §5 `prospects` entity, US-04–US-08 |
| `app/(crm)/prospects/[id]/page.tsx` | **BRD-Core** | Prospect detail / full profile, US-05 |
| `app/(crm)/clients/page.tsx` | **Not-In-BRD-At-All** | "Clients" is not a named entity in the BRD data model; BRD uses prospects → onboarding |
| `app/(crm)/clients/new/page.tsx` | **Not-In-BRD-At-All** | Same — no "clients" create flow in BRD |
| `app/(crm)/clients/[id]/page.tsx` | **Not-In-BRD-At-All** | Same |
| `app/(crm)/active-clients/page.tsx` | **Not-In-BRD-At-All** | "Active clients" is not a BRD entity or view |
| `app/(crm)/active-clients/[id]/page.tsx` | **Not-In-BRD-At-All** | Same |
| `app/(crm)/leads/[id]/page.tsx` | **Not-In-BRD-At-All** | BRD's pipeline goes Prospect → Won/Lost; a separate "leads" record is not in the BRD data model |
| `app/(crm)/projects/page.tsx` | **Not-In-BRD-At-All** | Project management is not in BRD scope; not excluded either — just not mentioned |
| `app/(crm)/projects/[id]/page.tsx` | **Not-In-BRD-At-All** | Same |
| `app/(crm)/projects/[id]/loading.tsx` | **Not-In-BRD-At-All** | Same |
| `app/(crm)/tasks/page.tsx` | **Not-In-BRD-At-All** | Generic task management is not in BRD (BRD has activities/follow-ups, not generic tasks) |
| `app/(crm)/tasks/[id]/page.tsx` | **Not-In-BRD-At-All** | Same |
| `app/(crm)/tasks/[id]/loading.tsx` | **Not-In-BRD-At-All** | Same |
| `app/(crm)/tasks/loading.tsx` | **Not-In-BRD-At-All** | Same |
| `app/(crm)/admin/document-templates/page.tsx` | **BRD-Core** | BRD §5 `document_requirements` (configurable checklist templates), US-21 |

---

### 1.3 `app/admin/` — Mixed

| File | Category | Reason |
|---|---|---|
| `app/admin/layout.tsx` | Shared-Infra | Admin shell layout |
| `app/admin/pipeline-stages/page.tsx` | **BRD-Core** | BRD §5 `pipeline_stages`, US-12 |
| `app/admin/employees/page.tsx` | **Ambiguous** | User management is BRD-Core (US-02); "employees" framing suggests HR usage beyond CRM users. Imported auth infra is shared. Cannot cleanly classify. |
| `app/admin/attendance/analytics/page.tsx` | **Not-In-BRD-At-All** | Attendance tracking is not in BRD scope and not in Section 14 exclusions |
| `app/admin/attendance/calendar/page.tsx` | **Not-In-BRD-At-All** | Same |
| `app/admin/attendance/shifts/page.tsx` | **Not-In-BRD-At-All** | Same |

---

### 1.4 `app/dashboard/` — **BRD-Core**
Dashboard KPIs and urgent-actions banner required by BRD §6, §7.7, US-24–US-25.

| File | Category |
|---|---|
| `app/dashboard/layout.tsx` | Shared-Infra |
| `app/dashboard/loading.tsx` | Shared-Infra |
| `app/dashboard/page.tsx` | **BRD-Core** |

---

## 2. API Routes (`app/api/`)

### BRD-Core API routes

| Route | Category | BRD reference |
|---|---|---|
| `app/api/auth/me/route.ts` | Shared-Infra | Auth infrastructure |
| `app/api/auth/session/route.ts` | Shared-Infra | Auth infrastructure |
| `app/api/prospects/route.ts` | **BRD-Core** | §5 prospects, US-04 |
| `app/api/prospects/[id]/route.ts` | **BRD-Core** | US-05, US-06 |
| `app/api/prospects/[id]/activities/route.ts` | **BRD-Core** | §5 activities, US-13 |
| `app/api/prospects/[id]/activities/[activityId]/complete/route.ts` | **BRD-Core** | US-14 |
| `app/api/prospects/[id]/activities/[activityId]/reschedule/route.ts` | **BRD-Core** | US-14 |
| `app/api/prospects/[id]/communications/route.ts` | **BRD-Core** | §5 communications, US-16 |
| `app/api/prospects/[id]/contacts/route.ts` | **BRD-Core** | §5 contacts |
| `app/api/prospects/[id]/contacts/[contactId]/route.ts` | **BRD-Core** | §5 contacts |
| `app/api/prospects/[id]/stage-history/route.ts` | **BRD-Core** | §5 stage_history, US-09 |
| `app/api/prospects/[id]/proposals/route.ts` | **BRD-Core** | §5 proposals, US-18 |
| `app/api/prospects/[id]/onboarding/route.ts` | **BRD-Core** | §5 onboarding_cases, US-21 |
| `app/api/prospects/[id]/convert/route.ts` | **Ambiguous** | Converts to "lead" — not a named BRD step; may be an internal routing step |
| `app/api/pipeline-stages/route.ts` | **BRD-Core** | §5 pipeline_stages, US-12 |
| `app/api/pipeline-stages/[id]/route.ts` | **BRD-Core** | US-12 |
| `app/api/proposals/[id]/route.ts` | **BRD-Core** | §5 proposals, US-18–US-19 |
| `app/api/proposals/[id]/revisions/route.ts` | **BRD-Core** | §5 proposal_revisions |
| `app/api/proposals/[id]/status/route.ts` | **BRD-Core** | US-19 |
| `app/api/proposals/[id]/status-history/route.ts` | **BRD-Core** | US-19 |
| `app/api/onboarding/[id]/route.ts` | **BRD-Core** | §5 onboarding_cases, US-22–US-23 |
| `app/api/onboarding/[id]/checklist/[itemId]/route.ts` | **BRD-Core** | §5 onboarding_items, US-22 |
| `app/api/onboarding/[id]/checklist/[itemId]/upload/route.ts` | **BRD-Core** | US-22, attachments |
| `app/api/contacts/route.ts` | **BRD-Core** | §5 contacts |
| `app/api/contacts/[id]/route.ts` | **BRD-Core** | §5 contacts |
| `app/api/companies/route.ts` | **Ambiguous** | BRD uses "prospects" not "companies"; may be a data-model alias or a separate entity |
| `app/api/companies/[id]/route.ts` | **Ambiguous** | Same |
| `app/api/companies/[id]/categories/route.ts` | **Ambiguous** | Same |
| `app/api/companies/wizard/route.ts` | **Ambiguous** | Same |
| `app/api/service-categories/route.ts` | **Ambiguous** | BRD has `service_required` as a field on prospects and `lookups` for service types; a separate service-categories resource may map to that lookup or be extra |
| `app/api/service-categories/[id]/route.ts` | **Ambiguous** | Same |
| `app/api/communications/[id]/attachments/route.ts` | **BRD-Core** | §5 communications + attachments, US-17 |
| `app/api/admin/document-templates/route.ts` | **BRD-Core** | §5 document_requirements, US-21 |
| `app/api/admin/document-templates/[id]/route.ts` | **BRD-Core** | Same |
| `app/api/admin/user-permissions/route.ts` | **BRD-Core** | §4 permission management, US-02 |
| `app/api/admin/user-permissions/[userId]/route.ts` | **BRD-Core** | Same |
| `app/api/users/route.ts` | **BRD-Core** | §5 users, US-02 |
| `app/api/employees/route.ts` | **Ambiguous** | Overlaps with users/user management (BRD-Core) but "employee" framing suggests HR scope beyond CRM users |
| `app/api/activities/overdue/route.ts` | **BRD-Core** | US-15, overdue follow-up visibility |
| `app/api/activity/route.ts` | **BRD-Core** | §5 activities |

### Not-In-BRD-At-All API routes

| Route | Category | Reason |
|---|---|---|
| `app/api/attendance/analytics/route.ts` | **Not-In-BRD-At-All** | Attendance not in BRD |
| `app/api/attendance/breaks/route.ts` | **Not-In-BRD-At-All** | Same |
| `app/api/attendance/breaks/end/route.ts` | **Not-In-BRD-At-All** | Same |
| `app/api/attendance/breaks/start/route.ts` | **Not-In-BRD-At-All** | Same |
| `app/api/attendance/breaks/today/route.ts` | **Not-In-BRD-At-All** | Same |
| `app/api/attendance/calendar/route.ts` | **Not-In-BRD-At-All** | Same |
| `app/api/attendance/check-in/route.ts` | **Not-In-BRD-At-All** | Same |
| `app/api/attendance/check-out/route.ts` | **Not-In-BRD-At-All** | Same |
| `app/api/attendance/records/route.ts` | **Not-In-BRD-At-All** | Same |
| `app/api/attendance/shifts/route.ts` | **Not-In-BRD-At-All** | Same |
| `app/api/attendance/shifts/me/route.ts` | **Not-In-BRD-At-All** | Same |
| `app/api/attendance/today/route.ts` | **Not-In-BRD-At-All** | Same |
| `app/api/attendance/wfh/route.ts` | **Not-In-BRD-At-All** | Work-from-home not in BRD |
| `app/api/attendance/wfh/[id]/route.ts` | **Not-In-BRD-At-All** | Same |
| `app/api/attendance/wfh/[id]/review/route.ts` | **Not-In-BRD-At-All** | Same |
| `app/api/clients/route.ts` | **Not-In-BRD-At-All** | "Clients" not a named BRD entity |
| `app/api/clients/[id]/route.ts` | **Not-In-BRD-At-All** | Same |
| `app/api/tasks/route.ts` | **Not-In-BRD-At-All** | Generic task management not in BRD |
| `app/api/tasks/[id]/route.ts` | **Not-In-BRD-At-All** | Same |
| `app/api/tasks/[id]/assignees/route.ts` | **Not-In-BRD-At-All** | Same |

---

## 3. Components (`components/`)

### Layout — Shared-Infra

| File | Category |
|---|---|
| `components/layout/AppShell.tsx` | Shared-Infra |
| `components/layout/AuthGuard.tsx` | Shared-Infra |
| `components/layout/Breadcrumbs.tsx` | Shared-Infra |
| `components/layout/GlobalSearch.tsx` | Shared-Infra |
| `components/layout/NotificationCenter.tsx` | **BRD-Core** (§5 notifications, US-26) |
| `components/layout/Sidebar.tsx` | Shared-Infra |
| `components/layout/ThemeProvider.tsx` | Shared-Infra |
| `components/layout/Topbar.tsx` | Shared-Infra |
| `components/layout/UserProfileMenu.tsx` | Shared-Infra |

### Dashboard — BRD-Core

| File | Category |
|---|---|
| `components/dashboard/ActivityCard.tsx` | **BRD-Core** |
| `components/dashboard/StatisticCard.tsx` | **BRD-Core** |
| `components/dashboard/TaskCard.tsx` | **Ambiguous** — "Task" card likely serves BRD activities but name references non-BRD task module |

### Prospects — BRD-Core

| File | Category |
|---|---|
| `components/prospects/ActivityTab.tsx` | **BRD-Core** — activities/follow-ups, US-13–US-15 |
| `components/prospects/OnboardingTab.tsx` | **BRD-Core** — onboarding, US-21–US-23 |
| `components/prospects/ProposalTab.tsx` | **BRD-Core** — proposals, US-18–US-20 |

### Projects — Not-In-BRD-At-All

| File | Category |
|---|---|
| `components/projects/index.ts` | **Not-In-BRD-At-All** |
| `components/projects/project-detail-utils.ts` | **Not-In-BRD-At-All** |
| `components/projects/ProjectDetail.tsx` | **Not-In-BRD-At-All** |
| `components/projects/ProjectsModule.tsx` | **Not-In-BRD-At-All** |

### Tasks — Not-In-BRD-At-All

| File | Category |
|---|---|
| `components/tasks/index.ts` | **Not-In-BRD-At-All** |
| `components/tasks/TaskEditor.tsx` | **Not-In-BRD-At-All** |
| `components/tasks/TasksModule.tsx` | **Not-In-BRD-At-All** |
| `components/tasks/TaskWorkspace.tsx` | **Not-In-BRD-At-All** |

### Workflow — Ambiguous

The BRD mentions stage history and status changes but no generic "workflow engine." These components are shared by proposal status (BRD-Core) and potentially other non-BRD flows.

| File | Category |
|---|---|
| `components/workflow/index.ts` | **Ambiguous** |
| `components/workflow/WorkflowHistoryPanel.tsx` | **Ambiguous** |
| `components/workflow/WorkflowStatusBadge.tsx` | **Ambiguous** |
| `components/workflow/WorkflowStatusDropdown.tsx` | **Ambiguous** |
| `components/workflow/WorkflowTimeline.tsx` | **Ambiguous** |
| `components/workflow/WorkflowTransitionConfirmationModal.tsx` | **Ambiguous** |

### UI Primitives — Shared-Infra

All files under `components/ui/` are primitive building blocks (buttons, cards, modals, tables, etc.) used across the entire app.

| Files | Category |
|---|---|
| `components/ui/*.tsx` (all 16 files) | Shared-Infra |

---

## 4. Lib (`lib/`)

| File | Category | Reason |
|---|---|---|
| `lib/auth/require-role.ts` | Shared-Infra | RBAC enforcement, BRD §4 |
| `lib/auth/session-cookie.ts` | Shared-Infra | Auth infrastructure |
| `lib/auth/team-scope.ts` | Shared-Infra | Team scoping, BRD §4 |
| `lib/supabase/admin.ts` | Shared-Infra | Service-role DB client |
| `lib/config/env.ts` | Shared-Infra | Environment config |
| `lib/api.ts` | Shared-Infra | Shared API utilities |
| `lib/theme.ts` | Shared-Infra | UI theme |
| `lib/activity.ts` | **BRD-Core** | Activity/follow-up logic, §5 activities |
| `lib/activity-status.ts` | **BRD-Core** | Computed overdue/due-today status, US-15 |
| `lib/tasks/changelog.ts` | **Not-In-BRD-At-All** | Task changelog for generic task module |

---

## 5. `src/` — Module Layer

### Auth — Shared-Infra

| File | Category |
|---|---|
| `src/modules/auth/*` (5 files) | Shared-Infra |
| `src/providers/SessionProvider.tsx` | Shared-Infra |
| `src/providers/PermissionProvider.tsx` | Shared-Infra |
| `src/services/auth/*` (3 files) | Shared-Infra |

### Audit — BRD-Core
BRD §5 `audit_logs`, US-29.

| File | Category |
|---|---|
| `src/modules/audit/audit-client.ts` | **BRD-Core** |
| `src/modules/audit/audit-service.ts` | **BRD-Core** |

### Companies — Ambiguous
BRD data model uses "prospects" as the primary entity with `company_name` as a field. A separate `companies` module could be an alias for prospects or an additional entity not in the BRD.

| File | Category |
|---|---|
| `src/modules/companies/company-types.ts` | **Ambiguous** |

### Contacts — BRD-Core

| File | Category |
|---|---|
| `src/modules/contacts/contact-types.ts` | **BRD-Core** — §5 contacts entity |

### Contracts — Not-In-BRD-At-All (and NOT explicitly excluded)
Contracts are not mentioned in the BRD data model (Section 5) and are not in the Section 14 exclusions list. They are simply absent from the spec.

| File | Category |
|---|---|
| `src/modules/contracts/contract-types.ts` | **Not-In-BRD-At-All** |

### Dashboard — BRD-Core

| File | Category |
|---|---|
| `src/modules/dashboard/index.ts` | **BRD-Core** |

### Leads — Not-In-BRD-At-All
BRD does not define a separate `leads` entity. The pipeline goes from prospect through stages to Won/Lost.

| File | Category |
|---|---|
| `src/modules/leads/lead-types.ts` | **Not-In-BRD-At-All** |

### Projects — Not-In-BRD-At-All

| File | Category |
|---|---|
| `src/modules/projects/index.ts` | **Not-In-BRD-At-All** |
| `src/modules/projects/project-client.ts` | **Not-In-BRD-At-All** |
| `src/modules/projects/project-service.ts` | **Not-In-BRD-At-All** |
| `src/modules/projects/project-types.ts` | **Not-In-BRD-At-All** |
| `src/modules/project-members/pm-client.ts` | **Not-In-BRD-At-All** |
| `src/modules/project-members/pm-service.ts` | **Not-In-BRD-At-All** |
| `src/modules/project-members/pm-types.ts` | **Not-In-BRD-At-All** |

### Quotations — Not-In-BRD-At-All (note: BRD has Proposals, not Quotations)
BRD §5 defines `proposals`. "Quotations" is a different commercial document and is not in the BRD. It is also not in Section 14's exclusions.

| File | Category |
|---|---|
| `src/modules/quotations/quotation-types.ts` | **Not-In-BRD-At-All** |

### Tasks — Not-In-BRD-At-All

| File | Category |
|---|---|
| `src/modules/tasks/index.ts` | **Not-In-BRD-At-All** |
| `src/modules/tasks/task-client.ts` | **Not-In-BRD-At-All** |
| `src/modules/tasks/task-filters.ts` | **Not-In-BRD-At-All** |
| `src/modules/tasks/task-service.ts` | **Not-In-BRD-At-All** |
| `src/modules/tasks/task-types.ts` | **Not-In-BRD-At-All** |

### Workflow Engine — Ambiguous
Used by proposal status flow (BRD-Core) and potentially other non-BRD flows.

| File | Category |
|---|---|
| `src/lib/workflows/engine.ts` | **Ambiguous** |
| `src/lib/workflows/index.ts` | **Ambiguous** |
| `src/lib/workflows/persistence.ts` | **Ambiguous** |
| `src/lib/workflows/registry.ts` | **Ambiguous** |
| `src/lib/workflows/types.ts` | **Ambiguous** |

### Generic infra — Shared-Infra

| Files | Category |
|---|---|
| `src/lib/constants/index.ts` | Shared-Infra |
| `src/lib/permissions/index.ts` | Shared-Infra |
| `src/lib/utils/index.ts` | Shared-Infra |
| `src/lib/validations/index.ts` | Shared-Infra |
| `src/providers/index.ts` | Shared-Infra |
| `src/services/index.ts` | Shared-Infra |
| `src/index.ts` | Shared-Infra |
| `src/types/index.ts` | Shared-Infra |
| `src/mock/data.ts` | Shared-Infra |
| `src/components/*/index.ts` (6 barrel files) | Shared-Infra |

---

## 6. Database Migrations (`supabase/`)

### BRD-Core migrations

| File | Category | Reason |
|---|---|---|
| `supabase/20260703_auth_rbac_init.sql` | **BRD-Core** | RBAC setup, §4 |
| `supabase/migrations/20261005_crm_core.sql` | **BRD-Core** | Companies, contacts, leads, tasks (CRM foundation) |
| `supabase/migrations/20261013_crm_pipeline_v2.sql` | **BRD-Core** | Pipeline stages, §5 |
| `supabase/migrations/20261013_employee_creation_fn.sql` | Shared-Infra | User creation, §5 users |
| `supabase/migrations/20261013_fix_admin_role.sql` | Shared-Infra | RBAC fix |
| `supabase/migrations/20261014_contacts_email_nullable.sql` | **BRD-Core** | §5 contacts |
| `supabase/migrations/20261102_activities_communications.sql` | **BRD-Core** | §5 activities, communications |
| `supabase/migrations/20261102_prospects_pipeline_rebuild.sql` | **BRD-Core** | §5 prospects, pipeline_stages |
| `supabase/migrations/20261102_rbac_v2.sql` | Shared-Infra | RBAC v2 |
| `supabase/migrations/20261103_onboarding.sql` | **BRD-Core** | §5 onboarding_cases, onboarding_items |
| `supabase/migrations/20261103_proposals.sql` | **BRD-Core** | §5 proposals, proposal_revisions |

### Not-In-BRD-At-All migrations

| File | Category | Reason |
|---|---|---|
| `supabase/migrations/20261010_attendance_core.sql` | **Not-In-BRD-At-All** | Attendance not in BRD |
| `supabase/migrations/20261012_attendance_breaks.sql` | **Not-In-BRD-At-All** | Same |
| `supabase/migrations/20261012_attendance_checkin.sql` | **Not-In-BRD-At-All** | Same |
| `supabase/migrations/20261012_attendance_wfh.sql` | **Not-In-BRD-At-All** | Same |
| `supabase/migrations/20261002_owner_id_and_tasks.sql` | **Not-In-BRD-At-All** | Generic tasks |
| `supabase/migrations/20261002_project_members.sql` | **Not-In-BRD-At-All** | Project members |
| `supabase/20260706_projects_invoices.sql` | **Not-In-BRD-At-All** | Projects not in BRD |
| `supabase/companies.sql` | **Ambiguous** | May map to prospects or be a separate entity |
| `supabase/contracts.sql` | **Not-In-BRD-At-All** | Contracts not in BRD |
| `supabase/quotations.sql` | **Not-In-BRD-At-All** | Quotations not in BRD |
| `supabase/workflows.sql` | **Ambiguous** | Workflow engine — shared by BRD and non-BRD flows |
| `supabase/20260703_authz_snapshot_rls_select.sql` | Shared-Infra | RLS policies for auth |
| `supabase/COMBINED_MIGRATIONS.sql` | Shared-Infra | Composite, includes both |

---

## 7. `markition-desktop/` — Not-In-BRD-At-All

The BRD specifies a web application hosted on managed cloud (§3). An Electron desktop wrapper is not mentioned anywhere in the BRD.

| File | Category |
|---|---|
| `markition-desktop/*` (all 9 files) | **Not-In-BRD-At-All** |

---

## 8. Tests and Infrastructure

| File / Group | Category | Reason |
|---|---|---|
| `__tests__/api/onboarding/upload.integration.test.ts` | **BRD-Core** | Tests onboarding upload (US-22) |
| `__tests__/lib/api-cache.system.test.ts` | Shared-Infra | API infrastructure test |
| `e2e/onboarding-upload.spec.ts` | **BRD-Core** | E2E test for onboarding flow |
| `e2e/auth.setup.ts` | Shared-Infra | Auth setup for tests |
| `docs/workflows.md` | **Ambiguous** | Documents workflow engine used by BRD + non-BRD modules |
| `docs/workflows-migration.md` | **Ambiguous** | Same |

---

## 9. Scripts (`scripts/`)

| File | Category | Reason |
|---|---|---|
| `scripts/run-crm-migration.mjs` | Shared-Infra | Runs CRM migrations |
| `scripts/run-pipeline-v2-migration.mjs` | **BRD-Core** | Pipeline v2 migration |
| `scripts/run-setup.mjs` | Shared-Infra | General setup |
| `scripts/seed-default-admin.mjs` | Shared-Infra | Admin seeding |
| `scripts/seed-test-users.mjs` | Shared-Infra | Test users |
| `scripts/setup-auth.mjs` | Shared-Infra | Auth setup |
| `scripts/test-crm-backend.mjs` | **BRD-Core** | Tests CRM backend |
| `scripts/test-pipeline-v2.mjs` | **BRD-Core** | Tests pipeline |
| `scripts/probe-tables.mjs` | Shared-Infra | DB probe utility |
| `scripts/check-fk.mjs` | Shared-Infra | FK check utility |
| `scripts/check-projects-schema.mjs` | **Not-In-BRD-At-All** | Projects schema check |
| `scripts/migrate-activity-log.mjs` | **BRD-Core** | Activity log migration |
| `scripts/run-breaks-migration.mjs` | **Not-In-BRD-At-All** | Attendance breaks |
| `scripts/run-checkin-migration.mjs` | **Not-In-BRD-At-All** | Attendance check-in |
| `scripts/run-wfh-migration.mjs` | **Not-In-BRD-At-All** | WFH attendance |
| `scripts/fix-test-users.sql` | Shared-Infra | Test user fix |
| `scripts/reset-pw.mjs` | Shared-Infra | Password reset utility |

---

## Summary Table

| Category | Count (approx file groups) |
|---|---|
| **BRD-Core** | ~95 files |
| **Shared-Infra** | ~65 files |
| **Not-In-BRD-At-All** | ~85 files |
| **Ambiguous** | ~25 files |
| **BRD-Explicitly-Excluded** | 0 files found |

**Note on BRD-Explicitly-Excluded:** Section 14 of the BRD excludes accounting/ERP, payroll, automated marketing campaigns, AI forecasting, full WhatsApp Business API, external customer portal, e-signature, and third-party ERP integration. **None of these appear in the codebase.** The non-BRD modules found (attendance, projects, tasks, clients, leads, quotations, contracts, desktop app) are in the "Not-In-BRD-At-All" category — they were not asked for in the BRD, and they were not explicitly excluded either. They are simply unrelated to the spec.

---

## Key Findings

1. **Attendance module** (`app/admin/attendance/`, `app/api/attendance/`, 4 migrations) — substantial feature set with no BRD basis.
2. **Generic task management** (`app/(crm)/tasks/`, `app/api/tasks/`, `components/tasks/`, `src/modules/tasks/`) — not the same as BRD "activities/follow-ups."
3. **Projects module** (`app/(crm)/projects/`, `src/modules/projects/`) — not in BRD scope.
4. **Clients / Active Clients** (`app/(crm)/clients/`, `app/(crm)/active-clients/`) — not a named BRD entity.
5. **Contracts and Quotations** (`supabase/contracts.sql`, `supabase/quotations.sql`, type files) — absent from BRD (note: BRD has Proposals, not Quotations or Contracts).
6. **Desktop app** (`markition-desktop/`) — BRD specifies a hosted web app.
7. **Leads as a separate entity** (`app/(crm)/leads/`, `src/modules/leads/`) — BRD's pipeline has no separate leads table; prospects move through stages.
8. **Workflow engine** (`src/lib/workflows/`, `components/workflow/`) — marked Ambiguous because it underpins proposal status transitions (BRD-Core) but is a general engine used by non-BRD flows too.
