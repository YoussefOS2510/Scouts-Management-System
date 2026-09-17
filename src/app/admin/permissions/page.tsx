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
  Lock,
  Unlock,
  RotateCcw,
  Info,
  CheckCircle,
  XCircle,
  Users,
} from 'lucide-react';

export default function PermissionsMatrixPage() {
  const { language, t } = useLanguage();
  const { isSuperAdmin, can, logAction, userRoles, assignLeaderUnit } = useAuth();

  const [selectedUserId, setSelectedUserId] = useState<string>('u4'); // Default to Andrew Nabil (Assistant Leader with overrides)
  const [targetUnitId, setTargetUnitId] = useState<number>(5); // Scouts A

  // Overrides mutable state
  const [overrides, setOverrides] = useState(INITIAL_USER_OVERRIDES);

  // Local state for team/role assignment editing
  const [assignedUnitInput, setAssignedUnitInput] = useState<number | 'global'>('global');
  const [assignedRoleInput, setAssignedRoleInput] = useState<number>(3);
  const [assignSuccessMsg, setAssignSuccessMsg] = useState<string | null>(null);

  const selectedUser = useMemo(() => {
    return INITIAL_USERS.find((u) => u.id === selectedUserId) || INITIAL_USERS[0];
  }, [selectedUserId]);

  const selectedUserRoleAssignment = useMemo(() => {
    return userRoles.find((ur) => ur.user_id === selectedUserId);
  }, [selectedUserId, userRoles]);

  // Sync inputs when selected user changes or roles update
  useEffect(() => {
    if (selectedUserRoleAssignment) {
      setAssignedUnitInput(selectedUserRoleAssignment.unit_id ?? 'global');
      setAssignedRoleInput(selectedUserRoleAssignment.role_id);
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
          ? `تم تحديث تعيين الفريق للقائد (${selectedUser.full_name}) بنجاح!`
          : `Team assignment updated for (${selectedUser.full_name}) successfully!`
      );
      setTimeout(() => setAssignSuccessMsg(null), 4000);
    }
  };

  // Handle setting override state: 'inherited' | 'granted' | 'revoked'
  const handleSetOverride = (permissionId: number, state: PermissionOverrideState) => {
    const perm = INITIAL_PERMISSIONS.find((p) => p.id === permissionId);
    setOverrides((prev) => {
      // Remove existing override for this user & permission
      const filtered = prev.filter(
        (ov) =>
          !(
            ov.user_id === selectedUserId &&
            ov.permission_id === permissionId &&
            (ov.unit_id === targetUnitId || ov.unit_id === null || ov.unit_id === undefined)
          )
      );

      if (state === 'inherited') {
        return filtered;
      }

      return [
        ...filtered,
        {
          id: Date.now(),
          user_id: selectedUserId,
          permission_id: permissionId,
          unit_id: targetUnitId,
          is_granted: state === 'granted',
        },
      ];
    });

    logAction({
      action_type: 'permission_overridden',
      title_ar: `تعديل صلاحية مخصصة (${state === 'granted' ? 'منح إجباري' : state === 'revoked' ? 'حجب إجباري' : 'استعادة موروث'})`,
      title_en: `Permission Override (${state})`,
      description_ar: `تم ضبط الصلاحية (${perm?.key}) للقائد ${selectedUser.full_name}: ${state}`,
      description_en: `Adjusted permission (${perm?.key}) for ${selectedUser.full_name}: ${state}`,
      unit_id: targetUnitId,
      metadata: { target_user: selectedUserId, permission_key: perm?.key, state },
    });
  };

  // Group permissions by category
  const categories = ['members', 'attendance', 'inventory', 'media', 'admin'] as const;

  const categoryLabels = {
    members: { ar: 'إدارة الأعضاء والبيانات السرية', en: 'Members & Confidential Data' },
    attendance: { ar: 'الحضور والانصراف والتقارير', en: 'Attendance & Reports' },
    inventory: { ar: 'مهمات العهدة والمخزن والحجوزات', en: 'Equipment & Inventory' },
    media: { ar: 'الوسائط والأرشيف وGoogle Drive', en: 'Media & Google Drive' },
    admin: { ar: 'إدارة النظام والأدوار', en: 'System Administration' },
  };

  // Permission Guard
  if (!isSuperAdmin && !can('users.manage_roles')) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 mx-auto flex items-center justify-center border border-rose-200 dark:border-rose-800/60">
          <ShieldAlert className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          {language === 'ar' ? 'وصول مقيّد: مصفوفة الصلاحيات' : 'Restricted Access: Permissions Matrix'}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {language === 'ar'
            ? 'تعديل الصلاحيات المخصصة وتعيين الأدوار متاح فقط لقائد الفوج (Group Leader).'
            : 'Custom permission overrides and role adjustments are restricted to the Group Leader.'}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#121214] p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" strokeWidth={1.5} />
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              {t('leader_matrix')}
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {language === 'ar'
              ? 'نظام الصلاحيات الهجين: أدوار أساسية محددة مسبقاً مع إمكانية التجاوز الفردي لكل قائد (تفعيل أو حجب)'
              : 'Hybrid Scoped RBAC with direct per-leader granular permission overrides (Grant / Revoke).'}
          </p>
        </div>

        {/* Leader Selector Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-1">{t('select_leader')}</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-purple-600 focus:outline-none"
            >
              {INITIAL_USERS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.email})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leader Profile Summary Card */}
      <div className="p-5 rounded-lg bg-zinc-900 dark:bg-zinc-900/80 text-zinc-100 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200">
            <UserCheck className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-base font-semibold text-zinc-100">{selectedUser.full_name}</div>
            <div className="text-xs text-zinc-400 flex flex-wrap gap-2 mt-0.5">
              <span>{selectedUser.email}</span>
              <span>•</span>
              <span className="font-mono tabular-nums text-zinc-300">{selectedUser.phone}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                {selectedRole ? selectedRole.description.split(' - ')[0] : 'No Role'}
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
                {assignedUnit ? `${t('assigned_scope')}: ${language === 'ar' ? assignedUnit.name_ar : assignedUnit.name_en}` : (language === 'ar' ? 'نطاق عام (فوج كامل)' : 'Global Organization Scope')}
              </span>
            </div>
          </div>
        </div>

        {/* Resolution rule helper banner */}
        <div className="sm:max-w-xs text-xs text-zinc-400 bg-zinc-800/60 p-3 rounded-md border border-zinc-700/60">
          <div className="flex items-center gap-1.5 font-medium text-zinc-200 mb-1">
            <Info className="w-3.5 h-3.5 text-zinc-400" strokeWidth={1.5} />
            <span>قاعدة أولوية الحسم</span>
          </div>
          <p className="text-xs leading-relaxed text-zinc-400">
            {language === 'ar'
              ? 'التجاوز المباشر (منح إجباري / حجب إجباري) يتفوق دائمًا على الصلاحيات الموروثة من الدور الأساسي للقائد.'
              : 'Direct per-user overrides take absolute precedence over role-inherited permissions.'}
          </p>
        </div>
      </div>

      {/* Leader Team & Role Assignment Card */}
      <div className="p-5 rounded-lg bg-white dark:bg-[#121214] border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700 dark:text-emerald-400" strokeWidth={1.5} />
              <span>{language === 'ar' ? 'تعيين وتعديل مرحلة وفريق القائد' : 'Leader Team & Stage Assignment'}</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {language === 'ar'
                ? 'يحدد هذا التعيين المرحلة الكشفية أو الفريق الذي يديره القائد ونطاق ظهوره في الكشوف والعهد والطلائع.'
                : 'Sets the scout unit/team assigned to this leader and their operational scope.'}
            </p>
          </div>

          {assignSuccessMsg && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={1.5} />
              <span>{assignSuccessMsg}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Unit Dropdown */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {language === 'ar' ? 'الفريق / المرحلة المخصصة' : 'Assigned Scout Unit'}
            </label>
            <select
              value={assignedUnitInput}
              onChange={(e) => setAssignedUnitInput(e.target.value === 'global' ? 'global' : Number(e.target.value))}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:outline-none"
            >
              <option value="global">
                {language === 'ar' ? '🌐 نطاق عام (كامل الفوج - قيادة عامة)' : '🌐 Global Scope (All Units)'}
              </option>
              {INITIAL_UNITS.map((u) => (
                <option key={u.id} value={u.id}>
                  {language === 'ar' ? u.name_ar : u.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Primary Role Dropdown */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              {language === 'ar' ? 'الدور القيادي الأساسي' : 'Primary Leadership Role'}
            </label>
            <select
              value={assignedRoleInput}
              onChange={(e) => setAssignedRoleInput(Number(e.target.value))}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:outline-none"
            >
              {INITIAL_ROLES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.description.split(' - ')[0]}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Action */}
          <div>
            <button
              type="button"
              onClick={handleSaveTeamAssignment}
              className="w-full py-2 px-4 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer dark:bg-emerald-700 dark:hover:bg-emerald-600"
            >
              <CheckCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>{language === 'ar' ? 'تثبيت تعيين الفريق' : 'Confirm Team Assignment'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Permissions Matrix by Category - Clean Top-to-Bottom Tabular Grid with Sticky Headers */}
      <div className="space-y-6">
        {categories.map((catKey) => {
          const categoryPermissions = INITIAL_PERMISSIONS.filter((p) => p.category === catKey);
          if (categoryPermissions.length === 0) return null;

          return (
            <div
              key={catKey}
              className="bg-white dark:bg-[#121214] rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden"
            >
              {/* Category Header */}
              <div className="px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/90 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
                  {categoryLabels[catKey][language]}
                </h3>
                <span className="text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                  {categoryPermissions.length} {language === 'ar' ? 'صلاحيات' : 'permissions'}
                </span>
              </div>

              {/* Tabular Rows */}
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {categoryPermissions.map((perm) => {
                  const overrideState = getOverrideState(permContext, perm.id, targetUnitId);
                  const isEffectiveAllowed = checkPermission(permContext, perm.key, targetUnitId);
                  const isOverridden = overrideState !== 'inherited';

                  return (
                    <div
                      key={perm.id}
                      className="px-4 py-3 hover:bg-zinc-50/75 dark:hover:bg-zinc-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm"
                    >
                      {/* Permission Description */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                            {perm.key}
                          </span>
                          <span className="font-medium text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm">
                            {language === 'ar' ? perm.description_ar : perm.description_en}
                          </span>
                          {isOverridden && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                              {language === 'ar' ? 'تجاوز مخصص' : 'Manual Override'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {language === 'ar' ? perm.description_en : perm.description_ar}
                        </div>
                      </div>

                      {/* 3-State Segmented Control: Inherited (Role) | Granted (+) | Revoked (-) */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="inline-flex rounded-md p-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                          {/* Inherited Option */}
                          <button
                            type="button"
                            onClick={() => handleSetOverride(perm.id, 'inherited')}
                            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                              overrideState === 'inherited'
                                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs border border-zinc-200/80 dark:border-zinc-700'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                            }`}
                            title="Inherit from role"
                          >
                            <RotateCcw className="w-3 h-3" strokeWidth={1.5} />
                            <span>{t('override_inherited')}</span>
                          </button>

                          {/* Force Grant Option */}
                          <button
                            type="button"
                            onClick={() => handleSetOverride(perm.id, 'granted')}
                            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                              overrideState === 'granted'
                                ? 'bg-emerald-800 text-white dark:bg-emerald-700'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-400'
                            }`}
                            title="Force Enable for this leader"
                          >
                            <Unlock className="w-3 h-3" strokeWidth={1.5} />
                            <span>{t('override_granted')} (+)</span>
                          </button>

                          {/* Force Revoke Option */}
                          <button
                            type="button"
                            onClick={() => handleSetOverride(perm.id, 'revoked')}
                            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                              overrideState === 'revoked'
                                ? 'bg-rose-800 text-white dark:bg-rose-700'
                                : 'text-zinc-500 dark:text-zinc-400 hover:text-rose-700 dark:hover:text-rose-400'
                            }`}
                            title="Force Disable for this leader"
                          >
                            <Lock className="w-3 h-3" strokeWidth={1.5} />
                            <span>{t('override_revoked')} (-)</span>
                          </button>
                        </div>

                        {/* Effective Status Pill */}
                        <div
                          className={`w-20 justify-center px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${
                            isEffectiveAllowed
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60'
                              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60'
                          }`}
                        >
                          {isEffectiveAllowed ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                              <span>{t('allowed')}</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" strokeWidth={1.5} />
                              <span>{t('denied')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
