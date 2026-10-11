import {
  Unit,
  Patrol,
  Member,
  User,
  Role,
  Permission,
  UserRole,
  UserPermissionOverride,
  EquipmentCategory,
  EquipmentItem,
  Booking,
  MediaUploadJob,
  AuditLogEntry,
  MemberUnitHistory,
  MediaAlbum,
  MediaItem,
  ScoutAttendanceStats,
} from './types';

export const INITIAL_UNITS: Unit[] = [
  { id: 1, code: 'cubs_a', name_ar: 'أشبال A', name_en: 'Ashbal A', stage_group: 'cubs', gender: 'boys', is_leadership: false, target_grade: 'Grade 5' },
  { id: 2, code: 'cubs_b', name_ar: 'أشبال B', name_en: 'Ashbal B', stage_group: 'cubs', gender: 'boys', is_leadership: false, target_grade: 'Grade 6' },
  { id: 3, code: 'brownies_a', name_ar: 'زهرات A', name_en: 'Zahrat A', stage_group: 'brownies', gender: 'girls', is_leadership: false, target_grade: 'Grade 5' },
  { id: 4, code: 'brownies_b', name_ar: 'زهرات B', name_en: 'Zahrat B', stage_group: 'brownies', gender: 'girls', is_leadership: false, target_grade: 'Grade 6' },
  { id: 5, code: 'scouts_a', name_ar: 'كشافة A', name_en: 'Kashafa A', stage_group: 'scouts', gender: 'boys', is_leadership: false, target_grade: 'Prep 1–3 Parallel Troop A' },
  { id: 6, code: 'scouts_b', name_ar: 'كشافة B', name_en: 'Kashafa B', stage_group: 'scouts', gender: 'boys', is_leadership: false, target_grade: 'Prep 1–3 Parallel Troop B' },
  { id: 7, code: 'guides_a', name_ar: 'مرشدات A', name_en: 'Morshdat A', stage_group: 'guides', gender: 'girls', is_leadership: false, target_grade: 'Prep 1–3 Parallel Company A' },
  { id: 8, code: 'guides_b', name_ar: 'مرشدات B', name_en: 'Morshdat B', stage_group: 'guides', gender: 'girls', is_leadership: false, target_grade: 'Prep 1–3 Parallel Company B' },
  { id: 9, code: 'advanced_scouts', name_ar: 'متقدم', name_en: 'Motakadem', stage_group: 'advanced_scouts', gender: 'boys', is_leadership: false, target_grade: 'Secondary 1–3' },
  { id: 10, code: 'senior_guides', name_ar: 'رائدات', name_en: 'Ra2edat', stage_group: 'senior_guides', gender: 'girls', is_leadership: false, target_grade: 'Secondary 1–3' },
  { id: 11, code: 'rovers', name_ar: 'جوالة', name_en: 'Gawala', stage_group: 'rovers', gender: 'mixed', is_leadership: false, target_grade: 'University / Higher Ed' },
  { id: 12, code: 'leaders', name_ar: 'قادة', name_en: 'Leaders', stage_group: 'leadership', gender: 'mixed', is_leadership: true, target_grade: 'Leadership & Adult Staff' },
];

