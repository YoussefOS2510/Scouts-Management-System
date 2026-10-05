-- ==========================================================
-- Scout Organization Management Platform - Microsoft SQL Server Schema
-- Compatible with Microsoft SQL Server 2019 / 2022 / 2025
-- Collation: Arabic_100_CI_AS (or default Arabic Unicode)
-- ==========================================================

USE ScoutsDB;
GO

-- 1. Units (12 organizational units)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'units')
BEGIN
    CREATE TABLE units (
        id INT IDENTITY(1,1) PRIMARY KEY,
        code NVARCHAR(50) NOT NULL CONSTRAINT UQ_units_code UNIQUE,
        name_ar NVARCHAR(100) NOT NULL,
        name_en NVARCHAR(100) NOT NULL,
        stage_group NVARCHAR(50) NOT NULL,
        gender NVARCHAR(10) NOT NULL CONSTRAINT CHK_units_gender CHECK (gender IN ('boys', 'girls', 'mixed')),
        is_leadership BIT NOT NULL CONSTRAINT DF_units_is_leadership DEFAULT 0,
        target_grade NVARCHAR(100),
        created_at DATETIME2 NOT NULL CONSTRAINT DF_units_created_at DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 2. Patrols (طلائع / سداسيات / رهوط)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'patrols')
BEGIN
    CREATE TABLE patrols (
        id INT IDENTITY(1,1) PRIMARY KEY,
        unit_id INT NOT NULL CONSTRAINT FK_patrols_unit REFERENCES units(id) ON DELETE CASCADE,
        name_ar NVARCHAR(100) NOT NULL,
        name_en NVARCHAR(100),
        created_at DATETIME2 NOT NULL CONSTRAINT DF_patrols_created_at DEFAULT SYSUTCDATETIME()
    );
END
GO

-- 3. Members (Youth Scouts & Members)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'members')
BEGIN
    CREATE TABLE members (
        id UNIQUEIDENTIFIER PRIMARY KEY CONSTRAINT DF_members_id DEFAULT NEWID(),
        member_code NVARCHAR(50) NOT NULL CONSTRAINT UQ_members_code UNIQUE,
        pin_hash NVARCHAR(255) NOT NULL CONSTRAINT DF_members_pin DEFAULT '1234',
        unit_id INT NOT NULL CONSTRAINT FK_members_unit REFERENCES units(id),
        patrol_id INT CONSTRAINT FK_members_patrol REFERENCES patrols(id) ON DELETE NO ACTION,
        full_name_ar NVARCHAR(255) NOT NULL,
        full_name_en NVARCHAR(255),
        date_of_birth DATE NOT NULL,
        member_phone NVARCHAR(20),
        father_phone NVARCHAR(20) NOT NULL,
        mother_phone NVARCHAR(20),
        address_ar NVARCHAR(MAX) NOT NULL,
        address_en NVARCHAR(MAX),
        school_or_college NVARCHAR(200),
        academic_year NVARCHAR(100) NOT NULL,
        sunday_school_class NVARCHAR(150),
        father_of_confession NVARCHAR(150),
        notes NVARCHAR(MAX),
        is_active BIT NOT NULL CONSTRAINT DF_members_active DEFAULT 1,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_members_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_members_updated_at DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX idx_members_code ON members(member_code);
    CREATE NONCLUSTERED INDEX idx_members_unit ON members(unit_id);
    CREATE NONCLUSTERED INDEX idx_members_patrol ON members(patrol_id);
END
GO

-- 4. Member Unit Progression History (Multi-Year Team Progression e.g. Ashbal 2024 -> Kashafa 2026)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'member_unit_history')
BEGIN
    CREATE TABLE member_unit_history (
        id INT IDENTITY(1,1) PRIMARY KEY,
        member_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_history_member REFERENCES members(id) ON DELETE CASCADE,
        unit_id INT NOT NULL CONSTRAINT FK_history_unit REFERENCES units(id) ON DELETE NO ACTION,
        patrol_id INT CONSTRAINT FK_history_patrol REFERENCES patrols(id) ON DELETE NO ACTION,
        year INT NOT NULL,
        notes NVARCHAR(MAX),
        created_at DATETIME2 NOT NULL CONSTRAINT DF_history_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_member_unit_year UNIQUE(member_id, unit_id, year)
    );

    CREATE NONCLUSTERED INDEX idx_history_member_year ON member_unit_history(member_id, year);
