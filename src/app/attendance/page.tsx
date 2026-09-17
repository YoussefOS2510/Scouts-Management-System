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
} from 'lucide-react';
import { TeamAttendanceAnalytics } from '../../components/TeamAttendanceAnalytics';

export default function AttendancePage() {
  const { language, t } = useLanguage();
  const { currentUser, currentUnit, isSuperAdmin, can, logAction, accessibleUnits, members, patrols } = useAuth();

  // Tab view: 'roster' (take attendance) or 'analytics' (team attendance analytics)
  const [activeView, setActiveView] = useState<'roster' | 'analytics'>('roster');

  // Roster layout: 'list' (Drive Table Rows) vs 'grid' (Tactile Patrol Cards)
  const [rosterViewMode, setRosterViewMode] = useState<'list' | 'grid'>('list');

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
  const [savedSessions, setSavedSessions] = useState<{ unitId: number; date: string }[]>([
    { unitId: 5, date: '2026-09-01' },
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

  // Batch: Mark All Present
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

  // Toggle status (clicking active status toggles off)
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
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* 1. DRIVE LOCATION PATH & VIEW CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#F0F4F9] dark:border-[#2D2F31]">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-sm text-[#444746] dark:text-[#C4C7C5]">
          <Link href="/" className="hover:text-[#0B57D0] transition-colors">
            {language === 'ar' ? 'منظومة الفوج' : 'Scout Drive'}
          </Link>
          {language === 'ar' ? (
            <ChevronLeft className="w-4 h-4 text-[#747775]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#747775]" />
          )}
          <span className="text-[#1F1F1F] dark:text-[#E3E3E3] font-medium">
            {language === 'ar' ? 'سجل الحضور والانصراف' : 'Attendance Roster'}
          </span>
          {currentUnitObj && (
            <>
              {language === 'ar' ? (
                <ChevronLeft className="w-4 h-4 text-[#747775]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#747775]" />
              )}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#C2E7FF] text-[#001D35] dark:bg-[#004A77] dark:text-[#C2E7FF] font-medium">
                {language === 'ar' ? currentUnitObj.name_ar : currentUnitObj.name_en}
              </span>
            </>
          )}
        </div>

        {/* Tab & View Mode Segmented Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Main View Switcher: Roster vs Analytics */}
          <div className="inline-flex rounded-xl p-1 bg-[#F0F4F9] dark:bg-[#282A2C]">
            <button
              onClick={() => setActiveView('roster')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeView === 'roster'
                  ? 'bg-white dark:bg-[#1F1F1F] text-[#0B57D0] shadow-xs font-semibold'
                  : 'text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F]'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>{t('daily_roster')}</span>
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeView === 'analytics'
                  ? 'bg-white dark:bg-[#1F1F1F] text-[#0B57D0] shadow-xs font-semibold'
                  : 'text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F]'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{t('team_attendance_analytics')}</span>
            </button>
          </div>

          {/* List vs Grid Layout (only in roster tab) */}
          {activeView === 'roster' && (
            <div className="inline-flex rounded-xl p-1 bg-[#F0F4F9] dark:bg-[#282A2C]">
              <button
                onClick={() => setRosterViewMode('list')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  rosterViewMode === 'list'
                    ? 'bg-white dark:bg-[#1F1F1F] text-[#0B57D0] shadow-xs'
                    : 'text-[#444746] hover:text-[#1F1F1F]'
                }`}
                title={language === 'ar' ? 'عرض جدول (Drive List)' : 'Table List View'}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRosterViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  rosterViewMode === 'grid'
                    ? 'bg-white dark:bg-[#1F1F1F] text-[#0B57D0] shadow-xs'
                    : 'text-[#444746] hover:text-[#1F1F1F]'
                }`}
                title={language === 'ar' ? 'عرض بطاقات (Grid)' : 'Card Grid View'}
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
          {/* 2. GOOGLE DRIVE CONTROL TOOLBAR (Unit, Date, Export, Save) */}
          <div className="bg-white dark:bg-[#1E1F20] rounded-2xl p-4 border border-[#E0E3E7] dark:border-[#303134] flex flex-wrap items-center justify-between gap-3 shadow-none">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Unit Dropdown */}
              <div className="flex items-center gap-2 bg-[#F0F4F9] dark:bg-[#282A2C] rounded-xl px-3 py-1.5">
                <Folder className="w-4 h-4 text-[#0B57D0]" />
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(Number(e.target.value))}
                  disabled={!isSuperAdmin && !!currentUnit}
                  className="bg-transparent border-none text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3] focus:outline-none focus:ring-0 cursor-pointer"
                >
                  {accessibleUnits.map((unit) => (
                    <option key={unit.id} value={unit.id} className="dark:bg-[#1E1F20]">
                      {language === 'ar' ? unit.name_ar : unit.name_en}
                    </option>
                  ))}
                </select>
                {!isSuperAdmin && currentUnit && (
                  <span className="text-[10px] text-[#444746] flex items-center gap-0.5">
                    <Lock className="w-3 h-3 text-amber-600" />
                  </span>
                )}
              </div>

              {/* Date Picker */}
              <div className="flex items-center gap-2 bg-[#F0F4F9] dark:bg-[#282A2C] rounded-xl px-3 py-1.5">
                <span className="text-xs text-[#444746] dark:text-[#8E918F]">{t('date')}:</span>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="bg-transparent border-none text-xs font-mono text-[#1F1F1F] dark:text-[#E3E3E3] focus:outline-none focus:ring-0 cursor-pointer"
                />
              </div>
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
                  className="px-3.5 py-2 rounded-xl text-xs font-medium bg-[#F0F4F9] hover:bg-[#E9EEF6] dark:bg-[#282A2C] dark:hover:bg-[#333538] text-[#1F1F1F] dark:text-[#E3E3E3] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#146C2E]" />
                  <span>{language === 'ar' ? 'تصدير إكسيل' : 'Export'}</span>
                </button>
              )}

              <button
                onClick={handleSave}
                disabled={isDuplicateDate}
                className={`px-5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                  isDuplicateDate
                    ? 'bg-[#F0F4F9] dark:bg-[#282A2C] text-[#8E918F] cursor-not-allowed'
                    : 'bg-[#0B57D0] hover:bg-[#0842A0] text-white shadow-xs'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{t('save_session')}</span>
              </button>
            </div>
          </div>

          {/* Duplicate Session Notice if applicable */}
          {isDuplicateDate && (
            <div className="p-3.5 rounded-2xl bg-[#FEF7EC] dark:bg-amber-950/30 border border-[#FFCD85] dark:border-amber-800 text-[#7A3F00] dark:text-amber-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#B06000] shrink-0" />
              <span>{t('duplicate_session_warning')}</span>
            </div>
          )}

          {/* Success Notification */}
          {saveNotification && (
            <div className="p-3.5 rounded-2xl bg-[#E8F0EC] dark:bg-emerald-950/30 border border-[#A8E5B6] text-[#0A5326] dark:text-emerald-300 text-xs flex items-center gap-2 font-medium animate-fadeIn">
              <Check className="w-4 h-4" />
              <span>{saveNotification}</span>
            </div>
          )}

          {/* 3. LOW-PROFILE METRIC CARDS & BATCH CONTROLS */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3.5">
            {/* Batch Controls Pill Card */}
            <div className="bg-white dark:bg-[#1E1F20] rounded-2xl p-4 border border-[#E0E3E7] dark:border-[#303134] flex flex-col justify-between space-y-3">
              <div>
                <div className="text-xs font-medium text-[#444746] dark:text-[#C4C7C5]">
                  {language === 'ar' ? 'إجراءات سريعة' : 'Batch Actions'}
                </div>
                <div className="text-[11px] text-[#747775] mt-0.5">
                  {language === 'ar' ? 'تطبيق على جميع الكشافين بنقرة واحدة' : 'Apply to all unit scouts'}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleMarkAllPresent}
                  className="w-full py-2 px-3 rounded-xl bg-[#E8F0EC] hover:bg-[#D1F2D9] dark:bg-emerald-950/40 text-[#0A5326] dark:text-emerald-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('mark_all_present')}</span>
                </button>
                <button
                  onClick={handleClearAll}
                  className="w-full py-1.5 px-3 rounded-xl bg-[#F0F4F9] hover:bg-[#E9EEF6] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'إعادة ضبط' : 'Clear selection'}</span>
                </button>
              </div>
            </div>

            {/* Present Count */}
            <div className="bg-white dark:bg-[#1E1F20] rounded-2xl p-4 border border-[#E0E3E7] dark:border-[#303134] shadow-none flex flex-col justify-center">
              <div className="text-3xl font-normal text-[#1F1F1F] dark:text-[#E3E3E3] font-mono tabular-nums">
                {stats.present}
              </div>
              <div className="text-xs font-medium text-[#146C2E] dark:text-emerald-400 mt-1">
                {t('present_count')} ({stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%)
              </div>
            </div>

            {/* Absent Count */}
            <div className="bg-white dark:bg-[#1E1F20] rounded-2xl p-4 border border-[#E0E3E7] dark:border-[#303134] shadow-none flex flex-col justify-center">
              <div className="text-3xl font-normal text-[#1F1F1F] dark:text-[#E3E3E3] font-mono tabular-nums">
                {stats.absent}
              </div>
              <div className="text-xs font-medium text-rose-600 dark:text-rose-400 mt-1">
                {t('absent_count')}
              </div>
            </div>

            {/* Excused / Late Count */}
            <div className="bg-white dark:bg-[#1E1F20] rounded-2xl p-4 border border-[#E0E3E7] dark:border-[#303134] shadow-none flex flex-col justify-center">
              <div className="text-3xl font-normal text-[#1F1F1F] dark:text-[#E3E3E3] font-mono tabular-nums">
                {stats.excused} <span className="text-sm font-normal text-[#0B57D0]">+{stats.late}</span>
              </div>
              <div className="text-xs font-medium text-[#B06000] dark:text-amber-400 mt-1">
                {t('excused_count')} / {t('late_count')}
              </div>
            </div>

            {/* Attendance Rate */}
            <div className="bg-white dark:bg-[#1E1F20] rounded-2xl p-4 border border-[#E0E3E7] dark:border-[#303134] shadow-none flex flex-col justify-center">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-normal text-[#1F1F1F] dark:text-[#E3E3E3] font-mono tabular-nums">
                  {stats.rate}%
                </span>
                {stats.unselected > 0 && (
                  <span className="text-[10px] text-[#444746] bg-[#F0F4F9] dark:bg-[#282A2C] px-1.5 py-0.5 rounded-full">
                    {stats.unselected} {language === 'ar' ? 'متبقي' : 'left'}
                  </span>
                )}
              </div>
              <div className="text-xs font-medium text-[#444746] dark:text-[#C4C7C5] mt-1">
                {t('attendance_rate')}
              </div>
            </div>
          </div>

          {/* 4. ROSTER GROUPS (LIST VIEW OR GRID VIEW) */}
          <div className="space-y-4">
            {groupedScouts.map((group, gIdx) => (
              <div
                key={gIdx}
                className="bg-white dark:bg-[#1E1F20] rounded-2xl border border-[#E0E3E7] dark:border-[#303134] overflow-hidden"
              >
                {/* Patrol Header */}
                <div className="px-4 py-2.5 bg-[#F8FAFD] dark:bg-[#282A2C] border-b border-[#F0F4F9] dark:border-[#2D2F31] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#0B57D0]" />
                    <h3 className="font-medium text-sm text-[#1F1F1F] dark:text-[#E3E3E3]">
                      {group.patrolName}
                    </h3>
                    <span className="text-xs text-[#444746] dark:text-[#8E918F]">
                      ({group.members.length} {language === 'ar' ? 'كشاف' : 'scouts'})
                    </span>
                  </div>
                </div>

                {/* VIEW MODE 1: Drive Table List View */}
                {rosterViewMode === 'list' && (
                  <div className="divide-y divide-[#F0F4F9] dark:divide-[#282A2C]">
                    {group.members.map((member) => {
                      const current = records[member.id];
                      const currentStatus = current?.status;

                      return (
                        <div
                          key={member.id}
                          className="h-auto sm:h-14 px-4 py-2.5 hover:bg-[#F8FAFD] dark:hover:bg-[#282A2C]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors"
                        >
                          {/* Member Details */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-full bg-[#E9EEF6] dark:bg-[#303134] text-[#001D35] dark:text-[#C2E7FF] flex items-center justify-center text-xs font-medium shrink-0">
                              {member.full_name_ar?.charAt(0) || 'ك'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                                  {language === 'ar' ? member.full_name_ar : (member.full_name_en || member.full_name_ar)}
                                </span>
                                <span className="text-[11px] font-mono text-[#747775] shrink-0">
                                  {member.member_code}
                                </span>
                              </div>
                              <div className="text-[11px] text-[#747775] truncate">
                                {member.academic_year} &bull; {member.school_or_college || 'سان جورج'}
                              </div>
                            </div>
                          </div>

                          {/* Material Choice Chips for Status */}
                          <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                            {/* Present Choice Chip */}
                            <button
                              onClick={() => handleStatusChange(member.id, 'present')}
                              className={`px-3 py-1 rounded-full text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                                currentStatus === 'present'
                                  ? 'bg-[#D1F2D9] text-[#0A5326] font-medium'
                                  : 'bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] hover:bg-[#E9EEF6]'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{t('status_present')}</span>
                            </button>

                            {/* Absent Choice Chip */}
                            <button
                              onClick={() => handleStatusChange(member.id, 'absent')}
                              className={`px-3 py-1 rounded-full text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                                currentStatus === 'absent'
                                  ? 'bg-[#F9DEDC] text-[#8C1D18] font-medium'
                                  : 'bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] hover:bg-[#E9EEF6]'
                              }`}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{t('status_absent')}</span>
                            </button>

                            {/* Excused Choice Chip */}
                            <button
                              onClick={() => handleStatusChange(member.id, 'excused')}
                              className={`px-3 py-1 rounded-full text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                                currentStatus === 'excused'
                                  ? 'bg-[#D3E3FD] text-[#043372] font-medium'
                                  : 'bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] hover:bg-[#E9EEF6]'
                              }`}
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>{t('status_excused')}</span>
                            </button>

                            {/* Late Choice Chip */}
                            <button
                              onClick={() => handleStatusChange(member.id, 'late')}
                              className={`px-3 py-1 rounded-full text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                                currentStatus === 'late'
                                  ? 'bg-[#FFE2B3] text-[#7A3F00] font-medium'
                                  : 'bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] hover:bg-[#E9EEF6]'
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>{t('status_late')}</span>
                            </button>
                          </div>

                          {/* Excuse Reason Input: Appears ONLY when marked excused */}
                          {currentStatus === 'excused' && (
                            <div className="w-full sm:w-56 animate-fadeIn">
                              <input
                                type="text"
                                placeholder={language === 'ar' ? 'سبب الاعتذار...' : 'Excuse reason...'}
                                value={current?.notes || ''}
                                onChange={(e) => handleNotesChange(member.id, e.target.value)}
                                autoFocus
                                className="w-full bg-[#F0F4F9] dark:bg-[#282A2C] border border-[#C2E7FF] dark:border-[#004A77] rounded-xl px-3 py-1 text-xs text-[#1F1F1F] dark:text-[#E3E3E3] placeholder-[#747775] focus:outline-none focus:ring-1 focus:ring-[#0B57D0]"
                              />
                            </div>
                          )}
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
                          className="p-3.5 rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#E0E3E7] dark:border-[#303134] space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-[#1F1F1F] dark:text-[#E3E3E3] truncate">
                              {language === 'ar' ? member.full_name_ar : (member.full_name_en || member.full_name_ar)}
                            </div>
                            <span className="text-[11px] font-mono text-[#747775]">
                              {member.member_code}
                            </span>
                          </div>

                          {/* Choice chips */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => handleStatusChange(member.id, 'present')}
                              className={`px-2.5 py-1 rounded-full text-xs transition-colors cursor-pointer ${
                                currentStatus === 'present'
                                  ? 'bg-[#D1F2D9] text-[#0A5326] font-medium'
                                  : 'bg-white dark:bg-[#1E1F20] text-[#444746] hover:bg-[#E9EEF6]'
                              }`}
                            >
                              {t('status_present')}
                            </button>
                            <button
                              onClick={() => handleStatusChange(member.id, 'absent')}
                              className={`px-2.5 py-1 rounded-full text-xs transition-colors cursor-pointer ${
                                currentStatus === 'absent'
                                  ? 'bg-[#F9DEDC] text-[#8C1D18] font-medium'
                                  : 'bg-white dark:bg-[#1E1F20] text-[#444746] hover:bg-[#E9EEF6]'
                              }`}
                            >
                              {t('status_absent')}
                            </button>
                            <button
                              onClick={() => handleStatusChange(member.id, 'excused')}
                              className={`px-2.5 py-1 rounded-full text-xs transition-colors cursor-pointer ${
                                currentStatus === 'excused'
                                  ? 'bg-[#D3E3FD] text-[#043372] font-medium'
                                  : 'bg-white dark:bg-[#1E1F20] text-[#444746] hover:bg-[#E9EEF6]'
                              }`}
                            >
                              {t('status_excused')}
                            </button>
                            <button
                              onClick={() => handleStatusChange(member.id, 'late')}
                              className={`px-2.5 py-1 rounded-full text-xs transition-colors cursor-pointer ${
                                currentStatus === 'late'
                                  ? 'bg-[#FFE2B3] text-[#7A3F00] font-medium'
                                  : 'bg-white dark:bg-[#1E1F20] text-[#444746] hover:bg-[#E9EEF6]'
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
                              className="w-full bg-white dark:bg-[#1E1F20] border border-[#C2E7FF] dark:border-[#004A77] rounded-lg px-2.5 py-1 text-xs text-[#1F1F1F] dark:text-[#E3E3E3] focus:outline-none focus:ring-1 focus:ring-[#0B57D0]"
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
