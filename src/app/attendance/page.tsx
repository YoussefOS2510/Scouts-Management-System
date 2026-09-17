'use client';

import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../lib/AuthContext';
import { INITIAL_UNITS, INITIAL_PATROLS, INITIAL_MEMBERS } from '../../lib/data';
import { AttendanceStatus } from '../../lib/types';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Users,
  Sparkles,
  Save,
  AlertTriangle,
  FileSpreadsheet,
  Check,
  Lock,
  Download,
  RotateCcw,
  BarChart3,
} from 'lucide-react';
import { TeamAttendanceAnalytics } from '../../components/TeamAttendanceAnalytics';

export default function AttendancePage() {
  const { language, t } = useLanguage();
  const { currentUser, currentUnit, isSuperAdmin, can, logAction, accessibleUnits, members, patrols } = useAuth();

  // Tab view: 'roster' (take attendance) or 'analytics' (team attendance analytics)
  const [activeView, setActiveView] = useState<'roster' | 'analytics'>('roster');

  // Unit scoping: default to first accessible unit
  const defaultUnit = accessibleUnits.length > 0 ? accessibleUnits[0].id : 5;
  const [selectedUnitId, setSelectedUnitId] = useState<number>(defaultUnit);

  // Sync unit when user or accessibleUnits switch
  React.useEffect(() => {
    if (accessibleUnits.length > 0 && !accessibleUnits.some((u) => u.id === selectedUnitId)) {
      setSelectedUnitId(accessibleUnits[0].id);
    }
  }, [accessibleUnits, selectedUnitId]);

  const [sessionDate, setSessionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [sessionTitle, setSessionTitle] = useState<string>('اجتماع الجمعة الكشفي الأسبوعي');
  const [savedSessions, setSavedSessions] = useState<{ unitId: number; date: string }[]>([
    { unitId: 5, date: '2026-09-01' }, // mock existing past session
  ]);

  // Attendance state: { [memberId]: { status?: AttendanceStatus, notes: string } }
  // Defaults to empty object so all scouts have NO selection by default
  const [records, setRecords] = useState<Record<string, { status?: AttendanceStatus; notes: string }>>({});

  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  // Filter scouts for selected unit
  const activeMembers = useMemo(() => {
    return members.filter((m) => m.unit_id === selectedUnitId);
  }, [members, selectedUnitId]);

  // Filter patrols for selected unit
  const activePatrols = useMemo(() => {
    return patrols.filter((p) => p.unit_id === selectedUnitId);
  }, [patrols, selectedUnitId]);

  // Group scouts by patrol
  const groupedScouts = useMemo(() => {
    const groups: { patrolName: string; members: typeof activeMembers }[] = [];

    // Patrol-grouped
    activePatrols.forEach((patrol) => {
      const pMembers = activeMembers.filter((m) => m.patrol_id === patrol.id);
      if (pMembers.length > 0) {
        groups.push({
          patrolName: language === 'ar' ? patrol.name_ar : patrol.name_en,
          members: pMembers,
        });
      }
    });

    // Unassigned to patrol
    const unassigned = activeMembers.filter(
      (m) => !m.patrol_id || !activePatrols.some((p) => p.id === m.patrol_id)
    );
    if (unassigned.length > 0) {
      groups.push({
        patrolName: language === 'ar' ? 'بدون طليعة محددة' : 'Unassigned to Patrol',
        members: unassigned,
      });
    }

    return groups;
  }, [activeMembers, activePatrols, language]);

  // Check duplicate session constraint
  const isDuplicateDate = useMemo(() => {
    return savedSessions.some(
      (s) => s.unitId === selectedUnitId && s.date === sessionDate
    );
  }, [savedSessions, selectedUnitId, sessionDate]);

  // One-Tap Batch Action: Mark All Present
  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: AttendanceStatus; notes: string }> = {};
    activeMembers.forEach((m) => {
      updated[m.id] = {
        status: 'present',
        notes: records[m.id]?.notes || '',
      };
    });
    setRecords(updated);
  };

  // Reset to no selection
  const handleClearAll = () => {
    setRecords({});
  };

  // Toggle single member status (clicking active status toggles off back to unselected)
  const handleStatusChange = (memberId: string, status: AttendanceStatus) => {
    setRecords((prev) => {
      const isCurrentlySelected = prev[memberId]?.status === status;
      if (isCurrentlySelected) {
        const copy = { ...prev };
        delete copy[memberId];
        return copy;
      }
      return {
        ...prev,
        [memberId]: {
          status,
          notes: prev[memberId]?.notes || '',
        },
      };
    });
  };

  // Update note
  const handleNotesChange = (memberId: string, notes: string) => {
    setRecords((prev) => ({
      ...prev,
      [memberId]: {
        status: prev[memberId]?.status,
        notes,
      },
    }));
  };

  // Save Session
  const handleSave = () => {
    if (isDuplicateDate) {
      alert(t('duplicate_session_warning'));
      return;
    }

    const currentUnitObj = INITIAL_UNITS.find((u) => u.id === selectedUnitId);
    setSavedSessions((prev) => [...prev, { unitId: selectedUnitId, date: sessionDate }]);
    setSaveNotification(t('session_saved_success'));

    logAction({
      action_type: 'attendance_saved',
      title_ar: `تسجيل حضور وانصراف (${currentUnitObj?.name_ar || ''})`,
      title_en: `Attendance Session Recorded (${currentUnitObj?.name_en || ''})`,
      description_ar: `تم حفظ كشف الحضور لتاريخ ${sessionDate} بنجاح (${stats.present} حاضر، ${stats.absent} غائب، ${stats.excused} معتذر)`,
      description_en: `Recorded attendance for ${sessionDate} (${stats.present} Present, ${stats.absent} Absent, ${stats.excused} Excused)`,
      unit_id: selectedUnitId,
      metadata: { session_date: sessionDate, ...stats },
    });

    setTimeout(() => setSaveNotification(null), 4000);
  };

  // Aggregate stats
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let excused = 0;
    let late = 0;
    let unselected = 0;

    activeMembers.forEach((m) => {
      const st = records[m.id]?.status;
      if (st === 'present') present++;
      else if (st === 'absent') absent++;
      else if (st === 'excused') excused++;
      else if (st === 'late') late++;
      else unselected++;
    });

    const total = activeMembers.length;
    const recordedTotal = present + absent + excused + late;
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    return { total, present, absent, excused, late, unselected, recordedTotal, rate };
  }, [activeMembers, records]);

  const currentUnitObj = INITIAL_UNITS.find((u) => u.id === selectedUnitId);

  return (
    <div className="space-y-5">
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#161D1A] p-5 rounded-xl border border-[#E2DED6] dark:border-[#27342F] shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-50 flex items-center gap-2">
              <CalendarCheck className="w-6 h-6 text-[#1B4332] dark:text-[#86efac]" strokeWidth={2} />
              <span>{t('nav_attendance')}</span>
            </h1>

            {/* View Switcher: Daily Roster vs Team Analytics */}
            <div className="inline-flex items-center p-1 bg-[#F1EFEA] dark:bg-[#1E2723] rounded-lg border border-[#E2DED6] dark:border-[#27342F]">
              <button
                onClick={() => setActiveView('roster')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeView === 'roster'
                    ? 'bg-white dark:bg-[#161D1A] text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5 text-[#1B4332] dark:text-[#86efac]" strokeWidth={2} />
                <span>{t('daily_roster')}</span>
              </button>
              <button
                onClick={() => setActiveView('analytics')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeView === 'analytics'
                    ? 'bg-white dark:bg-[#161D1A] text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#86efac]" strokeWidth={2} />
                <span>{t('team_attendance_analytics')}</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            {language === 'ar'
              ? 'تسجيل الحضور والانصراف مجمعاً حسب الطلائع والسداسيات أو استعراض تحليلات التزام الوحدة'
              : 'Tactile single-screen roster grouped by patrol with team attendance analytics.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Unit Selector */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-stone-600 dark:text-stone-400 mb-1">
              <span>{t('unit')}</span>
              {!isSuperAdmin && currentUnit && (
                <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <Lock className="w-2.5 h-2.5" strokeWidth={1.5} />
                  <span>{t('locked_to_team')}</span>
                </span>
              )}
            </div>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(Number(e.target.value))}
              disabled={!isSuperAdmin && !!currentUnit}
              className={`border rounded-lg px-3 py-1.5 text-xs font-bold focus:ring-1 focus:ring-[#1B4332] focus:outline-none transition-colors ${
                !isSuperAdmin && currentUnit
                  ? 'bg-[#F1EFEA] dark:bg-[#1E2723] border-[#E2DED6] dark:border-[#27342F] text-stone-500 cursor-not-allowed'
                  : 'bg-white dark:bg-[#161D1A] border-[#D5CFC5] dark:border-[#27342F] text-stone-900 dark:text-stone-100'
              }`}
            >
              {accessibleUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {language === 'ar' ? unit.name_ar : unit.name_en}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div className="flex flex-col">
            <label className="text-[10px] font-mono font-bold text-stone-600 dark:text-stone-400 mb-1">{t('date')}</label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="bg-white dark:bg-[#161D1A] border border-[#D5CFC5] dark:border-[#27342F] rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-stone-900 dark:text-stone-100 focus:ring-1 focus:ring-[#1B4332] focus:outline-none"
            />
          </div>

          {/* Export to Excel */}
          {can('attendance.export', selectedUnitId) && (
            <div className="flex flex-col justify-end">
              <button
                onClick={() => {
                  alert(language === 'ar' ? 'تم تصدير كشف الحضور بنجاح إلى ملف إكسيل!' : 'Roster exported to Excel successfully!');
                  logAction({
                    action_type: 'attendance_saved',
                    title_ar: `تصدير كشف الحضور (${currentUnitObj?.name_ar})`,
                    title_en: `Exported Attendance Roster (${currentUnitObj?.name_en})`,
                    description_ar: `قام ${currentUser?.full_name} بتصدير كشف حضور لتاريخ ${sessionDate}`,
                    description_en: `${currentUser?.full_name} exported attendance roster for ${sessionDate}`,
                    unit_id: selectedUnitId,
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-white dark:bg-[#161D1A] hover:bg-[#F1EFEA] dark:hover:bg-[#1E2723] text-stone-800 dark:text-stone-200 border border-[#D5CFC5] dark:border-[#27342F] transition-colors cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#2D6A4F] dark:text-[#86efac]" strokeWidth={2} />
                <span>{language === 'ar' ? 'تصدير إكسيل' : 'Export Excel'}</span>
                {currentUser?.id === 'u4' && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-300">
                    ⚡ {language === 'ar' ? 'منح إضافي' : 'Grant'}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Save Button */}
          <div className="flex flex-col justify-end">
            <button
              onClick={handleSave}
              disabled={isDuplicateDate}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer ${
                isDuplicateDate
                  ? 'bg-[#F1EFEA] dark:bg-[#1E2723] text-stone-400 cursor-not-allowed border border-[#E2DED6] dark:border-[#27342F]'
                  : 'bg-[#1B4332] hover:bg-[#143326] text-white'
              }`}
            >
              <Save className="w-4 h-4 text-[#FDF6EC]" strokeWidth={2} />
              <span>{t('save_session')}</span>
            </button>
          </div>
        </div>
      </div>

      {activeView === 'analytics' ? (
        <TeamAttendanceAnalytics
          initialUnitId={selectedUnitId}
          onBackToSession={() => setActiveView('roster')}
        />
      ) : (
        <>
          {/* Duplicate Session Notice if applicable */}
          {isDuplicateDate && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#B45309] shrink-0" strokeWidth={2} />
              <div>
                <span className="font-bold">{t('duplicate_session_warning')}</span>
                <span className="mx-1">&bull;</span>
                <span className="text-amber-900 dark:text-amber-400">
                  {language === 'ar'
                    ? 'يمنع النظام تسجيل أكثر من جلسة واحدة لنفس الوحدة في نفس اليوم للحفاظ على سلامة البيانات.'
                    : 'The system strictly enforces one attendance session per unit per calendar date.'}
                </span>
              </div>
            </div>
          )}

          {/* Success Notification */}
          {saveNotification && (
            <div className="p-4 rounded-xl bg-[#E8F0EC] dark:bg-[#1B4332]/40 border border-[#2D6A4F] text-[#1B4332] dark:text-[#86efac] text-xs flex items-center gap-2 font-bold animate-fadeIn">
              <Check className="w-4 h-4 text-[#1B4332] dark:text-[#86efac]" strokeWidth={2} />
              <span>{saveNotification}</span>
            </div>
          )}

          {/* Top Banner: Quick Actions & Unified KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3.5">
            {/* Quick Actions Card */}
            <div className="p-4.5 rounded-xl bg-white dark:bg-[#161D1A] border border-[#E2DED6] dark:border-[#27342F] flex flex-col justify-between space-y-3 shadow-2xs">
              <div>
                <div className="text-[10px] font-mono font-bold text-stone-500 uppercase tracking-wider">
                  {language === 'ar' ? 'تحكم سريع' : 'Fast Actions'}
                </div>
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 mt-0.5">{t('mark_all_present')}</h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">{t('mark_all_present_desc')}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleMarkAllPresent}
                  className="w-full py-2 px-3 rounded-lg bg-[#1B4332] hover:bg-[#143326] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#FDF6EC]" strokeWidth={2} />
                  <span>{t('mark_all_present')}</span>
                </button>
                <button
                  onClick={handleClearAll}
                  className="w-full py-1.5 px-3 rounded-lg bg-[#F1EFEA] dark:bg-[#1E2723] hover:bg-[#E2DED6] dark:hover:bg-[#27342F] text-stone-800 dark:text-stone-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#E2DED6] dark:border-[#27342F]"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" strokeWidth={2} />
                  <span>{language === 'ar' ? 'إعادة ضبط (بدون اختيار)' : 'Reset to No Selection'}</span>
                </button>
              </div>
            </div>

            {/* Aggregate Stats Cards */}
            <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {/* Present KPI */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#161D1A] border border-[#E2DED6] dark:border-[#27342F] flex flex-col justify-center space-y-1 shadow-2xs">
                <span className="text-xs font-bold text-[#1B4332] dark:text-[#86efac] uppercase tracking-wider">{t('present_count')}</span>
                <span className="text-3xl font-bold text-stone-900 dark:text-stone-50 font-mono tabular-nums">{stats.present}</span>
                <span className="text-xs font-medium text-stone-600 dark:text-stone-400">من أصل {stats.total} كشاف</span>
              </div>

              {/* Absent KPI */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#161D1A] border border-[#E2DED6] dark:border-[#27342F] flex flex-col justify-center space-y-1 shadow-2xs">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider">{t('absent_count')}</span>
                <span className="text-3xl font-bold text-stone-900 dark:text-stone-50 font-mono tabular-nums">{stats.absent}</span>
                <span className="text-xs font-medium text-stone-600 dark:text-stone-400">بدون عذر مسبق</span>
              </div>

              {/* Excused / Late KPI */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#161D1A] border border-[#E2DED6] dark:border-[#27342F] flex flex-col justify-center space-y-1 shadow-2xs">
                <span className="text-xs font-bold text-[#B45309] dark:text-amber-400 uppercase tracking-wider">{t('excused_count')} / {t('late_count')}</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-stone-900 dark:text-stone-50 font-mono tabular-nums">{stats.excused}</span>
                  <span className="text-xs font-bold text-sky-700 dark:text-sky-400">+{stats.late} متأخر</span>
                </div>
                <span className="text-xs font-medium text-stone-600 dark:text-stone-400">بعذر مسجل</span>
              </div>

              {/* Attendance Rate KPI */}
              <div className="p-4 rounded-xl bg-white dark:bg-[#161D1A] border border-[#E2DED6] dark:border-[#27342F] flex flex-col justify-center space-y-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">{t('attendance_rate')}</span>
                  {stats.unselected > 0 && (
                    <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.2 rounded-full border border-amber-300">
                      {stats.unselected} {language === 'ar' ? 'لم يُحدد' : 'unmarked'}
                    </span>
                  )}
                </div>
                <span className="text-3xl font-bold text-stone-900 dark:text-stone-50 font-mono tabular-nums">{stats.rate}%</span>
                <div className="w-full bg-[#E2DED6] dark:bg-[#27342F] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#1B4332] dark:bg-[#4ade80] h-full rounded-full transition-all duration-300"
                    style={{ width: `${stats.rate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tactical Roster grouped by Patrol */}
          <div className="space-y-4">
            {groupedScouts.map((group, gIdx) => {
              // Scout stage border accents
              const patrolColors = [
                { border: 'border-s-4 border-s-[#1B4332]', badge: 'bg-[#E8F0EC] text-[#1B4332] border-[#2D6A4F]/30 dark:bg-[#1B4332]/40 dark:text-[#86efac]' },
                { border: 'border-s-4 border-s-[#B45309]', badge: 'bg-[#FDF6EC] text-[#B45309] border-amber-300 dark:bg-amber-950/40 dark:text-amber-300' },
                { border: 'border-s-4 border-s-sky-600', badge: 'bg-sky-100 text-sky-900 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300' },
                { border: 'border-s-4 border-s-rose-700', badge: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300' },
              ];
              const pTheme = patrolColors[gIdx % patrolColors.length];

              return (
              <div
                key={gIdx}
                className={`bg-white dark:bg-[#161D1A] rounded-xl border border-[#DFD9CE] dark:border-[#2A3731] overflow-hidden shadow-2xs ${pTheme.border}`}
              >
                {/* Patrol Header */}
                <div className="px-5 py-3 bg-[#F8F7F4] dark:bg-[#121815] border-b border-[#E2DED6] dark:border-[#27342F] flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-stone-600 dark:text-stone-400" strokeWidth={2} />
                    <h3 className="font-bold text-stone-900 dark:text-stone-50 text-sm">{group.patrolName}</h3>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${pTheme.badge}`}>
                      {group.members.length} {language === 'ar' ? 'كشاف' : 'scouts'}
                    </span>
                  </div>
                </div>

                {/* Scouts Rows */}
                <div className="divide-y divide-[#E2DED6] dark:divide-[#27342F]/60">
                  {group.members.map((member) => {
                    const current = records[member.id];
                    const currentStatus = current?.status;
                    return (
                      <div
                        key={member.id}
                        className="p-3 sm:px-5 sm:py-3 hover:bg-[#F1EFEA]/60 dark:hover:bg-[#1E2723]/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        {/* Member Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                              {language === 'ar' ? member.full_name_ar : (member.full_name_en || member.full_name_ar)}
                            </span>
                            <span className="text-xs font-mono font-bold text-stone-700 dark:text-stone-300 bg-[#F1EFEA] dark:bg-[#1E2723] px-2 py-0.5 rounded border border-[#E2DED6] dark:border-[#27342F]">
                              {member.member_code}
                            </span>
                            {!currentStatus && (
                              <span className="text-[10px] font-mono font-medium text-stone-500 dark:text-stone-400 bg-[#F1EFEA] dark:bg-[#1E2723] px-1.5 py-0.5 rounded">
                                {language === 'ar' ? 'لم يُحدد بعد' : 'Unmarked'}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-stone-600 dark:text-stone-400 mt-1 flex flex-wrap items-center gap-1.5">
                            <span>{member.academic_year}</span>
                            <span>&bull;</span>
                            <span>{member.school_or_college || 'سان جورج'}</span>
                            {member.notes && (
                              <>
                                <span>&bull;</span>
                                <span className="text-[#B45309] dark:text-amber-400 font-semibold">{member.notes}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Quick Action Cluster: 4 Segmented Control Buttons */}
                        <div className="flex items-center gap-1.5 self-start sm:self-auto">
                          {/* Present Button */}
                          <button
                            onClick={() => handleStatusChange(member.id, 'present')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              currentStatus === 'present'
                                ? 'bg-[#1B4332] hover:bg-[#143326] text-white shadow-xs ring-2 ring-[#2D6A4F]/40'
                                : 'border border-[#D5CFC5] dark:border-[#27342F] text-stone-700 dark:text-stone-300 hover:bg-[#E8F0EC] hover:text-[#1B4332] hover:border-[#2D6A4F] dark:hover:bg-[#1B4332]/30'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
                            <span>{t('status_present')}</span>
                          </button>

                          {/* Absent Button */}
                          <button
                            onClick={() => handleStatusChange(member.id, 'absent')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              currentStatus === 'absent'
                                ? 'bg-rose-700 hover:bg-rose-800 text-white shadow-xs ring-2 ring-rose-400/40'
                                : 'border border-[#D5CFC5] dark:border-[#27342F] text-stone-700 dark:text-stone-300 hover:bg-rose-50 hover:text-rose-900 hover:border-rose-300 dark:hover:bg-rose-950/30'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" strokeWidth={2} />
                            <span>{t('status_absent')}</span>
                          </button>

                          {/* Excused Button */}
                          <button
                            onClick={() => handleStatusChange(member.id, 'excused')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              currentStatus === 'excused'
                                ? 'bg-[#B45309] hover:bg-[#92400e] text-white shadow-xs ring-2 ring-amber-400/40'
                                : 'border border-[#D5CFC5] dark:border-[#27342F] text-stone-700 dark:text-stone-300 hover:bg-[#FDF6EC] hover:text-[#B45309] hover:border-amber-300 dark:hover:bg-amber-950/30'
                            }`}
                          >
                            <HelpCircle className="w-3.5 h-3.5" strokeWidth={2} />
                            <span>{t('status_excused')}</span>
                          </button>

                          {/* Late Button */}
                          <button
                            onClick={() => handleStatusChange(member.id, 'late')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              currentStatus === 'late'
                                ? 'bg-sky-700 hover:bg-sky-800 text-white shadow-xs ring-2 ring-sky-400/40'
                                : 'border border-[#D5CFC5] dark:border-[#27342F] text-stone-700 dark:text-stone-300 hover:bg-sky-50 hover:text-sky-900 hover:border-sky-300 dark:hover:bg-sky-950/30'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                            <span>{t('status_late')}</span>
                          </button>
                        </div>

                        {/* Excuse Reason Input: Appears ONLY when marked excused */}
                        {currentStatus === 'excused' && (
                          <div className="w-full sm:w-64 animate-fadeIn">
                            <input
                              type="text"
                              placeholder={language === 'ar' ? 'سبب الاعتذار (سفر، مرض، امتحانات...)' : 'Excuse reason (travel, illness, exams...)'}
                              value={current?.notes || ''}
                              onChange={(e) => handleNotesChange(member.id, e.target.value)}
                              autoFocus
                              className="w-full bg-[#FDF6EC] dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-lg px-3 py-1.5 text-xs font-bold text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-[#B45309]"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          </div>
        </>
      )}
    </div>
  );
}