END
GO

-- 5. Users (Adult Leaders & Staff)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id UNIQUEIDENTIFIER PRIMARY KEY CONSTRAINT DF_users_id DEFAULT NEWID(),
        email NVARCHAR(255) NOT NULL CONSTRAINT UQ_users_email UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        full_name NVARCHAR(150) NOT NULL,
        phone NVARCHAR(20),
        is_active BIT NOT NULL CONSTRAINT DF_users_active DEFAULT 1,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_users_created_at DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX idx_users_email ON users(email);
END
GO

-- 6. Core RBAC: Roles & Permissions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'roles')
BEGIN
    CREATE TABLE roles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(50) NOT NULL CONSTRAINT UQ_roles_name UNIQUE,
        description NVARCHAR(MAX)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'permissions')
BEGIN
    CREATE TABLE permissions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        [key] NVARCHAR(80) NOT NULL CONSTRAINT UQ_permissions_key UNIQUE,
        category NVARCHAR(50) NOT NULL,
        description_en NVARCHAR(200) NOT NULL,
        description_ar NVARCHAR(200) NOT NULL
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'role_permissions')
BEGIN
    CREATE TABLE role_permissions (
        role_id INT NOT NULL CONSTRAINT FK_rp_role REFERENCES roles(id) ON DELETE CASCADE,
        permission_id INT NOT NULL CONSTRAINT FK_rp_permission REFERENCES permissions(id) ON DELETE CASCADE,
        CONSTRAINT PK_role_permissions PRIMARY KEY (role_id, permission_id)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_roles')
BEGIN
    CREATE TABLE user_roles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_ur_user REFERENCES users(id) ON DELETE CASCADE,
        role_id INT NOT NULL CONSTRAINT FK_ur_role REFERENCES roles(id) ON DELETE CASCADE,
        unit_id INT CONSTRAINT FK_ur_unit REFERENCES units(id) ON DELETE NO ACTION,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_ur_created_at DEFAULT SYSUTCDATETIME()
    );

    -- Unique filtered indexes to properly handle NULL unit_id in SQL Server
    CREATE UNIQUE NONCLUSTERED INDEX uidx_user_roles_scoped ON user_roles(user_id, role_id, unit_id) WHERE unit_id IS NOT NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uidx_user_roles_global ON user_roles(user_id, role_id) WHERE unit_id IS NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_permission_overrides')
BEGIN
    CREATE TABLE user_permission_overrides (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_upo_user REFERENCES users(id) ON DELETE CASCADE,
        permission_id INT NOT NULL CONSTRAINT FK_upo_permission REFERENCES permissions(id) ON DELETE CASCADE,
        unit_id INT CONSTRAINT FK_upo_unit REFERENCES units(id) ON DELETE NO ACTION,
        is_granted BIT NOT NULL,
        granted_by UNIQUEIDENTIFIER CONSTRAINT FK_upo_granted_by REFERENCES users(id) ON DELETE NO ACTION,
        updated_at DATETIME2 NOT NULL CONSTRAINT DF_upo_updated_at DEFAULT SYSUTCDATETIME()
    );

    CREATE UNIQUE NONCLUSTERED INDEX uidx_upo_scoped ON user_permission_overrides(user_id, permission_id, unit_id) WHERE unit_id IS NOT NULL;
    CREATE UNIQUE NONCLUSTERED INDEX uidx_upo_global ON user_permission_overrides(user_id, permission_id) WHERE unit_id IS NULL;
END
GO

