-- ==========================================================
-- Scout Organization Management Platform - Seed Data
-- ==========================================================

-- 1. Insert 12 Organizational Units
INSERT INTO units (code, name_ar, name_en, stage_group, gender, is_leadership, min_age, max_age, target_grade)
VALUES
    ('cubs_a', 'أشبال A', 'Ashbal A', 'cubs', 'boys', FALSE, 10, 11, 'Grade 5'),
    ('cubs_b', 'أشبال B', 'Ashbal B', 'cubs', 'boys', FALSE, 11, 12, 'Grade 6'),
    ('brownies_a', 'زهرات A', 'Zahrat A', 'brownies', 'girls', FALSE, 10, 11, 'Grade 5'),
    ('brownies_b', 'زهرات B', 'Zahrat B', 'brownies', 'girls', FALSE, 11, 12, 'Grade 6'),
    ('scouts_a', 'كشافة A', 'Kashafa A', 'scouts', 'boys', FALSE, 12, 15, 'Prep 1–3 Parallel Troop A'),
    ('scouts_b', 'كشافة B', 'Kashafa B', 'scouts', 'boys', FALSE, 12, 15, 'Prep 1–3 Parallel Troop B'),
    ('guides_a', 'مرشدات A', 'Morshdat A', 'guides', 'girls', FALSE, 12, 15, 'Prep 1–3 Parallel Company A'),
    ('guides_b', 'مرشدات B', 'Morshdat B', 'guides', 'girls', FALSE, 12, 15, 'Prep 1–3 Parallel Company B'),
    ('advanced_scouts', 'متقدم', 'Motakadem', 'advanced_scouts', 'boys', FALSE, 15, 18, 'Secondary 1–3'),
    ('senior_guides', 'رائدات', 'Ra2edat', 'senior_guides', 'girls', FALSE, 15, 18, 'Secondary 1–3'),
    ('rovers', 'جوالة', 'Gawala', 'rovers', 'mixed', FALSE, 18, 23, 'University / Higher Ed'),
    ('leaders', 'قادة', 'Leaders', 'leadership', 'mixed', TRUE, 21, 99, 'Leadership & Adult Staff')
ON CONFLICT (code) DO UPDATE SET
    name_ar = EXCLUDED.name_ar,
    name_en = EXCLUDED.name_en;

-- 2. Insert 5 Base Roles
INSERT INTO roles (name, description)
VALUES
    ('group_leader', 'Group Leader (قائد الفوج) - Global unrestricted CRUD access'),
    ('quartermaster', 'Quartermaster (أمين العهدة) - Manages equipment, approves bookings, logs item condition'),
    ('section_leader', 'Section Leader (قائد وحدة / مرحلة) - Scoped to specific unit, attendance, members, promotions'),
    ('assistant_leader', 'Assistant Leader (مساعد قائد) - Scoped to unit, attendance marking, contacts viewing'),
    ('media_officer', 'Media Officer (مسؤول الإعلام) - Media uploads and Drive archive management')
ON CONFLICT (name) DO NOTHING;

