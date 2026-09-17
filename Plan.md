# Comprehensive System Specification & Build Prompt: Scout Organization Management Platform

You are an expert full-stack software architect and senior engineer. Your objective is to design, scaffold, and implement a complete, production-ready Scout Management Platform tailored for ~1,000 active members (youth scouts and leaders).

---

## 1. Technical Stack & Infrastructure Specifications

- **Frontend:** Next.js (App Router, TypeScript, Tailwind CSS, shadcn/ui components, Lucide Icons).
  - Responsive, mobile-first layouts for attendance and equipment checkout.
  - Native RTL (Right-to-Left) and LTR (Left-to-Right) layout direction switching for bilingual Arabic/English usage.
- **Backend & Database:** PostgreSQL via Supabase (or Node.js/NestJS + Prisma ORM + PostgreSQL).
- **Authentication:** Supabase Auth or NextAuth/Auth.js (email/password with secure session handling).
- **Authorization Engine:** Hybrid Scoped RBAC + Direct Granular Permission Overrides (via PostgreSQL functions and Row-Level Security policies).
- **Media & File Storage Pipeline:**
  - Fast staging buffer (15 GB local volume or scratch bucket) for immediate client ingestion.
  - Background asynchronous rate-limited queue (BullMQ + Redis or a dedicated PostgreSQL-backed queue table).
  - Centralized Google Drive API v3 ingestion using a single Google Cloud Service Account pushing all media to one shared organization Drive folder.

---

## 2. Organizational Hierarchy & Unit Structure

The platform manages 12 distinct organizational units across age groups and leadership bodies.

### Troop Structure Rules
- **Cubs & Brownies:** Sequential progression from Grade 5 (`cubs_a` / `brownies_a`) to Grade 6 (`cubs_b` / `brownies_b`).
- **Scouts & Guides:** Organized into **two parallel, co-equal troops** (`scouts_a` vs `scouts_b`, and `guides_a` vs `guides_b`), each comprising a mixed cohort of Prep 1 through Prep 3 scouts (ages 12–15). Scouts remain in their assigned troop throughout preparatory school; both troops graduate together into `advanced_scouts` / `senior_guides`.
- **Patrols (طلائع / سداسيات):** Each unit contains multiple sub-patrols linked by `unit_id`.

### Seed Units Definition
1. `cubs_a` — أشبال A (Ashbal A) — Grade 5 (Boys, Ages 10–11)
2. `cubs_b` — أشبال B (Ashbal B) — Grade 6 (Boys, Ages 11–12)
3. `brownies_a` — زهرات A (Zahrat A) — Grade 5 (Girls, Ages 10–11)
4. `brownies_b` — زهرات B (Zahrat B) — Grade 6 (Girls, Ages 11–12)
5. `scouts_a` — كشافة A (Kashafa A) — Prep 1–3 Parallel Troop A (Boys, Ages 12–15)
6. `scouts_b` — كشافة B (Kashafa B) — Prep 1–3 Parallel Troop B (Boys, Ages 12–15)
7. `guides_a` — مرشدات A (Morshdat A) — Prep 1–3 Parallel Company A (Girls, Ages 12–15)
8. `guides_b` — مرشدات B (Morshdat B) — Prep 1–3 Parallel Company B (Girls, Ages 12–15)
9. `advanced_scouts` — متقدم (Motakadem) — Secondary 1–3 (Boys, Ages 15–18)
10. `senior_guides` — رائدات (Ra2edat) — Secondary 1–3 (Girls, Ages 15–18)
11. `rovers` — جوالة (Gawala) — University / Higher Ed (Mixed, Ages 18–23)
12. `leaders` — قادة (Leaders) — Leadership & Adult Staff (Mixed, Ages 21+)

---

## 3. Member Directory & Data Schema

The member record requires explicit per-field language and classification rules:

### A. English / System Only
- `member_code`: Unique scout identifier (الكود, e.g., `SCT-2026-0042`).
- `unit_id`: Foreign key referencing `units`.
- `patrol_id`: Foreign key referencing `patrols`.
- `date_of_birth`: ISO Date (`YYYY-MM-DD`).
- `member_phone`: Scout's personal phone number (E.164 standard).
- `father_phone`: Father's contact number (رقم الأب).
- `mother_phone`: Mother's contact number (رقم الأم).
- `school_or_college`: Name of School or College.
- `academic_year`: Current academic grade/year (السنة الدراسية, e.g., "Prep 2", "Grade 5").

### B. Arabic Only
- `full_name_ar`: Full tripartite Arabic name (الاسم ثلاثي بالعربى - Mandatory).
- `address_ar`: Full detailed residential address in Arabic (العنوان بالعربى).
- `sunday_school_class`: Church Sunday School class/servant reference (فصل مدارس الاحد).
- `father_of_confession`: Spiritual father / priest name (اسم اب الاعتراف).

