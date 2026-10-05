-- ==========================================================
-- Scout Organization Management Platform - Clean Baseline Seed Data
-- Database: Microsoft SQL Server (ScoutsDB)
-- Contains ONLY structural organizational units, roles, permissions,
-- and the initial System Administrator.
-- ZERO dummy members, ZERO dummy bookings, ZERO dummy equipment.
-- ==========================================================

USE ScoutsDB;
GO

SET NOCOUNT ON;

-- 1. Seed Organizational Units (All 12 Official Units)
IF NOT EXISTS (SELECT 1 FROM units WHERE code = 'cubs_a')
    INSERT INTO units (code, name_ar, name_en, stage_group, gender, is_leadership, target_grade)
    VALUES ('cubs_a', N'أشبال A', N'Ashbal A', 'cubs', 'boys', 0, N'الصف الخامس الابتدائي (Grade 5)');

IF NOT EXISTS (SELECT 1 FROM units WHERE code = 'cubs_b')
    INSERT INTO units (code, name_ar, name_en, stage_group, gender, is_leadership, target_grade)
    VALUES ('cubs_b', N'أشبال B', N'Ashbal B', 'cubs', 'boys', 0, N'الصف السادس الابتدائي (Grade 6)');

IF NOT EXISTS (SELECT 1 FROM units WHERE code = 'brownies_a')
    INSERT INTO units (code, name_ar, name_en, stage_group, gender, is_leadership, target_grade)
    VALUES ('brownies_a', N'زهرات A', N'Zahrat A', 'brownies', 'girls', 0, N'الصف الخامس الابتدائي (Grade 5)');

IF NOT EXISTS (SELECT 1 FROM units WHERE code = 'brownies_b')
    INSERT INTO units (code, name_ar, name_en, stage_group, gender, is_leadership, target_grade)
    VALUES ('brownies_b', N'زهرات B', N'Zahrat B', 'brownies', 'girls', 0, N'الصف السادس الابتدائي (Grade 6)');

IF NOT EXISTS (SELECT 1 FROM units WHERE code = 'scouts_a')
    INSERT INTO units (code, name_ar, name_en, stage_group, gender, is_leadership, target_grade)
    VALUES ('scouts_a', N'كشافة A', N'Kashafa A', 'scouts', 'boys', 0, N'المرحلة الإعدادية - فرقة متوازية A (Prep 1-3)');

IF NOT EXISTS (SELECT 1 FROM units WHERE code = 'scouts_b')
    INSERT INTO units (code, name_ar, name_en, stage_group, gender, is_leadership, target_grade)
    VALUES ('scouts_b', N'كشافة B', N'Kashafa B', 'scouts', 'boys', 0, N'المرحلة الإعدادية - فرقة متوازية B (Prep 1-3)');

IF NOT EXISTS (SELECT 1 FROM units WHERE code = 'guides_a')
    INSERT INTO units (code, name_ar, name_en, stage_group, gender, is_leadership, target_grade)
    VALUES ('guides_a', N'مرشدات A', N'Morshdat A', 'guides', 'girls', 0, N'المرحلة الإعدادية - فرقة متوازية A (Prep 1-3)');

IF NOT EXISTS (SELECT 1 FROM units WHERE code = 'guides_b')
    INSERT INTO units (code, name_ar, name_en, stage_group, gender, is_leadership, target_grade)
    VALUES ('guides_b', N'مرشدات B', N'Morshdat B', 'guides', 'girls', 0, N'المرحلة الإعدادية - فرقة متوازية B (Prep 1-3)');

IF NOT EXISTS (SELECT 1 FROM units WHERE code = 'advanced_scouts')
    INSERT INTO units (code, name_ar, name_en, stage_group, gender, is_leadership, target_grade)
    VALUES ('advanced_scouts', N'متقدم', N'Motakadem', 'advanced_scouts', 'boys', 0, N'المرحلة الثانوية (Secondary 1-3)');

