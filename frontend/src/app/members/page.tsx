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
    addLeader,
  } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const canViewAllUnits = isSuperAdmin || currentRole?.name === 'group_leader';
  const defaultUnitFilter = canViewAllUnits ? 'all' : (accessibleUnits.length > 0 ? accessibleUnits[0].id : 'all');
  const [selectedUnitId, setSelectedUnitId] = useState<number | 'all'>(defaultUnitFilter);
  const [showConfidential, setShowConfidential] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'board'>('table');
  const [patrolActionSuccess, setPatrolActionSuccess] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

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
  const [lUnitId, setLUnitId] = useState<number | 'global'>('global');

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

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // If scoped leader, strictly force only their team
      if (!canViewAllUnits && currentUnit && m.unit_id !== currentUnit.id) {
        return false;
      }

      const matchUnit = selectedUnitId === 'all' || m.unit_id === selectedUnitId;
      const matchSearch =
        m.full_name_ar.includes(searchTerm) ||
        (m.full_name_en && m.full_name_en.toLowerCase().includes(searchTerm.toLowerCase())) ||
        m.member_code.toLowerCase().includes(searchTerm.toLowerCase());
      return matchUnit && matchSearch;
    });
  }, [searchTerm, selectedUnitId, isSuperAdmin, currentUnit, members]);

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
      unit_id: lUnitId === 'global' ? null : Number(lUnitId),
    });

    setIsAddLeaderOpen(false);
    setLName('');
    setLEmail('');
    setLPhone('');

    setActionSuccessMsg(
      language === 'ar'
        ? `تم تسجيل القائد (${created.full_name}) بنجاح!`
        : `Leader (${created.full_name}) registered successfully!`
    );
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Filtered patrols for selected modal unit
  const modalUnitPatrols = patrols.filter((p) => p.unit_id === mUnitId);

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* 1. DRIVE LOCATION PATH & VIEW CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#F0F4F9] dark:border-[#2D2F31]">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-1.5 text-sm text-[#444746] dark:text-[#C4C7C5]">
          <Link href="/" className="hover:text-[#0B57D0] transition-colors">
            {language === 'ar' ? 'منظومة الفوج' : 'Scout Drive'}
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
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-500 absolute start-3 top-2.5" strokeWidth={2} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              language === 'ar'
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
          disabled={!canViewAllUnits && !!currentUnit}
          className={`border rounded-lg px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-[#1B4332] focus:outline-none transition-colors ${
            !canViewAllUnits && currentUnit
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
      {viewMode === 'table' ? (
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
                  {/* Header: Code & Unit */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-zinc-500 bg-zinc-50 dark:bg-zinc-800/60 px-1.5 py-0.2 rounded border border-zinc-200 dark:border-zinc-700">
                      {member.member_code}
                    </span>
                    <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                      {language === 'ar' ? unit?.name_ar : unit?.name_en}
                    </span>
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
          const unitPatrols = patrols.filter((p) => p.unit_id === boardUnitId);
          const unitMembers = members.filter((m) => m.unit_id === boardUnitId);
          const unassignedMembers = unitMembers.filter(
            (m) => !m.patrol_id || !unitPatrols.some((p) => p.id === m.patrol_id)
          );

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
                      ? 'توزيع الكشافين بين الطلائع والسداسيات لتحقيق التوازن العددي في الأنشطة.'
                      : 'Distribute scouts across patrols to maintain balanced squads for activities.'}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                    {unitMembers.length} {language === 'ar' ? 'كشاف بالفريق' : 'Scouts in Unit'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-amber-700 dark:text-amber-400">
                    {unassignedMembers.length} {language === 'ar' ? 'غير موزعين' : 'Unassigned'}
                  </span>
                </div>
              </div>

              {/* Patrols Columns Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {/* Each Patrol Column */}
                {unitPatrols.map((patrol) => {
                  const pMembers = unitMembers.filter((m) => m.patrol_id === patrol.id);

                  return (
                    <div
                      key={patrol.id}
                      className="bg-white dark:bg-[#121214] rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col"
                    >
                      {/* Patrol Header */}
                      <div className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
                            {language === 'ar' ? patrol.name_ar : patrol.name_en}
                          </h4>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {language === 'ar' ? boardUnit?.name_ar : boardUnit?.name_en}
                          </span>
                        </div>
                        <span className="px-2 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono font-medium text-[11px] border border-zinc-200 dark:border-zinc-700">
                          {pMembers.length}
                        </span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl max-w-xl w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 my-8">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
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

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {language === 'ar' ? 'الفريق المخصص' : 'Assigned Team'} *
                  </label>
                  <select
                    value={lUnitId}
                    onChange={(e) => setLUnitId(e.target.value === 'global' ? 'global' : Number(e.target.value))}
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
    </div>
  );
}
