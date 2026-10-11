-- ==========================================================
-- Scout Organization Management Platform - Clean Baseline Seed Data
-- Database: PostgreSQL 15+ / 16+ (scouts_db)
-- Contains ONLY structural organizational units, roles, permissions,
-- and the initial System Administrator.
-- ZERO dummy members, ZERO dummy bookings, ZERO dummy equipment.
-- ==========================================================

-- 1. Seed Organizational Units (All 12 Official Units)
INSERT INTO units (code, name_ar, name_en, stage_group, gender, is_leadership, target_grade)
VALUES 
    ('cubs_a', 'أشبال A', 'Ashbal A', 'cubs', 'boys', FALSE, 'الصف الخامس الابتدائي (Grade 5)'),
    ('cubs_b', 'أشبال B', 'Ashbal B', 'cubs', 'boys', FALSE, 'الصف السادس الابتدائي (Grade 6)'),
    ('brownies_a', 'زهرات A', 'Zahrat A', 'brownies', 'girls', FALSE, 'الصف الخامس الابتدائي (Grade 5)'),
    ('brownies_b', 'زهرات B', 'Zahrat B', 'brownies', 'girls', FALSE, 'الصف السادس الابتدائي (Grade 6)'),
    ('scouts_a', 'كشافة A', 'Kashafa A', 'scouts', 'boys', FALSE, 'المرحلة الإعدادية - فرقة متوازية A (Prep 1-3)'),
    ('scouts_b', 'كشافة B', 'Kashafa B', 'scouts', 'boys', FALSE, 'المرحلة الإعدادية - فرقة متوازية B (Prep 1-3)'),
    ('guides_a', 'مرشدات A', 'Morshdat A', 'guides', 'girls', FALSE, 'المرحلة الإعدادية - فرقة متوازية A (Prep 1-3)'),
    ('guides_b', 'مرشدات B', 'Morshdat B', 'guides', 'girls', FALSE, 'المرحلة الإعدادية - فرقة متوازية B (Prep 1-3)'),
    ('advanced_scouts', 'متقدم', 'Motakadem', 'advanced_scouts', 'boys', FALSE, 'المرحلة الثانوية (Secondary 1-3)'),
    ('senior_guides', 'رائدات', 'Ra2edat', 'senior_guides', 'girls', FALSE, 'المرحلة الثانوية (Secondary 1-3)'),
    ('rovers', 'جوالة', 'Gawala', 'rovers', 'mixed', FALSE, 'مرحلة التعليم الجامعي وما يعادله'),
    ('leaders', 'قادة', 'Leaders', 'leadership', 'mixed', TRUE, 'مجلس القيادة وهيئة التدريب الكشفي')
ON CONFLICT (code) DO NOTHING;

-- 2. Seed Default Structural Patrols Template
INSERT INTO patrols (unit_id, name_ar, name_en)
SELECT u.id, p.name_ar, p.name_en
FROM units u
CROSS JOIN (VALUES 
    ('سداسي الذئب', 'Wolf Six'),
    ('سداسي الدب', 'Bear Six'),
    ('سداسي الثعلب', 'Fox Six'),
    ('سداسي النمر', 'Tiger Six')
) AS p(name_ar, name_en)
WHERE u.code = 'cubs_a'
ON CONFLICT DO NOTHING;

INSERT INTO patrols (unit_id, name_ar, name_en)
SELECT u.id, p.name_ar, p.name_en
FROM units u
CROSS JOIN (VALUES 
    ('طليعة النسر', 'Eagle Patrol'),
    ('طليعة الأسد', 'Lion Patrol'),
    ('طليعة الفهد', 'Panther Patrol'),
    ('طليعة الصقر', 'Falcon Patrol')
) AS p(name_ar, name_en)
WHERE u.code = 'scouts_a'
ON CONFLICT DO NOTHING;

INSERT INTO patrols (unit_id, name_ar, name_en)
SELECT u.id, p.name_ar, p.name_en
FROM units u
CROSS JOIN (VALUES 
    ('طليعة الزهور', 'Flowers Patrol'),
    ('طليعة الأمل', 'Hope Patrol'),
    ('طليعة المحبة', 'Love Patrol')
) AS p(name_ar, name_en)
WHERE u.code = 'guides_a'
ON CONFLICT DO NOTHING;

-- 3. Seed Base Roles
INSERT INTO roles (name, description) VALUES
    ('admin', 'System Administrator (أدمن النظام) - Full unrestricted global CRUD access, executive statistics, audit logs, and permission overrides'),
    ('group_leader', 'Group Leader (قائد الفوج) - Global view-only access across the entire group, team attendance analytics, executive analytics, and audit logs'),
    ('quartermaster', 'Quartermaster (أمين العهدة) - Manages equipment, approves bookings, logs item condition'),
    ('section_leader', 'Section Leader (قائد وحدة / مرحلة) - Scoped to unit, attendance, members, promotions'),
    ('assistant_leader', 'Assistant Leader (مساعد قائد) - Scoped to unit, attendance marking, contacts viewing'),
    ('media_officer', 'Media Officer (مسؤول الإعلام) - Global media uploads and Drive archive management'),
    ('scout', 'Scout / Kid (كشاف / شبل / عضو) - Youth portal access scoped to personal attendance stats and historical team media')
ON CONFLICT (name) DO NOTHING;

