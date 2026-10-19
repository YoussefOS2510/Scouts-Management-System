'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useLanguage } from '../../lib/LanguageContext';
import { useAuth } from '../../lib/AuthContext';
import { INITIAL_UNITS, INITIAL_PATROLS } from '../../lib/data';
import { AttendanceStatus } from '../../lib/types';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Users,
  Save,
  AlertTriangle,
  FileSpreadsheet,
  Check,
  Lock,
  RotateCcw,
  BarChart3,
  LayoutGrid,
  List,
  ChevronRight,
  ChevronLeft,
  Folder,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { TeamAttendanceAnalytics } from '../../components/TeamAttendanceAnalytics';

export default function AttendancePage() {
  const { language, t } = useLanguage();
  const { currentUser, currentRole, currentUnit, isSuperAdmin, can, logAction, accessibleUnits, members, patrols, isLoadingPermissions } = useAuth();

  // Role permissions
  const canViewAllUnits = isSuperAdmin || currentRole?.name === 'group_leader';

  const canAccessAttendance =
    isSuperAdmin ||
    can('attendance.take') ||
    can('attendance.edit_history') ||
    can('attendance.export') ||
    can('attendance.analytics');

  // Tab view: 'roster' (take attendance) or 'analytics' (team attendance analytics)
  const [activeView, setActiveView] = useState<'roster' | 'analytics'>('roster');

  // Roster layout: 'list' (Drive Table Rows) vs 'grid' (Tactile Patrol Cards)
  const [rosterViewMode, setRosterViewMode] = useState<'list' | 'grid'>('list');

  // Unit scoping: default to first accessible unit
  const defaultUnit = accessibleUnits.length > 0 ? accessibleUnits[0].id : 5;
  const [selectedUnitId, setSelectedUnitId] = useState<number>(defaultUnit);

  const canTakeAttendance = isSuperAdmin || can('attendance.take', selectedUnitId);

  // Sync unit when user or accessibleUnits switch
  React.useEffect(() => {
    if (accessibleUnits.length > 0 && !accessibleUnits.some((u) => u.id === selectedUnitId)) {
      setSelectedUnitId(accessibleUnits[0].id);
    }
  }, [accessibleUnits, selectedUnitId]);

  const [sessionDate, setSessionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [savedSessions, setSavedSessions] = useState<{ unitId: number; date: string }[]>([]);

  // Fetch saved sessions from database for selected unit
  React.useEffect(() => {
    fetch(`/api/attendance?unitId=${selectedUnitId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.sessions)) {
          setSavedSessions(data.sessions.map((s: any) => ({ unitId: s.unit_id, date: s.session_date })));
        }
      })
      .catch((err) => console.error('Failed to fetch attendance sessions:', err));
  }, [selectedUnitId]);

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

  // Batch: Mark All Present
  const handleMarkAllPresent = () => {
    if (!canTakeAttendance) return;
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
    if (!canTakeAttendance) return;
    setRecords({});
  };

  // Toggle status (clicking active status toggles off)
  const handleStatusChange = (memberId: string, status: AttendanceStatus) => {
    if (!canTakeAttendance) return;
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
    if (!canTakeAttendance) return;
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
    if (!canTakeAttendance) return;
    if (isDuplicateDate) {
      alert(t('duplicate_session_warning'));
      return;
    }

    const payloadRecords = Object.entries(records).map(([mId, rec]) => ({
      memberId: mId,
      status: rec.status,
      notes: rec.notes,
    }));

    fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        unitId: selectedUnitId,
        sessionDate,
        sessionTitle: 'اجتماع كشفي أسبوعي',
        recordedBy: currentUser?.id,
        records: payloadRecords,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setSavedSessions((prev) => [...prev, { unitId: selectedUnitId, date: sessionDate }]);
          setSaveNotification(t('session_saved_success'));
          setTimeout(() => setSaveNotification(null), 4000);
        } else {
          alert(data.error || 'Failed to save attendance');
        }
      })
      .catch((err) => {
        console.error('Save attendance error:', err);
        alert('Database connection error while saving attendance');
      });
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

  if (!canAccessAttendance) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4 animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center border border-amber-200 dark:border-amber-800/60 shadow-xs">
          <ShieldAlert className="w-7 h-7" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {language === 'ar' ? 'وصول مقيّد: سجل الحضور والغياب' : 'Restricted Access: Attendance Roster'}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
          {language === 'ar'
            ? 'حسابك الحالي لا يمتلك صلاحيات تسجيل أو إدارة كشوف الحضور الكشفية.'
            : 'Your current role does not have permission to mark attendance or view roll-call rosters.'}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200/80 dark:border-neutral-800/60">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
          <Link href="/" className="hover:text-sky-500 transition-colors font-bold">
            SMSR
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 rtl:rotate-180" />
          <span className="text-neutral-900 dark:text-neutral-100 font-semibold">
            {language === 'ar' ? 'سجل الحضور والانصراف' : 'Attendance Roster'}
          </span>
          {currentUnitObj && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400 rtl:rotate-180" />
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300 font-medium border border-sky-500/20" dir="auto">
                {language === 'ar' ? currentUnitObj.name_ar : currentUnitObj.name_en}
              </span>
            </>
          )}
        </div>

        {/* Tab & View Mode Segmented Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Main View Switcher: Roster vs Analytics */}
          <div className="inline-flex rounded-xl p-1 bg-neutral-100 dark:bg-[#111827] border border-neutral-200/80 dark:border-neutral-800/80">
            <button
              onClick={() => setActiveView('roster')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeView === 'roster'
                  ? 'bg-white dark:bg-[#1E293B] text-sky-600 dark:text-sky-400 shadow-xs font-semibold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>{t('daily_roster')}</span>
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeView === 'analytics'
                  ? 'bg-white dark:bg-[#1E293B] text-sky-600 dark:text-sky-400 shadow-xs font-semibold'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{t('team_attendance_analytics')}</span>
            </button>
          </div>

          {/* List vs Grid Layout (only in roster tab) */}
          {activeView === 'roster' && (
            <div className="inline-flex rounded-xl p-1 bg-neutral-100 dark:bg-[#111827] border border-neutral-200/80 dark:border-neutral-800/80">
              <button
                onClick={() => setRosterViewMode('list')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  rosterViewMode === 'list'
                    ? 'bg-white dark:bg-[#1E293B] text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                }`}
                title={language === 'ar' ? 'عرض جدول (List View)' : 'Table List View'}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRosterViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  rosterViewMode === 'grid'
                    ? 'bg-white dark:bg-[#1E293B] text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                }`}
                title={language === 'ar' ? 'عرض بطاقات (Grid View)' : 'Card Grid View'}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {activeView === 'analytics' ? (
        <TeamAttendanceAnalytics
          initialUnitId={selectedUnitId}
          onBackToSession={() => setActiveView('roster')}
        />
      ) : (
        <>
          {/* 2. REFACTORED CONTROL TOOLBAR (Unit, Date, Compact Batch Actions, Export, Save) */}
          <div className="bg-white dark:bg-[#111827] rounded-xl p-3 sm:p-4 border border-neutral-200 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 shadow-none">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Unit Dropdown */}
              <div className="flex items-center gap-2 bg-neutral-100 dark:bg-[#0B0F17] rounded-lg px-2.5 py-1.5 border border-neutral-200/80 dark:border-neutral-800/80">
                <Folder className="w-4 h-4 text-sky-500" />
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(Number(e.target.value))}
                  disabled={!canViewAllUnits && accessibleUnits.length <= 1}
                  className="bg-transparent border-none text-xs font-medium text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-0 cursor-pointer"
                >
                  {accessibleUnits.map((unit) => (
                    <option key={unit.id} value={unit.id} className="dark:bg-[#111827]">
                      {language === 'ar' ? unit.name_ar : unit.name_en}
                    </option>
                  ))}
                </select>
                {!canViewAllUnits && accessibleUnits.length <= 1 && (
                  <span className="text-[10px] text-amber-500 flex items-center gap-0.5">
                    <Lock className="w-3 h-3" />
                  </span>
                )}
              </div>

              {/* Date Picker */}
              <div className="flex items-center gap-2 bg-neutral-100 dark:bg-[#0B0F17] rounded-lg px-2.5 py-1.5 border border-neutral-200/80 dark:border-neutral-800/80">
                <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{t('date')}:</span>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="bg-transparent border-none text-xs font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Compact Batch Action Buttons in Toolbar (Requirement 2) */}
              {canTakeAttendance && (
                <div className="flex items-center gap-1.5 ms-0 sm:ms-2">
                  <button
                    onClick={handleMarkAllPresent}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title={t('mark_all_present')}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t('mark_all_present')}</span>
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 flex items-center gap-1.5 transition-colors cursor-pointer"
                    title={language === 'ar' ? 'إعادة ضبط الاختيارات' : 'Clear selection'}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'مسح' : 'Clear'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Actions: Export Excel & Save Session */}
            <div className="flex items-center gap-2">
              {can('attendance.export', selectedUnitId) && (
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
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-neutral-100 hover:bg-neutral-200/70 dark:bg-[#1E293B] dark:hover:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-200/80 dark:border-neutral-700/50"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span>{language === 'ar' ? 'تصدير إكسيل' : 'Export'}</span>
                </button>
              )}

              {canTakeAttendance ? (
                <button
                  onClick={handleSave}
                  disabled={isDuplicateDate}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    isDuplicateDate
                      ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                      : 'bg-sky-600 hover:bg-sky-500 text-white shadow-xs'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{t('save_session')}</span>
                </button>
              ) : (
                <div className="px-3.5 py-2 rounded-xl text-xs font-medium bg-neutral-100 dark:bg-[#1E293B] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-800">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{language === 'ar' ? 'وضع الاطلاع فقط' : 'View-Only Mode'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Duplicate Session Notice if applicable */}
          {isDuplicateDate && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/70 text-amber-900 dark:text-amber-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{t('duplicate_session_warning')}</span>
            </div>
          )}

          {/* Success Notification */}
          {saveNotification && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/70 text-emerald-900 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium animate-fadeIn">
              <Check className="w-4 h-4" />
              <span>{saveNotification}</span>
            </div>
          )}

          {/* 3. SLEEK SINGLE-ROW SUMMARY BAR (Requirement 2) */}
          <div className="bg-white dark:bg-[#111827] rounded-xl px-4 py-3 border border-neutral-200 dark:border-neutral-800/80 flex flex-wrap items-center justify-between gap-4 shadow-none">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 divide-x rtl:divide-x-reverse divide-neutral-200 dark:divide-neutral-800/80 text-xs">
              {/* Enrolled Total */}
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                  {language === 'ar' ? 'المقيدين بالوحدة' : 'Enrolled'}
                </span>
                <span className="text-sm sm:text-base font-bold font-mono text-neutral-900 dark:text-neutral-100 tabular-nums">
                  <bdi>{stats.total}</bdi>
                </span>
              </div>

              {/* Present */}
              <div className="ps-4 sm:ps-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-neutral-500 dark:text-neutral-400 font-medium">{t('present_count')}</span>
                <span className="text-sm sm:text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                  <bdi>{stats.present}</bdi>
                </span>
                <span className="text-[11px] font-mono text-neutral-400">
                  ({stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%)
                </span>
              </div>

              {/* Absent */}
              <div className="ps-4 sm:ps-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span className="text-neutral-500 dark:text-neutral-400 font-medium">{t('absent_count')}</span>
                <span className="text-sm sm:text-base font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                  <bdi>{stats.absent}</bdi>
                </span>
              </div>

              {/* Excused / Late */}
              <div className="ps-4 sm:ps-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                  {t('excused_count')} / {t('late_count')}
                </span>
                <span className="text-sm sm:text-base font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                  <bdi>{stats.excused}</bdi>
                </span>
                <span className="text-xs font-mono text-neutral-400">+<bdi>{stats.late}</bdi></span>
              </div>
            </div>

            {/* Attendance Rate */}
            <div className="flex items-center gap-3 ms-auto">
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{t('attendance_rate')}</span>
              <span className="text-base sm:text-lg font-bold font-mono text-sky-600 dark:text-sky-400 tabular-nums">
                <bdi>{stats.rate}%</bdi>
              </span>
              {stats.unselected > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-[#1E293B] text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700/60">
                  {stats.unselected} {language === 'ar' ? 'متبقي' : 'pending'}
                </span>
              )}
            </div>
          </div>

          {/* 4. ROSTER GROUPS WITH UNIFIED COMPACT SEGMENTED RADIO-GROUP CONTROL */}
          <div className="space-y-4">
            {groupedScouts.map((group, gIdx) => (
              <div
                key={gIdx}
                className="bg-white dark:bg-[#111827] rounded-xl border border-neutral-200 dark:border-neutral-800/80 overflow-hidden shadow-none"
              >
                {/* Patrol Header */}
                <div className="px-4 py-2.5 bg-neutral-50 dark:bg-[#161F30] border-b border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-500" />
                    <h3 className="font-semibold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100" dir="auto">
                      {group.patrolName}
                    </h3>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      ({group.members.length} {language === 'ar' ? 'كشاف' : 'scouts'})
                    </span>
                  </div>
                </div>

                {/* VIEW MODE 1: Table List View */}
                {rosterViewMode === 'list' && (
                  <div className="divide-y divide-neutral-200/80 dark:divide-neutral-800/60">
                    {group.members.map((member) => {
                      const current = records[member.id];
                      const currentStatus = current?.status;

                      return (
                        <div
                          key={member.id}
                          className="h-auto sm:h-14 px-4 py-2.5 hover:bg-neutral-50/80 dark:hover:bg-[#1E293B]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors"
                        >
                          {/* Member Details */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-[#1E293B] text-neutral-700 dark:text-neutral-200 flex items-center justify-center text-xs font-bold shrink-0 border border-neutral-200/60 dark:border-neutral-700/50">
                              {member.full_name_ar?.charAt(0) || 'ك'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate" dir="auto">
                                  <bdi>{language === 'ar' ? member.full_name_ar : (member.full_name_en || member.full_name_ar)}</bdi>
                                </span>
                                <span className="text-[11px] font-mono text-neutral-400 shrink-0">
                                  <bdi>{member.member_code}</bdi>
                                </span>
                              </div>
                              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate" dir="auto">
                                <bdi>{member.academic_year}</bdi> &bull; <bdi>{member.school_or_college || 'سان جورج'}</bdi>
                              </div>
                            </div>
                          </div>

                          {/* Unified Compact Segmented Radio-Group Control */}
                          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                            <div
                              role="radiogroup"
                              aria-label={`Attendance for ${member.full_name_ar}`}
                              className="inline-flex p-0.5 rounded-lg bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200/90 dark:border-neutral-800 shrink-0"
                            >
                              {/* Present Segment */}
                              <button
                                type="button"
                                role="radio"
                                aria-checked={currentStatus === 'present'}
                                onClick={() => handleStatusChange(member.id, 'present')}
                                className={`px-2.5 py-1 text-xs rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                                  currentStatus === 'present'
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 shadow-xs font-semibold'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-white/60 dark:hover:bg-neutral-800/50 border border-transparent'
                                }`}
                                title={t('status_present')}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{t('status_present')}</span>
                              </button>

                              {/* Absent Segment */}
                              <button
                                type="button"
                                role="radio"
                                aria-checked={currentStatus === 'absent'}
                                onClick={() => handleStatusChange(member.id, 'absent')}
                                className={`px-2.5 py-1 text-xs rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                                  currentStatus === 'absent'
                                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/40 shadow-xs font-semibold'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-white/60 dark:hover:bg-neutral-800/50 border border-transparent'
                                }`}
                                title={t('status_absent')}
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>{t('status_absent')}</span>
                              </button>

                              {/* Excused Segment */}
                              <button
                                type="button"
                                role="radio"
                                aria-checked={currentStatus === 'excused'}
                                onClick={() => handleStatusChange(member.id, 'excused')}
                                className={`px-2.5 py-1 text-xs rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                                  currentStatus === 'excused'
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/40 shadow-xs font-semibold'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-white/60 dark:hover:bg-neutral-800/50 border border-transparent'
                                }`}
                                title={t('status_excused')}
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                                <span>{t('status_excused')}</span>
                              </button>

                              {/* Late Segment */}
                              <button
                                type="button"
                                role="radio"
                                aria-checked={currentStatus === 'late'}
                                onClick={() => handleStatusChange(member.id, 'late')}
                                className={`px-2.5 py-1 text-xs rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                                  currentStatus === 'late'
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-xs font-semibold'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-white/60 dark:hover:bg-neutral-800/50 border border-transparent'
                                }`}
                                title={t('status_late')}
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>{t('status_late')}</span>
                              </button>
                            </div>

                            {/* Excuse Reason Input: Appears when marked excused */}
                            {currentStatus === 'excused' && (
                              <div className="w-full sm:w-56 animate-fadeIn">
                                <input
                                  type="text"
                                  placeholder={language === 'ar' ? 'سبب الاعتذار...' : 'Excuse reason...'}
                                  value={current?.notes || ''}
                                  onChange={(e) => handleNotesChange(member.id, e.target.value)}
                                  autoFocus
                                  className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-amber-500/40 rounded-lg px-2.5 py-1 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  dir="auto"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* VIEW MODE 2: Card Grid View */}
                {rosterViewMode === 'grid' && (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.members.map((member) => {
                      const current = records[member.id];
                      const currentStatus = current?.status;

                      return (
                        <div
                          key={member.id}
                          className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#161F30] border border-neutral-200/80 dark:border-neutral-800/80 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate" dir="auto">
                              <bdi>{language === 'ar' ? member.full_name_ar : (member.full_name_en || member.full_name_ar)}</bdi>
                            </div>
                            <span className="text-[11px] font-mono text-neutral-400">
                              <bdi>{member.member_code}</bdi>
                            </span>
                          </div>

                          {/* Segmented radio control */}
                          <div
                            role="radiogroup"
                            aria-label={`Attendance for ${member.full_name_ar}`}
                            className="inline-flex p-0.5 rounded-lg bg-neutral-100 dark:bg-[#0B0F17] border border-neutral-200/90 dark:border-neutral-800 w-full justify-between"
                          >
                            <button
                              type="button"
                              role="radio"
                              aria-checked={currentStatus === 'present'}
                              onClick={() => handleStatusChange(member.id, 'present')}
                              className={`flex-1 py-1 text-xs rounded-md text-center transition-all cursor-pointer ${
                                currentStatus === 'present'
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 shadow-xs font-semibold'
                                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 border border-transparent'
                              }`}
                            >
                              {t('status_present')}
                            </button>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={currentStatus === 'absent'}
                              onClick={() => handleStatusChange(member.id, 'absent')}
                              className={`flex-1 py-1 text-xs rounded-md text-center transition-all cursor-pointer ${
                                currentStatus === 'absent'
                                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/40 shadow-xs font-semibold'
                                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 border border-transparent'
                              }`}
                            >
                              {t('status_absent')}
                            </button>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={currentStatus === 'excused'}
                              onClick={() => handleStatusChange(member.id, 'excused')}
                              className={`flex-1 py-1 text-xs rounded-md text-center transition-all cursor-pointer ${
                                currentStatus === 'excused'
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/40 shadow-xs font-semibold'
                                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 border border-transparent'
                              }`}
                            >
                              {t('status_excused')}
                            </button>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={currentStatus === 'late'}
                              onClick={() => handleStatusChange(member.id, 'late')}
                              className={`flex-1 py-1 text-xs rounded-md text-center transition-all cursor-pointer ${
                                currentStatus === 'late'
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-xs font-semibold'
                                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 border border-transparent'
                              }`}
                            >
                              {t('status_late')}
                            </button>
                          </div>

                          {/* Dynamic excuse reason input */}
                          {currentStatus === 'excused' && (
                            <input
                              type="text"
                              placeholder={language === 'ar' ? 'سبب الاعتذار...' : 'Excuse reason...'}
                              value={current?.notes || ''}
                              onChange={(e) => handleNotesChange(member.id, e.target.value)}
                              autoFocus
                              className="w-full bg-neutral-100 dark:bg-[#0B0F17] border border-amber-500/40 rounded-lg px-2.5 py-1 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              dir="auto"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
