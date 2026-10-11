'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../lib/LanguageContext';
import { useAuth } from '../../../lib/AuthContext';
import {
  INITIAL_ROLES,
  INITIAL_PERMISSIONS,
  INITIAL_ROLE_PERMISSIONS,
  INITIAL_UNITS,
} from '../../../lib/data';
import { checkPermission, getOverrideState, PermissionOverrideState, isSameUser } from '../../../lib/permissions';
import {
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Users,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  Tent,
  Package,
  Camera,
  BarChart3,
  HeartPulse,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  Check,
  AlertCircle,
  HelpCircle,
  Sliders,
  UserPlus,
  X,
  Plus,
} from 'lucide-react';

interface CapabilityModule {
  id: string;
  icon: any;
  color: string;
  badgeBg: string;
  title_ar: string;
  title_en: string;
  desc_ar: string;
  desc_en: string;
  primaryKey: string;
  allKeys: string[];
}

const CAPABILITY_MODULES: CapabilityModule[] = [
  {
    id: 'attendance',
    icon: CalendarCheck,
    color: 'text-emerald-500 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    title_ar: 'تسجيل الحضور والغياب',
    title_en: 'Attendance & Roll Call',
    desc_ar: 'تسجيل حضور وغياب الكشافة في الاجتماعات الأسبوعية ومتابعة تقارير الحضور.',
    desc_en: 'Take weekly meeting attendance, mark absences, and view session attendance stats.',
    primaryKey: 'attendance.take',
    allKeys: ['attendance.take', 'attendance.edit_history', 'attendance.export', 'attendance.analytics'],
  },
  {
    id: 'members',
    icon: Users,
    color: 'text-sky-500 dark:text-sky-400',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    title_ar: 'سجلات وبيانات الكشافة',
    title_en: 'Scout Members Roster',
    desc_ar: 'عرض كشوف الكشافة وتحديث بيانات الاتصال وأرقام الهواتف وتوزيع الطلائع.',
    desc_en: 'View member profiles, update contact information, phone numbers, and manage patrols.',
    primaryKey: 'members.view',
    allKeys: ['members.view', 'members.create_edit', 'members.promote'],
  },
  {
    id: 'confidential',
    icon: HeartPulse,
    color: 'text-amber-500 dark:text-amber-400',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    title_ar: 'البيانات السرية والطبية',
    title_en: 'Spiritual & Medical Alerts',
    desc_ar: 'بيانات خاصة: الاطلاع على اسم أب الاعتراف والملاحظات الروحية والحالات الطبية الطارئة.',
    desc_en: 'Sensitive data: Father of confession, spiritual notes, and emergency medical alerts.',
    primaryKey: 'members.view_confidential',
    allKeys: ['members.view_confidential'],
  },
  {
    id: 'equipment',
    icon: Tent,
    color: 'text-indigo-500 dark:text-indigo-400',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    title_ar: 'حجز مهمات ومخيمات العهدة',
    title_en: 'Gear Requests & Camp Equipment',
    desc_ar: 'استعراض مهمات الفوج وطلب استعارة الخيام ومستلزمات الطهي وأدوات الأنشطة.',
    desc_en: 'Browse equipment catalog and submit loan requests for tents, tools, and camp gear.',
    primaryKey: 'inventory.book',
    allKeys: ['inventory.view', 'inventory.book'],
  },
  {
    id: 'inventory_admin',
    icon: Package,
    color: 'text-purple-500 dark:text-purple-400',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    title_ar: 'إدارة مخزن ومستودع العهدة',
    title_en: 'Warehouse & Inventory Control',
    desc_ar: 'إضافة مهمات جديدة للمخزن والموافقة على أو رفض طلبات حجز واستعارة العهدة.',
    desc_en: 'Add new items to warehouse inventory and approve/reject gear loan requests.',
    primaryKey: 'inventory.manage',
    allKeys: ['inventory.manage', 'inventory.approve'],
  },
  {
    id: 'media',
    icon: Camera,
    color: 'text-cyan-500 dark:text-cyan-400',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    title_ar: 'رفع الصور وأرشيف Google Drive',
    title_en: 'Photos & Google Drive Archive',
    desc_ar: 'رفع صور وفيديوهات الفعاليات والمخيمات مباشرة إلى مجلدات Google Drive السحابية.',
    desc_en: 'Upload event photos and videos directly to Google Drive folders (Teams, Events).',
    primaryKey: 'media.upload',
    allKeys: ['media.upload', 'media.view_all'],
  },
  {
    id: 'admin_analytics',
    icon: BarChart3,
    color: 'text-rose-500 dark:text-rose-400',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    title_ar: 'التقارير وسجلات العمليات',
    title_en: 'Troop Reports & Audit Logs',
    desc_ar: 'متابعة إحصائيات الفوج وسجل العمليات والتصرفات التي قام بها القادة في المنظومة.',
    desc_en: 'View troop analytics, progression statistics, and full audit logs of leader activity.',
    primaryKey: 'admin.analytics',
    allKeys: ['admin.analytics', 'admin.audit_logs'],
  },
];