-- 3. Insert 13 Granular Permissions
INSERT INTO permissions (key, category, description_en, description_ar)
VALUES
    ('members.view', 'members', 'View member roster and basic contacts', 'عرض قائمة الأعضاء وبيانات الاتصال الأساسية'),
    ('members.create_edit', 'members', 'Add/edit member profiles and church details', 'إضافة وتعديل بيانات الأعضاء وبيانات الكنيسة'),
    ('members.view_confidential', 'members', 'View father of confession, spiritual notes, and medical alerts', 'الاطلاع على أب الاعتراف والملاحظات الروحية والطبية'),
    ('members.promote', 'members', 'Execute annual stage promotions', 'تنفيذ حركة التصعيد السنوي للمراحل'),
    ('attendance.take', 'attendance', 'Mark and submit active attendance sessions', 'تسجيل وحفظ جلسات الحضور والغياب النشطة'),
    ('attendance.edit_history', 'attendance', 'Modify past attendance sessions', 'تعديل سجلات وجلسات الحضور السابقة'),
    ('attendance.export', 'attendance', 'Export attendance rosters to CSV/Excel', 'تصدير كشوف الحضور إلى ملفات إكسيل'),
    ('inventory.view', 'inventory', 'View inventory catalog and real-time availability', 'استعراض كتالوج العهدة والأرصدة المتاحة'),
    ('inventory.book', 'inventory', 'Submit equipment checkout requests', 'تقديم طلبات حجز واستعارة مهمات العهدة'),
    ('inventory.manage', 'inventory', 'Add/delete inventory items and adjust counts', 'إدارة المهمات وتعديل الكميات الإجمالية وحالتها'),
    ('inventory.approve', 'inventory', 'Approve or reject checkout requests', 'الموافقة على أو رفض طلبات حجز العهدة'),
    ('media.upload', 'media', 'Upload event photos/videos to the staging queue', 'رفع صور وفيديوهات الفعاليات إلى طابور المعالجة'),
    ('media.view_all', 'media', 'Access organizational Drive archives', 'استعراض كامل أرشيف الوسائط وجوجل درايف'),
    ('users.manage_roles', 'admin', 'Adjust roles, scopes, and custom toggle overrides', 'إدارة وتعيين الأدوار والصلاحيات المخصصة للقادة'),
    ('admin.analytics', 'admin', 'Access executive analytics and performance metrics', 'الوصول إلى لوحة التحليلات المتقدمة وإحصائيات الفوج'),
    ('admin.audit_logs', 'admin', 'View and track all actions executed by leaders', 'استعراض وتتبع سجل عمليات وتصرفات القادة'),
    ('attendance.analytics', 'attendance', 'View attendance analytics and performance metrics for the team', 'الاطلاع على إحصائيات وتحليلات الحضور للوحدة')
ON CONFLICT (key) DO NOTHING;

-- 4. Map Default Permissions to Base Roles
-- Group Leader gets all permissions (including admin.analytics, admin.audit_logs, attendance.analytics)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'group_leader'
ON CONFLICT DO NOTHING;

-- Quartermaster: inventory manage, approve, view, book
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'quartermaster'
  AND p.key IN ('inventory.view', 'inventory.manage', 'inventory.approve', 'inventory.book')
ON CONFLICT DO NOTHING;

-- Section Leader: members view, create_edit, view_confidential, promote; attendance take, edit_history, export, analytics; inventory book, view; media upload
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'section_leader'
  AND p.key IN (
    'members.view', 'members.create_edit', 'members.view_confidential', 'members.promote',
    'attendance.take', 'attendance.edit_history', 'attendance.export', 'attendance.analytics',
    'inventory.view', 'inventory.book',
    'media.upload'
  )
ON CONFLICT DO NOTHING;

-- Assistant Leader: members view; attendance take, analytics; inventory view, book; media upload
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'assistant_leader'
  AND p.key IN (
    'members.view',
    'attendance.take', 'attendance.analytics',
    'inventory.view', 'inventory.book',
    'media.upload'
  )
ON CONFLICT DO NOTHING;

-- Media Officer: media upload, media view_all
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'media_officer'
  AND p.key IN ('media.upload', 'media.view_all')
ON CONFLICT DO NOTHING;

-- 5. Seed Equipment Categories & Items
INSERT INTO equipment_categories (name)
VALUES
    ('Tents & Shelter (خيام وإيواء)'),
    ('Cooking & Kitchen (مهمات طهي ومطبخ)'),
    ('Pioneering & Ropes (حبال ومشاريع ريادية)'),
    ('Lighting & Electrical (إنارة وكهرباء)'),
    ('Sound & AV (صوتيات وإذاعة)')
ON CONFLICT (name) DO NOTHING;