export const INITIAL_PATROLS: Patrol[] = [
  // Ashbal A (Unit 1)
  { id: 101, unit_id: 1, name_ar: 'سداسي الذئب', name_en: 'Wolf Six' },
  { id: 102, unit_id: 1, name_ar: 'سداسي الدب', name_en: 'Bear Six' },
  { id: 103, unit_id: 1, name_ar: 'سداسي الثعلب', name_en: 'Fox Six' },
  { id: 104, unit_id: 1, name_ar: 'سداسي النمر', name_en: 'Tiger Six' },

  // Ashbal B (Unit 2)
  { id: 201, unit_id: 2, name_ar: 'سداسي الفهد', name_en: 'Panther Six' },
  { id: 202, unit_id: 2, name_ar: 'سداسي الوشق', name_en: 'Lynx Six' },
  { id: 203, unit_id: 2, name_ar: 'سداسي القندس', name_en: 'Beaver Six' },

  // Zahrat A (Unit 3)
  { id: 301, unit_id: 3, name_ar: 'سداسي الياسمين', name_en: 'Jasmine Six' },
  { id: 302, unit_id: 3, name_ar: 'سداسي البنفسج', name_en: 'Violet Six' },
  { id: 303, unit_id: 3, name_ar: 'سداسي النرجس', name_en: 'Narcissus Six' },

  // Zahrat B (Unit 4)
  { id: 401, unit_id: 4, name_ar: 'سداسي التيوليب', name_en: 'Tulip Six' },
  { id: 402, unit_id: 4, name_ar: 'سداسي الجوري', name_en: 'Damask Rose Six' },

  // Kashafa A (Unit 5)
  { id: 1, unit_id: 5, name_ar: 'طليعة النسر', name_en: 'Eagle Patrol' },
  { id: 2, unit_id: 5, name_ar: 'طليعة الأسد', name_en: 'Lion Patrol' },
  { id: 3, unit_id: 5, name_ar: 'طليعة الفهد', name_en: 'Panther Patrol' },
  { id: 4, unit_id: 5, name_ar: 'طليعة الصقر', name_en: 'Falcon Patrol' },

  // Kashafa B (Unit 6)
  { id: 601, unit_id: 6, name_ar: 'طليعة الشاهين', name_en: 'Peregrine Patrol' },
  { id: 602, unit_id: 6, name_ar: 'طليعة الذئب', name_en: 'Wolf Patrol' },
  { id: 603, unit_id: 6, name_ar: 'طليعة العقاب', name_en: 'Eagle Hawk Patrol' },

  // Morshdat A (Unit 7)
  { id: 5, unit_id: 7, name_ar: 'طليعة الزهور', name_en: 'Flowers Patrol' },
  { id: 6, unit_id: 7, name_ar: 'طليعة الأمل', name_en: 'Hope Patrol' },
  { id: 703, unit_id: 7, name_ar: 'طليعة المحبة', name_en: 'Love Patrol' },

  // Morshdat B (Unit 8)
  { id: 801, unit_id: 8, name_ar: 'طليعة السلام', name_en: 'Peace Patrol' },
  { id: 802, unit_id: 8, name_ar: 'طليعة العطاء', name_en: 'Giving Patrol' },

  // Motakadem A (Unit 9)
  { id: 901, unit_id: 9, name_ar: 'طليعة الفرسان', name_en: 'Knights Patrol' },
  { id: 902, unit_id: 9, name_ar: 'طليعة الرواد', name_en: 'Pioneers Patrol' },
  { id: 903, unit_id: 9, name_ar: 'طليعة الشجعان', name_en: 'Braves Patrol' },

  // Motakadem B (Unit 10)
  { id: 1001, unit_id: 10, name_ar: 'طليعة العاصفة', name_en: 'Storm Patrol' },
  { id: 1002, unit_id: 10, name_ar: 'طليعة البركان', name_en: 'Volcano Patrol' },

  // Ra2edat A (Unit 11)
  { id: 1101, unit_id: 11, name_ar: 'طليعة النور', name_en: 'Light Patrol' },
  { id: 1102, unit_id: 11, name_ar: 'طليعة الفجر', name_en: 'Dawn Patrol' },

  // Gawala A (Unit 12)
  { id: 1201, unit_id: 12, name_ar: 'رهط النجاح', name_en: 'Success Crew' },
  { id: 1202, unit_id: 12, name_ar: 'رهط العزيمة', name_en: 'Determination Crew' },
];

// Live members are persisted in Microsoft SQL Server (dbo.members)
export const INITIAL_MEMBERS: Member[] = [];

// Live users/leaders are persisted in Microsoft SQL Server (dbo.users)
export const INITIAL_USERS: User[] = [];

export const INITIAL_ROLES: Role[] = [
  { id: 1, name: 'admin', description: 'System Administrator (أدمن النظام) - Full unrestricted CRUD access, statistics, and system administration' },
  { id: 2, name: 'group_leader', description: 'Group Leader (قائد الفوج) - Global view-only access, executive and team analytics' },
  { id: 3, name: 'quartermaster', description: 'Quartermaster (أمين العهدة) - Manages equipment, approves bookings, logs item condition' },
  { id: 4, name: 'section_leader', description: 'Section Leader (قائد وحدة / مرحلة) - Scoped to unit, attendance, members, promotions' },
  { id: 5, name: 'assistant_leader', description: 'Assistant Leader (مساعد قائد) - Scoped to unit, attendance marking, contacts viewing' },
  { id: 6, name: 'media_officer', description: 'Media Officer (مسؤول الإعلام) - Media uploads and Drive archive management' },
];