export default function PermissionsMatrixPage() {
  const { language, t } = useLanguage();
  const {
    isSuperAdmin,
    can,
    logAction,
    userRoles,
    assignLeaderUnits,
    allUsers,
    addLeader,
    overrides,
    permissions,
    roles,
    rolePermissions,
    isDbConnected,
    loginAs,
    updatePermissionOverride,
    resetPermissionOverrides,
    refreshPermissions,
  } = useAuth();

  const [mounted, setMounted] = useState<boolean>(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [selectedUserId, setSelectedUserId] = useState<string>('u4'); // Default to Andrew Nabil
  const [targetUnitId, setTargetUnitId] = useState<number>(5); // Kashafa A

  // Add Leader Modal state
  const [isAddLeaderModalOpen, setIsAddLeaderModalOpen] = useState(false);
  const [newLeaderName, setNewLeaderName] = useState('');
  const [newLeaderEmail, setNewLeaderEmail] = useState('');
  const [newLeaderPhone, setNewLeaderPhone] = useState('');
  const [newLeaderRoleId, setNewLeaderRoleId] = useState<number>(4); // Section Leader
  const [newLeaderUnitIds, setNewLeaderUnitIds] = useState<number[]>([]);
  const [newLeaderIsGlobal, setNewLeaderIsGlobal] = useState<boolean>(true);
  const [addLeaderSuccessMsg, setAddLeaderSuccessMsg] = useState<string | null>(null);

  // Live SQL Server Permission check state
  const [testingPermKey, setTestingPermKey] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ permKey: string; isGranted: boolean } | null>(null);

  // Multiple team assignment state for selected leader
  const [assignedUnitIdsInput, setAssignedUnitIdsInput] = useState<number[]>([]);
  const [isGlobalScopeInput, setIsGlobalScopeInput] = useState<boolean>(true);
  const [assignedRoleInput, setAssignedRoleInput] = useState<number>(3);
  const [assignSuccessMsg, setAssignSuccessMsg] = useState<string | null>(null);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  // Advanced technical view accordion toggle
  const [showAdvancedMatrix, setShowAdvancedMatrix] = useState<boolean>(false);

  const selectedUser = useMemo(() => {
    return (
      allUsers.find((u) => isSameUser(u.id, selectedUserId) || u.email === selectedUserId) ||
      allUsers.find((u) => u.email === 'andrew.nabil@scouts.org') ||
      allUsers[0] ||
      ({ id: 'u0', full_name: 'مدير النظام (System Admin)', email: 'admin@scouts.org', is_active: true } as any)
    );
  }, [selectedUserId, allUsers]);

  const selectedUserRoleAssignments = useMemo(() => {
    return userRoles.filter(
      (ur) => isSameUser(ur.user_id, selectedUser.id)
    );
  }, [selectedUser.id, userRoles]);

  // Sync inputs when selected user changes
  useEffect(() => {
    const specificUnitIds = Array.from(
      new Set(
        selectedUserRoleAssignments
          .filter((ur) => ur.unit_id !== null && ur.unit_id !== undefined)
          .map((ur) => ur.unit_id as number)
      )
    );

    if (specificUnitIds.length > 0) {
      setAssignedUnitIdsInput(specificUnitIds);
      setIsGlobalScopeInput(false);
      setTargetUnitId(specificUnitIds[0]);
    } else {
      setAssignedUnitIdsInput([]);
      setIsGlobalScopeInput(true);
    }

    if (selectedUserRoleAssignments[0]) {
      setAssignedRoleInput(selectedUserRoleAssignments[0].role_id);
    }
  }, [selectedUser.id, selectedUserRoleAssignments]);

  const selectedRole = useMemo(() => {
    if (selectedUserRoleAssignments.length === 0) return null;
    return (
      roles.find((r) => r.id === selectedUserRoleAssignments[0].role_id) ||
      INITIAL_ROLES.find((r) => r.id === selectedUserRoleAssignments[0].role_id) ||
      null
    );
  }, [selectedUserRoleAssignments, roles]);

  const assignedUnits = useMemo(() => {
    const unitIds = Array.from(
      new Set(
        selectedUserRoleAssignments
          .filter((ur) => ur.unit_id !== null && ur.unit_id !== undefined)
          .map((ur) => ur.unit_id as number)
      )
    );
    return INITIAL_UNITS.filter((u) => unitIds.includes(u.id));
  }, [selectedUserRoleAssignments]);

  // Context for permission engine
  const permContext = useMemo(() => {
    return {
      userId: selectedUser.id,
      roles: roles.length > 0 ? roles : INITIAL_ROLES,
      userRoles,
      permissions: permissions.length > 0 ? permissions : INITIAL_PERMISSIONS,
      rolePermissions: rolePermissions.length > 0 ? rolePermissions : INITIAL_ROLE_PERMISSIONS,
      overrides,
    };
  }, [selectedUser.id, overrides, userRoles, roles, permissions, rolePermissions]);

  const handleSaveTeamAssignment = () => {
    const finalUnitIds = isGlobalScopeInput ? [] : assignedUnitIdsInput;
    const success = assignLeaderUnits(selectedUser.id, finalUnitIds, assignedRoleInput);
    if (success) {
      setAssignSuccessMsg(
        language === 'ar'
          ? `تم حفظ وتحديث دور وفرق القائد (${selectedUser.full_name}) في قاعدة البيانات بنجاح!`
          : `Role & Teams updated for (${selectedUser.full_name}) in database successfully!`
      );
      setTimeout(() => setAssignSuccessMsg(null), 3500);
    }
  };

  const handleCreateLeader = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeaderName.trim() || !newLeaderEmail.trim()) return;

    const created = addLeader({
      full_name: newLeaderName.trim(),
      email: newLeaderEmail.trim(),
      phone: newLeaderPhone.trim(),
      role_id: newLeaderRoleId,
      unit_ids: newLeaderIsGlobal ? [] : newLeaderUnitIds,
    });

    setSelectedUserId(created.id);
    setIsAddLeaderModalOpen(false);
    setNewLeaderName('');
    setNewLeaderEmail('');
    setNewLeaderPhone('');
    setNewLeaderUnitIds([]);
    setNewLeaderIsGlobal(true);
    setAddLeaderSuccessMsg(
      language === 'ar'
        ? `تمت إضافة القائد (${created.full_name}) وحفظه بقاعدة البيانات بنجاح!`
        : `Leader (${created.full_name}) saved to database and selected successfully!`
    );
    setTimeout(() => setAddLeaderSuccessMsg(null), 3500);
  };

  // Reset ALL overrides for this user back to Role Defaults in database
  const handleResetAllToRoleDefault = async () => {
    await resetPermissionOverrides(selectedUser.id);
    setResetSuccessMsg(
      language === 'ar'
        ? `تمت استعادة الصلاحيات الافتراضية للدور القيادي (${selectedRole?.description.split(' - ')[0] || ''}) بنجاح في قاعدة البيانات.`
        : `All permissions reset to role defaults (${selectedRole?.description.split(' - ')[0] || ''}) in database.`
    );
    setTimeout(() => setResetSuccessMsg(null), 3500);

    logAction({
      action_type: 'permission_overridden',
      title_ar: 'استعادة الصلاحيات الافتراضية للقائد',
      title_en: 'Reset Permissions to Role Defaults',
      description_ar: `قام المسؤول بإلغاء التخصيصات واستعادة الدور الافتراضي للقائد ${selectedUser.full_name}`,
      description_en: `Admin restored default role permissions for leader ${selectedUser.full_name}`,
      unit_id: targetUnitId,
    });
  };

  // Toggle a high-level capability module ON or OFF in database
  const handleToggleModule = async (module: CapabilityModule, currentlyAllowed: boolean) => {
    const shouldEnable = !currentlyAllowed;
    const targetPermIds = permissions
      .filter((p) => module.allKeys.includes(p.key))
      .map((p) => Number(p.id));

    const isGlobalModule = ['equipment', 'inventory_admin', 'media', 'admin_analytics'].includes(module.id);
    const leaderUnitIds = selectedUserRoleAssignments
      .filter((ur) => ur.unit_id !== null && ur.unit_id !== undefined)
      .map((ur) => Number(ur.unit_id));

    // When toggling a capability module for a leader, apply to global scope AND all assigned units
    // to guarantee complete, consistent revocation/grant across all units and navigation checks
    const targetUnitsList: (number | null)[] =
      isGlobalModule || isGlobalScopeInput || leaderUnitIds.length === 0
        ? [null]
        : [null, ...leaderUnitIds];

    await updatePermissionOverride(selectedUser.id, targetPermIds, targetUnitsList, shouldEnable);

    logAction({
      action_type: 'permission_overridden',
      title_ar: shouldEnable ? `تفعيل ميزة (${module.title_ar})` : `تعطيل ميزة (${module.title_ar})`,
      title_en: shouldEnable ? `Enabled (${module.title_en})` : `Disabled (${module.title_en})`,
      description_ar: `تم ضبط إتاحة ${module.title_ar} للقائد ${selectedUser.full_name} إلى: ${shouldEnable ? 'مفعلة' : 'معطلة'} وحفظها في قاعدة البيانات`,
      description_en: `Set ${module.title_en} for ${selectedUser.full_name} to: ${shouldEnable ? 'Allowed' : 'Disabled'} and saved in database`,
      unit_id: isGlobalScopeInput ? null : targetUnitId,
    });
  };

  // Reset a specific module to its role default in database
  const handleResetModule = async (module: CapabilityModule) => {
    const targetPermIds = permissions
      .filter((p) => module.allKeys.includes(p.key))
      .map((p) => Number(p.id));
    const isGlobalModule = ['equipment', 'inventory_admin', 'media', 'admin_analytics'].includes(module.id);
    const leaderUnitIds = selectedUserRoleAssignments
      .filter((ur) => ur.unit_id !== null && ur.unit_id !== undefined)
      .map((ur) => Number(ur.unit_id));
    const targetUnitsList: (number | null)[] =
      isGlobalModule || isGlobalScopeInput || leaderUnitIds.length === 0
        ? [null]
        : [null, ...leaderUnitIds];
    await resetPermissionOverrides(selectedUser.id, targetPermIds, targetUnitsList);
  };

  // Granular override handler for the advanced view in database
  const handleSetGranularOverride = async (permissionId: number, state: PermissionOverrideState) => {
    const cleanPermId = Number(permissionId);
    const permObj = permissions.find((p) => Number(p.id) === cleanPermId);
    const isGlobalPerm = permObj ? ['inventory', 'media', 'admin', 'scout'].includes(permObj.category) : false;
    const effectiveUnitId = isGlobalPerm || isGlobalScopeInput ? null : targetUnitId;

    if (state === 'inherited') {
      await resetPermissionOverrides(selectedUser.id, [cleanPermId], effectiveUnitId);
    } else {
      await updatePermissionOverride(selectedUser.id, [cleanPermId], effectiveUnitId, state === 'granted');
    }
  };

  // Live test against SQL Server stored function dbo.fn_check_leader_permission
  const handleTestDatabasePermission = async (permKey: string) => {
    setTestingPermKey(permKey);
    try {
      const res = await fetch('/api/permissions/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          permissionKey: permKey,
          unitId: targetUnitId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ permKey, isGranted: Boolean(data.is_granted) });
        setTimeout(() => setTestResult(null), 6000);
      }
    } catch (e) {
      console.error('Failed to test DB permission:', e);
    } finally {
      setTestingPermKey(null);
    }
  };

  // Permission Guard
  if (!isSuperAdmin && !can('users.manage_roles')) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-200 dark:border-rose-800/60 shadow-xs">
          <ShieldAlert className="w-7 h-7" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {language === 'ar' ? 'وصول مقيّد: إدارة الصلاحيات' : 'Restricted Access: Leader Permissions'}
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {language === 'ar'
            ? 'تعديل الصلاحيات وتعيين أدوار القادة متاح فقط لحساب مدير النظام (System Admin). إذا كنت تختبر حساب قائد آخر، اضغط أدناه للرجوع لحساب المدير وتعديل الصلاحيات.'
            : 'Leader permission assignments are restricted to the System Administrator. If you are currently testing another leader account, click below to switch back to Admin.'}
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => loginAs('u0')}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{language === 'ar' ? 'التبديل لحساب مدير النظام' : 'Switch to System Admin Account'}</span>
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition-colors"
          >
            {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
          </Link>
        </div>
      </div>
    );
  }

  // Hydration safety guard
  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="h-20 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl" />
        <div className="h-28 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-44 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl" />
          <div className="h-44 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl" />
        </div>
      </div>
    );
  }

  // Count active custom tweaks for this leader
  const userOverridesCount = overrides.filter((ov: any) => isSameUser(ov.user_id, selectedUser.id)).length;
  const isSelectedUserAdmin = isSameUser(selectedUser.id, '11111111-0000-0000-0000-000000000001') || selectedUser.email === 'admin@scouts.org';

  return (
    <div className="space-y-6">
      {/* Friendly Header */}
      <div className="bg-white dark:bg-[#121214] p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                {language === 'ar' ? 'صلاحيات وأدوار القادة' : 'Leader Permissions & Roles'}
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {language === 'ar'
                  ? 'إدارة مهام القادة والفرق الكشفية وتحديد الصلاحيات المتاحة بكل بساطة.'
                  : 'Easily manage leadership roles, assign scout teams, and set feature access in plain language.'}
              </p>
            </div>
          </div>
        </div>

        {/* Leader Selector Dropdown & Add Leader Button */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto bg-zinc-50 dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 shrink-0">
            {language === 'ar' ? 'اختر القائد:' : 'Select Leader:'}
          </label>
          <select
            value={selectedUser.id}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-purple-500 focus:outline-none cursor-pointer"
          >
            {allUsers.map((u) => {
              const uRole = userRoles.find((ur) => isSameUser(ur.user_id, u.id));
              const roleObj = roles.find((r) => r.id === uRole?.role_id) || INITIAL_ROLES.find((r) => r.id === uRole?.role_id);
              const roleTitle = roleObj ? roleObj.description.split(' - ')[0] : 'Leader';
              return (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({roleTitle})
                </option>
              );
            })}
          </select>

          {/* Add Leader Button */}
          {(isSuperAdmin || can('users.manage_roles')) && (
            <button
              type="button"
              onClick={() => setIsAddLeaderModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? '＋ إضافة قائد جديد' : '+ Add Leader'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Warning banner when System Admin is selected */}
      {isSelectedUserAdmin && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-start md:items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 md:mt-0" />
            <div>
              <p className="font-bold text-xs">
                {language === 'ar'
                  ? 'أنت تستعرض حالياً حساب مدير النظام (System Admin).'
                  : 'You are currently viewing the System Administrator (Root Admin).'}
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                {language === 'ar'
                  ? 'حساب مدير النظام يمتلك كافة الصلاحيات بدون قيود ولا يمكن إلغاؤها. لتعديل واختبار صلاحيات قائد مخصص، اختر قائداً من القائمة أو اضغط أدناه:'
                  : 'The System Admin has full unrestricted access across all modules by system design. To configure or restrict permissions for testing, select a leader below:'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const andrew = allUsers.find((u) => u.email === 'andrew.nabil@scouts.org');
                if (andrew) setSelectedUserId(andrew.id);
              }}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
            >
              {language === 'ar' ? 'اختيار أندرو نبيل' : 'Select Andrew Nabil'}
            </button>
            <button
              type="button"
              onClick={() => {
                const christine = allUsers.find((u) => u.email === 'christine.nabil@scouts.org');
                if (christine) setSelectedUserId(christine.id);
              }}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs transition-colors cursor-pointer"
            >
              {language === 'ar' ? 'اختيار كريستين نبيل' : 'Select Christine Nabil'}
            </button>
          </div>
        </div>
      )}

      {/* Live Database Sync Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <span className="font-bold text-zinc-800 dark:text-zinc-200">
            {language === 'ar'
              ? 'متصل بقاعدة بيانات Microsoft SQL Server 2025 (ScoutsDB) - الحفظ والتعديلات فورية'
              : 'Connected to Microsoft SQL Server 2025 (ScoutsDB) - Changes persist directly to database'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => refreshPermissions()}
          className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{language === 'ar' ? 'تحديث ومزامنة البيانات الآن' : 'Sync & Refresh Now'}</span>
        </button>
      </div>

      {/* Add Leader Success Message */}
      {addLeaderSuccessMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{addLeaderSuccessMsg}</span>
        </div>
      )}

      {/* Add Leader Modal */}
      {isAddLeaderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    {language === 'ar' ? 'إضافة قائد جديد للمنظومة' : 'Add New Leader to System'}
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    {language === 'ar' ? 'تسجيل قائد جديد وتعيين دوره والفريق المخصص له' : 'Register a leader and set their role and team'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddLeaderModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLeader} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  {language === 'ar' ? 'اسم القائد بالكامل' : 'Leader Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newLeaderName}
                  onChange={(e) => setNewLeaderName(e.target.value)}
                  placeholder="e.g. Mena Maher, Peter Shoukry..."
                  className="w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  {language === 'ar' ? 'البريد الإلكتروني (حساب الدخول)' : 'Email Address (Login Account)'} *
                </label>
                <input
                  type="email"
                  required
                  value={newLeaderEmail}
                  onChange={(e) => setNewLeaderEmail(e.target.value)}
                  placeholder="e.g. mena.maher@scouts.org"
                  className="w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  {language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  value={newLeaderPhone}
                  onChange={(e) => setNewLeaderPhone(e.target.value)}
                  placeholder="e.g. +201012345678"
                  className="w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === 'ar' ? 'الدور القيادي الأساسي' : 'Primary Role'} *
                  </label>
                  <select
                    value={newLeaderRoleId}
                    onChange={(e) => setNewLeaderRoleId(Number(e.target.value))}
                    className="w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {INITIAL_ROLES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.description.split(' - ')[0]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      {language === 'ar' ? 'الفرق والمراحل المخصصة' : 'Assigned Scout Teams'} *
                    </label>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {newLeaderIsGlobal
                        ? (language === 'ar' ? 'نطاق عام (كامل الفوج)' : 'All Teams')
                        : `${newLeaderUnitIds.length} ${language === 'ar' ? 'فرق محددة' : 'teams selected'}`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 max-h-36 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setNewLeaderIsGlobal(true);
                        setNewLeaderUnitIds([]);
                      }}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                        newLeaderIsGlobal
                          ? 'bg-purple-600 text-white font-bold'
                          : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {language === 'ar' ? '🌐 كامل الفوج' : '🌐 All Teams'}
                    </button>
                    {INITIAL_UNITS.map((u) => {
                      const isSelected = !newLeaderIsGlobal && newLeaderUnitIds.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setNewLeaderIsGlobal(false);
                            setNewLeaderUnitIds((prev) =>
                              prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                            );
                          }}
                          className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-purple-600 text-white font-bold'
                              : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          <span>{language === 'ar' ? u.name_ar : u.name_en}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddLeaderModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!newLeaderName.trim() || !newLeaderEmail.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'حفظ وإضافة القائد' : 'Save & Register Leader'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Leader Summary Card */}
      <div className="p-5 rounded-xl bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Avatar with Initials */}
          <div className="w-12 h-12 rounded-xl bg-purple-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
            {selectedUser.full_name
              .split(' ')
              .map((n) => n[0])
              .slice(0, 2)
              .join('')}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">{selectedUser.full_name}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {selectedRole ? selectedRole.description.split(' - ')[0] : 'No Role'}
              </span>
              {assignedUnits.length > 0 ? (
                assignedUnits.map((u) => (
                  <span
                    key={u.id}
                    className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    {language === 'ar' ? u.name_ar : u.name_en}
                  </span>
                ))
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  {language === 'ar' ? 'نطاق عام (كامل الفوج)' : 'Global Troop Scope'}
                </span>
              )}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex flex-wrap gap-3">
              <span>{selectedUser.email}</span>
              <span>&bull;</span>
              <span className="font-mono">{selectedUser.phone}</span>
            </div>
          </div>
        </div>

        {/* Quick Reset Action if Customized */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {userOverridesCount > 0 ? (
            <button
              type="button"
              onClick={handleResetAllToRoleDefault}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'استعادة إعدادات الدور الافتراضية' : 'Reset to Role Defaults'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 font-bold">
                {userOverridesCount}
              </span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 text-xs font-medium border border-zinc-200 dark:border-zinc-700">
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'ar' ? 'يطبق صلاحيات الدور الأساسية' : 'Standard Role Permissions'}</span>
            </div>
          )}
        </div>
      </div>

      {resetSuccessMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{resetSuccessMsg}</span>
        </div>
      )}

      {/* Section 1: Role & Team Assignment (Core Settings) */}
      <div className="bg-white dark:bg-[#121214] p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>{language === 'ar' ? 'الدور القيادي والفرق المخصصة' : 'Leadership Role & Assigned Teams'}</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {language === 'ar'
                ? 'تحديد الدور الوظيفي للقائد والفرق الكشفية التي يشرف عليها (يمكنك اختيار أكثر من فريق لنفس القائد).'
                : 'Choose the leader’s role and assigned scout teams (you can assign multiple teams to the same leader).'}
            </p>
          </div>

          {assignSuccessMsg && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{assignSuccessMsg}</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Primary Role Dropdown */}
          <div className="max-w-md">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {language === 'ar' ? 'الدور القيادي الأساسي' : 'Primary Leadership Role'}
            </label>
            <select
              value={assignedRoleInput}
              onChange={(e) => setAssignedRoleInput(Number(e.target.value))}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              {INITIAL_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.description.split(' - ')[0]}
                </option>
              ))}
            </select>
          </div>

          {/* Multi-Team Selector Grid */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                <span>{language === 'ar' ? 'الفرق والمراحل المخصصة لهذا القائد:' : 'Assigned Scout Teams for this Leader:'}</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-mono">
                  {isGlobalScopeInput
                    ? (language === 'ar' ? 'كامل الفوج (All Teams)' : 'All Teams Scope')
                    : `${assignedUnitIdsInput.length} ${language === 'ar' ? 'فرق محددة' : 'teams assigned'}`}
                </span>
              </label>

              {/* Quick scope action buttons */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsGlobalScopeInput(true);
                    setAssignedUnitIdsInput([]);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    isGlobalScopeInput
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {language === 'ar' ? '🌐 كامل الفوج' : '🌐 All Teams'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsGlobalScopeInput(false);
                    setAssignedUnitIdsInput(INITIAL_UNITS.map((u) => u.id));
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'تحديد الكل' : 'Select All'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsGlobalScopeInput(false);
                    setAssignedUnitIdsInput([]);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium transition-colors cursor-pointer"
                >
                  {language === 'ar' ? 'مسح التحديد' : 'Clear'}
                </button>
              </div>
            </div>

            {/* Interactive Grid of Team Cards with Checkboxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
              {INITIAL_UNITS.map((u) => {
                const isSelected = !isGlobalScopeInput && assignedUnitIdsInput.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setIsGlobalScopeInput(false);
                      setAssignedUnitIdsInput((prev) =>
                        prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                      );
                    }}
                    className={`p-3 rounded-xl border text-start transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none ${
                      isSelected
                        ? 'bg-purple-50 dark:bg-purple-950/20 border-purple-500 dark:border-purple-400 text-purple-900 dark:text-purple-100 shadow-xs ring-1 ring-purple-500/30'
                        : isGlobalScopeInput
                        ? 'bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200/60 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {language === 'ar' ? u.name_ar : u.name_en}
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                        {u.code} &bull; {u.gender === 'boys' ? (language === 'ar' ? 'بنين' : 'Boys') : u.gender === 'girls' ? (language === 'ar' ? 'بنات' : 'Girls') : (language === 'ar' ? 'مختلط' : 'Mixed')}
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-purple-600 border-purple-600 text-white'
                          : isGlobalScopeInput
                          ? 'border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800'
                          : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      {isGlobalScopeInput && <span className="text-[10px]">🌐</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Action Bar */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleSaveTeamAssignment}
              className="py-2.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{language === 'ar' ? 'حفظ الدور والفرق المحددة' : 'Save Role & Assigned Teams'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Simple & Intuitive Feature Capability Cards */}
      <div className="bg-white dark:bg-[#121214] p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{language === 'ar' ? 'الصلاحيات والخدمات المتاحة لهذا القائد' : 'Feature Permissions for this Leader'}</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {language === 'ar'
                ? 'اضغط على أي ميزة لتفعيلها أو تعطيلها مباشرة. الأخضر يعني أن الميزة متاحة للقائد.'
                : 'Click any feature to toggle it ON or OFF. Green indicates active access for this leader.'}
            </p>
          </div>
        </div>

        {/* Grid of Capability Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {CAPABILITY_MODULES.map((module) => {
            const Icon = module.icon;
            const isGlobalModule = ['equipment', 'inventory_admin', 'media', 'admin_analytics'].includes(module.id);
            const leaderUnitIds = selectedUserRoleAssignments
              .filter((ur) => ur.unit_id !== null && ur.unit_id !== undefined)
              .map((ur) => Number(ur.unit_id));
            const effectiveUnitId = isGlobalModule || isGlobalScopeInput || leaderUnitIds.length > 0 ? null : targetUnitId;
            const isAllowed = checkPermission(permContext, module.primaryKey, effectiveUnitId);

            // Check if this module is customized for this leader
            const modulePermIds = permissions.filter((p) => module.allKeys.includes(p.key)).map((p) => Number(p.id));
            const isCustomized = overrides.some(
              (ov: any) => isSameUser(ov.user_id, selectedUser.id) && modulePermIds.includes(Number(ov.permission_id))
            );

            const isCurrentlyTested = testingPermKey === module.primaryKey;
            const thisTestResult = testResult?.permKey === module.primaryKey ? testResult : null;

            return (
              <div
                key={module.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                  isAllowed
                    ? 'bg-zinc-50/70 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                    : 'bg-zinc-50/30 dark:bg-zinc-900/20 border-dashed border-zinc-200 dark:border-zinc-800/80 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${module.badgeBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {language === 'ar' ? module.title_ar : module.title_en}
                        </h3>
                        {isCustomized ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            {language === 'ar' ? 'مخصصة للقائد (قاعدة البيانات)' : 'Customized (DB)'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {language === 'ar' ? 'مشمولة بالدور' : 'Role Default'}
                          </span>
                        )}
                        {thisTestResult && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                              thisTestResult.isGranted
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            }`}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>
                              SQL Server:{' '}
                              {thisTestResult.isGranted
                                ? language === 'ar'
                                  ? 'مسموح (1)'
                                  : 'Granted (1)'
                                : language === 'ar'
                                ? 'محظور (0)'
                                : 'Denied (0)'}
                            </span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                        {language === 'ar' ? module.desc_ar : module.desc_en}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    {isCustomized && (
                      <button
                        type="button"
                        onClick={() => handleResetModule(module)}
                        className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{language === 'ar' ? 'استعادة إعداد الدور' : 'Revert to Role'}</span>
                      </button>
                    )}
                    {/* Live SQL Server Verification Button */}
                    <button
                      type="button"
                      onClick={() => handleTestDatabasePermission(module.primaryKey)}
                      disabled={isCurrentlyTested}
                      className="text-[11px] text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Test live result directly from SQL Server dbo.fn_check_leader_permission"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>
                        {isCurrentlyTested
                          ? language === 'ar'
                            ? 'جارٍ الفحص...'
                            : 'Checking...'
                          : language === 'ar'
                          ? 'فحص SQL Server'
                          : 'Test SQL DB'}
                      </span>
                    </button>
                  </div>

                  {/* Big Friendly Toggle Button */}
                  <button
                    type="button"
                    disabled={isSelectedUserAdmin}
                    onClick={() => handleToggleModule(module, isAllowed)}
                    title={
                      isSelectedUserAdmin
                        ? (language === 'ar'
                            ? 'حساب مدير النظام يمتلك كافة الصلاحيات ولا يمكن تقييدها. اختر قائداً آخر من القائمة أعلاه.'
                            : 'System Admin has permanent root access and cannot be restricted. Select another leader above.')
                        : undefined
                    }
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                      isSelectedUserAdmin
                        ? 'bg-emerald-600/60 text-white cursor-not-allowed opacity-80'
                        : isAllowed
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                        : 'bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer'
                    }`}
                  >
                    {isAllowed ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{language === 'ar' ? 'مفعلة (مسموح)' : 'Active (Allowed)'}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'معطلة (غير مسموح)' : 'Disabled'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Optional Collapsible Advanced Technical View (Closed by default) */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-[#121214]">
        <button
          type="button"
          onClick={() => setShowAdvancedMatrix(!showAdvancedMatrix)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-zinc-500" />
            <span>
              {language === 'ar'
                ? 'عرض تفاصيل مفاتيح الصلاحيات المتقدمة (للمتخصصين ومدير النظام)'
                : 'Show Advanced Technical Permission Keys (For Specialists & Admins)'}
            </span>
          </div>
          {showAdvancedMatrix ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAdvancedMatrix && (
          <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 space-y-4 animate-in fade-in duration-150">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-xs text-zinc-500 leading-relaxed">
              {language === 'ar'
                ? 'في هذا الجدول المتقدم، يمكنك فحص وتعديل كل مفتاح برمجي للصلاحية بشكل منفصل. التغييرات تنعكس مباشرة على تجربة القائد.'
                : 'Fine-grained key control: Inspect or override individual system permission keys directly.'}
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {INITIAL_PERMISSIONS.map((perm) => {
                const isGlobalPerm = ['inventory', 'media', 'admin', 'scout'].includes(perm.category);
                const effectiveUnitId = isGlobalPerm || isGlobalScopeInput ? null : targetUnitId;
                const overrideState = getOverrideState(permContext, Number(perm.id), effectiveUnitId);
                const isEffectiveAllowed = checkPermission(permContext, perm.key, effectiveUnitId);
                const isOverridden = overrideState !== 'inherited';

                return (
                  <div
                    key={perm.id}
                    className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                          {perm.key}
                        </span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {language === 'ar' ? perm.description_ar : perm.description_en}
                        </span>
                        {isOverridden && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${
                            overrideState === 'granted'
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                          }`}>
                            {overrideState === 'granted' ? 'Override (Granted)' : 'Override (Revoked)'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="inline-flex rounded-lg p-0.5 bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold">
                        <button
                          type="button"
                          disabled={isSelectedUserAdmin}
                          onClick={() => handleSetGranularOverride(Number(perm.id), 'inherited')}
                          className={`px-2 py-1 rounded transition-colors ${
                            isSelectedUserAdmin
                              ? 'text-zinc-400 cursor-not-allowed'
                              : overrideState === 'inherited'
                              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-bold cursor-pointer'
                              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer'
                          }`}
                        >
                          Role Default
                        </button>
                        <button
                          type="button"
                          disabled={isSelectedUserAdmin}
                          onClick={() => handleSetGranularOverride(Number(perm.id), 'granted')}
                          className={`px-2 py-1 rounded transition-colors ${
                            isSelectedUserAdmin
                              ? 'text-zinc-400 cursor-not-allowed'
                              : overrideState === 'granted'
                              ? 'bg-emerald-600 text-white font-bold cursor-pointer'
                              : 'text-zinc-500 hover:text-emerald-600 cursor-pointer'
                          }`}
                        >
                          Grant (+)
                        </button>
                        <button
                          type="button"
                          disabled={isSelectedUserAdmin}
                          onClick={() => handleSetGranularOverride(Number(perm.id), 'revoked')}
                          className={`px-2 py-1 rounded transition-colors ${
                            isSelectedUserAdmin
                              ? 'text-zinc-400 cursor-not-allowed'
                              : overrideState === 'revoked'
                              ? 'bg-rose-600 text-white font-bold cursor-pointer'
                              : 'text-zinc-500 hover:text-rose-600 cursor-pointer'
                          }`}
                        >
                          Revoke (-)
                        </button>
                      </div>

                      <span
                        className={`w-18 justify-center py-1 px-2 rounded-full font-bold text-[11px] flex items-center gap-1 border ${
                          isEffectiveAllowed
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {isEffectiveAllowed ? 'Allowed' : 'Denied'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