INSERT INTO equipment (category_id, name, sku, total_quantity, storage_bay, condition)
VALUES
    (1, 'Tent 4-Person Heavy Duty (خيمة 4 أفراد)', 'TNT-001', 25, 'Bay A-1', 'good'),
    (1, 'Marquee Mess Tent 20x10m (صيوان طعام)', 'TNT-002', 3, 'Bay A-2', 'good'),
    (2, 'Propane Camp Stove 2-Burner (موقد غاز)', 'CKG-001', 10, 'Bay B-1', 'good'),
    (2, 'Stainless Cooking Pots 50L (حلل طهي كبيرة)', 'CKG-002', 8, 'Bay B-2', 'good'),
    (3, 'Manila Pioneering Rope 200m (حبل مانيلا ريادة)', 'ROP-001', 15, 'Bay C-1', 'good'),
    (3, 'Carabiners & Pulleys Set (أطقم شناكل وبكرات)', 'ROP-002', 20, 'Bay C-2', 'new'),
    (4, 'LED Floodlight 100W with Stand (كشاف ليد ستاند)', 'LGT-001', 12, 'Bay D-1', 'good'),
    (4, 'Heavy Duty Extension Reel 50m (بكرة سلك)', 'LGT-002', 10, 'Bay D-2', 'good'),
    (5, 'Portable PA System 200W + 2 Mics (سماعة متحركة)', 'SND-001', 4, 'Bay E-1', 'good')
ON CONFLICT (sku) DO NOTHING;

-- 6. Seed Patrols & Sixes Across All Units
-- Cubs A (أشبال A)
INSERT INTO patrols (unit_id, name_ar, name_en)
SELECT u.id, p.name_ar, p.name_en FROM units u
CROSS JOIN (VALUES ('سداسي الذئب', 'Wolf Six'), ('سداسي النمر', 'Tiger Six')) AS p(name_ar, name_en)
WHERE u.code = 'cubs_a' ON CONFLICT DO NOTHING;

-- Cubs B (أشبال B)
INSERT INTO patrols (unit_id, name_ar, name_en)
SELECT u.id, p.name_ar, p.name_en FROM units u
CROSS JOIN (VALUES ('سداسي الثعلب', 'Fox Six'), ('سداسي الدب', 'Bear Six')) AS p(name_ar, name_en)
WHERE u.code = 'cubs_b' ON CONFLICT DO NOTHING;

-- Brownies A (زهرات A)
INSERT INTO patrols (unit_id, name_ar, name_en)
SELECT u.id, p.name_ar, p.name_en FROM units u
CROSS JOIN (VALUES ('سداسي الياسمين', 'Jasmine Six'), ('سداسي البنفسج', 'Violet Six')) AS p(name_ar, name_en)
WHERE u.code = 'brownies_a' ON CONFLICT DO NOTHING;

-- Brownies B (زهرات B)
INSERT INTO patrols (unit_id, name_ar, name_en)
SELECT u.id, p.name_ar, p.name_en FROM units u
CROSS JOIN (VALUES ('سداسي التيوليب', 'Tulip Six'), ('سداسي الجوري', 'Damask Rose Six')) AS p(name_ar, name_en)
WHERE u.code = 'brownies_b' ON CONFLICT DO NOTHING;

-- Scouts A (كشافة A)
INSERT INTO patrols (unit_id, name_ar, name_en)
SELECT u.id, p.name_ar, p.name_en FROM units u
CROSS JOIN (VALUES
    ('طليعة النسر', 'Eagle Patrol'),
    ('طليعة الأسد', 'Lion Patrol'),
    ('طليعة الفهد', 'Panther Patrol'),
    ('طليعة الصقر', 'Falcon Patrol')
) AS p(name_ar, name_en)
WHERE u.code = 'scouts_a' ON CONFLICT DO NOTHING;