export const INITIAL_PERMISSIONS: Permission[] = [
  { id: 1, key: 'members.view', category: 'members', description_en: 'View member roster and basic contacts', description_ar: 'عرض كشف الأعضاء وبيانات الاتصال الأساسية' },
  { id: 2, key: 'members.create_edit', category: 'members', description_en: 'Add/edit member profiles and church details', description_ar: 'إضافة وتعديل بيانات الأعضاء وبيانات الكنيسة' },
  { id: 3, key: 'members.view_confidential', category: 'members', description_en: 'View father of confession, spiritual notes, and medical alerts', description_ar: 'الاطلاع على أب الاعتراف والملاحظات الروحية والطبية السرية' },
  { id: 4, key: 'members.promote', category: 'members', description_en: 'Execute annual stage promotions', description_ar: 'تنفيذ حركة التصعيد السنوي للمراحل' },
  { id: 5, key: 'attendance.take', category: 'attendance', description_en: 'Mark and submit active attendance sessions', description_ar: 'تسجيل وحفظ جلسات الحضور والغياب النشطة' },
  { id: 6, key: 'attendance.edit_history', category: 'attendance', description_en: 'Modify past attendance sessions', description_ar: 'تعديل سجلات وجلسات الحضور السابقة' },
  { id: 7, key: 'attendance.export', category: 'attendance', description_en: 'Export attendance rosters to CSV/Excel', description_ar: 'تصدير كشوف الحضور إلى ملفات إكسيل' },
  { id: 8, key: 'attendance.analytics', category: 'attendance', description_en: 'View attendance analytics and performance metrics for the team', description_ar: 'استعراض تحليلات الحضور ومؤشرات الأداء للفرق الكشفية' },
  { id: 9, key: 'inventory.view', category: 'inventory', description_en: 'View inventory catalog and real-time availability', description_ar: 'استعراض كتالوج العهدة والأرصدة المتاحة للطلب' },
  { id: 10, key: 'inventory.book', category: 'inventory', description_en: 'Submit equipment checkout requests', description_ar: 'تقديم طلبات حجز واستعارة مهمات العهدة' },
  { id: 11, key: 'inventory.manage', category: 'inventory', description_en: 'Add/delete inventory items and adjust counts', description_ar: 'إدارة المهمات وتعديل الكميات الإجمالية وحالتها' },
  { id: 12, key: 'inventory.approve', category: 'inventory', description_en: 'Approve or reject checkout requests', description_ar: 'الموافقة على أو رفض طلبات حجز واستعارة العهدة' },
  { id: 13, key: 'media.upload', category: 'media', description_en: 'Upload event photos/videos to the staging queue', description_ar: 'رفع صور وفيديوهات الفعاليات إلى طابور المعالجة' },
  { id: 14, key: 'media.view_all', category: 'media', description_en: 'Access organizational Drive archives', description_ar: 'الوصول إلى كامل أرشيف الوسائط السحابي للفوج' },
  { id: 15, key: 'users.manage_roles', category: 'admin', description_en: 'Adjust roles, scopes, and custom toggle overrides', description_ar: 'إدارة أدوار القادة ونطاقات الفرق وتعديل الصلاحيات المخصصة' },
  { id: 16, key: 'admin.analytics', category: 'admin', description_en: 'Access executive analytics and performance metrics', description_ar: 'الوصول إلى التحليلات التنفيذية الشاملة للفوج' },
  { id: 17, key: 'admin.audit_logs', category: 'admin', description_en: 'View and track all actions executed by leaders', description_ar: 'سجل التدقيق الشامل ومتابعة كافة عمليات القادة بالمنظومة' },
  { id: 18, key: 'scout.portal.view', category: 'scout', description_en: 'Access the dedicated Scout Space portal', description_ar: 'الدخول إلى عرين الكشاف واستعراض الملف الشخصي' },
  { id: 19, key: 'scout.attendance.view_self', category: 'scout', description_en: 'View personal attendance statistics and records', description_ar: 'الاطلاع على سجل ونسبة الحضور والأوسمة الشخصية' },
  { id: 20, key: 'scout.media.view_team_history', category: 'scout', description_en: 'Access historical team photo folders matching progression', description_ar: 'استعراض ألبومات وصور الفرق الكشفية التي انتمى إليها الكشاف' },
];