-- 7. Attendance Module
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'attendance_sessions')
BEGIN
    CREATE TABLE attendance_sessions (
        id UNIQUEIDENTIFIER PRIMARY KEY CONSTRAINT DF_att_session_id DEFAULT NEWID(),
        unit_id INT NOT NULL CONSTRAINT FK_att_session_unit REFERENCES units(id) ON DELETE NO ACTION,
        session_date DATE NOT NULL,
        session_title NVARCHAR(150),
        recorded_by UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_att_session_recorded_by REFERENCES users(id) ON DELETE NO ACTION,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_att_session_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_attendance_unit_date UNIQUE(unit_id, session_date)
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'attendance_records')
BEGIN
    CREATE TABLE attendance_records (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        session_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_att_rec_session REFERENCES attendance_sessions(id) ON DELETE CASCADE,
        member_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_att_rec_member REFERENCES members(id) ON DELETE NO ACTION,
        status NVARCHAR(20) NOT NULL CONSTRAINT CHK_att_status CHECK (status IN ('present', 'absent', 'excused', 'late', 'unselected')),
        notes NVARCHAR(255),
        CONSTRAINT UQ_attendance_session_member UNIQUE(session_id, member_id)
    );

    CREATE NONCLUSTERED INDEX idx_attendance_records_session ON attendance_records(session_id);
    CREATE NONCLUSTERED INDEX idx_attendance_records_member ON attendance_records(member_id);
END
GO

-- 8. Equipment & Material Inventory
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'equipment_categories')
BEGIN
    CREATE TABLE equipment_categories (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL CONSTRAINT UQ_equip_cat_name UNIQUE
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'equipment')
BEGIN
    CREATE TABLE equipment (
        id INT IDENTITY(1,1) PRIMARY KEY,
        category_id INT CONSTRAINT FK_equip_category REFERENCES equipment_categories(id) ON DELETE NO ACTION,
        name NVARCHAR(150) NOT NULL,
        sku NVARCHAR(50) CONSTRAINT UQ_equip_sku UNIQUE,
        total_quantity INT NOT NULL CONSTRAINT CHK_equip_qty CHECK (total_quantity >= 0),
        storage_bay NVARCHAR(100),
        condition NVARCHAR(50) NOT NULL CONSTRAINT DF_equip_condition DEFAULT 'good',
        created_at DATETIME2 NOT NULL CONSTRAINT DF_equip_created_at DEFAULT SYSUTCDATETIME()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'bookings')
BEGIN
    CREATE TABLE bookings (
        id UNIQUEIDENTIFIER PRIMARY KEY CONSTRAINT DF_booking_id DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_booking_user REFERENCES users(id) ON DELETE NO ACTION,
        unit_id INT CONSTRAINT FK_booking_unit REFERENCES units(id) ON DELETE NO ACTION,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        purpose NVARCHAR(255) NOT NULL,
        status NVARCHAR(30) NOT NULL CONSTRAINT DF_booking_status DEFAULT 'pending' CONSTRAINT CHK_booking_status CHECK (status IN ('pending', 'approved', 'rejected', 'checked_out', 'returned')),
        approved_by UNIQUEIDENTIFIER CONSTRAINT FK_booking_approved_by REFERENCES users(id) ON DELETE NO ACTION,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_booking_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CHK_booking_date_range CHECK (end_date >= start_date)
    );

    CREATE NONCLUSTERED INDEX idx_bookings_dates ON bookings(start_date, end_date);
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'booking_items')
BEGIN
    CREATE TABLE booking_items (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        booking_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_bi_booking REFERENCES bookings(id) ON DELETE CASCADE,
        equipment_id INT NOT NULL CONSTRAINT FK_bi_equipment REFERENCES equipment(id) ON DELETE NO ACTION,
        quantity INT NOT NULL CONSTRAINT CHK_bi_quantity CHECK (quantity > 0),
        returned_quantity INT NOT NULL CONSTRAINT DF_bi_ret_qty DEFAULT 0,
        return_condition_notes NVARCHAR(MAX)
    );

    CREATE NONCLUSTERED INDEX idx_bi_equipment ON booking_items(equipment_id);
END
GO