-- Scouts B (كشافة B)
INSERT INTO patrols (unit_id, name_ar, name_en)
SELECT u.id, p.name_ar, p.name_en FROM units u
CROSS JOIN (VALUES
    ('طليعة الشاهين', 'Peregrine Patrol'),
    ('طليعة الذئب', 'Wolf Patrol'),
    ('طليعة العقاب', 'Eagle Hawk Patrol')
) AS p(name_ar, name_en)
WHERE u.code = 'scouts_b' ON CONFLICT DO NOTHING;

-- Guides A (مرشدات A)
INSERT INTO patrols (unit_id, name_ar, name_en)
SELECT u.id, p.name_ar, p.name_en FROM units u
CROSS JOIN (VALUES
    ('طليعة الزهور', 'Flowers Patrol'),
    ('طليعة الأمل', 'Hope Patrol'),
    ('طليعة المحبة', 'Love Patrol')
) AS p(name_ar, name_en)
WHERE u.code = 'guides_a' ON CONFLICT DO NOTHING;

-- Guides B (مرشدات B)
INSERT INTO patrols (unit_id, name_ar, name_en)
SELECT u.id, p.name_ar, p.name_en FROM units u
CROSS JOIN (VALUES
    ('طليعة السلام', 'Peace Patrol'),
    ('طليعة العطاء', 'Giving Patrol')
) AS p(name_ar, name_en)
WHERE u.code = 'guides_b' ON CONFLICT DO NOTHING;

-- Advanced Scouts (متقدم)
INSERT INTO patrols (unit_id, name_ar, name_en)
SELECT u.id, p.name_ar, p.name_en FROM units u
CROSS JOIN (VALUES
    ('طليعة الفرسان', 'Knights Patrol'),
    ('طليعة الرواد', 'Pioneers Patrol'),
    ('طليعة الشجعان', 'Braves Patrol')
) AS p(name_ar, name_en)
WHERE u.code = 'advanced_scouts' ON CONFLICT DO NOTHING;

-- Senior Guides (رائدات)
INSERT INTO patrols (unit_id, name_ar, name_en)
SELECT u.id, p.name_ar, p.name_en FROM units u
CROSS JOIN (VALUES
    ('طليعة النور', 'Light Patrol'),
    ('طليعة الفجر', 'Dawn Patrol')
) AS p(name_ar, name_en)
WHERE u.code = 'senior_guides' ON CONFLICT DO NOTHING;

-- Rovers (جوالة)
INSERT INTO patrols (unit_id, name_ar, name_en)
SELECT u.id, p.name_ar, p.name_en FROM units u
CROSS JOIN (VALUES
    ('رهط النجاح', 'Success Crew'),
    ('رهط العزيمة', 'Determination Crew')
) AS p(name_ar, name_en)
WHERE u.code = 'rovers' ON CONFLICT DO NOTHING;

-- 7. Seed System Users (Leaders)
INSERT INTO users (id, email, password_hash, full_name, phone, is_active)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@scouts.org', crypt('admin123', gen_salt('bf')), 'القائد بيتر شكري (Peter Shoukry)', '+201201234567', TRUE),
    ('00000000-0000-0000-0000-000000000002', 'quartermaster@scouts.org', crypt('admin123', gen_salt('bf')), 'القائد إيهاب فوزي (Ihab Fawzy)', '+201209876543', TRUE),
    ('00000000-0000-0000-0000-000000000003', 'scouts_a_leader@scouts.org', crypt('admin123', gen_salt('bf')), 'القائد مارك وجدي (Mark Wagdy)', '+201207766554', TRUE),
    ('00000000-0000-0000-0000-000000000004', 'scouts_a_asst@scouts.org', crypt('admin123', gen_salt('bf')), 'القائد أندرو نبيل (Andrew Nabil)', '+201205544332', TRUE),
    ('00000000-0000-0000-0000-000000000005', 'media@scouts.org', crypt('admin123', gen_salt('bf')), 'القائدة مريم سامح (Mariam Sameh)', '+201201122334', TRUE),
    ('00000000-0000-0000-0000-000000000006', 'zahrat_leader@scouts.org', crypt('admin123', gen_salt('bf')), 'القائدة سارة مينا (Sarah Mina)', '+201208899001', TRUE),
    ('00000000-0000-0000-0000-000000000007', 'ashbal_leader@scouts.org', crypt('admin123', gen_salt('bf')), 'القائد فادي جورج (Fady George)', '+201203344556', TRUE)
