'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../../lib/LanguageContext';
import { useAuth } from '../../../lib/AuthContext';
import {
  INITIAL_USERS,
  INITIAL_ROLES,
  INITIAL_PERMISSIONS,
  INITIAL_ROLE_PERMISSIONS,
  INITIAL_USER_OVERRIDES,
  INITIAL_UNITS,
} from '../../../lib/data';
import { checkPermission, getOverrideState, PermissionOverrideState } from '../../../lib/permissions';
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
  const { isSuperAdmin, can, logAction, userRoles, assignLeaderUnit, allUsers, addLeader } = useAuth();

  const [selectedUserId, setSelectedUserId] = useState<string>('u4'); // Default to Andrew Nabil
  const [targetUnitId, setTargetUnitId] = useState<number>(5); // Kashafa A

  // Add Leader Modal state
  const [isAddLeaderModalOpen, setIsAddLeaderModalOpen] = useState(false);
  const [newLeaderName, setNewLeaderName] = useState('');
  const [newLeaderEmail, setNewLeaderEmail] = useState('');
  const [newLeaderPhone, setNewLeaderPhone] = useState('');
  const [newLeaderRoleId, setNewLeaderRoleId] = useState<number>(4); // Section Leader
  const [newLeaderUnitId, setNewLeaderUnitId] = useState<number | 'global'>('global');
  const [addLeaderSuccessMsg, setAddLeaderSuccessMsg] = useState<string | null>(null);

  // Overrides mutable state with localStorage persistence
  const [overrides, setOverrides] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('scouts_user_overrides');
        if (saved) return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_USER_OVERRIDES;
  });

  const [assignedUnitInput, setAssignedUnitInput] = useState<number | 'global'>('global');
  const [assignedRoleInput, setAssignedRoleInput] = useState<number>(3);
  const [assignSuccessMsg, setAssignSuccessMsg] = useState<string | null>(null);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);

  // Advanced technical view accordion toggle
  const [showAdvancedMatrix, setShowAdvancedMatrix] = useState<boolean>(false);

  const selectedUser = useMemo(() => {
    return allUsers.find((u) => u.id === selectedUserId) || allUsers[0] || INITIAL_USERS[0];
  }, [selectedUserId, allUsers]);

  const selectedUserRoleAssignment = useMemo(() => {
    return userRoles.find((ur) => ur.user_id === selectedUserId);
  }, [selectedUserId, userRoles]);

  // Sync inputs when selected user changes
  useEffect(() => {
    if (selectedUserRoleAssignment) {
      setAssignedUnitInput(selectedUserRoleAssignment.unit_id ?? 'global');
      setAssignedRoleInput(selectedUserRoleAssignment.role_id);
      if (selectedUserRoleAssignment.unit_id) {
        setTargetUnitId(selectedUserRoleAssignment.unit_id);
      }
    }
  }, [selectedUserId, selectedUserRoleAssignment]);

  const selectedRole = useMemo(() => {
    if (!selectedUserRoleAssignment) return null;
    return INITIAL_ROLES.find((r) => r.id === selectedUserRoleAssignment.role_id) || null;
  }, [selectedUserRoleAssignment]);

  const assignedUnit = useMemo(() => {
    if (!selectedUserRoleAssignment?.unit_id) return null;
    return INITIAL_UNITS.find((u) => u.id === selectedUserRoleAssignment.unit_id);
  }, [selectedUserRoleAssignment]);

  // Context for permission engine
  const permContext = useMemo(() => {
    return {
      userId: selectedUserId,
      roles: INITIAL_ROLES,
      userRoles: userRoles,
      permissions: INITIAL_PERMISSIONS,
      rolePermissions: INITIAL_ROLE_PERMISSIONS,
      overrides,
    };
  }, [selectedUserId, overrides, userRoles]);

  const handleSaveTeamAssignment = () => {
    const unitId = assignedUnitInput === 'global' ? null : Number(assignedUnitInput);
    const success = assignLeaderUnit(selectedUserId, unitId, assignedRoleInput);
    if (success) {
      setAssignSuccessMsg(
        language === 'ar'
          ? `تم تحديث دور وفريق (${selectedUser.full_name}) بنجاح!`
          : `Role & Team updated for (${selectedUser.full_name}) successfully!`
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
      unit_id: newLeaderUnitId === 'global' ? null : Number(newLeaderUnitId),
    });

    setSelectedUserId(created.id);
    setIsAddLeaderModalOpen(false);
    setNewLeaderName('');
    setNewLeaderEmail('');
    setNewLeaderPhone('');
    setAddLeaderSuccessMsg(
      language === 'ar'
        ? `تمت إضافة القائد (${created.full_name}) وتعيينه بنجاح!`
        : `Leader (${created.full_name}) registered and selected successfully!`
    );
    setTimeout(() => setAddLeaderSuccessMsg(null), 3500);
  };

  // Save overrides to state and localStorage
  const updateOverrides = (newOverrides: typeof overrides) => {
    setOverrides(newOverrides);
    try {
      localStorage.setItem('scouts_user_overrides', JSON.stringify(newOverrides));
    } catch {
      // ignore
    }
  };

  // Reset ALL overrides for this user back to Role Defaults
  const handleResetAllToRoleDefault = () => {
    const filtered = overrides.filter((ov: any) => ov.user_id !== selectedUserId);
    updateOverrides(filtered);
    setResetSuccessMsg(
      language === 'ar'
        ? `تمت استعادة الصلاحيات الافتراضية للدور القيادي (${selectedRole?.description.split(' - ')[0] || ''}) بنجاح.`
        : `All permissions reset to role defaults (${selectedRole?.description.split(' - ')[0] || ''}).`
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

  // Toggle a high-level capability module ON or OFF
  const handleToggleModule = (module: CapabilityModule, currentlyAllowed: boolean) => {
    const shouldEnable = !currentlyAllowed;
    const targetPermIds = INITIAL_PERMISSIONS.filter((p) => module.allKeys.includes(p.key)).map((p) => p.id);

    let nextOverrides = overrides.filter(
      (ov: any) => !(ov.user_id === selectedUserId && targetPermIds.includes(ov.permission_id))
    );

    // If enabling or disabling, add explicit overrides for the module keys
    targetPermIds.forEach((pId) => {
      nextOverrides.push({
        id: Date.now() + pId,
        user_id: selectedUserId,
        permission_id: pId,
        unit_id: targetUnitId,
        is_granted: shouldEnable,
      });
    });

    updateOverrides(nextOverrides);

    logAction({
      action_type: 'permission_overridden',
      title_ar: shouldEnable ? `تفعيل ميزة (${module.title_ar})` : `تعطيل ميزة (${module.title_ar})`,
      title_en: shouldEnable ? `Enabled (${module.title_en})` : `Disabled (${module.title_en})`,
      description_ar: `تم ضبط إتاحة ${module.title_ar} للقائد ${selectedUser.full_name} إلى: ${shouldEnable ? 'مفعلة' : 'معطلة'}`,
      description_en: `Set ${module.title_en} for ${selectedUser.full_name} to: ${shouldEnable ? 'Allowed' : 'Disabled'}`,
      unit_id: targetUnitId,
    });
  };

  // Reset a specific module to its role default
  const handleResetModule = (module: CapabilityModule) => {
    const targetPermIds = INITIAL_PERMISSIONS.filter((p) => module.allKeys.includes(p.key)).map((p) => p.id);
    const nextOverrides = overrides.filter(
      (ov: any) => !(ov.user_id === selectedUserId && targetPermIds.includes(ov.permission_id))
    );
    updateOverrides(nextOverrides);
  };

  // Granular override handler for the advanced view
  const handleSetGranularOverride = (permissionId: number, state: PermissionOverrideState) => {
    const filtered = overrides.filter(
      (ov: any) =>
        !(
          ov.user_id === selectedUserId &&
          ov.permission_id === permissionId &&
          (ov.unit_id === targetUnitId || ov.unit_id === null || ov.unit_id === undefined)
        )
    );

    if (state === 'inherited') {
      updateOverrides(filtered);
      return;
    }

    updateOverrides([
      ...filtered,
      {
        id: Date.now(),
        user_id: selectedUserId,
        permission_id: permissionId,
        unit_id: targetUnitId,
        is_granted: state === 'granted',
      },
    ]);
  };

  // Permission Guard
  if (!isSuperAdmin && !can('users.manage_roles')) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-200 dark:border-rose-800/60">
          <ShieldAlert className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {language === 'ar' ? 'وصول مقيّد: إدارة الصلاحيات' : 'Restricted Access: Leader Permissions'}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {language === 'ar'
            ? 'تعديل الصلاحيات وتعيين أدوار القادة متاح فقط لمدير النظام (System Admin).'
            : 'Leader permission assignments are restricted to the System Administrator.'}
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs transition-colors dark:bg-emerald-700 dark:hover:bg-emerald-600"
        >
          {language === 'ar' ? 'العودة إلى لوحة التحكم' : 'Return to Dashboard'}
        </Link>
      </div>
    );
  }

  // Count active custom tweaks for this leader
  const userOverridesCount = overrides.filter((ov: any) => ov.user_id === selectedUserId).length;

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
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          >
            {allUsers.map((u) => {
              const uRole = userRoles.find((ur) => ur.user_id === u.id);
              const roleObj = INITIAL_ROLES.find((r) => r.id === uRole?.role_id);
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

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === 'ar' ? 'الفريق المخصص' : 'Assigned Team'} *
                  </label>
                  <select
                    value={newLeaderUnitId}
                    onChange={(e) => setNewLeaderUnitId(e.target.value === 'global' ? 'global' : Number(e.target.value))}
                    className="w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="global">{language === 'ar' ? '🌐 كامل الفوج' : '🌐 All Teams'}</option>
                    {INITIAL_UNITS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {language === 'ar' ? u.name_ar : u.name_en}
                      </option>
                    ))}
                  </select>
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
              {assignedUnit ? (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {language === 'ar' ? assignedUnit.name_ar : assignedUnit.name_en}
                </span>
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
              <span>{language === 'ar' ? 'الدور القيادي والفريق المخصص' : 'Leadership Role & Team Assignment'}</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {language === 'ar'
                ? 'تحديد الدور الوظيفي للقائد والفريق أو المرحلة الكشفية التي يشرف عليها.'
                : 'Choose the leader’s primary role and assigned scout team or troop scope.'}
            </p>
          </div>

          {assignSuccessMsg && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{assignSuccessMsg}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Primary Role Dropdown */}
          <div className="md:col-span-5">
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

          {/* Assigned Unit Dropdown */}
          <div className="md:col-span-4">
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              {language === 'ar' ? 'الفريق / المرحلة المخصصة' : 'Assigned Scout Team'}
            </label>
            <select
              value={assignedUnitInput}
              onChange={(e) => setAssignedUnitInput(e.target.value === 'global' ? 'global' : Number(e.target.value))}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="global">
                {language === 'ar' ? '🌐 كامل الفوج' : '🌐 All Teams'}
              </option>
              {INITIAL_UNITS.map((u) => (
                <option key={u.id} value={u.id}>
                  {language === 'ar' ? u.name_ar : u.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Save Action */}
          <div className="md:col-span-3">
            <button
              type="button"
              onClick={handleSaveTeamAssignment}
              className="w-full py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{language === 'ar' ? 'حفظ الدور والفريق' : 'Save Role & Team'}</span>
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
            const isAllowed = checkPermission(permContext, module.primaryKey, targetUnitId);

            // Check if this module is customized for this leader
            const modulePermIds = INITIAL_PERMISSIONS.filter((p) => module.allKeys.includes(p.key)).map((p) => p.id);
            const isCustomized = overrides.some(
              (ov: any) => ov.user_id === selectedUserId && modulePermIds.includes(ov.permission_id)
            );

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
                            {language === 'ar' ? 'مخصصة للقائد' : 'Customized'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {language === 'ar' ? 'مشمولة بالدور' : 'Role Default'}
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
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
                  <div>
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
                  </div>

                  {/* Big Friendly Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleModule(module, isAllowed)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                      isAllowed
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
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
                const overrideState = getOverrideState(permContext, perm.id, targetUnitId);
                const isEffectiveAllowed = checkPermission(permContext, perm.key, targetUnitId);
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
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 font-semibold">
                            Override
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="inline-flex rounded-lg p-0.5 bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => handleSetGranularOverride(perm.id, 'inherited')}
                          className={`px-2 py-1 rounded transition-colors ${
                            overrideState === 'inherited'
                              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                          }`}
                        >
                          Role Default
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetGranularOverride(perm.id, 'granted')}
                          className={`px-2 py-1 rounded transition-colors ${
                            overrideState === 'granted'
                              ? 'bg-emerald-600 text-white'
                              : 'text-zinc-500 hover:text-emerald-600'
                          }`}
                        >
                          Grant (+)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetGranularOverride(perm.id, 'revoked')}
                          className={`px-2 py-1 rounded transition-colors ${
                            overrideState === 'revoked'
                              ? 'bg-rose-600 text-white'
                              : 'text-zinc-500 hover:text-rose-600'
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