IF NOT EXISTS (SELECT 1 FROM units WHERE code = 'senior_guides')
    INSERT INTO units (code, name_ar, name_en, stage_group, gender, is_leadership, target_grade)
    VALUES ('senior_guides', N'رائدات', N'Ra2edat', 'senior_guides', 'girls', 0, N'المرحلة الثانوية (Secondary 1-3)');

IF NOT EXISTS (SELECT 1 FROM units WHERE code = 'rovers')
    INSERT INTO units (code, name_ar, name_en, stage_group, gender, is_leadership, target_grade)
    VALUES ('rovers', N'جوالة', N'Gawala', 'rovers', 'mixed', 0, N'مرحلة التعليم الجامعي وما يعادله');

IF NOT EXISTS (SELECT 1 FROM units WHERE code = 'leaders')
    INSERT INTO units (code, name_ar, name_en, stage_group, gender, is_leadership, target_grade)
    VALUES ('leaders', N'قادة', N'Leaders', 'leadership', 'mixed', 1, N'مجلس القيادة وهيئة التدريب الكشفي');
GO

-- 2. Seed Default Structural Patrols Template
DECLARE @cubs_a_id INT = (SELECT id FROM units WHERE code = 'cubs_a');
IF NOT EXISTS (SELECT 1 FROM patrols WHERE unit_id = @cubs_a_id AND name_ar = N'سداسي الذئب')
BEGIN
    INSERT INTO patrols (unit_id, name_ar, name_en) VALUES
        (@cubs_a_id, N'سداسي الذئب', N'Wolf Six'),
        (@cubs_a_id, N'سداسي الدب', N'Bear Six'),
        (@cubs_a_id, N'سداسي الثعلب', N'Fox Six'),
        (@cubs_a_id, N'سداسي النمر', N'Tiger Six');
END

DECLARE @scouts_a_id INT = (SELECT id FROM units WHERE code = 'scouts_a');
IF NOT EXISTS (SELECT 1 FROM patrols WHERE unit_id = @scouts_a_id AND name_ar = N'طليعة النسر')
BEGIN
    INSERT INTO patrols (unit_id, name_ar, name_en) VALUES
        (@scouts_a_id, N'طليعة النسر', N'Eagle Patrol'),
        (@scouts_a_id, N'طليعة الأسد', N'Lion Patrol'),
        (@scouts_a_id, N'طليعة الفهد', N'Panther Patrol'),
        (@scouts_a_id, N'طليعة الصقر', N'Falcon Patrol');
END

DECLARE @guides_a_id INT = (SELECT id FROM units WHERE code = 'guides_a');
IF NOT EXISTS (SELECT 1 FROM patrols WHERE unit_id = @guides_a_id AND name_ar = N'طليعة الزهور')
BEGIN
    INSERT INTO patrols (unit_id, name_ar, name_en) VALUES
        (@guides_a_id, N'طليعة الزهور', N'Flowers Patrol'),
        (@guides_a_id, N'طليعة الأمل', N'Hope Patrol'),
        (@guides_a_id, N'طليعة المحبة', N'Love Patrol');
END
GO

-- 3. Seed Base Roles
IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'admin')
    INSERT INTO roles (name, description) VALUES ('admin', N'System Administrator (أدمن النظام) - Full unrestricted global CRUD access, executive statistics, audit logs, and permission overrides');

IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'group_leader')
    INSERT INTO roles (name, description) VALUES ('group_leader', N'Group Leader (قائد الفوج) - Global view-only access across the entire group, team attendance analytics, executive analytics, and audit logs');

IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'quartermaster')
    INSERT INTO roles (name, description) VALUES ('quartermaster', N'Quartermaster (أمين العهدة) - Manages equipment, approves bookings, logs item condition');

IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'section_leader')
    INSERT INTO roles (name, description) VALUES ('section_leader', N'Section Leader (قائد وحدة / مرحلة) - Scoped to unit, attendance, members, promotions');

IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'assistant_leader')
    INSERT INTO roles (name, description) VALUES ('assistant_leader', N'Assistant Leader (مساعد قائد) - Scoped to unit, attendance marking, contacts viewing');

IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'media_officer')
    INSERT INTO roles (name, description) VALUES ('media_officer', N'Media Officer (مسؤول الإعلام) - Global media uploads and Drive archive management');

IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'scout')
    INSERT INTO roles (name, description) VALUES ('scout', N'Scout / Kid (كشاف / شبل / عضو) - Youth portal access scoped to personal attendance stats and historical team media');
GO

-- 4. Seed Granular Permissions Catalog
DECLARE @perms TABLE ([key] NVARCHAR(80), category NVARCHAR(50), description_en NVARCHAR(200), description_ar NVARCHAR(200));
INSERT INTO @perms VALUES
    ('members.view', 'members', 'View member roster and basic contacts', N'عرض كشف الأعضاء وبيانات الاتصال الأساسية'),
    ('members.create_edit', 'members', 'Add/edit member profiles and church details', N'إضافة وتعديل بيانات الأعضاء وبيانات الكنيسة'),
    ('members.view_confidential', 'members', 'View father of confession, spiritual notes, and medical alerts', N'الاطلاع على أب الاعتراف والملاحظات الروحية والطبية السرية'),
    ('members.promote', 'members', 'Execute annual stage promotions', N'تنفيذ حركة التصعيد السنوي للمراحل'),
    ('attendance.take', 'attendance', 'Mark and submit active attendance sessions', N'تسجيل وحفظ جلسات الحضور والغياب النشطة'),
    ('attendance.edit_history', 'attendance', 'Modify past attendance sessions', N'تعديل سجلات وجلسات الحضور السابقة'),
    ('attendance.export', 'attendance', 'Export attendance rosters to CSV/Excel', N'تصدير كشوف الحضور إلى ملفات إكسيل'),
    ('attendance.analytics', 'attendance', 'View attendance analytics and performance metrics for the team', N'استعراض تحليلات الحضور ومؤشرات الأداء للفرق الكشفية'),
    ('inventory.view', 'inventory', 'View inventory catalog and real-time availability', N'استعراض كتالوج العهدة والأرصدة المتاحة للطلب'),
    ('inventory.book', 'inventory', 'Submit equipment checkout requests', N'تقديم طلبات حجز واستعارة مهمات العهدة'),
    ('inventory.manage', 'inventory', 'Add/delete inventory items and adjust counts', N'إدارة المهمات وتعديل الكميات الإجمالية وحالتها'),
    ('inventory.approve', 'inventory', 'Approve or reject checkout requests', N'الموافقة على أو رفض طلبات حجز واستعارة العهدة'),
    ('media.upload', 'media', 'Upload event photos/videos to the staging queue', N'رفع صور وفيديوهات الفعاليات إلى طابور المعالجة'),
    ('media.view_all', 'media', 'Access organizational Drive archives', N'الوصول إلى كامل أرشيف الوسائط السحابي للفوج'),
    ('users.manage_roles', 'admin', 'Adjust roles, scopes, and custom toggle overrides', N'إدارة أدوار القادة ونطاقات الفرق وتعديل الصلاحيات المخصصة'),
    ('admin.analytics', 'admin', 'Access executive analytics and performance metrics', N'الوصول إلى التحليلات التنفيذية الشاملة للفوج'),
    ('admin.audit_logs', 'admin', 'View and track all actions executed by leaders', N'سجل التدقيق الشامل ومتابعة كافة عمليات القادة بالمنظومة'),
    ('scout.portal.view', 'scout', 'Access the dedicated Scout Space portal', N'الدخول إلى عرين الكشاف واستعراض الملف الشخصي'),
    ('scout.attendance.view_self', 'scout', 'View personal attendance statistics and records', N'الاطلاع على سجل ونسبة الحضور والأوسمة الشخصية'),
    ('scout.media.view_team_history', 'scout', 'Access historical team photo folders matching progression', N'استعراض ألبومات وصور الفرق الكشفية التي انتمى إليها الكشاف عبر السنين');

