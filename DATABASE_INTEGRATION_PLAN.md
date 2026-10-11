# Comprehensive Database & Backend Integration Plan (SMSR)

**Document Version:** 1.0  
**Target Database:** Microsoft SQL Server 2025 (`ScoutsDB`)  
**Connection Protocol:** `mssql/msnodesqlv8` (ODBC Driver 18 for SQL Server)  
**Strict Policy:** Zero dummy/mock data; 100% live database persistence.

---

## 1. Executive Summary & Audit Findings

Following a full system scan of all frontend routes and backend APIs, here is the exact audit status of each feature:

| Feature / Page | Frontend Route | Current State | Target Database Tables | Status |
| :--- | :--- | :--- | :--- | :--- |
| **RBAC & Permissions** | `/admin/permissions` | **100% Live DB** | `dbo.users`, `dbo.roles`, `dbo.permissions`, `dbo.user_permission_overrides` |  Verified Live |
| **Media Library Uploads** | `/media` | **100% Live Drive API** | Google Drive Cloud API v3 |  Verified Live (Needs DB indexing) |
| **Members & Patrols** | `/members` | **Dummy / LocalStorage** (`INITIAL_MEMBERS`) | `dbo.members`, `dbo.patrols`, `dbo.units` | ⚠️ In Progress (Phase 1) |
| **Attendance Roll-Call** | `/attendance` | **In-Memory State** (`savedSessions`) | `dbo.attendance_sessions`, `dbo.attendance_records` |  Pending Phase 2 |
| **Gear & Inventory** | `/inventory` | **Hardcoded Array** (`INITIAL_EQUIPMENT`) | `dbo.equipment`, `dbo.equipment_categories`, `dbo.bookings`, `dbo.booking_items` |  Pending Phase 3 |
| **Audit Logs** | `/admin/audit-logs` | **LocalStorage** (`scouts_audit_logs`) | `dbo.audit_logs` |  Pending Phase 4 |
| **Executive & Team Analytics** | `/admin/analytics` | **Hardcoded Static Arrays** | `dbo.attendance_records`, `dbo.bookings`, `dbo.members` |  Pending Phase 5 |
| **Scout Space Portal** | `/scout` | **Mock Data / Session Memory** | `dbo.members`, `dbo.attendance_records`, `dbo.media_items` |  Pending Phase 6 |
| **Home Dashboard Counters** | `/` | **Hardcoded array counts** | Live SQL aggregates (`COUNT(*)`) |  Pending Phase 7 |

---

## 2. Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Frontend Client (Next.js App Router)
        UI_Mem[Members Page /members]
        UI_Att[Attendance Page /attendance]
        UI_Inv[Inventory Page /inventory]
        UI_Audit[Audit Logs /admin/audit-logs]
        UI_Ana[Analytics /admin/analytics]
        UI_Scout[Scout Space /scout]
        UI_Dash[Home Dashboard /]
    end

    subgraph Backend REST API Layer (Next.js Routes)
        API_Mem[/api/members]
        API_Att[/api/attendance]
        API_Inv[/api/inventory & /api/inventory/bookings]
        API_Audit[/api/audit-logs]
        API_Ana[/api/analytics]
        API_Scout[/api/scout/profile]
        API_Dash[/api/dashboard/stats]
        API_Media[/api/media/upload]
    end

    subgraph Microsoft SQL Server 2025 (ScoutsDB)
        DB_Mem[(dbo.members & dbo.patrols)]
        DB_Att[(dbo.attendance_sessions & dbo.attendance_records)]
        DB_Inv[(dbo.equipment, dbo.bookings, dbo.booking_items)]
        DB_Audit[(dbo.audit_logs)]
        DB_Media[(dbo.media_items & dbo.media_albums)]
    end

    UI_Mem <-->|GET / POST / PUT| API_Mem <--> DB_Mem
    UI_Att <-->|GET / POST| API_Att <--> DB_Att
    UI_Inv <-->|GET / POST / PUT| API_Inv <--> DB_Inv
    UI_Audit <-->|GET / POST| API_Audit <--> DB_Audit
    UI_Ana <-->|GET Aggregates| API_Ana <--> DB_Att & DB_Inv & DB_Mem
    UI_Scout <-->|GET Profile & History| API_Scout <--> DB_Mem & DB_Att
    UI_Dash <-->|GET Counts| API_Dash <--> DB_Mem & DB_Inv & DB_Att
    API_Media -->|Index uploaded items| DB_Media
