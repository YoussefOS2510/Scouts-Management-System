'use client';

import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';

export default function MembersDirectoryPage() {
  const { language, t } = useLanguage();
  const { currentUser, currentUnit, isSuperAdmin, can, accessibleUnits, members, patrols, assignScoutPatrol } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const defaultUnitFilter = isSuperAdmin ? 'all' : (accessibleUnits.length > 0 ? accessibleUnits[0].id : 'all');
  const [selectedUnitId, setSelectedUnitId] = useState<number | 'all'>(defaultUnitFilter);
  const [showConfidential, setShowConfidential] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'board'>('table');
  const [patrolActionSuccess, setPatrolActionSuccess] = useState<string | null>(null);

  // Sync unit when user switches
  React.useEffect(() => {
    if (!isSuperAdmin) {
      if (accessibleUnits.length > 0) {
        setSelectedUnitId(accessibleUnits[0].id);
      }
    } else {
      setSelectedUnitId('all');
    }
  }, [accessibleUnits, isSuperAdmin]);

  const canViewConfidential = isSuperAdmin || can('members.view_confidential', typeof selectedUnitId === 'number' ? selectedUnitId : currentUnit?.id);

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // If scoped leader, strictly force only their team
      if (!isSuperAdmin && currentUnit && m.unit_id !== currentUnit.id) {
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white dark:bg-[#161D1A] p-5 rounded-xl border border-[#E2DED6] dark:border-[#27342F] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#1B4332] dark:text-[#86efac]" strokeWidth={2} />
            <span>{t('nav_members')}</span>
          </h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            {language === 'ar'
              ? 'دليل وسجل بيانات الكشافين: الاسم الثلاثي بالعربي، بيانات مدارس الأحد وأب الاعتراف، وجهات الاتصال للطوارئ'
              : 'Complete bilingual scout records with church classification, emergency contacts, and confidential alerts.'}
          </p>
        </div>

        {/* Top Actions: View Mode & Confidential Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#F1EFEA] dark:bg-[#1E2723] p-1 rounded-lg border border-[#E2DED6] dark:border-[#27342F]">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#161D1A] text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 text-[#1B4332] dark:text-[#86efac]" strokeWidth={2} />
              <span>{language === 'ar' ? 'جدول البيانات' : 'Data Table'}</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-[#161D1A] text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-[#B45309]" strokeWidth={2} />
              <span>{language === 'ar' ? 'بطاقات' : 'Cards'}</span>
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-[#161D1A] text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" strokeWidth={2} />
              <span>{language === 'ar' ? 'تشكيل الطلائع' : 'Patrol Board'}</span>
            </button>
          </div>

          {/* Confidential Toggle Switch */}
          {canViewConfidential ? (
            <button
              onClick={() => setShowConfidential(!showConfidential)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs ${
                showConfidential
                  ? 'bg-[#FDF6EC] dark:bg-amber-950/40 text-[#B45309] dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  : 'bg-[#F1EFEA] dark:bg-[#1E2723] text-stone-700 dark:text-stone-300 border border-[#E2DED6] dark:border-[#27342F]'
              }`}
            >
              {showConfidential ? <Eye className="w-3.5 h-3.5 text-[#B45309]" strokeWidth={2} /> : <EyeOff className="w-3.5 h-3.5 text-stone-500" strokeWidth={2} />}
              <span>{showConfidential ? (language === 'ar' ? 'إخفاء الروحي' : 'Hide Spiritual') : (language === 'ar' ? 'إظهار الروحي' : 'Show Spiritual')}</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#F1EFEA] dark:bg-[#1E2723] text-stone-500 border border-[#E2DED6] dark:border-[#27342F] cursor-not-allowed">
              <Lock className="w-3.5 h-3.5 text-stone-500" strokeWidth={1.5} />
              <span>{language === 'ar' ? 'البيانات مقفلة' : 'Confidential Locked'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Success Notification */}
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
          disabled={!isSuperAdmin && !!currentUnit}
          className={`border rounded-lg px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-[#1B4332] focus:outline-none transition-colors ${
            !isSuperAdmin && currentUnit
              ? 'bg-[#F1EFEA] dark:bg-[#1E2723] border-[#E2DED6] dark:border-[#27342F] text-stone-500 cursor-not-allowed'
              : 'bg-white dark:bg-[#161D1A] border-[#D5CFC5] dark:border-[#27342F] text-stone-900 dark:text-stone-100'
          }`}
        >
          {isSuperAdmin && (
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
                  const canManageScout = isSuperAdmin || accessibleUnits.some((u) => u.id === member.unit_id);

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
            const canManageScout = isSuperAdmin || accessibleUnits.some((u) => u.id === member.unit_id);

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
    </div>
  );
}