-- 4. Seed Granular Permissions Catalog
INSERT INTO permissions (key, category, description_en, description_ar) VALUES
    ('members.view', 'members', 'View member roster and basic contacts', 'عرض كشف الأعضاء وبيانات الاتصال الأساسية'),
    ('members.create_edit', 'members', 'Add/edit member profiles and church details', 'إضافة وتعديل بيانات الأعضاء وبيانات الكنيسة'),
    ('members.view_confidential', 'members', 'View father of confession, spiritual notes, and medical alerts', 'الاطلاع على أب الاعتراف والملاحظات الروحية والطبية السرية'),
    ('members.promote', 'members', 'Execute annual stage promotions', 'تنفيذ حركة التصعيد السنوي للمراحل'),
    ('attendance.take', 'attendance', 'Mark and submit active attendance sessions', 'تسجيل وحفظ جلسات الحضور والغياب النشطة'),
    ('attendance.edit_history', 'attendance', 'Modify past attendance sessions', 'تعديل سجلات وجلسات الحضور السابقة'),
    ('attendance.export', 'attendance', 'Export attendance rosters to CSV/Excel', 'تصدير كشوف الحضور إلى ملفات إكسيل'),
    ('attendance.analytics', 'attendance', 'View attendance analytics and performance metrics for the team', 'استعراض تحليلات الحضور ومؤشرات الأداء للفرق الكشفية'),
    ('inventory.view', 'inventory', 'View inventory catalog and real-time availability', 'استعراض كتالوج العهدة والأرصدة المتاحة للطلب'),
    ('inventory.book', 'inventory', 'Submit equipment checkout requests', 'تقديم طلبات حجز واستعارة مهمات العهدة'),
    ('inventory.manage', 'inventory', 'Add/delete inventory items and adjust counts', 'إدارة المهمات وتعديل الكميات الإجمالية وحالتها'),
    ('inventory.approve', 'inventory', 'Approve or reject checkout requests', 'الموافقة على أو رفض طلبات حجز واستعارة العهدة'),
    ('media.upload', 'media', 'Upload event photos/videos to the staging queue', 'رفع صور وفيديوهات الفعاليات إلى طابور المعالجة'),
    ('media.view_all', 'media', 'Access organizational Drive archives', 'الوصول إلى كامل أرشيف الوسائط السحابي للفوج'),
    ('users.manage_roles', 'admin', 'Adjust roles, scopes, and custom toggle overrides', 'إدارة أدوار القادة ونطاقات الفرق وتعديل الصلاحيات المخصصة'),
    ('admin.analytics', 'admin', 'Access executive analytics and performance metrics', 'الوصول إلى التحليلات التنفيذية الشاملة للفوج'),
    ('admin.audit_logs', 'admin', 'View and track all actions executed by leaders', 'سجل التدقيق الشامل ومتابعة كافة عمليات القادة بالمنظومة'),
    ('scout.portal.view', 'scout', 'Access the dedicated Scout Space portal', 'الدخول إلى عرين الكشاف واستعراض الملف الشخصي'),
    ('scout.attendance.view_self', 'scout', 'View personal attendance statistics and records', 'الاطلاع على سجل ونسبة الحضور والأوسمة الشخصية'),
    ('scout.media.view_team_history', 'scout', 'Access historical team photo folders matching progression', 'استعراض ألبومات وصور الفرق الكشفية التي انتمى إليها الكشاف عبر السنين')
ON CONFLICT (key) DO NOTHING;

-- 5. Seed Canonical Role-Permission Mappings
-- Admin: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Group Leader: View-only & analytics
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'group_leader'
  AND p.key IN ('members.view', 'attendance.export', 'attendance.analytics', 'inventory.view', 'media.view_all', 'admin.analytics', 'admin.audit_logs')
ON CONFLICT DO NOTHING;

-- Quartermaster: Inventory full control
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'quartermaster'
  AND p.key IN ('inventory.view', 'inventory.book', 'inventory.manage', 'inventory.approve')
ON CONFLICT DO NOTHING;

-- Section Leader: Scoped unit management
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'section_leader'
  AND p.key IN ('members.view', 'members.create_edit', 'members.view_confidential', 'members.promote', 'attendance.take', 'attendance.edit_history', 'attendance.export', 'attendance.analytics', 'inventory.view', 'inventory.book', 'media.upload')
ON CONFLICT DO NOTHING;

-- Assistant Leader: Scoped attendance taking & contacts
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'assistant_leader'
  AND p.key IN ('members.view', 'attendance.take', 'attendance.analytics', 'inventory.view', 'inventory.book', 'media.upload')
ON CONFLICT DO NOTHING;

-- Media Officer: Media pipelines & Drive
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'media_officer'
  AND p.key IN ('media.upload', 'media.view_all')
ON CONFLICT DO NOTHING;

-- Scout: Youth portal & personal memories
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'scout'
  AND p.key IN ('scout.portal.view', 'scout.attendance.view_self', 'scout.media.view_team_history')
ON CONFLICT DO NOTHING;

-- 6. Seed Standard Equipment Categories
INSERT INTO equipment_categories (name) VALUES
    ('خيام ومظلات'),
    ('أدوات ومهمات طهي'),
    ('حبال وأخشاب ريادة'),
    ('إنارة ومولدات كهرباء'),
    ('صوتيات وإلكترونيات')
ON CONFLICT (name) DO NOTHING;

-- 7. Seed Initial System Administrator (Single Baseline Admin)
-- Password default: admin123
INSERT INTO users (email, password_hash, full_name, phone, is_active)
VALUES (
    'admin@scouts.org',
    'pbkdf2_sha256$260000$admin123hash',
    'مدير النظام (System Admin)',
    '+201000000000',
    TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Assign System Admin global Super Admin role
INSERT INTO user_roles (user_id, role_id, unit_id)
SELECT u.id, r.id, NULL
FROM users u, roles r
WHERE u.email = 'admin@scouts.org' AND r.name = 'admin'
ON CONFLICT DO NOTHING;