INSERT INTO permissions ([key], category, description_en, description_ar)
SELECT p.[key], p.category, p.description_en, p.description_ar
FROM @perms p
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE [key] = p.[key]);
GO

-- 5. Seed Canonical Role-Permission Mappings
-- Admin: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
  AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = r.id AND permission_id = p.id);

-- Group Leader: View-only & analytics
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'group_leader'
  AND p.[key] IN ('members.view', 'attendance.export', 'attendance.analytics', 'inventory.view', 'media.view_all', 'admin.analytics', 'admin.audit_logs')
  AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = r.id AND permission_id = p.id);

-- Quartermaster: Inventory full control
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'quartermaster'
  AND p.[key] IN ('inventory.view', 'inventory.book', 'inventory.manage', 'inventory.approve')
  AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = r.id AND permission_id = p.id);

-- Section Leader: Scoped unit management
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'section_leader'
  AND p.[key] IN ('members.view', 'members.create_edit', 'members.view_confidential', 'members.promote', 'attendance.take', 'attendance.edit_history', 'attendance.export', 'attendance.analytics', 'inventory.view', 'inventory.book', 'media.upload')
  AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = r.id AND permission_id = p.id);

-- Assistant Leader: Scoped attendance taking & contacts
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'assistant_leader'
  AND p.[key] IN ('members.view', 'attendance.take', 'attendance.analytics', 'inventory.view', 'inventory.book', 'media.upload')
  AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = r.id AND permission_id = p.id);

-- Media Officer: Media pipelines & Drive
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'media_officer'
  AND p.[key] IN ('media.upload', 'media.view_all')
  AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = r.id AND permission_id = p.id);

-- Scout: Youth portal & personal memories
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'scout'
  AND p.[key] IN ('scout.portal.view', 'scout.attendance.view_self', 'scout.media.view_team_history')
  AND NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = r.id AND permission_id = p.id);
GO

-- 6. Seed Standard Equipment Categories
DECLARE @cats TABLE (name NVARCHAR(100));
INSERT INTO @cats VALUES
    (N'خيام ومظلات'),
    (N'أدوات ومهمات طهي'),
    (N'حبال وأخشاب ريادة'),
    (N'إنارة ومولدات كهرباء'),
    (N'صوتيات وإلكترونيات');

INSERT INTO equipment_categories (name)
SELECT c.name FROM @cats c
WHERE NOT EXISTS (SELECT 1 FROM equipment_categories WHERE name = c.name);
GO

-- 7. Seed Initial System Administrator (Single Baseline Admin)
-- Password default: admin123 (hashed)
DECLARE @admin_email NVARCHAR(255) = 'admin@scouts.org';
IF NOT EXISTS (SELECT 1 FROM users WHERE email = @admin_email)
BEGIN
    INSERT INTO users (id, email, password_hash, full_name, phone, is_active)
    VALUES (
        NEWID(),
        @admin_email,
        'pbkdf2_sha256$260000$admin123hash',
        N'مدير النظام (System Admin)',
        '+201000000000',
        1
    );
END

-- Assign System Admin global Super Admin role
DECLARE @admin_user_id UNIQUEIDENTIFIER = (SELECT id FROM users WHERE email = @admin_email);
DECLARE @admin_role_id INT = (SELECT id FROM roles WHERE name = 'admin');

IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = @admin_user_id AND role_id = @admin_role_id)
BEGIN
    INSERT INTO user_roles (user_id, role_id, unit_id)
    VALUES (@admin_user_id, @admin_role_id, NULL);
END
GO

PRINT 'Clean Microsoft SQL Server baseline seed completed successfully! Zero dummy data.';
GO