ON CONFLICT (email) DO NOTHING;

-- 8. Seed User Role Assignments & Unit Scopes (Admin Team Assignments)
-- Peter Shoukry: Super Admin (Global scope)
INSERT INTO user_roles (user_id, role_id, unit_id)
SELECT u.id, r.id, NULL
FROM users u, roles r
WHERE u.email = 'admin@scouts.org' AND r.name = 'group_leader'
ON CONFLICT DO NOTHING;

-- Ihab Fawzy: Quartermaster (Global inventory)
INSERT INTO user_roles (user_id, role_id, unit_id)
SELECT u.id, r.id, NULL
FROM users u, roles r
WHERE u.email = 'quartermaster@scouts.org' AND r.name = 'quartermaster'
ON CONFLICT DO NOTHING;

-- Mark Wagdy: Section Leader assigned to Kashafa A (scouts_a)
INSERT INTO user_roles (user_id, role_id, unit_id)
SELECT u.id, r.id, un.id
FROM users u, roles r, units un
WHERE u.email = 'scouts_a_leader@scouts.org' AND r.name = 'section_leader' AND un.code = 'scouts_a'
ON CONFLICT DO NOTHING;

-- Andrew Nabil: Assistant Leader assigned to Kashafa A (scouts_a)
INSERT INTO user_roles (user_id, role_id, unit_id)
SELECT u.id, r.id, un.id
FROM users u, roles r, units un
WHERE u.email = 'scouts_a_asst@scouts.org' AND r.name = 'assistant_leader' AND un.code = 'scouts_a'
ON CONFLICT DO NOTHING;

-- Mariam Sameh: Media Officer (Global media)
INSERT INTO user_roles (user_id, role_id, unit_id)
SELECT u.id, r.id, NULL
FROM users u, roles r
WHERE u.email = 'media@scouts.org' AND r.name = 'media_officer'
ON CONFLICT DO NOTHING;

-- Sarah Mina: Section Leader assigned to Zahrat A (brownies_a)
INSERT INTO user_roles (user_id, role_id, unit_id)
SELECT u.id, r.id, un.id
FROM users u, roles r, units un
WHERE u.email = 'zahrat_leader@scouts.org' AND r.name = 'section_leader' AND un.code = 'brownies_a'
ON CONFLICT DO NOTHING;

-- Fady George: Section Leader assigned to Ashbal A (cubs_a)
INSERT INTO user_roles (user_id, role_id, unit_id)
SELECT u.id, r.id, un.id
FROM users u, roles r, units un
WHERE u.email = 'ashbal_leader@scouts.org' AND r.name = 'section_leader' AND un.code = 'cubs_a'
ON CONFLICT DO NOTHING;

-- 9. Seed Custom Permission Overrides (Demonstrating Granular Policy Engine)
-- Andrew Nabil: Granted attendance.export override for scouts_a
INSERT INTO user_permission_overrides (user_id, permission_id, unit_id, is_granted)
SELECT u.id, p.id, un.id, TRUE
FROM users u, permissions p, units un
WHERE u.email = 'scouts_a_asst@scouts.org' AND p.key = 'attendance.export' AND un.code = 'scouts_a'
ON CONFLICT DO NOTHING;

-- Andrew Nabil: Revoked inventory.book override for scouts_a
INSERT INTO user_permission_overrides (user_id, permission_id, unit_id, is_granted)
SELECT u.id, p.id, un.id, FALSE
FROM users u, permissions p, units un
WHERE u.email = 'scouts_a_asst@scouts.org' AND p.key = 'inventory.book' AND un.code = 'scouts_a'
ON CONFLICT DO NOTHING;