export const INITIAL_ROLE_PERMISSIONS: { roleId: number; permissionId: number }[] = [
  // 1. Admin gets ALL permissions 1..20
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((pId) => ({ roleId: 1, permissionId: pId })),

  // 2. Group Leader: View-only & analytics (1, 7, 8, 9, 14, 16, 17)
  ...[1, 7, 8, 9, 14, 16, 17].map((pId) => ({ roleId: 2, permissionId: pId })),

  // 3. Quartermaster: Inventory full control (9, 10, 11, 12)
  { roleId: 3, permissionId: 9 },
  { roleId: 3, permissionId: 10 },
  { roleId: 3, permissionId: 11 },
  { roleId: 3, permissionId: 12 },

  // 4. Section Leader: Scoped unit management (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13)
  { roleId: 4, permissionId: 1 },
  { roleId: 4, permissionId: 2 },
  { roleId: 4, permissionId: 3 },
  { roleId: 4, permissionId: 4 },
  { roleId: 4, permissionId: 5 },
  { roleId: 4, permissionId: 6 },
  { roleId: 4, permissionId: 7 },
  { roleId: 4, permissionId: 8 },
  { roleId: 4, permissionId: 9 },
  { roleId: 4, permissionId: 10 },
  { roleId: 4, permissionId: 13 },

  // 5. Assistant Leader: Scoped attendance taking & contacts (1, 5, 8, 9, 10, 13)
  { roleId: 5, permissionId: 1 },
  { roleId: 5, permissionId: 5 },
  { roleId: 5, permissionId: 8 },
  { roleId: 5, permissionId: 9 },
  { roleId: 5, permissionId: 10 },
  { roleId: 5, permissionId: 13 },

  // 6. Media Officer: Media pipelines & Drive (13, 14)
  { roleId: 6, permissionId: 13 },
  { roleId: 6, permissionId: 14 },

  // 7. Scout: Youth portal & personal memories (18, 19, 20)
  { roleId: 7, permissionId: 18 },
  { roleId: 7, permissionId: 19 },
  { roleId: 7, permissionId: 20 },
];

// Live user roles are persisted in Microsoft SQL Server (dbo.user_roles)
export const INITIAL_USER_ROLES: UserRole[] = [];

// Live overrides are persisted in Microsoft SQL Server (dbo.user_permission_overrides)
export const INITIAL_USER_OVERRIDES: UserPermissionOverride[] = [];

export const INITIAL_EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  { id: 1, name: 'Tents & Shelter (خيام وإيواء)' },
  { id: 2, name: 'Cooking & Kitchen (مهمات طهي ومطبخ)' },
  { id: 3, name: 'Pioneering & Ropes (حبال ومشاريع ريادية)' },
  { id: 4, name: 'Lighting & Electrical (إنارة وكهرباء)' },
  { id: 5, name: 'Sound & AV (صوتيات وإذاعة)' },
];

// Live equipment items are persisted in Microsoft SQL Server (dbo.equipment)
export const INITIAL_EQUIPMENT: EquipmentItem[] = [];

// Live bookings are persisted in Microsoft SQL Server (dbo.bookings, dbo.booking_items)
export const INITIAL_BOOKINGS: Booking[] = [];

// Live media upload jobs are persisted in Microsoft SQL Server (dbo.media_items)
export const INITIAL_MEDIA_JOBS: MediaUploadJob[] = [];

// Live audit logs are persisted in Microsoft SQL Server (dbo.audit_logs)
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];

// Live youth progression history is persisted in Microsoft SQL Server (dbo.member_unit_history)
export const INITIAL_MEMBER_UNIT_HISTORY: MemberUnitHistory[] = [];

// Live media albums are persisted in Microsoft SQL Server (dbo.media_albums)
export const INITIAL_MEDIA_ALBUMS: MediaAlbum[] = [];

// Live media items are persisted in Microsoft SQL Server (dbo.media_items)
export const INITIAL_MEDIA_ITEMS: MediaItem[] = [];

export interface ScoutSessionRecord {
  id: string;
  member_id: string;
  session_date: string;
  session_title_ar: string;
  session_title_en: string;
  unit_name_ar: string;
  status: 'present' | 'absent' | 'excused' | 'late';
  notes?: string;
}

// Live scout session records are persisted in Microsoft SQL Server (dbo.attendance_sessions, dbo.attendance_records)
export const INITIAL_SCOUT_SESSION_RECORDS: ScoutSessionRecord[] = [];
