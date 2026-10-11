-- ==========================================================
-- Scout Organization Management Platform - PostgreSQL Schema
-- Compatible with PostgreSQL 15+ / PostgreSQL 16+
-- UTF-8 native support for Arabic and English
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Units (12 organizational units)
CREATE TABLE IF NOT EXISTS units (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    stage_group VARCHAR(50) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('boys', 'girls', 'mixed')),
    is_leadership BOOLEAN NOT NULL DEFAULT FALSE,
    target_grade VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Patrols (طلائع / سداسيات / رهوط)
CREATE TABLE IF NOT EXISTS patrols (
    id SERIAL PRIMARY KEY,
    unit_id INT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    name_ar VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Members (Youth Scouts & Members)
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_code VARCHAR(50) NOT NULL UNIQUE,
    pin_hash VARCHAR(255) NOT NULL DEFAULT '1234',
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
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_members_code ON members(member_code);
CREATE INDEX IF NOT EXISTS idx_members_unit ON members(unit_id);
CREATE INDEX IF NOT EXISTS idx_members_patrol ON members(patrol_id);

-- 4. Member Unit Progression History
CREATE TABLE IF NOT EXISTS member_unit_history (
    id SERIAL PRIMARY KEY,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    unit_id INT NOT NULL REFERENCES units(id),
    patrol_id INT REFERENCES patrols(id) ON DELETE SET NULL,
    year INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_member_unit_year UNIQUE(member_id, unit_id, year)
);

CREATE INDEX IF NOT EXISTS idx_history_member_year ON member_unit_history(member_id, year);

-- 5. Users (Adult Leaders & Staff)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 6. Core RBAC: Roles & Permissions
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    key VARCHAR(80) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    description_en VARCHAR(200) NOT NULL,
    description_ar VARCHAR(200) NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    unit_id INT REFERENCES units(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_user_roles_scoped ON user_roles(user_id, role_id, unit_id) WHERE unit_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uidx_user_roles_global ON user_roles(user_id, role_id) WHERE unit_id IS NULL;

CREATE TABLE IF NOT EXISTS user_permission_overrides (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    unit_id INT REFERENCES units(id) ON DELETE SET NULL,
    is_granted BOOLEAN NOT NULL,
    granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_upo_scoped ON user_permission_overrides(user_id, permission_id, unit_id) WHERE unit_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uidx_upo_global ON user_permission_overrides(user_id, permission_id) WHERE unit_id IS NULL;

-- 7. Attendance Module
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id INT NOT NULL REFERENCES units(id),
    session_date DATE NOT NULL,
    session_title VARCHAR(150),
    recorded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_attendance_unit_date UNIQUE(unit_id, session_date)
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'excused', 'late', 'unselected')),
    notes VARCHAR(255),
    CONSTRAINT uq_attendance_session_member UNIQUE(session_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_member ON attendance_records(member_id);

-- 8. Equipment & Material Inventory
CREATE TABLE IF NOT EXISTS equipment_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES equipment_categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    sku VARCHAR(50) UNIQUE,
    total_quantity INT NOT NULL CHECK (total_quantity >= 0),
    storage_bay VARCHAR(100),
    condition VARCHAR(50) NOT NULL DEFAULT 'good',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    unit_id INT REFERENCES units(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'checked_out', 'returned')),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_booking_date_range CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);

CREATE TABLE IF NOT EXISTS booking_items (
    id BIGSERIAL PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    equipment_id INT NOT NULL REFERENCES equipment(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    returned_quantity INT NOT NULL DEFAULT 0,
    return_condition_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_bi_equipment ON booking_items(equipment_id);

-- 9. Media Queue & Team Archives
CREATE TABLE IF NOT EXISTS media_upload_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_by UUID NOT NULL REFERENCES users(id),
    unit_id INT REFERENCES units(id),
    local_buffer_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    target_drive_folder_id VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'uploading', 'synced', 'failed')),
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT,
    drive_file_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_upload_queue_status ON media_upload_queue(status);

CREATE TABLE IF NOT EXISTS media_albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id INT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    year INT NOT NULL,
    event_name VARCHAR(150) NOT NULL,
    event_name_ar VARCHAR(150) NOT NULL,
    cover_image_url TEXT,
    drive_folder_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_albums_unit_year ON media_albums(unit_id, year);

CREATE TABLE IF NOT EXISTS media_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    album_id UUID REFERENCES media_albums(id) ON DELETE CASCADE,
    unit_id INT NOT NULL REFERENCES units(id),
    year INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    title_ar VARCHAR(200),
    title_en VARCHAR(200),
    media_type VARCHAR(20) NOT NULL DEFAULT 'image',
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    drive_file_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mitems_album ON media_items(album_id);

-- 10. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    unit_id INT REFERENCES units(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,
    title_ar VARCHAR(200) NOT NULL,
    title_en VARCHAR(200) NOT NULL,
    description_ar TEXT NOT NULL,
    description_en TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_unit ON audit_logs(unit_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action_type);