### C. Bilingual / Flexible
- `full_name_en`: English transliteration of the member's full name (for certificates/badges).
- `notes`: Medical notes, allergies, behavioral remarks, or general observations (NOTE).

---

## 4. Hybrid RBAC & Custom Permission Toggles

The platform provides predefined role presets alongside granular per-leader overrides.

### Base Roles
- **Group Leader (قائد الفوج):** Global unrestricted CRUD access.
- **Quartermaster (أمين العهدة):** Manages equipment, approves bookings, logs item condition.
- **Section Leader (قائد وحدة / مرحلة):** Scoped to their specific `unit_id`. Full control over attendance, member profiles, and stage promotions.
- **Assistant Leader (مساعد قائد):** Scoped to their unit. Takes attendance, views emergency contacts; restricted from destructive operations.
- **Media Officer (مسؤول الإعلام):** Global access to upload pipelines and Drive album structures.

### Granular Permission Keys Catalog
- `members.view`: View member roster and basic contacts.
- `members.create_edit`: Add/edit member profiles and church details.
- `members.view_confidential`: View father of confession, spiritual notes, and medical alerts.
- `members.promote`: Execute annual stage promotions (التصعيد).
- `attendance.take`: Mark and submit active attendance sessions.
- `attendance.edit_history`: Modify past attendance sessions.
- `attendance.export`: Export attendance rosters to CSV/Excel.
- `inventory.view`: View inventory catalog and real-time availability.
- `inventory.book`: Submit equipment checkout requests.
- `inventory.manage`: Add/delete inventory items and adjust counts.
- `inventory.approve`: Approve or reject checkout requests.
- `media.upload`: Upload event photos/videos to the staging queue.
- `media.view_all`: Access organizational Drive archives.
- `users.manage_roles`: Adjust roles, scopes, and custom toggle overrides.

### Permission Resolution Hierarchy
When evaluating whether a user can perform `permission_key` on `unit_id`:
1. **Global Super Admin:** If the user has role `group_leader` with `unit_id IS NULL`, evaluate to `TRUE`.
2. **Per-Leader Direct Override:** Check `user_permission_overrides`:
   - If `is_granted = FALSE`, return `FALSE` (Explicit Revocation).
   - If `is_granted = TRUE`, return `TRUE` (Explicit Grant).
3. **Base Role Fallback:** Check if any assigned role in `user_roles` grants the permission for the given unit (or globally). If yes, return `TRUE`; otherwise, return `FALSE`.

---

## 5. Attendance Module

- **Layout:** Mobile-first roster view grouped by Patrol (الطليعة).
- **Fast Batch Controls:**
  - One-tap "Mark All Present" button.
  - Per-scout status toggles: `Present`, `Absent`, `Excused`, `Late`.
  - Inline input for quick notes (e.g., "Arrived 30m late").
- **Integrity Constraints:** Prevent duplicate sessions for the same `unit_id` on the same calendar date. Store session metadata (`session_date`, `recorded_by`, `session_title`).

---

## 6. Material Booking & Inventory Engine

- **Inventory Structure:** Items categorized (Tents, Cooking, Ropes/Pioneering, Lighting, Sound/AV) with `total_quantity`, `storage_location`, and `condition` (`new`, `good`, `needs_repair`).
- **Booking Flow:** Leaders select their unit, purpose, date range (`start_date` to `end_date`), and requested item quantities.
- **Overlap Prevention Logic:** Enforce at database/transaction level:
  $$\sum(\text{Active Bookings in Overlapping Date Range}) + \text{Requested Quantity} \le \text{Total Quantity}$$
- **Status State Machine:** `pending` $\rightarrow$ `approved` (by Quartermaster) $\rightarrow$ `checked_out` $\rightarrow$ `returned` (with return quantity and condition notes).

---

## 7. Media Ingestion Pipeline (15 GB Buffer $\rightarrow$ Google Drive)

Handle ~40 GB/year of high-resolution photos and camp videos without hitting Google Drive rate limits or failing on large uploads:

1. **Ingestion:** Leaders upload files via the web dashboard. The server writes files immediately to a dedicated **15 GB local staging disk** and registers jobs in `media_upload_queue` (`status = 'queued'`).
2. **Background Worker:**
   - Asynchronous worker (Node.js/BullMQ or DB polling) picks up queued jobs with rate-limiting (max 2 concurrent uploads, max 60 requests/minute).
   - Uses the official `googleapis` library with a Google Cloud Service Account.
   - Files are uploaded to a master Google Drive folder owned by the organization account (`/ScoutsArchive/{Year}/{UnitName}/{EventName}/`).
   - Uses the **resumable upload protocol** (`uploadType=resumable`) for reliable multi-megabyte/gigabyte transfers.
   - Implements exponential backoff on `HTTP 429` / `503`.