-- 9. Media Queue & Team Archives (Google Drive v3 Ingestion)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'media_upload_queue')
BEGIN
    CREATE TABLE media_upload_queue (
        id UNIQUEIDENTIFIER PRIMARY KEY CONSTRAINT DF_muq_id DEFAULT NEWID(),
        uploaded_by UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_muq_uploader REFERENCES users(id) ON DELETE NO ACTION,
        unit_id INT CONSTRAINT FK_muq_unit REFERENCES units(id) ON DELETE NO ACTION,
        local_buffer_path NVARCHAR(MAX) NOT NULL,
        file_name NVARCHAR(255) NOT NULL,
        mime_type NVARCHAR(100) NOT NULL,
        file_size_bytes BIGINT NOT NULL,
        target_drive_folder_id NVARCHAR(255) NOT NULL,
        status NVARCHAR(30) NOT NULL CONSTRAINT DF_muq_status DEFAULT 'queued' CONSTRAINT CHK_muq_status CHECK (status IN ('queued', 'uploading', 'synced', 'failed')),
        retry_count INT NOT NULL CONSTRAINT DF_muq_retry DEFAULT 0,
        error_message NVARCHAR(MAX),
        drive_file_id NVARCHAR(255),
        created_at DATETIME2 NOT NULL CONSTRAINT DF_muq_created_at DEFAULT SYSUTCDATETIME(),
        synced_at DATETIME2
    );

    CREATE NONCLUSTERED INDEX idx_upload_queue_status ON media_upload_queue(status);
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'media_albums')
BEGIN
    CREATE TABLE media_albums (
        id UNIQUEIDENTIFIER PRIMARY KEY CONSTRAINT DF_album_id DEFAULT NEWID(),
        unit_id INT NOT NULL CONSTRAINT FK_album_unit REFERENCES units(id) ON DELETE CASCADE,
        year INT NOT NULL,
        event_name NVARCHAR(150) NOT NULL,
        event_name_ar NVARCHAR(150) NOT NULL,
        cover_image_url NVARCHAR(MAX),
        drive_folder_id NVARCHAR(255),
        created_at DATETIME2 NOT NULL CONSTRAINT DF_album_created_at DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX idx_albums_unit_year ON media_albums(unit_id, year);
END
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'media_items')
BEGIN
    CREATE TABLE media_items (
        id UNIQUEIDENTIFIER PRIMARY KEY CONSTRAINT DF_mitem_id DEFAULT NEWID(),
        album_id UNIQUEIDENTIFIER CONSTRAINT FK_mitem_album REFERENCES media_albums(id) ON DELETE CASCADE,
        unit_id INT NOT NULL CONSTRAINT FK_mitem_unit REFERENCES units(id) ON DELETE NO ACTION,
        year INT NOT NULL,
        file_name NVARCHAR(255) NOT NULL,
        title_ar NVARCHAR(200),
        title_en NVARCHAR(200),
        media_type NVARCHAR(20) NOT NULL CONSTRAINT DF_mitem_type DEFAULT 'image',
        url NVARCHAR(MAX) NOT NULL,
        thumbnail_url NVARCHAR(MAX),
        drive_file_id NVARCHAR(255),
        created_at DATETIME2 NOT NULL CONSTRAINT DF_mitem_created_at DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX idx_mitems_album ON media_items(album_id);
END
GO

-- 10. Audit Logs
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'audit_logs')
BEGIN
    CREATE TABLE audit_logs (
        id UNIQUEIDENTIFIER PRIMARY KEY CONSTRAINT DF_audit_id DEFAULT NEWID(),
        user_id UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_audit_user REFERENCES users(id) ON DELETE CASCADE,
        unit_id INT CONSTRAINT FK_audit_unit REFERENCES units(id) ON DELETE SET NULL,
        action_type NVARCHAR(50) NOT NULL,
        title_ar NVARCHAR(200) NOT NULL,
        title_en NVARCHAR(200) NOT NULL,
        description_ar NVARCHAR(MAX) NOT NULL,
        description_en NVARCHAR(MAX) NOT NULL,
        metadata NVARCHAR(MAX) CONSTRAINT CHK_audit_json CHECK (metadata IS NULL OR ISJSON(metadata) > 0),
        created_at DATETIME2 NOT NULL CONSTRAINT DF_audit_created_at DEFAULT SYSUTCDATETIME()
    );

    CREATE NONCLUSTERED INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
    CREATE NONCLUSTERED INDEX idx_audit_unit ON audit_logs(unit_id);
    CREATE NONCLUSTERED INDEX idx_audit_action ON audit_logs(action_type);
END
GO
