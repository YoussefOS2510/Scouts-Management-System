'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../lib/AuthContext';
import { INITIAL_UNITS } from '../../lib/data';
import {
  Users,
  Search,
  Phone,
  Church,
  HeartPulse,
  Lock,
  Eye,
  EyeOff,
  Compass,
  LayoutGrid,
  Columns,
  Table as TableIcon,
  CheckCircle2,
  UserPlus,
  Plus,
  X,
  Check,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { INITIAL_ROLES } from '../../lib/data';

export default function MembersDirectoryPage() {
  const { language, t } = useLanguage();
  const {
    currentUser,
    currentRole,
    currentUnit,
    isSuperAdmin,
    can,
    accessibleUnits,
    members,
    patrols,
    assignScoutPatrol,
    addMember,
    deleteMember,
    addLeader,
    deleteLeader,
    addPatrol,
    updatePatrol,
    reorderPatrols,
    deletePatrol,
    allUsers,
    userRoles,
    roles,
    isLoadingPermissions,
  } = useAuth();

  const [activeDirectoryTab, setActiveDirectoryTab] = useState<'scouts' | 'leaders'>('scouts');
  const [searchTerm, setSearchTerm] = useState('');
  const canViewAllUnits = isSuperAdmin || currentRole?.name === 'group_leader';
  const defaultUnitFilter = canViewAllUnits ? 'all' : (accessibleUnits.length > 0 ? accessibleUnits[0].id : 'all');
  const [selectedUnitId, setSelectedUnitId] = useState<number | 'all'>(defaultUnitFilter);
  const [showConfidential, setShowConfidential] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'board'>('table');
  const [patrolActionSuccess, setPatrolActionSuccess] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Deletion States & Modals
  const [memberToDelete, setMemberToDelete] = useState<any | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [leaderToDelete, setLeaderToDelete] = useState<any | null>(null);
  const [isDeletingLeader, setIsDeletingLeader] = useState(false);

  // Patrol Management States & Modals
  const [isAddPatrolOpen, setIsAddPatrolOpen] = useState(false);
  const [newPatrolNameAr, setNewPatrolNameAr] = useState('');
  const [newPatrolNameEn, setNewPatrolNameEn] = useState('');
  const [isSubmittingPatrol, setIsSubmittingPatrol] = useState(false);

  const [editingPatrol, setEditingPatrol] = useState<any | null>(null);
  const [editPatrolNameAr, setEditPatrolNameAr] = useState('');
  const [editPatrolNameEn, setEditPatrolNameEn] = useState('');
  const [isUpdatingPatrol, setIsUpdatingPatrol] = useState(false);

  const [patrolToDelete, setPatrolToDelete] = useState<any | null>(null);
  const [isDeletingPatrol, setIsDeletingPatrol] = useState(false);

  // Add Member Modal State
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [mNameAr, setMNameAr] = useState('');
  const [mNameEn, setMNameEn] = useState('');
  const [mUnitId, setMUnitId] = useState<number>(1);
  const [mPatrolId, setMPatrolId] = useState<number | 'none'>('none');
  const [mDob, setMDob] = useState('2015-01-01');
  const [mFatherPhone, setMFatherPhone] = useState('');
  const [mMotherPhone, setMMotherPhone] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mAddress, setMAddress] = useState('');
  const [mGrade, setMGrade] = useState('Grade 5');
  const [mSchool, setMSchool] = useState('');
  const [mConfession, setMConfession] = useState('');
  const [mNotes, setMNotes] = useState('');
  const [mPin, setMPin] = useState('1234');

  // Add Leader Modal State
  const [isAddLeaderOpen, setIsAddLeaderOpen] = useState(false);
  const [lName, setLName] = useState('');
  const [lEmail, setLEmail] = useState('');
  const [lPhone, setLPhone] = useState('');
  const [lRoleId, setLRoleId] = useState<number>(4); // Section Leader
  const [lUnitIds, setLUnitIds] = useState<number[]>([]);
  const [lIsGlobal, setLIsGlobal] = useState<boolean>(true);

  // Sync unit when user switches
  React.useEffect(() => {
    if (!canViewAllUnits) {
      if (accessibleUnits.length > 0) {
        setSelectedUnitId(accessibleUnits[0].id);
        setMUnitId(accessibleUnits[0].id);
      }
    } else {
      setSelectedUnitId('all');
    }
  }, [accessibleUnits, canViewAllUnits]);

  const canViewConfidential = isSuperAdmin || can('members.view_confidential', typeof selectedUnitId === 'number' ? selectedUnitId : currentUnit?.id);
  const canAddMember = isSuperAdmin || can('members.create_edit');
  const canAddLeader = isSuperAdmin || can('users.manage_roles');
  const canAccessMembers = isSuperAdmin || can('members.view') || can('members.create_edit');

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // If scoped leader, strictly force only their team(s)
      if (!canViewAllUnits && accessibleUnits.length > 0 && !accessibleUnits.some((u) => u.id === m.unit_id)) {
        return false;
      }

      const matchUnit = selectedUnitId === 'all' || m.unit_id === selectedUnitId;
      const matchSearch =
        m.full_name_ar.includes(searchTerm) ||
        (m.full_name_en && m.full_name_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
        m.member_code.toLowerCase().includes(searchTerm.toLowerCase());
      return matchUnit && matchSearch;
    });
  }, [searchTerm, selectedUnitId, isSuperAdmin, accessibleUnits, canViewAllUnits, members]);

  // Filtered leaders
  const filteredLeaders = useMemo(() => {
    return allUsers.filter((u) => {
      const leaderUserRoles = userRoles.filter((ur) => ur.user_id === u.id);
      const assignedUnits = leaderUserRoles.map((ur) => ur.unit_id);
      const matchUnit =
        selectedUnitId === 'all' ||
        assignedUnits.includes(null) ||
        (typeof selectedUnitId === 'number' && assignedUnits.includes(selectedUnitId));
      const matchSearch =
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.phone && u.phone.includes(searchTerm));
      return matchUnit && matchSearch;
    });
  }, [allUsers, userRoles, selectedUnitId, searchTerm]);

  // Handle Scout Deletion
  const handleConfirmDeleteMember = async () => {
    if (!memberToDelete) return;
    setIsDeletingMember(true);
    try {
      const ok = await deleteMember(memberToDelete.id);
      if (ok) {
        setActionSuccessMsg(
          language === 'ar'
            ? `تم حذف الكشاف (${memberToDelete.full_name_ar}) نهائياً من المنظومة`
            : `Scout (${memberToDelete.full_name_ar}) was permanently deleted`
        );
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    } finally {
      setIsDeletingMember(false);
      setMemberToDelete(null);
    }
  };

  // Handle Leader Deletion
  const handleConfirmDeleteLeader = async () => {
    if (!leaderToDelete) return;
    setIsDeletingLeader(true);
    try {
      const ok = await deleteLeader(leaderToDelete.id);
      if (ok) {
        setActionSuccessMsg(
          language === 'ar'
            ? `تم حذف حساب القائد (${leaderToDelete.full_name}) نهائياً من المنظومة`
            : `Leader account (${leaderToDelete.full_name}) was permanently deleted`
        );
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    } finally {
      setIsDeletingLeader(false);
      setLeaderToDelete(null);
    }
  };

  // Handle assigning patrol
  const handleAssignPatrol = (memberId: string, patrolId: number | null) => {
    const success = assignScoutPatrol(memberId, patrolId);
    if (success) {
      const scout = members.find((m) => m.id === memberId);
      const patrol = patrolId ? patrols.find((p) => p.id === patrolId) : null;
      setPatrolActionSuccess(
        language === 'ar'
          ? `تم تحديث طليعة الكشاف (${scout?.full_name_ar}) إلى: ${patrol ? patrol.name_ar : 'بدون طليعة'}`
          : `Patrol updated for (${scout?.full_name_ar}) to: ${patrol ? patrol.name_en : 'Unassigned'}`
      );
      setTimeout(() => setPatrolActionSuccess(null), 3500);
    }
  };

  // Handle Create Patrol
  const handleCreatePatrol = async (e: React.FormEvent, unitId: number) => {
    e.preventDefault();
    if (!newPatrolNameAr.trim()) return;
    setIsSubmittingPatrol(true);
    try {
      const created = await addPatrol(unitId, newPatrolNameAr.trim(), newPatrolNameEn.trim() || undefined);
      if (created) {
        setIsAddPatrolOpen(false);
        setNewPatrolNameAr('');
        setNewPatrolNameEn('');
        setActionSuccessMsg(
          language === 'ar'
            ? `تم إنشاء الطليعة (${created.name_ar}) بنجاح!`
            : `Patrol (${created.name_en || created.name_ar}) created successfully!`
        );
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    } finally {
      setIsSubmittingPatrol(false);
    }
  };

  // Handle Update Patrol Name
  const handleUpdatePatrol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatrol || !editPatrolNameAr.trim()) return;
    setIsUpdatingPatrol(true);
    try {
      const success = await updatePatrol(editingPatrol.id, editPatrolNameAr.trim(), editPatrolNameEn.trim() || undefined);
      if (success) {
        setEditingPatrol(null);
        setActionSuccessMsg(
          language === 'ar'
            ? `تم تحديث اسم الطليعة إلى (${editPatrolNameAr}) بنجاح!`
            : `Patrol updated to (${editPatrolNameEn || editPatrolNameAr}) successfully!`
        );
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    } finally {
      setIsUpdatingPatrol(false);
    }
  };

  // Handle Delete Patrol
  const handleConfirmDeletePatrol = async () => {
    if (!patrolToDelete) return;
    setIsDeletingPatrol(true);
    try {
      const success = await deletePatrol(patrolToDelete.id);
      if (success) {
        const deletedName = patrolToDelete.name_ar;
        setPatrolToDelete(null);
        setActionSuccessMsg(
          language === 'ar'
            ? `تم حذف طليعة (${deletedName}) وتحويل كشافيها لغير مسكنين بنجاح.`
            : `Patrol (${deletedName}) deleted and members unassigned successfully.`
        );
        setTimeout(() => setActionSuccessMsg(null), 4000);
      }
    } finally {
      setIsDeletingPatrol(false);
    }
  };

  // Handle Move / Reorder Patrol
  const handleMovePatrol = async (
    patrolId: number,
    direction: 'prev' | 'next',
    unitPatrols: any[],
    unitId: number
  ) => {
    const currIdx = unitPatrols.findIndex((p) => p.id === patrolId);
    if (currIdx === -1) return;
    const targetIdx = direction === 'prev' ? currIdx - 1 : currIdx + 1;
    if (targetIdx < 0 || targetIdx >= unitPatrols.length) return;

    const reordered = [...unitPatrols];
    const [moved] = reordered.splice(currIdx, 1);
    reordered.splice(targetIdx, 0, moved);

    const orderedIds = reordered.map((p) => p.id);
    await reorderPatrols(unitId, orderedIds);
  };

  // Submit Add Member
  const handleCreateMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mNameAr.trim() || !mFatherPhone.trim()) return;

    const unitObj = INITIAL_UNITS.find((u) => u.id === mUnitId);
    const codePrefix = unitObj ? unitObj.code.split('_')[0].toUpperCase() : 'SCOUT';
    const randomNum = Math.floor(100 + Math.random() * 900);
    const autoCode = `${codePrefix}-2026-${randomNum}`;

    const created = addMember({
      full_name_ar: mNameAr.trim(),
      full_name_en: mNameEn.trim() || undefined,
      member_code: autoCode,
      pin: mPin.trim() || '1234',
      unit_id: mUnitId,
      patrol_id: mPatrolId === 'none' ? null : Number(mPatrolId),
      date_of_birth: mDob,
      father_phone: mFatherPhone.trim(),
      mother_phone: mMotherPhone.trim() || undefined,
      member_phone: mPhone.trim() || undefined,
      address_ar: mAddress.trim() || 'القاهرة، مصر',
      academic_year: mGrade.trim(),
      school_or_college: mSchool.trim() || undefined,
      father_of_confession: mConfession.trim() || undefined,
      notes: mNotes.trim() || undefined,
      is_active: true,
    });

    setIsAddMemberOpen(false);
    setMNameAr('');
    setMNameEn('');
    setMFatherPhone('');
    setMMotherPhone('');
    setMPhone('');
    setMAddress('');
    setMNotes('');
    setMConfession('');

    setActionSuccessMsg(
      language === 'ar'
        ? `تم تسجيل الكشاف (${created.full_name_ar}) بكود [${created.member_code}] بنجاح!`
        : `Scout member (${created.full_name_ar}) registered with code [${created.member_code}]!`
    );
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Submit Add Leader
  const handleCreateLeaderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lName.trim() || !lEmail.trim()) return;

    const created = addLeader({
      full_name: lName.trim(),
      email: lEmail.trim(),
      phone: lPhone.trim(),
      role_id: lRoleId,
      unit_ids: lIsGlobal ? [] : lUnitIds,
    });

    setIsAddLeaderOpen(false);
    setLName('');
    setLEmail('');
    setLPhone('');
    setLUnitIds([]);
    setLIsGlobal(true);

    setActionSuccessMsg(
      language === 'ar'
        ? `تم تسجيل القائد (${created.full_name}) بنجاح!`
        : `Leader (${created.full_name}) registered successfully!`
    );
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Filtered patrols for selected modal unit
  const modalUnitPatrols = patrols.filter((p) => p.unit_id === mUnitId);

  if (isLoadingPermissions) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4 animate-fadeIn">
        <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center border border-neutral-200 dark:border-neutral-700 shadow-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
          {language === 'ar' ? 'جاري التحقق من الصلاحيات...' : 'Verifying leader permissions...'}
        </p>
      </div>
    );
  }

  if (!canAccessMembers) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4 animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center border border-amber-200 dark:border-amber-800/60 shadow-xs">
          <ShieldAlert className="w-7 h-7" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {language === 'ar' ? 'وصول مقيّد: دليل الأعضاء والكشافة' : 'Restricted Access: Members Directory'}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
          {language === 'ar'
            ? 'حسابك الحالي لا يمتلك صلاحيات استعراض كشوف الأعضاء أو تعديل بيانات الكشافة.'
            : 'Your current role does not have permission to view scout member rosters or manage profiles.'}
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold text-xs transition-colors shadow-xs cursor-pointer"
          >
            {language === 'ar' ? 'العودة للرئيسية' : 'Return to Dashboard'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* 1. DRIVE LOCATION PATH & VIEW CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#F0F4F9] dark:border-[#2D2F31]">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 text-sm text-[#444746] dark:text-[#C4C7C5]">
          <Link href="/" className="hover:text-[#0B57D0] transition-colors font-bold">
            SMSR
          </Link>
          <span className="text-[#747775]">{language === 'ar' ? '‹' : '›'}</span>
          <span className="text-[#1F1F1F] dark:text-[#E3E3E3] font-medium">
            {language === 'ar' ? 'دليل وسجل بيانات الأعضاء' : 'Members Directory'}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[#E9EEF6] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] font-mono ms-1">
            {filteredMembers.length}
          </span>
        </div>

        {/* Top Controls: Action Buttons, View Mode & Confidential Toggle */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Add Member Button */}
          {canAddMember && (
            <button
              onClick={() => setIsAddMemberOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? '＋ إضافة كشاف / عضو' : '+ Add Member'}</span>
            </button>
          )}

          {/* Add Leader Button */}
          {canAddLeader && (
            <button
              onClick={() => setIsAddLeaderOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? '＋ إضافة قائد' : '+ Add Leader'}</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-xl p-1 bg-[#F0F4F9] dark:bg-[#282A2C]">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#1F1F1F] text-[#0B57D0] shadow-xs'
                  : 'text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F]'
              }`}
              title={language === 'ar' ? 'جدول البيانات' : 'Data Table'}
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden md:inline">{language === 'ar' ? 'جدول' : 'Table'}</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-[#1F1F1F] text-[#0B57D0] shadow-xs'
                  : 'text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F]'
              }`}
              title={language === 'ar' ? 'بطاقات' : 'Cards'}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden md:inline">{language === 'ar' ? 'بطاقات' : 'Cards'}</span>
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-[#1F1F1F] text-[#0B57D0] shadow-xs'
                  : 'text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F]'
              }`}
              title={language === 'ar' ? 'تشكيل الطلائع' : 'Patrol Board'}
            >
              <Columns className="w-4 h-4" />
              <span className="hidden md:inline">{language === 'ar' ? 'طلائع' : 'Patrols'}</span>
            </button>
          </div>

          {/* Confidential Toggle Switch */}
          {canViewConfidential ? (
            <button
              onClick={() => setShowConfidential(!showConfidential)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                showConfidential
                  ? 'bg-[#FEF7EC] text-[#7A3F00] dark:bg-amber-950/40 dark:text-amber-300 border border-[#FFCD85]/50'
                  : 'bg-[#F0F4F9] text-[#444746] dark:bg-[#282A2C] dark:text-[#C4C7C5]'
              }`}
            >
              {showConfidential ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showConfidential ? (language === 'ar' ? 'إخفاء الحساس' : 'Hide Confidential') : (language === 'ar' ? 'إظهار الحساس' : 'Show Confidential')}</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-[#747775] bg-[#F0F4F9] dark:bg-[#282A2C] cursor-not-allowed">
              <Lock className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'البيانات مقفلة' : 'Locked'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccessMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={2} />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {patrolActionSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[#E8F0EC] dark:bg-[#1B4332]/40 border border-[#2D6A4F] text-[#1B4332] dark:text-[#86efac] text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#1B4332] dark:text-[#86efac] shrink-0" strokeWidth={2} />
          <span>{patrolActionSuccess}</span>
        </div>
      )}

      {/* Search & Scope Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Category Switcher Tab */}
        <div className="inline-flex rounded-lg p-1 bg-[#F0F4F9] dark:bg-[#282A2C] border border-zinc-200/60 dark:border-zinc-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveDirectoryTab('scouts')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeDirectoryTab === 'scouts'
                ? 'bg-white dark:bg-[#1F1F1F] text-[#0B57D0] shadow-xs'
                : 'text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'الكشافة والأشبال' : 'Scouts'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
              {filteredMembers.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveDirectoryTab('leaders')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeDirectoryTab === 'leaders'
                ? 'bg-white dark:bg-[#1F1F1F] text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'القادة والمساعدين' : 'Leaders'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono">
              {filteredLeaders.length}
            </span>
          </button>
        </div>

        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-500 absolute start-3 top-2.5" strokeWidth={2} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              activeDirectoryTab === 'leaders'
                ? language === 'ar'
                  ? 'بحث باسم القائد، البريد، أو الهاتف...'
                  : 'Search by leader name, email, or phone...'
                : language === 'ar'
                ? 'بحث باسم الكشاف، كود العضوية (SCT-0001)...'
                : 'Search by scout name or code...'
            }
            className="w-full ps-9 pe-3 py-2 rounded-lg border border-[#D5CFC5] dark:border-[#27342F] text-xs font-medium focus:ring-1 focus:ring-[#1B4332] focus:outline-none bg-white dark:bg-[#161D1A] text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
          />
        </div>

        {/* Unit Selector Filter */}
        <select
          value={selectedUnitId}
          onChange={(e) => setSelectedUnitId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          disabled={!canViewAllUnits && accessibleUnits.length <= 1}
          className={`border rounded-lg px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-[#1B4332] focus:outline-none transition-colors ${
            !canViewAllUnits && accessibleUnits.length <= 1
              ? 'bg-[#F1EFEA] dark:bg-[#1E2723] border-[#E2DED6] dark:border-[#27342F] text-stone-500 cursor-not-allowed'
              : 'bg-white dark:bg-[#161D1A] border-[#D5CFC5] dark:border-[#27342F] text-stone-900 dark:text-stone-100'
          }`}
        >
          {canViewAllUnits && (
            <option value="all">
              {language === 'ar' ? 'جميع الوحدات الكشفية (12 وحدة)' : 'All 12 Scout Units'}
            </option>
          )}
          {accessibleUnits.map((u) => (
            <option key={u.id} value={u.id}>
              {language === 'ar' ? u.name_ar : u.name_en}
            </option>
          ))}
        </select>
      </div>

      {/* Main Content: Data Table View (Directive 4.A) */}
      {activeDirectoryTab === 'leaders' ? (
        /* Leaders Directory Table View */
        <div className="bg-white dark:bg-[#121214] rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-xs font-medium text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-4 py-2.5 text-start font-medium">{language === 'ar' ? 'اسم القائد' : 'Leader Name'}</th>
                  <th className="px-4 py-2.5 text-start font-medium">{language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</th>
                  <th className="px-4 py-2.5 text-start font-medium">{language === 'ar' ? 'رقم الهاتف' : 'Phone'}</th>
                  <th className="px-4 py-2.5 text-start font-medium">{language === 'ar' ? 'الدور القيادي' : 'Primary Role'}</th>
                  <th className="px-4 py-2.5 text-start font-medium">{language === 'ar' ? 'الفرق والمراحل' : 'Assigned Units'}</th>
                  <th className="px-4 py-2.5 text-end font-medium">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-sm">
                {filteredLeaders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-xs text-zinc-400">
                      {language === 'ar' ? 'لا يوجد قادة مطابقين للبحث' : 'No leaders matching search'}
                    </td>
                  </tr>
                ) : (
                  filteredLeaders.map((leader) => {
                    const leaderUserRoles = userRoles.filter((ur) => ur.user_id === leader.id);
                    const firstRole = roles.find((r) => r.id === leaderUserRoles[0]?.role_id) || INITIAL_ROLES.find((r) => r.id === leaderUserRoles[0]?.role_id);
                    const isRoot = leader.email.toLowerCase() === 'admin@scouts.org';
                    const canDelete = (isSuperAdmin || can('users.manage_roles')) && !isRoot;

                    return (
                      <tr key={leader.id} className="hover:bg-zinc-50/75 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <span>{leader.full_name}</span>
                            {isRoot && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono">
                                {language === 'ar' ? 'مدير عام' : 'Root Admin'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-zinc-600 dark:text-zinc-400">
                          {leader.email}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-zinc-600 dark:text-zinc-400">
                          {leader.phone || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-medium border border-purple-200 dark:border-purple-800/50">
                            {firstRole?.name || 'Leader'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                          <div className="flex flex-wrap gap-1">
                            {leaderUserRoles.length === 0 || leaderUserRoles.some((ur) => ur.unit_id === null) ? (
                              <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[11px]">
                                {language === 'ar' ? 'كافة المراحل' : 'All Units'}
                              </span>
                            ) : (
                              leaderUserRoles.map((ur) => {
                                const uObj = INITIAL_UNITS.find((u) => u.id === ur.unit_id);
                                return (
                                  <span key={ur.id} className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[11px] border border-blue-200 dark:border-blue-900">
                                    {language === 'ar' ? uObj?.name_ar : uObj?.name_en}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-end whitespace-nowrap">
                          {canDelete ? (
                            <button
                              type="button"
                              onClick={() => setLeaderToDelete(leader)}
                              title={language === 'ar' ? 'حذف القائد من المنظومة' : 'Delete Leader'}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : isRoot ? (
                            <span className="text-[11px] text-zinc-400 italic">
                              {language === 'ar' ? 'محمي' : 'Protected'}
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white dark:bg-[#121214] rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-xs font-medium text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-4 py-2.5 text-start font-medium">{language === 'ar' ? 'الكود' : 'Code'}</th>
                  <th className="px-4 py-2.5 text-start font-medium">{language === 'ar' ? 'الاسم الكامل' : 'Scout Name'}</th>
                  <th className="px-4 py-2.5 text-start font-medium">{language === 'ar' ? 'المرحلة / الوحدة' : 'Unit'}</th>
                  <th className="px-4 py-2.5 text-start font-medium">{language === 'ar' ? 'الطليعة / السداسي' : 'Patrol / Six'}</th>
                  <th className="px-4 py-2.5 text-start font-medium">{language === 'ar' ? 'السنة الدراسية' : 'Grade'}</th>
                  <th className="px-4 py-2.5 text-start font-medium">{language === 'ar' ? 'هاتف ولي الأمر' : 'Emergency Contact'}</th>
                  {showConfidential && (
                    <th className="px-4 py-2.5 text-start font-medium">{language === 'ar' ? 'الرعاية الروحية' : 'Spiritual Care'}</th>
                  )}
                  <th className="px-4 py-2.5 text-end font-medium">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-sm">
                {filteredMembers.map((member) => {
                  const unit = INITIAL_UNITS.find((u) => u.id === member.unit_id);
                  const patrol = patrols.find((p) => p.id === member.patrol_id);
                  const unitPatrols = patrols.filter((p) => p.unit_id === member.unit_id);
                  const canManageScout = isSuperAdmin || can('members.create_edit', member.unit_id);

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-zinc-50/75 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                        {member.member_code}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100 leading-tight">
                          {member.full_name_ar}
                        </div>
                        {member.full_name_en && (
                          <div className="text-xs text-zinc-400 mt-0.5">{member.full_name_en}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          {language === 'ar' ? unit?.name_ar : unit?.name_en}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {canManageScout ? (
                          <select
                            value={member.patrol_id || ''}
                            onChange={(e) => {
                              const pId = e.target.value === '' ? null : Number(e.target.value);
                              handleAssignPatrol(member.id, pId);
                            }}
                            className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
                          >
                            <option value="">{language === 'ar' ? '⚠️ غير مسجل بطليعة' : '⚠️ Unassigned'}</option>
                            {unitPatrols.map((p) => (
                              <option key={p.id} value={p.id}>
                                {language === 'ar' ? p.name_ar : p.name_en}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-zinc-600 dark:text-zinc-400">
                            {patrol ? (language === 'ar' ? patrol.name_ar : patrol.name_en) : '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {member.academic_year}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs tabular-nums whitespace-nowrap">
                        <a href={`tel:${member.father_phone}`} className="text-emerald-800 dark:text-emerald-400 hover:underline">
                          {member.father_phone}
                        </a>
                      </td>
                      {showConfidential && (
                        <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                          <div className="flex items-center gap-1.5">
                            <span className="text-zinc-800 dark:text-zinc-200 font-medium">{member.father_of_confession || 'القمص متياس خليل'}</span>
                            <span className="text-zinc-400">&bull;</span>
                            <span className="text-zinc-500">{member.sunday_school_class}</span>
                          </div>
                          {member.notes && (
                            <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">{member.notes}</div>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 text-end whitespace-nowrap">
                        {canManageScout && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMemberToDelete(member);
                            }}
                            title={language === 'ar' ? 'حذف الكشاف من المنظومة' : 'Delete Scout'}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* Members Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredMembers.map((member) => {
            const unit = INITIAL_UNITS.find((u) => u.id === member.unit_id);
            const patrol = patrols.find((p) => p.id === member.patrol_id);
            const unitPatrols = patrols.filter((p) => p.unit_id === member.unit_id);
            const canManageScout = isSuperAdmin || can('members.create_edit', member.unit_id);

            return (
              <div
                key={member.id}
                className="bg-white dark:bg-[#121214] rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-3 flex flex-col justify-between"
              >
                <div>
                  {/* Header: Code & Unit & Actions */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-zinc-500 bg-zinc-50 dark:bg-zinc-800/60 px-1.5 py-0.2 rounded border border-zinc-200 dark:border-zinc-700">
                      {member.member_code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                        {language === 'ar' ? unit?.name_ar : unit?.name_en}
                      </span>
                      {canManageScout && (
                        <button
                          type="button"
                          onClick={() => setMemberToDelete(member)}
                          title={language === 'ar' ? 'حذف الكشاف من المنظومة' : 'Delete Scout'}
                          className="p-1 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Names */}
                  <div className="mt-2.5">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                      {member.full_name_ar}
                    </h3>
                    {member.full_name_en && (
                      <div className="text-xs text-zinc-400 font-medium">{member.full_name_en}</div>
                    )}
                  </div>

                  {/* Sub details: Academic Year */}
                  <div className="text-xs text-zinc-500 mt-1 flex flex-wrap gap-1.5">
                    <span>{member.academic_year}</span>
                    {member.school_or_college && (
                      <>
                        <span>&bull;</span>
                        <span>{member.school_or_college}</span>
                      </>
                    )}
                  </div>

                  {/* Interactive Patrol Selector / Tag */}
                  <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-zinc-500 flex items-center gap-1">
                      <Compass className="w-3 h-3 text-zinc-400" strokeWidth={1.5} />
                      <span>{language === 'ar' ? 'الطليعة:' : 'Patrol:'}</span>
                    </span>

                    {canManageScout ? (
                      <select
                        value={member.patrol_id || ''}
                        onChange={(e) => {
                          const pId = e.target.value === '' ? null : Number(e.target.value);
                          handleAssignPatrol(member.id, pId);
                        }}
                        className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition-colors cursor-pointer"
                      >
                        <option value="">{language === 'ar' ? '⚠️ غير مسجل بطليعة' : '⚠️ Unassigned'}</option>
                        {unitPatrols.map((p) => (
                          <option key={p.id} value={p.id}>
                            {language === 'ar' ? p.name_ar : p.name_en}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-zinc-700 dark:text-zinc-300">
                        {patrol ? (language === 'ar' ? patrol.name_ar : patrol.name_en) : '—'}
                      </span>
                    )}
                  </div>

                  {/* Emergency Contacts */}
                  <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5 font-mono tabular-nums">
                      <Phone className="w-3 h-3 text-zinc-400" strokeWidth={1.5} />
                      <span>{t('father_phone')}: </span>
                      <a href={`tel:${member.father_phone}`} className="font-medium hover:underline text-zinc-800 dark:text-zinc-200">
                        {member.father_phone}
                      </a>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="text-[11px] text-zinc-400 mt-1.5">
                    {member.address_ar}
                  </div>

                  {/* Confidential / Spiritual Info Box */}
                  {showConfidential && (
                    <div className="mt-2.5 p-2.5 rounded bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 text-xs space-y-0.5">
                      <div className="flex items-center gap-1 font-medium text-zinc-800 dark:text-zinc-200">
                        <Church className="w-3 h-3 text-zinc-500" strokeWidth={1.5} />
                        <span>{member.sunday_school_class || 'فصل مدارس الأحد'}</span>
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        <span>أب الاعتراف: </span>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{member.father_of_confession || 'القمص متياس خليل'}</span>
                      </div>
                      {member.notes && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 flex items-start gap-1">
                          <HeartPulse className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" strokeWidth={1.5} />
                          <span>{member.notes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Patrol Formation Board View */
        (() => {
          const boardUnitId = typeof selectedUnitId === 'number' ? selectedUnitId : (accessibleUnits[0]?.id || 5);
          const boardUnit = INITIAL_UNITS.find((u) => u.id === boardUnitId);
          const unitPatrols = patrols
            .filter((p) => p.unit_id === boardUnitId)
            .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
          const unitMembers = members.filter((m) => m.unit_id === boardUnitId);
          const unassignedMembers = unitMembers.filter(
            (m) => !m.patrol_id || !unitPatrols.some((p) => p.id === m.patrol_id)
          );
          const canManagePatrols = isSuperAdmin || can('members.create_edit', boardUnitId);

          return (
            <div className="space-y-4">
              {/* Board Header Banner */}
              <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-zinc-500" strokeWidth={1.5} />
                    <span>
                      {language === 'ar' ? 'لوحة توزيع طلائع مرحلة:' : 'Patrol Distribution Board:'}{' '}
                      {language === 'ar' ? boardUnit?.name_ar : boardUnit?.name_en}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    {language === 'ar'
                      ? 'توزيع الكشافين بين الطلائع، وإنشاء طلائع جديدة وتخصيص أسمائها وترتيب ظهورها.'
                      : 'Distribute scouts, create new patrols, customize names, and set display order.'}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                    {unitMembers.length} {language === 'ar' ? 'كشاف بالفريق' : 'Scouts in Unit'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-amber-700 dark:text-amber-400">
                    {unassignedMembers.length} {language === 'ar' ? 'غير موزعين' : 'Unassigned'}
                  </span>
                  {canManagePatrols && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewPatrolNameAr('');
                        setNewPatrolNameEn('');
                        setIsAddPatrolOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B57D0] hover:bg-[#0842a0] text-white text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'إضافة طليعة جديدة' : 'Add Patrol'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Patrols Columns Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {/* Each Patrol Column */}
                {unitPatrols.map((patrol, patrolIdx) => {
                  const pMembers = unitMembers.filter((m) => m.patrol_id === patrol.id);

                  return (
                    <div
                      key={patrol.id}
                      className="bg-white dark:bg-[#121214] rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col"
                    >
                      {/* Patrol Header */}
                      <div className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-1">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-[10px] font-mono font-bold">
                              #{patrolIdx + 1}
                            </span>
                            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs truncate">
                              {language === 'ar' ? patrol.name_ar : patrol.name_en || patrol.name_ar}
                            </h4>
                          </div>
                          {patrol.name_en && (
                            <span className="text-[10px] text-zinc-400 font-mono block truncate">
                              {language === 'ar' ? patrol.name_en : patrol.name_ar}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="px-2 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono font-medium text-[11px] border border-zinc-200 dark:border-zinc-700">
                            {pMembers.length}
                          </span>

                          {canManagePatrols && (
                            <div className="flex items-center gap-0.5 ml-1">
                              {/* Reorder: Move earlier/left */}
                              <button
                                type="button"
                                disabled={patrolIdx === 0}
                                onClick={() => handleMovePatrol(patrol.id, 'prev', unitPatrols, boardUnitId)}
                                title={language === 'ar' ? 'تقديم في الترتيب (لليمين)' : 'Move Earlier'}
                                className={`p-1 rounded text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors ${
                                  patrolIdx === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                                }`}
                              >
                                {language === 'ar' ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
                              </button>

                              {/* Reorder: Move later/right */}
                              <button
                                type="button"
                                disabled={patrolIdx === unitPatrols.length - 1}
                                onClick={() => handleMovePatrol(patrol.id, 'next', unitPatrols, boardUnitId)}
                                title={language === 'ar' ? 'تأخير في الترتيب (لليسار)' : 'Move Later'}
                                className={`p-1 rounded text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors ${
                                  patrolIdx === unitPatrols.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                                }`}
                              >
                                {language === 'ar' ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              </button>

                              {/* Edit Name */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPatrol(patrol);
                                  setEditPatrolNameAr(patrol.name_ar);
                                  setEditPatrolNameEn(patrol.name_en || '');
                                }}
                                title={language === 'ar' ? 'تعديل اسم الطليعة' : 'Edit Patrol Name'}
                                className="p-1 rounded text-zinc-500 hover:text-[#0B57D0] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Patrol */}
                              <button
                                type="button"
                                onClick={() => setPatrolToDelete(patrol)}
                                title={language === 'ar' ? 'حذف الطليعة' : 'Delete Patrol'}
                                className="p-1 rounded text-zinc-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Scouts List */}
                      <div className="p-2.5 space-y-1.5 flex-1 max-h-96 overflow-y-auto">
                        {pMembers.length === 0 ? (
                          <div className="text-center py-6 text-xs text-zinc-400">
                            {language === 'ar' ? 'لا يوجد كشافين بهذه الطليعة' : 'No scouts assigned'}
                          </div>
                        ) : (
                          pMembers.map((scout) => (
                            <div
                              key={scout.id}
                              className="p-2 rounded bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs"
                            >
                              <div>
                                <div className="font-medium text-zinc-900 dark:text-zinc-100 text-xs">
                                  {scout.full_name_ar}
                                </div>
                                <div className="text-[10px] font-mono text-zinc-400">
                                  {scout.member_code} &bull; {scout.academic_year}
                                </div>
                              </div>

                              <select
                                value={scout.patrol_id || ''}
                                onChange={(e) => {
                                  const pId = e.target.value === '' ? null : Number(e.target.value);
                                  handleAssignPatrol(scout.id, pId);
                                }}
                                className="text-[11px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-1.5 py-0.5 focus:outline-none cursor-pointer text-zinc-700 dark:text-zinc-300"
                              >
                                {unitPatrols.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {language === 'ar' ? p.name_ar : p.name_en}
                                  </option>
                                ))}
                                <option value="">{language === 'ar' ? 'إلغاء التعيين' : 'Unassign'}</option>
                              </select>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Unassigned Scouts Column */}
                <div className="bg-zinc-50/50 dark:bg-zinc-900/20 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 overflow-hidden flex flex-col">
                  <div className="px-3.5 py-2.5 bg-zinc-100/60 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-zinc-700 dark:text-zinc-300 text-xs">
                        {language === 'ar' ? '⚠️ غير مسجلين بطلائع' : '⚠️ Unassigned Scouts'}
                      </h4>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {language === 'ar' ? 'يحتاجون تسكين' : 'Needs Patrol Assignment'}
                      </span>
                    </div>
                    <span className="px-2 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 font-mono text-[11px] border border-amber-200 dark:border-amber-800">
                      {unassignedMembers.length}
                    </span>
                  </div>

                  <div className="p-2.5 space-y-1.5 flex-1 max-h-96 overflow-y-auto">
                    {unassignedMembers.length === 0 ? (
                      <div className="text-center py-6 text-xs text-zinc-400">
                        {language === 'ar' ? 'جميع الكشافين موزعون بطلائع' : 'All scouts assigned!'}
                      </div>
                    ) : (
                      unassignedMembers.map((scout) => (
                        <div
                          key={scout.id}
                          className="p-2 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="font-medium text-zinc-900 dark:text-zinc-100 text-xs">
                              {scout.full_name_ar}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-400">
                              {scout.member_code}
                            </div>
                          </div>

                          <select
                            value=""
                            onChange={(e) => {
                              const pId = e.target.value === '' ? null : Number(e.target.value);
                              handleAssignPatrol(scout.id, pId);
                            }}
                            className="text-[11px] bg-emerald-800 text-white border-0 rounded px-2 py-1 focus:outline-none cursor-pointer"
                          >
                            <option value="">{language === 'ar' ? '+ تسكين بطليعة' : '+ Assign Patrol'}</option>
                            {unitPatrols.map((p) => (
                              <option key={p.id} value={p.id}>
                                {language === 'ar' ? p.name_ar : p.name_en}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      )}

      {/* ======================================================== */}
      {/* 2. ADD MEMBER MODAL                                      */}
      {/* ======================================================== */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl max-w-xl w-full p-4 sm:p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto sm:my-8 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    {language === 'ar' ? 'إضافة كشاف / شبل جديد' : 'Add New Scout Member'}
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    {language === 'ar' ? 'تسجيل كشاف جديد وتعيينه بالوحدة والطليعة' : 'Register a new scout into troop rosters'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMemberSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pe-1">
              {/* Section: Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === 'ar' ? 'الاسم بالكامل (عربي)' : 'Full Name (Arabic)'} *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={mNameAr}
                    onChange={(e) => setMNameAr(e.target.value)}
                    placeholder="مثال: يوسف مينا عادل"
                    className="w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === 'ar' ? 'الاسم بالإنجليزي (اختياري)' : 'Full Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={mNameEn}
                    onChange={(e) => setMNameEn(e.target.value)}
                    placeholder="e.g. Youssef Mina Adel"
                    className="w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Section: Unit & Patrol */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === 'ar' ? 'الفريق / المرحلة الكشفية' : 'Scout Team / Unit'} *
                  </label>
                  <select
                    value={mUnitId}
                    onChange={(e) => {
                      setMUnitId(Number(e.target.value));
                      setMPatrolId('none');
                    }}
                    className="w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {INITIAL_UNITS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {language === 'ar' ? u.name_ar : u.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === 'ar' ? 'الطليعة / السداسي' : 'Patrol'}
                  </label>
                  <select
                    value={mPatrolId}
                    onChange={(e) => setMPatrolId(e.target.value === 'none' ? 'none' : Number(e.target.value))}
                    className="w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">{language === 'ar' ? 'بدون طليعة (حاليًا)' : 'Unassigned'}</option>
                    {modalUnitPatrols.map((p) => (
                      <option key={p.id} value={p.id}>
                        {language === 'ar' ? p.name_ar : p.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === 'ar' ? 'الرمز السري للدخول' : 'Login PIN'}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={mPin}
                    onChange={(e) => setMPin(e.target.value)}
                    placeholder="1234"
                    className="w-full text-xs font-mono rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Section: Birth Date & School */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'} *
                  </label>
                  <input
                    type="date"
                    required
                    value={mDob}
                    onChange={(e) => setMDob(e.target.value)}
                    className="w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === 'ar' ? 'المرحلة الدراسية' : 'Grade'}
                  </label>
                  <input
                    type="text"
                    value={mGrade}
                    onChange={(e) => setMGrade(e.target.value)}
                    placeholder="e.g. Grade 5, Prep 2"
                    className="w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === 'ar' ? 'المدرسة / الكلية' : 'School'}
                  </label>
                  <input
                    type="text"
                    value={mSchool}
                    onChange={(e) => setMSchool(e.target.value)}
                    placeholder="اسم المدرسة"
                    className="w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Section: Phones */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === 'ar' ? 'هاتف ولي الأمر (الأب)' : 'Father Phone'} *
                  </label>
                  <input
                    type="tel"
                    required
                    value={mFatherPhone}
                    onChange={(e) => setMFatherPhone(e.target.value)}
                    placeholder="+2010..."
                    className="w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === 'ar' ? 'هاتف الأم' : 'Mother Phone'}
                  </label>
                  <input
                    type="tel"
                    value={mMotherPhone}
                    onChange={(e) => setMMotherPhone(e.target.value)}
                    placeholder="+2011..."
                    className="w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === 'ar' ? 'هاتف الكشاف' : 'Scout Phone'}
                  </label>
                  <input
                    type="tel"
                    value={mPhone}
                    onChange={(e) => setMPhone(e.target.value)}
                    placeholder="+2012..."
                    className="w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Section: Address */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  {language === 'ar' ? 'العنوان' : 'Home Address'}
                </label>
                <input
                  type="text"
                  value={mAddress}
                  onChange={(e) => setMAddress(e.target.value)}
                  placeholder="شارع، منطقة، مدينة"
                  className="w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Section: Confidential Spiritual & Medical */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                <div>
                  <label className="block text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
                    {language === 'ar' ? 'أب الاعتراف (سرّي)' : 'Father of Confession'}
                  </label>
                  <input
                    type="text"
                    value={mConfession}
                    onChange={(e) => setMConfession(e.target.value)}
                    placeholder="مثال: أبونا بيشوي"
                    className="w-full text-xs rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">
                    {language === 'ar' ? 'ملاحظات طبية أو خاصة' : 'Medical Notes / Alerts'}
                  </label>
                  <input
                    type="text"
                    value={mNotes}
                    onChange={(e) => setMNotes(e.target.value)}
                    placeholder="حساسية، علاج دائم، إلخ."
                    className="w-full text-xs rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!mNameAr.trim() || !mFatherPhone.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'حفظ وإضافة الكشاف' : 'Save & Register Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. ADD LEADER MODAL                                      */}
      {/* ======================================================== */}
      {isAddLeaderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-auto sm:my-8 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    {language === 'ar' ? 'إضافة قائد جديد للمنظومة' : 'Add New Leader'}
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    {language === 'ar' ? 'تسجيل قائد وتعيين دوره والفريق المخصص له' : 'Register a leader and set role and team'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddLeaderOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLeaderSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  {language === 'ar' ? 'اسم القائد بالكامل' : 'Leader Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={lName}
                  onChange={(e) => setLName(e.target.value)}
                  placeholder="e.g. Mena Maher, Peter Shoukry..."
                  className="w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  {language === 'ar' ? 'البريد الإلكتروني (حساب الدخول)' : 'Email Address (Login)'} *
                </label>
                <input
                  type="email"
                  required
                  value={lEmail}
                  onChange={(e) => setLEmail(e.target.value)}
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
                  value={lPhone}
                  onChange={(e) => setLPhone(e.target.value)}
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
                    value={lRoleId}
                    onChange={(e) => setLRoleId(Number(e.target.value))}
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
                      {lIsGlobal
                        ? (language === 'ar' ? 'نطاق عام (كامل الفوج)' : 'All Teams')
                        : `${lUnitIds.length} ${language === 'ar' ? 'فرق محددة' : 'teams selected'}`}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 max-h-36 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setLIsGlobal(true);
                        setLUnitIds([]);
                      }}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                        lIsGlobal
                          ? 'bg-purple-600 text-white font-bold'
                          : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {language === 'ar' ? '🌐 كامل الفوج' : '🌐 All Teams'}
                    </button>
                    {INITIAL_UNITS.map((u) => {
                      const isSelected = !lIsGlobal && lUnitIds.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setLIsGlobal(false);
                            setLUnitIds((prev) =>
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
                  onClick={() => setIsAddLeaderOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!lName.trim() || !lEmail.trim()}
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

      {/* Delete Member Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#121214] rounded-2xl border border-red-200 dark:border-red-900/60 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {language === 'ar' ? 'تأكيد حذف الكشاف من المنظومة' : 'Confirm Scout Deletion'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                {language === 'ar'
                  ? `هل أنت متأكد من حذف الكشاف (${memberToDelete.full_name_ar}) بكود [${memberToDelete.member_code}]؟ سيتم حذف بيانات العضوية وسجلات الحضور الخاصة به بشكل نهائي من قاعدة البيانات.`
                  : `Are you sure you want to delete scout (${memberToDelete.full_name_ar}) [${memberToDelete.member_code}]? Their membership profile and attendance history will be permanently deleted.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                disabled={isDeletingMember}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMember}
                disabled={isDeletingMember}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeletingMember && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{language === 'ar' ? 'نعم، حذف نهائي' : 'Yes, Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Leader Confirmation Modal */}
      {leaderToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#121214] rounded-2xl border border-red-200 dark:border-red-900/60 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {language === 'ar' ? 'تأكيد حذف حساب القائد' : 'Confirm Leader Deletion'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                {language === 'ar'
                  ? `هل أنت متأكد من حذف حساب القائد (${leaderToDelete.full_name}) [${leaderToDelete.email}]؟ سيتم إلغاء كافة صلاحياته وإزالة أدواره الإدارية نهائياً من قاعدة البيانات.`
                  : `Are you sure you want to delete leader account (${leaderToDelete.full_name}) [${leaderToDelete.email}]? Their roles, permissions, and account will be permanently deleted.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setLeaderToDelete(null)}
                disabled={isDeletingLeader}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteLeader}
                disabled={isDeletingLeader}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeletingLeader && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{language === 'ar' ? 'نعم، حذف نهائي' : 'Yes, Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Patrol Modal */}
      {isAddPatrolOpen && (() => {
        const boardUnitId = typeof selectedUnitId === 'number' ? selectedUnitId : (accessibleUnits[0]?.id || 5);
        const boardUnit = INITIAL_UNITS.find((u) => u.id === boardUnitId);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-[#0B57D0] flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {language === 'ar' ? 'إضافة طليعة جديدة' : 'Create New Patrol'}
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-medium">
                      {language === 'ar' ? boardUnit?.name_ar : boardUnit?.name_en}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddPatrolOpen(false)}
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={(e) => handleCreatePatrol(e, boardUnitId)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {language === 'ar' ? 'اسم الطليعة / السداسي بالعربية *' : 'Patrol Name (Arabic) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newPatrolNameAr}
                    onChange={(e) => setNewPatrolNameAr(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: طليعة النسور / سداسي الفهد' : 'e.g. طليعة النسور'}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#0B57D0]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {language === 'ar' ? 'اسم الطليعة بالإنجليزية (اختياري)' : 'Patrol Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={newPatrolNameEn}
                    onChange={(e) => setNewPatrolNameEn(e.target.value)}
                    placeholder="e.g. Eagles Patrol"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#0B57D0]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setIsAddPatrolOpen(false)}
                    className="px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    {language === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={!newPatrolNameAr.trim() || isSubmittingPatrol}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B57D0] hover:bg-[#0842a0] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingPatrol ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>{language === 'ar' ? 'إنشاء الطليعة' : 'Create Patrol'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Edit Patrol Modal */}
      {editingPatrol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-[#0B57D0] flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {language === 'ar' ? 'تعديل اسم الطليعة' : 'Edit Patrol Name'}
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    {language === 'ar' ? editingPatrol.name_ar : editingPatrol.name_en || editingPatrol.name_ar}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPatrol(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePatrol} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {language === 'ar' ? 'اسم الطليعة بالعربية *' : 'Patrol Name (Arabic) *'}
                </label>
                <input
                  type="text"
                  required
                  value={editPatrolNameAr}
                  onChange={(e) => setEditPatrolNameAr(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#0B57D0]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {language === 'ar' ? 'اسم الطليعة بالإنجليزية (اختياري)' : 'Patrol Name (English)'}
                </label>
                <input
                  type="text"
                  value={editPatrolNameEn}
                  onChange={(e) => setEditPatrolNameEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-1 focus:ring-[#0B57D0]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingPatrol(null)}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={!editPatrolNameAr.trim() || isUpdatingPatrol}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0B57D0] hover:bg-[#0842a0] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isUpdatingPatrol ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{language === 'ar' ? 'حفظ التعديل' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Patrol Confirmation Modal */}
      {patrolToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#121214] rounded-2xl border border-red-200 dark:border-red-900/60 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                {language === 'ar' ? 'تأكيد حذف الطليعة' : 'Confirm Patrol Deletion'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                {language === 'ar'
                  ? `هل أنت متأكد من حذف طليعة (${patrolToDelete.name_ar})؟ لن يتم حذف أي كشاف، وسيتم تحويل كافة أعضاء هذه الطليعة تلقائياً إلى قائمة الكشافين غير المسكنين لإعادة توزيعهم.`
                  : `Are you sure you want to delete patrol (${patrolToDelete.name_ar})? No scout records will be deleted; all assigned members will be moved to the unassigned list.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPatrolToDelete(null)}
                disabled={isDeletingPatrol}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePatrol}
                disabled={isDeletingPatrol}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeletingPatrol && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{language === 'ar' ? 'نعم، حذف الطليعة' : 'Yes, Delete Patrol'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