3. **Cleanup:** Once Google Drive responds with `200 OK`, the worker deletes the file from the 15 GB local staging buffer and marks the database record as `synced` with the corresponding `drive_file_id`.

---

## 8. Database DDL Blueprint (PostgreSQL)

Generate and run migrations for the following schema:

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Units
CREATE TABLE units (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    stage_group VARCHAR(50) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('boys', 'girls', 'mixed')),
    is_leadership BOOLEAN DEFAULT FALSE,
    min_age INT,
    max_age INT,
    target_grade VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patrols
CREATE TABLE patrols (
    id SERIAL PRIMARY KEY,
    unit_id INT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_code VARCHAR(50) UNIQUE NOT NULL,
    unit_id INT NOT NULL REFERENCES units(id),
    patrol_id INT REFERENCES patrols(id) ON DELETE SET NULL,
    full_name_ar VARCHAR(255) NOT NULL,
    full_name_en VARCHAR(255),
    date_of_birth DATE NOT NULL,
    member_phone VARCHAR(20),
    father_phone VARCHAR(20) NOT NULL,
    mother_phone VARCHAR(20),
    address_ar TEXT NOT NULL,
    address_en TEXT,
    school_or_college VARCHAR(200),
    academic_year VARCHAR(100) NOT NULL,
    sunday_school_class VARCHAR(150),
    father_of_confession VARCHAR(150),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users & Core RBAC
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    key VARCHAR(80) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    description_en VARCHAR(200) NOT NULL,
    description_ar VARCHAR(200) NOT NULL
);

CREATE TABLE role_permissions (
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    unit_id INT REFERENCES units(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_id, unit_id)
);

CREATE TABLE user_permission_overrides (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    unit_id INT REFERENCES units(id) ON DELETE CASCADE,
    is_granted BOOLEAN NOT NULL,
    granted_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, permission_id, unit_id)
);

-- Attendance
CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id INT NOT NULL REFERENCES units(id),
    session_date DATE NOT NULL,
    session_title VARCHAR(150),
    recorded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(unit_id, session_date)
);

CREATE TABLE attendance_records (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'excused', 'late')),
    notes VARCHAR(255),
    UNIQUE(session_id, member_id)
);

-- Material Booking
CREATE TABLE equipment_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE equipment (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES equipment_categories(id),
    name VARCHAR(150) NOT NULL,
    sku VARCHAR(50) UNIQUE,
    total_quantity INT NOT NULL CHECK (total_quantity >= 0),
    storage_bay VARCHAR(100),
    condition VARCHAR(50) DEFAULT 'good',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    unit_id INT REFERENCES units(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'checked_out', 'returned')),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CHECK (end_date >= start_date)
);

CREATE TABLE booking_items (
    id BIGSERIAL PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    equipment_id INT NOT NULL REFERENCES equipment(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    returned_quantity INT DEFAULT 0,
    return_condition_notes TEXT
);

-- Media Upload Queue
CREATE TABLE media_upload_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_by UUID NOT NULL REFERENCES users(id),
    unit_id INT REFERENCES units(id),
    local_buffer_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    target_drive_folder_id VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'queued' CHECK (status IN ('queued', 'uploading', 'synced', 'failed')),
    retry_count INT DEFAULT 0,
    error_message TEXT,
    drive_file_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_members_code ON members(member_code);
CREATE INDEX idx_members_unit ON members(unit_id);
CREATE INDEX idx_attendance_records_member ON attendance_records(member_id);
CREATE INDEX idx_upload_queue_status ON media_upload_queue(status);




9. Required Implementation Deliverables
SQL Migrations & Seeders:

Complete schema DDL above.

Seed scripts inserting all 12 units, default system roles, all 13 permission keys, and role-permission mappings.

Stored procedure check_leader_permission(p_user_id, p_permission_key, p_unit_id) returning boolean.

Booking Availability Service:

Overlap check transaction verifying that requested quantities do not exceed available units for given dates.

Media Upload Worker:

Node.js script processing media_upload_queue.

Google Drive API client using Service Account credentials.

Chunked resumable stream upload, exponential backoff, and local disk unlinking on success.

User Interfaces (Next.js App Router + Tailwind):

Roster & Attendance Page: Grouped by Patrol, "Mark All Present" button, status toggles.

Admin Permissions Matrix: Interactive table of leaders showing base roles alongside individual permission switches (Inherited / Force Enable / Force Disable).

Equipment Booking Calendar: Date range selector with dynamic remaining-quantity indicators.

Media Upload Portal: Drag-and-drop file uploader with live queue/sync status.