-- 10. Seed Sample Members for Kashafa A with Patrol Distribution
INSERT INTO members (member_code, unit_id, patrol_id, full_name_ar, full_name_en, date_of_birth, member_phone, father_phone, mother_phone, address_ar, school_or_college, academic_year, sunday_school_class, father_of_confession, notes, is_active)
SELECT 
    'SCT-2026-0001', un.id, p.id, 'مينا سمير فايز', 'Mina Samir Fayez', '2012-04-15', '+201011223344', '+201222334455', '+201133445566', '١٢ شارع الجمهورية، مصر الجديدة، القاهرة', 'مدرسة سان جورج للغات', 'Prep 2', 'فصل الشهيد مارجرجس (إعدادي ثاني)', 'القمص متياس خليل', 'حساسية من الفول السوداني، نشط جداً في العقد والربطات', TRUE
FROM units un
JOIN patrols p ON p.unit_id = un.id AND p.name_ar = 'طليعة النسر'
WHERE un.code = 'scouts_a'
ON CONFLICT (member_code) DO NOTHING;

INSERT INTO members (member_code, unit_id, patrol_id, full_name_ar, full_name_en, date_of_birth, member_phone, father_phone, mother_phone, address_ar, school_or_college, academic_year, sunday_school_class, father_of_confession, notes, is_active)
SELECT 
    'SCT-2026-0002', un.id, p.id, 'بيتر هاني يوسف', 'Peter Hany Youssef', '2012-08-20', '+201022334455', '+201233445566', '+201144556677', '٤٥ شارع عثمان بن عفان، مصر الجديدة', 'مدرسة دي لاسال الفرير', 'Prep 2', 'فصل الشهيد مارجرجس (إعدادي ثاني)', 'القمص متياس خليل', 'عازف ترومبيت في فرقة الموسيقى النحاسية للفوج', TRUE
FROM units un
JOIN patrols p ON p.unit_id = un.id AND p.name_ar = 'طليعة الأسد'
WHERE un.code = 'scouts_a'
ON CONFLICT (member_code) DO NOTHING;

INSERT INTO members (member_code, unit_id, patrol_id, full_name_ar, full_name_en, date_of_birth, member_phone, father_phone, mother_phone, address_ar, school_or_college, academic_year, sunday_school_class, father_of_confession, notes, is_active)
SELECT 
    'SCT-2026-0003', un.id, p.id, 'كيرلس جورج أنطون', 'Kirollos George Anton', '2011-11-03', '+201033445566', '+201244556677', '+201155667788', '٨ شارع هارون الرشيد، مصر الجديدة', 'مدرسة البطريركية الفرير', 'Prep 3', 'فصل القديس أبانوب (إعدادي ثالث)', 'القس بولا مكرم', 'متميز في الإسعافات الأولية والشارات الكشفية', TRUE
FROM units un
JOIN patrols p ON p.unit_id = un.id AND p.name_ar = 'طليعة الفهد'
WHERE un.code = 'scouts_a'
ON CONFLICT (member_code) DO NOTHING;

-- 11. Seed Sample Audit Trail Logs
INSERT INTO audit_logs (user_id, unit_id, action_type, title_ar, title_en, description_ar, description_en, metadata)
SELECT 
    u.id, un.id, 'leader_team_assigned', 'تعيين وحدة قيادية', 'Leader Team Scope Assigned',
    'قام القائد بيتر شكري بتعيين القائد مارك وجدي قائداً لمرحلة كشافة A',
    'Group Leader Peter Shoukry assigned Mark Wagdy as Section Leader of Kashafa A',
    '{"assigned_unit": "scouts_a", "assigned_by": "Peter Shoukry"}'::jsonb
FROM users u, units un
WHERE u.email = 'admin@scouts.org' AND un.code = 'scouts_a';