```

---

## 3. Step-by-Step Implementation Roadmap

### Phase 1: Members & Patrols Management API
**Objective:** Replace `INITIAL_MEMBERS` and `localStorage` with live database reads/writes for scout roster and patrol management.

1. **Backend API Endpoint:** [`frontend/src/app/api/members/route.ts`](file:///d:/Scouts%20System/frontend/src/app/api/members/route.ts)
   - `GET /api/members`: Fetches members from `dbo.members` joined with `dbo.units` and `dbo.patrols`. Also returns `dbo.patrols`.
   - `POST /api/members`: Inserts a new member into `dbo.members` with generated `member_code`, encrypted/hashed PIN, default `is_active = 1`, and audit log creation.
   - `PUT /api/members`: Supports `assign_patrol` (updates `dbo.members.patrol_id`) and profile modifications (medical notes, Sunday school, confession father).
2. **Frontend Wiring:**
   - In [`frontend/src/lib/AuthContext.tsx`](file:///d:/Scouts%20System/frontend/src/lib/AuthContext.tsx):
     - In `refreshPermissions()`, call `GET /api/members` to update `members` and `patrols` state.
     - In `addMember()`, execute `POST /api/members` and update state with the inserted member.
     - In `assignScoutPatrol()`, execute `PUT /api/members` (`action: 'assign_patrol'`).
   - In [`frontend/src/app/members/page.tsx`](file:///d:/Scouts%20System/frontend/src/app/members/page.tsx): Consume live members directly from `AuthContext`.

---

### Phase 2: Attendance Tracking & Roll-Call Engine
**Objective:** Replace in-memory `setSavedSessions` with durable transactional writes to SQL Server.

1. **Backend API Endpoint:** [`frontend/src/app/api/attendance/route.ts`](file:///d:/Scouts%20System/frontend/src/app/api/attendance/route.ts)
   - `GET /api/attendance?unitId=<id>`: Fetches historical sessions and attendance records for the selected unit from `dbo.attendance_sessions` and `dbo.attendance_records`.
   - `POST /api/attendance`: Executes a database transaction:
     1. Inserts a session header into `dbo.attendance_sessions` (`unit_id`, `session_date`, `created_by`, `session_title`).
     2. Inserts individual member roll-calls into `dbo.attendance_records` (`session_id`, `member_id`, `status`, `notes`).
     3. Inserts an entry into `dbo.audit_logs`.
2. **Frontend Wiring:**
   - In [`frontend/src/app/attendance/page.tsx`](file:///d:/Scouts%20System/frontend/src/app/attendance/page.tsx):
     - Fetch sessions on unit selection change via `GET /api/attendance?unitId=${selectedUnitId}`.
     - In `handleSave()`, send `POST /api/attendance` with the roll-call payload.
     - Display saved session history from the database.

---

### Phase 3: Gear & Material Inventory Engine
**Objective:** Replace hardcoded `INITIAL_EQUIPMENT` with live database equipment catalog and checkout reservations.

1. **Database Catalog Seed:**
   - Create script [`backend/scripts/seed-equipment.ts`](file:///d:/Scouts%20System/backend/scripts/seed-equipment.ts) to populate the 9 official scout equipment items into `dbo.equipment` mapped to `dbo.equipment_categories` (Tents, Cooking, Pioneering, Lighting, Audio). Keep `bookings` at 0 rows.
2. **Backend API Endpoints:**
   - [`frontend/src/app/api/inventory/route.ts`](file:///d:/Scouts%20System/frontend/src/app/api/inventory/route.ts):
     - `GET /api/inventory`: Returns equipment catalog with real-time calculated available quantities.
     - `POST /api/inventory`: Allows Quartermasters/Admins to add or modify equipment items.
   - [`frontend/src/app/api/inventory/bookings/route.ts`](file:///d:/Scouts%20System/frontend/src/app/api/inventory/bookings/route.ts):
     - `GET /api/inventory/bookings?unitId=<id>`: Returns active and past gear bookings.
     - `POST /api/inventory/bookings`: Creates a booking in `dbo.bookings` and `dbo.booking_items`.
     - `PUT /api/inventory/bookings`: Handles booking approvals, rejections, checkouts, and returns.
3. **Frontend Wiring:**
   - In [`frontend/src/app/inventory/page.tsx`](file:///d:/Scouts%20System/frontend/src/app/inventory/page.tsx):
     - Fetch live equipment catalog and bookings from `/api/inventory`.
     - In `handleCreateBooking()`, send `POST /api/inventory/bookings`.
     - In status update handler, send `PUT /api/inventory/bookings`.

---

### Phase 4: Leader Audit Trail Persistence
**Objective:** Replace browser `localStorage` audit logs with `dbo.audit_logs` in Microsoft SQL Server.

1. **Backend API Endpoint:** [`frontend/src/app/api/audit-logs/route.ts`](file:///d:/Scouts%20System/frontend/src/app/api/audit-logs/route.ts)
   - `GET /api/audit-logs`: Returns paginated audit logs joined with `dbo.users` and `dbo.units`, with optional filters (`action_type`, `unit_id`, `user_id`).
   - `POST /api/audit-logs`: Inserts a structured audit entry into `dbo.audit_logs`.
2. **Frontend Wiring:**
   - In [`frontend/src/lib/AuthContext.tsx`](file:///d:/Scouts%20System/frontend/src/lib/AuthContext.tsx): Update `logAction()` to send an async `POST /api/audit-logs`.
   - In [`frontend/src/app/admin/audit-logs/page.tsx`](file:///d:/Scouts%20System/frontend/src/app/admin/audit-logs/page.tsx): Fetch logs directly from `/api/audit-logs`.

---

### Phase 5: Real Analytics Telemetry
**Objective:** Replace static hardcoded numbers with live T-SQL aggregate queries.

1. **Backend API Endpoint:** [`frontend/src/app/api/analytics/route.ts`](file:///d:/Scouts%20System/frontend/src/app/api/analytics/route.ts)
   - `GET /api/analytics/executive`: Executes aggregate queries for unit attendance rates and equipment utilization.
   - `GET /api/analytics/team?unitId=<id>`: Computes member attendance rates and patrol performance.
2. **Frontend Wiring:**
   - In [`frontend/src/app/admin/analytics/page.tsx`](file:///d:/Scouts%20System/frontend/src/app/admin/analytics/page.tsx): Consume data from `/api/analytics/executive`.
   - In [`frontend/src/components/TeamAttendanceAnalytics.tsx`](file:///d:/Scouts%20System/frontend/src/components/TeamAttendanceAnalytics.tsx): Fetch team telemetry from `/api/analytics/team?unitId=${selectedUnitId}`.

---

### Phase 6: Media Database Indexing & Scout Portal Integration
**Objective:** Synchronize Google Drive uploads with `dbo.media_items` and connect the Scout Portal to live progression history.

1. **Media Upload Sync:**
   - In [`frontend/src/app/api/media/upload/route.ts`](file:///d:/Scouts%20System/frontend/src/app/api/media/upload/route.ts): On successful Drive upload, insert a record into `dbo.media_items`.
2. **Scout Portal Integration:**
   - Create [`frontend/src/app/api/scout/profile/route.ts`](file:///d:/Scouts%20System/frontend/src/app/api/scout/profile/route.ts):
     - Computes attendance percentage, streak, and honors from `dbo.attendance_records`.
     - Queries available albums from `dbo.media_albums`.
   - In [`frontend/src/app/scout/page.tsx`](file:///d:/Scouts%20System/frontend/src/app/scout/page.tsx): Consume real attendance and album data from the profile endpoint.

---

### Phase 7: Home Dashboard Metrics & Global Cleanup
**Objective:** Replace static array lengths with live database counts and remove all leftover mock references.

1. **Backend API Endpoint:** [`frontend/src/app/api/dashboard/stats/route.ts`](file:///d:/Scouts%20System/frontend/src/app/api/dashboard/stats/route.ts)
   - Returns live counts: `totalMembers`, `totalEquipment`, `totalSessions`.
2. **Frontend Wiring:**
   - In [`frontend/src/app/page.tsx`](file:///d:/Scouts%20System/frontend/src/app/page.tsx): Fetch live stats on mount.
3. **Deprecate Dummy Data:**
   - Deprecate or remove `INITIAL_*` from `frontend/src/lib/data.ts`.

---

## 4. Database Integrity & Constraints Checklist

| Table | Operation | Constraints & Validation |
| :--- | :--- | :--- |
| `dbo.members` | `INSERT / UPDATE` | `member_code` unique, `unit_id` FK valid, `patrol_id` FK valid within unit. |
| `dbo.attendance_sessions` | `INSERT` | `UNIQUE (unit_id, session_date)` prevents duplicate sessions for the same unit and date. |
| `dbo.attendance_records` | `INSERT` | `status` IN ('present', 'absent', 'excused', 'late'), `member_id` must belong to the unit. |
| `dbo.equipment` | `INSERT / UPDATE` | `sku` unique, `total_quantity >= 0`, `category_id` valid. |
| `dbo.bookings` | `INSERT` | `end_date >= start_date`, `status` IN ('pending', 'approved', 'rejected', 'checked_out', 'returned'). |
| `dbo.audit_logs` | `INSERT` | `action_type` valid, `metadata` must satisfy `ISJSON(metadata) > 0`. |

---

## 5. Verification & Testing Protocol

1. **Automated Verification:**
   - Update [`backend/scripts/verify-mssql.ts`](file:///d:/Scouts%20System/backend/scripts/verify-mssql.ts) to verify operational table functionality and relations.
   - Run `npm run verify:mssql` to ensure schema integrity and T-SQL functions are intact.
   - Run `npm run verify` to test RBAC, equipment availability, and scout scoping logic.
2. **TypeScript Compilation:**
   - Run `npx tsc --noEmit` in `frontend/` to ensure 0 type errors.
3. **End-to-End Browser Flow:**
   - Create a new Scout in `/members` $\rightarrow$ verify record in `dbo.members`.
   - Record attendance for Kashafa A in `/attendance` $\rightarrow$ verify records in `dbo.attendance_sessions` and `dbo.attendance_records`.
   - Submit an equipment booking in `/inventory` $\rightarrow$ verify record in `dbo.bookings`.
   - Verify `/admin/audit-logs` displays the actions from `dbo.audit_logs`.
   - Verify `/admin/analytics` computes real metrics from the created records.
